import { crawlFauxyArticles } from '../utils/crawler';
import { Article } from '../data/types';
import fs from 'fs/promises';
import path from 'path';

async function updateArticles() {
  try {
    // Fetch new articles
    const newArticles = await crawlFauxyArticles();
    
    if (newArticles.length === 0) {
      console.log('No new articles found');
      return;
    }

    // Group articles by category
    const articlesByCategory = newArticles.reduce((acc, article) => {
      const category = article.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(article);
      return acc;
    }, {} as Record<string, Article[]>);

    // Update category files
    for (const [category, articles] of Object.entries(articlesByCategory)) {
      const categoryFileName = `${category}Articles.ts`;
      const filePath = path.join(__dirname, '..', 'data', categoryFileName);

      try {
        // Read existing articles
        const existingContent = await fs.readFile(filePath, 'utf-8');
        const existingArticlesMatch = existingContent.match(/export const \w+Articles = (\[[\s\S]*?\]);/);
        const existingArticles: Article[] = existingArticlesMatch 
          ? JSON.parse(existingArticlesMatch[1].replace(/'/g, '"'))
          : [];

        // Combine existing and new articles, remove duplicates
        const combinedArticles = [
          ...articles,
          ...existingArticles.filter(existing => 
            !articles.some(newArticle => newArticle.id === existing.id)
          )
        ];

        // Generate new file content
        const newContent = `import { Article } from './types';\n\nexport const ${category}Articles: Article[] = ${
          JSON.stringify(combinedArticles, null, 2)
        };\n`;

        // Write back to file
        await fs.writeFile(filePath, newContent, 'utf-8');
        console.log(`Updated ${category} articles`);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // Create new file if it doesn't exist
          const newContent = `import { Article } from './types';\n\nexport const ${category}Articles: Article[] = ${
            JSON.stringify(articles, null, 2)
          };\n`;
          await fs.writeFile(filePath, newContent, 'utf-8');
          console.log(`Created new file for ${category} articles`);
        } else {
          console.error(`Error updating ${category} articles:`, error);
        }
      }
    }

    console.log('Successfully updated all articles');
  } catch (error) {
    console.error('Error updating articles:', error);
  }
}

// Run the script
updateArticles(); 