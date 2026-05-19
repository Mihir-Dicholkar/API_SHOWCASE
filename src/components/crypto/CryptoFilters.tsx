'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CRYPTO_CURRENCIES, SORT_OPTIONS, type CryptoCurrency, type SortOption } from '@/lib/validators';

export default function CryptoFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentCurrency = (searchParams.get('currency') as CryptoCurrency) || 'usd';
  const currentSort = (searchParams.get('sort') as SortOption) || 'market_cap_desc';
  const currentSearch = searchParams.get('q') || '';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('q') as string;
    const currency = formData.get('currency') as CryptoCurrency;
    const sort = formData.get('sort') as SortOption;
    
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (currency) params.set('currency', currency);
    if (sort) params.set('sort', sort);
    
    const queryString = params.toString();
    router.push(`/crypto${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Crypto</label>
          <input
            type="text"
            name="q"
            placeholder="Bitcoin, Ethereum, Solana..."
            defaultValue={currentSearch}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Currency Filter */}
        <div className="w-full lg:w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            name="currency"
            defaultValue={currentCurrency}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CRYPTO_CURRENCIES.map((curr) => (
              <option key={curr} value={curr}>{curr.toUpperCase()}</option>
            ))}
          </select>
        </div>
        
        {/* Sort Filter */}
        <div className="w-full lg:w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            name="sort"
            defaultValue={currentSort}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2">
          <button 
            type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
          >
            Apply
          </button>
          <a
            href="/crypto"
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition whitespace-nowrap"
          >
            Reset
          </a>
        </div>
      </div>
      
      {/* Quick Currency Tags */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
        {['usd', 'eur', 'btc'].map((curr) => (
          <button
            key={curr}
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('currency', curr);
              router.push(`/crypto?${params.toString()}`);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              currentCurrency === curr 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {curr.toUpperCase()}
          </button>
        ))}
      </div>
    </form>
  );
}