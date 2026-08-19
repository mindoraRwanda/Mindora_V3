# AI safety: handoff to the AI team and clinical lead

**Status: deferred by decision, not by oversight.** The crisis _alerting_ path
has been fixed (see [What was fixed](#what-was-fixed-2026-08)). The crisis
_detection and response_ layer has not, and is handed off here.

**The platform is testers-only until the items in
[What is still unsafe](#what-is-still-unsafe) are resolved.** That is the
condition the current deployment relies on.

Owners: AI team (detection model, evaluation) and Rulinda (clinical review,
escalation policy).

---

## Background

The AI companion routes every user message through a five-level pre-filter
before it reaches the model. Clinical review (Rulinda, August 2026) specified
the intended behaviour per level. Only Level 5 is implemented.

| Level | Meaning                        | Intended behaviour                                                                      | Implemented |
| ----- | ------------------------------ | --------------------------------------------------------------------------------------- | ----------- |
| 1     | General distress               | Normal conversation                                                                     | Yes         |
| 2     | Feeling like a burden          | Normal conversation                                                                     | Yes         |
| 3     | Passive thoughts of dying      | Supportive, safety-focused response + clinical flag                                     | **No**      |
| 4     | Suicidal or self-harm thoughts | Brief supportive reply + higher-priority clinical alert; no safety assessment by the AI | **No**      |
| 5     | Active plan or act in progress | Stop the AI, show crisis resources, alert a clinician                                   | Yes         |

Levels 3 and 4 are currently detected, flagged in the database, and then sent
to the model as ordinary messages. No clinician is alerted and no safety
response is shown.

Guiding principle from clinical review:

> The AI should detect, support and escalate; it should not replace a
> clinician's assessment.

---

## What is still unsafe

### 1. Levels 3 and 4 reach the model unhandled

A user writing "I want to kill myself" receives a normal conversational reply
and nobody is notified. This is the single reason the platform is
testers-only.

### 2. The keyword list has never been clinically reviewed

`apps/ai-integration-service/src/preFilter.ts` carries a warning to this
effect. It is exact-phrase substring matching, which has two structural
failures:

- **False negatives.** Anything phrased differently is missed. "I don't see
  the point of tomorrow" matches nothing.
- **False positives from negation.** `"I don't want to die"` contains the
  Level 3 phrase `"i want to die"` and is currently classified as Level 3.

Substring matching cannot distinguish passive from active ideation, or handle
ambiguity, because it has no notion of context. This needs replacing, not
tuning.

### 3. English only

Detection works only in English. Seeded therapists list Kinyarwanda, French
and Swahili, so users writing in those languages should be expected. Clinical
direction is that English is the launch scope and Kinyarwanda is the next
phase, with model training and clinical evaluation before crisis-sensitive
conversations are enabled in it.

**Open question for the frontend:** should the AI companion be gated to
English-language users until then? Currently nothing prevents a Kinyarwanda
speaker from using it, and their crisis disclosures would not be detected at
all.

---

## Constraint the AI team needs to resolve first

**We cannot instruct the external chatbot's tone.** Its API accepts only:

```
POST /auth/messages  { conversation_id, content }
```

There is no system-prompt, instruction, or safety-mode parameter. So "the AI
should move into a supportive, safety-focused response" is **not implementable
as specified**. The options:

| Option | Description                                                               | Trade-off                                                                                     |
| ------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **A**  | AI team adds a safety-instruction parameter                               | Cleanest; depends on their roadmap                                                            |
| **B**  | Do not call the model at L3/L4; return clinically-approved templated copy | Fully in our control, deterministic, reviewable by Rulinda. But it is not the AI "responding" |
| **C**  | Call the model normally, prepend safety framing to its reply              | Cheap, but the model's own text is unreviewed and may undercut the framing                    |

Our reading is that **B is closest to the stated principle**, because it makes
the safety response reviewable clinical copy rather than model output. This is
a clinical decision, not an engineering one, and is unresolved.

---

## What the detection layer needs

Per clinical direction, categories to cover:

- direct expressions of suicidal thoughts
- indirect expressions
- passive thoughts versus active intent
- self-harm disclosures
- ambiguous statements needing further assessment
- statements that must **not** trigger a crisis classification
- varied expressions of distress

Engineering asks:

1. **A labelled test corpus.** Clinically reviewed examples with expected
   levels, including negatives such as `"I don't want to die"`. We will wire it
   in as test fixtures so regressions are caught automatically.
2. **An evaluation method.** Precision and recall against that corpus, so the
   trade-off is visible rather than pass/fail. False negatives and false
   positives have very different costs here and should be reported separately.
3. **A decision on the classifier.** The existing chatbot backend already
   exposes an LLM-powered `/emotion` endpoint returning `intensity`,
   `reasoning` and `keywords`. It is not crisis-specific and is
   unauthenticated, so it is not usable as-is, but it suggests the AI team has
   classification infrastructure worth discussing.

The current keyword list should be treated as a **starting artifact for
review**, not a baseline to preserve.

---

## Framing note

Clinical direction is that the 1-5 scale is an **internal triage framework**,
not a validated clinical risk-assessment scale. C-SSRS is an assessment
protocol involving structured questions and clinical context, not a phrase
list.

Code comments referencing C-SSRS have been updated so they no longer imply the
filter implements it. Please keep that distinction in any future
documentation, UI copy, or investor/partner material.

---

## What was fixed (2026-08)

For context on what is and is not already handled.

- **The alert reaches a clinician.** `handleAi` in notification-service used to
  SMS the _patient_ "a counsellor will reach out shortly" while notifying no
  clinician, and was gated behind `SMS_ENABLED` (default off), so in practice a
  detected crisis produced no contact at all. Patient-directed messaging is
  removed; the clinician-facing alert queue in Admin Service is now the
  delivery path.
- **A crisis can no longer be lost.** The chat route previously returned before
  writing any database row, so a Level 5 disclosure existed only as a
  fire-and-forget RabbitMQ publish. A broker outage meant no record anywhere.
  Crisis detections are now written durably to `crisis_alerts` before the user
  is answered, with a sweeper retrying undelivered ones.
- **A Level 5 disclosure is recorded in the patient's history.** It previously
  was not, making the most serious thing a user can say the one thing absent
  from their record.
- **Acknowledgement is tracked.** `PUT /alerts/:id/acknowledge` records who
  saw an alert and when, separately from resolution, and audit-logs the
  seconds-to-acknowledge. This is the metric an escalation policy will be
  built against.
- **The crisis message wording** was replaced with Rulinda's copy. The
  previously hard-coded helpline numbers were removed pending verification.

### Not built, pending clinical policy

The escalation chain Rulinda described (primary on-call → backup → emergency
pathway, response-time targets, auto-escalation on non-acknowledgement,
after-hours coverage) is **not implemented**. Acknowledgement tracking is the
foundation for it, but there is no roster, no timers, and no auto-escalation.

It needs from clinical: who is in the chain, response-time targets per level,
and after-hours arrangements.

It needs from ops, and these have procurement lead time that should start
before they become blocking:

- **Resend** still sends from its shared test domain, which only delivers to a
  verified address. A clinical inbox needs domain verification.
- **Africa's Talking** is on a sandbox username, which reaches only simulator
  numbers. Real SMS needs a production account and a registered sender ID for
  Rwanda.

Until one of those exists, in-app is the only channel that can reach a
clinician, and it is pull-based: it works only while somebody is looking at
the queue.
