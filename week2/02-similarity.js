import { embedBatch, cosineSimilarity } from '../lib/embeddings.js';

// Pairs to test — you should be able to predict high vs low before running
const pairs = [
  // Should be HIGH similarity (semantically close)
  ['dog', 'puppy'],
  ['I love pizza', 'Pizza is my favourite food'],
  ['The car broke down', 'The vehicle stopped working'],

  // Should be LOW similarity (semantically distant)
  ['dog', 'rocket'],
  ['I love pizza', 'The stock market crashed'],
  ['machine learning', 'medieval history'],

  // Interesting edge cases
  ['bank', 'river bank'], // ambiguous — which meaning wins?
  ['bank', 'financial bank'], // should be closer to "bank" concept

  ["I didn't enjoy the film", 'The movie was great'],
];

console.log('Embedding all texts...\n');

// Flatten all unique texts, embed in one batch call
const allTexts = [...new Set(pairs.flat())];
const allEmbeddings = await embedBatch(allTexts);

// Build a lookup map: text → vector
const embeddingMap = {};
allTexts.forEach((text, i) => {
  embeddingMap[text] = allEmbeddings[i];
});

// Score each pair
console.log('Similarity scores (1.0 = identical meaning, 0.0 = unrelated):\n');

for (const [textA, textB] of pairs) {
  const score = cosineSimilarity(embeddingMap[textA], embeddingMap[textB]);
  const bar = '█'.repeat(Math.round(score * 20)).padEnd(20, '░');
  console.log(`${bar} ${score.toFixed(3)}`);
  console.log(`  "${textA}" vs "${textB}"\n`);
}
