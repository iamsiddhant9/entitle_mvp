import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('GROQ_API_KEY is not set in environment variables');
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const groq = createOpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  try {
    const { messages } = await req.json();

    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      system: `You are the Entitle platform assistant. You help Indian citizens find out their eligibility for government welfare schemes.

RESPONSE FORMAT RULES (follow strictly):
- NEVER write long paragraphs. Always use standard markdown bullet points (start each line with a hyphen `- `).
- Break every answer into short, simple bullet points.
- Use simple, everyday language. Avoid technical or legal jargon.
- Keep each bullet point to 1-2 short sentences maximum.
- Use emojis where helpful to make it friendly and easy to read.
- If listing steps, use numbered lists (1. 2. 3.).
- Always end with a helpful follow-up question or next step.
- Think of the user as someone reading this for the first time with no prior knowledge.`,
      messages,
    });

    // Stream plain text — ChatbotWidget reads raw chunks directly
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat route:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Internal Server Error', detail: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
