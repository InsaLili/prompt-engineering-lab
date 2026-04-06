const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    stream: true, // the only change
    messages: [{ role: 'user', content: 'Count slowly from 1 to 10.' }],
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop(); // keep incomplete last line for next iteration

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const json = line.slice(6);
    if (json === '[DONE]') break;
    const parsed = JSON.parse(json);
    const token = parsed.choices[0]?.delta?.content;
    if (token) process.stdout.write(token);
  }
}
