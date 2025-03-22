import { useParams, Link } from 'react-router-dom';
import { articlesById, categoryNameMap } from '../data';

export function NewsDetailPage() {
  const { category, slug } = useParams<{ category: string; slug: string }>();

  const article = slug ? articlesById[slug] : undefined;

  if (!article) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">ലേഖനം കണ്ടെത്തിയില്ല</h1>
        <p>മാപ്പ്, നിങ്ങൾ തിരയുന്ന ലേഖനം കണ്ടെത്താൻ കഴിഞ്ഞില്ല.</p>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">
          തിരികെ ഹോം പേജിലേക്ക്
        </Link>
      </div>
    );
  }

  const categoryLink = category ? `/${category}` : '/';
  const categoryName = category ? categoryNameMap[category] || category : '';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-4">
        <Link to={categoryLink} className="text-primary text-sm font-medium">
          {categoryName}
        </Link>
        <span className="text-gray-500 mx-2">/</span>
        <span className="text-gray-500 text-sm">{article.date}</span>
      </div>

      <h1 className="text-4xl font-bold mb-6">{article.title}</h1>

      <div className="text-gray-700 mb-6">
        <span>എഴുതിയത്: </span>
        <span className="font-medium">{article.author}</span>
      </div>

      <div className="mb-8">
        <img
          src={article.imageSrc}
          alt={article.title}
          className="w-full max-h-[500px] object-cover rounded-lg"
        />
      </div>

      <div
        className="prose prose-lg max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <div className="mb-12 p-4 border-l-4 border-primary bg-gray-50">
        <p className="text-lg font-medium text-gray-700">
          ഇതൊരു നിർമ്മിത ലേഖനമാണ്.
        </p>
      </div>

      <div className="mt-12 border-t pt-6">
        <Link to="/" className="text-primary hover:underline">
          &larr; തിരികെ ഹോം പേജിലേക്ക്
        </Link>
      </div>
    </div>
  );
}
