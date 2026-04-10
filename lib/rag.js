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
    const history = options.history ?? []; // ← new: accept conversation history

    // Retrieve relevant chunks based on the current question
    const retrieved = await this.store.search(question, k);

    const context =
      retrieved.length > 0
        ? retrieved
            .map(
              (r, i) =>
                `[Source ${i + 1}] (relevance: ${r.score.toFixed(2)})\n${
                  r.text
                }`,
            )
            .join('\n\n')
        : null;

    // Build messages: system prompt + history + current question
    const messages = [
      {
        role: 'system',
        content: `You are a precise question-answering assistant with a great conversation style.
${
  context
    ? `Answer questions using ONLY the provided context below. Never invent facts.
When the user asks follow-up questions, use the conversation history to understand what they're referring to.

Context from document:
${context}`
    : `Use the conversation history to answer follow-up questions.
If the user is asking about something not covered in prior conversation, say you don't have enough information.`
}`,
      },
      ...history,
      {
        role: 'user',
        content: question,
      },
    ];

    const result = await chat(messages, { temperature: 0.3 });

    return {
      answer: result.text,
      sources: retrieved,
      tokensUsed: result.usage,
    };
  }

  // Add to lib/rag.js — streaming version of query()
  async queryStream(question, options = {}, onToken) {
    if (!this.loaded) throw new Error('No document ingested yet.');

    const k = options.k ?? 3;
    const history = options.history ?? [];

    const retrieved = await this.store.search(question, k);

    if (retrieved.length === 0) {
      onToken(
        "I don't have enough information in the provided document to answer that.",
      );
      return { sources: [], tokensUsed: null };
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
        content: `You are a precise question-answering assistant with a great conversation style.
Answer questions using ONLY the provided context below.
If the context does not contain enough information, say so clearly.
Never invent facts.

Context from document:
${context}`,
      },
      ...history,
      { role: 'user', content: question },
    ];

    // Stream the response token by token
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        stream: true,
        messages,
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk
        .split('\n')
        .filter(l => l.startsWith('data: ') && l !== 'data: [DONE]');

      for (const line of lines) {
        try {
          const json = JSON.parse(line.replace('data: ', ''));
          const token = json.choices[0]?.delta?.content;
          if (token) {
            fullText += token;
            onToken(token);
          }
        } catch {
          // partial chunk — safe to ignore
        }
      }
    }

    return { answer: fullText, sources: retrieved };
  }
}
