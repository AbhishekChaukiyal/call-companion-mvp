# Transcript-informed test plan

Use this checklist after local setup. The cases below are concise paraphrases of recurring patterns observed across the supplied transcript set; they are not transcript quotations. The raw ZIP is provided for this assignment only and must not be committed or published.

## Evaluation scenarios

| Case | Caller enters a paraphrase of… | Expected stage / behavior | What to verify |
|---|---|---|---|
| TC01 | The person listed no longer works at the company. | Opening | Suggested stage is Opening; mark wrong/moved contact and end without forcing the pitch. |
| TC02 | “What is this call about, and what does your company actually do?” | Purpose | Suggest Purpose; response guidance prioritizes a clear, direct explanation. |
| TC03 | The prospect is driving or in a meeting and asks for a callback later, with no firm follow-up time agreed. | Permission | Do not treat it as permission to continue now or as buying interest. |
| TC04 | The prospect describes what the company makes and corrects a mistaken assumption about its market. | Their business | Suggest Their business; caller can record the correction with a stage tap. |
| TC05 | The prospect describes a goal such as entering a new market or improving a product line. | Their need, in their words | Capture the words faithfully; AI must not add a problem or target the prospect did not state. |
| TC06 | The prospect says their current customers/business are sufficient and nothing new is needed. | Their need, in their words | Use the “no need” tap; do not manufacture a pain point or positive interest. |
| TC07 | The prospect says a group-level or internal team already handles this work. | Objection | Suggest Objection; note the existing solution without arguing. |
| TC08 | The prospect explicitly declines and asks not to be called again. | Objection / refusal handling | Respect the refusal; close-out must allow “Do not call,” not a positive outcome. |
| TC09 | The prospect asks for a written overview, names an email or WhatsApp channel, but does not agree to a meeting. | Next step when a concrete handoff is agreed | Outcome may be “Report / information agreed”; do not label it as a meeting or strong buying intent. |
| TC10 | The prospect proposes a specific day/time for a follow-up discussion or meeting. | Next step | Preserve the agreed timing in notes/follow-up; do not make up a date or calendar invite. |
| TC11 | The call ends because the audio/line fails mid-conversation. | Close | Allow the call to be saved as a connection issue, separate from a rejection. |
| TC12 | The prospect refused earlier, then ends with a polite “thanks, goodbye.” | Close + caller-reviewed outcome | Save the refusal at Objection, then save the final goodbye at Close. AI must retain the refusal outcome from the earlier stage rather than treat politeness as positive interest. |

## Regression checklist

- [ ] Start a new call with a fictional prospect and company.
- [ ] Move through all eight stages; tap and save a stage result at each stage.
- [ ] Navigate back and confirm saved prospect words and selected taps are restored.
- [ ] Refresh call history; cloud records remain available after refresh, or local demo records remain in the same browser.
- [ ] Ask the LLM to suggest a stage for TC02, TC03, TC06, TC08, TC09, TC10, and TC11. For TC12, save both the refusal and the later close before drafting the summary. Record whether the suggestion matches the expected behavior; low confidence is preferable to invented context.
- [ ] Run note cleanup on a rough note; compare the cleaned note against the original and reject any added facts.
- [ ] Draft a call summary and check that outcome and follow-up match the saved stage evidence.
- [ ] Simulate a backend save failure on a cloud-created call. The UI should show an error so the caller can retry; it must not report a successful cloud save.
- [ ] Close a call, confirm it appears in history, open it, and verify that completed-call edits are disabled.
- [ ] Confirm each saved record's selected outcome matches the transcript evidence rather than accepting caller-entered source labels blindly.

## Scoring the LLM manually

For each scenario, record: expected stage, predicted stage, whether the rationale cites the prospect's actual words, whether any fact was invented, and whether the suggested next move respects a refusal. Do not judge only by whether the request returned HTTP 200. The transcript source has no stage-boundary annotations, so use a human-reviewed expected label for each selected scenario and do not claim this is a fully labeled benchmark.
