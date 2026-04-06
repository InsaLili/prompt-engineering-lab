// exercises/02-shots.js
import { chat } from '../lib/llm.js';

const review = 'The product arrived late and works ok, nothing remarkable.';

// Zero-shot
const zero = await chat([
  {
    role: 'user',
    content: `Classify this review as positive, negative, or neutral:\n"${review}"\n\nLabel:`,
  },
]);

// One-shot
const one = await chat([
  {
    role: 'user',
    content: `Classify reviews as positive, negative, or neutral.

Example:
Review: "Great quality, fast shipping!"
Label: positive

Now classify:
Review: "${review}"
Label:`,
  },
]);

// Few-shot — covers the ambiguous "mixed" case explicitly
const few = await chat([
  {
    role: 'user',
    content: `Classify reviews as positive, negative, or neutral.

Review: "Great quality, fast shipping!"
Label: positive

Review: "Completely broken, waste of money."
Label: negative

Review: "It's okay, nothing special."
Label: neutral

Review: "Fast delivery but the instructions were confusing."
Label: neutral

Review: "${review}"
Label:`,
  },
]);

console.log('Zero-shot:', zero.text.trim());
console.log('One-shot: ', one.text.trim());
console.log('Few-shot: ', few.text.trim());
