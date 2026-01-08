// server/utils/summaryGenerator.js
const Groq = require("groq-sdk");

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const MIN_CHARS = 700;
const MAX_CHARS = 800;

const compact = (s = "") =>
  String(s || "")
    .replace(/\s+/g, " ")
    .trim();

const SYSTEM_PROMPT = compact(
  "You are a news summarization assistant. Summarize ONLY the information explicitly contained in the provided title and article text—do not add background, context, or assumptions. Write EXACTLY one paragraph in a neutral, formal, factual tone, avoiding sensational or emotive language. Include the core details (who/what/where/when) plus the most important outcome and key numbers/dates if present. Attribute claims, allegations, forecasts, or disputed points using careful phrasing (e.g., “according to…”, “authorities said…”, “the company stated…”). Do not quote directly unless the article contains a short decisive statement that is essential; otherwise paraphrase. No opinions, no analysis, no recommendations, no first-person. Output MUST be 700–800 characters (including spaces) and contain no headings, bullets, labels, emojis, hashtags, or extra text—return ONLY the summary paragraph with no leading/trailing whitespace or newlines."
);

const clampChars = (s = "", max = MAX_CHARS) => {
  const t = compact(s);
  if (t.length <= max) return t;
  return t
    .slice(0, max)
    .replace(/\s+\S*$/, "")
    .trim();
};

const within = (s = "", min = MIN_CHARS, max = MAX_CHARS) =>
  s.length >= min && s.length <= max;

const buildClient = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY missing in .env");
  return new Groq({ apiKey: key });
};

const summaryGenerator = async (
  article,
  { temperature = 0.2, maxTokens = 380 } = {}
) => {
  if (!article?.title) throw new Error("article.title required");
  if (!article?.text) throw new Error("article.text required");

  const groq = buildClient();

  const title = compact(article.title);
  const text = compact(article.text);

  const baseMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: compact(`Title: ${title}\nText: ${text}`) },
  ];

  const run = async (messages) => {
    const res = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    });
    return compact(res?.choices?.[0]?.message?.content || "");
  };

  let out = await run(baseMessages);

  if (out.length > MAX_CHARS) return clampChars(out, MAX_CHARS);

  if (!within(out, MIN_CHARS, MAX_CHARS)) {
    out = await run([
      ...baseMessages,
      { role: "assistant", content: out },
      {
        role: "user",
        content:
          "Rewrite to be 700–800 characters (inclusive). Keep neutral, formal, factual. Output ONLY the summary paragraph with no extra text.",
      },
    ]);

    if (out.length > MAX_CHARS) return clampChars(out, MAX_CHARS);
  }

  return out;
};

module.exports = summaryGenerator;
