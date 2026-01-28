import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseFullSitemap, parseXmlFile } from '@/services/sitemapParser'
import { startSitemapCrawl, getCrawlStatus } from '@/services/sitemapCrawler'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST - Start sitemap crawl
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
        }

        const { id: botId } = await params
        const body = await request.json()
        const { sitemapUrl, xmlContent } = body

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { id: botId, userId: session.user.id },
        })

        if (!bot) {
            return NextResponse.json({ error: 'הבוט לא נמצא' }, { status: 404 })
        }

        // Check for active crawl
        const activeCrawl = await prisma.sitemapCrawl.findFirst({
            where: {
                botId,
                status: { in: ['pending', 'processing'] },
            },
        })

        if (activeCrawl) {
            return NextResponse.json(
                { error: 'יש כבר סריקה פעילה. נא להמתין לסיומה.' },
                { status: 400 }
            )
        }

        let urls: string[] = []

        if (sitemapUrl) {
            // Parse sitemap from URL
            urls = await parseFullSitemap(sitemapUrl)
        } else if (xmlContent) {
            // Parse from uploaded XML content
            urls = parseXmlFile(xmlContent)
        } else {
            return NextResponse.json(
                { error: 'נא לספק URL של מפת אתר או קובץ XML' },
                { status: 400 }
            )
        }

        if (urls.length === 0) {
            return NextResponse.json(
                { error: 'לא נמצאו קישורים במפת האתר' },
                { status: 400 }
            )
        }

        // Start crawl
        const crawlId = await startSitemapCrawl(botId, urls, sitemapUrl)

        return NextResponse.json({
            crawlId,
            totalUrls: urls.length,
            message: `מתחיל לסרוק ${urls.length} עמודים...`,
        })
    } catch (error) {
        console.error('Error starting sitemap crawl:', error)
        return NextResponse.json(
            { error: 'שגיאה בפרסור מפת האתר' },
            { status: 500 }
        )
    }
}

// GET - Get current crawl status
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
        }

        const { id: botId } = await params

        // Verify ownership
        const bot = await prisma.bot.findFirst({
            where: { id: botId, userId: session.user.id },
        })

        if (!bot) {
            return NextResponse.json({ error: 'הבוט לא נמצא' }, { status: 404 })
        }

        // Get latest crawl
        const latestCrawl = await prisma.sitemapCrawl.findFirst({
            where: { botId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                sitemapUrl: true,
                totalUrls: true,
                processedUrls: true,
                failedUrls: true,
                error: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return NextResponse.json({ crawl: latestCrawl })
    } catch (error) {
        console.error('Error getting crawl status:', error)
        return NextResponse.json({ error: 'שגיאה בקבלת סטטוס' }, { status: 500 })
    }
}
