import { readFileSync } from 'fs';
import { RAGPipeline } from '../lib/rag.js';
import { chat } from '../lib/llm.js';

const text = readFileSync('data/document.txt', 'utf-8');

// RAG pipeline — grounded
const rag = new RAGPipeline();
await rag.ingest(text);

// Questions the document definitely doesn't answer
const trickyQuestions = [
  'What will LLMs be capable of in 2030?',
  'Which LLM has the highest IQ?',
  'Is GPT-4 better than Claude?',
];

for (const question of trickyQuestions) {
  console.log(`\nQuestion: "${question}"`);
  console.log('-'.repeat(50));

  // Without RAG — raw LLM, no grounding
  const rawResult = await chat([{ role: 'user', content: question }], {
    temperature: 0.7,
  });
  console.log('RAW LLM (no context):');
  console.log(rawResult.text.trim());

  // With RAG — grounded
  const ragResult = await rag.query(question);
  console.log('\nRAG (grounded):');
  console.log(ragResult.answer.trim());

  console.log('='.repeat(50));
}
