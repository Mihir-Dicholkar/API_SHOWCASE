// app/(apis)/books/[id]/page.tsx

import { OpenLibraryBook, formatAuthors, getCoverUrl } from '@/lib/validators';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

// Helper function to extract description text
function getDescriptionText(description: string | { value: string } | undefined): string {
  if (!description) return 'No description available.';
  if (typeof description === 'string') return description;
  return description.value || 'No description available.';
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Book Details | API Showcase`,
    description: `View details for book ${id}`,
  };
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // ✅ CORRECT: Pass endpoint as query param for proxy to handle
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/openlibrary?endpoint=books/${id}.json`;
  
  console.log('📚 Fetching book detail from:', apiUrl);
  
  const res = await fetch(apiUrl, {
    next: { revalidate: 86400 } // Cache for 24 hours
  });

  if (!res.ok) {
    console.error('❌ Failed to fetch book detail:', res.status);
    notFound();
  }

  const book: OpenLibraryBook = await res.json();

  // Handle case where book not found (Open Library returns {error: "Not found"})
  if (!book.key || !book.title) {
    console.warn('⚠️ Book data missing required fields:', { key: book.key, title: book.title });
    notFound();
  }

  const coverUrl = getCoverUrl(book.cover_i, 'L');
  const authors = formatAuthors(book.authors);
  
  // ✅ Fix: Handle description that could be string or object
  const descriptionText = getDescriptionText(book.description);
  const description = truncateText(descriptionText, 500);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link href="/books" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6">
        ← Back to books
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{book.title}</h1>
        {book.subtitle && (
          <p className="text-xl text-gray-600 mt-1">{book.subtitle}</p>
        )}
        <p className="text-gray-600 mt-2">
          by <span className="font-medium text-gray-900">{authors}</span>
          {book.publish_date && <span> • Published {book.publish_date}</span>}
        </p>
      </div>

      {/* Cover + Details */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Cover */}
        <div className="md:col-span-1">
          <div className="relative aspect-3/4 bg-gray-100 rounded-xl overflow-hidden">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={book.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                📚
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">About this book</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>{description}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {book.publishers && book.publishers.length > 0 && (
                <>
                  <dt className="text-gray-500">Publisher</dt>
                  <dd className="text-gray-900">{book.publishers.join(', ')}</dd>
                </>
              )}
              {book.number_of_pages && (
                <>
                  <dt className="text-gray-500">Pages</dt>
                  <dd className="text-gray-900">{book.number_of_pages.toLocaleString()}</dd>
                </>
              )}
              {book.isbn_13?.[0] && (
                <>
                  <dt className="text-gray-500">ISBN-13</dt>
                  <dd className="text-gray-900 font-mono">{book.isbn_13[0]}</dd>
                </>
              )}
              {book.isbn_10?.[0] && (
                <>
                  <dt className="text-gray-500">ISBN-10</dt>
                  <dd className="text-gray-900 font-mono">{book.isbn_10[0]}</dd>
                </>
              )}
              {book.languages && book.languages.length > 0 && (
                <>
                  <dt className="text-gray-500">Language</dt>
                  <dd className="text-gray-900">
                    {book.languages.map(lang => lang.key.split('/').pop()).join(', ')}
                  </dd>
                </>
              )}
              {book.subjects && book.subjects.length > 0 && (
                <>
                  <dt className="text-gray-500">Subjects</dt>
                  <dd className="text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {book.subjects.slice(0, 5).map((subj) => (
                        <Link
                          key={subj}
                          href={`/books?subject=${encodeURIComponent(subj)}`}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition"
                        >
                          {subj}
                        </Link>
                      ))}
                    </div>
                  </dd>
                </>
              )}
            </dl>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://openlibrary.org${book.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              View on Open Library
            </a>
            {book.isbn_13?.[0] && (
              <a
                href={`https://worldcat.org/isbn/${book.isbn_13[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                🌍 Find in Libraries
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}