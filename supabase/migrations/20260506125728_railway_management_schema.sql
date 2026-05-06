
/*
  # Railway Management System - Core Schema

  ## Tables
  1. `trains` - Train master data
     - `train_no` (text, PK) - Unique train number
     - `name` (text) - Train name
     - `source` (text) - Source station
     - `destination` (text) - Destination station
     - `total_seats` (int) - Total seat capacity
     - `available_seats` (int) - Remaining available seats

  2. `schedules` - Train schedule details
     - `id` (uuid, PK)
     - `train_no` (FK -> trains.train_no)
     - `arrival_time` (time) - Arrival time at destination
     - `departure_time` (time) - Departure time from source
     - `fare` (numeric) - Ticket fare

  3. `bookings` - Passenger booking records
     - `pnr` (text, PK) - 10-digit unique PNR
     - `user_id` (uuid, FK -> auth.users)
     - `train_no` (FK -> trains.train_no)
     - `seat_no` (int) - Assigned seat number
     - `status` (text) - 'Confirmed' or 'Cancelled'
     - `passenger_name` (text) - Passenger full name
     - `created_at` (timestamptz)

  ## Functions
  - `book_ticket(p_user_id, p_train_no, p_passenger_name)` - Transactional booking with seat decrement
  - `cancel_ticket(p_pnr, p_user_id)` - Cancel a booking and restore available seats

  ## Security
  - RLS enabled on all tables
  - Trains and schedules readable by all authenticated users
  - Bookings readable/writable only by owner
*/

-- Trains table
CREATE TABLE IF NOT EXISTS trains (
  train_no TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  total_seats INT NOT NULL DEFAULT 100 CHECK (total_seats > 0),
  available_seats INT NOT NULL DEFAULT 100 CHECK (available_seats >= 0)
);

ALTER TABLE trains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view trains"
  ON trains FOR SELECT
  TO authenticated
  USING (true);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_no TEXT NOT NULL REFERENCES trains(train_no) ON DELETE CASCADE,
  arrival_time TIME NOT NULL,
  departure_time TIME NOT NULL,
  fare NUMERIC(10,2) NOT NULL CHECK (fare > 0)
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (true);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  pnr TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  train_no TEXT NOT NULL REFERENCES trains(train_no),
  seat_no INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Cancelled')),
  passenger_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Transactional booking function
CREATE OR REPLACE FUNCTION book_ticket(
  p_user_id UUID,
  p_train_no TEXT,
  p_passenger_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available INT;
  v_total INT;
  v_seat_no INT;
  v_pnr TEXT;
BEGIN
  -- Lock the train row and check availability
  SELECT available_seats, total_seats
    INTO v_available, v_total
    FROM trains
   WHERE train_no = p_train_no
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Train not found';
  END IF;

  IF v_available <= 0 THEN
    RAISE EXCEPTION 'No seats available on this train';
  END IF;

  -- Compute next seat number
  v_seat_no := v_total - v_available + 1;

  -- Generate unique 10-digit PNR
  LOOP
    v_pnr := LPAD(FLOOR(RANDOM() * 9000000000 + 1000000000)::TEXT, 10, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE pnr = v_pnr);
  END LOOP;

  -- Decrement available seats
  UPDATE trains
     SET available_seats = available_seats - 1
   WHERE train_no = p_train_no;

  -- Create booking record
  INSERT INTO bookings (pnr, user_id, train_no, seat_no, status, passenger_name)
  VALUES (v_pnr, p_user_id, p_train_no, v_seat_no, 'Confirmed', p_passenger_name);

  RETURN v_pnr;
END;
$$;

-- Cancel ticket function
CREATE OR REPLACE FUNCTION cancel_ticket(
  p_pnr TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_train_no TEXT;
  v_status TEXT;
BEGIN
  SELECT train_no, status
    INTO v_train_no, v_status
    FROM bookings
   WHERE pnr = p_pnr AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_status = 'Cancelled' THEN
    RAISE EXCEPTION 'Booking already cancelled';
  END IF;

  UPDATE bookings SET status = 'Cancelled' WHERE pnr = p_pnr AND user_id = p_user_id;
  UPDATE trains SET available_seats = available_seats + 1 WHERE train_no = v_train_no;

  RETURN TRUE;
END;
$$;
