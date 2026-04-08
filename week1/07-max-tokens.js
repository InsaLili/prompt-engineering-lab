import { chat } from '../lib/llm.js';

const prompt = [
  {
    role: 'user',
    content: 'Explain how the internet works. explain in 3 bullet points',
  },
];

// Intentionally too small — will cut off mid-response
const tight = await chat(prompt, { max_tokens: 50 });

// Comfortable room
const comfortable = await chat(prompt, { max_tokens: 500 });

console.log('=== max_tokens: 50 ===');
console.log('finish_reason:', tight.finish_reason); // will say "length"
console.log('text:', tight.text);

console.log('\n=== max_tokens: 500 ===');
console.log('finish_reason:', comfortable.finish_reason); // will say "stop"
console.log('text:', comfortable.text);
