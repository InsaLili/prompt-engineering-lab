import { SupabaseVectorStore } from './vectorstore-supabase.js'; // ← changed
import { chat } from './llm.js';
import { chunkByParagraph } from './chunker.js';

export class RAGPipeline {
  constructor() {
    this.store = new SupabaseVectorStore(); // ← was: new VectorStore()
    this.loaded = false;
  }

  async ingest(text, metadata = {}) {
    const chunks = chunkByParagraph(text, 800);
    console.log(`Ingesting ${chunks.length} chunks...`);

    await this.store.addBatch(
      chunks,
      chunks.map((_, i) => ({ ...metadata, chunkIndex: i })),
    );

    this.loaded = true;
    const total = await this.store.size();
    console.log(`Done. ${total} total chunks in database.`);
    return chunks.length;
  }

  // query() method is completely unchanged — it calls this.store.search()
  // which now hits Supabase instead of in-memory
  async query(question, options = {}) {
    if (!this.loaded) throw new Error('No document ingested yet.');

    const k = options.k ?? 3;
    const retrieved = await this.store.search(question, k);

    if (retrieved.length === 0) {
      return {
        answer:
          "I don't have enough information in the provided document to answer that.",
        sources: [],
        tokensUsed: null,
      };
    }

    const context = retrieved
      .map(
        (r, i) =>
          `[Source ${i + 1}] (relevance: ${r.score.toFixed(2)})\n${r.text}`,
      )
      .join('\n\n');

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
      { role: 'user', content: question },
    ];

    const result = await chat(messages, { temperature: 0 });

    return {
      answer: result.text,
      sources: retrieved,
      tokensUsed: result.usage,
    };
  }
}
