import { MAX_MESSAGES_PER_DAY, MAX_OUTPUT_TOKENS } from "./_lib/limits.js";
import { checkAndIncrement } from "./_lib/rateLimit.js";
import { validateChatRequest } from "./_lib/validate.js";

export const config = { runtime: "edge" };

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const env = process.env;
  const k = env.OPENROUTER_API_KEY || "";
  console.error(
    "DIAG key checks: len=",
    k.length,
    "trimmedLen=",
    k.trim().length,
    "startsWithQuote=",
    k.startsWith('"'),
    "endsWithQuote=",
    k.endsWith('"'),
    "hasNewline=",
    /[\r\n]/.test(k)
  );

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body?.ping === true) {
    if (body?.passcode !== env.CLASS_PASSCODE) {
      return json({ error: "That passcode isn't right. Check with your instructor." }, 401);
    }
    return json({ ok: true }, 200);
  }

  const validation = validateChatRequest(body, env);
  if (!validation.ok) {
    return json({ error: validation.error }, validation.status);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = await checkAndIncrement("chat", ip, MAX_MESSAGES_PER_DAY, env);
  if (!rate.allowed) {
    return json(
      { error: "Daily message limit reached. If you hit this doing the assignment, contact your instructor." },
      429
    );
  }

  const origin = new URL(request.url).origin;
  let upstream;
  try {
    upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "MHI 289A Week 5 Lab",
      },
      body: JSON.stringify({
        model: body.model,
        messages: body.messages,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: true,
      }),
    });
  } catch {
    return json(
      { error: "The AI service is unavailable or out of credits. Contact your instructor." },
      502
    );
  }

  if (!upstream.ok) {
    const bodyText = await upstream.text().catch(() => "");
    console.error("OpenRouter upstream error", upstream.status, bodyText);
    return json(
      { error: "The AI service is unavailable or out of credits. Contact your instructor." },
      502
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
    },
  });
}
