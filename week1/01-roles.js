// exercises/01-roles.js
import { chat } from '../lib/llm.js';

// --- Test 1: no system prompt ---
const plain = await chat([
  { role: 'user', content: 'Write a debounce function.' },
]);
console.log('=== No system prompt ===');
console.log(plain.text);

// --- Test 2: with a constraining system prompt ---
const constrained = await chat([
  {
    role: 'system',
    content:
      'You are a senior JS engineer. Reply ONLY with code and brief inline comments. Zero prose. No intro sentence, no outro sentence.',
  },
  { role: 'user', content: 'Write a debounce function.' },
]);
console.log('\n=== With system prompt ===');
console.log(constrained.text);

// --- Test 3: pre-filling the assistant turn ---
// The model continues from whatever you put in the assistant message.
// Putting "```js\n" forces it to open a code block immediately.
const prefilled = await chat([
  {
    role: 'system',
    content: 'Reply only with code. No explanation.',
  },
  { role: 'user', content: 'Write a debounce function.' },
  { role: 'assistant', content: '```js\n' }, // pre-fill
]);
console.log('\n=== Pre-filled assistant turn ===');
console.log('```js\n' + prefilled.text); // prepend what you pre-filled

// Print token usage for all three
console.log('\n--- Usage ---');
console.log('plain:', plain.usage);
console.log('constrained:', constrained.usage);
console.log('prefilled:', prefilled.usage);
