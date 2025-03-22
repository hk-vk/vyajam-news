import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { AboutPage } from './pages/AboutPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import TheFauxyCrawler from './components/TheFauxyCrawler';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/crawler" element={<TheFauxyCrawler />} />
          <Route path="/:category" element={<CategoryPage />} />
          <Route path="/:category/:slug" element={<NewsDetailPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
