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
        // Get full content of the article using getContents
        const content = await exa.getContents(
          [result.url],
          {
            text: true,
            html: false
          }
        );
        
        if (!content.results?.[0]) {
          console.error('No content found for article:', result.url);
          continue;
        }

        // Extract relevant information
        const article: FauxyArticle = {
          title: result.title || '',
          content: content.results[0].text || '',
          imageUrl: result.image || '',
          category: determineCategory(content.results[0].text || ''),
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