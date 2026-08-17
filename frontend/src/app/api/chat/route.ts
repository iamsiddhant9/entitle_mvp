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
      model: groq('qwen/qwen3.6-27b'),
      system: `You are the Entitle platform assistant. You help Indian citizens find out their eligibility for government welfare schemes. Be concise, clear, and helpful.`,
      messages,
    });

    // Stream plain text - our custom frontend handles this directly
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
