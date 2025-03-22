import React, { useState } from 'react';
import { crawlTheFauxyInBrowser } from '../crawlers/thefauxy-browser-crawler';
import { Article } from '../data/types';

/**
 * Component to crawl and display articles from thefauxy.com
 */
const TheFauxyCrawler: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [maxArticles, setMaxArticles] = useState(5);

  /**
   * Start crawling thefauxy.com
   */
  const startCrawling = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Starting to crawl thefauxy.com for ${maxArticles} articles...`);
      const crawledArticles = await crawlTheFauxyInBrowser(maxArticles);
      
      if (crawledArticles.length === 0) {
        setError('No articles found. Please try again later.');
      } else {
        setArticles(crawledArticles);
        console.log(`Successfully crawled ${crawledArticles.length} articles.`);
      }
    } catch (err) {
      console.error('Error crawling thefauxy.com:', err);
      setError('An error occurred while crawling. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save crawled articles to localStorage
   */
  const saveArticles = () => {
    try {
      // Group articles by category
      const categorizedArticles: Record<string, Article[]> = {};
      
      for (const article of articles) {
        if (!categorizedArticles[article.category]) {
          categorizedArticles[article.category] = [];
        }
        
        categorizedArticles[article.category].push(article);
      }
      
      // Save each category to localStorage
      for (const [category, categoryArticles] of Object.entries(categorizedArticles)) {
        const existingArticlesJson = localStorage.getItem(`${category}Articles`);
        let combinedArticles: Article[] = [];
        
        if (existingArticlesJson) {
          try {
            const existingArticles = JSON.parse(existingArticlesJson);
            // Combine existing and new articles, removing duplicates based on ID
            combinedArticles = Array.from(
              new Map([...existingArticles, ...categoryArticles].map(article => [article.id, article])).values()
            );
          } catch (error) {
            console.error(`Error parsing existing articles for ${category}:`, error);
            combinedArticles = categoryArticles;
          }
        } else {
          combinedArticles = categoryArticles;
        }
        
        // Save to localStorage
        localStorage.setItem(`${category}Articles`, JSON.stringify(combinedArticles));
      }
      
      alert(`Successfully saved ${articles.length} articles to localStorage.`);
    } catch (err) {
      console.error('Error saving articles:', err);
      setError('Failed to save articles to localStorage.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">TheFauxy Crawler</h2>
      
      <div className="mb-6 flex items-center space-x-4">
        <label className="flex items-center">
          <span className="mr-2">Max Articles:</span>
          <input
            type="number"
            min="1"
            max="20"
            value={maxArticles}
            onChange={(e) => setMaxArticles(parseInt(e.target.value) || 5)}
            className="border p-2 rounded w-20"
          />
        </label>
        
        <button
          onClick={startCrawling}
          disabled={isLoading}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Crawling...' : 'Start Crawling'}
        </button>
        
        {articles.length > 0 && (
          <button
            onClick={saveArticles}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Save Articles
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-md">
          Crawling thefauxy.com... This may take a moment.
        </div>
      )}
      
      {articles.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Crawled Articles ({articles.length})</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <div key={article.id} className="border rounded-lg p-4 shadow-sm">
                <h4 className="text-lg font-medium mb-2">{article.title}</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                    {article.category}
                  </span>
                  <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                    {article.date}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{article.excerpt}</p>
                <details>
                  <summary className="cursor-pointer text-blue-500 hover:text-blue-600">
                    View Full Content
                  </summary>
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    {article.content.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-2">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TheFauxyCrawler; 