import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';

export function Header() {
  const navLinks = [
    { name: 'ആഗോളം', path: '/global', malayalamName: 'ആഗോളം' },
    { name: 'രാഷ്ട്രീയം', path: '/politics', malayalamName: 'രാഷ്ട്രീയം' },
    { name: 'വിനോദം', path: '/entertainment', malayalamName: 'വിനോദം' },
    { name: 'കായികം', path: '/sports', malayalamName: 'കായികം' },
    { name: 'ബിസിനസ്', path: '/business', malayalamName: 'ബിസിനസ്' },
    { name: 'സിനിമ അവലോകനം', path: '/movie-reviews', malayalamName: 'സിനിമ അവലോകനം' },
    { name: 'അഭിപ്രായം', path: '/opinion', malayalamName: 'അഭിപ്രായം' },
  ];

  return (
    <header className="border-b border-gray-100">
      <div className="container mx-auto py-4 md:flex md:items-center md:justify-between">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-primary text-white font-bold rounded-sm p-1 text-lg">വ്യാജ</div>
              <span className="font-bold text-2xl">വാർത്ത</span>
            </div>
          </Link>
          <button className="md:hidden border rounded p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
        <nav className="hidden md:flex space-x-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn('nav-link')}
            >
              {link.malayalamName}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
