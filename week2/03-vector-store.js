import { VectorStore } from '../lib/embeddings.js';

// 20 facts about a topic — use anything you find interesting
const facts = [
  'JavaScript was created by Brendan Eich in 1995 in just 10 days.',
  'Node.js was released in 2009 by Ryan Dahl, enabling JS on the server.',
  'The V8 engine, used by both Chrome and Node.js, compiles JS to machine code.',
  "npm (Node Package Manager) is the world's largest software registry.",
  'TypeScript is a superset of JavaScript that adds static type checking.',
  'React was created by Jordan Walke at Facebook and open-sourced in 2013.',
  'Next.js is a React framework created by Vercel for server-side rendering.',
  'Deno is a JavaScript runtime created by Ryan Dahl as a successor to Node.js.',
  'WebAssembly (WASM) allows languages like Rust and C++ to run in the browser.',
  'The event loop is what makes JavaScript non-blocking and asynchronous.',
  'Promises replaced callback patterns for handling asynchronous operations.',
  'async/await is syntactic sugar over Promises, introduced in ES2017.',
  'ESModules (import/export) became the standard module system in ES2015.',
  'Bun is a fast JavaScript runtime built on JavaScriptCore, not V8.',
  'The JavaScript specification is maintained by TC39 as ECMAScript.',
  'Closures in JS allow functions to remember the scope they were created in.',
  "The prototype chain is JavaScript's mechanism for inheritance.",
  'Web Workers allow JavaScript to run code on background threads.',
  'Service Workers enable Progressive Web Apps and offline functionality.',
  "The DOM (Document Object Model) is the browser's API for manipulating HTML.",
];

console.log('Building vector store with', facts.length, 'facts...');
const store = new VectorStore();
await store.addBatch(facts);
console.log('Done. Store contains', store.size(), 'items.\n');

// Run several queries — some obvious, some tricky
const queries = [
  'Who invented JavaScript?',
  'How does async code work?',
  'What is the best framework for building web apps?', // no direct answer
  'Tell me about running JS outside the browser',
  'How does JavaScript handle inheritance?',
];

for (const query of queries) {
  console.log(`\nQuery: "${query}"`);
  const results = await store.search(query, 3);
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.score.toFixed(3)}] ${r.text}`);
  });
}
