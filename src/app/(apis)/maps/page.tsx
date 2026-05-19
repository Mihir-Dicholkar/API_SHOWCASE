import { NominatimSearchResponse, formatAddress, parseCoordinates } from '@/lib/validators';
import LocationMapWrapper from '@/components/maps/LocationMapWrapper';
import Link from 'next/link';
import { Suspense } from 'react'; // ✅ ADD THIS IMPORT

export const metadata = {
  title: 'Map Explorer | API Showcase',
  description: 'Search places and explore interactive maps with OpenStreetMap',
};

export default async function MapsPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ q?: string; lat?: string; lon?: string }> 
}) {
  const params = await searchParams;
  const query = params?.q?.trim() || '';
  const lat = params?.lat ? parseFloat(params.lat) : undefined;
  const lon = params?.lon ? parseFloat(params.lon) : undefined;

  let searchResults: NominatimSearchResponse = [];
  let selectedLocation = null;

  // If coordinates provided, fetch reverse geocoding
  if (lat && lon) {
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/osm?endpoint=reverse&format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    
    console.log('🗺️ Reverse geocoding from:', apiUrl);
    
    const res = await fetch(apiUrl, {
      next: { revalidate: 3600 }
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.place_id) {
        selectedLocation = data;
        searchResults = [data];
      }
    }
  }
  // If search query provided, fetch forward geocoding
  else if (query) {
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/osm?endpoint=search&format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;
    
    console.log('🗺️ Searching places from:', apiUrl);
    
    const res = await fetch(apiUrl, {
      next: { revalidate: 3600 }
    });
    
    if (res.ok) {
      searchResults = await res.json();
      if (searchResults.length > 0) {
        selectedLocation = searchResults[0];
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">🗺️ Map Explorer</h1>
        <p className="text-gray-600 mt-2">
          Search places worldwide with OpenStreetMap
          {query && <span> • searching "<strong>{query}</strong>"</span>}
          {selectedLocation && <span> • found <strong>{selectedLocation.name}</strong></span>}
        </p>
      </div>

      {/* Search Form */}
      <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="q"
            placeholder="Search for a place (e.g., Eiffel Tower, Tokyo, Central Park)..."
            defaultValue={query}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            Search
          </button>
          {(query || lat) && (
            <Link
              href="/maps"
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              Clear
            </Link>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Powered by <a href="https://nominatim.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Nominatim</a> • Max 1 request/second
        </p>
      </form>

      {/* ✅ Map Component wrapped in Suspense boundary */}
      <Suspense fallback={
        <div className="h-[500px] bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500">
          Loading map...
        </div>
      }>
        <LocationMapWrapper location={selectedLocation} />
      </Suspense>

      {/* Search Results */}
      {searchResults.length > 1 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((result) => {
              const coords = parseCoordinates(result.lat, result.lon);
              return (
                <Link
                  key={result.place_id}
                  href={`/maps?lat=${coords.lat}&lon=${coords.lng}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{result.name}</h3>
                      <p className="text-sm text-gray-600">{formatAddress(result.address)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {result.category}/{result.type} • Rank: {result.place_rank}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Location Details */}
      {selectedLocation && searchResults.length === 1 && (
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Location Details</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{selectedLocation.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Display Name</dt>
              <dd className="font-medium text-gray-900">{selectedLocation.display_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium text-gray-900">{selectedLocation.category}/{selectedLocation.type}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Coordinates</dt>
              <dd className="font-medium text-gray-900 font-mono">
                {selectedLocation.lat}, {selectedLocation.lon}
              </dd>
            </div>
            {selectedLocation.address && Object.keys(selectedLocation.address).length > 0 && (
              <div className="md:col-span-2">
                <dt className="text-gray-500">Address Components</dt>
                <dd className="text-gray-900">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(selectedLocation.address).map(([key, value]) => (
                      <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Map data from{' '}
          <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            OpenStreetMap
          </a>{' '}
          • Geocoding by{' '}
          <a href="https://nominatim.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Nominatim
          </a>
        </p>
        <p className="mt-1 text-xs text-gray-400">
          © OpenStreetMap contributors • ODbL license • Please respect usage policy
        </p>
      </div>
    </div>
  );
}