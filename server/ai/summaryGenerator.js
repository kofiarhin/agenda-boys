// server/utils/summaryGenerator.js
const Groq = require("groq-sdk");

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const compact = (s = "") =>
  String(s || "")
    .replace(/\s+/g, " ")
    .trim();

const SYSTEM_PROMPT = compact(
  "You are an AI writer who summarizes news articles in a neutral, formal, factual tone. Write a single-paragraph summary between 500 and 700 characters (inclusive). Avoid sensational language. Output ONLY the summary text."
);

const clampChars = (s = "", max = 700) => {
  const t = compact(s);
  if (t.length <= max) return t;
  return t
    .slice(0, max)
    .replace(/\s+\S*$/, "")
    .trim();
};

const within = (s = "", min = 500, max = 700) =>
  s.length >= min && s.length <= max;

const buildClient = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY missing in .env");
  return new Groq({ apiKey: key });
};

const summaryGenerator = async (
  article,
  { temperature = 0.2, maxTokens = 320 } = {}
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

  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: baseMessages,
    max_tokens: maxTokens,
    temperature,
  });

  let out = compact(res?.choices?.[0]?.message?.content || "");

  if (out.length > 700) return clampChars(out, 700);

  if (!within(out, 500, 700)) {
    const res2 = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        ...baseMessages,
        { role: "assistant", content: out },
        {
          role: "user",
          content:
            "Rewrite to be 500–700 characters. Keep neutral, formal, factual. Output ONLY the summary.",
        },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    out = compact(res2?.choices?.[0]?.message?.content || "");
    if (out.length > 700) return clampChars(out, 700);
  }

  return out;
};

module.exports = summaryGenerator;
