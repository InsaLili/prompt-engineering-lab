import 'dotenv/config';
import { RAGPipeline } from '../lib/rag.js';

const rag = new RAGPipeline();

// Mark as loaded — data is already in Supabase, no need to ingest
rag.loaded = true;

const questions = [
  'What is a large language model?',
  'How are LLMs trained?',
  'What are the limitations of LLMs?',
  'What is the current price of NVIDIA stock?',
];

for (const question of questions) {
  console.log(`\nQuestion: ${question}`);
  console.log('-'.repeat(50));

  const result = await rag.query(question);
  console.log('Answer:', result.answer);

  if (result.sources.length > 0) {
    console.log('\nTop source:', result.sources[0].text.slice(0, 100) + '...');
    console.log('Relevance:', result.sources[0].score.toFixed(3));
  }
}
