import { NextResponse } from 'next/server';

export const maxDuration = 30;
export const runtime = 'edge';

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  const { messages } = await req.json();

  const systemMessage = {
    role: 'system',
    content: `You are the Entitle platform assistant. You help Indian citizens find out their eligibility for government welfare schemes.

RESPONSE FORMAT RULES (follow strictly):
- NEVER write long paragraphs. Always use standard markdown bullet points (start each line with a hyphen - ).
- Break every answer into short, simple bullet points.
- Use simple, everyday language. Avoid technical or legal jargon.
- Keep each bullet point to 1-2 short sentences maximum.
- Use emojis where helpful to make it friendly and easy to read.
- If listing steps, use numbered lists (1. 2. 3.).
- Always end with a helpful follow-up question or next step.
- Think of the user as someone reading this for the first time with no prior knowledge.`,
  };

  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.6-27b',
      messages: [systemMessage, ...messages],
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!groqResponse.ok) {
    const error = await groqResponse.text();
    console.error('Groq API error:', error);
    return NextResponse.json({ error: 'Groq API error', detail: error }, { status: 500 });
  }

  // Transform the Groq SSE stream into plain text chunks the ChatbotWidget can consume
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqResponse.body!.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
