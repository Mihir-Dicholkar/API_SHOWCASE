'use client';

import dynamic from 'next/dynamic';
import { NominatimResult } from '@/lib/validators';
import type { ComponentType } from 'react';

interface LocationMapProps {
  location: NominatimResult | null;
}

// ✅ Dynamically import LocationMap with SSR disabled
const LocationMap = dynamic(() => import('@/components/maps/LocationMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 rounded-xl animate-pulse border border-gray-200 flex items-center justify-center text-gray-500">
      Loading map...
    </div>
  )
}) as ComponentType<LocationMapProps>;

interface LocationMapWrapperProps {
  location: NominatimResult | null;
}

export default function LocationMapWrapper({ location }: LocationMapWrapperProps) {
  return <LocationMap location={location} />;
}