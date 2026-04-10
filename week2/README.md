# Week 2 — Embeddings, Vector Search & RAG

---

## Exercise 01 — Inspect Embeddings

Calls the OpenAI Embedding API directly to understand what an embedding actually is.

```js
model: 'text-embedding-3-small'
input: 'The quick brown fox jumps over the lazy dog'
```

### Results

```
Model: text-embedding-3-small
Dimensions: 1536
First 5 values: [-0.0208, -0.0169, -0.0045, -0.0508, -0.0259]
Token usage: { prompt_tokens: 9, total_tokens: 9 }
```

### Key takeaways

- An embedding is a **fixed-length array of 1536 floats** — a point in high-dimensional space representing the meaning of the text
- The raw values are meaningless on their own; what matters is the **distance between vectors**
- Embedding is cheap — 9 tokens costs almost nothing; the expensive step is storing and searching at scale

---

## Exercise 02 — Cosine Similarity

Embeds text pairs in a single batch call and computes cosine similarity to verify that the embedding model captures semantic meaning.

### Results

```
0.559  "dog" vs "puppy"
0.761  "I love pizza" vs "Pizza is my favourite food"
0.686  "The car broke down" vs "The vehicle stopped working"
0.329  "dog" vs "rocket"
0.081  "I love pizza" vs "The stock market crashed"
0.117  "machine learning" vs "medieval history"
0.432  "bank" vs "river bank"
0.698  "bank" vs "financial bank"
```

### Key takeaways

- **Semantically close pairs score high (0.6–0.76)** even when worded differently — the model captures meaning, not just keywords
- **Unrelated pairs score low (0.08–0.33)** — useful as a natural threshold for filtering irrelevant results
- **Ambiguous words** ("bank"): `river bank` scores 0.432 vs `financial bank` at 0.698 — the model picks up context from surrounding words even in short phrases
- **Batch embedding** (`embedBatch`) is always preferred — one API call for all texts instead of N calls

---

## Exercise 03 — In-memory Vector Store

Builds a 20-fact knowledge base about JavaScript, stores it in a `VectorStore`, and runs 5 semantic queries.

### Results

```
Query: "Who invented JavaScript?"
  1. [0.638] JavaScript was created by Brendan Eich in 1995 in just 10 days.
  2. [0.525] The JavaScript specification is maintained by TC39 as ECMAScript.
  3. [0.509] Node.js was released in 2009 by Ryan Dahl...

Query: "How does JavaScript handle inheritance?"
  1. [0.690] The prototype chain is JavaScript's mechanism for inheritance.
  2. [0.469] Closures in JS allow functions to remember the scope...
  3. [0.453] The JavaScript specification is maintained by TC39...

Query: "What is the best framework for building web apps?"  ← no direct answer
  1. [0.426] Service Workers enable Progressive Web Apps...
  2. [0.361] Next.js is a React framework created by Vercel...
  3. [0.343] WebAssembly (WASM) allows languages like Rust and C++...
```

### Key takeaways

- Direct questions with clear matches score **0.6+**; indirect or unanswerable questions score **below 0.43**
- The score threshold (~0.5) is a useful signal for deciding whether to answer or refuse
- The in-memory store is simple but **lost on process exit** — exercises 07/08 solve this with Supabase

---

## Exercise 04 — Fetch & Chunk Document

Two parts: fetch a full Wikipedia article and compare two chunking strategies on it.

**04-fetch-doc.js** — fetches the "Large Language Model" Wikipedia article via the API and saves it to `data/document.txt`.

**04-chunking.js** — compares fixed-size vs paragraph chunking on the saved document.

### Results

| Strategy | Chunks | Avg length |
|----------|--------|------------|
| Fixed-size (500 chars, 50 overlap) | more | ~500 chars |
| Paragraph (max 800 chars) | 118 | shorter |

### Key takeaways

- **Fixed-size** (`chunkBySize`): simple, predictable, works on any format. The 50-char overlap prevents answers from being split across a boundary. Downside: cuts mid-sentence.
- **Paragraph** (`chunkByParagraph`): respects natural boundaries — better semantic coherence, better retrieval quality. Used in all subsequent exercises.
- Chunks shorter than 50 chars are dropped by both strategies (headings, whitespace noise)

---

## Exercise 05 — RAG Pipeline (in-memory)

End-to-end RAG pipeline using the in-memory `VectorStore`. Ingests the Wikipedia document and answers 5 test questions.

### How it works

```
document.txt → chunkByParagraph → VectorStore (embed + store in RAM)
question → embed → cosine search top-3 → inject context → chat (temperature=0) → answer
```

### Results

| Question | Behaviour | Top score |
|----------|-----------|-----------|
| What is a large language model? | Accurate, detailed | 0.700 |
| How are LLMs trained? | Accurate, brief | 0.675 |
| What are the limitations of LLMs? | Partial — assembled from scattered chunks | 0.673 |
| What is the current price of NVIDIA stock? | "I don't have enough information..." | 0.212 |
| Who is the CEO of OpenAI? | "I don't have enough information..." | 0.406 |

### Key takeaways

- Scores **above ~0.65** reliably produce accurate answers from relevant chunks
- Scores **below ~0.4** indicate the document doesn't contain the answer — the "never invent facts" system prompt correctly triggers a refusal
- Every run re-embeds the document from scratch — the costly limitation fixed in exercise 07

---

## Exercise 06 — Hallucination Comparison

Side-by-side comparison: raw LLM (no context) vs RAG-grounded pipeline on questions the document cannot answer.

### Test questions

1. "What will LLMs be capable of in 2030?" — speculative future
2. "Which LLM has the highest IQ?" — nonsensical metric
3. "Is GPT-4 better than Claude?" — subjective comparison not in document

### Results

| | Raw LLM (`temperature=0.7`) | RAG grounded |
|-|---|---|
| LLMs in 2030? | Generates 11 confident bullet points about future capabilities | "I don't have enough information..." |
| Highest IQ LLM? | Explains why IQ doesn't apply to LLMs — sounds reasonable but is fabricated framing | "I don't have enough information..." |
| GPT-4 vs Claude? | Compares both models with authoritative-sounding claims | "I don't have enough information..." |

### Key takeaways

- **Raw LLM hallucinates confidently** — even when it hedges ("I can't predict with certainty"), it still produces speculative content users may treat as fact
- **RAG prevents hallucination** by grounding the model in a specific document and refusing when context is insufficient
- The tradeoff: RAG trades **coverage** for **reliability** — it won't answer what the document doesn't contain

---

## Exercise 07 — Persistent Ingestion (Supabase)

Upgrades from in-memory storage to a persistent Supabase database so documents only need to be embedded once.

### How it works

```
document.txt
  → chunkByParagraph()      118 chunks (max 800 chars)
  → embedBatch() ×6         OpenAI Embedding API, batches of 20
  → supabase.insert()       { content, embedding, metadata } into documents table
```

### Idempotency guard

```
node 07-ingest.js           → skips if DB already has rows (saves API cost)
node 07-ingest.js --force   → clears DB and re-ingests from scratch
```

### Results

```
Chunking complete: 118 chunks
Stored chunks 1–20 of 118
Stored chunks 21–40 of 118
...
Stored chunks 101–118 of 118
Ingestion complete in 4.9s
Total chunks in database: 118
```

### Key takeaways

- Embedding is the **expensive step** — do it once, persist the result
- Batching in groups of 20 avoids OpenAI rate limit errors
- No LLM call during ingestion — only the Embedding API is used

---

## Exercise 08 — Persistent RAG Query (Supabase)

Queries the already-ingested Supabase database. No re-ingestion — data is loaded once and reused across sessions.

```js
rag.loaded = true; // skip ingest, data is already in Supabase
```

### Full system flow

```
┌─────────────────────────────────────────────────────────┐
│                  PHASE 1: INGEST (once)                  │
│                                                          │
│  document.txt                                            │
│       │                                                  │
│       ▼                                                  │
│  chunkByParagraph()  ──►  ~118 paragraph chunks          │
│       │                                                  │
│       ▼                                                  │
│  embedBatch()        ──►  OpenAI Embedding API           │
│  (batches of 20)          text-embedding-3-small         │
│       │                                                  │
│       ▼                                                  │
│  supabase.insert()   ──►  documents table                │
│                           { content, embedding,          │
│                             metadata }                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               PHASE 2: QUERY (every question)            │
│                                                          │
│  User question                                           │
│       │                                                  │
│       ▼                                                  │
│  embed()             ──►  OpenAI Embedding API           │
│                           convert question to vector     │
│       │                                                  │
│       ▼                                                  │
│  match_documents()   ──►  Supabase SQL function          │
│  (pgvector)               cosine similarity search       │
│                           returns top-k chunks           │
│                           where similarity > threshold   │
│       │                                                  │
│       ▼                                                  │
│  Build prompt                                            │
│  ┌─────────────────────────────────┐                     │
│  │ System: Answer ONLY from context│                     │
│  │ [Source 1] chunk text...        │                     │
│  │ [Source 2] chunk text...        │                     │
│  │ [Source 3] chunk text...        │                     │
│  │ User: {question}                │                     │
│  └─────────────────────────────────┘                     │
│       │                                                  │
│       ▼                                                  │
│  chat()  temperature=0  ──►  OpenAI Chat API             │
│                               deterministic answer       │
│       │                                                  │
│       ▼                                                  │
│  { answer, sources, tokensUsed }                         │
└─────────────────────────────────────────────────────────┘
```

### The `match_documents` SQL function (Supabase)

The cosine similarity search runs entirely inside the database via a pgvector SQL function:

```sql
create or replace function match_documents (
  query_embedding vector(1536),      -- question vector (1536 dims)
  match_count int default 3,         -- return top-k chunks
  match_threshold float default 0.3  -- minimum similarity score
)
returns table (id, content, metadata, similarity)
as $$
  select
    id, content, metadata,
    1 - (embedding <=> query_embedding) as similarity  -- distance → similarity
  from documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding   -- closest first (uses vector index)
  limit match_count;
$$;
```

- `<=>` is pgvector's cosine distance operator (0 = identical, 2 = opposite)
- `1 - (<=>)` converts distance to similarity (1 = identical, −1 = opposite)
- Filtering by `match_threshold` before returning prevents irrelevant chunks from reaching the LLM

### OpenAI API calls per query

| Step | API | Notes |
|------|-----|-------|
| Embed the question | Embedding API | 1 call per question |
| Generate answer | Chat API (`temperature=0`) | 1 call per question |
| Similarity search | **None** — runs in Supabase | pgvector handles this |

### Sample results

| Question | Answer quality | Top score |
|----------|---------------|-----------|
| What is a large language model? | Accurate, detailed | 0.700 |
| How are LLMs trained? | Accurate, brief | 0.675 |
| What are the limitations of LLMs? | Partial — assembled from scattered chunks | 0.673 |
| What is the current price of NVIDIA stock? | "I don't have enough information..." | 0.212 |

### Key takeaways

- **Separate ingest from query** — run `07-ingest.js` once; `08-query-persistent.js` reuses the stored data
- **Supabase replaces in-memory store** — data survives process restarts, scales to large document sets
- **pgvector does the heavy lifting** — cosine similarity computed in SQL, no JS math needed
- **Score threshold matters** — scores below ~0.4 reliably indicate the document doesn't contain the answer

---

## Exercise 09 — Interactive Chat CLI

Wraps the persistent RAG pipeline in a full terminal chat interface using Node's `readline` module, adding conversation memory and interactive commands.

### How it works

```
User input (readline)
  → command check ('exit', 'clear', 'sources')
  → rag.query(input, { k: 3, history: last 10 turns })
  → print answer + source count + token usage
  → append turn to history[]
```

### Commands

| Command | Effect |
|---------|--------|
| `exit` | Quit |
| `clear` | Reset conversation history |
| `sources` | Show full text of chunks retrieved in the last query |

### Key takeaways

- **Conversation history accumulates** — each turn is appended to a `history` array and passed to `rag.query`. The model can reference earlier turns ("What did I just ask about?") because they're in the prompt.
- **Sliding window caps context growth** — only the last 10 turns are passed (`history.slice(-MAX_HISTORY)`), preventing unbounded prompt token growth as the session continues.
- **`sources` command** — lets you inspect exactly which chunks were retrieved and at what similarity score. Essential for debugging why an answer is wrong or incomplete.
- **`rl.setPrompt` + `rl.prompt()`** — the readline pattern for async interactive CLIs: pause after input, await the async handler, then re-prompt. Keeps the UI responsive without blocking the event loop.
- **Terminal colour codes** — ANSI escape sequences (`\x1b[32m` etc.) differentiate roles visually at no cost. The `c` object keeps them readable and centralised.

> **Rule of thumb:** for a production chat CLI, combine a sliding-window history (to cap tokens) with a `sources` command (to make retrieval transparent). Both are cheap to add and make the system dramatically easier to debug and trust.
