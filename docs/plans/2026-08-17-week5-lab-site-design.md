# Week 5 Lab Site — Design Document

**Project:** Web-based replacement for the MHI 289A Week 5 Jupyter lab notebook
("Working With AI: Prompting, Breaking, and Grounding" — UC Davis School of
Medicine, Summer 2026).

**Date:** 2026-08-17
**Author:** Scott McGrath (design session with Claude)
**Intended implementer:** Claude Code running Sonnet 5, following the companion
implementation plan.

---

## 1. Context and goals

The current assignment is a Jupyter notebook: students edit Python cells to send
prompts to Gemini, then fill in markdown reflection cells. The students are
clinical/health-informatics students with little coding exposure; the notebook
mechanics (cells, kernels, API keys) are friction that distracts from the actual
learning goals.

**The site replaces the notebook entirely.** Students work through the same four
labs in a guided web experience: type prompts into a chat box, read live model
responses, and fill in reflection fields as they go. At the end they download a
PDF record of everything (prompts, full transcripts, reflections) to upload to
Canvas, with an option to also email a copy to the instructor.

**Non-goals (out of scope):**
- Canvas LTI integration (requires institutional approval; possible phase 2).
- Student accounts or server-side storage of student work.
- Content moderation of prompts (Lab 3 requires adversarial prompting).
- Grading tooling.

**Source material** (content to embed in the site — see §6):
- `Week5_Lab_Notebook.docx` — all lab instructions and reflection prompts.
- `Week5_Case_Pack.docx` — six fictional source items (C1–C3 clinical,
  O1–O3 operational).

---

## 2. Decisions already made

| Decision | Choice |
|---|---|
| Structure | Guided lab wizard (sequential steps, progress bar) |
| Hosting | Vercel — static frontend + serverless functions, one project |
| Stack | React + Vite (matches Scott's other projects) |
| LLM access | Serverless proxy holding **one OpenRouter key**; hard spend cap (~$15–20) set in OpenRouter dashboard |
| Models offered | 4: Gemini Flash, Claude Haiku, a GPT mini model, one open-weight model (Llama or Qwen). Implementer verifies current OpenRouter model IDs at build time |
| Access control | Shared class passcode (env var), rotated each quarter |
| Submission | Client-generated PDF: download button + "Email a copy to my instructor" (Resend) |
| Persistence | localStorage autosave only; downloadable/restorable JSON backup |
| Balance monitoring | Instructor status page + daily cron email alert below threshold |
| Abuse limits | Quantity-only limits (see §8); no content restrictions |

---

## 3. Student experience

### 3.1 Landing page
- Course header: *MHI 289A • Week 5 Lab • Working With AI: Prompting, Breaking,
  and Grounding*.
- Short "how this works" intro adapted from the notebook's "How to use this
  notebook" section, including the grading philosophy ("the failures are the
  assignment" — honesty and depth over clean successes).
- Inputs: **student name**, **lane** (Clinical / Operational — a default,
  switchable per-task later), **class passcode**.
- **PHI warning** as a prominent must-acknowledge checkbox: *never put real
  patient information or PHI into any of these tools; use the fictional cases
  provided or material you write yourself.* A one-line version of this reminder
  stays pinned near every prompt box throughout the site.
- Passcode is validated against the server on entry (a lightweight check call),
  so students discover a bad passcode immediately, not at their first prompt.

### 3.2 Lab hub
- Overview of the five stops: Lab 1, Lab 2 (three sub-tasks), Lab 3, Lab 4,
  Wrap-Up — with per-stop completion status derived from the state object.
- Default flow is sequential ("Continue" takes you to the next incomplete
  step) but free navigation is allowed.
- Autosave indicator; "Download backup / Restore backup" (the state JSON as a
  file) for shared computers or cleared browsers.

### 3.3 Shared lab-screen anatomy
Each lab screen contains:
1. **Instructions** — the notebook prose for that lab, lightly adapted for web.
2. **Chat panel** — multi-turn conversation with:
   - Model picker (the four models; selection recorded per conversation).
   - Streaming responses rendered as markdown.
   - "New conversation" where the lab calls for a fresh run.
   - **"Insert this case"** buttons where a task uses the case pack, filtered
     by the student's lane, dropping the full case text into the prompt box.
   - The pinned one-line PHI reminder.
3. **Reflection fields** — the notebook's exact reflection prompts, directly
   below the chat. Auto-expanding textareas.

Every conversation is recorded in full (all turns, model name, timestamps) in
the state object; transcripts appear complete in the PDF.

### 3.4 Per-lab specifics

**Lab 1 — Prompt Engineering Fundamentals**
- Pick one of the four task options (2 clinical, 2 operational).
- Version A: fresh chat, throwaway prompt.
- Version B: second fresh chat, structured prompt; student tags which
  technique(s) they used (role / step-by-step reasoning / worked example /
  refining across turns). Multi-turn chat makes the refinement technique
  genuinely possible (it wasn't in the notebook).
- Reflection: "What actually changed between the two?" — flagged in the UI as
  the graded part of Lab 1.

**Lab 2 — Applied Task Labs** (three sub-tasks, shown as tabs or sub-steps)
- **2A** (reading level): lane choice, chat, reflection ("what I noticed —
  accuracy, reading level, anything off"). Case items: C2 (clinical) / O2
  (operational).
- **2B** (source → structured summary): lane choice, case-insert buttons for
  C1 / O1, chat, reflection ("did anything appear that wasn't in my source?").
- **2C** (synthesis, same for everyone): case-insert for C3 / O3 (both
  available regardless of lane), chat, reflection ("check the citations
  carefully").

**Lab 3 — Break It on Purpose** (the core of the week)
- Student creates "failure attempts." Each attempt: pick a target failure
  category (confident wrong answer / fabricated citation / biased completion /
  self-contradiction across turns), then a free-form multi-turn chat to induce
  it.
- Each attempt has three documentation fields: what I was trying to make it
  do + prompts used / what it produced / **how I caught it** (emphasized —
  the notebook calls this the skill the course builds toward).
- Minimum two attempts from *different* categories (UI enforces the category
  difference softly — warns, doesn't block). "Add another failure" button.
- Optional field: "a failure that almost got past you."

**Lab 4 — Grounding and Its Limits**
- Field for "the task, and the source text I used for the grounded run."
- Ungrounded run (fresh chat), then grounded run (fresh chat; case-insert or
  pasted source).
- Reflection: "What did grounding fix? What did it NOT fix?"

**Wrap-Up** — single field: "What this week changed for me" (feeds the Week 6
lightning talk).

### 3.5 Finish screen
- Completeness checklist derived from the state object. Blank items are
  flagged but **do not block** submission (honesty over completeness).
- **Download PDF** and **Email a copy to my instructor** buttons. Email
  success/failure is clearly reported; the download always works locally, so a
  failed email never strands a student.

---

## 4. Architecture

```
Browser (React + Vite SPA)
  ├─ state object ──► localStorage (autosave, debounced)
  ├─ @react-pdf/renderer ──► PDF blob (download + email attachment)
  ├─ POST /api/chat   ──► validates passcode, model allowlist, limits
  │                        ──► OpenRouter (streaming) ──► SSE back to browser
  ├─ POST /api/email  ──► Resend → instructor inbox (PDF attached)
  └─ GET  /api/status ──► instructor page: OpenRouter credits remaining
Vercel cron (daily) ──► /api/status (cron mode) ──► low-balance email via Resend
Upstash Redis (free tier) ──► per-IP daily counters for rate limiting
```

No database of student work. Nothing about a student persists server-side
beyond the transient email pass-through — that is the privacy/FERPA posture.

### 4.1 `/api/chat`
- Input: `{ passcode, model, messages[] }`.
- Checks, in order: passcode matches `CLASS_PASSCODE`; model is in the
  allowlist; message count ≤ turn cap; each message ≤ length cap; per-IP daily
  counter below cap (Upstash `INCR` with 24 h `EXPIRE`).
- Forwards to OpenRouter chat completions with `max_tokens` cap; streams the
  response back (SSE).
- Model allowlist lives in one shared data file mapping friendly names →
  OpenRouter model IDs, so next quarter's swap is a one-line edit.

### 4.2 `/api/email`
- Input: `{ passcode, studentName, pdfBase64 }`.
- Validates passcode and a sane PDF size limit (e.g., ≤ 8 MB), then sends via
  Resend to `INSTRUCTOR_EMAIL` with subject
  `MHI 289A Week 5 submission — <student name>` and the PDF attached.
- Rate-limited per IP (a handful per day) via the same Upstash counters.

### 4.3 `/api/status` and balance monitoring
- **Instructor page mode:** passcode-gated page in the site (e.g., `/instructor`)
  calls `GET /api/status` with the passcode; the function queries OpenRouter's
  credits endpoint (`GET https://openrouter.ai/api/v1/credits`) and returns
  credits loaded / used / remaining for display.
- **Cron mode:** `vercel.json` defines a daily cron hitting `/api/status`
  authenticated with `CRON_SECRET`. If remaining balance <
  `ALERT_THRESHOLD_USD` (default 5), it emails the instructor via Resend.

### 4.4 State object (single source of truth)
```js
{
  version: 1,
  student: { name, lane, acknowledgedPHI },
  labs: {
    lab1: { taskChoice, runA: Conversation, runB: Conversation,
            techniques: [], reflectionComparison },
    lab2: { t2a: { lane, chat: Conversation, reflection },
            t2b: { lane, chat, reflection },
            t2c: { chat, reflection } },
    lab3: { attempts: [ { category, chat: Conversation,
                          tried, produced, caught } ],
            almostGotPastMe },
    lab4: { taskAndSource, ungrounded: Conversation,
            grounded: Conversation, reflection },
    wrapUp: { paragraph }
  }
}
// Conversation = { model, startedAt, messages: [{role, content, at}] }
```
- Autosaved to localStorage (debounced) on every change; versioned for future
  migrations.
- Drives: progress indicators, completeness checklist, backup file
  download/restore, and PDF rendering. One code path, no divergence.

### 4.5 PDF
- Generated client-side with `@react-pdf/renderer` from the state object.
- Cover block: student name, lane, date, models used, submission timestamp.
- Then per lab: instructions heading, prompts, **full transcripts** labeled
  with model and role, reflections. Page numbers and course footer.
- Same blob serves the download button and the email attachment.

---

## 5. Abuse limits (quantity only — never content)

The passcode will leak; assume it. Backstop is the **OpenRouter hard spend
cap** (worst case: budget exhausted, chat returns a friendly "out of credits —
contact your instructor" error; never a surprise bill).

| Limit | Value (tunable constants) |
|---|---|
| Per-IP messages per day | 150 (a full legit lab session ≈ 40–60) |
| Turns per conversation | 30 |
| Max input message length | 20,000 chars (case-pack pastes are far smaller) |
| Max output tokens | 2,048 |
| Emails per IP per day | 5 |

**Explicitly no content filtering** — Lab 3 requires students to prompt
adversarially. Restrict how much, never what.

---

## 6. Content as data

- `src/data/labs.js` — all lab instructions, task options, technique tags,
  failure categories, reflection prompts. Text sourced verbatim (lightly
  web-adapted) from `Week5_Lab_Notebook.docx`.
- `src/data/casePack.js` — the six case items (C1, C2, C3, O1, O2, O3) with
  lane tags and the task each maps to. Text verbatim from
  `Week5_Case_Pack.docx`.
- `src/data/models.js` — friendly name → OpenRouter model ID for the four
  offered models (shared with the API allowlist).

No instructional text hard-coded in components; next quarter's edits are data
edits.

---

## 7. Configuration (Vercel env vars)

| Var | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | LLM proxy key (spend cap set in OpenRouter dashboard) |
| `CLASS_PASSCODE` | Shared class passcode |
| `RESEND_API_KEY` | Email sending |
| `INSTRUCTOR_EMAIL` | Submission copies + balance alerts |
| `ALERT_THRESHOLD_USD` | Low-balance alert threshold (default 5) |
| `CRON_SECRET` | Authenticates the Vercel cron call |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate-limit counters |

---

## 8. Testing

- Vitest unit tests: state-object logic (updates, completeness checklist,
  migration guard), PDF data assembly, and API-function validation (passcode,
  allowlist, limits) with mocked fetch/Redis.
- Manual end-to-end pass before students touch it: one full lab run through
  landing → chat → reflections → PDF → email.

---

## 9. Operational notes / open items

1. **Rotate the exposed Gemini key.** The distributed Jupyter notebook contains
   a plaintext Gemini API key in its setup cell. Revoke it in Google AI Studio
   regardless of this project.
2. Implementer verifies current OpenRouter model IDs for the four models at
   build time.
3. Scott sets up: OpenRouter account + credit + spend cap, Resend account +
   sender domain/address, Upstash Redis (free), Vercel project + env vars.
   The implementation plan should end with a deployment checklist covering
   these.
4. Passcode and OpenRouter budget rotate each quarter.
