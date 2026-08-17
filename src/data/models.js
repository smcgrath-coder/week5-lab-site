// OpenRouter model IDs verified live against https://openrouter.ai/api/v1/models
// on 2026-08-17. Re-verify each quarter — see docs/DEPLOY.md.
export const MODELS = [
  {
    id: "gemini-flash",
    label: "Gemini Flash",
    openrouterId: "google/gemini-3.6-flash",
  },
  {
    id: "claude-haiku",
    label: "Claude Haiku",
    openrouterId: "anthropic/claude-haiku-4.5",
  },
  {
    id: "gpt-mini",
    label: "GPT-5 Mini",
    openrouterId: "openai/gpt-5-mini",
  },
  {
    id: "llama",
    label: "Llama 3.3 70B",
    openrouterId: "meta-llama/llama-3.3-70b-instruct",
  },
];

export const MODEL_IDS = MODELS.map((m) => m.openrouterId);
