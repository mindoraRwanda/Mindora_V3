# AI companion: engineering backlog

Known gaps in the chatbot integration. None of these block the testers-only
demo. The launch gate is the safety work in
[`ai-safety-handoff.md`](./ai-safety-handoff.md), which is owned by the AI team
and the clinical lead, not by this list.

Ordered by when they need attention, not by size.

---

## 1. A 20-25 second wait with no feedback

**Priority: do the cheap half before any user testing.**

The AI team's own documentation cites 20-25s latency for the chat pipeline,
and we use the non-streaming endpoint (`POST /auth/messages`), so the user
gets nothing at all until the full reply arrives. Our client timeout is 45s to
accommodate this.

Someone typing something vulnerable and watching a blank screen for 25 seconds
is a real experience problem, not a cosmetic one.

**Recommended first step (frontend, cheap):** a typing indicator with an honest
affordance — "this can take up to 30 seconds" — rather than a spinner that
implies imminence. Do this before deciding anything else.

**Only if the wait still tests badly (backend + gateway, non-trivial):** the
chatbot exposes `POST /auth/messages/stream`, which streams the reply
token-by-token over Server-Sent Events. Adopting it requires:

- Kong buffers proxied responses by default, which breaks SSE. That route
  needs proxy buffering disabled.
- A real SSE parser on our side. `fetch`/`axios` treating it as JSON will not
  work: the response is `text/event-stream`, one JSON payload per `data:` line.
- Concatenating `token` values as they arrive, and handling the terminating
  `{"done": true, ...}` event including the case where `id` is `null`.
- Re-emitting the stream to our own client, since the pre-filter has to run
  before anything reaches the model.

Do not start the streaming work on the assumption it is needed. Measure the
typing indicator first.

---

## 2. `chatbot_user_id` on pre-existing production rows

**Priority: one-line check before launch.**

`provisionAccount` previously wrote the Mindora user id into
`chatbot_accounts.chatbot_user_id`, discarding the id the chatbot's own
`/auth/signup` returned. Fixed for newly provisioned accounts.

Dev had zero rows so there was nothing to migrate. **If production already has
`chatbot_accounts` rows, they still hold the wrong value.**

This is a correctness and traceability problem, not a functional break —
nothing reads that column today. But it means you cannot currently correlate a
Mindora patient with their record on the chatbot side, which matters for
support and for any data-deletion request that needs verifying.

Check before launch:

```sql
SELECT COUNT(*) FROM chatbot_accounts WHERE chatbot_user_id = mindora_user_id;
```

A non-zero count means those rows predate the fix. Backfilling needs a lookup
against the chatbot API per account, so if the count is small it may be
simpler to let those accounts be re-provisioned than to write a migration.

---

## 3. No local development story

**Priority: raise with the AI team; not urgent for us.**

There is no mock or local chatbot. Working on `ai-integration-service`
requires the AI team's **production** Railway backend to be reachable, which
has two consequences:

- We cannot develop or run integration tests offline.
- Our development traffic hits their production system, adding load and
  polluting whatever analytics they collect.

Note the current test suite does *not* hit the live backend — `fetch` is
mocked throughout `chatbotClient.test.ts`. This gap is about running the
service, not about tests.

**Suggested fix:** a recorded-fixture mock (capture real responses once, replay
them locally) behind a `THERAPY_CHATBOT_BASE_URL` pointing at a local stub.
Cheap for us to build, but worth asking the AI team first whether they intend
to provide a staging environment, which would be better.

---

## 4. Voice is not integrated, and should stay that way for now

**Priority: keep out of scope until the detection rebuild lands.**

`POST /voice/messages` exists on the chatbot side and nothing in this repo
calls it.

**Do not treat this as a missing feature to pick up.** It is a safety hole if
added naively: the user speaks, the audio goes to the chatbot, and **the
transcript is produced on their server and never returned to us**. Our
pre-filter has nothing to inspect, so a spoken crisis disclosure would be
entirely unscreened — worse than the current text gap, because it bypasses
detection completely rather than merely mishandling levels 3 and 4.

Two further notes if it is ever picked up:

- The voice endpoint has no rate limit of its own, and transcription is
  CPU-heavy on their side.
- The response does not include what the user said, only the bot's reply. Any
  "you said…" UI would need a separate transcript source.

Prerequisite: the detection layer must be able to screen transcribed speech,
which means either the chatbot returns the transcript to us before generating
a reply, or detection moves to their side. That is a conversation to have with
the AI team, not something to build around.
