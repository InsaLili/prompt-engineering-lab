// exercises/04-json-output.js
import { chat } from '../lib/llm.js';

const reviews = [
  'Absolutely love this product, arrived ahead of schedule!',
  'Terrible quality. Broke after two days.',
  "It's fine. Does what it says, nothing remarkable.",
  'Late delivery but the item itself is great.',
];

async function analyzeReview(text) {
  const result = await chat(
    [
      {
        role: 'system',
        content: `You are a review analysis API. 
Always respond with valid JSON only.
No markdown. No backticks. No explanation. Raw JSON.

Schema:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "confidence": <number 0.0–1.0>,
  "key_emotion": <single word>,
  "reason": <one sentence max>
}`,
      },
      {
        role: 'user',
        content: `Analyze this review: "${text}"`,
      },
    ],
    { temperature: 0 },
  ); // temperature 0 = most deterministic

  // Parse safely — always wrap JSON.parse in try/catch
  try {
    return JSON.parse(result.text);
  } catch (e) {
    console.error('Failed to parse:', result.text);
    return null;
  }
}

// Run all reviews in parallel
const results = await Promise.all(reviews.map(analyzeReview));

reviews.forEach((review, i) => {
  console.log(`\nReview: "${review}"`);
  console.log('Result:', results[i]);
});
