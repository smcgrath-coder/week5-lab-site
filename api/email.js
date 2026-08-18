import { MAX_EMAILS_PER_DAY } from "./_lib/limits.js";
import { checkAndIncrement } from "./_lib/rateLimit.js";
import { validateEmailRequest } from "./_lib/validateEmail.js";

function slugify(name) {
  const slug = (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "student";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const env = process.env;
  const body = req.body ?? {};

  const validation = validateEmailRequest(body, env);
  if (!validation.ok) {
    res.status(validation.status).json({ error: validation.error });
    return;
  }

  const ip = (req.headers["x-forwarded-for"]?.split(",")[0] || "unknown").trim();
  const rate = await checkAndIncrement("email", ip, MAX_EMAILS_PER_DAY, env);
  if (!rate.allowed) {
    res.status(429).json({
      error: "Daily email limit reached. If you hit this doing the assignment, contact your instructor.",
    });
    return;
  }

  const studentName = body.studentName || "Student";
  const timestamp = new Date().toISOString();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Resend's onboarding domain — see docs/DEPLOY.md ("verify sender").
        from: "MHI 289A Week 5 Lab <onboarding@resend.dev>",
        to: env.INSTRUCTOR_EMAIL,
        subject: `MHI 289A Week 5 submission: ${studentName}`,
        text: `Submitted ${timestamp}.\n\nStudent: ${studentName}`,
        attachments: [
          {
            filename: `week5-lab-${slugify(studentName)}.pdf`,
            content: body.pdfBase64,
          },
        ],
      }),
    });

    if (!response.ok) {
      res.status(502).json({ error: "Email failed to send. Download the PDF and submit it on Canvas instead." });
      return;
    }

    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ error: "Email failed to send. Download the PDF and submit it on Canvas instead." });
  }
}
