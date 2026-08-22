import { NextResponse } from 'next/server';

export const maxDuration = 30;
export const runtime = 'nodejs';

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

      // States: 'pre' = before/during <think>, 'post' = after </think> (streaming normally)
      // We buffer while inside a <think> block, then stream the rest directly.
      let state: 'pre' | 'post' = 'pre';
      let preBuffer = '';     // accumulates text before we know if there's a <think> block
      let thinkBuffer = '';   // accumulates content while inside <think>...</think>
      let inThinkTag = false; // true once we've seen the opening <think>

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Stream ended — if we never got past the <think> block, emit whatever we have
          if (state === 'pre') {
            const safe = (preBuffer + thinkBuffer).replace(/<\/?think>/g, '').replace(/^[\n\r]+/, '');
            if (safe) controller.enqueue(encoder.encode(safe));
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
            if (!text) continue;

            if (state === 'post') {
              // Already past the thinking block — stream directly
              controller.enqueue(encoder.encode(text));
              continue;
            }

            // state === 'pre': still looking for the end of <think>...</think>
            preBuffer += text;

            // Check if the model is even using a think block
            if (!inThinkTag) {
              if (preBuffer.includes('<think>')) {
                inThinkTag = true;
                // Move everything after <think> into thinkBuffer
                thinkBuffer = preBuffer.split('<think>').slice(1).join('<think>');
                preBuffer = '';
              } else if (!preBuffer.includes('<') && preBuffer.length > 30) {
                // Model not using thinking tags at all — emit buffer and switch to streaming
                state = 'post';
                controller.enqueue(encoder.encode(preBuffer));
                preBuffer = '';
                continue;
              }
            }

            if (inThinkTag) {
              thinkBuffer = preBuffer === '' ? thinkBuffer + text.split('<think>').pop()! : thinkBuffer;
              if (thinkBuffer.includes('</think>')) {
                state = 'post';
                const afterThink = thinkBuffer.split('</think>').slice(1).join('</think>');
                const clean = afterThink.replace(/^[\n\r]+/, '');
                if (clean) controller.enqueue(encoder.encode(clean));
                thinkBuffer = '';
                preBuffer = '';
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
