// exercises/03-cot.js
import { chat } from '../lib/llm.js';

const problem = `
A store has 3 shelves. Each shelf holds 4 boxes.
Each box contains 6 items. 2 shelves are full.
The 3rd shelf is half full. How many items total?
`;

// Direct answer — model often rushes and gets this wrong
const direct = await chat(
  [{ role: 'user', content: problem + '\nAnswer with just a number.' }],
  { temperature: 0 },
);

// Chain-of-thought — forces the model to work through steps
const cot = await chat(
  [
    {
      role: 'user',
      content:
        problem +
        '\nThink through this step by step, then give the final number.',
    },
  ],
  { temperature: 0 },
);

// Structured CoT — you define the reasoning format
const structured = await chat(
  [
    {
      role: 'system',
      content: `Solve math problems using this format exactly:
Step 1: [what you're calculating]
Step 2: [next calculation]
...
Final answer: [number]`,
    },
    { role: 'user', content: problem },
  ],
  { temperature: 0 },
);

console.log('Direct:    ', direct.text.trim());
console.log('\nCoT:\n', cot.text.trim());
console.log('\nStructured CoT:\n', structured.text.trim());
