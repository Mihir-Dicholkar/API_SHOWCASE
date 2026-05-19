import { ApodResponse, formatNasaDate } from '@/lib/validators';
import Link from 'next/link';
import DateSelector from '@/components/nasa/DateSelector';

export const metadata = {
  title: 'NASA APOD | API Showcase',
  description: "Explore NASA's Astronomy Picture of the Day archive",
};

export default async function NasaApodPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ 
    date?: string; 
    start_date?: string; 
    end_date?: string;
    count?: string;
  }> 
}) {
  const params = await searchParams;
  
  // Build API query params
  const apiParams = new URLSearchParams();
  apiParams.set('api_key', process.env.NASA_API_KEY || 'DEMO_KEY');
  apiParams.set('thumbs', 'true'); // Always get video thumbnails

  // Handle different query modes
  if (params?.start_date && params?.end_date) {
    // Date range mode
    apiParams.set('start_date', params.start_date);
    apiParams.set('end_date', params.end_date);
  } else if (params?.date) {
    // Single date mode
    apiParams.set('date', params.date);
  }
  // Else: fetch today's APOD (default)

  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/nasa?${apiParams.toString()}`;
  
  console.log('🌌 Fetching APOD from:', apiUrl);
  
  const res = await fetch(apiUrl, {
    next: { revalidate: 3600 } // Cache for 1 hour
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('❌ NASA APOD error:', res.status, errorData);
    
    if (res.status === 429) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-orange-50 text-orange-700 p-6 rounded-xl border border-orange-200 max-w-md">
            <h2 className="text-xl font-bold mb-2">⚠️ Rate limit exceeded</h2>
            <p className="text-sm mb-2">NASA API limit reached with DEMO_KEY.</p>
            <p className="text-xs text-gray-600 mb-4">
              Get your free API key at{' '}
              <a href="https://api.nasa.gov" target="_blank" rel="noopener noreferrer" className="underline">
                api.nasa.gov
              </a>{' '}
              (no email required).
            </p>
            <Link href="/nasa-apod" className="inline-block text-blue-600 hover:underline text-sm">
              ← Try again later
            </Link>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 max-w-md">
          <h2 className="text-xl font-bold mb-2">⚠️ Failed to load APOD</h2>
          <p className="text-sm">Status: {res.status}</p>
          <p className="text-xs text-gray-600 mt-2">{JSON.stringify(errorData, null, 2)}</p>
          <Link href="/nasa-apod" className="inline-block mt-4 text-blue-600 hover:underline text-sm">
            ← Try again
          </Link>
        </div>
      </div>
    );
  }

  const rawData = await res.json();
  // NASA returns array for ranges, single object for single date
  const apods: ApodResponse[] = Array.isArray(rawData) ? rawData : [rawData];

  // Determine display title based on query
  let displayTitle = "Today's APOD";
  if (params?.date) {
    displayTitle = `APOD for ${formatNasaDate(params.date)}`;
  } else if (params?.start_date && params?.end_date) {
    displayTitle = `APODs: ${params.start_date} to ${params.end_date}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">🌌 NASA Astronomy Picture of the Day</h1>
        <p className="text-gray-600 mt-2">{displayTitle}</p>
      </div>

      {/* Date Selector (Client Component) */}
      <DateSelector />

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-6">
        Showing {apods.length} APOD{apods.length !== 1 ? 's' : ''}
      </p>

      {/* APOD List */}
      <div className="space-y-8">
        {apods.map((apod, idx) => (
          <article key={`${apod.date}-${idx}`} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Media: Image or Video */}
            <div className="relative bg-black aspect-video flex items-center justify-center">
              {apod.media_type === 'image' ? (
                <img
                  src={apod.url}
                  alt={apod.title}
                  className="w-full h-full object-contain"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              ) : (
                <iframe
                  src={apod.url.replace('watch?v=', 'embed/')}
                  title={apod.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              )}
              
              {/* HD Link for images */}
              {apod.media_type === 'image' && apod.hdurl && (
                <a
                  href={apod.hdurl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 text-white text-xs rounded-full hover:bg-black/90 transition flex items-center gap-1"
                >
                  🔍 HD
                </a>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{apod.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    📅 {formatNasaDate(apod.date)} • {apod.media_type === 'video' ? '🎬 Video' : '🖼️ Image'}
                  </p>
                </div>
                {apod.copyright && (
                  <p className="text-xs text-gray-400 italic">© {apod.copyright}</p>
                )}
              </div>

              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="leading-relaxed">{apod.explanation}</p>
              </div>

              {/* Footer actions */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                <a
                  href={`https://apod.nasa.gov/apod/ap${apod.date.replace(/-/g, '')}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition flex items-center gap-1"
                >
                  🔗 View on NASA APOD
                </a>
                {apod.media_type === 'image' && apod.hdurl && (
                  <a
                    href={apod.hdurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition flex items-center gap-1"
                  >
                    ⬇️ Download HD
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Empty state */}
      {apods.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-600">No APODs found for this date range.</p>
          <p className="text-sm text-gray-400 mt-1">Try a different date or check the archive starts June 16, 1995.</p>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Data from{' '}
          <a href="https://api.nasa.gov" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            NASA API
          </a>{' '}
          • Archive: June 16, 1995 – Today
        </p>
        <p className="mt-1">
          Using key: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{process.env.NASA_API_KEY ? '••••••••' : 'DEMO_KEY'}</code>
        </p>
      </div>
    </div>
  );
}