'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link'; // ✅ ADD THIS IMPORT
import { BOOK_SUBJECTS, type BookSubject } from '@/lib/validators';

export default function BookFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentSearch = searchParams.get('q') || '';
  const currentSubject = (searchParams.get('subject') as BookSubject) || 'All';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('q') as string;
    const subject = formData.get('subject') as BookSubject;
    
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (subject && subject !== 'All') params.set('subject', subject);
    
    const queryString = params.toString();
    router.push(`/books${queryString ? `?${queryString}` : ''}`);
  };

  const handleSubjectClick = (subject: BookSubject) => {
    const params = new URLSearchParams();
    if (subject !== 'All') params.set('subject', subject);
    params.delete('q'); // Clear search when filtering by subject
    router.push(`/books${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Books</label>
          <input
            type="text"
            name="q"
            placeholder="Title, author, ISBN, or subject..."
            defaultValue={currentSearch}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Subject Filter */}
        <div className="w-full lg:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            name="subject"
            defaultValue={currentSubject}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {BOOK_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2">
          <button 
            type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
          >
            Search
          </button>
          {/* ✅ Link now works because we imported it */}
          <Link
            href="/books"
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition whitespace-nowrap"
          >
            Clear
          </Link>
        </div>
      </div>
      
      {/* Quick Subject Tags */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
        {['Fiction', 'Mystery', 'Science Fiction', 'Fantasy', 'History'].map((subject) => (
          <button
            key={subject}
            type="button"
            onClick={() => handleSubjectClick(subject as BookSubject)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              currentSubject === subject 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>
    </form>
  );
}