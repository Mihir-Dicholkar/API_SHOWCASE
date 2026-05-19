'use client';

import { useState } from 'react';

export default function GeolocationButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Redirect to weather page with coordinates
        window.location.href = `/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`;
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(err.message || 'Failed to get location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleGetLocation}
        disabled={loading}
        className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">🔄</span>
            Getting location...
          </>
        ) : (
          <>📍 Use My Location</>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded">{error}</p>
      )}
    </div>
  );
}