import axios from 'axios';
import { translate } from '@vitalets/google-translate-api';
import { Article } from '../data/types';
import Exa from 'exa-js';

// Flag to use mock translator when rate limited
const USE_MOCK_TRANSLATOR = true;

// Mock Malayalam words to use for development
const MOCK_MALAYALAM_WORDS = [
  'സമയം', 'ചെയ്യുക', 'വിവരം', 'വാർത്ത', 'ലോകം', 'രാഷ്ട്രീയം',
  'സാങ്കേതിക', 'സാമ്പത്തിക', 'കായികം', 'വിനോദം', 'ആരോഗ്യം',
  'ജനങ്ങൾ', 'രാജ്യം', 'സർക്കാർ', 'പ്രധാന', 'വലിയ', 'ചെറിയ'
];

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
        } catch (fetchError: any) {
          console.log(`Direct fetch failed, using search snippet: ${fetchError.message}`);
        }
        
        // If direct fetch failed, use the search description or title as content
        if (!articleContent) {
          // Use result title if no content was found
          articleContent = `Information about ${result.title}`;
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
        let translatedTitle;
        let translatedContent;
        
        try {
          translatedTitle = await translateToMalayalam(article.title);
          translatedContent = await translateToMalayalam(article.content);
        } catch (error) {
          console.error('Translation failed completely, using mock translation:', error);
          
          // Use mock translation as a fallback
          translatedTitle = mockTranslate(article.title);
          translatedContent = mockTranslate(article.content);
        }

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
  // If we're using mock translation, don't even try the real API
  if (USE_MOCK_TRANSLATOR) {
    return mockTranslate(text);
  }
  
  // Maximum number of retries
  const maxRetries = 3;
  
  // Handle empty text
  if (!text || text.trim() === '') {
    return '';
  }
  
  // If text is too long, split it into smaller chunks for translation
  if (text.length > 1000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += 1000) {
      const chunk = text.slice(i, i + 1000);
      try {
        const translatedChunk = await translateWithRetry(chunk, maxRetries);
        chunks.push(translatedChunk);
        
        // Add delay between chunks to avoid rate limiting
        if (i + 1000 < text.length) {
          await delay(2000); // 2 seconds delay between chunks
        }
      } catch (error) {
        console.error('Translation error for chunk:', error);
        chunks.push(mockTranslate(chunk)); // Use mock translation if real translation fails
      }
    }
    return chunks.join(' ');
  } else {
    try {
      return await translateWithRetry(text, maxRetries);
    } catch (error) {
      console.error('Translation error:', error);
      return mockTranslate(text); // Use mock translation if real translation fails
    }
  }
}

// Mock translator function
function mockTranslate(text: string): string {
  // Split the original text into words
  const words = text.split(/\s+/);
  
  // Create a mock translation by replacing some words with Malayalam words
  const translatedWords = words.map(word => {
    // About 30% of words are replaced with Malayalam words
    if (Math.random() < 0.3 && word.length > 3) {
      const randomIndex = Math.floor(Math.random() * MOCK_MALAYALAM_WORDS.length);
      return MOCK_MALAYALAM_WORDS[randomIndex];
    }
    return word;
  });
  
  return translatedWords.join(' ');
}

// Helper function to translate with retries
async function translateWithRetry(text: string, maxRetries: number): Promise<string> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // If not the first attempt, wait longer between attempts
      if (attempt > 0) {
        const delayMs = 2000 * Math.pow(2, attempt); // Exponential backoff
        console.log(`Retry ${attempt+1}/${maxRetries} after ${delayMs}ms delay`);
        await delay(delayMs);
      }
      
      const result = await translate(text, { to: 'ml' });
      return result.text;
    } catch (error: any) {
      console.log(`Translation attempt ${attempt+1} failed:`, error.message);
      lastError = error;
      
      // If not a rate limit error, don't retry
      if (!(error.message && error.message.includes('Too Many Requests'))) {
        throw error;
      }
    }
  }
  
  // If we got here, all retries failed
  throw lastError || new Error('Translation failed after retries');
}

// Simple delay function
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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