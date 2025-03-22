import { crawlFauxyArticles } from '../utils/crawler';
import { Article } from '../data/types';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Set to track categories that have been updated
    const updatedCategories = new Set<string>();

    // Update category files
    for (const [category, articles] of Object.entries(articlesByCategory)) {
      const categoryFileName = `${category}Articles.ts`;
      const filePath = path.join(__dirname, '..', 'data', categoryFileName);
      
      updatedCategories.add(category);

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

    // Update main index.ts to include new category files
    await updateMainIndex(updatedCategories);

    console.log('Successfully updated all articles');
  } catch (error) {
    console.error('Error updating articles:', error);
  }
}

async function updateMainIndex(updatedCategories: Set<string>) {
  try {
    const indexPath = path.join(__dirname, '..', 'data', 'index.ts');
    
    // Read current index.ts
    let indexContent = '';
    try {
      indexContent = await fs.readFile(indexPath, 'utf-8');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Create new file if it doesn't exist
        indexContent = `import { Article } from './types';\n\n// Import all article categories\n`;
      } else {
        throw error;
      }
    }

    // Check for imports and add missing ones
    const importedCategories = new Set<string>();
    const importRegex = /import\s+{\s+(\w+)Articles\s+}\s+from\s+['"]\.\/([\w]+)Articles['"]/g;
    let importMatch;
    
    while ((importMatch = importRegex.exec(indexContent)) !== null) {
      importedCategories.add(importMatch[1]);
    }
    
    // Add imports for new categories
    let updatedContent = indexContent;
    let importsAdded = false;
    
    for (const category of updatedCategories) {
      if (!importedCategories.has(category)) {
        // Add import if it doesn't exist
        const importStatement = `import { ${category}Articles } from './${category}Articles';\n`;
        
        // Find where to add the import (after the last import or at the beginning)
        const lastImportIndex = updatedContent.lastIndexOf('import');
        if (lastImportIndex !== -1) {
          const endOfLineIndex = updatedContent.indexOf('\n', lastImportIndex) + 1;
          updatedContent = 
            updatedContent.substring(0, endOfLineIndex) + 
            importStatement + 
            updatedContent.substring(endOfLineIndex);
        } else {
          updatedContent = importStatement + updatedContent;
        }
        
        importsAdded = true;
      }
    }
    
    // Find the allArticles array definition
    const allArticlesMatch = updatedContent.match(/export const allArticles:\s*Article\[\]\s*=\s*\[([\s\S]*?)\];/);
    
    if (allArticlesMatch) {
      // Update existing allArticles definition
      let allArticlesContent = allArticlesMatch[1];
      let updatedAllArticles = allArticlesContent;
      
      for (const category of updatedCategories) {
        if (!allArticlesContent.includes(`...${category}Articles`)) {
          // Add this category to allArticles if it's not there
          if (updatedAllArticles.trim()) {
            updatedAllArticles += `,\n  ...${category}Articles`;
          } else {
            updatedAllArticles = `\n  ...${category}Articles`;
          }
        }
      }
      
      if (updatedAllArticles !== allArticlesContent) {
        updatedContent = updatedContent.replace(
          /export const allArticles:\s*Article\[\]\s*=\s*\[([\s\S]*?)\];/, 
          `export const allArticles: Article[] = [${updatedAllArticles}\n];`
        );
      }
    } else {
      // Create allArticles if it doesn't exist
      const allArticlesDefinition = `
// Combine all articles into a single array
export const allArticles: Article[] = [
  ${Array.from(updatedCategories).map(c => `...${c}Articles`).join(',\n  ')}
];
`;
      updatedContent += allArticlesDefinition;
    }
    
    // Check for articlesByCategory definition and update it
    const articlesByCategoryMatch = updatedContent.match(/export const articlesByCategory\s*=\s*{([\s\S]*?)};/);
    
    if (articlesByCategoryMatch) {
      // Update existing articlesByCategory
      let categoryMapContent = articlesByCategoryMatch[1];
      let updatedCategoryMap = categoryMapContent;
      
      for (const category of updatedCategories) {
        if (!categoryMapContent.includes(`${category}: ${category}Articles`)) {
          // Add this category to the map if it's not there
          if (updatedCategoryMap.trim()) {
            updatedCategoryMap += `,\n  ${category}: ${category}Articles`;
          } else {
            updatedCategoryMap = `\n  ${category}: ${category}Articles`;
          }
        }
      }
      
      if (updatedCategoryMap !== categoryMapContent) {
        updatedContent = updatedContent.replace(
          /export const articlesByCategory\s*=\s*{([\s\S]*?)};/, 
          `export const articlesByCategory = {${updatedCategoryMap}\n};`
        );
      }
    } else {
      // Create articlesByCategory if it doesn't exist
      const categoryMapDefinition = `
// Map articles by category
export const articlesByCategory = {
  ${Array.from(updatedCategories).map(c => `${c}: ${c}Articles`).join(',\n  ')}
};
`;
      updatedContent += categoryMapDefinition;
    }
    
    // Check for articlesById definition
    if (!updatedContent.includes('export const articlesById')) {
      // Add articlesById if it doesn't exist
      updatedContent += `
// Map articles by ID for quick lookup
export const articlesById = allArticles.reduce((acc, article) => {
  acc[article.id] = article;
  return acc;
}, {} as Record<string, Article>);
`;
    }
    
    // Write updated content back to file
    if (updatedContent !== indexContent) {
      await fs.writeFile(indexPath, updatedContent, 'utf-8');
      console.log('Updated data/index.ts with new categories');
    }
    
  } catch (error) {
    console.error('Error updating main index file:', error);
  }
}

// Run the script
updateArticles(); 