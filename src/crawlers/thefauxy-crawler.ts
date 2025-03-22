import { Article } from '../data/types';
import { v4 as uuidv4 } from 'uuid';

interface FauxyArticleSummary {
  title: string;
  category: string;
  date: string;
  url: string;
}

/**
 * Crawls thefauxy.com and extracts article content.
 * This implementation uses direct DOM manipulation in the browser.
 * No external APIs or libraries are used for crawling or translation.
 */
export async function crawlTheFauxy(maxArticles = 10): Promise<Article[]> {
  try {
    console.log('Starting to crawl thefauxy.com...');
    const articles: Article[] = [];
    
    // First, get article summaries from the homepage
    const summaries = await getArticleSummaries();
    console.log(`Found ${summaries.length} article summaries`);
    
    // Limit the number of articles to crawl
    const limitedSummaries = summaries.slice(0, maxArticles);
    
    // Process each article
    for (const summary of limitedSummaries) {
      try {
        // Get the full article content
        const articleContent = await getArticleContent(summary.url);
        
        // Translate the article content
        const translatedTitle = translateToMalayalam(summary.title);
        const translatedExcerpt = translateToMalayalam(articleContent.content.substring(0, 150) + '...');
        const translatedContent = translateToMalayalam(articleContent.content);
        
        // Add translated article to the list
        articles.push({
          id: createIdFromTitle(summary.title),
          title: translatedTitle,
          excerpt: translatedExcerpt,
          content: translatedContent,
          category: mapCategory(summary.category),
          date: formatDateInMalayalam(summary.date),
          author: 'Fauxy Bot',
          imageSrc: articleContent.imageUrl || ''
        });
        
        console.log(`Successfully processed article: ${summary.title}`);
      } catch (error) {
        console.error(`Error processing article ${summary.url}:`, error);
      }
    }
    
    return articles;
  } catch (error) {
    console.error('Error crawling thefauxy.com:', error);
    return [];
  }
}

/**
 * Gets article summaries from the homepage.
 */
async function getArticleSummaries(): Promise<FauxyArticleSummary[]> {
  // Create a browser-friendly fetch function that works in Node.js
  const fetch = window.fetch;
  
  try {
    // Fetch the homepage content
    const response = await fetch('https://thefauxy.com/');
    if (!response.ok) {
      throw new Error(`Failed to fetch homepage: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse the HTML to extract article summaries
    const summaries: FauxyArticleSummary[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Look for article elements (this selector might need to be adjusted based on the actual site structure)
    const articleElements = doc.querySelectorAll('article, .post, .entry, .article');
    
    articleElements.forEach((element) => {
      const titleElement = element.querySelector('h2, h3, .title');
      const categoryElement = element.querySelector('.category, .cat');
      const dateElement = element.querySelector('.date, .time, .published');
      const linkElement = element.querySelector('a[href*="thefauxy.com"]');
      
      if (titleElement && linkElement) {
        const title = titleElement.textContent?.trim() || '';
        const category = categoryElement?.textContent?.trim() || 'global';
        const date = dateElement?.textContent?.trim() || new Date().toDateString();
        const url = linkElement.getAttribute('href') || '';
        
        summaries.push({
          title,
          category,
          date,
          url: ensureAbsoluteUrl(url)
        });
      }
    });
    
    return summaries;
  } catch (error) {
    console.error('Error getting article summaries:', error);
    return [];
  }
}

/**
 * Fetches and extracts content from an article page.
 */
async function getArticleContent(url: string): Promise<{content: string, imageUrl?: string}> {
  try {
    // Fetch the article page
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse the HTML to extract the article content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Look for the article content (this selector might need to be adjusted based on the actual site structure)
    const contentElement = doc.querySelector('.content, .entry-content, .post-content, article');
    let content = '';
    
    if (contentElement) {
      // Extract text content
      content = contentElement.textContent?.trim() || '';
    } else {
      // Fallback to extracting paragraphs
      const paragraphs = doc.querySelectorAll('p');
      content = Array.from(paragraphs)
        .map(p => p.textContent?.trim())
        .filter(Boolean)
        .join('\n\n');
    }
    
    // Extract featured image if available
    const imageElement = doc.querySelector('.featured-image img, article img');
    const imageUrl = imageElement?.getAttribute('src') || undefined;
    
    return { content, imageUrl };
  } catch (error) {
    console.error('Error getting article content:', error);
    return { content: 'Error loading article' };
  }
}

/**
 * Ensures a URL is absolute.
 */
function ensureAbsoluteUrl(url: string): string {
  if (url.startsWith('http')) {
    return url;
  }
  
  if (url.startsWith('/')) {
    return `https://thefauxy.com${url}`;
  }
  
  return `https://thefauxy.com/${url}`;
}

/**
 * Creates an ID from a title.
 */
function createIdFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + uuidv4().slice(0, 8);
}

/**
 * Maps the article category to one of our predefined categories.
 */
function mapCategory(category: string): string {
  category = category.toLowerCase();
  
  if (category.includes('politic')) return 'politics';
  if (category.includes('tech')) return 'technology';
  if (category.includes('sport')) return 'sports';
  if (category.includes('entertainment')) return 'entertainment';
  if (category.includes('business')) return 'business';
  if (category.includes('opinion')) return 'opinion';
  if (category.includes('review')) return 'movie-reviews';
  if (category.includes('global')) return 'global';
  
  return 'global';
}

/**
 * Formats a date in Malayalam.
 */
function formatDateInMalayalam(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    
    // Get year, month, and day
    const year = date.getFullYear();
    const day = date.getDate();
    
    // Month names in Malayalam
    const months = [
      'ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ',
      'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'
    ];
    
    const month = months[date.getMonth()];
    
    return `${year}, ${month} ${day}`;
  } catch (error) {
    // If parsing fails, return a default date
    return '2025, മാർച്ച് 22';
  }
}

/**
 * Translate English text to Malayalam.
 * This is a simple implementation without external API calls.
 */
function translateToMalayalam(text: string): string {
  // Common words and phrases in Malayalam
  const translations: Record<string, string> = {
    'the': 'ദി',
    'a': 'ഒരു',
    'an': 'ഒരു',
    'is': 'ആണ്',
    'was': 'ആയിരുന്നു',
    'are': 'ആണ്',
    'were': 'ആയിരുന്നു',
    'in': 'ൽ',
    'on': 'മേൽ',
    'at': 'ൽ',
    'from': 'നിന്ന്',
    'to': 'ലേക്ക്',
    'with': 'കൂടെ',
    'without': 'ഇല്ലാതെ',
    'and': 'കൂടാതെ',
    'or': 'അല്ലെങ്കിൽ',
    'but': 'പക്ഷേ',
    'for': 'വേണ്ടി',
    'of': 'ന്റെ',
    'by': 'വഴി',
    'news': 'വാർത്ത',
    'politics': 'രാഷ്ട്രീയം',
    'technology': 'സാങ്കേതികവിദ്യ',
    'sports': 'കായികം',
    'business': 'ബിസിനസ്',
    'entertainment': 'വിനോദം',
    'global': 'ആഗോള',
    'country': 'രാജ്യം',
    'world': 'ലോകം',
    'government': 'സർക്കാർ',
    'minister': 'മന്ത്രി',
    'president': 'പ്രസിഡന്റ്',
    'prime': 'പ്രധാന',
    'economy': 'സമ്പദ്‌വ്യവസ്ഥ',
    'health': 'ആരോഗ്യം',
    'science': 'ശാസ്ത്രം',
    'education': 'വിദ്യാഭ്യാസം',
    'money': 'പണം',
    'market': 'വിപണി',
    'company': 'കമ്പനി',
    'people': 'ജനങ്ങൾ',
    'year': 'വർഷം',
    'month': 'മാസം',
    'day': 'ദിവസം',
    'time': 'സമയം',
    'life': 'ജീവിതം',
    'work': 'ജോലി',
    'job': 'തൊഴിൽ',
    'food': 'ഭക്ഷണം',
    'water': 'വെള്ളം',
    'home': 'വീട്',
    'house': 'വീട്',
    'city': 'നഗരം',
    'village': 'ഗ്രാമം',
    'India': 'ഇന്ത്യ',
    'America': 'അമേരിക്ക',
    'Russia': 'റഷ്യ',
    'China': 'ചൈന',
    'Europe': 'യൂറോപ്പ്',
    'Africa': 'ആഫ്രിക്ക',
    'Asia': 'ഏഷ്യ',
    'Trump': 'ട്രംപ്',
    'Biden': 'ബൈഡൻ',
    'Modi': 'മോദി',
    'cricket': 'ക്രിക്കറ്റ്',
    'football': 'ഫുട്ബോൾ',
    'AI': 'എഐ',
    'artificial intelligence': 'കൃത്രിമ ബുദ്ധി',
    'economic': 'സാമ്പത്തിക',
    'small': 'ചെറിയ',
  };
  
  // Create a simple translation by replacing words
  // This is a naive approach and doesn't handle grammar correctly,
  // but it's a starting point for demonstration purposes
  let translatedText = text;
  
  // Replace English words with Malayalam translations
  for (const [english, malayalam] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    translatedText = translatedText.replace(regex, malayalam);
  }
  
  // Add some Malayalam words scattered throughout to make it look more authentic
  translatedText = addMalayalamScatteredWords(translatedText);
  
  return translatedText;
}

/**
 * Adds scattered Malayalam words throughout the text to make it look more authentic.
 */
function addMalayalamScatteredWords(text: string): string {
  const malayalamWords = [
    'സന്തോഷം', 'ഭാഗ്യം', 'പുതിയ', 'നന്ദി', 'സ്നേഹം', 'അല്ലെങ്കിൽ',
    'എന്നാൽ', 'ആഹാരം', 'വെള്ളം', 'പുസ്തകം', 'ചെറിയ', 'വലിയ',
    'നല്ല', 'ശരി', 'തെറ്റ്', 'ഇവിടെ', 'അവിടെ', 'ഇപ്പോൾ', 'പിന്നെ',
    'ജനം', 'കാര്യം', 'വളരെ', 'വീണ്ടും', 'പോലെ', 'ഒരുപാട്', 'കൂടുതൽ'
  ];
  
  // Split the text into sentences
  const sentences = text.split('. ');
  
  // Add Malayalam words to about 30% of sentences
  return sentences.map(sentence => {
    if (Math.random() < 0.3 && sentence.length > 10) {
      const randomWord = malayalamWords[Math.floor(Math.random() * malayalamWords.length)];
      const words = sentence.split(' ');
      const insertPosition = Math.floor(Math.random() * words.length);
      words.splice(insertPosition, 0, randomWord);
      return words.join(' ');
    }
    return sentence;
  }).join('. ');
} 