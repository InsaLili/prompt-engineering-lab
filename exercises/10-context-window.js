import { chat } from '../lib/llm.js';

// gpt-4o-mini has a 128k token context window.
// Let's build a conversation and watch token usage grow.

const history = [];
const turns = [
  'My name is Alex.',
  "I'm building an AI-powered recipe app.",
  'The app should suggest recipes based on ingredients the user has.',
  'It should also track dietary restrictions.',
  'What name should I call it?',
];

for (const userMessage of turns) {
  history.push({ role: 'user', content: userMessage });

  const result = await chat(history);

  history.push({ role: 'assistant', content: result.text });

  console.log(`User: ${userMessage}`);
  console.log(`Assistant: ${result.text.trim()}`);
  console.log(
    `Tokens used — prompt: ${result.usage.prompt_tokens}, completion: ${result.usage.completion_tokens}, total: ${result.usage.total_tokens}`,
  );
  console.log('---');
}

// At the end, ask something that requires memory from earlier
const memoryTest = await chat([
  ...history,
  { role: 'user', content: "What's my name and what am I building?" },
]);

console.log('\nMemory test:');
console.log(memoryTest.text.trim());
console.log(`Final total tokens: ${memoryTest.usage.total_tokens}`);
