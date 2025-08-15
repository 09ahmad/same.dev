import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { URL } from 'url';

const OUTPUT_DIR = path.join(__dirname, 'website_clone_data');
const MAX_PAGES = 50;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export async function cleanupOldFiles(dir = OUTPUT_DIR, maxAgeMs = CLEANUP_INTERVAL_MS) {
  try {
    const files = await fs.readdir(dir);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (now - stat.mtimeMs > maxAgeMs) {
        await fs.unlink(filePath);
      }
    }
  } catch (err) {
    // Ignore errors if dir doesn't exist
  }
}

export async function scrapeAllPages(startUrl, outputDir = OUTPUT_DIR, maxPages = MAX_PAGES) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const visited = new Set();
  const queue = [startUrl];
  const results = [];
  const baseDomain = new URL(startUrl).origin;
  await fs.mkdir(outputDir, { recursive: true });

  let pageCount = 0;
  while (queue.length > 0 && pageCount < maxPages) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      // Screenshot
      const screenshotName = `screenshot_${pageCount + 1}.png`;
      const screenshotPath = path.join(outputDir, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // Extract data
      const data = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'))
          .map(img => img.src)
          .filter(Boolean);
        const dynamicContent = [];
        document.querySelectorAll('video, iframe, script[src]').forEach(el => {
          if (el.src) {
            dynamicContent.push({ tag: el.tagName.toLowerCase(), src: el.src });
          }
        });
        // Internal links
        const links = Array.from(document.querySelectorAll('a[href]'))
          .map(a => a.href)
          .filter(Boolean);
        return { images, dynamicContent, links };
      });

      // Filter and queue new internal links
      const newLinks = data.links.filter(link => {
        try {
          const u = new URL(link, baseDomain);
          return u.origin === baseDomain && !visited.has(u.href) && !queue.includes(u.href);
        } catch {
          return false;
        }
      });
      queue.push(...newLinks);

      results.push({
        url,
        screenshot: screenshotPath,
        images: data.images,
        dynamicContent: data.dynamicContent
      });
      pageCount++;
      console.log(`Scraped: ${url}`);
    } catch (err) {
      console.error(`Failed to scrape ${url}:`, err.message);
    }
  }
  await browser.close();
  // Save all results
  const jsonPath = path.join(outputDir, 'all_scraped_data.json');
  await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));
  return { results, jsonPath, screenshots: results.map(r => r.screenshot) };
}