// server/ai/aiWriter/aiWriter.js
require("dotenv").config();
const Groq = require("groq-sdk");
const SYSTEM_PROMPT = require("./aiWriter.system");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const safeJsonParse = (s) => {
  const raw = String(s || "").trim();
  const noFences = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(noFences);
  } catch (e) {
    const first = noFences.indexOf("{");
    const last = noFences.lastIndexOf("}");
    if (first >= 0 && last > first)
      return JSON.parse(noFences.slice(first, last + 1));
    throw e;
  }
};

const normalizeOut = (out) => ({
  title: String(out?.title || "").trim(),
  text: String(out?.text || "")
    .replace(/\s+/g, " ")
    .trim(),
  summary: String(out?.summary || "")
    .replace(/\s+/g, " ")
    .trim(),
});

const meetsText = (out) => out.text && out.text.length >= 800;
const meetsSummary = (out) =>
  out.summary && out.summary.length >= 500 && out.summary.length <= 600;

const fixSummary = async ({
  rewrittenTitle,
  rewrittenText,
  currentSummary,
}) => {
  const currentLen = String(currentSummary || "").length;

  const prompt = `
You must produce a summary for the article below.

HARD CONSTRAINT:
- Summary length MUST be between 540 and 580 characters (inclusive).
- Output must be ONE line (no raw line breaks).
- Use ONLY facts from the rewritten text. No new facts, no opinions.

If the current summary is too short, expand by adding more factual detail already present in the rewritten text.
If it's too long, compress while keeping key facts.

Current summary length: ${currentLen}

Return ONLY JSON:
{"summary":"..."}

REWRITTEN TITLE:
${rewrittenTitle}

REWRITTEN TEXT:
${rewrittenText}

CURRENT SUMMARY (for reference):
${String(currentSummary || "")}
`.trim();

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "Return ONLY valid JSON. No markdown. No extra keys.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_completion_tokens: 400,
    response_format: { type: "json_object" },
  });

  const out = safeJsonParse(res.choices?.[0]?.message?.content || "{}");
  return String(out.summary || "")
    .replace(/\s+/g, " ")
    .trim();
};

const aiWriter = async (article) => {
  if (!process.env.GROQ_API_KEY)
    throw new Error("Missing GROQ_API_KEY in .env");

  const inTitle = String(article?.title || "").trim();
  const inText = String(article?.text || "").trim();
  if (!inTitle) throw new Error("article.title is required");
  if (!inText) throw new Error("article.text is required");

  const userPrompt = `
Input article:
TITLE: ${inTitle}
TEXT: ${inText}

Return ONLY JSON:
{"title":"...","text":"...","summary":"..."}
`.trim();

  // pass 1
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_completion_tokens: 1600,
    response_format: { type: "json_object" },
  });

  let out = normalizeOut(safeJsonParse(res.choices?.[0]?.message?.content));

  // pass 2 (full fix if text too short OR summary way off)
  if (!meetsText(out) || !out.summary) {
    const fix = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
        {
          role: "user",
          content:
            'Fix output WITHOUT adding facts. Ensure: text >= 800 chars, summary 500-600 chars. Return ONLY JSON: {"title":"...","text":"...","summary":"..."}',
        },
      ],
      temperature: 0.3,
      max_completion_tokens: 1800,
      response_format: { type: "json_object" },
    });

    out = normalizeOut(safeJsonParse(fix.choices?.[0]?.message?.content));
  }

  // pass 3 (summary-only repair loop)
  if (meetsText(out) && !meetsSummary(out)) {
    for (let i = 0; i < 6; i++) {
      out.summary = await fixSummary({
        rewrittenTitle: out.title,
        rewrittenText: out.text,
        currentSummary: out.summary,
      });

      if (meetsSummary(out)) break;
    }
  }

  if (!out.title || !meetsText(out) || !meetsSummary(out)) {
    throw new Error(
      `aiWriter failed constraints: text=${out.text?.length || 0}, summary=${
        out.summary?.length || 0
      }`
    );
  }

  return out;
};

module.exports = aiWriter;
