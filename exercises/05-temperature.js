// exercises/thursday/01-temperature.js
import { chat } from '../lib/llm.js';

const prompt = [
  { role: 'user', content: 'Suggest a startup idea in one sentence.' },
];

// Run the same prompt at 4 different temperatures, 3 times each
const temperatures = [0, 0.5, 1.0, 1.8];
const runs = 3;

for (const temp of temperatures) {
  console.log(`\n===== temperature: ${temp} =====`);
  for (let i = 0; i < runs; i++) {
    const result = await chat(prompt, { temperature: temp });
    console.log(`  run ${i + 1}: ${result.text.trim()}`);
  }
}
