async function fetchCredits(env) {
  const response = await fetch("https://openrouter.ai/api/v1/credits", {
    headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
  });
  if (!response.ok) {
    throw new Error(`OpenRouter credits request failed: ${response.status}`);
  }
  const body = await response.json();
  const totalCredits = body?.data?.total_credits ?? 0;
  const totalUsage = body?.data?.total_usage ?? 0;
  return { totalCredits, totalUsage, remaining: totalCredits - totalUsage };
}

async function sendLowBalanceAlert(remaining, threshold, env) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MHI 289A Week 5 Lab <onboarding@resend.dev>",
      to: env.INSTRUCTOR_EMAIL,
      subject: `Week 5 lab site balance low: $${remaining.toFixed(2)} remaining`,
      text: `The OpenRouter balance for the Week 5 lab site is below the alert threshold ($${threshold.toFixed(2)}). Remaining: $${remaining.toFixed(2)}.`,
    }),
  });
}

async function handleInstructorMode(req, res, env) {
  const body = req.body ?? {};
  if (body.passcode !== env.CLASS_PASSCODE) {
    res.status(401).json({ error: "That passcode isn't right. Check with your instructor." });
    return;
  }
  try {
    const credits = await fetchCredits(env);
    res.status(200).json(credits);
  } catch {
    res.status(502).json({ error: "Couldn't reach OpenRouter to check the balance." });
  }
}

async function handleCronMode(req, res, env) {
  const authHeader = req.headers.authorization || "";
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const credits = await fetchCredits(env);
    const threshold = Number(env.ALERT_THRESHOLD_USD ?? 5);
    let alerted = false;
    if (credits.remaining < threshold) {
      await sendLowBalanceAlert(credits.remaining, threshold, env);
      alerted = true;
    }
    res.status(200).json({ remaining: credits.remaining, alerted });
  } catch {
    res.status(502).json({ error: "Couldn't reach OpenRouter to check the balance." });
  }
}

export default async function handler(req, res) {
  const env = process.env;
  if (req.method === "POST") {
    await handleInstructorMode(req, res, env);
    return;
  }
  if (req.method === "GET") {
    await handleCronMode(req, res, env);
    return;
  }
  res.status(405).json({ error: "Method not allowed" });
}
