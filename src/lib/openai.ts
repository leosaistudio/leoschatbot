import OpenAI from 'openai'

let openaiClient: OpenAI | null = null;

export const getOpenAIClient = () => {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('Missing OPENAI_API_KEY environment variable. Please add it to your environment variables.')
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })
    }
    return openaiClient
}

// Keep a proxy-like export for backward compatibility if possible, 
// or update all callers. Let's update callers for clarity.
export const openai = new Proxy({} as OpenAI, {
    get: (target, prop, receiver) => {
        return Reflect.get(getOpenAIClient(), prop, receiver)
    }
})

export default openai

