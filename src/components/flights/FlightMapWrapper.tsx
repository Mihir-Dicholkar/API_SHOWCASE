'use client';

import dynamic from 'next/dynamic';
import { parseFlightState } from '@/lib/validators';

// ✅ Dynamically import FlightMap with SSR disabled (client-only)
const FlightMap = dynamic(() => import('@/components/flights/FlightMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-100 rounded-xl animate-pulse border border-gray-200 flex items-center justify-center text-gray-500">
      Loading map...
    </div>
  )
});

interface FlightMapWrapperProps {
  initialFlights: ReturnType<typeof parseFlightState>[];
  boundingBox?: { minLat: number; maxLat: number; minLon: number; maxLon: number };
}

export default function FlightMapWrapper({ initialFlights, boundingBox }: FlightMapWrapperProps) {
  return <FlightMap initialFlights={initialFlights} boundingBox={boundingBox} />;
}