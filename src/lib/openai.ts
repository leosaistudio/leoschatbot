import OpenAI from 'openai'

let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
    if (!_openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('Missing OPENAI_API_KEY environment variable')
        }
        _openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })
    }
    return _openai
}

// Named export for backward compatibility - consumers call openai() instead of openai.xyz
export { getOpenAI as openai }
export default getOpenAI

