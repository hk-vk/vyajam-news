import { NewsCard } from '../components/NewsCard';
import { allArticles, techArticles, globalArticles, sportsArticles, politicsArticles } from '../data';

export function HomePage() {
  // Get featured article from tech articles
  const featuredNews = techArticles[0];

  // Get recent news from all articles
  const recentNews = allArticles.slice(0, 4);

  // Get global news for "What's happening"
  const whatIsHappening = globalArticles.slice(0, 4);

  // Get sports news
  const sportsNewsItems = sportsArticles.slice(0, 2);

  return (
    <div className="py-8">
      {/* Featured news */}
      <section className="container mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">പ്രധാന വാർത്ത</h2>
        <NewsCard {...featuredNews} isFeatured />
      </section>

      {/* Recent news */}
      <section className="container mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">സമീപകാല വാർത്തകൾ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentNews.map((news) => (
            <NewsCard key={news.id} {...news} />
          ))}
        </div>
      </section>

      {/* What's happening */}
      <section className="container mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">എന്താണ് സംഭവിക്കുന്നത്</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {whatIsHappening.map((news) => (
            <NewsCard key={news.id} {...news} />
          ))}
        </div>
      </section>

      {/* Sports */}
      <section className="container mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">കായികം</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {sportsNewsItems.map((news) => (
            <NewsCard key={news.id} {...news} />
          ))}
        </div>
      </section>
    </div>
  );
}
