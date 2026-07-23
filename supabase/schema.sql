-- ====================================================================
-- DriveERP - Supabase PostgreSQL Schema & Initial Seed Data (Clean Version)
-- คัดลอกข้อความ SQL ทั้งหมดด้านล่างนี้ ไปวางใน Supabase SQL Editor แล้วกด 'Run'
-- ====================================================================

-- 0. Clean old tables if exist to prevent column missing errors
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.maintenance_work_orders CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;

-- 1. Create Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Vehicles Table (ตารางข้อมูลฟลีตรถยนต์)
CREATE TABLE public.vehicles (
    id VARCHAR(50) PRIMARY KEY,
    plate_number VARCHAR(30) NOT NULL UNIQUE,
    province VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    vin VARCHAR(100) NOT NULL UNIQUE,
    engine_number VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Available',
    current_odometer INT NOT NULL DEFAULT 0,
    next_service_km INT NOT NULL DEFAULT 10000,
    daily_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    fuel_type VARCHAR(50) NOT NULL DEFAULT 'Gasohol 91/95',
    fuel_level_percent INT NOT NULL DEFAULT 100,
    image_url TEXT,
    purchase_price NUMERIC(12,2) DEFAULT 0,
    salvage_value NUMERIC(12,2) DEFAULT 0,
    useful_life_years INT DEFAULT 5,
    acquisition_date DATE DEFAULT CURRENT_DATE,
    documents JSONB DEFAULT '{}'::jsonb,
    gps_location JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Customers Table (ตารางข้อมูลผู้เช่า & ระบบ Loyalty Points)
CREATE TABLE public.customers (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    national_id VARCHAR(30) NOT NULL UNIQUE,
    driver_license_no VARCHAR(50) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(100),
    line_id VARCHAR(50),
    tier VARCHAR(20) NOT NULL DEFAULT 'Silver',
    points_balance INT NOT NULL DEFAULT 0,
    total_rentals_count INT NOT NULL DEFAULT 0,
    total_spent_thb NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    blacklist_reason TEXT,
    credit_limit_thb NUMERIC(10,2) DEFAULT 0,
    registered_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Coupons Table (ตารางคูปองส่วนลด)
CREATE TABLE public.coupons (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL,
    discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_duration_days INT DEFAULT 1,
    min_spend_thb NUMERIC(10,2) DEFAULT 0,
    blackout_dates JSONB DEFAULT '[]'::jsonb,
    applicable_categories JSONB DEFAULT '[]'::jsonb,
    usage_limit_global INT DEFAULT 100,
    used_count_global INT DEFAULT 0,
    usage_limit_per_user INT DEFAULT 1,
    allow_stacking BOOLEAN DEFAULT FALSE,
    addon_type VARCHAR(50),
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bookings Table (ตารางสัญญาเช่า & สัญญาการจอง)
CREATE TABLE public.bookings (
    id VARCHAR(50) PRIMARY KEY,
    booking_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(50) REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    vehicle_id VARCHAR(50) REFERENCES public.vehicles(id) ON DELETE SET NULL,
    vehicle_plate VARCHAR(30) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_category VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pickup_branch VARCHAR(100) DEFAULT 'สาขาสุวรรณภูมิ',
    dropoff_branch VARCHAR(100) DEFAULT 'สาขาสุวรรณภูมิ',
    status VARCHAR(30) NOT NULL DEFAULT 'Confirmed',
    daily_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_days INT NOT NULL DEFAULT 1,
    base_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    applied_coupon_code VARCHAR(30),
    discount_amount NUMERIC(10,2) DEFAULT 0,
    addons JSONB DEFAULT '[]'::jsonb,
    addons_amount NUMERIC(10,2) DEFAULT 0,
    vat_amount NUMERIC(10,2) DEFAULT 0,
    deposit_amount NUMERIC(10,2) DEFAULT 0,
    grand_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    points_earned INT DEFAULT 0,
    created_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Maintenance Work Orders Table (ตารางซ่อมบำรุง)
CREATE TABLE public.maintenance_work_orders (
    id VARCHAR(50) PRIMARY KEY,
    work_order_no VARCHAR(50) NOT NULL UNIQUE,
    vehicle_id VARCHAR(50) REFERENCES public.vehicles(id) ON DELETE CASCADE,
    vehicle_plate VARCHAR(30) NOT NULL,
    type VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    garage_name VARCHAR(150) NOT NULL,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Scheduled',
    parts_cost NUMERIC(10,2) DEFAULT 0,
    labor_cost NUMERIC(10,2) DEFAULT 0,
    total_cost NUMERIC(10,2) DEFAULT 0,
    odometer_at_service INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Journal Entries Table (ตารางบันทึกบัญชี IFRS 15)
CREATE TABLE public.journal_entries (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    voucher_no VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    debit_account VARCHAR(150) NOT NULL,
    debit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    credit_account VARCHAR(150) NOT NULL,
    credit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    booking_ref_id VARCHAR(50),
    vehicle_ref_id VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- Enable Row Level Security (RLS) & Policies
-- ====================================================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to vehicles" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "Allow full access to customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow full access to coupons" ON public.coupons FOR ALL USING (true);
CREATE POLICY "Allow full access to bookings" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Allow full access to maintenance_work_orders" ON public.maintenance_work_orders FOR ALL USING (true);
CREATE POLICY "Allow full access to journal_entries" ON public.journal_entries FOR ALL USING (true);

-- ====================================================================
-- SEED DATA (ข้อมูลเริ่มต้น)
-- ====================================================================

-- Insert Vehicles
INSERT INTO public.vehicles (id, plate_number, province, brand, model, year, color, category, vin, engine_number, status, current_odometer, next_service_km, daily_rate, fuel_type, fuel_level_percent, image_url, purchase_price, salvage_value, useful_life_years, acquisition_date, documents, gps_location)
VALUES
('veh-001', 'กข-9821', 'กรุงเทพมหานคร', 'Toyota', 'Yaris Ativ 1.2 Premium', 2024, 'Platinum White Pearl', 'Sedan 1.5L', 'MR0EX382100984121', '2NR-VE-98124', 'Available', 14250, 20000, 1200, 'Gasohol 91/95', 100, 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=600&q=80', 689000, 150000, 5, '2024-01-15', '{"taxExpiryDate": "2026-11-15", "insuranceExpiryDate": "2026-11-15", "actExpiryDate": "2026-11-15", "taxWarningDays": 117, "insuranceWarningDays": 117}', '{"lat": 13.7563, "lng": 100.5018, "locationName": "สาขาสุวรรณภูมิ (HQ Main Hub)", "lastUpdated": "10 นาทีที่แล้ว"}'),
('veh-002', '3ขก-4412', 'กรุงเทพมหานคร', 'Honda', 'Civic EL+ Turbo', 2023, 'Meteoroid Gray Metallic', 'Sedan 1.5L', 'MRHFC188200192841', 'L15BG-77412', 'Rented', 28400, 30000, 2200, 'Gasohol 91/95', 85, 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=600&q=80', 1009000, 250000, 5, '2023-05-10', '{"taxExpiryDate": "2026-08-10", "insuranceExpiryDate": "2026-08-10", "actExpiryDate": "2026-08-10", "taxWarningDays": 20, "insuranceWarningDays": 20}', '{"lat": 13.7367, "lng": 100.5231, "locationName": "แยกอโศก-สุขุมวิท", "lastUpdated": "2 นาทีที่แล้ว"}'),
('veh-003', 'ขก-7789', 'เชียงใหม่', 'Toyota', 'Fortuner 2.8 Legender 4WD', 2024, 'Attitude Black Mica', 'SUV', 'MROZB582100412891', '1GD-FTV-8812', 'Reserved', 18900, 20000, 3500, 'Diesel', 100, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80', 1879000, 400000, 5, '2024-02-28', '{"taxExpiryDate": "2027-02-28", "insuranceExpiryDate": "2027-02-28", "actExpiryDate": "2027-02-28", "taxWarningDays": 220, "insuranceWarningDays": 220}', '{"lat": 13.6900, "lng": 100.7500, "locationName": "อาคารผู้โดยสาร สนามบินสุวรรณภูมิ", "lastUpdated": "15 นาทีที่แล้ว"}'),
('veh-004', '1นข-8800', 'กรุงเทพมหานคร', 'BYD', 'Atto 3 Extended Range', 2023, 'Ski White', 'EV / Eco', 'LC0BYD38210088102', 'TZ200XSQ-112', 'Maintenance', 39800, 40000, 1800, 'Electric (EV)', 45, 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80', 1199000, 300000, 5, '2023-08-01', '{"taxExpiryDate": "2026-08-01", "insuranceExpiryDate": "2026-08-01", "actExpiryDate": "2026-08-01", "taxWarningDays": 11, "insuranceWarningDays": 11}', '{"lat": 13.8000, "lng": 100.5500, "locationName": "ศูนย์บริการ BYD วิภาวดี", "lastUpdated": "1 ชั่วโมงที่แล้ว"}'),
('veh-005', 'ฮธ-9911', 'กรุงเทพมหานคร', 'Toyota', 'Commuter 2.8 Automatic', 2022, 'Silver Metallic', 'Van', 'MROGD982100331002', '1GD-881203', 'Available', 52100, 60000, 2800, 'Diesel', 100, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80', 1399000, 350000, 5, '2022-06-15', '{"taxExpiryDate": "2026-12-30", "insuranceExpiryDate": "2026-12-30", "actExpiryDate": "2026-12-30", "taxWarningDays": 162, "insuranceWarningDays": 162}', '{"lat": 13.7563, "lng": 100.5018, "locationName": "สาขาดอนเมือง", "lastUpdated": "30 นาทีที่แล้ว"}'),
('veh-006', '4กษ-1199', 'กรุงเทพมหานคร', 'BMW', '530e M Sport (G30)', 2023, 'Bernina Grey', 'Luxury', 'WBA530E8210041120', 'B48B20-9901', 'Available', 11200, 20000, 5900, 'Gasoline 95', 100, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=80', 3600000, 1000000, 5, '2023-01-10', '{"taxExpiryDate": "2027-01-10", "insuranceExpiryDate": "2027-01-10", "actExpiryDate": "2027-01-10", "taxWarningDays": 173, "insuranceWarningDays": 173}', '{"lat": 13.7456, "lng": 100.5342, "locationName": "โรงแรม Siam Kempinski", "lastUpdated": "5 นาทีที่แล้ว"}');

-- Insert Customers
INSERT INTO public.customers (id, full_name, national_id, driver_license_no, phone, email, line_id, tier, points_balance, total_rentals_count, total_spent_thb, is_blacklisted, blacklist_reason, credit_limit_thb, registered_date)
VALUES
('cust-101', 'คุณสมชาย วงศ์สวัสดิ์', '1-1002-00341-99-1', 'DL-55419821', '081-892-3341', 'somchai.w@email.com', '@somchai_drive', 'Platinum', 1250, 14, 148500, FALSE, NULL, 50000, '2023-02-10'),
('cust-102', 'คุณนภาวรรณ จิตต์กุศล', '3-5001-00912-44-2', 'DL-88210341', '089-441-2099', 'napawan.j@email.com', 'napa_car', 'Gold', 480, 6, 42000, FALSE, NULL, 20000, '2023-08-15'),
('cust-103', 'คุณกิตติศักดิ์ บุญนำ', '1-2099-00124-11-8', 'DL-11029841', '092-110-8844', 'kittisak.b@email.com', NULL, 'Silver', 120, 2, 12000, FALSE, NULL, 10000, '2024-01-20'),
('cust-104', 'คุณประเสริฐ ไร้สัจจะ (ติด Blacklist)', '5-9988-00112-22-9', 'DL-99120033', '080-000-1122', 'prasert.black@email.com', NULL, 'Silver', 0, 1, 3500, TRUE, 'คืนรถช้ากว่ากำหนด 5 วัน ไม่ชำระค่าปรับ และมีประวัติค้างชำระบัตรเครดิต', 0, '2023-11-01');

-- Insert Coupons
INSERT INTO public.coupons (id, code, name, description, type, discount_value, min_duration_days, min_spend_thb, blackout_dates, applicable_categories, usage_limit_global, used_count_global, usage_limit_per_user, allow_stacking, valid_from, valid_to)
VALUES
('coup-001', 'DRIVE15', 'ส่วนลด 15% ต้อนรับฤดูท่องเที่ยว', 'รับส่วนลด 15% จากราคาเช่าฐาน เมื่อเช่ารถขั้นต่ำ 2 วันขึ้นไป', 'Percentage', 15, 2, 2000, '["2026-12-30", "2026-12-31", "2027-01-01"]', '["Sedan 1.5L", "Compact", "SUV", "EV / Eco"]', 100, 38, 1, FALSE, '2026-01-01', '2026-12-31'),
('coup-002', 'SAVE500', 'ลดทันที 500 บาท สำหรับ SUV & Van', 'รับส่วนลดมูลค่าคงที่ 500 บาท เมื่อเช่ารถ SUV หรือ Van ยอดขั้นต่ำ 3,000 บาท', 'FixedAmount', 500, 1, 3000, '[]', '["SUV", "Van", "Luxury"]', 50, 14, 2, FALSE, '2026-01-01', '2026-12-31'),
('coup-003', 'PAY2GET3', 'เช่า 2 วัน แถมฟรี 1 วัน (Pay 2 Get 3)', 'โปรโมชันพิเศษ เช่ารถ 3 วัน จ่ายเพียง 2 วัน', 'FreeDays', 1, 3, 2400, '["2026-12-30", "2026-12-31"]', '["Sedan 1.5L", "Compact"]', 200, 85, 1, FALSE, '2026-05-01', '2026-10-31');

-- Insert Bookings
INSERT INTO public.bookings (id, booking_code, customer_id, customer_name, vehicle_id, vehicle_plate, vehicle_model, vehicle_category, start_date, end_date, pickup_branch, dropoff_branch, status, daily_rate, total_days, base_amount, applied_coupon_code, discount_amount, addons, addons_amount, vat_amount, deposit_amount, grand_total, points_earned, created_date)
VALUES
('bk-2026-001', 'DRV-202607-001', 'cust-101', 'คุณสมชาย วงศ์สวัสดิ์', 'veh-002', '3ขก-4412', 'Honda Civic EL+ Turbo', 'Sedan 1.5L', '2026-07-20', '2026-07-23', 'สาขาสุวรรณภูมิ', 'สาขาสุวรรณภูมิ', 'Active', 2200, 3, 6600, 'DRIVE15', 990, '[{"id": "ad-1", "name": "ประกันภัย No-Deductible", "dailyPrice": 300, "selected": true}]', 900, 455.70, 0, 6965.70, 139, '2026-07-18'),
('bk-2026-002', 'DRV-202607-002', 'cust-102', 'คุณนภาวรรณ จิตต์กุศล', 'veh-003', 'ขก-7789', 'Toyota Fortuner 2.8 Legender 4WD', 'SUV', '2026-07-25', '2026-07-28', 'สาขาเชียงใหม่', 'สาขาเชียงใหม่', 'Confirmed', 3500, 3, 10500, 'SAVE500', 500, '[{"id": "ad-1", "name": "ประกันภัย No-Deductible", "dailyPrice": 300, "selected": true}]', 900, 763, 4000, 11663, 163, '2026-07-19');

-- Insert Maintenance Work Orders
INSERT INTO public.maintenance_work_orders (id, work_order_no, vehicle_id, vehicle_plate, type, description, garage_name, scheduled_date, status, parts_cost, labor_cost, total_cost, odometer_at_service, notes)
VALUES
('wo-101', 'WO-2026-0045', 'veh-004', '1นข-8800', 'Preventive', 'เช็กระยะ 40,000 กม., สลับยาง, ถ่วงล้อ, ตรวจสอบระบบแบตเตอรี่ high-voltage', 'ศูนย์บริการ BYD วิภาวดี', '2026-07-21', 'In-Progress', 3500, 1200, 4700, 39800, 'รอส่งมอบรถกลับสาขาช่วงเย็นวันนี้'),
('wo-102', 'WO-2026-0038', 'veh-005', 'ฮธ-9911', 'Preventive', 'เปลี่ยนน้ำมันเครื่องสังเคราะห์แท้ Toyota 1GD, เปลี่ยนไส้กรองอากาศ', 'Toyota Buzz สาขาดอนเมือง', '2026-06-10', 'Completed', 2800, 850, 3650, 50000, 'เปลี่ยนถ่ายตามรอบเรียบร้อย');

-- Insert Journal Entries
INSERT INTO public.journal_entries (id, date, voucher_no, description, debit_account, debit_amount, credit_account, credit_amount, booking_ref_id, vehicle_ref_id, notes)
VALUES
('je-001', '2026-07-20', 'JV-202607-001', 'รับชำระค่าเช่ารถ พร้อมตั้ง Deferred Revenue สำหรับคะแนนสะสม (IFRS 15) - สัญญา DRV-202607-001', '1110 - เงินสด/เงินฝากธนาคาร (Cash & Bank)', 6965.70, '4110 - รายได้ค่าเช่ารถยนต์ (Rental Revenue)', 6371.00, 'bk-2026-001', 'veh-002', 'บันทึกเป็น 2120-Deferred Revenue (Point Liability): 139.00 บาท'),
('je-002', '2026-07-01', 'JV-202607-002', 'บันทึกค่าเสื่อมราคารถยนต์ประจำเดือน (Straight-Line Depreciation)', '5210 - ค่าเสื่อมราคา - ยานพาหนะ (Depreciation Expense)', 112500.00, '1410 - ค่าเสื่อมราคาสะสม - ยานพาหนะ (Accumulated Depreciation)', 112500.00, NULL, NULL, 'คำนวณตามอายุการใช้งาน 5 ปี');
