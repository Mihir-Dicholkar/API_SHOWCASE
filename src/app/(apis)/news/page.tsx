import { GNewsResponse } from '@/lib/validators';
import Link from 'next/link';

export const metadata = {
  title: 'Live News | API Showcase',
  description: 'Realtime news from 60k+ sources powered by GNews API'
};

export default async function NewsPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  // Get search term from URL or default to "technology"
  const params = await searchParams;
  const searchTerm = params?.q || "technology";
  
  // Build query params OBJECT with proper keys
  const queryParams = {
    q: searchTerm,  // ✅ This is the fix!
    lang: "en",
    country: "us",
    max: "12",
    sortby: "publishedAt",
  };
  
  // Convert to query string
  const queryString = new URLSearchParams(queryParams).toString();
  
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/proxy/gnews?${queryString}`;
  
  console.log("📰 Fetching news from:", apiUrl); // Debug log
  
  const res = await fetch(apiUrl, { 
    next: { revalidate: 300 } // Cache for 5 minutes
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("❌ News API error:", res.status, errorData);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 max-w-md">
          <h2 className="text-xl font-bold mb-2">⚠️ Failed to load news</h2>
          <p className="text-sm mb-2">Status: {res.status}</p>
          <p className="text-xs text-gray-600">{JSON.stringify(errorData, null, 2)}</p>
          {res.status === 429 && (
            <p className="text-xs mt-2 text-orange-600">Rate limited. Wait a few minutes and refresh.</p>
          )}
        </div>
      </div>
    );
  }

  const data = await res.json();
  const articles = data.articles || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">📰 Live News Feed</h1>
          <p className="text-gray-600 mt-2">
            Showing results for: <span className="font-semibold text-blue-600">"{searchTerm}"</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {articles.length} articles found {data.totalResults && `(${data.totalResults} total)`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Technology', 'World', 'Business', 'Science', 'Sports'].map((cat) => (
            <Link
              key={cat}
              href={`/news?q=${cat.toLowerCase()}`}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-blue-50 hover:border-blue-300 transition shadow-sm"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200">
          <p className="text-xl mb-2">📭 No articles found</p>
          <p className="text-sm">Try a different search term or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article: any, idx: number) => (
            <a
              key={`${article.url}-${idx}`}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition border border-gray-100 overflow-hidden flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden bg-gray-100">
                {article.image ? (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                   
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">📰</div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span className="font-semibold text-blue-600">{article.source?.name || "Unknown"}</span>
                  <span>•</span>
                  <time dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </time>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3 flex-1">
                  {article.description || 'No description available.'}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-blue-600 font-medium group-hover:underline">Read full article →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}