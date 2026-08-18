# Deployment Checklist

For Scott — steps to get the Week 5 lab site live before students touch it, and what to
repeat each quarter. Follow in order; each service produces a value the next step needs.

## 1. OpenRouter (LLM access)

1. Create an account at https://openrouter.ai.
2. Add credit — **$15–20 is plenty** for a class-sized run (the design assumes a full
   legit lab session is ~40–60 messages per student; see `docs/plans/2026-08-17-week5-lab-site-design.md` §5 for the abuse-limit math).
3. **Set a hard spend cap** in the OpenRouter dashboard (Settings → Limits). This is the
   real backstop — if it's exhausted, chat returns a friendly "out of credits, contact
   your instructor" error instead of a surprise bill.
4. Create an API key (Settings → Keys). Copy it — this is `OPENROUTER_API_KEY`.
5. Before go-live, re-verify the four model IDs in `src/data/models.js` are still current
   against https://openrouter.ai/models. Model lineups change; a quarter-old ID may 404.

## 2. Resend (email)

1. Create an account at https://resend.com.
2. Verify a sender. The **onboarding domain (`onboarding@resend.dev`) is fine to start**
   — no custom domain/DNS setup required. (The code sends from
   `MHI 289A Week 5 Lab <onboarding@resend.dev>`; if you later verify your own domain,
   update the `from` address in `api/email.js` and `api/status.js`.)
3. Create an API key. Copy it — this is `RESEND_API_KEY`.
4. Note the free tier: **100 emails/day**. The site self-limits to 5 emails/IP/day
   (`MAX_EMAILS_PER_DAY` in `api/_lib/limits.js`), so a full class submitting on the
   same day should stay well under the Resend cap, but it's worth knowing if submissions
   cluster right before a deadline.

## 3. Upstash (rate-limit counters)

1. Create a free account at https://upstash.com.
2. Create a Redis database (any region close to your Vercel deployment region is fine —
   the free tier is generous for this traffic level).
3. From the database's REST API panel, copy the **REST URL** and **REST token** — these
   are `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
   - If these are ever left unset, the site still works — rate limiting just fails open
     (no quantity limits enforced). Don't rely on this for a real class run; it's a
     local-dev convenience, not a substitute for setting them in production.

## 4. Vercel (hosting)

1. Import the GitHub repo as a new Vercel project.
2. Set these environment variables (Project Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `OPENROUTER_API_KEY` | from step 1 |
   | `CLASS_PASSCODE` | pick a shared passcode for the class |
   | `RESEND_API_KEY` | from step 2 |
   | `INSTRUCTOR_EMAIL` | where submission copies and low-balance alerts go |
   | `ALERT_THRESHOLD_USD` | `5` (or your preference — alert fires when remaining OpenRouter balance drops below this) |
   | `CRON_SECRET` | any long random string (e.g. `openssl rand -hex 32`) — Vercel sends this automatically as a bearer token when it triggers the daily cron |
   | `UPSTASH_REDIS_REST_URL` | from step 3 |
   | `UPSTASH_REDIS_REST_TOKEN` | from step 3 |

3. Deploy.
4. Confirm the cron job appears under Project Settings → Cron Jobs — it should show
   `/api/status` on schedule `0 15 * * *` (15:00 UTC ≈ 8am Pacific, daily balance check).

## 5. Smoke test production

Before pointing students at the URL, walk through it yourself end-to-end:

- [ ] Landing page loads; a **wrong** passcode is rejected inline; the **real** passcode
      gets you into the hub.
- [ ] Send one real message to each of the four models (Lab 1 is a natural place to do
      this) — confirm streaming works and each model actually replies.
- [ ] Download the PDF from the Finish screen; open it; confirm the transcript and
      reflections you just entered are in it, with formatting preserved (bold/lists/etc.
      if you used any).
- [ ] Email a copy to yourself; confirm it arrives with the PDF attached.
- [ ] Visit `<your-url>#instructor`, enter the passcode, confirm it shows a real
      credits/remaining balance from OpenRouter.
- [ ] Download a backup from the hub, then restore it (even in the same session) —
      confirm the state comes back correctly.

If all of that passes, the site is ready for students.

## 6. Quarterly rotation

Each quarter before the class runs again:

- [ ] Rotate `CLASS_PASSCODE` (old cohorts' passcode has likely leaked by now — that's
      expected and fine, see the design doc's abuse-limits section; just don't keep
      reusing the same one indefinitely).
- [ ] Top up the OpenRouter budget and re-confirm the hard spend cap is still set.
- [ ] Re-verify the four model IDs in `src/data/models.js` against
      https://openrouter.ai/models — providers deprecate and rename models.

## 7. Separately: revoke the old Gemini key

The Jupyter notebook this site replaces shipped a **plaintext Gemini API key** in its
setup cell. That notebook is being retired by this project, but the key itself needs to
be revoked independently in Google AI Studio — this site doesn't do that for you, and
it's not blocking on any of the steps above. Do this regardless of deployment timing.
