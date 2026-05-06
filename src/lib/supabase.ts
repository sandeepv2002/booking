import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Train = {
  train_no: string;
  name: string;
  source: string;
  destination: string;
  total_seats: number;
  available_seats: number;
};

export type Schedule = {
  id: string;
  train_no: string;
  arrival_time: string;
  departure_time: string;
  fare: number;
};

export type TrainWithSchedule = Train & {
  schedules: Schedule[];
};

export type Booking = {
  pnr: string;
  user_id: string;
  train_no: string;
  seat_no: number;
  status: 'Confirmed' | 'Cancelled';
  passenger_name: string;
  created_at: string;
  trains?: Train;
  schedules?: Schedule[];
};
