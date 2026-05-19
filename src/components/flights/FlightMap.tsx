'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { parseFlightState, formatAltitude, formatVelocity, formatHeading, getCategoryLabel } from '@/lib/validators';

// Component to update map view based on props
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface FlightMapProps {
  initialFlights: ReturnType<typeof parseFlightState>[];
  boundingBox?: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  onFlightSelect?: (flight: ReturnType<typeof parseFlightState>) => void;
}

export default function FlightMap({ initialFlights, boundingBox, onFlightSelect }: FlightMapProps) {
  const [flights, setFlights] = useState(initialFlights.filter(f => f?.latitude && f?.longitude));
  const [selectedFlight, setSelectedFlight] = useState<ReturnType<typeof parseFlightState> | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // ✅ Create airplane icon inside component (client-side only)
  const airplaneIcon = useMemo(() => new L.DivIcon({
    className: 'airplane-marker',
    html: `<div style="
      font-size: 20px;
      transform: rotate(var(--heading, 0deg));
      transition: transform 0.3s ease;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    ">✈️</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }), []);

  // Default to world view or bounding box
  const defaultCenter: [number, number] = boundingBox 
    ? [(boundingBox.minLat + boundingBox.maxLat) / 2, (boundingBox.minLon + boundingBox.maxLon) / 2]
    : [20, 0];
  const defaultZoom = boundingBox ? 4 : 2;

  // Poll for live updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams();
        if (boundingBox) {
          params.set('lamin', boundingBox.minLat.toString());
          params.set('lamax', boundingBox.maxLat.toString());
          params.set('lomin', boundingBox.minLon.toString());
          params.set('lomax', boundingBox.maxLon.toString());
        }
        
        const res = await fetch(`/api/proxy/opensky?${params.toString()}`); // ✅ No /states/all here
        if (res.ok) {
          const data = await res.json();
          const parsed = data.states
            .map(parseFlightState)
            .filter((f: ReturnType<typeof parseFlightState> | null): f is NonNullable<ReturnType<typeof parseFlightState>> =>
              Boolean(f?.latitude && f?.longitude && !f.onGround)
            );
          setFlights(parsed);
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Failed to fetch flight updates:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [boundingBox]);

  const handleMarkerClick = useCallback((flight: ReturnType<typeof parseFlightState>) => {
    setSelectedFlight(flight);
    onFlightSelect?.(flight);
  }, [onFlightSelect]);

  return (
    <div className="relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        style={{ height: '600px', width: '100%', borderRadius: '12px' }}
        className="border border-gray-200 shadow-sm"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Flight data: <a href="https://opensky-network.org">OpenSky Network</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />
        <MapUpdater center={defaultCenter} zoom={defaultZoom} />
        
        {flights.map((flight) => {
          if (!flight?.latitude || !flight?.longitude) return null;
          
          const heading = flight.heading || 0;
          
          return (
            <Marker
              key={flight.icao24}
              position={[flight.latitude, flight.longitude]}
              icon={airplaneIcon}
              eventHandlers={{
                click: () => handleMarkerClick(flight),
                mouseover: (e) => {
                  const target = e.target as L.Marker;
                  target.setZIndexOffset(1000);
                },
                mouseout: (e) => {
                  const target = e.target as L.Marker;
                  target.setZIndexOffset(0);
                },
              }}
            >
              <Popup maxWidth={250}>
                <div className="text-sm">
                  <p className="font-bold text-gray-900">{flight.callsign}</p>
                  <p className="text-gray-600">{flight.originCountry}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Alt: {formatAltitude(flight.altitude)} • Speed: {formatVelocity(flight.velocity)}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Flight Details Sidebar */}
      {selectedFlight && (
        <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-[1000] max-h-[80vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-lg text-gray-900">{selectedFlight.callsign}</h3>
            <button
              onClick={() => setSelectedFlight(null)}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ICAO24</span>
              <span className="font-mono text-gray-900">{selectedFlight.icao24.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Origin</span>
              <span className="text-gray-900">{selectedFlight.originCountry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Altitude</span>
              <span className="text-gray-900">{formatAltitude(selectedFlight.altitude)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Speed</span>
              <span className="text-gray-900">{formatVelocity(selectedFlight.velocity)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Heading</span>
              <span className="text-gray-900">{formatHeading(selectedFlight.heading)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vertical Rate</span>
              <span className={`font-medium ${
                (selectedFlight.verticalRate || 0) > 0 ? 'text-green-600' : 
                (selectedFlight.verticalRate || 0) < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {selectedFlight.verticalRate !== null 
                  ? `${Math.round(selectedFlight.verticalRate * 196.85)} ft/min` 
                  : 'Level'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="text-gray-900">{getCategoryLabel(selectedFlight.category)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Squawk</span>
              <span className="font-mono text-gray-900">{selectedFlight.squawk || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Position Source</span>
              <span className="text-gray-900">
                {selectedFlight.positionSource === 0 ? 'ADS-B' : 
                 selectedFlight.positionSource === 1 ? 'ASTERIC' :
                 selectedFlight.positionSource === 2 ? 'MLAT' :
                 selectedFlight.positionSource === 3 ? 'FLARM' : 'Unknown'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
            <p>Last update: {lastUpdate.toLocaleTimeString()}</p>
            <p className="mt-1">
              View on{' '}
              <a 
                href={`https://opensky-network.org/aircraft?icao24=${selectedFlight.icao24}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                OpenSky Network
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-sm border border-gray-200 text-xs">
        <p className="font-medium text-gray-700 mb-1">✈️ Live Flights</p>
        <p className="text-gray-500">Click any plane for details</p>
        <p className="text-gray-400 mt-1">Updates every 30s</p>
      </div>
    </div>
  );
}