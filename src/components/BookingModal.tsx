import { useState } from 'react';
import { X, User, Loader2, CheckCircle, Copy, Brain as Train } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { TrainWithSchedule } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type Props = {
  train: TrainWithSchedule;
  user: SupabaseUser;
  onClose: () => void;
  onBooked: () => void;
};

type Step = 'form' | 'success';

export default function BookingModal({ train, user, onClose, onBooked }: Props) {
  const [passengerName, setPassengerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [pnr, setPnr] = useState('');
  const [copied, setCopied] = useState(false);

  const schedule = train.schedules?.[0];

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!passengerName.trim()) {
      setError('Please enter passenger name.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { data, error: err } = await supabase.rpc('book_ticket', {
        p_user_id: user.id,
        p_train_no: train.train_no,
        p_passenger_name: passengerName.trim(),
      });

      if (err) throw err;
      setPnr(data as string);
      setStep('success');
      onBooked();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copyPnr() {
    navigator.clipboard.writeText(pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {step === 'form' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Train className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Book Ticket</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Train summary */}
            <div className="mx-6 mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="font-semibold text-gray-900 text-sm">{train.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">#{train.train_no}</p>
              <div className="flex items-center justify-between mt-3 text-sm">
                <div>
                  <p className="font-bold text-gray-900">{schedule?.departure_time ?? '--'}</p>
                  <p className="text-gray-500 text-xs">{train.source}</p>
                </div>
                <div className="flex-1 mx-3 border-t-2 border-dashed border-blue-300" />
                <div className="text-right">
                  <p className="font-bold text-gray-900">{schedule?.arrival_time ?? '--'}</p>
                  <p className="text-gray-500 text-xs">{train.destination}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
                <span className="text-xs text-gray-600">Fare</span>
                <span className="text-base font-bold text-blue-700">
                  ₹{schedule?.fare ? Number(schedule.fare).toLocaleString('en-IN') : '--'}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleBook} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Passenger Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={passengerName}
                    onChange={e => setPassengerName(e.target.value)}
                    placeholder="Full name as on ID"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                <p><span className="font-medium text-gray-700">Booked by:</span> {user.email}</p>
                <p><span className="font-medium text-gray-700">Available seats:</span> {train.available_seats}</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Success state */
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Ticket Confirmed!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your booking is confirmed. Save your PNR number.
            </p>

            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">PNR Number</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-mono font-bold text-gray-900 tracking-widest">
                  {pnr}
                </span>
                <button
                  onClick={copyPnr}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>}
            </div>

            <div className="text-left bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm space-y-1.5">
              <p><span className="text-gray-500">Train:</span> <span className="font-medium text-gray-800">{train.name}</span></p>
              <p><span className="text-gray-500">Route:</span> <span className="font-medium text-gray-800">{train.source} → {train.destination}</span></p>
              <p><span className="text-gray-500">Passenger:</span> <span className="font-medium text-gray-800">{passengerName}</span></p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
