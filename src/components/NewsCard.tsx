import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';

interface NewsCardProps {
  id: string;
  title: string;
  excerpt?: string;
  category: string;
  date: string;
  imageSrc?: string;
  className?: string;
  isFeatured?: boolean;
}

export function NewsCard({
  id,
  title,
  excerpt,
  category,
  date,
  imageSrc,
  className,
  isFeatured = false
}: NewsCardProps) {
  const slug = id;

  return (
    <div className={cn(
      'news-card',
      isFeatured ? 'md:flex' : '',
      className
    )}>
      {imageSrc && (
        <Link to={`/${category}/${slug}`} className={cn(
          'block overflow-hidden',
          isFeatured ? 'md:w-1/2' : 'aspect-[16/9]'
        )}>
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </Link>
      )}
      <div className={cn('p-4', isFeatured && 'md:w-1/2')}>
        <div className="mb-2">
          <Link
            to={`/${category}`}
            className="inline-block text-primary text-xs font-medium uppercase tracking-wider mb-1"
          >
            {category}
          </Link>
          <span className="text-gray-500 text-xs"> • {date}</span>
        </div>
        <Link to={`/${category}/${slug}`}>
          <h3 className={cn(
            'font-bold mb-2 hover:text-primary transition-colors',
            isFeatured ? 'text-xl md:text-2xl' : 'text-lg'
          )}>
            {title}
          </h3>
        </Link>
        {excerpt && (
          <p className="text-gray-600 text-sm line-clamp-3">{excerpt}</p>
        )}
      </div>
    </div>
  );
}
