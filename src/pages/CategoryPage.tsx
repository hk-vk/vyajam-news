import { useParams } from 'react-router-dom';
import { NewsCard } from '../components/NewsCard';
import { articlesByCategory, categoryNameMap } from '../data';
import { CategoryName } from '../data/types';

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();

  const validCategory = category as CategoryName;
  const news = validCategory ? articlesByCategory[validCategory] || [] : [];
  const categoryTitle = category ? categoryNameMap[category] || category : '';

  if (!news || news.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">വിഭാഗം കണ്ടെത്തിയില്ല</h1>
        <p>മാപ്പ്, ഈ വിഭാഗത്തിൽ വാർത്തകളൊന്നും കണ്ടെത്തിയില്ല.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">{categoryTitle}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {news.map((item) => (
          <NewsCard
            key={item.id}
            {...item}
          />
        ))}
      </div>
    </div>
  );
}
