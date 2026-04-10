// lib/vectorstore-supabase.js
import { createClient } from '@supabase/supabase-js';
import { embed, embedBatch, cosineSimilarity } from './embeddings.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

export class SupabaseVectorStore {
  // Add a single item
  async add(text, metadata = {}) {
    const embedding = await embed(text);

    const { error } = await supabase
      .from('documents')
      .insert({ content: text, embedding, metadata });

    if (error) throw new Error(`Supabase insert error: ${error.message}`);
    return this;
  }

  // Add many items efficiently — one embedding batch call, one DB insert
  async addBatch(texts, metadatas = []) {
    const embeddings = await embedBatch(texts);

    const rows = texts.map((text, i) => ({
      content: text,
      embedding: embeddings[i],
      metadata: metadatas[i] || {},
    }));

    const { error } = await supabase.from('documents').insert(rows);

    if (error) throw new Error(`Supabase batch insert error: ${error.message}`);
    return this;
  }

  // Semantic search via the SQL function you created
  async search(query, k = 3, threshold = 0.3) {
    const queryEmbedding = await embed(query);

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: k,
      match_threshold: threshold,
    });

    if (error) throw new Error(`Supabase search error: ${error.message}`);

    return data.map(row => ({
      text: row.content,
      metadata: row.metadata,
      score: row.similarity,
    }));
  }

  // Count rows in the table
  async size() {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(`Supabase count error: ${error.message}`);
    return count;
  }

  // Clear all rows — useful during development
  async clear() {
    const { error } = await supabase.from('documents').delete().neq('id', 0); // delete where id != 0 = delete all

    if (error) throw new Error(`Supabase clear error: ${error.message}`);
    console.log('Vector store cleared.');
  }
}
