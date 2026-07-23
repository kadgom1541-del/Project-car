-- ====================================================================
-- DriveERP PostgreSQL Database Schema, Triggers, RLS Policies & Storage
-- Compatible with Supabase PostgreSQL Engine (Text / UUID Hybrid Compatible)
-- ====================================================================

-- Clean up existing conflicting tables if present
DROP TABLE IF EXISTS public.loyalty_transactions CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.staff_members CASCADE;

-- 1. VEHICLES TABLE
CREATE TABLE public.vehicles (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  province VARCHAR(100) DEFAULT 'กรุงเทพมหานคร',
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT DEFAULT 2024,
  color VARCHAR(30),
  category VARCHAR(50) DEFAULT 'Sedan',
  vin VARCHAR(50),
  engine_number VARCHAR(50),
  status VARCHAR(30) DEFAULT 'Available',
  current_odometer INT DEFAULT 0,
  next_service_km INT DEFAULT 10000,
  daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 1200.00,
  fuel_type VARCHAR(50) DEFAULT 'Gasohol 95',
  fuel_level_percent INT DEFAULT 100,
  image_url TEXT,
  purchase_price NUMERIC(12, 2) DEFAULT 0,
  salvage_value NUMERIC(12, 2) DEFAULT 0,
  useful_life_years INT DEFAULT 5,
  acquisition_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TABLE public.customers (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) UNIQUE,
  email VARCHAR(100),
  national_id_or_passport VARCHAR(50),
  driver_license_no VARCHAR(50),
  tier VARCHAR(20) DEFAULT 'Standard',
  points_balance INT DEFAULT 0,
  total_rentals_count INT DEFAULT 0,
  total_spent_thb NUMERIC(12, 2) DEFAULT 0,
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  credit_limit_thb NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BOOKINGS TABLE (WITH IFRS 15 REVENUE AMORTIZATION)
CREATE TABLE public.bookings (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_code VARCHAR(50) UNIQUE NOT NULL,
  vehicle_id VARCHAR(100) REFERENCES public.vehicles(id) ON DELETE SET NULL,
  customer_id VARCHAR(100) REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(150),
  vehicle_model VARCHAR(100),
  vehicle_plate VARCHAR(30),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pickup_branch TEXT DEFAULT 'สาขาสุวรรณภูมิ HQ',
  dropoff_branch TEXT DEFAULT 'สาขาสุวรรณภูมิ HQ',
  total_days INT NOT NULL DEFAULT 1,
  daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  base_amount NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  addons_amount NUMERIC(10, 2) DEFAULT 0,
  vat_amount NUMERIC(10, 2) DEFAULT 0,
  deposit_amount NUMERIC(10, 2) DEFAULT 3000.00,
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Confirmed',
  payment_status VARCHAR(30) DEFAULT 'Paid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STAFF MEMBERS TABLE
CREATE TABLE public.staff_members (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(30),
  role_title VARCHAR(100) NOT NULL,
  role VARCHAR(30) DEFAULT 'staff',
  pin_hash VARCHAR(50) NOT NULL DEFAULT '123456',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LOYALTY TRANSACTIONS LOG
CREATE TABLE public.loyalty_transactions (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_id VARCHAR(100) REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_id VARCHAR(100) REFERENCES public.bookings(id) ON DELETE SET NULL,
  points_change INT NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'Earned', 'Redeemed', 'Bonus'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- TRIGGERS & FUNCTIONS FOR AUTOMATED REAL-TIME CALCULATIONS
-- ====================================================================

CREATE OR REPLACE FUNCTION public.fn_auto_reward_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  earned_points INT;
BEGIN
  IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed') THEN
    earned_points := FLOOR(NEW.grand_total / 100);

    UPDATE public.customers
    SET 
      points_balance = points_balance + earned_points,
      total_rentals_count = total_rentals_count + 1,
      total_spent_thb = total_spent_thb + NEW.grand_total,
      tier = CASE 
        WHEN points_balance + earned_points >= 2000 THEN 'Platinum'
        WHEN points_balance + earned_points >= 1000 THEN 'Gold'
        WHEN points_balance + earned_points >= 300 THEN 'Silver'
        ELSE 'Standard'
      END
    WHERE id = NEW.customer_id;

    INSERT INTO public.loyalty_transactions (customer_id, booking_id, points_change, action_type, description)
    VALUES (NEW.customer_id, NEW.id, earned_points, 'Earned', 'ได้รับคะแนนสะสมจากการเช่ารถรหัส ' || NEW.booking_code);

    UPDATE public.vehicles
    SET status = 'Available'
    WHERE id = NEW.vehicle_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_reward_loyalty ON public.bookings;
CREATE TRIGGER trg_auto_reward_loyalty
AFTER UPDATE OR INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.fn_auto_reward_loyalty_points();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Public Read Customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Public Read Bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Public Read Staff" ON public.staff_members FOR SELECT USING (true);

CREATE POLICY "Public Modify Vehicles" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "Public Modify Bookings" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Public Modify Customers" ON public.customers FOR ALL USING (true);

-- ====================================================================
-- SUPABASE AUTH AUTO-SYNC TO CUSTOMERS TABLE
-- Automatically populates public.customers when a user registers via Email/Phone/Google
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customers (id, full_name, email, phone)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email, 'ลูกค้าสมาชิก'),
    NEW.email,
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for auto-deletion when a user is deleted in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.customers WHERE id = OLD.id::text;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- ====================================================================
-- SUPABASE STORAGE BUCKET SETUP FOR ATTACHMENTS
-- ====================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-inspections', 'vehicle-inspections', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-slips', 'payment-slips', true)
ON CONFLICT (id) DO NOTHING;
