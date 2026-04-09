// lib/rag.js
import { VectorStore } from './embeddings.js';
import { chat } from './llm.js';
import { chunkByParagraph } from './chunker.js';

export class RAGPipeline {
  constructor() {
    this.store = new VectorStore();
    this.loaded = false;
  }

  // Ingest a document: chunk it, embed all chunks, store them
  async ingest(text, metadata = {}) {
    const chunks = chunkByParagraph(text, 800);
    console.log(`Ingesting ${chunks.length} chunks...`);

    await this.store.addBatch(
      chunks,
      chunks.map((_, i) => ({ ...metadata, chunkIndex: i })),
    );

    this.loaded = true;
    console.log(`Done. ${this.store.size()} chunks indexed.`);
    return chunks.length;
  }

  // Answer a question using retrieved context
  async query(question, options = {}) {
    if (!this.loaded) throw new Error('No document ingested yet.');

    const k = options.k ?? 3;

    // Step 1: retrieve top-k relevant chunks
    const retrieved = await this.store.search(question, k);

    // Step 2: build context string from retrieved chunks
    const context = retrieved
      .map(
        (r, i) =>
          `[Source ${i + 1}] (relevance: ${r.score.toFixed(2)})\n${r.text}`,
      )
      .join('\n\n');

    // Step 3: build the prompt with context injected
    const messages = [
      {
        role: 'system',
        content: `You are a precise question-answering assistant.
Answer the user's question using ONLY the provided context below.
If the context does not contain enough information to answer, say:
"I don't have enough information in the provided document to answer that."
Never invent facts. Never use knowledge outside the context.

Context:
${context}`,
      },
      {
        role: 'user',
        content: question,
      },
    ];

    // Step 4: generate the answer
    const result = await chat(messages, { temperature: 0 });

    return {
      answer: result.text,
      sources: retrieved,
      tokensUsed: result.usage,
    };
  }
}
