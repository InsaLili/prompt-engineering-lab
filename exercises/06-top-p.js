import { chat } from '../lib/llm.js';

const prompt = [
  { role: 'user', content: 'Write the opening line of a thriller novel.' },
];

const configs = [
  { label: 'top_p: 0.1  (very focused)', temperature: 1, top_p: 0.1 },
  { label: 'top_p: 0.5  (moderate)', temperature: 1, top_p: 0.5 },
  { label: 'top_p: 1.0  (default, all tokens)', temperature: 1, top_p: 1.0 },
];

for (const config of configs) {
  const { label, ...options } = config;
  const result = await chat(prompt, options);
  console.log(`\n${label}`);
  console.log(result.text.trim());
}
