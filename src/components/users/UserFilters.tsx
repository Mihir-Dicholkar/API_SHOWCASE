'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { GENDER_OPTIONS, NATIONALITY_OPTIONS, type GenderOption, type NationalityOption } from '@/lib/validators';

export default function UserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentGender = (searchParams.get('gender') as GenderOption) || 'all';
  const currentNat = (searchParams.get('nat') as NationalityOption) || 'all';
  const currentResults = parseInt(searchParams.get('results') || '10', 10);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const gender = formData.get('gender') as GenderOption;
    const nat = formData.get('nat') as NationalityOption;
    const results = parseInt(formData.get('results') as string, 10) || 10;
    
    const params = new URLSearchParams();
    if (gender && gender !== 'all') params.set('gender', gender);
    if (nat && nat !== 'all') params.set('nat', nat);
    if (results !== 10) params.set('results', results.toString());
    
    const queryString = params.toString();
    router.push(`/users${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        {/* Gender Filter */}
        <div className="w-full lg:w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            name="gender"
            defaultValue={currentGender}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </div>
        
        {/* Nationality Filter */}
        <div className="w-full lg:w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
          <select
            name="nat"
            defaultValue={currentNat}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {NATIONALITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt.toUpperCase()}</option>
            ))}
          </select>
        </div>
        
        {/* Results Count */}
        <div className="w-full lg:w-24">
          <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
          <select
            name="results"
            defaultValue={currentResults}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2">
          <button 
            type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
          >
            Generate
          </button>
          <a
            href="/users"
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition whitespace-nowrap"
          >
            Reset
          </a>
        </div>
      </div>
      
      {/* Quick Nationality Tags */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
        {['us', 'gb', 'ca', 'au', 'de'].map((nat) => (
          <button
            key={nat}
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('nat', nat);
              router.push(`/users?${params.toString()}`);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              currentNat === nat 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {nat.toUpperCase()}
          </button>
        ))}
      </div>
    </form>
  );
}