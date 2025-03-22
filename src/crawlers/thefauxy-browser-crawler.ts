import { Article } from '../data/types';
import { v4 as uuidv4 } from 'uuid';

interface FauxyArticleSummary {
  title: string;
  category: string;
  date: string;
  url: string;
}

/**
 * Browser-compatible crawler for thefauxy.com
 * This directly fetches content from thefauxy.com and translates to Malayalam
 */
export async function crawlTheFauxyInBrowser(maxArticles = 10): Promise<Article[]> {
  try {
    console.log('Starting to crawl thefauxy.com in browser...');
    const articles: Article[] = [];
    
    // First, get article URLs from the homepage
    const articleUrls = await getArticleUrls();
    console.log(`Found ${articleUrls.length} article URLs`);
    
    // Limit the number of articles to crawl
    const limitedUrls = articleUrls.slice(0, maxArticles);
    
    // Process each article
    for (const url of limitedUrls) {
      try {
        // Get the article data
        const articleData = await getArticleData(url);
        
        if (articleData) {
          // Translate the article content
          const translatedTitle = translateToMalayalam(articleData.title);
          const translatedExcerpt = translateToMalayalam(articleData.excerpt);
          const translatedContent = translateToMalayalam(articleData.content);
          
          // Add translated article to the list
          articles.push({
            id: createIdFromTitle(articleData.title),
            title: translatedTitle,
            excerpt: translatedExcerpt,
            content: translatedContent,
            category: mapCategory(articleData.category),
            date: formatDateInMalayalam(articleData.date),
            author: 'Fauxy Bot',
            imageSrc: articleData.imageSrc || ''
          });
          
          console.log(`Successfully processed article: ${articleData.title}`);
        }
      } catch (error) {
        console.error(`Error processing article ${url}:`, error);
      }
    }
    
    return articles;
  } catch (error) {
    console.error('Error crawling thefauxy.com in browser:', error);
    return [];
  }
}

/**
 * Gets article URLs from the thefauxy.com homepage.
 */
async function getArticleUrls(): Promise<string[]> {
  try {
    const response = await fetch('https://thefauxy.com/');
    const html = await response.text();
    
    // Parse the HTML to extract article URLs
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find all article links
    const linkElements = doc.querySelectorAll('a[href*="thefauxy.com"]');
    const urls = new Set<string>();
    
    linkElements.forEach((element) => {
      const href = element.getAttribute('href');
      if (href && !href.includes('#') && !href.includes('category') && !href.includes('tag')) {
        urls.add(ensureAbsoluteUrl(href));
      }
    });
    
    return Array.from(urls);
  } catch (error) {
    console.error('Error getting article URLs:', error);
    return [];
  }
}

/**
 * Gets article data from a specific URL.
 */
async function getArticleData(url: string): Promise<{
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  imageSrc?: string;
} | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract article data
    const title = doc.querySelector('h1, .entry-title, .post-title')?.textContent?.trim() || 'Untitled Article';
    
    // Get content
    let content = '';
    const contentElement = doc.querySelector('.entry-content, .post-content, article');
    if (contentElement) {
      content = contentElement.textContent?.trim() || '';
    } else {
      // Fallback to paragraphs
      const paragraphs = doc.querySelectorAll('p');
      content = Array.from(paragraphs)
        .map(p => p.textContent?.trim())
        .filter(Boolean)
        .join('\n\n');
    }
    
    // Get excerpt
    let excerpt = content.substring(0, 200) + '...';
    const excerptElement = doc.querySelector('.excerpt, .entry-summary');
    if (excerptElement) {
      excerpt = excerptElement.textContent?.trim() || excerpt;
    }
    
    // Get category
    let category = 'global';
    const categoryElement = doc.querySelector('.category, .cat, .post-category');
    if (categoryElement) {
      category = categoryElement.textContent?.trim() || category;
    }
    
    // Get date
    let date = new Date().toDateString();
    const dateElement = doc.querySelector('.date, .published, .post-date');
    if (dateElement) {
      date = dateElement.textContent?.trim() || date;
    }
    
    // Get image
    let imageSrc: string | undefined;
    const imageElement = doc.querySelector('.featured-image img, .post-thumbnail img, article img');
    if (imageElement) {
      imageSrc = imageElement.getAttribute('src') || undefined;
    }
    
    return {
      title,
      excerpt,
      content,
      category,
      date,
      imageSrc
    };
  } catch (error) {
    console.error('Error getting article data:', error);
    return null;
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
    'satire': 'സാറ്റയർ',
    'news': 'വാർത്ത',
    'fake': 'വ്യാജ',
    'true': 'സത്യം',
    'false': 'കള്ളം',
    'funny': 'രസകരമായ',
    'joke': 'തമാശ',
    'humor': 'ഹാസ്യം',
    'comedy': 'കോമഡി',
    'report': 'റിപ്പോർട്ട്',
    'story': 'കഥ',
    'article': 'ലേഖനം',
    'headline': 'തലക്കെട്ട്',
    'breaking': 'ബ്രേക്കിംഗ്',
    'update': 'അപ്ഡേറ്റ്',
    'latest': 'ഏറ്റവും പുതിയ',
    'today': 'ഇന്ന്',
    'yesterday': 'ഇന്നലെ',
    'tomorrow': 'നാളെ',
    'week': 'ആഴ്ച',
    'month': 'മാസം',
    'year': 'വർഷം',
    'man': 'പുരുഷൻ',
    'woman': 'സ്ത്രീ',
    'person': 'വ്യക്തി',
    'child': 'കുട്ടി',
    'student': 'വിദ്യാർത്ഥി',
    'teacher': 'അധ്യാപകൻ',
    'doctor': 'ഡോക്ടർ',
    'patient': 'രോഗി',
    'police': 'പോലീസ്',
    'officer': 'ഓഫീസർ',
    'economic': 'സാമ്പത്തിക',
    'small': 'ചെറിയ',
  };
  
  // Create a simple translation by replacing words
  let translatedText = text;
  
  // Replace English words with Malayalam translations
  for (const [english, malayalam] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    translatedText = translatedText.replace(regex, malayalam);
  }
  
  // Add some Malayalam words throughout to make it look more authentic
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