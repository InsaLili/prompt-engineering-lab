import { readFileSync } from 'fs';
import { chunkBySize, chunkByParagraph } from '../lib/chunker.js';

const text = readFileSync('data/document.txt', 'utf-8');

const fixedChunks = chunkBySize(text, 500, 50);
const paraChunks = chunkByParagraph(text, 800);

console.log('=== Fixed-size chunking ===');
console.log(`Chunks: ${fixedChunks.length}`);
console.log(
  `Avg length: ${Math.round(
    fixedChunks.reduce((s, c) => s + c.length, 0) / fixedChunks.length,
  )} chars`,
);
console.log('\nFirst chunk:\n', fixedChunks[0]);
console.log('\nSecond chunk:\n', fixedChunks[1]); // notice the overlap

console.log('\n=== Paragraph chunking ===');
console.log(`Chunks: ${paraChunks.length}`);
console.log(
  `Avg length: ${Math.round(
    paraChunks.reduce((s, c) => s + c.length, 0) / paraChunks.length,
  )} chars`,
);
console.log('\nFirst chunk:\n', paraChunks[0]);
console.log('\nSecond chunk:\n', paraChunks[1]);
