import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Initialize the OpenAI provider with Groq's base URL and API key
const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Ensure the system message is at the front
    const fullMessages = [
      {
        role: 'system',
        content: `You are the Entitle platform assistant. You are a helpful, expert AI that assists citizens with finding out their eligibility for welfare schemes in India. You should be concise, clear, and informative.`,
      },
      ...messages,
    ];

    const result = streamText({
      model: groq('llama3-8b-8192'),
      messages: fullMessages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
