import { techArticles } from './techArticles';
import { globalArticles } from './globalArticles';
import { sportsArticles } from './sportsArticles';
import { politicsArticles } from './politicsArticles';
import { categoryNameMap } from './categoryNames';
import { Article, CategoryName } from './types';

// Import additional articles
import { moreTechArticles } from './moreTechArticles';
import { moreGlobalArticles } from './moreGlobalArticles';
import { moreSportsArticles } from './moreSportsArticles';
import { entertainmentArticles } from './entertainmentArticles';

// Combine all articles into a single array
export const allArticles: Article[] = [
  ...techArticles,
  ...globalArticles,
  ...sportsArticles,
  ...politicsArticles,
  ...moreTechArticles,
  ...moreGlobalArticles,
  ...moreSportsArticles,
  ...entertainmentArticles,
];

// Map of articles by category
export const articlesByCategory: Record<CategoryName, Article[]> = {
  technology: [...techArticles, ...moreTechArticles],
  global: [...globalArticles, ...moreGlobalArticles],
  sports: [...sportsArticles, ...moreSportsArticles],
  politics: politicsArticles,
  business: [],  // Empty for now
  opinion: [],   // Empty for now
  entertainment: entertainmentArticles,
  'movie-reviews': [], // Empty for now
};

// Map of articles by ID
export const articlesById: Record<string, Article> = allArticles.reduce((acc, article) => {
  acc[article.id] = article;
  return acc;
}, {} as Record<string, Article>);

export {
  techArticles,
  globalArticles,
  sportsArticles,
  politicsArticles,
  categoryNameMap,
  moreTechArticles,
  moreGlobalArticles,
  moreSportsArticles,
  entertainmentArticles,
};
