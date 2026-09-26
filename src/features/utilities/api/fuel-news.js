/**
 * Recent Vietnamese news about fuel prices, from Google News' public RSS
 * search. Server-only (called from the page); cached for an hour by Next's
 * fetch cache. Any failure → no articles, the page just hides the section.
 */

const FEED_URL =
  'https://news.google.com/rss/search?q=gi%C3%A1+x%C4%83ng+d%E1%BA%A7u&hl=vi&gl=VN&ceid=VN:vi';
const MAX_ARTICLES = 6;

/**
 * @typedef {{ title: string, url: string, source: string, publishedAt: string }} FuelNewsArticle
 * `publishedAt` is an ISO timestamp.
 */

/** @param {string} text */
function decodeXml(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * @param {string} item
 * @param {string} tag
 */
function tagText(item, tag) {
  const match = item.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXml(match[1]) : '';
}

/**
 * RSS → newest articles first. Titles drop Google's " - Source" suffix;
 * only http(s) links are kept.
 * @param {string} xml
 * @param {number} [limit]
 * @returns {FuelNewsArticle[]}
 */
export function parseFuelNews(xml, limit = MAX_ARTICLES) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items
    .map((item) => {
      const source = tagText(item, 'source');
      const rawTitle = tagText(item, 'title');
      const suffix = source ? ` - ${source}` : '';
      const title =
        suffix && rawTitle.endsWith(suffix)
          ? rawTitle.slice(0, -suffix.length)
          : rawTitle;
      const published = new Date(tagText(item, 'pubDate'));
      return {
        title,
        url: tagText(item, 'link'),
        source,
        publishedAt: Number.isNaN(published.getTime())
          ? ''
          : published.toISOString(),
      };
    })
    .filter(
      (article) =>
        article.title &&
        article.publishedAt &&
        /^https?:\/\//.test(article.url),
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

/** @returns {Promise<FuelNewsArticle[]>} */
export async function fetchFuelNews() {
  try {
    // `next` is Next.js' fetch-cache extension, unknown to lib.dom's RequestInit.
    const init = /** @type {RequestInit} */ ({
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    const response = await fetch(FEED_URL, init);
    if (!response.ok) return [];
    return parseFuelNews(await response.text());
  } catch {
    return [];
  }
}
