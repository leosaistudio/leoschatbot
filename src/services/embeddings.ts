import { openai } from '@/lib/openai'
import { prisma } from '@/lib/db'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const CHUNK_SIZE = 1000 // characters per chunk
const CHUNK_OVERLAP = 200

/**
 * Split text into overlapping chunks for embedding
 */
export function chunkText(text: string): string[] {
    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE, text.length)
        const chunk = text.slice(start, end).trim()

        if (chunk.length > 50) { // Skip very small chunks
            chunks.push(chunk)
        }

        start += CHUNK_SIZE - CHUNK_OVERLAP
    }

    return chunks
}

/**
 * Generate embedding for a text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const response = await openai().embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
    })

    return response.data[0].embedding
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Store embeddings for crawled content
 */
export async function storeEmbeddings(
    botId: string,
    sourceId: string,
    content: string
): Promise<void> {
    const chunks = chunkText(content)

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk)

        await prisma.embedding.create({
            data: {
                botId,
                sourceId,
                content: chunk,
                embedding: embedding,
            },
        })
    }
}

/**
 * Find most relevant content for a query
 */
export async function findRelevantContent(
    botId: string,
    query: string,
    topK: number = 5
): Promise<{ content: string; similarity: number }[]> {
    try {
        // Get all embeddings for this bot
        const embeddings = await prisma.embedding.findMany({
            where: { botId },
            select: { content: true, embedding: true },
        })

        // If no embeddings, return empty array (bot not trained yet)
        if (embeddings.length === 0) {
            return []
        }

        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query)

        // Calculate similarities and sort
        const results = embeddings
            .map((e) => ({
                content: e.content,
                similarity: cosineSimilarity(queryEmbedding, e.embedding as number[]),
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK)

        return results
    } catch (error) {
        console.error('Error finding relevant content:', error)
        // Return empty array on error - chat will work without training data
        return []
    }
}
