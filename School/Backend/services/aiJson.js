// Small Gemini helpers: geminiJson returns a parsed JSON object (moderation, drafting),
// geminiText returns plain text (AI answers). They share the model fallback and the timeout.
// The chat assistant keeps its own caller in controllers/Chat.js.

const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-flash-lite-latest"];

let discoveredModel = "";

const clean = (name = "") => String(name).replace(/^models\//, "").trim();

/** Gemini's address. GEMINI_BASE_URL points it elsewhere, e.g. at a local stub in tests. */
export const geminiBaseUrl = () =>
  (process.env.GEMINI_BASE_URL || "").trim().replace(/\/+$/, "") || "https://generativelanguage.googleapis.com";

const base = () => `${geminiBaseUrl()}/v1beta`;

export const aiConfigured = () => Boolean((process.env.GEMINI_API_KEY || "").trim());

/**
 * Makes user text safe to place between our own <tag> delimiters in a prompt. Every angle
 * bracket (and its full-width forms) becomes a look-alike, so the text can never contain a
 * tag at all, however it is spelled. A single pass that removed known tags missed variants.
 */
export const promptData = (text) =>
  String(text ?? "")
    .replace(/[<\uFF1C\uFE64]/g, "\u2039")
    .replace(/[>\uFF1E\uFE65]/g, "\u203A");

async function discoverModel(apiKey, signal) {
  const response = await fetch(`${base()}/models?key=${apiKey}`, { signal });
  if (!response.ok) return "";
  const data = await response.json();
  const usable = (data?.models || [])
    .filter((m) => m?.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => clean(m.name));
  return usable.find((name) => name.includes("flash")) || usable[0] || "";
}

async function callModel({ apiKey, model, system, prompt, maxOutputTokens, temperature, json, signal }) {
  const generationConfig = { temperature, maxOutputTokens };
  if (json) generationConfig.responseMimeType = "application/json";
  const response = await fetch(`${base()}/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });
  const data = await response.json().catch(() => ({}));
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!response.ok || !text) {
    const error = new Error(data?.error?.message || `Gemini request failed for ${model}`);
    error.status = response.status;
    throw error;
  }
  // A reply that does not parse counts as a failed model, so the next one is tried.
  return json ? JSON.parse(text) : String(text).trim();
}

// Tries the configured model, the last one that worked and a few known ones, then asks
// Gemini which models exist. Everything shares one deadline.
async function generate({ system, prompt, maxOutputTokens, temperature, timeoutMs, json }) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const tried = new Set();
    let lastError = null;
    const attempt = async (model) => {
      const name = clean(model);
      if (!name || tried.has(name)) return undefined;
      tried.add(name);
      try {
        const result = await callModel({
          apiKey,
          model: name,
          system,
          prompt,
          maxOutputTokens,
          temperature,
          json,
          signal: controller.signal,
        });
        if (!json && !result) throw new Error(`Gemini returned no text for ${name}`);
        return result;
      } catch (error) {
        lastError = error;
        return undefined;
      }
    };

    for (const model of [process.env.GEMINI_MODEL, discoveredModel, ...FALLBACK_MODELS]) {
      const result = await attempt(model);
      if (result !== undefined) return result;
      if (controller.signal.aborted) break;
    }
    if (!controller.signal.aborted) {
      discoveredModel = await discoverModel(apiKey, controller.signal).catch(() => "");
      const result = await attempt(discoveredModel);
      if (result !== undefined) return result;
    }
    throw lastError || new Error("Gemini request failed");
  } finally {
    clearTimeout(timer);
  }
}

/** Ask Gemini for a JSON object. Throws when no model answers in time. */
export const geminiJson = ({ system, prompt, maxOutputTokens = 600, timeoutMs = 6000 }) =>
  generate({ system, prompt, maxOutputTokens, temperature: 0, timeoutMs, json: true });

/** Ask Gemini for plain text. Throws when no model answers in time. */
export const geminiText = ({ system, prompt, maxOutputTokens = 700, timeoutMs = 15000, temperature = 0.3 }) =>
  generate({ system, prompt, maxOutputTokens, temperature, timeoutMs, json: false });
