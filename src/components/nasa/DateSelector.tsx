'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DateSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [singleDate, setSingleDate] = useState('');
  const [mode, setMode] = useState<'single' | 'range'>('single');

  // Sync state with URL on mount/navigation
  useEffect(() => {
    const date = searchParams.get('date');
    const start = searchParams.get('start_date');
    const end = searchParams.get('end_date');
    
    if (start && end) {
      setMode('range');
      setStartDate(start);
      setEndDate(end);
    } else if (date) {
      setMode('single');
      setSingleDate(date);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (mode === 'single' && singleDate) {
      params.set('date', singleDate);
    } else if (mode === 'range' && startDate && endDate) {
      params.set('start_date', startDate);
      params.set('end_date', endDate);
    }
    
    const query = params.toString();
    router.push(`/nasa-apod${query ? `?${query}` : ''}`);
  };

  const handleRandom = () => {
    // Random date between 1995-06-16 (first APOD) and today
    const start = new Date('1995-06-16');
    const end = new Date();
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    const formatted = randomDate.toISOString().split('T')[0];
    router.push(`/nasa-apod?date=${formatted}`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
      {/* Mode Toggle */}
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mode"
            value="single"
            checked={mode === 'single'}
            onChange={() => setMode('single')}
            className="text-blue-600"
          />
          <span>Single Date</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mode"
            value="range"
            checked={mode === 'range'}
            onChange={() => setMode('range')}
            className="text-blue-600"
          />
          <span>Date Range</span>
        </label>
      </div>

      {/* Single Date Input */}
      {mode === 'single' && (
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              min="1995-06-16"
              max={today}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
            >
              Fetch
            </button>
            <button
              type="button"
              onClick={handleRandom}
              className="px-5 py-2.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition"
              title="Random APOD"
            >
              🎲 Random
            </button>
          </div>
        </div>
      )}

      {/* Date Range Inputs */}
      {mode === 'range' && (
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min="1995-06-16"
              max={endDate || today}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || '1995-06-16'}
              max={today}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
          >
            Fetch Range
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3">
        📅 APOD archive: June 16, 1995 – Today • 
        🔀 "Random" picks a date from the archive • 
        📊 Range fetches up to 100 consecutive days
      </p>
    </form>
  );
}