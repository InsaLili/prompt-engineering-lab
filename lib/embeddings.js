import 'dotenv/config';

// --- Embed a single string ---
export async function embed(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' '), // newlines hurt embedding quality
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      `Embeddings API error ${response.status}: ${err.error?.message}`,
    );
  }

  const data = await response.json();
  return data.data[0].embedding; // returns float[]
}

// --- Embed multiple strings in one API call (much cheaper than looping) ---
export async function embedBatch(texts) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts.map(t => t.replace(/\n/g, ' ')),
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      `Embeddings API error ${response.status}: ${err.error?.message}`,
    );
  }

  const data = await response.json();
  // API returns results indexed — sort by index to preserve input order
  return data.data
    .sort((a, b) => a.index - b.index)
    .map(item => item.embedding);
}

// --- Cosine similarity between two vectors ---
// Returns a number from -1 (opposite) to 1 (identical)
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) throw new Error('Vectors must be same length');

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export class VectorStore {
  constructor() {
    this.items = []; // [{ text, embedding, metadata }]
  }

  // Add a single item
  async add(text, metadata = {}) {
    const embedding = await embed(text);
    this.items.push({ text, embedding, metadata });
    return this; // chainable
  }

  // Add many items efficiently (one API call)
  async addBatch(texts, metadatas = []) {
    const embeddings = await embedBatch(texts);
    texts.forEach((text, i) => {
      this.items.push({
        text,
        embedding: embeddings[i],
        metadata: metadatas[i] || {},
      });
    });
    return this;
  }

  // Return the top-k most similar items to a query
  async search(query, k = 3) {
    const queryEmbedding = await embed(query);

    return this.items
      .map(item => ({
        text: item.text,
        metadata: item.metadata,
        score: cosineSimilarity(queryEmbedding, item.embedding),
      }))
      .sort((a, b) => b.score - a.score) // highest score first
      .slice(0, k);
  }

  size() {
    return this.items.length;
  }
}
