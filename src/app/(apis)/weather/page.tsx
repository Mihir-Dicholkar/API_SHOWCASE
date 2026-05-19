import { WeatherResponse, getWeatherInfo } from '@/lib/validators';
import Link from 'next/link';
import GeolocationButton from '@/components/weather/GeolocationButton';

export const metadata = {
  title: 'Weather Forecast | API Showcase',
  description: 'Real-time weather forecasts powered by Open-Meteo',
};

// Helper: Format temperature with unit
const formatTemp = (temp: number, unit: 'celsius' | 'fahrenheit' = 'celsius') => {
  const value = unit === 'fahrenheit' ? (temp * 9/5) + 32 : temp;
  const symbol = unit === 'fahrenheit' ? '°F' : '°C';
  return `${Math.round(value)}${symbol}`;
};

// Helper: Format time for display
const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Helper: Format date for display
const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default async function WeatherPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ lat?: string; lon?: string; name?: string }> 
}) {
  const params = await searchParams;
  
  // Default: London coordinates
  let latitude = parseFloat(params?.lat || '51.5074');
  let longitude = parseFloat(params?.lon || '-0.1278');
  let locationName = params?.name || 'London, UK';

  // If user searched by name, geocode first (server-side)
  if (params?.name && !params?.lat) {
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(params.name)}&count=1&language=en&format=json`,
        { next: { revalidate: 86400 } } // Cache geocoding for 24h
      );
      const geoData = await geoRes.json();
      
      if (geoData.results?.[0]) {
        latitude = geoData.results[0].latitude;
        longitude = geoData.results[0].longitude;
        locationName = `${geoData.results[0].name}, ${geoData.results[0].country}`;
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
      // Fallback to default coordinates
    }
  }

  // Build weather API query
  const weatherParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset',
    timezone: 'auto',
  });

  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/openmeteo?${weatherParams.toString()}`;
  
  console.log('🌤️ Fetching weather from:', apiUrl);
  
  const res = await fetch(apiUrl, {
    next: { revalidate: 300 } // Cache for 5 minutes (weather changes)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('❌ Weather API error:', res.status, errorData);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 max-w-md">
          <h2 className="text-xl font-bold mb-2">⚠️ Failed to load weather</h2>
          <p className="text-sm">Status: {res.status}</p>
          <p className="text-xs text-gray-600 mt-2">{JSON.stringify(errorData, null, 2)}</p>
          <Link href="/weather" className="inline-block mt-4 text-blue-600 hover:underline text-sm">
            ← Try again
          </Link>
        </div>
      </div>
    );
  }

  const data = await res.json() as WeatherResponse;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">🌤️ Weather Forecast</h1>
        <p className="text-gray-600 mt-2">Real-time weather for <strong>{locationName}</strong></p>
      </div>

      {/* Search Form - Server Component (no onClick) */}
      <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="name"
            placeholder="Search city (e.g., Paris, Tokyo, New York)..."
            defaultValue={params?.name}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            Search
          </button>
          {/* ✅ Client Component for interactive button */}
          <GeolocationButton />
        </div>
      </form>

      {/* Current Weather Card */}
      {data.current && (
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl">{getWeatherInfo(data.current.weather_code).emoji}</span>
                <div>
                  <h2 className="text-2xl font-bold">{formatTemp(data.current.temperature_2m)}</h2>
                  <p className="text-blue-100">{getWeatherInfo(data.current.weather_code).label}</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm">
                Feels like {formatTemp(data.current.apparent_temperature)} • 
                Humidity {data.current.relative_humidity_2m}% • 
                Wind {Math.round(data.current.wind_speed_10m)} km/h
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{locationName}</p>
              <p className="text-blue-100 text-sm">
                Updated {formatTime(data.current.time)} {data.timezone_abbreviation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5-Day Forecast */}
      {data.daily && data.daily.time && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">5-Day Forecast</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {data.daily.time.slice(0, 5).map((date: string, idx: number) => {
              const code = data.daily!.weather_code?.[idx];
              const max = data.daily!.temperature_2m_max?.[idx];
              const min = data.daily!.temperature_2m_min?.[idx];
              const precip = data.daily!.precipitation_sum?.[idx];
              
              if (code === undefined || max === undefined || min === undefined) return null;
              
              return (
                <div key={date} className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition">
                  <p className="text-sm font-medium text-gray-600 mb-2">{formatDate(date)}</p>
                  <span className="text-3xl mb-2 block">{getWeatherInfo(code).emoji}</span>
                  <p className="text-xs text-gray-500 mb-3">{getWeatherInfo(code).label}</p>
                  <div className="flex justify-center items-baseline gap-1">
                    <span className="font-bold text-gray-900">{Math.round(max)}°</span>
                    <span className="text-gray-400 text-sm">/ {Math.round(min)}°</span>
                  </div>
                  {precip && precip > 0 && (
                    <p className="text-xs text-blue-600 mt-1">💧 {precip} mm</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Location Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)} • 
          Timezone: {data.timezone} • 
          Elevation: {data.elevation}m
        </p>
        <p className="mt-1">
          Data powered by <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open-Meteo</a>
        </p>
      </div>
    </div>
  );
}