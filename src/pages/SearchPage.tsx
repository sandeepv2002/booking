import { useState } from 'react';
import { MapPin, ArrowLeftRight, Search, Brain as Train } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { TrainWithSchedule } from '../lib/supabase';

const STATIONS = [
  'New Delhi',
  'Mumbai Central',
  'Kolkata',
  'Chennai Central',
  'Bangalore',
  'Hyderabad',
  'Bhopal',
  'Varanasi',
  'Goa',
  'Bhubaneswar',
];

type Props = {
  onSearch: (source: string, destination: string, trains: TrainWithSchedule[]) => void;
  onAuthRequired: () => void;
  isAuthenticated: boolean;
};

export default function SearchPage({ onSearch, onAuthRequired, isAuthenticated }: Props) {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function swapStations() {
    setSource(destination);
    setDestination(source);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!source || !destination) {
      setError('Please select both source and destination stations.');
      return;
    }
    if (source === destination) {
      setError('Source and destination cannot be the same.');
      return;
    }
    setError('');

    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('trains')
        .select('*, schedules(*)')
        .eq('source', source)
        .eq('destination', destination);

      if (err) throw err;
      onSearch(source, destination, (data ?? []) as TrainWithSchedule[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-0 right-20 w-80 h-80 rounded-full bg-sky-300/30 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-3 mb-4">
            <Train className="w-8 h-8 text-blue-200" />
            <span className="text-blue-200 font-medium tracking-wide uppercase text-sm">
              Railway Management System
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Book Your Journey<br />
            <span className="text-blue-200">Across India</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-xl">
            Search trains, check availability in real-time, and book confirmed seats in seconds.
          </p>
        </div>
      </div>

      {/* Search card */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Search for trains</h2>

          <form onSubmit={handleSearch}>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              {/* From */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  From
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  <select
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  >
                    <option value="">Select departure city</option>
                    {STATIONS.filter(s => s !== destination).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap button */}
              <button
                type="button"
                onClick={swapStations}
                className="sm:mb-0 self-center sm:self-end flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 transition-colors bg-white"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>

              {/* To */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  To
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  <select
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  >
                    <option value="">Select arrival city</option>
                    {STATIONS.filter(s => s !== source).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Searching...' : 'Search Trains'}
            </button>
          </form>
        </div>

        {/* Quick facts */}
        <div className="grid grid-cols-3 gap-4 mt-8 mb-12">
          {[
            { label: 'Routes', value: '10+' },
            { label: 'Trains', value: '10' },
            { label: 'Stations', value: '10' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
