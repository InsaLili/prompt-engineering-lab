# Prompt Engineering Lab

## Exercise 01 — Roles & Prompt Control

All three tests ask the model the same question: _"Write a debounce function."_
The only difference is how much instruction is given upfront.

|                       | No system prompt                                                   | System prompt                                  | Pre-filled assistant turn       |
| --------------------- | ------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------- |
| **Output**            | Prose intro, full code block, section headers, closing explanation | Code only with brief inline comments, no prose | Bare code block, no explanation |
| **Tone**              | Tutorial-style, verbose                                            | Professional, terse                            | Minimal                         |
| **Completion tokens** | 376                                                                | 77                                             | 51                              |
| **Total tokens**      | 388                                                                | 120                                            | 82                              |

### Key takeaways

- **No system prompt** — The model defaults to a helpful-assistant persona: it defines the concept, shows code, and explains every line. Good for beginners; wasteful for production pipelines.
- **System prompt** — Assigning a role ("senior JS engineer") and constraining the output format cuts completion tokens by ~80%. The code is equivalent in quality, just stripped of all ceremony.
- **Pre-filled assistant turn** — Starting the assistant reply with ` ```js\n ` forces the model to continue a code block immediately, skipping any preamble it might still produce under a system prompt alone. This is the most token-efficient approach (51 completion tokens) and gives tightest control over output format.

> **Rule of thumb:** add a role + constraint system prompt as a baseline; use assistant pre-filling when you need guaranteed output structure with zero prose overhead.

---

## Exercise 02 — Zero-shot, One-shot, Few-shot

All three tests classify the same ambiguous review:
_"The product arrived late and works ok, nothing remarkable."_

|                               | Zero-shot | One-shot          | Few-shot                           |
| ----------------------------- | --------- | ----------------- | ---------------------------------- |
| **Examples given**            | 0         | 1 (positive only) | 4 (positive, negative, neutral ×2) |
| **Result (simple review)**    | Neutral   | neutral           | neutral                            |
| **Result (ambiguous review)** | Negative  | negative          | neutral                            |

The second review variant — _"arrived late and works normal, nothing remarkable"_ — is the interesting case. Its mixed signals (late delivery = bad, functional = ok) caused zero-shot and one-shot to tip negative, while few-shot correctly held neutral.

### Key takeaways

- **Zero-shot** — Works for clear-cut cases but drifts on ambiguous input. With no examples to anchor the label space, the model weighs negative signals (late delivery) more heavily than neutral ones.
- **One-shot** — A single positive example establishes the format but doesn't help the model calibrate the boundary between negative and neutral. Result matches zero-shot on the hard case.
- **Few-shot** — Four examples that explicitly cover the "mixed/mediocre" case anchor the neutral label correctly. The model follows the demonstrated pattern rather than relying on its priors.

> **Rule of thumb:** zero-shot is fine for unambiguous tasks; add examples whenever the label boundaries are fuzzy or the output format needs to be strict. Cover edge cases in your examples — the model will generalise from what you show it.

---

## Exercise 03 — Chain-of-Thought (CoT)

All three tests solve the same multi-step word problem:
_3 shelves × 4 boxes × 6 items; 2 shelves full, 3rd half full. Total items?_
The correct answer is **60**.

|                        | Direct                       | Chain-of-Thought                                  | Structured CoT                                                  |
| ---------------------- | ---------------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| **Prompt instruction** | "Answer with just a number." | "Think step by step, then give the final number." | System prompt defines a strict `Step N: / Final answer:` format |
| **Answer**             | 54 (wrong)                   | 60 (correct)                                      | 60 (correct)                                                    |
| **Reasoning visible**  | No                           | Yes — free-form numbered steps                    | Yes — compact, templated steps                                  |

The direct prompt got **54**, which is `(2 × 4 + 1) × 6` — the model counted the half-full shelf as 1 box instead of 2, a classic rushing error when no reasoning is shown.

### Key takeaways

- **Direct** — Asking for just the answer forces the model to collapse a multi-step calculation into one token prediction. It skips the intermediate accounting and makes an off-by-one error on the half-shelf.
- **Chain-of-thought** — The phrase _"think step by step"_ is enough to unlock correct reasoning. The model explicitly counts 8 + 2 = 10 boxes before multiplying by 6, arriving at 60.
- **Structured CoT** — A system-prompt template constrains the reasoning into a fixed format (`Step 1 / Step 2 / Final answer`). Same accuracy as free CoT, but the output is predictable and easier to parse programmatically.

> **Rule of thumb:** for any problem requiring more than one calculation, always elicit reasoning before the answer. Use free CoT for exploration; use structured CoT when the output feeds downstream code or needs to be audited.

---

## Exercise 04 — Structured JSON Output

Four reviews are classified in parallel using a single system prompt that enforces a strict JSON schema. No markdown, no backticks — raw JSON only, parsed directly with `JSON.parse`.

| Review                                                     | sentiment | confidence | key_emotion  |
| ---------------------------------------------------------- | --------- | ---------- | ------------ |
| "Absolutely love this product, arrived ahead of schedule!" | positive  | 0.95       | joy          |
| "Terrible quality. Broke after two days."                  | negative  | 0.95       | frustration  |
| "It's fine. Does what it says, nothing remarkable."        | neutral   | 0.75       | indifference |
| "Late delivery but the item itself is great."              | mixed     | 0.85       | frustration  |

### Key takeaways

- **Schema in the system prompt** — Declaring the exact field names, types, and allowed values (`"positive" | "negative" | "neutral" | "mixed"`) is what prevents the model from inventing fields or wrapping output in markdown code fences.
- **`temperature: 0`** — Deterministic output matters for structured data. Higher temperatures increase the chance of malformed JSON or value drift across runs.
- **`mixed` sentiment** — Because the schema explicitly listed `"mixed"` as an option, the model correctly applied it to the ambiguous review (bad delivery, good item) instead of forcing a binary call. The label space you define shapes the output you get.
- **Defensive parsing** — Even with strict instructions, wrapping `JSON.parse` in a `try/catch` is essential; models can still emit invalid JSON under edge cases or token limits.
- **Parallel execution** — Running all four requests with `Promise.all` cuts wall-clock time to the slowest single request rather than the sum of all four.

> **Rule of thumb:** treat the model as an API by defining your schema upfront, setting temperature to 0, and always parsing defensively. The more explicit the schema, the more reliable the output.

---

## Exercise 05 — Temperature

The same prompt (_"Suggest a startup idea in one sentence."_) is run 3 times at four different temperatures to observe how randomness affects output diversity and stability.

| Temperature | Behaviour                                                    | Example outputs                                                                                                          |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **0**       | Near-identical across all 3 runs                             | All three produced the same "subscription platform connecting local artisans" idea, with only minor word-level variation |
| **0.5**     | Still very consistent; slight phrasing variation             | Same artisan-platform concept dominates, small additions ("community-building events")                                   |
| **1.0**     | Noticeably more diverse; different ideas start appearing     | Mix of artisan platform and sustainable grocery/subscription box ideas                                                   |
| **1.8**     | Chaotic — one run produced garbled, multilingual token noise | Coherent ideas mixed with a completely broken output containing random Unicode and corrupted tokens                      |

### Key takeaways

- **Temperature 0** locks the model onto its highest-probability completion. Useful for deterministic tasks (JSON output, code, classification) but will give the same answer every time — no creative variation.
- **Temperature 0.5** is a safe middle ground: output stays coherent and mostly consistent, with just enough variation for slightly different phrasings or angles.
- **Temperature 1.0** is the default for most APIs. Diversity increases meaningfully — different ideas appear across runs — while output remains grammatically sound and sensible.
- **Temperature 1.8** breaks the model. At least one run produced corrupted output: mixed languages, garbled tokens, and nonsense fragments. This is past the useful range for any production task.

> **Rule of thumb:** use `0` for structured/deterministic output, `0.7–1.0` for creative or generative tasks, and never exceed `1.2` in production — higher values risk incoherent output without meaningful creative gain.

---

## Exercise 06 — Top-p (Nucleus Sampling)

The same prompt (_"Write the opening line of a thriller novel."_) is run at fixed `temperature: 1` with three different `top_p` values to isolate the effect of nucleus sampling on vocabulary range.

| top_p   | Token pool                       | Output                                                                                                                                                                                        |
| ------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0.1** | Top ~10% probability tokens only | "The rain fell in sheets, masking the sound of footsteps that crept closer, each heartbeat echoing like a warning in the darkness."                                                           |
| **0.5** | Top ~50% probability tokens      | "The rain pounded against the pavement like a thousand frantic hearts, drowning out the sound of footsteps that followed her into the darkness."                                              |
| **1.0** | All tokens (default)             | "The rain hammered against the window like the frantic heartbeat of someone trapped inside a nightmare, each drop a countdown to the moment the truth would finally emerge from the shadows." |

### Key takeaways

- **top_p: 0.1** — Only the most probable tokens are eligible. Output is clean and competent but plays it safe: short sentence, familiar thriller imagery (rain, footsteps, darkness).
- **top_p: 0.5** — A wider token pool introduces more expressive word choices ("pounded", "frantic hearts") while staying coherent. The sentence is richer without feeling forced.
- **top_p: 1.0** — The full vocabulary is on the table. The model produces the most elaborate and layered sentence — extended metaphor, nested imagery, longer structure — but also the hardest to control at scale.
- All three outputs share the same core motif (rain at night, someone being followed), which shows the underlying high-probability concept doesn't change — only the _expressiveness_ of how it's rendered.
- **top_p vs temperature** — Temperature scales the entire probability distribution (higher = flatter); top_p cuts off the tail after a cumulative probability threshold. They're complementary: temperature controls boldness, top_p controls vocabulary range.

> **Rule of thumb:** leave `top_p` at `1.0` by default and tune temperature first. Reach for lower `top_p` (0.1–0.3) only when you want to suppress rare/unusual tokens — e.g. strict domain language or consistent brand voice. Don't adjust both temperature and top_p at the same time.

---

## Exercise 07 — Max Tokens

The same prompt (_"Explain how the internet works. explain in 3 bullet points"_) is run with two different `max_tokens` limits to observe how the budget affects completeness and the `finish_reason` signal.

|                   | max_tokens: 50                                                  | max_tokens: 500                                                                  |
| ----------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **finish_reason** | `length`                                                        | `stop`                                                                           |
| **Output**        | Cut off mid-sentence inside a bullet point on data transmission | Three complete bullet points covering Data Transmission, Infrastructure, and DNS |

### Key takeaways

- **`finish_reason: "length"`** is the critical signal — the model hit the token budget before finishing. At 50 tokens it cuts off mid-sentence, mid-bullet, producing broken output that can silently corrupt downstream parsing.
- **`finish_reason: "stop"`** means the model reached a natural end point — this is what you want. At 500 tokens the model delivered a concise, complete three-bullet summary and stopped cleanly.
- The prompt explicitly asked for 3 bullet points, which kept the 500-token response concise enough to finish cleanly. This is the right pattern: **constrain scope in the prompt, use `max_tokens` as a safety cap** — not the other way around.
- **Cost control vs completeness** — `max_tokens` is a cost and latency guard, not a formatting tool. Pair it with prompt-level scope guidance ("in 3 bullet points", "in one paragraph") so the model knows how much to write before it starts.

> **Rule of thumb:** always log `finish_reason` in production. If you see `"length"`, either raise the budget or tighten the prompt scope. Never silently swallow a truncated response.

---

## Exercise 08 — Presence & Frequency Penalties

The same prompt (_"Write 5 tips for staying productive when working from home."_) is run at `temperature: 0.7` with penalties off vs both penalties at `0.6`.

|                       | No penalty                        | With penalty (0.6 each)                               |
| --------------------- | --------------------------------- | ----------------------------------------------------- |
| **presence_penalty**  | 0                                 | 0.6 — discourages revisiting topics already mentioned |
| **frequency_penalty** | 0                                 | 0.6 — discourages reusing the same words              |
| **Tip 1**             | "Establish a Dedicated Workspace" | "Create a Dedicated Workspace"                        |
| **Tip 2**             | "Set a Routine and Stick to It"   | "Establish a Routine"                                 |
| **Tip 3**             | "Use Time Management Techniques"  | "Limit Distractions"                                  |
| **Tip 4**             | "Limit Distractions"              | "Use Time Management Techniques"                      |
| **Tip 5**             | "Stay Connected with Colleagues"  | "Stay Connected with Colleagues"                      |

### Key takeaways

- **Minimal visible difference here** — both runs produced the same five topics in nearly the same order. For a well-defined list prompt like this, the model's strong prior on "good WFH tips" dominates; penalties don't override topic selection.
- **`presence_penalty`** reduces the chance the model circles back to a concept it already covered. Most useful in long-form generation where the model might repeat an idea paragraphs later.
- **`frequency_penalty`** reduces repetition of specific words and phrases. Useful when output feels lexically monotonous (e.g. every bullet starting with "Make sure to...").
- **Penalties are subtle levers** — they nudge the token probability distribution, they don't rewrite the model's knowledge. For a short, structured task like a 5-item list, the effect is minimal. Their value becomes more apparent in longer, open-ended generation.
- **Don't stack high values** — both penalties at 0.6 is already moderate. Pushing both to 1.0+ can produce awkward phrasing as the model avoids natural word reuse.

> **Rule of thumb:** leave both penalties at 0 by default. Add `frequency_penalty: 0.3–0.5` if output feels repetitive in word choice; add `presence_penalty: 0.3–0.5` if the model keeps looping back to the same ideas in long outputs. Never set either above 1.0.

---

## Exercise 09 — Streaming

Rather than using the shared `chat()` helper, this exercise calls the OpenAI API directly with `stream: true` and processes the raw Server-Sent Events (SSE) stream using the Fetch API.

### Key takeaways

- **`onToken` is the real-world chat UI pattern** — each token fires a callback that appends to the display. In a browser this maps directly to appending a text node or updating a React state; `process.stdout.write(token)` is the terminal equivalent. This is the exact pattern to use when building a chat interface.
- **Perceived latency** — streaming makes responses feel instant; the first token renders in milliseconds rather than waiting for the full completion. Critical for chat UIs and long outputs.
- **Tokens ≠ characters ≠ words** — the result shows numbers fusing (`78`, `910`, `171819`) because multiple tokens arrived in the same SSE chunk. `onToken` fires per chunk delivery, not strictly per model token.
- **`fullText` accumulation** — streaming doesn't prevent you from having the complete response; you build it incrementally and return it at the end for storage or further processing.
- **Error handling** — partial JSON chunks are inevitable. The `try/catch` inside the loop is not optional; without it a split chunk crashes the parser and drops the rest of the stream.

> **Rule of thumb:** use the `onToken` callback pattern for any user-facing interface — wire each token directly to a UI append event. Buffer the full text in parallel for persistence. Always handle partial chunk parse errors silently.

---

## Exercise 10 — Context Window & Conversation History

A 5-turn conversation is built by appending every user and assistant message to a `history` array and resending the full array on every call. Token usage is logged after each turn.

| Turn | User message | prompt_tokens | completion_tokens | total_tokens |
|---|---|---|---|---|
| 1 | "My name is Alex." | 12 | 14 | 26 |
| 2 | "I'm building an AI-powered recipe app." | 42 | 55 | 97 |
| 3 | "The app should suggest recipes based on ingredients the user has." | 117 | 500 | 617 |
| 4 | "It should also track dietary restrictions." | 632 | 500 | 1132 |
| 5 | "What name should I call it?" | 1147 | 374 | 1521 |
| Memory test | "What's my name and what am I building?" | ~1568 | — | 1568 |

**Memory test result:** the model correctly recalled both Alex's name and the app description from turn 1 — because the full history was still in the prompt.

### Key takeaways

- **`prompt_tokens` grows with every turn** — because the entire conversation history is resent each time. Turn 1 costs 12 prompt tokens; by turn 5 it's 1,147. This is the core mechanic behind context window limits.
- **The model only "remembers" what's in the prompt** — there is no persistent memory between API calls. Memory works here solely because the history array is passed in full. Remove it and the model forgets everything.
- **Truncated responses (turns 3 & 4)** — both hit the default `max_tokens` cap of 500 and returned `⚠️ Response was truncated`. The verbose replies inflated the history, accelerating prompt token growth in subsequent turns.
- **Context window exhaustion** — at scale, prompt tokens will eventually hit the model's limit (128k for gpt-4o-mini). Strategies to manage this:
  - **Summarisation** — replace old turns with a compressed summary
  - **Sliding window** — drop the oldest turns once a threshold is reached
  - **Retrieval** — store history externally and fetch only relevant turns

> **Rule of thumb:** log `prompt_tokens` per turn in production. If you see it growing unboundedly, implement a summarisation or sliding-window strategy before you hit the context limit — not after.
