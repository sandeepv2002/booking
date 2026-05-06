import { useEffect, useState, useCallback } from 'react';
import { Ticket, Loader2, XCircle, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Booking } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type Props = {
  user: SupabaseUser;
};

export default function MyTicketsPage({ user }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingPnr, setCancellingPnr] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('bookings')
      .select('*, trains(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setBookings((data ?? []) as Booking[]);
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleCancel(pnr: string) {
    if (!confirm(`Cancel booking ${pnr}? This action cannot be undone.`)) return;
    setCancellingPnr(pnr);
    try {
      const { error: err } = await supabase.rpc('cancel_ticket', {
        p_pnr: pnr,
        p_user_id: user.id,
      });
      if (err) throw err;
      await fetchBookings();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setCancellingPnr(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm">Loading your tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Ticket className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Tickets</h1>
            <p className="text-sm text-gray-500">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">No tickets yet</h3>
            <p className="text-sm text-gray-500">Book your first train ticket to see it here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => {
              const isCancelled = booking.status === 'Cancelled';
              return (
                <div
                  key={booking.pnr}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity ${
                    isCancelled ? 'opacity-60 border-gray-200' : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  {/* Status strip */}
                  <div className={`h-1 w-full ${isCancelled ? 'bg-gray-300' : 'bg-green-500'}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      {/* Left: train info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isCancelled ? (
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                          <span className={`text-xs font-semibold uppercase tracking-wide ${
                            isCancelled ? 'text-red-600' : 'text-green-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-base truncate">
                          {booking.trains?.name ?? booking.train_no}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {booking.trains?.source} <ChevronRight className="w-3 h-3 inline -mt-0.5" /> {booking.trains?.destination}
                        </p>
                      </div>

                      {/* Right: PNR */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">PNR</p>
                        <p className="font-mono text-base font-bold text-gray-800 tracking-widest">
                          {booking.pnr}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div>
                        <p className="text-xs text-gray-400">Passenger</p>
                        <p className="text-sm font-medium text-gray-800">{booking.passenger_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Seat No.</p>
                        <p className="text-sm font-medium text-gray-800">#{booking.seat_no}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Booked on</p>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(booking.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      {!isCancelled && (
                        <div className="ml-auto">
                          <button
                            onClick={() => handleCancel(booking.pnr)}
                            disabled={cancellingPnr === booking.pnr}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            {cancellingPnr === booking.pnr && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            )}
                            Cancel Ticket
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
