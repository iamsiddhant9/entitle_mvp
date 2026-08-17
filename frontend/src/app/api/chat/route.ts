import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

export const maxDuration = 30;

export async function POST(req: Request) {
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

    // Stream standard data stream format which ChatbotWidget parses
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
