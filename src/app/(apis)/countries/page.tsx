import { Country, parseCountriesResponse } from '@/lib/validators';
import Link from 'next/link';

export const metadata = {
  title: 'Countries Explorer | API Showcase',
  description: 'Explore countries with flags, capitals, population, languages & more',
};

// Constants
const ITEMS_PER_PAGE = 24;
const REGIONS = ['all', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'] as const;
type Region = typeof REGIONS[number];

// Helper function to build query string (filters out undefined values)
const buildQueryString = (params: Record<string, string | undefined>) => {
  const cleanParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== 'all' && value !== 'undefined') {
      cleanParams[key] = value;
    }
  }
  return new URLSearchParams(cleanParams).toString();
};

// Helper functions
const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

const getLanguageNames = (languages?: Record<string, string> | null) => {
  if (!languages) return 'N/A';
  const values = Object.values(languages).filter(Boolean);
  return values.slice(0, 3).join(', ') + (values.length > 3 ? '...' : '');
};

const getCurrencyInfo = (currencies?: Record<string, { name?: string; symbol?: string | null; code?: string }> | null) => {
  if (!currencies) return 'N/A';
  const first = Object.values(currencies)[0];
  return `${first?.symbol || ''} ${first?.name || 'Unknown'}`.trim() || 'N/A';
};

export default async function CountriesPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ region?: string; name?: string; page?: string }> 
}) {
  const params = await searchParams;
  const region = (params?.region && REGIONS.includes(params.region as Region)) ? params.region as Region : 'all';
  const name = params?.name?.trim() || '';
  const page = Math.max(1, parseInt(params?.page || '1', 10) || 1);

  // Build API query
  const queryParams = new URLSearchParams();
  if (params?.region && params.region !== 'all') {
    queryParams.append('region', params.region);
  }
  if (params?.name) {
    queryParams.append('name', params.name);
    queryParams.append('fullText', 'true');
  }

  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/restcountries?${queryParams.toString()}`;
  
  console.log('🌍 Fetching countries from:', apiUrl);
  
  const res = await fetch(apiUrl, { next: { revalidate: 86400 } });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('❌ Countries API error:', res.status, errorData);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 max-w-md">
          <h2 className="text-xl font-bold mb-2">⚠️ Failed to load countries</h2>
          <p className="text-sm">Status: {res.status}</p>
          <p className="text-xs text-gray-600 mt-2">{JSON.stringify(errorData, null, 2)}</p>
          <Link href="/countries" className="inline-block mt-4 text-blue-600 hover:underline text-sm">
            ← Try again
          </Link>
        </div>
      </div>
    );
  }

  const rawData = await res.json();
  const allCountries = parseCountriesResponse(rawData);
  
  const filteredCountries = name 
    ? allCountries.filter(c => c.name.common.toLowerCase().includes(name.toLowerCase()))
    : allCountries;
  
  const totalPages = Math.ceil(filteredCountries.length / ITEMS_PER_PAGE);
  const paginatedCountries = filteredCountries.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">🌍 Countries Explorer</h1>
        <p className="text-gray-600 mt-2">
          {filteredCountries.length.toLocaleString()} countries found
          {region !== 'all' && <span> in <strong>{region}</strong></span>}
          {name && <span> matching <strong>"{name}"</strong></span>}
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
        <form className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 min-w-50">
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              name="region"
              defaultValue={region}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r === 'all' ? 'All Regions' : r}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-50">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              name="name"
              placeholder="Country name..."
              defaultValue={name}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
            >
              Apply
            </button>
            {(region !== 'all' || name) && (
              <Link
                href="/countries"
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Results Grid */}
      {paginatedCountries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No countries found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filters.</p>
          <Link 
            href="/countries" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← View all countries
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedCountries.map((country) => (
              <CountryCard key={country.cca3} country={country} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/countries?${buildQueryString({ 
                    region: region !== 'all' ? region : undefined, 
                    name: name || undefined, 
                    page: String(page - 1) 
                  })}`}
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
                      href={`/countries?${buildQueryString({ 
                        region: region !== 'all' ? region : undefined, 
                        name: name || undefined, 
                        page: String(pageNum) 
                      })}`}
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
                      href={`/countries?${buildQueryString({ 
                        region: region !== 'all' ? region : undefined, 
                        name: name || undefined, 
                        page: String(totalPages) 
                      })}`}
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
                  href={`/countries?${buildQueryString({ 
                    region: region !== 'all' ? region : undefined, 
                    name: name || undefined, 
                    page: String(page + 1) 
                  })}`}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
          
          <p className="text-center text-sm text-gray-500 mt-6">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredCountries.length)} of {filteredCountries.length.toLocaleString()} countries
          </p>
        </>
      )}
    </div>
  );
}

// Country Card Component
function CountryCard({ country }: { country: Country }) {
  return (
    <article className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="relative h-36 bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        {country.flags.png ? (
          <img
            src={country.flags.png}
            alt={`Flag of ${country.name.common}`}
            className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="text-4xl text-gray-300">🏳️</div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-700 transition">
            {country.name.common}
          </h3>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap">
            {country.region}
          </span>
        </div>
        
        <dl className="space-y-1.5 text-sm mb-4 flex-1">
          <div className="flex justify-between">
            <dt className="text-gray-500">Capital</dt>
            <dd className="font-medium text-gray-900 text-right">{country.capital?.[0] || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Population</dt>
            <dd className="font-medium text-gray-900 text-right">{formatNumber(country.population)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Languages</dt>
            <dd className="font-medium text-gray-900 text-right max-w-30 truncate" title={getLanguageNames(country.languages)}>
              {getLanguageNames(country.languages)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Currency</dt>
            <dd className="font-medium text-gray-900 text-right">{getCurrencyInfo(country.currencies)}</dd>
          </div>
        </dl>
        
        {country.borders && country.borders.length > 0 && (
          <div className="mb-4 pt-3 border-t border-gray-100">
            <span className="text-gray-500 text-xs">Borders:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {country.borders.slice(0, 4).map((code) => (
                <span key={code} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded" title={code}>
                  {code}
                </span>
              ))}
              {country.borders.length > 4 && (
                <span className="px-1.5 py-0.5 text-gray-400 text-[10px]">+{country.borders.length - 4}</span>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-auto pt-3 border-t border-gray-100 flex gap-2">
          {country.maps?.googleMaps && (
            <a
              href={country.maps.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-center text-xs font-medium text-gray-700 transition flex items-center justify-center gap-1"
            >
              🗺️ Map
            </a>
          )}
          <span className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-mono font-medium" title="ISO code">
            {country.cca3.toUpperCase()}
          </span>
        </div>
      </div>
    </article>
  );
}