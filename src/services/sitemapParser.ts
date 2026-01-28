/**
 * Sitemap Parser Service
 * Parses sitemap XML to extract all URLs
 */

interface SitemapUrl {
    loc: string
    lastmod?: string
    priority?: string
}

/**
 * Fetch and parse sitemap from URL
 */
export async function parseSitemapUrl(url: string): Promise<string[]> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ChatBotAI/1.0)',
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch sitemap: ${response.status}`)
        }

        const content = await response.text()
        return parseSitemapXml(content)
    } catch (error) {
        console.error('Error fetching sitemap:', error)
        throw error
    }
}

/**
 * Parse sitemap XML content to extract URLs
 * Handles both regular sitemaps and sitemap index files
 */
export function parseSitemapXml(content: string): string[] {
    const urls: string[] = []

    // Check if this is a sitemap index (contains other sitemaps)
    const sitemapIndexMatch = content.match(/<sitemap>/gi)
    if (sitemapIndexMatch) {
        // Extract sitemap locations from index
        const sitemapLocRegex = /<sitemap>\s*<loc>([^<]+)<\/loc>/gi
        let match
        while ((match = sitemapLocRegex.exec(content)) !== null) {
            urls.push(match[1].trim())
        }
        console.log(`Found ${urls.length} sub-sitemaps in index`)
        return urls
    }

    // Regular sitemap - extract URLs
    const urlLocRegex = /<url>\s*<loc>([^<]+)<\/loc>/gi
    let match
    while ((match = urlLocRegex.exec(content)) !== null) {
        const url = match[1].trim()
        // Filter out image URLs, PDFs, etc.
        if (!url.match(/\.(jpg|jpeg|png|gif|pdf|css|js|svg|ico)$/i)) {
            urls.push(url)
        }
    }

    console.log(`Found ${urls.length} URLs in sitemap`)
    return urls
}

/**
 * Parse uploaded XML file content
 */
export function parseXmlFile(content: string): string[] {
    return parseSitemapXml(content)
}

/**
 * Recursively parse sitemap index to get all URLs
 */
export async function parseFullSitemap(sitemapUrl: string): Promise<string[]> {
    const allUrls: string[] = []

    const urls = await parseSitemapUrl(sitemapUrl)

    // Check if any URLs are sub-sitemaps
    for (const url of urls) {
        if (url.includes('sitemap') && url.endsWith('.xml')) {
            // This is likely a sub-sitemap, parse it too
            try {
                const subUrls = await parseSitemapUrl(url)
                allUrls.push(...subUrls.filter(u => !u.includes('sitemap')))
            } catch (error) {
                console.error(`Failed to parse sub-sitemap ${url}:`, error)
            }
        } else {
            allUrls.push(url)
        }
    }

    return allUrls
}
