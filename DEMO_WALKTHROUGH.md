# Six-minute demo walkthrough

**Purpose:** show the live surface, your body language, and one specific product decision based on the supplied cold-call guide and transcript research. Do not read this word for word. The recruiter asks to see you and the application together.

## Before recording

- Open the deployed Vercel app and confirm the Render `/health` endpoint reports `databaseConfigured: true` and `llmConfigured: true`.
- Test all three live AI actions if possible: stage suggestion, note cleanup, and summary. If one fails, fix it before recording rather than pretending it worked. Use paraphrased cases from `TRANSCRIPT_EVALUATION_PLAN.md`, and do not show the raw transcript ZIP.
- Prepare a fictional prospect, e.g. Jordan Lee at Northstar Labs. Do not show credentials, API keys, the Supabase dashboard with secrets, private transcripts, or real prospect details.
- Use a screen recorder that keeps your camera visible in one corner. Confirm the exported video is at least six minutes and can be viewed by anyone with the Google Drive link.

## Suggested flow

### 0:00–0:35 — Introduce the problem

Explain that a caller needs a second screen that keeps the stage structure visible without asking them to read a script while the prospect is talking. It surfaces common response patterns, provides quick taps, captures the prospect's own words, and records a next step.

### 0:35–1:15 — Start a call

Create a fictional call. Explain why the interface asks for only a name, company, and role. It does not record audio; the caller captures notes manually so attention stays on the conversation.

### 1:15–2:35 — Demonstrate the stage framework

Walk through Opening → Purpose → Permission. Show how a callback request differs from permission to continue. Then jump to “Their need, in their words” and explain why the app stores the prospect's phrasing separately from caller notes. Point out that the response examples are display-only patterns, not verbatim quotes or buttons to copy into the prospect-words field.

### 2:35–3:35 — Show the AI

Enter a short prospect statement, request a stage suggestion, and review the rationale and suggested next move. Optionally clean up rough notes. Say explicitly that AI can be wrong and the caller must verify it before saving.

### 3:35–4:25 — Close accurately

Save a stage result, open the wrap-up, and draft a summary. Choose an appropriate outcome. Explain the product decision to distinguish a report request from a confirmed meeting or follow-up, and respect explicit refusals.

### 4:25–5:10 — Show call history

Show the outcome and furthest stage reached, then open the saved record. Refresh only if you have confirmed cloud persistence in Supabase mode.

### 5:10–6:00 — Explain one decision and a trade-off

Use this explanation in your own words: the source guide says a “yes” to receiving a document may be politeness rather than real interest, and recorded outcomes sometimes do not match the conversation. Therefore, the app captures stage evidence separately and leaves the final outcome to the caller to review. Mention honest trade-offs: free-tier services may sleep, LLM output is probabilistic, and the public MVP needs authentication before real prospect data should be stored.

## Last check

- At least six minutes long.
- Your face and the live surface are both visible.
- You are explaining decisions naturally, not reading the screen word for word.
- Google Drive permissions: **Anyone with the link — Viewer**.
- Open the final video link in a private/incognito window to verify access.
