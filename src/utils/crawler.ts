import axios from 'axios';
import { translate } from '@vitalets/google-translate-api';
import { Article } from '../data/types';
import Exa from 'exa-js';

interface FauxyArticle {
  title: string;
  content: string;
  imageUrl: string;
  category: string;
  date: string;
}

export async function crawlFauxyArticles(): Promise<Article[]> {
  try {
    // Initialize Exa client with your API key
    const exa = new Exa("f719f358-7ec7-4098-9c0f-07698598b95e");
    
    // Search for recent articles from thefauxy.com
    const searchResults = await exa.search("site:thefauxy.com", {
      numResults: 20,
      useAutoprompt: false
    });

    const articles: Article[] = [];

    for (const result of searchResults.results) {
      try {
        console.log(`Processing article: ${result.title} - ${result.url}`);
        
        let articleContent = "";
        let imageUrl = result.image || "";
        
        // Try to fetch content directly first
        try {
          const response = await axios.get(result.url, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          // Basic content extraction from HTML
          const html = response.data;
          
          // Extract main content (basic approach)
          const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
          if (bodyMatch && bodyMatch[1]) {
            // Remove scripts, styles, and HTML tags
            articleContent = bodyMatch[1]
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          }
          
          // Try to find image if not available
          if (!imageUrl) {
            const imgMatch = /<img[^>]+src="([^">]+)"/i.exec(html);
            if (imgMatch && imgMatch[1]) {
              imageUrl = imgMatch[1];
              // Convert relative URLs to absolute
              if (imageUrl.startsWith('/')) {
                const urlObj = new URL(result.url);
                imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
              }
            }
          }
        } catch (fetchError) {
          console.log(`Direct fetch failed, using search snippet: ${fetchError.message}`);
        }
        
        // If direct fetch failed, use the search snippet
        if (!articleContent && result.snippet) {
          articleContent = result.snippet;
        }
        
        // If still no content, skip this article
        if (!articleContent) {
          console.error('No content could be extracted for article:', result.url);
          continue;
        }

        // Extract relevant information
        const article: FauxyArticle = {
          title: result.title || '',
          content: articleContent,
          imageUrl: imageUrl,
          category: determineCategory(articleContent),
          date: new Date().toLocaleDateString('ml-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        };

        // Translate title and content to Malayalam
        const translatedTitle = await translateToMalayalam(article.title);
        const translatedContent = await translateToMalayalam(article.content);

        // Create article in the required format
        articles.push({
          id: generateId(translatedTitle),
          title: translatedTitle,
          excerpt: translatedContent.split('\n')[0], // First paragraph as excerpt
          content: translatedContent,
          category: article.category,
          date: article.date,
          author: 'Fauxy Bot',
          imageSrc: article.imageUrl
        });
        
        console.log(`Successfully processed article: ${article.title}`);
      } catch (error) {
        console.error('Error processing article:', error);
        continue;
      }
    }

    return articles;
  } catch (error) {
    console.error('Error crawling Fauxy articles:', error);
    return [];
  }
}

async function translateToMalayalam(text: string): Promise<string> {
  try {
    // If text is too long, split it into smaller chunks for translation
    if (text.length > 5000) {
      const chunks = [];
      for (let i = 0; i < text.length; i += 5000) {
        const chunk = text.slice(i, i + 5000);
        const translatedChunk = await translate(chunk, { to: 'ml' });
        chunks.push(translatedChunk.text);
      }
      return chunks.join(' ');
    } else {
      const result = await translate(text, { to: 'ml' });
      return result.text;
    }
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

function determineCategory(content: string): string {
  const categories = {
    politics: ['politics', 'government', 'election', 'minister', 'party', 'president', 'PM', 'parliament'],
    technology: ['tech', 'AI', 'software', 'digital', 'computer', 'internet', 'app', 'smartphone'],
    sports: ['cricket', 'football', 'sport', 'player', 'match', 'game', 'tournament', 'team'],
    entertainment: ['movie', 'actor', 'film', 'celebrity', 'entertainment', 'music', 'TV', 'show'],
    global: ['world', 'international', 'global', 'foreign', 'country', 'nation', 'diplomatic']
  };

  const contentLower = content.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => contentLower.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return 'global'; // Default category
}

function generateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
} 