export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  imageSrc: string;
  content: string;
}

export type CategoryName = 'global' | 'politics' | 'sports' | 'technology' | 'business' | 'opinion' | 'entertainment' | 'movie-reviews';
