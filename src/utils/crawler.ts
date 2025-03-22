import axios from 'axios';
import { translate } from '@vitalets/google-translate-api';
import { Article } from '../data/types';

interface FauxyArticle {
  title: string;
  content: string;
  imageUrl: string;
  category: string;
  date: string;
}

export async function crawlFauxyArticles(): Promise<Article[]> {
  try {
    // Initialize Exa client
    const exa = new Exa(process.env.EXA_API_KEY);
    
    // Search for recent articles from thefauxy.com
    const searchResults = await exa.search('site:thefauxy.com', {
      numResults: 20,
      useAutoprompt: false
    });

    const articles: Article[] = [];

    for (const result of searchResults.results) {
      try {
        // Get full content of the article
        const content = await exa.getContent(result.url);
        
        // Extract relevant information
        const article: FauxyArticle = {
          title: result.title,
          content: content.text,
          imageUrl: content.image || result.image || '',
          category: determineCategory(content.text),
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
    const result = await translate(text, { to: 'ml' });
    return result.text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

function determineCategory(content: string): string {
  const categories = {
    politics: ['politics', 'government', 'election', 'minister', 'party'],
    technology: ['tech', 'AI', 'software', 'digital', 'computer'],
    sports: ['cricket', 'football', 'sport', 'player', 'match'],
    entertainment: ['movie', 'actor', 'film', 'celebrity', 'entertainment'],
    global: ['world', 'international', 'global', 'foreign', 'country']
  };

  const contentLower = content.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
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