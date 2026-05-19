import { OpenSkyStatesResponse, parseFlightState } from '@/lib/validators';
import FlightMapWrapper from '@/components/flights/FlightMapWrapper'; // ✅ Use wrapper
import Link from 'next/link';

export const metadata = {
  title: 'Live Flight Tracker | API Showcase',
  description: 'Real-time aircraft tracking powered by OpenSky Network',
};

// Default bounding box: roughly Europe + North Africa
const DEFAULT_BBOX = {
  minLat: 35,
  maxLat: 72,
  minLon: -25,
  maxLon: 45,
};

export default async function FlightsPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ lat?: string; lon?: string; zoom?: string }> 
}) {
  const params = await searchParams;
  
  // Parse bounding box from params or use default
  const boundingBox = params?.lat && params?.lon 
    ? {
        minLat: parseFloat(params.lat) - 10,
        maxLat: parseFloat(params.lat) + 10,
        minLon: parseFloat(params.lon) - 15,
        maxLon: parseFloat(params.lon) + 15,
      }
    : DEFAULT_BBOX;

  // Build API query
  const apiParams = new URLSearchParams({
    lamin: boundingBox.minLat.toString(),
    lamax: boundingBox.maxLat.toString(),
    lomin: boundingBox.minLon.toString(),
    lomax: boundingBox.maxLon.toString(),
  });

  // ✅ CORRECT: No /states/all here — proxy adds it via forceEndpoint
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/opensky?${apiParams.toString()}`;
  
  console.log('✈️ Fetching flights from:', apiUrl);
  
  // Fetch with short cache (flights move!)
  const res = await fetch(apiUrl, {
    next: { revalidate: 30 } // 30 seconds
  });

  let initialFlights: ReturnType<typeof parseFlightState>[] = [];
  
  if (res.ok) {
    // ✅ CORRECT: Proper destructuring + type assertion
    const data = await res.json() as OpenSkyStatesResponse;
    initialFlights = data.states
      .map(parseFlightState)
      .filter((f): f is NonNullable<typeof f> => f !== null && f.latitude !== null && f.longitude !== null && f.onGround !== true)
      .slice(0, 200); // Limit to 200 for performance
  } else {
    console.error('❌ OpenSky API error:', res.status);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">✈️ Live Flight Tracker</h1>
        <p className="text-gray-600 mt-2">
          Real-time aircraft positions powered by OpenSky Network
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Location</label>
            <form className="flex gap-2">
              <input
                type="text"
                name="location"
                placeholder="City or airport (e.g., London, JFK)..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
              >
                Search
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-1">
              Note: Geocoding requires separate API. For demo, use coordinates below.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link
              href="/flights"
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              🌍 World View
            </Link>
            <Link
              href="/flights?lat=51.5074&lon=-0.1278"
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              🇬🇧 London
            </Link>
            <Link
              href="/flights?lat=40.6413&lon=-73.7781"
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              🇺🇸 NYC
            </Link>
          </div>
        </div>
      </div>

      {/* Map Component - Client Component wrapper */}
      <FlightMapWrapper 
        initialFlights={initialFlights} 
        boundingBox={boundingBox}
      />

      {/* Info Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Data from{' '}
          <a href="https://opensky-network.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            OpenSky Network
          </a>{' '}
          • ADS-B receivers worldwide • Updates every 30 seconds
        </p>
        <p className="mt-1 text-xs">
          ⚠️ Positions are approximate • Not for navigation or safety-critical use
        </p>
      </div>
    </div>
  );
}