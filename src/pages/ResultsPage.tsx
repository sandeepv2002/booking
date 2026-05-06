import { useState } from 'react';
import { ArrowLeft, Clock, Armchair, IndianRupee, Search } from 'lucide-react';
import type { TrainWithSchedule } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import BookingModal from '../components/BookingModal';

type Props = {
  source: string;
  destination: string;
  trains: TrainWithSchedule[];
  user: SupabaseUser | null;
  onBack: () => void;
  onAuthRequired: () => void;
  onRefresh: () => void;
};

export default function ResultsPage({
  source,
  destination,
  trains,
  user,
  onBack,
  onAuthRequired,
  onRefresh,
}: Props) {
  const [bookingTrain, setBookingTrain] = useState<TrainWithSchedule | null>(null);

  function handleBook(train: TrainWithSchedule) {
    if (!user) {
      onAuthRequired();
      return;
    }
    setBookingTrain(train);
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Sub-header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2 text-sm">
              <Search className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900">{source}</span>
              <span className="text-gray-400">→</span>
              <span className="font-semibold text-gray-900">{destination}</span>
            </div>
            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {trains.length} train{trains.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {trains.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No trains found</h3>
            <p className="text-gray-500 text-sm">
              No trains available for {source} to {destination}. Try a different route.
            </p>
            <button
              onClick={onBack}
              className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              New Search
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Column headers — desktop */}
            <div className="hidden sm:grid grid-cols-5 gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <span className="col-span-2">Train</span>
              <span>Departure</span>
              <span>Arrival</span>
              <span>Fare / Seats</span>
            </div>

            {trains.map(train => {
              const schedule = train.schedules?.[0];
              const isFull = train.available_seats === 0;

              return (
                <div
                  key={train.train_no}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Mobile layout */}
                  <div className="sm:hidden p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{train.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">#{train.train_no}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isFull ? 'Full' : `${train.available_seats} seats`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mb-3">
                      <div className="text-center">
                        <p className="font-bold text-gray-900">{schedule?.departure_time ?? '--'}</p>
                        <p className="text-xs text-gray-500">{train.source}</p>
                      </div>
                      <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-1" />
                      <div className="text-center">
                        <p className="font-bold text-gray-900">{schedule?.arrival_time ?? '--'}</p>
                        <p className="text-xs text-gray-500">{train.destination}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-700">
                        ₹{schedule?.fare ? Number(schedule.fare).toLocaleString('en-IN') : '--'}
                      </span>
                      <button
                        onClick={() => handleBook(train)}
                        disabled={isFull}
                        className={`px-5 py-2 text-sm font-semibold rounded-xl transition-colors ${
                          isFull
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isFull ? 'Waitlist' : 'Book'}
                      </button>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:grid grid-cols-5 gap-4 items-center px-6 py-5">
                    <div className="col-span-2">
                      <h3 className="font-bold text-gray-900">{train.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">#{train.train_no}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-800">{schedule?.departure_time ?? '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-800">{schedule?.arrival_time ?? '--'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-0.5">
                          <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-base font-bold text-blue-700">
                            {schedule?.fare ? Number(schedule.fare).toLocaleString('en-IN') : '--'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Armchair className="w-3 h-3 text-gray-400" />
                          <span className={`text-xs font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                            {isFull ? 'Full' : `${train.available_seats} avail.`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleBook(train)}
                        disabled={isFull}
                        className={`ml-4 px-5 py-2 text-sm font-semibold rounded-xl transition-colors ${
                          isFull
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isFull ? 'Full' : 'Book'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {bookingTrain && user && (
        <BookingModal
          train={bookingTrain}
          user={user}
          onClose={() => setBookingTrain(null)}
          onBooked={() => {
            setBookingTrain(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
