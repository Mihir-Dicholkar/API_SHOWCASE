import { OpenLibrarySearchResponse, formatAuthors, getCoverUrl, truncateText, BOOK_SUBJECTS, type BookSubject } from '@/lib/validators';
import BookFilters from '@/components/books/BookFilters';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Book Explorer | API Showcase',
  description: 'Discover millions of books from Open Library',
};

export default async function BooksPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ q?: string; subject?: BookSubject; page?: string }> 
}) {
  const params = await searchParams;
  const query = params?.q?.trim() || '';
  const subject = params?.subject && params.subject !== 'All' ? params.subject : undefined;
  const page = Math.max(1, parseInt(params?.page || '1', 10) || 1);
  const limit = 20; // Open Library default

  // Build API query
  const apiParams = new URLSearchParams({
    limit: limit.toString(),
    offset: ((page - 1) * limit).toString(),
  });

  // Build search query: combine text search + subject filter
  let searchQuery = '';
  if (query) searchQuery = query;
  if (subject) {
    searchQuery += (searchQuery ? ' AND ' : '') + `subject:${subject.toLowerCase()}`;
  }
  // Default to "book" if no search terms (Open Library requires min 3 chars)
  apiParams.set('q', searchQuery || 'book');

// ✅ CORRECT: endpoint passed as query param, proxy handles it
const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/openlibrary?endpoint=search.json&${apiParams.toString()}`;
  
  console.log('📚 Fetching books from:', apiUrl);
  
  const res = await fetch(apiUrl, {
    next: { revalidate: 3600 } // Cache for 1 hour
  });

  let searchResult: OpenLibrarySearchResponse | null = null;
  
  if (res.ok) {
    try {
      searchResult = await res.json() as OpenLibrarySearchResponse;
    } catch (parseError) {
      console.error('❌ Failed to parse Open Library response:', parseError);
    }
  } else {
    const errorText = await res.text().catch(() => 'No error body');
    console.error('❌ Open Library API error:', res.status, errorText.slice(0, 200));
  }

  const books = searchResult?.docs || [];
  const totalResults = searchResult?.numFound || 0;
  const totalPages = Math.ceil(totalResults / limit);

  const buildQueryString = (pageNum: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (subject) params.set('subject', subject);
    params.set('page', String(pageNum));
    return params.toString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">📚 Book Explorer</h1>
        <p className="text-gray-600 mt-2">
          {totalResults.toLocaleString()} books found
          {subject && <span> • <strong>{subject}</strong> subject</span>}
          {query && <span> • matching "<strong>{query}</strong>"</span>}
        </p>
      </div>

      {/* Filters (Client Component) */}
      <BookFilters />

      {/* Results Grid */}
      {books.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-600 mb-6">Try a different search term or subject.</p>
          <Link 
            href="/books" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← View all books
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => {
              const coverUrl = getCoverUrl(book.cover_i);
              
              return (
                <article key={book.key} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col">
                  {/* Cover Image */}
                  <div className="relative h-64 bg-gray-100 overflow-hidden">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl">
                        📚
                      </div>
                    )}
                    {book.first_publish_year && (
                      <span className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur text-xs font-medium text-gray-700 rounded-full">
                        {book.first_publish_year}
                      </span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-700 transition">
                      {book.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      by {formatAuthors(book.author_name)}
                    </p>
                    
                    {/* Subjects */}
                    {book.subject && book.subject.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {book.subject.slice(0, 3).map((subj) => (
                          <Link
                            key={subj}
                            href={`/books?subject=${encodeURIComponent(subj)}`}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition"
                          >
                            {subj}
                          </Link>
                        ))}
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="mt-auto pt-3 border-t border-gray-100 flex gap-2">
                      <Link
                        href={`/books/${book.key.split('/').pop()}`}
                        className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-center text-xs font-medium transition"
                      >
                        View Details
                      </Link>
                      {book.isbn?.[0] && (
                        <a
                          href={`https://worldcat.org/isbn/${book.isbn[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
                          title="Find in libraries"
                        >
                          🌍
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/books?${buildQueryString(page - 1)}`}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  ← Previous
                </Link>
              )}
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Link
                      key={pageNum}
                      href={`/books?${buildQueryString(pageNum)}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition ${
                        pageNum === page 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <Link
                      href={`/books?${buildQueryString(totalPages)}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition ${
                        page === totalPages 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {totalPages}
                    </Link>
                  </>
                )}
              </div>
              
              {page < totalPages && (
                <Link
                  href={`/books?${buildQueryString(page + 1)}`}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
          
          {/* Results footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalResults)} of {totalResults.toLocaleString()} books
          </p>
        </>
      )}

      {/* Footer info */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Data from{' '}
          <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Open Library
          </a>{' '}
          • 30M+ books • Free & open data
        </p>
      </div>
    </div>
  );
}