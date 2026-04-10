import { readFileSync } from 'fs';
import 'dotenv/config';
import { SupabaseVectorStore } from '../lib/vectorstore-supabase.js';
import { chunkByParagraph } from '../lib/chunker.js';
import { embedBatch } from '../lib/embeddings.js';

const store = new SupabaseVectorStore();

// Check if already ingested — don't pay to re-embed
const existing = await store.size();

if (existing > 0) {
  console.log(`Database already has ${existing} chunks. Skipping ingestion.`);
  console.log('Run with --force to re-ingest: node 07-ingest.js --force');

  if (!process.argv.includes('--force')) {
    process.exit(0);
  }

  console.log('Force flag detected — clearing and re-ingesting...');
  await store.clear();
}

const text = readFileSync('data/document.txt', 'utf-8');
const chunks = chunkByParagraph(text, 800);

console.log(`\nChunking complete: ${chunks.length} chunks`);
console.log('Embedding and storing (this is the expensive step)...\n');

const startTime = Date.now();

// Process in batches of 20 to avoid rate limits
const batchSize = 20;
for (let i = 0; i < chunks.length; i += batchSize) {
  const batch = chunks.slice(i, i + batchSize);
  const embeddings = await embedBatch(batch);

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
  );

  const rows = batch.map((text, j) => ({
    content: text,
    embedding: embeddings[j],
    metadata: { chunkIndex: i + j, source: 'document.txt' },
  }));

  const { error } = await supabase.from('documents').insert(rows);
  if (error) throw new Error(error.message);

  console.log(
    `  Stored chunks ${i + 1}–${Math.min(i + batchSize, chunks.length)} of ${
      chunks.length
    }`,
  );
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\nIngestion complete in ${elapsed}s`);
console.log(`Total chunks in database: ${await store.size()}`);
