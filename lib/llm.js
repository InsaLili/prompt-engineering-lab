// lib/llm.js
import 'dotenv/config';

export async function chat(messages, options = {}) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 500,
      ...options,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`API error ${response.status}: ${err.error?.message}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    finish_reason: data.choices[0].finish_reason,
    usage: data.usage,
  };
}
