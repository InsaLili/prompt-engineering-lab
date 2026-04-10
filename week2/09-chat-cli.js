import 'dotenv/config';
import * as readline from 'readline';
import { RAGPipeline } from '../lib/rag.js';

// --- Terminal colours — makes the UI much more readable ---
const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function print(role, text) {
  if (role === 'assistant') {
    console.log(`\n${c.green}${c.bold}Assistant${c.reset} ${text}\n`);
  } else if (role === 'system') {
    console.log(`${c.gray}${text}${c.reset}`);
  } else if (role === 'sources') {
    console.log(`${c.dim}${c.gray}${text}${c.reset}`);
  }
}

function printSeparator() {
  console.log(`${c.gray}${'─'.repeat(60)}${c.reset}`);
}

// --- Setup ---
const rag = new RAGPipeline();
rag.loaded = true; // data already in Supabase from Wednesday

const history = []; // conversation turns accumulate here
const MAX_HISTORY = 10; // keep last 10 turns to manage context window

// --- Readline interface ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

// Style the prompt
rl.setPrompt(`${c.blue}${c.bold}You${c.reset} `);

// --- Welcome message ---
console.clear();
printSeparator();
console.log(`${c.cyan}${c.bold}  Document Chat${c.reset}`);
console.log(
  `${c.gray}  Ask anything about your document. Type 'exit' to quit.${c.reset}`,
);
console.log(
  `${c.gray}  Commands: 'clear' (reset history), 'sources' (show last sources)${c.reset}`,
);
printSeparator();
console.log();

rl.prompt();

let lastSources = [];

// --- Main input handler ---
rl.on('line', async input => {
  const userInput = input.trim();

  if (!userInput) {
    rl.prompt();
    return;
  }

  // --- Commands ---
  if (userInput.toLowerCase() === 'exit') {
    console.log(`\n${c.gray}Goodbye.${c.reset}\n`);
    rl.close();
    process.exit(0);
  }

  if (userInput.toLowerCase() === 'clear') {
    history.length = 0;
    lastSources = [];
    console.clear();
    print('system', 'Conversation history cleared.');
    rl.prompt();
    return;
  }

  if (userInput.toLowerCase() === 'sources') {
    if (lastSources.length === 0) {
      print('system', 'No sources from last query.');
    } else {
      console.log(`\n${c.yellow}Sources from last query:${c.reset}`);
      lastSources.forEach((s, i) => {
        console.log(
          `\n${c.yellow}[${i + 1}] score: ${s.score.toFixed(3)}${c.reset}`,
        );
        console.log(s.text);
      });
      console.log();
    }
    rl.prompt();
    return;
  }

  // --- RAG query ---
  process.stdout.write(`\n${c.gray}Thinking...${c.reset}`);

  try {
    const result = await rag.query(userInput, {
      k: 3,
      history: history.slice(-MAX_HISTORY), // pass recent history only
    });

    // Clear "Thinking..." line
    process.stdout.write('\r' + ' '.repeat(20) + '\r');

    // Print answer
    print('assistant', result.answer);

    // Show source count quietly
    if (result.sources.length > 0) {
      print(
        'sources',
        `  Sources: ${result.sources.length} chunks retrieved (type 'sources' to see full text)`,
      );
    }

    // Show token usage
    if (result.tokensUsed) {
      print(
        'sources',
        `  Tokens: ${result.tokensUsed.total_tokens} used this turn`,
      );
    }

    // Store turn in history
    history.push({ role: 'user', content: userInput });
    history.push({ role: 'assistant', content: result.answer });

    lastSources = result.sources;
  } catch (err) {
    process.stdout.write('\r' + ' '.repeat(20) + '\r');
    console.log(`\n${c.yellow}Error: ${err.message}${c.reset}\n`);
  }

  printSeparator();
  rl.prompt();
});

rl.on('close', () => {
  process.exit(0);
});
