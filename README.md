# Prompt Engineering Lab

A hands-on lab exploring prompt engineering techniques and RAG (Retrieval-Augmented Generation) pipelines using the OpenAI API and Supabase.

---

## Week 1 — Prompt Engineering Fundamentals

> Full notes: [week1/README.md](week1/README.md)

Covers the core levers for controlling LLM output — prompt structure, sampling parameters, and conversation management.

| Exercise | Topic | Key insight |
|----------|-------|-------------|
| 01 | Roles & Prompt Control | System prompts cut tokens by ~80%; assistant pre-filling gives tightest output control |
| 02 | Zero/One/Few-shot | Few-shot examples are essential for ambiguous classification boundaries |
| 03 | Chain-of-Thought | "Think step by step" alone fixes multi-step reasoning errors |
| 04 | Structured JSON Output | Define schema + `temperature: 0` + defensive parsing for reliable structured output |
| 05 | Temperature | Use `0` for deterministic tasks, `0.7–1.0` for creative; never exceed `1.2` |
| 06 | Top-p Sampling | Tune temperature first; use low `top_p` only to suppress rare tokens |
| 07 | Max Tokens | `finish_reason: "length"` signals truncation — always log it in production |
| 08 | Presence & Frequency Penalties | Subtle levers; most useful in long-form generation, not short structured tasks |
| 09 | Streaming | `onToken` callback pattern maps directly to chat UI; buffer full text in parallel |
| 10 | Context Window | `prompt_tokens` grows every turn — implement summarisation or sliding window before hitting the limit |

---

## Week 2 — Embeddings, Vector Search & RAG

> Full notes: [week2/README.md](week2/README.md)

Covers semantic search, vector databases, and building a production-grade RAG pipeline with persistent storage.

| Exercise | Topic | Key insight |
|----------|-------|-------------|
| 01 | Inspect Embeddings | Embeddings are fixed-length float vectors; similar text produces similar vectors |
| 02 | Cosine Similarity | Measures angle between vectors — the standard metric for semantic similarity |
| 03 | In-memory Vector Store | Simple vector store: embed → store → search by cosine similarity |
| 04 | Fetch & Chunk Document | `chunkByParagraph` preserves semantic boundaries; `chunkBySize` works on any format |
| 05 | RAG Pipeline | Full pipeline: ingest → retrieve top-k chunks → inject context → LLM answers |
| 06 | Hallucination | Raw LLM confidently fabricates; RAG-grounded model correctly refuses out-of-scope questions |
| 07 | Persistent Ingest | Embed once, store in Supabase — idempotency guard prevents re-embedding costs |
| 08 | Persistent RAG Query | Query Supabase with pgvector; only 2 OpenAI API calls per question (embed + chat) |
| 09 | Interactive Chat CLI | `readline` loop + sliding-window history + `sources` command for transparent retrieval |

### RAG system overview

```
INGEST (once)
  document.txt → chunk → embed (OpenAI) → store in Supabase

QUERY (per question)
  question → embed (OpenAI) → vector search (pgvector) → build prompt → chat (OpenAI) → answer
```

### OpenAI API calls summary

| Phase | Calls | Notes |
|-------|-------|-------|
| Ingest | Embedding API only | Batched in groups of 20 |
| Query | Embedding API + Chat API | 2 calls per question; vector search runs in Supabase |

---

## Parameter Cheat Sheet

| Task | temperature | top_p | max_tokens | frequency_penalty | presence_penalty |
|------|-------------|-------|------------|-------------------|------------------|
| JSON extraction | 0 | default | tight | 0 | 0 |
| Classification | 0 | default | ~20 | 0 | 0 |
| Code generation | 0–0.3 | default | generous | 0 | 0 |
| Chat assistant | 0.7 | default | generous | 0.3 | 0 |
| Creative writing | 1.0–1.2 | 0.9 | generous | 0.6 | 0.3 |
