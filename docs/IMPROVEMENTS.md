# QA Review — Findings & Improvements

**Reviewed:** 2026-08-17, against `main` @ `970ef3b` (all 17 plan tasks merged).
**Reviewer focus:** student experience for a non-technical health-informatics cohort, fidelity
to the design doc (`docs/plans/2026-08-17-week5-lab-site-design.md`), and pedagogical intent.

## Overall verdict

The site accomplishes what the assignment set out to do. All four labs plus wrap-up are
present with the correct instructional text, the reflection prompts match the plan verbatim,
the "failures are the assignment" ethos is carried through (Lab 3's minimum-two-categories
rule, the honesty-over-completeness Finish screen), the case pack is intact with lane
filtering, and the PDF record is genuinely complete — full transcripts with markdown
formatting preserved, blank answers explicitly marked. The passcode/PHI gating, autosave,
and backup flows all work as designed.

The findings below don't change that verdict. But two of them (F1, F2) are dead-end traps
that **will** generate confused-student emails during a real class run, and I'd fix those
before go-live. The rest are ranked and can be batched or skipped as you judge.

---

## High priority — fix before students touch it

### F1. Students can get permanently stuck in a conversation, and the error tells them to do something the UI doesn't allow

Three ingredients combine into a dead end:

1. The turn cap rejects long conversations with *"This conversation is long — start a new
   one"* (`api/_lib/validate.js:29`) — but **no lab screen renders a "New conversation"
   button**. `ChatPanel` supports `allowNewConversation`, but nothing ever passes it. The
   error instructs students to do something that is impossible.
2. The model picker locks after the **first message**, not the first *reply*
   (`ChatPanel.jsx:21,68`). If a student's first send fails (503, out of credits, wrong
   model temporarily down), the dangling user message locks the model — they can never
   switch models or reset that panel.
3. Every send appends the user message to the transcript **before** the request
   (`useChat.js:41-44`), so each retry against the turn cap appends another message,
   making the "too long" state strictly worse with every attempt.

This matters most in Lab 3, where long adversarial multi-turn chats are *the assignment* —
the students doing the exercise most enthusiastically are the ones who'll hit the cap.

**Recommendation:** pass `allowNewConversation` + an `onNewConversation` handler (which
just sets the conversation back to `null` / a fresh object) on every ChatPanel, or at
minimum wherever hitting a wall is plausible (all of Lab 3, both Lab 4 runs, Lab 1 A/B).
The old transcript is already a design casualty here — if preserving it matters for the
record, keep the simplest version: reset with a confirm dialog. Separately, consider
locking the model on first *assistant reply* rather than first message.

### F2. Lab 3 attempts can be added but never removed

There is no delete control on attempt cards (`Lab3.jsx`). An accidentally added or
abandoned attempt:

- permanently shows its empty documentation fields on the Lab 3 screen,
- permanently flags the Finish checklist ("attempt 3 is missing …" × 4 lines),
- permanently keeps the hub card at "In progress",
- and appears in the PDF as an empty numbered attempt.

Submission is never blocked (by design), but a student who fat-fingers "+ Add another
failure attempt" has no way to undo it, and the checklist noise buries the items that
actually matter.

**Recommendation:** add a "Remove this attempt" control (with confirm) on attempt cards —
`labState` needs a small `removeLab3Attempt(index)` helper, which is a ~5-line addition to
`labState.js` in the same style as `addLab3Attempt`.

---

## Medium priority — likely confusion, not dead ends

### F3. Lab 4's grounded run: students aren't told how to get the source *into* the chat

The design doc (§3.4) specifies the grounded run as *"fresh chat; **case-insert** or pasted
source"* — but both Lab 4 chat panels render with `caseButtons={[]}` (`Lab4.jsx:49,57`).
The case-insert buttons exist only on the separate "task and source" record field above.
A student can easily fill in that field, run the "grounded" chat *without ever pasting the
source into it*, and wonder why grounding changed nothing — quietly invalidating the lab's
core comparison.

**Recommendation:** add the case buttons to the grounded run's panel (restoring the design
intent), and add one sentence of instruction above it: "Paste your source text into the
chat along with your task — the model can only see what you send it." That sentence is
arguably the most load-bearing missing text on the site.

### F4. Shared computers: a new student inherits the previous student's work

`handleLandingSuccess` (`App.jsx:43-48`) sets the student profile but **never resets
`labs`**. On a shared/library machine: new session → passcode gone → landing shows
(pre-filled with the *previous* student's name) → new student types their own name, hits
Begin — and lands in a hub full of someone else's transcripts and reflections, which would
then go out under the new student's name in the PDF. The design doc explicitly calls out
shared computers as a target scenario (§3.2).

**Recommendation:** when the submitted name differs from the stored one, offer "Start
fresh or continue the saved work?" — or simpler, add a "Start over" control near the
backup buttons that clears state after a confirm. (The backup feature already covers the
returning student's side of this.)

### F5. Lab 1's "What came back?" — a question with nowhere to answer it

Both run panels are followed by the bare italic text "What came back?" with no input
(`Lab1.jsx:58,88`). The state shape (by design) has no field for these — the transcript
itself is the answer — but as rendered it reads like a broken form field. Students will
look for the text box.

**Recommendation:** either cut the two hints, or reword to something self-evidently
rhetorical, e.g. "Look at what came back — you'll compare the two runs below." (Adding
real fields would also work but requires touching state/PDF/completeness; the reword is
one line in `labs.js` / `Lab1.jsx`.)

---

## Low priority — polish

- **F6. Failed sends pollute the record.** Because the user message is committed before
  the request (`useChat.js`), any 4xx/5xx leaves an unanswered message in the transcript
  and the PDF, and retyping duplicates it. Consider rolling back the optimistic append on
  HTTP error (keep it on stream-abort, where partial output may exist), or offering a
  retry that reuses the dangling message instead of appending.
- **F7. The optional Lab 3 field isn't marked optional.** "A failure that almost got past
  you" renders identically to the three required fields (`Lab3.jsx:76-80`). Append
  "(optional)" to the label in `labs.js`.
- **F8. Lab 2 lane doesn't default to the student's chosen lane.** Landing says lane "is
  just a starting point," but `t2a`/`t2b` start with `lane: null` and show *both* lanes'
  case buttons until clicked. Initialize per-task lanes from `student.lane` (or pass it as
  the toggle default) so the promise on the landing page is kept.
- **F9. Screen/PDF inconsistency for student messages.** The chat UI renders user messages
  as plain text but the PDF renders them through the markdown pipeline. Mostly harmless
  (case-pack bullets actually look *better*), but a student's literal `*` or `#` characters
  will silently change appearance between screen and official record. Pick one: render
  user messages as markdown in the UI too, or keep them plain in both.
- **F10. Truncation at 2,048 output tokens is silent.** Long replies just stop
  mid-sentence with no indicator. A one-line note near the chat ("long answers may be cut
  off — ask the model to continue") would pre-empt "the site is broken" reports. (A real
  `finish_reason` check on the stream would be better but is more work.)
- **F11. "Welcome back, X" greets brand-new students** who completed landing ten seconds
  earlier (`Hub.jsx`). Trivial: only say "back" when resuming.

---

## Not findings, but worth restating

- **Live-API verification is still outstanding.** Streaming against real OpenRouter,
  actual Resend delivery, and the credits response shape have never been exercised — that's
  the smoke-test section of `docs/DEPLOY.md`, and F1's "first send fails" branch is exactly
  the kind of thing it will exercise for real.
- The exposed Gemini key in the old notebook still needs revoking (also in DEPLOY.md §7).

## Suggested order of work

1. F1 + F2 (the two traps) — small, high-value, ~an hour together including tests.
2. F3 (one sentence + case buttons) and F5 (one-line reword) — minutes each.
3. F4 before any shared-computer deployment; skippable if students use personal laptops.
4. F6–F11 as a single polish pass, or skip.
