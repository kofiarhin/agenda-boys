// /server/ai/summaryGenerator.js
// Robust Hugging Face Inference Providers summary generator (CommonJS)

const {
  InferenceClient,
  InferenceClientProviderApiError,
  InferenceClientHubApiError,
} = require("@huggingface/inference");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getErrStatus = (err) => err?.response?.status ?? err?.status ?? null;

const getErrBody = (err) => {
  const body = err?.response?.body;
  if (!body) return null;
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
};

const isRetryable = (status) =>
  [408, 409, 425, 429, 500, 502, 503, 504].includes(status);

const withRetry = async (fn, attempts = 4) => {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = getErrStatus(err);
      if (!isRetryable(status) || i === attempts - 1) throw err;
      await sleep(600 * Math.pow(2, i));
    }
  }
  throw lastErr;
};

const chunkText = (text, maxChars = 9000) => {
  const clean = String(text || "").trim();
  if (!clean) return [];

  if (clean.length <= maxChars) return [clean];

  // split on paragraph boundaries first, then hard split if needed
  const parts = clean
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let buf = "";

  const pushBuf = () => {
    const b = buf.trim();
    if (b) chunks.push(b);
    buf = "";
  };

  for (const p of parts) {
    if ((buf + "\n\n" + p).length <= maxChars) {
      buf = buf ? `${buf}\n\n${p}` : p;
      continue;
    }

    pushBuf();

    if (p.length <= maxChars) {
      chunks.push(p);
      continue;
    }

    // hard split long paragraphs
    let start = 0;
    while (start < p.length) {
      chunks.push(p.slice(start, start + maxChars));
      start += maxChars;
    }
  }

  pushBuf();
  return chunks;
};

const pickTextFromPayload = (payload) => {
  if (typeof payload === "string") return payload;

  // support common shapes: { text }, { content }, { transcript }, { body: { text } }
  return (
    payload?.text ??
    payload?.content ??
    payload?.transcript ??
    payload?.input ??
    payload?.body?.text ??
    payload?.body?.content ??
    payload?.body?.transcript ??
    ""
  );
};

const normalizeSummaryFromResponse = (res) => {
  const content = res?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  return "";
};

const buildClient = () => {
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN;
  if (!token) {
    throw new Error(
      "HF_TOKEN is missing. Add HF_TOKEN to your .env and restart the server."
    );
  }
  return new InferenceClient(token);
};

const chatOnce = async (
  hf,
  { provider, model, messages, maxTokens, temperature }
) => {
  const req = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  };

  // only pass provider if set (some setups break with an invalid/unsupported provider)
  if (provider) req.provider = provider;

  const res = await hf.chatCompletion(req);
  return res;
};

const summarizeOne = async (
  hf,
  { text, provider, model, maxTokens, temperature }
) => {
  const messages = [
    {
      role: "system",
      content:
        "You are a precise summarizer. Return a clear summary with 5-8 bullet points, then a 1-sentence takeaway. Keep it factual and concise.",
    },
    {
      role: "user",
      content: `Summarize this:\n\n${text}`,
    },
  ];

  // try configured provider/model first, then fallback by removing provider if provider call fails
  try {
    const res = await withRetry(
      () => chatOnce(hf, { provider, model, messages, maxTokens, temperature }),
      4
    );
    return normalizeSummaryFromResponse(res);
  } catch (err) {
    const status = getErrStatus(err);

    // fallback: retry without provider for provider-side failures / bad combos
    const providerFail =
      err instanceof InferenceClientProviderApiError ||
      (status && [400, 404, 409, 422, 500, 502, 503, 504].includes(status));

    if (!provider || !providerFail) throw err;

    const res2 = await withRetry(
      () =>
        chatOnce(hf, {
          provider: null,
          model,
          messages,
          maxTokens,
          temperature,
        }),
      4
    );
    return normalizeSummaryFromResponse(res2);
  }
};

const summaryGenerator = async (payload = {}) => {
  const hf = buildClient();

  const provider =
    (payload?.provider ?? process.env.HF_PROVIDER ?? "").trim() || null;
  const model = (payload?.model ?? process.env.HF_MODEL ?? "").trim();
  if (!model) {
    throw new Error(
      "HF_MODEL is missing. Add HF_MODEL to your .env (e.g. google/gemma-2-2b-it)."
    );
  }

  const temperature =
    typeof payload?.temperature === "number" ? payload.temperature : 0.2;

  const maxTokens =
    typeof payload?.maxTokens === "number"
      ? payload.maxTokens
      : typeof payload?.max_tokens === "number"
      ? payload.max_tokens
      : 512;

  const debug = !!payload?.debug;

  const rawText = pickTextFromPayload(payload);
  const chunks = chunkText(rawText, 9000);

  if (!chunks.length) {
    return debug ? { summary: "", meta: { chunks: 0 } } : "";
  }

  const summaries = [];
  try {
    // map
    for (let i = 0; i < chunks.length; i++) {
      const s = await summarizeOne(hf, {
        text: chunks[i],
        provider,
        model,
        maxTokens,
        temperature,
      });
      summaries.push(s || "");
    }

    if (summaries.length === 1) {
      const out = (summaries[0] || "").trim();
      return debug ? { summary: out, meta: { chunks: 1 } } : out;
    }

    // reduce
    const combined = summaries.filter(Boolean).join("\n\n");
    const final = await summarizeOne(hf, {
      text: `Combine these partial summaries into one cohesive final summary:\n\n${combined}`,
      provider,
      model,
      maxTokens,
      temperature,
    });

    const out = (final || "").trim();
    return debug ? { summary: out, meta: { chunks: chunks.length } } : out;
  } catch (err) {
    const status = getErrStatus(err);
    const body = getErrBody(err);

    // log the real provider response
    console.error("HF inference error:", {
      message: err?.message,
      status,
      body,
      provider,
      model,
    });

    // surface a clean error upstream
    const clean = new Error(
      `HF inference failed${status ? ` (HTTP ${status})` : ""}. ${
        body ? `Details: ${body}` : ""
      }`
    );
    clean.status = status || 500;
    throw clean;
  }
};

module.exports = summaryGenerator;
