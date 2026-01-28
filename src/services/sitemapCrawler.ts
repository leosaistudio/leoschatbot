/**
 * Sitemap Crawler Service
 * Processes URLs in batches with auto-continue
 */

import { prisma } from '@/lib/db'
import { crawlUrl } from './crawler'
import { storeEmbeddings } from './embeddings'

const BATCH_SIZE = 10

/**
 * Start a new sitemap crawl job
 */
export async function startSitemapCrawl(
    botId: string,
    urls: string[],
    sitemapUrl?: string
): Promise<string> {
    // Create crawl job
    const crawl = await prisma.sitemapCrawl.create({
        data: {
            botId,
            sitemapUrl,
            status: 'processing',
            totalUrls: urls.length,
            urls: urls,
        },
    })

    // Start processing in background
    processNextBatch(crawl.id)

    return crawl.id
}

/**
 * Process next batch of URLs
 */
export async function processNextBatch(crawlId: string): Promise<void> {
    try {
        const crawl = await prisma.sitemapCrawl.findUnique({
            where: { id: crawlId },
        })

        if (!crawl || crawl.status === 'completed' || crawl.status === 'failed') {
            return
        }

        const urls = crawl.urls as string[]
        const startIndex = crawl.currentIndex
        const endIndex = Math.min(startIndex + BATCH_SIZE, urls.length)
        const batchUrls = urls.slice(startIndex, endIndex)

        if (batchUrls.length === 0) {
            // All done!
            await prisma.sitemapCrawl.update({
                where: { id: crawlId },
                data: { status: 'completed' },
            })
            console.log(`Sitemap crawl ${crawlId} completed!`)
            return
        }

        console.log(`Processing batch ${startIndex}-${endIndex} of ${urls.length}`)

        let successCount = 0
        let failCount = 0

        // Process each URL in batch
        for (const url of batchUrls) {
            try {
                // Crawl the URL
                const result = await crawlUrl(url)

                // Create training source
                const source = await prisma.trainingSource.create({
                    data: {
                        botId: crawl.botId,
                        type: 'url',
                        content: url,
                        status: 'processing',
                    },
                })

                // Store embeddings
                await storeEmbeddings(crawl.botId, source.id, result.content)

                // Update source status
                await prisma.trainingSource.update({
                    where: { id: source.id },
                    data: { status: 'completed' },
                })

                successCount++
            } catch (error) {
                console.error(`Failed to crawl ${url}:`, error)
                failCount++
            }
        }

        // Update crawl progress
        await prisma.sitemapCrawl.update({
            where: { id: crawlId },
            data: {
                currentIndex: endIndex,
                processedUrls: { increment: successCount },
                failedUrls: { increment: failCount },
            },
        })

        // Continue with next batch (async, don't await)
        if (endIndex < urls.length) {
            // Small delay between batches to avoid overwhelming
            setTimeout(() => {
                processNextBatch(crawlId)
            }, 1000)
        } else {
            // All done!
            await prisma.sitemapCrawl.update({
                where: { id: crawlId },
                data: { status: 'completed' },
            })
            console.log(`Sitemap crawl ${crawlId} completed!`)
        }
    } catch (error) {
        console.error(`Sitemap crawl ${crawlId} failed:`, error)
        await prisma.sitemapCrawl.update({
            where: { id: crawlId },
            data: {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        })
    }
}

/**
 * Get crawl status
 */
export async function getCrawlStatus(crawlId: string) {
    return prisma.sitemapCrawl.findUnique({
        where: { id: crawlId },
        select: {
            id: true,
            status: true,
            totalUrls: true,
            processedUrls: true,
            failedUrls: true,
            currentIndex: true,
            error: true,
            createdAt: true,
            updatedAt: true,
        },
    })
}
