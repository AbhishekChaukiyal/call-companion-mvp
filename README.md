# Call Companion

A lightweight, AI-assisted second screen for a human cold caller. It keeps the caller oriented through an eight-stage framework, makes it quick to capture the prospect's own words, and saves a concise record of the call.

> The eight stages and stage-specific quick taps have been aligned to the recruiter's supplied guide. The response examples are newly phrased illustrations informed by recurring patterns in the 100-call collection, not transcript quotations. The transcript ZIP is intentionally excluded from this public repository; it was provided for this task only. See [Transcript research notes](TRANSCRIPT_FINDINGS.md) for the aggregate observations and design rationale.

## What is implemented

- Call workspace with eight stage cards and common prospect-response examples.
- One free-text box for the prospect’s own words plus four stage-specific quick taps aligned to the supplied guide. Common response examples are display-only so they cannot accidentally be saved as a real quote.
- LLM-powered stage suggestion, faithful cleanup of the prospect’s words, and call-summary drafting through the backend.
- Finish-call workflow with outcomes that distinguish a firm next step, a report request, a refusal, a wrong/moved contact, a connection issue, and an unlogged/unclear call.
- Call history with search, stage progress, outcome, and read-only review.
- Supabase persistence, Express API, health endpoint, input limits, rate limiting, CORS, and browser-local demo fallback.
- LLM provider can be configured as Gemini, Cerebras, or Mistral without putting the key in the browser.

## Architecture

```text
React + Vite (Vercel)
        |
        | HTTPS / JSON
        v
Node.js + Express API (Render)
        |                         |
        v                         v
Supabase Postgres           LLM provider API
calls + stage notes         Gemini / Cerebras / Mistral
```

## Run locally

Prerequisites: Node.js 20+ and npm.

1. Create a Supabase project. In the Supabase SQL Editor, run `supabase/schema.sql`.
2. Create `backend/.env` from `backend/.env.example` and set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and one LLM provider key.
3. Create `frontend/.env` from `frontend/.env.example`. For local development, set `VITE_API_URL=http://localhost:4000`.
4. In a terminal:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. In another terminal:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The backend health endpoint is `http://localhost:4000/health`.
7. From the project root, run `npm test` to check that the frontend and backend use the same eight stages, validate API/local-storage behavior, and test transcript-informed fallback classifications.

If the database/API is unavailable, the interface can still be explored in **local demo mode** using browser storage. In that mode, calls are not saved to Supabase or shared across browsers. A local keyword hint is used instead of live AI if the LLM endpoint is unreachable. Check the status indicators and test the live backend before recording the submission video.

## Product decisions from the provided research

- The stage order and purposes follow the supplied guide: Opening, Purpose, Permission, Their business, Their need, in their words, Objection, Next step, Close.
- Stage response examples are illustrative patterns rather than verbatim transcript excerpts. The public repository does not contain the supplied transcripts or transcript-specific names.
- Source outcomes are caller-entered and sometimes conflict with the spoken exchange, so the close-out requires a caller-reviewed outcome. AI suggestions are drafts, not authoritative labels.
- The source transcripts are not stage-annotated; the README on research explains why no exact stage-end frequency chart is claimed.

## Configure an LLM

Set `LLM_PROVIDER` to one of `gemini`, `cerebras`, or `mistral` and add its API key in the **backend environment only**. The `.env.example` lists provider-specific model settings. Use the model IDs available to your account and confirm the provider's current free-tier/rate-limit policy before the demo; access and quotas can change.

The LLM is used for at least three user-visible tasks:

1. **Stage suggestion:** classify the latest prospect statement into the task's eight stages and suggest a next move.
2. **Note cleanup:** preserve the prospect's meaning while turning rough input into structured notes and, when supported, one of the current stage's quick-tap results.
3. **Call summary:** draft a concise summary, suggested outcome, and follow-up action. The outcome choices explicitly distinguish receiving information from booking a meeting or agreeing a concrete follow-up.

AI output is a draft. The caller should check it before saving; the app should never invent an outcome, commitment, or quote.

## Deploy

### 1. Supabase

- Create a project and run `supabase/schema.sql` in SQL Editor.
- Copy the Project URL and service-role key from Project Settings / API.
- Keep the service-role key secret. It belongs in Render only, never in Vercel or any frontend variable.

### 2. Render (backend)

Create a **Web Service** from this GitHub repository:

- Root directory: `backend`
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`

Set these environment variables in Render:

- `NODE_ENV=production`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `FRONTEND_ORIGIN=https://YOUR-VERCEL-DOMAIN.vercel.app`
- `LLM_PROVIDER=gemini` (or `cerebras` / `mistral`)
- The matching provider API key and optional model setting

After deploy, open `https://YOUR-RENDER-SERVICE.onrender.com/health`. It should return JSON with `status: "ok"`, `databaseConfigured: true`, and `llmConfigured: true`.

### 3. Vercel (frontend)

Import the same GitHub repository as a Vercel project:

- Root directory: `frontend`
- Framework preset: Vite (or let Vercel detect it)
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com`

Redeploy after adding the variable. Then update Render's `FRONTEND_ORIGIN` to the exact deployed Vercel origin and redeploy/restart Render. Verify start, save stage, AI suggestion, close call, history, and health from the public Vercel URL.

Free hosting can sleep when idle, so the first API request after inactivity may be slower. Mention this as a free-tier trade-off if asked; do not describe the service as always-on.

## Automated checks

Run `npm test` from the project root. The tests currently cover stage-definition consistency, API success and failure paths, local demo persistence, and representative transcript-informed fallback suggestions. They do not replace the live browser / Supabase / LLM end-to-end test.

See [Transcript-informed test plan](TRANSCRIPT_EVALUATION_PLAN.md) for manual scenarios and an evaluation rubric for the configured LLM.

## Quick smoke checks

```bash
# API health
curl https://YOUR-RENDER-SERVICE.onrender.com/health

# Configured stage guide
curl https://YOUR-RENDER-SERVICE.onrender.com/api/stages

# Create a call (requires configured Supabase)
curl -X POST https://YOUR-RENDER-SERVICE.onrender.com/api/calls \
  -H 'Content-Type: application/json' \
  -d '{"prospectName":"Demo Prospect","company":"Northstar Labs","prospectRole":"Operations"}'
```

Then do an end-to-end browser test with a fictional prospect. Don't use real prospect personal data in the demo.

## Public-repo and privacy notes

- Do not commit `.env` files, API keys, the Supabase service-role key, or the provided transcript collection.
- This internship MVP has no user authentication. Anyone who can reach the public API may be able to create/view call records. Use only fictional/demo data for the public deployment. Add authentication and user-scoped row-level security before using it with real sales teams.
- Notes are entered manually; the app does not record or transcribe phone audio.
- Avoid representing the app as a compliance-ready CRM or implying the LLM guarantees correct advice.

## Folder structure

```text
call-companion/
├── frontend/                 # React + Vite interface for Vercel
│   └── src/
│       ├── App.jsx
│       ├── api.js             # UI stages + API/local-demo adapter
│       └── styles.css
├── backend/                  # Express API for Render
│   └── src/
│       ├── index.js
│       └── stages.js          # Stage framework used by API/LLM
└── supabase/schema.sql        # Database tables and indexes
```

## Before submitting

- [x] Align all eight stage names and purposes to the recruiter-provided guide.
- [x] Add three illustrative response patterns and four stage-specific quick taps per stage. The live workspace keeps one free-text field for the prospect’s own words.
- [x] Distinguish call outcomes so a document request is not mislabeled as a booked meeting.
- [x] Confirm `frontend/src/api.js` and `backend/src/stages.js` have the same stage keys and tap options.
- [x] Add aggregate transcript research notes and a paraphrased regression plan without including the raw transcript ZIP.
- [x] Add built-in Node tests for API adapter behavior and transcript-informed fallback hints.
- [ ] Install frontend/backend dependencies and run a production frontend build on your machine or CI. Package installation timed out in the authoring environment, so the production bundle is not yet verified.
- [ ] Configure Supabase, deploy Render and Vercel, and confirm cloud-mode persistence after refresh.
- [ ] Test each live LLM task against the selected manual evaluation cases with fictional notes and correct any invented facts.
- [ ] Confirm no secrets or source transcripts are in the public GitHub repository.
- [ ] Add the real Vercel URL, Render health URL, and LLM/provider choice below after deployment.
- [ ] Record an unscripted six-minute demo with your camera visible. See `DEMO_WALKTHROUGH.md`.

## API references

- Gemini API `generateContent`: https://ai.google.dev/api/generate-content
- Current Gemini model IDs: https://ai.google.dev/gemini-api/docs/models
- Cerebras Inference docs: https://docs.cerebras.ai/
- Mistral Chat Completions: https://docs.mistral.ai/api

## Live deployment

- **Frontend:** https://call-companion-mvp.vercel.app/
- **Backend health:** https://call-companion-api.onrender.com/health
- **Database:** Supabase PostgreSQL
- **LLM provider:** Google Gemini

### How AI is used

The backend uses Google Gemini for three tasks:

1. **Stage suggestions:** Classifies prospect statements against the
   eight-stage call framework and recommends a next move.
2. **Note cleanup:** Improves rough notes while preserving their meaning.
3. **Call summaries:** Drafts a concise summary, suggested outcome,
   and potential follow-up action.

AI-generated content is advisory. The caller reviews it before saving.
API keys remain on the backend and are not exposed to the frontend.
