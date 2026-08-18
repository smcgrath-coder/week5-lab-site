import { MAX_MESSAGE_CHARS, MAX_TURNS_PER_CONVERSATION } from "./limits.js";
import { MODEL_IDS } from "../../src/data/models.js";

export function validateChatRequest(body, env) {
  if (body?.passcode !== env.CLASS_PASSCODE) {
    return { ok: false, status: 401, error: "That passcode isn't right. Check with your instructor." };
  }

  if (!MODEL_IDS.includes(body?.model)) {
    return { ok: false, status: 400, error: "Unknown model." };
  }

  const { messages } = body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, status: 400, error: "messages must be a non-empty array." };
  }
  const VALID_ROLES = new Set(["user", "assistant", "system"]);
  for (const message of messages) {
    if (!VALID_ROLES.has(message?.role) || typeof message?.content !== "string") {
      return {
        ok: false,
        status: 400,
        error: "Each message needs a role of user/assistant/system and string content.",
      };
    }
  }

  if (messages.length > MAX_TURNS_PER_CONVERSATION) {
    return { ok: false, status: 429, error: "This conversation is long. Start a new one" };
  }

  for (const message of messages) {
    if (message.content.length > MAX_MESSAGE_CHARS) {
      return { ok: false, status: 413, error: "One of your messages is too long." };
    }
  }

  return { ok: true };
}
