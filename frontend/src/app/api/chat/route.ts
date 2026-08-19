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
- Maintain a professional, clear, and objective tone. Do not be overly enthusiastic or conversational.
- CRITICAL: DO NOT use any emojis.
- If listing steps, use numbered lists (1. 2. 3.).
- Always end with a helpful follow-up question or next step.
- Think of the user as someone reading this for the first time with no prior knowledge.
- CRITICAL: DO NOT output any internal thought processes, reasoning, or <think> tags. Produce ONLY the final response.`,
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
      max_tokens: 4096,
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
      let finishedThinking = false;
      let thinkBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (!finishedThinking && thinkBuffer && !thinkBuffer.includes('<think>')) {
             controller.enqueue(encoder.encode(thinkBuffer));
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) {
              if (!finishedThinking) {
                thinkBuffer += text;
                if (thinkBuffer.includes('</think>')) {
                  finishedThinking = true;
                  const cleanText = thinkBuffer.split('</think>')[1];
                  if (cleanText) {
                    controller.enqueue(encoder.encode(cleanText.replace(/^[\n\r]+/, '')));
                  }
                } else if (!thinkBuffer.includes('<') && thinkBuffer.length > 20) {
                  // No think block detected at all
                  finishedThinking = true;
                  controller.enqueue(encoder.encode(thinkBuffer));
                }
              } else {
                controller.enqueue(encoder.encode(text));
              }
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
