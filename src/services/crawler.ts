import * as cheerio from 'cheerio'

export interface CrawlResult {
    url: string
    title: string
    content: string
    links: string[]
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ChatBot-Crawler/1.0',
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status}`)
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // Remove unwanted elements
        $('script, style, nav, footer, header, iframe, noscript').remove()

        // Extract title
        const title = $('title').text().trim() || $('h1').first().text().trim() || url

        // Extract main content
        const content = extractContent($)

        // Extract links from the same domain
        const baseUrl = new URL(url)
        const links: string[] = []

        $('a[href]').each((_, el) => {
            const href = $(el).attr('href')
            if (href) {
                try {
                    const linkUrl = new URL(href, url)
                    if (linkUrl.hostname === baseUrl.hostname && !links.includes(linkUrl.href)) {
                        links.push(linkUrl.href)
                    }
                } catch {
                    // Invalid URL, skip
                }
            }
        })

        return { url, title, content, links }
    } catch (error) {
        console.error(`Error crawling ${url}:`, error)
        throw error
    }
}

function extractContent($: cheerio.CheerioAPI): string {
    // Try to find main content areas
    const mainSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '#content',
        '.post-content',
        '.entry-content',
    ]

    let content = ''

    for (const selector of mainSelectors) {
        const element = $(selector)
        if (element.length > 0) {
            content = element.text()
            break
        }
    }

    // Fallback to body
    if (!content) {
        content = $('body').text()
    }

    // Clean up whitespace
    return content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim()
}

export async function crawlWebsite(
    startUrl: string,
    maxPages: number = 10
): Promise<CrawlResult[]> {
    const results: CrawlResult[] = []
    const visited = new Set<string>()
    const queue: string[] = [startUrl]

    while (queue.length > 0 && results.length < maxPages) {
        const url = queue.shift()!

        if (visited.has(url)) continue
        visited.add(url)

        try {
            const result = await crawlUrl(url)
            results.push(result)

            // Add new links to queue
            for (const link of result.links) {
                if (!visited.has(link) && !queue.includes(link)) {
                    queue.push(link)
                }
            }
        } catch (error) {
            console.error(`Failed to crawl ${url}:`, error)
        }
    }

    return results
}
