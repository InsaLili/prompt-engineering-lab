import { chat } from '../lib/llm.js';

const prompt = [
  {
    role: 'user',
    content: 'Write 5 tips for staying productive when working from home.',
  },
];

// No penalties — model may repeat phrases and ideas
const noPenalty = await chat(prompt, {
  temperature: 0.7,
  presence_penalty: 0,
  frequency_penalty: 0,
});

// With penalties — more varied word choice, less repetition
const withPenalty = await chat(prompt, {
  temperature: 0.7,
  presence_penalty: 0.6, // penalises reusing topics already mentioned
  frequency_penalty: 0.6, // penalises reusing the same words
});

console.log('=== No penalty ===\n', noPenalty.text);
console.log('\n=== With penalty ===\n', withPenalty.text);
