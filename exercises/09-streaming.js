import 'dotenv/config';

async function streamChat(messages, onToken) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      stream: true,
      messages,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk
      .split('\n')
      .filter(line => line.startsWith('data: ') && line !== 'data: [DONE]');

    for (const line of lines) {
      try {
        const json = JSON.parse(line.replace('data: ', ''));
        const token = json.choices[0]?.delta?.content;
        if (token) {
          fullText += token;
          onToken(token); // callback — fire on each token
        }
      } catch {
        // partial chunk — safe to ignore, next read will complete it
      }
    }
  }

  return fullText;
}

// Use it — watch tokens arrive one by one
console.log('Streaming response:\n');

const full = await streamChat(
  [{ role: 'user', content: 'Count from 1 to 20, one number per line.' }],
  token => process.stdout.write(token), // print each token as it arrives
);

console.log('\n\n--- Complete text length:', full.length, 'chars ---');
