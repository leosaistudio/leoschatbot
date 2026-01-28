/**
 * Direct Answer Matcher
 * Finds direct answers from Q&A content without using AI credits
 */

import { prisma } from '@/lib/db'

interface DirectMatch {
    found: boolean
    answer?: string
    source?: string
    confidence: number
}

/**
 * Try to find a direct answer from Q&A training sources
 * Returns match if question similarity is high enough
 */
export async function findDirectAnswer(botId: string, userQuestion: string): Promise<DirectMatch> {
    // Normalize the user question
    const normalizedQuestion = normalizeText(userQuestion)

    // Get all Q&A type training sources for this bot
    const qaSources = await prisma.trainingSource.findMany({
        where: {
            botId,
            type: 'qa',
            status: 'completed',
        },
        select: {
            content: true,
        },
    })

    // Parse Q&A pairs and check for matches
    for (const source of qaSources) {
        const pairs = parseQAPairs(source.content)

        for (const pair of pairs) {
            const similarity = calculateSimilarity(normalizedQuestion, normalizeText(pair.question))

            // High confidence match (above 80%)
            if (similarity >= 0.8) {
                return {
                    found: true,
                    answer: pair.answer,
                    source: 'qa',
                    confidence: similarity,
                }
            }
        }
    }

    // Also check for keyword-based matches in text/file/info sources
    const textSources = await prisma.trainingSource.findMany({
        where: {
            botId,
            type: { in: ['text', 'file', 'info'] },
            status: 'completed',
        },
        select: {
            content: true,
        },
    })

    // Look for simple keyword patterns like "שעות פעילות:", "טלפון:", "כתובת:"
    const simplePatterns = [
        { keywords: ['שעות', 'פעילות', 'פתוחים', 'סגורים', 'עובדים'], pattern: /שעות.*?:([^\n]+)/i },
        { keywords: ['טלפון', 'נייד', 'להתקשר', 'מספר', 'פלאפון'], pattern: /(?:טלפון|נייד).*?:([^\n]+)/i },
        { keywords: ['כתובת', 'מיקום', 'נמצאים', 'איפה', 'לאן', 'להגיע'], pattern: /(?:כתובת|מיקום).*?:([^\n]+)/i },
        { keywords: ['מייל', 'אימייל', 'email', 'דואר'], pattern: /(?:מייל|אימייל|email).*?:([^\n]+)/i },
        { keywords: ['מחיר', 'עלות', 'כמה עולה', 'תעריף'], pattern: /מחיר.*?:([^\n]+)/i },
        { keywords: ['עסק', 'מתעסקים', 'עוסקים', 'עושים'], pattern: /(?:אודות|תיאור|שם העסק).*?[:]\s*([^\n]+)/i },
        { keywords: ['אתר', 'website', 'לינק'], pattern: /אתר.*?:([^\n]+)/i },
    ]

    for (const { keywords, pattern } of simplePatterns) {
        if (keywords.some(kw => normalizedQuestion.includes(kw))) {
            for (const source of textSources) {
                const match = source.content.match(pattern)
                if (match) {
                    return {
                        found: true,
                        answer: match[1].trim(),
                        source: 'info',
                        confidence: 0.7,
                    }
                }
            }
        }
    }

    return { found: false, confidence: 0 }
}

/**
 * Parse Q&A content into pairs
 */
function parseQAPairs(content: string): { question: string; answer: string }[] {
    const pairs: { question: string; answer: string }[] = []

    // Skip the header if exists
    const lines = content.replace(/^\[שאלות ותשובות\]\n+/, '').split(/\n+---\n+/)

    for (const block of lines) {
        const questionMatch = block.match(/שאלה:\s*([\s\S]+?)(?=\nתשובה:)/)
        const answerMatch = block.match(/תשובה:\s*([\s\S]+)/)

        if (questionMatch && answerMatch) {
            pairs.push({
                question: questionMatch[1].trim(),
                answer: answerMatch[1].trim(),
            })
        }
    }

    return pairs
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[?!.,;:'"]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * Calculate text similarity using Jaccard similarity
 */
function calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(' '))
    const words2 = new Set(text2.split(' '))

    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])

    if (union.size === 0) return 0
    return intersection.size / union.size
}
