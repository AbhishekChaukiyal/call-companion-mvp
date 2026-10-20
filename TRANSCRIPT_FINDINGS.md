# Transcript research notes

This note records product decisions from reviewing the supplied 100-call collection and its index. It intentionally contains aggregate findings and paraphrased patterns only. The provided transcript ZIP is not included in this repository, and people/company names from it are not reproduced.

## What the index says

- 100 calls and 1,945 dialogue turns are represented in the collection.
- Recorded call length ranges from 30 seconds to 11 minutes 27 seconds; the median is 93.5 seconds.
- 68 of the 100 calls are at most two minutes long. This supports a glanceable second-screen design with low typing overhead.
- The logged outcomes are: 14 agreed to receive a report, 14 follow-up, 14 not interested, 13 not logged, 11 next step agreed, 10 do not call, 8 wrong person, 7 interested, 5 moved company, and 4 call again.
- The transcript README warns that the outcome is what the caller logged and may not match what the conversation supports. Use the outcome as a record to review, not as unquestioned ground truth.

## Findings by stage

### 1. Opening

The caller may reach a switchboard, an assistant, a busy person, a number belonging to someone who left, or an individual whose role does not match the list. The screen therefore provides quick outcomes for reaching the right person, reception, a callback request, or a wrong/moved contact. Do not proceed as though the listed person has been verified when they have not.

### 2. Purpose

Repeated clarification questions arise when the purpose sounds like a broad company label rather than a reason this person is being called. Common patterns include asking what the call concerns, what the caller's company actually does, and where the contact details came from. The UI prompts the caller to answer the question asked, plainly and honestly.

### 3. Permission

Prospects often signal a timing constraint: they are in a meeting, driving, travelling, or about to start another task. “Go ahead,” a callback request, and a request for information first are materially different. The interface makes this distinction explicit so that a polite or brief response is not misread as interest.

### 4. Their business

Prospects describe what the business makes or serves, correct mistaken assumptions, distinguish their own remit from a division or head office, and explain when an approach does not fit their customer base or operating model. This is why the caller is prompted to listen before pitching rather than forcing a generic growth story onto every company.

### 5. Their need, in their words

The calls include concrete business context, goals, constraints, and also cases where the prospect says the current customer base/business model is fine. Capture the prospect's phrasing before interpreting it. The quick result choices distinguish a stated goal/challenge from no expressed need, a request for the caller to explain possible help, and an unclear need.

### 6. Objection

Recurring objection types include an existing internal/global provider or team, the wrong contact or decision owner, a request for written material, limited time, and an explicit lack of interest. The useful response depends on the reason: clarify ownership where appropriate, respect a clear refusal, and never treat a polite end as a positive response.

### 7. Next step

The next step is strongest when it has a concrete action, time, owner, or channel: a call at a named time, a meeting, a report to a specified email/WhatsApp channel, or a referral. A request to receive information is recorded separately from a meeting or a firm commitment to engage. “Send it” can be a useful next action, but is not proof of purchase intent.

### 8. Close

Close by confirming the action/time/channel or accurately recording that there was no next step, a refusal, a wrong contact, or a line/connection issue. This stage includes checking that the CRM outcome matches the conversation—important because the source explicitly warns that recorded outcomes can be inaccurate.

## Design decisions made from the research

1. Use the exact eight-stage order from the supplied guide: Opening; Purpose; Permission; Their business; Their need, in their words; Objection; Next step; Close.
2. Provide four stage-specific quick taps rather than the same generic “positive / neutral / objection” choices at every stage.
3. Label sample responses as illustrative patterns, not verbatim transcript quotations. Do not include the provided ZIP or transcript-specific names in the public repository.
4. Keep a separate call outcome in the close-out form; do not infer a successful outcome from a stage tap or an AI suggestion.
5. Make AI-generated classification, note cleanup, and summaries advisory. The caller must verify them before saving.
6. Allow a call to be closed from any stage. A dropped call or early refusal still needs an accurate record.

## How the findings are tested

The separate `TRANSCRIPT_EVALUATION_PLAN.md` converts recurring themes into a small set of paraphrased regression cases. These are suitable for manual LLM checks, but they are not a fully labeled benchmark because the source files do not mark stage boundaries.

## Limits of the analysis

The supplied transcript files do not mark explicit stage boundaries. The stage descriptions and quick taps are informed by recurring dialogue patterns and the accompanying eight-stage guide, but this repository does not claim an exact statistical distribution of the stage at which each call ended. That would require annotating each call against consistent stage-boundary criteria. The collection is intended for this assignment only; the raw files are excluded from the public project.
