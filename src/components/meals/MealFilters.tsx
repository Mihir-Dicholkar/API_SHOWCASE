'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CUISINES, type Cuisine } from '@/lib/validators';

export default function MealFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentSearch = searchParams.get('s') || '';
  const currentCuisine = (searchParams.get('a') as Cuisine) || 'All';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('s') as string;
    const cuisine = formData.get('a') as Cuisine;
    
    // ✅ Clear conflicting params: random, endpoint, etc.
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set('s', search.trim());
      // Clear cuisine if searching by name (mutually exclusive in TheMealDB)
      if (cuisine && cuisine !== 'All') {
        // Optional: allow both, but TheMealDB search.php ignores 'a' param
      }
    }
    if (cuisine && cuisine !== 'All' && !search.trim()) {
      params.set('a', cuisine);
    }
    // Never include 'random' when filtering
    params.delete('random');
    
    const query = params.toString();
    router.push(`/meals${query ? `?${query}` : ''}`);
  };

  const handleRandom = () => {
    // ✅ Clear all filters when getting random
    router.push('/meals?random=true');
  };

  const handleCuisineClick = (cuisine: Cuisine) => {
    // ✅ Clear search and random when filtering by cuisine
    const params = new URLSearchParams();
    params.set('a', cuisine);
    params.delete('s');
    params.delete('random');
    router.push(`/meals?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Recipes</label>
          <input
            type="text"
            name="s"
            placeholder="Chicken, pasta, curry..."
            defaultValue={currentSearch}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Cuisine Filter */}
        <div className="w-full lg:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
          <select
            name="a"
            defaultValue={currentCuisine}
            onChange={(e) => {
              // Optional: auto-submit on change
              const cuisine = e.target.value as Cuisine;
              if (cuisine !== 'All') {
                handleCuisineClick(cuisine);
              }
            }}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CUISINES.map((cuisine) => (
              <option key={cuisine} value={cuisine}>{cuisine}</option>
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
          <button
            type="button"
            onClick={handleRandom}
            className="px-5 py-2.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition whitespace-nowrap"
            title="Random recipe"
          >
            🎲 Random
          </button>
        </div>
      </div>
      
      {/* Quick Cuisine Tags */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
        {['Italian', 'Indian', 'Mexican', 'Japanese', 'Thai'].map((cuisine) => (
          <button
            key={cuisine}
            type="button"
            onClick={() => handleCuisineClick(cuisine as Cuisine)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              currentCuisine === cuisine 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cuisine}
          </button>
        ))}
      </div>
    </form>
  );
}