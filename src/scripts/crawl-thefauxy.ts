import { crawlTheFauxy } from '../crawlers/thefauxy-crawler';
import fs from 'fs';
import path from 'path';
import { Article } from '../data/types';

/**
 * Script to crawl thefauxy.com and save articles to data files
 */
async function main() {
  try {
    console.log('Starting thefauxy.com crawler');
    
    // Crawl thefauxy.com for articles
    const articles = await crawlTheFauxy(15); // Get up to 15 articles
    
    if (articles.length === 0) {
      console.log('No articles found. Exiting.');
      return;
    }
    
    console.log(`Successfully crawled ${articles.length} articles from thefauxy.com`);
    
    // Organize articles by category
    const categorizedArticles: Record<string, Article[]> = {};
    
    for (const article of articles) {
      if (!categorizedArticles[article.category]) {
        categorizedArticles[article.category] = [];
      }
      
      categorizedArticles[article.category].push(article);
    }
    
    // Save articles to category-specific files
    for (const [category, categoryArticles] of Object.entries(categorizedArticles)) {
      await saveArticlesToFile(category, categoryArticles);
    }
    
    console.log('Successfully saved all articles to data files');
  } catch (error) {
    console.error('Error running thefauxy crawler:', error);
  }
}

/**
 * Saves articles to a category-specific file.
 */
async function saveArticlesToFile(category: string, articles: Article[]) {
  try {
    // Determine the output file path based on the category
    let outputFileName: string;
    
    switch (category) {
      case 'global':
        outputFileName = 'src/data/globalArticles.ts';
        break;
      case 'politics':
        outputFileName = 'src/data/politicsArticles.ts';
        break;
      case 'sports':
        outputFileName = 'src/data/sportsArticles.ts';
        break;
      case 'technology':
        outputFileName = 'src/data/technologyArticles.ts';
        break;
      case 'business':
        outputFileName = 'src/data/businessArticles.ts';
        break;
      case 'opinion':
        outputFileName = 'src/data/opinionArticles.ts';
        break;
      case 'entertainment':
        outputFileName = 'src/data/entertainmentArticles.ts';
        break;
      case 'movie-reviews':
        outputFileName = 'src/data/movieReviewsArticles.ts';
        break;
      default:
        outputFileName = `src/data/${category}Articles.ts`;
        break;
    }
    
    // Check if file exists
    const fileExists = fs.existsSync(outputFileName);
    
    if (fileExists) {
      // Read existing articles
      const currentContent = fs.readFileSync(outputFileName, 'utf-8');
      
      // Extract the existing array
      const match = currentContent.match(/export const \w+Articles: Article\[\] = (\[[\s\S]*\]);/);
      
      if (match && match[1]) {
        try {
          // Parse the existing array
          // This is a simplified approach and may not work for complex data structures
          const existingArticlesStr = match[1].replace(/'/g, '"')
            .replace(/(\w+):/g, '"$1":'); // Convert property names to quoted strings
          
          // Parse existing articles
          const existingArticles = JSON.parse(existingArticlesStr);
          
          // Combine with new articles
          const combinedArticles = [...existingArticles, ...articles];
          
          // Remove duplicates based on ID
          const uniqueArticles = Array.from(
            new Map(combinedArticles.map(article => [article.id, article])).values()
          );
          
          // Create updated file content
          const categoryVar = category.replace(/-/g, '');
          const updatedContent = `import { Article } from './types';

export const ${categoryVar}Articles: Article[] = ${JSON.stringify(uniqueArticles, null, 2)};
`;
          
          // Write to file
          fs.writeFileSync(outputFileName, updatedContent);
          console.log(`Updated ${articles.length} articles in ${outputFileName}`);
        } catch (error) {
          console.error(`Error parsing existing articles in ${outputFileName}:`, error);
          
          // Fallback: Create a new file with just the new articles
          writeNewArticlesFile(outputFileName, category, articles);
        }
      } else {
        // If the file exists but doesn't match the expected format, create a new file
        writeNewArticlesFile(outputFileName, category, articles);
      }
    } else {
      // If the file doesn't exist, create it
      writeNewArticlesFile(outputFileName, category, articles);
    }
  } catch (error) {
    console.error(`Error saving articles for category ${category}:`, error);
  }
}

/**
 * Writes a new articles file with the specified articles.
 */
function writeNewArticlesFile(outputFileName: string, category: string, articles: Article[]) {
  // Ensure directory exists
  const dir = path.dirname(outputFileName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Create the file content
  const categoryVar = category.replace(/-/g, '');
  const content = `import { Article } from './types';

export const ${categoryVar}Articles: Article[] = ${JSON.stringify(articles, null, 2)};
`;
  
  // Write to file
  fs.writeFileSync(outputFileName, content);
  console.log(`Created new file ${outputFileName} with ${articles.length} articles`);
}

// Run the crawler
main().catch(console.error); 