# Week 5 Lab Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> Read the companion design doc first: `docs/plans/2026-08-17-week5-lab-site-design.md`.
> It is the authority on product behavior; this plan is the authority on build order.

**Goal:** A guided lab-wizard website that replaces the MHI 289A Week 5 Jupyter notebook: students chat with real LLMs through a key-holding proxy, fill in reflections, and export a PDF record for Canvas (with optional email to instructor).

**Architecture:** React + Vite SPA deployed on Vercel with three serverless functions (`/api/chat` streaming proxy to OpenRouter, `/api/email` via Resend, `/api/status` for balance + daily cron alert). Single versioned state object in localStorage; client-side PDF via `@react-pdf/renderer`; Upstash Redis for quantity-only rate limits.

**Tech Stack:** React 18, Vite, Vitest + Testing Library, `@react-pdf/renderer`, Vercel Edge/Node functions, OpenRouter API, Resend API, Upstash Redis REST.

**Conventions for the implementer:**
- TDD for all logic (state, validation, PDF assembly). UI layout/styling steps are implement-then-manually-verify; UI *behavior* (navigation gating, completeness flags, insert-case buttons) gets Testing Library tests.
- Commit after every task minimum; after every green test run ideally.
- All instructional text and case text lives in `src/data/` — never hard-coded in components. The verbatim content is embedded in Tasks 2–3 of this plan; do not paraphrase it.
- Styling: clean, calm, readable. Single accent color, generous whitespace, system font stack or one webfont. Must work on a 13" laptop; usable on tablet. No CSS framework required — plain CSS modules or a single stylesheet is fine.

---

## Task 1: Scaffold project

**Files:**
- Create: Vite React project at repo root (`package.json`, `index.html`, `src/main.jsx`, `src/App.jsx`, `vite.config.js`)
- Create: `vitest.config.js`, `src/setupTests.js`
- Create: `.gitignore` (node_modules, dist, .env*, .vercel)

**Step 1:** `npm create vite@latest . -- --template react` (merge into existing repo; keep `docs/`).
**Step 2:** `npm i` then `npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`.
**Step 3:** Configure vitest (`environment: 'jsdom'`, setupFiles). Add `"test": "vitest run"` script. Write a trivial smoke test `src/App.test.jsx` (renders without crashing).
**Step 4:** Run: `npm test` → PASS. Run `npm run build` → succeeds.
**Step 5:** Commit: `chore: scaffold vite react app with vitest`

---

## Task 2: Case pack data (verbatim content)

**Files:**
- Create: `src/data/casePack.js`
- Test: `src/data/casePack.test.js`

**Step 1: Failing test** — each case has `id, lane, title, usedFor, text`; ids are `c1,c2,c3,o1,o2,o3`; lanes are `clinical`/`operational`; every `text` is non-empty.

**Step 2:** Implement with this exact content (text fields verbatim; preserve line breaks):

- **c1** · clinical · "C1 — Intake notes: Riverbend Family Medicine" · usedFor: `task2b` · text:
  > Patient: Maria Delgado, 58F. Visit date: June 3.
  > Reason for visit: Two-week follow-up after starting metformin for newly diagnosed type 2 diabetes. A1c was 7.8 at the prior visit.
  > Patient reports feeling "mostly fine." Had some loose stools the first week that have since settled. Says she "thinks she missed maybe two or three doses" when her schedule got busy. Checking her sugar "a few times a week"; morning readings "usually around 140 to 160." No blurry vision, no excess thirst. Walking about 20 minutes most days.
  > Current meds: metformin 500 mg twice daily; lisinopril 10 mg daily (started last year); occasional ibuprofen for knee pain.
  > Vitals today: BP 138/84, HR 76, weight 192 lb (down 3 lb from last visit).
  > Plan discussed: continue metformin; recheck A1c in 3 months; consider increasing the metformin dose if morning readings stay high. Reinforced diet; set a goal of checking sugars daily.

- **c2** · clinical · "C2 — Discharge instructions to convey: post wisdom-tooth extraction" · usedFor: `task2a` · text:
  > - Bite on gauze for 30–45 minutes; replace it if it soaks through; stop using it once the bleeding slows.
  > - No rinsing, spitting, drinking through a straw, or smoking for 24 hours, these can dislodge the clot and cause a painful "dry socket."
  > - Soft foods today. Avoid hot liquids while the mouth is still numb.
  > - Ice 20 minutes on, 20 minutes off, for the first day to limit swelling.
  > - Ibuprofen 400–600 mg every 6–8 hours for pain as needed; take it with food.
  > - Amoxicillin 500 mg three times daily for 7 days, finish the whole course even if feeling better.
  > - Call the clinic if: bleeding hasn't slowed after 2 hours of steady pressure, fever over 101°F, swelling getting worse after day 3, or severe pain that ibuprofen doesn't touch.

- **c3** · clinical · "C3 — Two study abstracts on AI sepsis prediction" · usedFor: `task2c` · text:
  > Abstract A. "Real-time machine-learning alert for early sepsis detection in the emergency department: a single-center prospective study." Hartmann R, Osei K, et al. Journal of Clinical Informatics, 2023.
  > A gradient-boosted sepsis prediction model was deployed in a 600-bed academic ED. Across 14,200 encounters the model reached an AUC of 0.89, with sensitivity 78% and specificity 84%. Median alert lead time before clinician recognition was 2.4 hours. Adoption was associated with a reduction in time-to-antibiotics. The authors conclude the tool is a promising adjunct for early sepsis identification.
  > Abstract B. "External validation of a commercial sepsis prediction model across three community hospitals." Braithwaite N, Cho L, et al. Critical Care Outcomes, 2024.
  > The same class of proprietary sepsis alert was evaluated retrospectively across three community sites (n = 21,500). AUC fell to 0.71, with sensitivity 63% at the vendor-recommended threshold. The model produced 8.4 alerts for every true positive case. Performance was lowest among patients with atypical or non-infectious SIRS. The authors caution that vendor-reported metrics may not transfer to settings that differ from the development population.

- **o1** · operational · "O1 — Transcript excerpt: Clinical Informatics Steering Committee, May 14" · usedFor: `task2b` · text:
  > Dana (chair): Okay, item three, the ambient scribe pilot. Where are we?
  > Priya: We've got 12 clinicians signed up across family med and IM. We were hoping for 15, but a couple dropped out over consent questions.
  > Marcus: Do we have a go-live date?
  > Priya: Tentatively the first week of August, but that depends on whether IT finishes the EHR integration. I don't want to commit until we hear back from them.
  > Dana: Fine, let's call it 'early August, pending IT.' Who's owning the clinician training?
  > Priya: That's still open, honestly. We need someone. I can do the first session but not all of them.
  > Marcus: I'll check if one of the super-users can take it. Don't put my name down as the owner yet, though.
  > Dana: Understood. Next, the budget, Priya, you mentioned needing another $40k?
  > Priya: Maybe around there. I'd have to confirm the licensing once we know the final headcount. Could be less.
  > Dana: Let's table the budget number until we have the headcount locked. Last thing, there was a proposal to extend the pilot to nursing documentation. I think that's premature. Let's hold it for now.
  > Marcus: Agreed, not yet.
  > Dana: Good. Priya sends a recap by Friday.

- **o2** · operational · "O2 — Policy brief to convey: county 'AI-in-Care Disclosure' rule" · usedFor: `task2a` · text:
  > - Starting January 1, clinics in the county must tell patients when an AI tool is used to help make decisions about their diagnosis or treatment.
  > - The disclosure can be spoken or written, but it has to happen before the AI-informed decision affects the patient's care.
  > - The rule applies to diagnostic AI and treatment-recommendation AI. It does NOT apply to back-office uses like scheduling or billing.
  > - Patients can ask for a human review of any AI-informed decision, and clinics must offer that at no extra cost.
  > - Clinics must keep a record that the disclosure was given, but patients do not have to sign anything.
  > - The rule does not ban any AI tool. It only requires telling patients that one was used.

- **o3** · operational · "O3 — Two program reports on ambient AI scribes" · usedFor: `task2c` · text:
  > Report A. "Ambient documentation assistant reduces after-hours charting: a 6-month quality-improvement report." Okafor T, Liang M. Health System Innovation Brief, 2024.
  > Across 40 primary care clinicians at one health system, after-hours "pajama time" in the EHR fell by an average of 28 minutes per day after adopting an ambient AI scribe. Self-reported documentation burden improved on a 5-point survey. The authors recommend a broader rollout.
  > Report B. "A randomized evaluation of an ambient AI scribe on documentation time and note quality." Velasquez J, Reuben S, et al. Journal of Care Delivery Research, 2025.
  > In a randomized trial across 110 clinicians, the intervention group saw no statistically significant reduction in total documentation time versus control. Note length increased, and chart reviewers flagged a higher rate of extraneous or unverified content in AI-assisted notes. Clinician satisfaction improved modestly. The authors note that time savings reported in uncontrolled studies may reflect selection and novelty effects.

Also export a note string shown wherever cases are offered: `"Everything in the case pack is fictional — patients, meetings, studies, authors, journals, and numbers were written for this course. None of the citations resolve to a real paper."`

**Steps 3–5:** Run tests → PASS. Commit: `feat: add case pack data`

---

## Task 3: Labs + models data

**Files:**
- Create: `src/data/labs.js`, `src/data/models.js`
- Test: `src/data/labs.test.js`

**`models.js`:** export `MODELS = [{ id, label, openrouterId }]` for exactly four models: Gemini Flash, Claude Haiku, GPT mini, and one open-weight model (Llama or Qwen). **Verify current OpenRouter model IDs at https://openrouter.ai/models at build time** — do not trust memory. Also export `MODEL_IDS` (the allowlist array) — this file is imported by both the frontend and `/api/chat`.

**`labs.js`:** structured instructional content. Source text comes verbatim (lightly web-adapted: "notebook" → "lab record", no other meaning changes) from the design doc's source, `Week5_Lab_Notebook.docx`. Structure:

- `intro`: title "Working With AI — Prompting, Breaking, and Grounding", course line "MHI 289A • UC Davis School of Medicine • Summer 2026", the "how to use" paragraphs (fill in as you go; graded on honesty and depth; "A record that documents a failure you almost missed is worth more than one that claims everything worked the first time. The failures are the assignment."), the mixed-cohort/lanes note, and `phiWarning`: "Never put real patient information or PHI into any of these tools. Use the fictional cases provided or material you write yourself. If you wouldn't post it publicly, it doesn't go in the prompt box."
- `lab1`: goal text; four `taskOptions` (2 clinical: T2D discharge instructions; explain two fictional medications to a worried family member; 2 operational: plain-language policy summary; onboarding instructions for a fictional clinic scheduling system); `techniques` = [role, step-by-step reasoning, worked example, refining across turns]; reflection prompts for runA ("what came back"), runB ("what came back"), and the graded comparison ("What actually changed between the two? Be specific — not 'B was better'…" marked `graded: true`).
- `lab2`: goal ("Every task below has a way it tends to fail. I am not going to tell you where. Part of the exercise is catching it."); three tasks `t2a` (target reading level; lanes; reflection "What I noticed when I looked closely (accuracy, reading level, anything off)"), `t2b` (source → structured summary; reflection "did anything appear that wasn't in my source?"), `t2c` (synthesis, same for everyone; reflection "check the citations carefully").
- `lab3`: goal ("the core of the week"); four `failureCategories` (confident wrong answer / fabricated citation, guideline, study, or statistic / biased or skewed completion / contradicts itself across turns); three documentation prompts per attempt (what I was trying to make it do + prompts used / what it produced / **how I caught it — what tipped me off, and how I confirmed it was wrong**); optional prompt "a failure that almost got past you"; rule: minimum two attempts from different categories.
- `lab4`: goal (grounded vs ungrounded, same task run two ways); field prompts: task+source, ungrounded run notes, grounded run notes, and "What did grounding fix? What did it NOT fix? Did any error survive even with the source in front of it?"
- `wrapUp`: "What this week changed for me" (+ note it feeds the Week 6 lightning talk).

**Test:** labs export has all five sections; lab1 has 4 task options and 4 techniques; lab3 has 4 categories; models has 4 entries with all fields.

Commit: `feat: add labs and models data`

---

## Task 4: State object + localStorage persistence

**Files:**
- Create: `src/state/labState.js` (pure logic), `src/state/useLabState.js` (React hook)
- Test: `src/state/labState.test.js`

**Pure logic first (TDD each):**
- `createInitialState()` → the exact shape from design doc §4.4 (version 1, student `{name:'', lane:null, acknowledgedPHI:false}`, all labs with empty conversations `null`, `lab3.attempts: []`).
- `serialize(state)` / `deserialize(json)` — deserialize validates `version === 1` and returns `null` on garbage (never throws).
- Reducer-style update helpers: `setStudent`, `updateLab(state, labId, patch)`, `addLab3Attempt`, `updateLab3Attempt(idx, patch)`, `appendMessage(state, path, message)` where a Conversation is `{model, startedAt, messages:[{role, content, at}]}` and `startConversation(state, path, model)`.

**Hook:** `useLabState()` wraps the above with `useReducer`; loads from `localStorage['mhi289a-week5-v1']` on mount; saves debounced ~500 ms on change. Backup: `exportBackup(state)` returns a `Blob` of the JSON (filename `week5-lab-backup-<date>.json`); `importBackup(file)` parses via `deserialize`, rejects invalid with a user-visible error.

**Tests:** initial shape; round-trip serialize/deserialize; garbage in → null; appendMessage immutability; debounced save writes to a mocked localStorage.

Commit: `feat: lab state model with localStorage persistence and backup`

---

## Task 5: Completeness / progress logic

**Files:**
- Create: `src/state/completeness.js`
- Test: `src/state/completeness.test.js`

`getCompleteness(state)` → `{ lab1: {done, missing: [labels]}, lab2: {...}, lab3: {...}, lab4: {...}, wrapUp: {...} }`.

Rules (test each):
- lab1 done = taskChoice + both conversations have ≥1 assistant message + comparison reflection non-blank.
- lab2 done = all three tasks have a conversation with ≥1 assistant message + non-blank reflection.
- lab3 done = ≥2 attempts, from ≥2 distinct categories, each with a conversation and all three documentation fields non-blank.
- lab4 done = both conversations + final reflection non-blank.
- wrapUp done = paragraph non-blank.
- `missing` lists human-readable labels for the Finish checklist (e.g., "Lab 3: second failure attempt uses the same category — use a different one").

Commit: `feat: completeness checklist logic`

---

## Task 6: API shared validation (`api/_lib/validate.js`)

**Files:**
- Create: `api/_lib/validate.js`, `api/_lib/limits.js`
- Test: `test/api/validate.test.js` (configure vitest to include `test/**`)

`limits.js` exports the tunable constants from design doc §5: `MAX_MESSAGES_PER_DAY=150`, `MAX_TURNS_PER_CONVERSATION=30`, `MAX_MESSAGE_CHARS=20000`, `MAX_OUTPUT_TOKENS=2048`, `MAX_EMAILS_PER_DAY=5`, `MAX_PDF_BYTES=8*1024*1024`.

`validate.js` exports `validateChatRequest(body, env)` returning `{ok:true}` or `{ok:false, status, error}` — checks in order: passcode (401, constant string compare is fine at this threat level), model in `MODEL_IDS` (400), `messages` is a non-empty array of `{role: 'user'|'assistant'|'system', content: string}` (400), turn count ≤ cap (429, friendly message "This conversation is long — start a new one"), each message ≤ char cap (413). TDD every branch.

Commit: `feat: chat request validation and limit constants`

---

## Task 7: Rate limiter (Upstash REST)

**Files:**
- Create: `api/_lib/rateLimit.js`
- Test: `test/api/rateLimit.test.js` (mock `fetch`)

`checkAndIncrement(kind, ip, max, env)` — key `rl:{kind}:{ip}:{YYYY-MM-DD}` (UTC date); Upstash REST pipeline `INCR` + `EXPIRE 90000 NX`; returns `{allowed: count <= max, count}`. **If Upstash env vars are absent, return `{allowed:true}`** (local dev). On Upstash fetch error, fail open but `console.error` (availability over enforcement — the OpenRouter spend cap is the real backstop). Tests: allow under cap, deny over cap, fail-open paths.

Commit: `feat: per-IP daily rate limiter`

---

## Task 8: `/api/chat` streaming proxy

**Files:**
- Create: `api/chat.js` (Edge runtime: `export const config = { runtime: 'edge' }`)

Behavior (validation logic already tested in Tasks 6–7; keep this handler thin):
1. POST only. Parse JSON body `{passcode, model, messages}`.
2. `validateChatRequest` → on failure return its status + `{error}`.
3. Rate limit: `checkAndIncrement('chat', ip, MAX_MESSAGES_PER_DAY, env)`; IP from `x-forwarded-for` first value, fallback `'unknown'`. Deny → 429 `{error: "Daily message limit reached. If you hit this doing the assignment, contact your instructor."}`.
4. Forward to `https://openrouter.ai/api/v1/chat/completions` with `Authorization: Bearer OPENROUTER_API_KEY`, headers `HTTP-Referer`/`X-Title` set to the site, body `{model, messages, max_tokens: MAX_OUTPUT_TOKENS, stream: true}`.
5. Pipe the upstream SSE body straight through (`return new Response(upstream.body, {headers: {'Content-Type':'text/event-stream', 'Cache-Control':'no-store'}})`).
6. Upstream error (e.g., 402 credits exhausted) → map to 502 with `{error: "The AI service is unavailable or out of credits — contact your instructor."}`.
7. Also handle `{passcode, ping: true}` → validates passcode only, returns `{ok:true}` (used by the landing page).

Manual verification (needs a real key in `.env.local` + `vercel dev`): one streamed completion via `curl -N`. Commit: `feat: streaming chat proxy with limits`

---

## Task 9: `/api/email` and `/api/status`

**Files:**
- Create: `api/email.js`, `api/status.js`, `vercel.json`
- Test: `test/api/emailValidate.test.js` for the pure validation

**email.js** (Node runtime): POST `{passcode, studentName, pdfBase64}` → passcode check; `pdfBase64` decoded size ≤ `MAX_PDF_BYTES`; rate limit `('email', ip, MAX_EMAILS_PER_DAY)`; then Resend REST (`https://api.resend.com/emails`) with `RESEND_API_KEY`: to `INSTRUCTOR_EMAIL`, subject `MHI 289A Week 5 submission — <studentName>`, short text body with timestamp, attachment `week5-lab-<studentName slug>.pdf`. Return `{ok:true}` or a clear error. Extract the pure validation into `api/_lib/` and test it.

**status.js** (Node runtime): 
- Instructor mode: POST `{passcode}` → GET `https://openrouter.ai/api/v1/credits` with the key → return `{totalCredits, totalUsage, remaining}`.
- Cron mode: GET with `Authorization: Bearer ${CRON_SECRET}` (Vercel cron sends this automatically when `CRON_SECRET` is set) → fetch credits; if `remaining < ALERT_THRESHOLD_USD` (default 5), send alert email via Resend to `INSTRUCTOR_EMAIL` ("Week 5 lab site balance low: $X.XX remaining"); return `{remaining, alerted}`.

**vercel.json:** `{"crons": [{"path": "/api/status", "schedule": "0 15 * * *"}]}` (daily, 15:00 UTC ≈ 8 am Pacific).

Commit: `feat: email submission and balance status endpoints with daily cron`

---

## Task 10: App shell, routing, landing page

**Files:**
- Create: `src/components/Landing.jsx`, `src/components/Layout.jsx`; modify `src/App.jsx`
- Test: `src/components/Landing.test.jsx`

Use simple state-based routing (current step in lab state or a tiny router — no need for react-router unless preferred). Screens: `landing → hub → lab1 → lab2 → lab3 → lab4 → wrapup → finish`, plus `/instructor` (Task 15) reachable via URL hash `#instructor`.

Landing per design §3.1: header, intro paragraphs, PHI warning in a highlighted box with a **required checkbox**, name input, lane picker (two large cards: Clinical / Operational, with one line explaining lanes are switchable per-task later), passcode input. "Begin" button: disabled until name + lane + PHI ack; on click, POSTs `{passcode, ping:true}` to `/api/chat`; bad passcode → inline error; success → save to state, go to hub. If saved state exists on load, skip landing and show hub with a "Welcome back, <name>" note.

**Tests:** Begin disabled until fields complete; bad-passcode error shown (mock fetch); resume path skips landing.

Commit: `feat: app shell and landing page`

---

## Task 11: Chat panel component

**Files:**
- Create: `src/components/ChatPanel.jsx`, `src/hooks/useChat.js`
- Test: `src/hooks/useChat.test.js`, `src/components/ChatPanel.test.jsx`

`useChat({conversation, onUpdate, passcode})`: `send(text)` appends the user message, POSTs to `/api/chat` with full message history, consumes the SSE stream (parse `data:` lines, ignore `[DONE]`, accumulate `choices[0].delta.content`), updating the assistant message incrementally via `onUpdate`. Handles: HTTP error JSON → surface `error` string; stream abort; `isStreaming` flag. **Test the SSE parsing with a mocked fetch returning a ReadableStream.**

`ChatPanel` props: `conversation, onUpdate, caseButtons (case ids), label`. Renders: model picker (locked once the conversation has messages — the model is a property of the conversation), message list (assistant messages rendered as markdown — use `marked` + `dompurify` or `react-markdown`), textarea + Send (Cmd/Ctrl-Enter), "Insert this case" buttons (append case text into the textarea, with the fictional-content note as a tooltip/caption), "New conversation" button **only where the lab spec calls for it**, pinned one-line PHI reminder under the textarea, and a friendly error banner for 429/502 responses. Empty-conversation state prompts model choice first.

**Tests:** insert-case appends text; send appends user message and streams assistant reply (mocked); model picker locks after first message.

Commit: `feat: multi-turn streaming chat panel`

---

## Task 12: Hub + lab screens

**Files:**
- Create: `src/components/Hub.jsx`, `src/components/Lab1.jsx`, `src/components/Lab2.jsx`, `src/components/Lab3.jsx`, `src/components/Lab4.jsx`, `src/components/WrapUp.jsx`, `src/components/ReflectionField.jsx`
- Test: `src/components/labScreens.test.jsx` (behavioral highlights only)

`ReflectionField`: label (from labs.js), auto-expanding textarea, optional `graded` badge ("This is the graded part of Lab 1").

Hub per design §3.2: five cards with status from `getCompleteness`, "Continue" → first incomplete, free navigation, autosave indicator, backup download/restore controls.

Lab screens implement design §3.4 exactly. Structure notes:
- **Lab1:** task picker (4 options as radio cards, lane-tagged) → two ChatPanels ("Version A — throwaway" / "Version B — structured", each its own conversation, fresh — no New conversation button needed) → technique checkboxes for B → reflections. Version B panel unlocks after A has an assistant reply (soft: show note, don't hard-block).
- **Lab2:** three tabs (2A/2B/2C) each with lane toggle (except 2C), case-insert buttons filtered by lane and `usedFor`, ChatPanel, reflection. Tab shows a ✓ when its part is complete.
- **Lab3:** list of attempt cards + "Add another failure attempt". Each attempt: category picker, ChatPanel (multi-turn is the point — no turn nudges), three documentation fields. Soft warning when two attempts share a category. Optional "almost got past you" field at the bottom.
- **Lab4:** task+source field (with case-insert), ChatPanel "Ungrounded run", ChatPanel "Grounded run", final reflection.
- **WrapUp:** single field + short lead-in about the Week 6 lightning talk.

**Tests (behavioral):** Lab1 shows 4 task options; Lab3 warns on duplicate categories; Lab2 case buttons filter by lane.

Commit per screen or at minimum: `feat: hub and lab screens`

---

## Task 13: PDF generation

**Files:**
- Create: `src/pdf/buildPdfData.js`, `src/pdf/LabPdf.jsx`
- Test: `src/pdf/buildPdfData.test.js`

`buildPdfData(state)` (pure, TDD): flattens state into an ordered list of sections for rendering — cover (name, lane, date, distinct models used, timestamp), then per lab: heading, each conversation as `[{speaker: 'Student'|'<Model label>', text}]`, each reflection as `{prompt, answer}` with blank answers rendered as "— not answered —". Test: models deduped; blank handling; lab3 attempts numbered with category names.

`LabPdf` renders that data with `@react-pdf/renderer` (`npm i @react-pdf/renderer`): course footer, page numbers, monospace-free clean styles, clear visual distinction between student prompts and model replies. Export `generatePdfBlob(state)` used by both download and email. Manual check: generate from a seeded state, open the PDF, verify pagination with a long transcript.

Commit: `feat: pdf export of the full lab record`

---

## Task 14: Finish screen

**Files:**
- Create: `src/components/Finish.jsx`
- Test: `src/components/Finish.test.jsx`

Per design §3.5: checklist from `getCompleteness` (flags, never blocks — copy: "Blank sections are listed so nothing is missing by accident. An honest incomplete beats a padded complete."), **Download PDF** (`generatePdfBlob` → object URL, filename `week5-lab-<name>.pdf`), **Email a copy to my instructor** (same blob → base64 → `/api/email`; show spinner, then explicit success "Sent — your instructor has a copy" or failure "Email failed — download the PDF and submit it on Canvas instead"). Remind: Canvas upload is the official submission either way.

**Tests:** checklist renders missing items; email failure path shows the fallback message (mock fetch).

Commit: `feat: finish screen with pdf download and email submission`

---

## Task 15: Instructor status page

**Files:**
- Create: `src/components/Instructor.jsx` (route `#instructor`)

Passcode field → POST `/api/status` → display credits loaded / used / **remaining**, alert threshold note, and a reminder of where the caps live (OpenRouter dashboard). Not linked from student navigation. Manual verify with `vercel dev`.

Commit: `feat: instructor balance page`

---

## Task 16: Polish + end-to-end pass

**Steps:**
1. Responsive check at 1280px and tablet width; chat panel usable on both.
2. Full manual E2E with `vercel dev` and real keys: landing → all labs (at least one real streamed chat each) → wrap-up → PDF download (open and read it) → email (receive it) → instructor page → backup export/import round-trip.
3. `npm test` all green; `npm run build` clean.
4. Commit: `chore: polish and e2e verification`

---

## Task 17: Deployment checklist (document for Scott)

**Files:** Create `docs/DEPLOY.md` with exact steps:
1. OpenRouter: create account → load $15–20 → **set hard spend cap** → create key.
2. Resend: create account → verify sender (onboarding domain is fine to start) → key. Note free tier: 100 emails/day.
3. Upstash: create free Redis DB → copy REST URL + token.
4. Vercel: import the GitHub repo → set env vars (`OPENROUTER_API_KEY`, `CLASS_PASSCODE`, `RESEND_API_KEY`, `INSTRUCTOR_EMAIL`, `ALERT_THRESHOLD_USD`, `CRON_SECRET` (any long random string), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) → deploy → confirm cron appears in project settings.
5. Smoke test production: passcode gate, one chat per model, PDF, email, instructor page.
6. Quarterly rotation: passcode, budget top-up, model ID review.
7. **Separately: revoke the Gemini API key that shipped in the old Jupyter notebook (Google AI Studio).**

Commit: `docs: deployment checklist`
