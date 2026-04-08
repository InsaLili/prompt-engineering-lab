import 'dotenv/config';

const response = await fetch('https://api.openai.com/v1/embeddings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'text-embedding-3-small', // cheapest, good quality
    input: 'The quick brown fox jumps over the lazy dog',
  }),
});

const data = await response.json();

console.log('Model:', data.model);
console.log('Dimensions:', data.data[0].embedding.length); // 1536
console.log('First 5 values:', data.data[0].embedding.slice(0, 5));
console.log('Token usage:', data.usage);
