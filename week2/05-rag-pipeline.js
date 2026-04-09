import { readFileSync } from 'fs';
import { RAGPipeline } from '../lib/rag.js';

const text = readFileSync('data/document.txt', 'utf-8');
const rag = new RAGPipeline();

// Ingest the document
await rag.ingest(text, { source: 'wikipedia' });

console.log('\n' + '='.repeat(60));

// Questions to test
const questions = [
  // Should answer well — covered in the document
  'What is a large language model?',
  'How are LLMs trained?',

  // Should answer partially — related but may not be detailed
  'What are the limitations of LLMs?',

  // Should trigger "I don't know" — not in the document
  'What is the current price of NVIDIA stock?',
  'Who is the CEO of OpenAI?',
];

for (const question of questions) {
  console.log(`\nQuestion: ${question}`);
  console.log('-'.repeat(40));

  const result = await rag.query(question);

  console.log('Answer:', result.answer);
  console.log('\nSources used:');
  result.sources.forEach((s, i) => {
    console.log(
      `  ${i + 1}. [score: ${s.score.toFixed(3)}] ${s.text.slice(0, 80)}...`,
    );
  });
  console.log(`Tokens used: ${result.tokensUsed.total_tokens}`);
  console.log('='.repeat(60));
}
