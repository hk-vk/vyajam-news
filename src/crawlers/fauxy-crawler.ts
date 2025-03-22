import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import { translate } from 'google-translate-api-x';
import fs from 'fs/promises';
import path from 'path';

interface Article {
  title: string;
  content: string;
  date: string;
  category: string;
  originalUrl: string;
  translatedTitle: string;
  translatedContent: string;
}

async function translateText(text: string): Promise<string> {
  try {
    const result = await translate(text, { from: 'en', to: 'ml' });
    return result.text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

async function crawlArticle(url: string): Promise<Article | null> {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const title = $('h1.entry-title').text().trim();
    const content = $('.entry-content p').map((_, el) => $(el).text().trim()).get().join('\n');
    const date = $('.entry-date').first().text().trim();
    const category = $('.cat-links a').first().text().trim();
    
    if (!title || !content) {
      console.log(`Skipping article at ${url} - missing title or content`);
      return null;
    }

    const translatedTitle = await translateText(title);
    const translatedContent = await translateText(content);

    return {
      title,
      content,
      date,
      category,
      originalUrl: url,
      translatedTitle,
      translatedContent,
    };
  } catch (error) {
    console.error(`Error crawling article at ${url}:`, error);
    return null;
  } finally {
    await browser.close();
  }
}

async function getArticleUrls(baseUrl: string): Promise<string[]> {
  const browser = await puppeteer.launch({ headless: 'new' });
  const urls: string[] = [];
  
  try {
    const page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    // Get article URLs from the main page
    $('article h2.entry-title a').each((_, el) => {
      const url = $(el).attr('href');
      if (url) urls.push(url);
    });
    
    return urls;
  } catch (error) {
    console.error('Error getting article URLs:', error);
    return [];
  } finally {
    await browser.close();
  }
}

async function saveArticles(articles: Article[]) {
  const dataDir = path.join(process.cwd(), 'src', 'data', 'articles');
  await fs.mkdir(dataDir, { recursive: true });
  
  const articlesFile = path.join(dataDir, 'fauxy-articles.json');
  await fs.writeFile(articlesFile, JSON.stringify(articles, null, 2), 'utf-8');
}

async function main() {
  const baseUrl = 'https://thefauxy.com';
  console.log('Starting to crawl thefauxy.com...');
  
  const articleUrls = await getArticleUrls(baseUrl);
  console.log(`Found ${articleUrls.length} articles to process`);
  
  const articles: Article[] = [];
  
  for (const url of articleUrls) {
    console.log(`Processing article: ${url}`);
    const article = await crawlArticle(url);
    if (article) {
      articles.push(article);
      console.log(`Successfully processed article: ${article.title}`);
    }
  }
  
  await saveArticles(articles);
  console.log(`Finished processing ${articles.length} articles`);
}

// Only run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { crawlArticle, getArticleUrls, saveArticles, main }; 