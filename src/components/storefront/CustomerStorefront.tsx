import React, { useState } from 'react';
import {
  Car,
  Search,
  Calendar,
  Gift,
  ShieldCheck,
  User,
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  FileText,
  Building,
  Shield,
  Star,
  Tag,
  ArrowRight,
  X,
  Check,
  AlertCircle,
  Percent,
  Info,
  ShieldAlert,
  Printer,
  DollarSign,
  CreditCard,
  QrCode,
  Building2,
  Upload,
  Wallet,
  Receipt
} from 'lucide-react';
import { Vehicle, Customer, Booking, Coupon } from '../../types/erp';
import { UserProfile, UserRole } from '../../types/auth';
import {
  calculateRentalPricing,
  calculateSecurityDeposit,
  validateCouponWaterfall,
  calculateLoyaltyPoints
} from '../../utils/erpEngine';
import { FINANCE_CONFIG } from '../../config/financeConfig';
import { SignaturePad } from '../common/SignaturePad';

interface CustomerStorefrontProps {
  vehicles: Vehicle[];
  customers?: Customer[];
  user: UserProfile | null;
  onOpenLogin: (role?: UserRole) => void;
  onLogout: () => void;
  onOpenBookingModal: (vehicleId: string) => void;
  onSwitchToAdmin: () => void;
  bookings: Booking[];
  coupons: Coupon[];
  onAddBooking?: (booking: Booking) => void;
}

export const CustomerStorefront: React.FC<CustomerStorefrontProps> = ({
  vehicles,
  customers = [],
  user,
  onOpenLogin,
  onLogout,
  onOpenBookingModal,
  onSwitchToAdmin,
  bookings,
  coupons,
  onAddBooking,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_bookings' | 'my_coupons'>('catalog');

  // Customer Interactive Booking Modal State
  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-08'); // Default 7 days to trigger weekly discount rate
  const [pickupBranch, setPickupBranch] = useState<string>('สาขาสุวรรณภูมิ');
  const [dropoffBranch, setDropoffBranch] = useState<string>('สาขาสุวรรณภูมิ');
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [includeInsurance, setIncludeInsurance] = useState<boolean>(true);
  const [signatureData, setSignatureData] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);

  // Payment System States
  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'credit' | 'bank_transfer'>('promptpay');
  const [cardNumber, setCardNumber] = useState<string>('4111 2222 3333 4444');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('888');
  const [isPaymentVerified, setIsPaymentVerified] = useState<boolean>(false);
  const [uploadedSlipName, setUploadedSlipName] = useState<string>('');

  const categories = ['All', 'Sedan 1.5L', 'Compact', 'SUV', 'EV / Eco', 'Luxury', 'Van'];

  const filteredVehicles = vehicles.filter((v) => {
    const matchCategory = selectedCategory === 'All' || v.category === selectedCategory;
    const matchQuery =
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plateNumber.includes(searchQuery);
    return matchCategory && matchQuery;
  });

  const myBookings = user ? bookings.filter((b) => b.customerName.includes(user.name) || b.customerId === user.id) : [];

  // Handle start booking
  const handleStartBooking = (vehicle: Vehicle) => {
    if (!user) {
      onOpenLogin('customer');
      return;
    }
    setBookingVehicle(vehicle);
    setBookingSuccess(null);
    setAppliedCoupon(null);
    setCouponMsg(null);
    setCouponCode('');
    setPaymentMethod('promptpay');
    setCardHolder(user.name.toUpperCase());
    setIsPaymentVerified(false);
    setUploadedSlipName('');
  };

  // Duration & Dynamic Pricing
  const durationDays = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24))
  );

  const pricing = bookingVehicle
    ? calculateRentalPricing(bookingVehicle.dailyRate, durationDays)
    : calculateRentalPricing(1500, 1);

  // Customer Tier Privileges
  const matchingCustomer = customers.find((c) => c.email === user?.email || c.fullName.includes(user?.name || '')) || {
    id: user?.id || 'cust-001',
    fullName: user?.name || 'ลูกค้าสมาชิก',
    tier: (user?.tier || 'Standard') as Customer['tier'],
  };

  const deposit = bookingVehicle
    ? calculateSecurityDeposit(bookingVehicle.category, matchingCustomer.tier as any)
    : calculateSecurityDeposit('Sedan 1.5L', 'Silver');

  const dailyInsuranceRate = FINANCE_CONFIG.taxAndAddons.dailyInsurancePriceTHB;
  const vatRate = FINANCE_CONFIG.taxAndAddons.vatPercent / 100;

  // Coupon Engine Waterfall check
  let couponDiscountAmount = 0;
  if (appliedCoupon && bookingVehicle) {
    const val = validateCouponWaterfall(appliedCoupon, {
      rentDurationDays: durationDays,
      baseRentAmount: pricing.baseAmount,
      vehicleCategory: bookingVehicle.category,
      bookingDateStr: startDate,
      customer: matchingCustomer as Customer,
      selectedAddonsTotal: includeInsurance ? dailyInsuranceRate * durationDays : 0,
    });
    if (val.isValid) {
      couponDiscountAmount = val.discountAmount;
    }
  }

  const addonsTotal = includeInsurance ? dailyInsuranceRate * durationDays : 0;
  const subtotal = Math.max(0, pricing.baseAmount - couponDiscountAmount + addonsTotal);
  const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
  const grandTotal = subtotal + vatAmount;
  const pointsEarned = calculateLoyaltyPoints(subtotal, matchingCustomer.tier as any);

  const handleApplyCouponCode = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;
    const found = coupons.find((c) => c.code.toUpperCase() === code);
    if (!found) {
      setCouponMsg({ text: 'ไม่พบรหัสคูปองนี้ในระบบ', isError: true });
      setAppliedCoupon(null);
      return;
    }
    if (!bookingVehicle) return;

    const val = validateCouponWaterfall(found, {
      rentDurationDays: durationDays,
      baseRentAmount: pricing.baseAmount,
      vehicleCategory: bookingVehicle.category,
      bookingDateStr: startDate,
      customer: matchingCustomer as Customer,
      selectedAddonsTotal: includeInsurance ? 300 * durationDays : 0,
    });

    if (!val.isValid) {
      setCouponMsg({ text: val.errorMessage || 'ไม่ตรงตามเงื่อนไขคูปอง', isError: true });
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(found);
      setCouponMsg({ text: `ใช้คูปอง ${found.name} สำเร็จ! (ส่วนลด ฿${val.discountAmount.toLocaleString()})`, isError: false });
    }
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingVehicle || !user) return;

    // Strict Deposit Payment Verification
    if (paymentMethod === 'bank_transfer' && !uploadedSlipName) {
      alert('⚠️ ระบบกำหนดให้โอนชำระเงินมัดจำประกันความเสียหายและแนบสลิปหลักฐานการโอนเงินก่อนทำการยืนยันการจอง');
      return;
    }
    if (paymentMethod === 'promptpay' && !isPaymentVerified) {
      alert('⚠️ กรุณาสแกน QR Code เพื่อโอนเงินมัดจำ/ค่าเช่า แล้วกดปุ่ม "คลิกเพื่อจำลองตรวจสอบการชำระเงินอัตโนมัติ" ก่อนยืนยัน');
      return;
    }
    if (paymentMethod === 'credit' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim())) {
      alert('⚠️ กรุณากรอกข้อมูลบัตรเครดิต/เดบิตให้ครบถ้วนเพื่อชำระค่ามัดจำและค่าเช่า');
      return;
    }

    const newBk: Booking = {
      id: `bk-${Date.now().toString().slice(-5)}`,
      bookingCode: `DRV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: matchingCustomer.id || user.id,
      customerName: user.name,
      vehicleId: bookingVehicle.id,
      vehiclePlate: bookingVehicle.plateNumber,
      vehicleModel: `${bookingVehicle.brand} ${bookingVehicle.model}`,
      vehicleCategory: bookingVehicle.category,
      startDate,
      endDate,
      pickupBranch,
      dropoffBranch,
      status: 'Confirmed',
      dailyRate: pricing.effectiveDailyRate,
      totalDays: durationDays,
      baseAmount: pricing.baseAmount,
      appliedCouponCode: appliedCoupon?.code,
      discountAmount: couponDiscountAmount,
      addons: includeInsurance ? [{ id: 'ins-1', name: 'ประกันภัยชั้น 1 ไม่ซ่อมคู่กรณี', dailyPrice: 300, selected: true }] : [],
      addonsAmount: addonsTotal,
      vatAmount,
      depositAmount: deposit.effectiveDeposit,
      grandTotal,
      pointsEarned,
      signatureDataUrl: signatureData,
      contractSignedAt: new Date().toISOString(),
      createdDate: new Date().toISOString().split('T')[0],
    };

    if (onAddBooking) {
      onAddBooking(newBk);
    }
    setBookingSuccess(newBk);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      
      {/* Top Navigation Bar for Storefront */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('catalog')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">DriveCar Store</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                  หน้าร้านบริการเช่ารถ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">จองรถออนไลน์ สะสมแต้ม และรับโปรโมชันพิเศษ</p>
            </div>
          </div>

          {/* Navigation Items & User Profile */}
          <div className="flex items-center space-x-3">
            
            {/* Owner & Staff Quick Switch Button */}
            <button
              onClick={onSwitchToAdmin}
              className="hidden sm:flex items-center space-x-1.5 bg-slate-800 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold px-3 py-2 rounded-xl transition border border-emerald-500/30 cursor-pointer"
              title="สำหรับเจ้าของร้านและผู้ดูแลระบบ"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>เข้าสู่ระบบเจ้าของร้าน</span>
            </button>

            {/* Auth Buttons or User Menu */}
            {user ? (
              <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-1.5 pl-3">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-amber-400 font-medium">
                    {user.tier || 'Member'} • แต้มสะสม: {user.points || 0} Pts
                  </p>
                </div>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-indigo-400" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    {user.name[0]}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-xl transition cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenLogin('customer')}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition border border-slate-700 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>เข้าสู่ระบบ</span>
                </button>

                <button
                  onClick={() => onOpenLogin('customer')}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>สมัครสมาชิก</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-8 px-4 sm:px-6 relative overflow-hidden border-b border-indigo-900/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-indigo-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>บริการเช่ารถยนต์ขับเองและพร้อมคนขับ สาขาสุวรรณภูมิ HQ</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white mb-2">
              เลือกรถที่ใช่ เดินทางราบรื่น <span className="text-indigo-400">จองง่ายใน 1 นาที</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              รถใหม่สะอาด ตรวจเช็กระบบความปลอดภัยก่อนส่งมอบ พร้อมประกันภัยชั้น 1 สะสมคะแนนแลกส่วนลดได้ทุกครั้งที่ใช้บริการ
            </p>
          </div>

          {/* Quick Stats or Loyalty Summary */}
          {user && (
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl w-full md:w-72 shrink-0">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 mb-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>สิทธิพิเศษสมาชิกของคุณ</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-white font-bold">{user.name}</p>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>ระดับสมาชิก:</span>
                  <span className="font-bold text-amber-400">{user.tier || 'Silver'}</span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>คะแนนสะสมคงเหลือ:</span>
                  <span className="font-bold text-emerald-400">{user.points || 0} แต้ม</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Navigation Tabs (Storefront vs My Bookings) */}
        <div className="flex items-center space-x-2 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
              activeTab === 'catalog'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>เลือกรถยนต์ทั้งหมด ({vehicles.length} คัน)</span>
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('my_bookings')}
              className={`flex items-center space-x-2 py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
                activeTab === 'my_bookings'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>ประวัติการจองและสัญญาเช่าของฉัน ({myBookings.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('my_coupons')}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
              activeTab === 'my_coupons'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>คูปองส่วนลดพิเศษ ({coupons.length})</span>
          </button>
        </div>

        {/* CATALOG TAB */}
        {activeTab === 'catalog' && (
          <div>
            {/* Search & Category Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Category Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'All' ? 'ทั้งหมด' : cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหายี่ห้อ รุ่น หรือทะเบียน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

            </div>

            {/* Vehicle Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    {/* Vehicle Image */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'}
                        alt={vehicle.model}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        {vehicle.category}
                      </span>
                      <span className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                        vehicle.status === 'Available'
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'bg-amber-500 text-white border-amber-400'
                      }`}>
                        {vehicle.status === 'Available' ? 'พร้อมให้เช่า' : 'เช่าอยู่'}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <p className="text-xs text-slate-500">
                            ปี {vehicle.year} • สี{vehicle.color} • ทะเบียน {vehicle.plateNumber} ({vehicle.province})
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl text-slate-600 my-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block">เชื้อเพลิง:</span>
                          <span className="font-semibold text-slate-800">{vehicle.fuelType}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">เลขไมล์ปัจจุบัน:</span>
                          <span className="font-semibold text-slate-800">{vehicle.currentOdometer.toLocaleString()} กม.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action Footer */}
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">อัตราค่าเช่าเริ่มต้น</span>
                      <span className="text-lg font-extrabold text-indigo-600">
                        ฿{vehicle.dailyRate.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500"> / วัน</span>
                    </div>

                    <button
                      onClick={() => handleStartBooking(vehicle)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-indigo-600/20"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>จองคันนี้</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* MY BOOKINGS TAB */}
        {activeTab === 'my_bookings' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>ประวัติและสัญญาเช่าของคุณ ({user?.name})</span>
            </h2>

            {myBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">ยังไม่มีรายการจองเช่ารถในขณะนี้</p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="mt-3 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  เลือกรถที่ต้องการเช่า
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map((b) => (
                  <div key={b.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                          {b.bookingCode}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{b.vehicleModel} ({b.vehiclePlate})</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        ระยะเวลา: {b.startDate} ถึง {b.endDate} ({b.totalDays} วัน)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        สถานที่รับรถ: {b.pickupBranch} | คืนรถ: {b.dropoffBranch}
                      </p>
                      <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>เงินมัดจำประกันความเสียหาย: ฿{b.depositAmount.toLocaleString()} (คืนเงินเมื่อส่งมอบรถ)</span>
                      </div>
                    </div>

                    <div className="text-right flex items-center space-x-4">
                      <div>
                        <p className="text-xs text-slate-400">ราคารวมทั้งสิ้น</p>
                        <p className="text-base font-extrabold text-indigo-600">฿{b.grandTotal.toLocaleString()}</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY COUPONS TAB */}
        {activeTab === 'my_coupons' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Tag className="w-5 h-5 text-amber-500" />
              <span>คูปองและโปรโมชันส่วนลดในระบบ</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="border border-dashed border-amber-300 bg-amber-50/50 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm font-extrabold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg">
                        {coupon.code}
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        {coupon.type === 'Percentage' ? `ส่วนลด ${coupon.discountValue}%` : `ส่วนลด ฿${coupon.discountValue}`}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">{coupon.name}</h4>
                    <p className="text-[11px] text-slate-600 mt-1">{coupon.description}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>ขั้นต่ำ ฿{coupon.minSpendTHB.toLocaleString()}</span>
                    <button
                      onClick={() => {
                        setActiveTab('catalog');
                        setCouponCode(coupon.code);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] cursor-pointer"
                    >
                      คัดลอกรหัสนี้
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* CUSTOMER STOREFRONT BOOKING MODAL */}
      {bookingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full my-8 overflow-hidden relative transition-all animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center space-x-3 z-10">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    จองเช่า {bookingVehicle.brand} {bookingVehicle.model} ({bookingVehicle.year})
                  </h3>
                  <p className="text-xs text-slate-300">
                    ทะเบียน {bookingVehicle.plateNumber} ({bookingVehicle.province}) • {bookingVehicle.category}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBookingVehicle(null)}
                className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {bookingSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">จองเช่ารถออนไลน์สำเร็จ!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  หมายเลขอ้างอิงการจอง: <span className="font-mono font-bold text-indigo-600">{bookingSuccess.bookingCode}</span><br />
                  ระบบบันทึกสัญญาเช่าและเงินมัดจำเรียบร้อยแล้ว
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">ยอดชำระค่าเช่ารวม (รวม VAT):</span>
                    <span className="font-bold text-slate-900">฿{bookingSuccess.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">เงินมัดจำประกันความเสียหาย (ได้รับคืนเมื่อคืนรถ):</span>
                    <span className="font-bold text-emerald-600">฿{bookingSuccess.depositAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">แต้มสะสมที่จะได้รับ:</span>
                    <span className="font-bold text-amber-600">+{bookingSuccess.pointsEarned} แต้ม</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      setBookingVehicle(null);
                      setActiveTab('my_bookings');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md"
                  >
                    ดูประวัติการจองและสัญญาเช่า
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                
                {/* 1. Rental Dates & Rate Tiers (Daily / Weekly / Monthly) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>กำหนดวันและระยะเวลาการเช่า</span>
                    </div>

                    {/* Rate Tier Badge */}
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      pricing.rateTier === 'Monthly'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : pricing.rateTier === 'Weekly'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                      {pricing.tierLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">วันรับรถ (Start Date)</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">วันคืนรถ (End Date)</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Pricing Rate Notice */}
                  <div className="text-xs bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="text-slate-500">ระยะเวลาเช่ารวม: </span>
                      <span className="font-bold text-slate-900">{durationDays} วัน</span>
                      {pricing.discountPercent > 0 && (
                        <span className="ml-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          ประหยัดไป ฿{pricing.tierSavings.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">เฉลี่ยวันละ</span>
                      <span className="font-extrabold text-indigo-600 text-sm">฿{pricing.effectiveDailyRate.toLocaleString()}</span>
                      {pricing.discountPercent > 0 && (
                        <span className="line-through text-[10px] text-slate-400 ml-1">฿{pricing.standardDailyRate.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Security Deposit Breakdown Notice (เงินมัดจำประกันความเสียหาย) */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>เงินมัดจำประกันความเสียหาย (Refundable Security Deposit)</span>
                    </div>
                    {deposit.tierDiscountPercent > 0 && (
                      <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                        สิทธิ์สมาชิก {matchingCustomer.tier}: ส่วนลดมัดจำ {deposit.tierDiscountPercent}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-emerald-200/80 text-xs">
                    <div>
                      <span className="text-slate-600 block">อัตรามัดจำสำหรับกลุ่มรถ {deposit.category}</span>
                      <span className="text-[10px] text-slate-500">{deposit.terms}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-emerald-700">
                        {deposit.isWaived ? 'ฟรีมัดจำ (0 THB)' : `฿${deposit.effectiveDeposit.toLocaleString()}`}
                      </span>
                      {deposit.tierDiscountPercent > 0 && !deposit.isWaived && (
                        <span className="line-through text-[10px] text-slate-400 block">฿{deposit.standardDeposit.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Coupon Code Input & Coupon Selection */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                      <Tag className="w-4 h-4 text-amber-600" />
                      <span>คูปองและรหัสส่วนลดพิเศษ (Coupon Engine)</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="ป้อนรหัสคูปอง เช่น DRIVE15"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCouponCode()}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      ใช้คูปอง
                    </button>
                  </div>

                  {couponMsg && (
                    <div className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 ${
                      couponMsg.isError ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {couponMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                      <span>{couponMsg.text}</span>
                    </div>
                  )}

                  {/* Available Coupon Quick Selection */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-1.5">คูปองที่ใช้ได้ในระบบ:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {coupons.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCouponCode(c.code);
                            handleApplyCouponCode(c.code);
                          }}
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            appliedCoupon?.code === c.code
                              ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                              : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          {c.code} (-{c.type === 'Percentage' ? `${c.discountValue}%` : `฿${c.discountValue}`})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Addon Selection */}
                <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={includeInsurance}
                        onChange={(e) => setIncludeInsurance(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">ซื้อประกันภัยชั้น 1 ไม่ซ่อมคู่กรณีเพิ่มเติม</span>
                        <span className="text-[10px] text-slate-500 block">คุ้มครองอุบัติเหตุและรอยขีดข่วนตลอดระยะเวลาเช่า</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-600">+฿{(300 * durationDays).toLocaleString()}</span>
                  </label>
                </div>

                {/* 5. Payment System During Rental (ระบบชำระเงินตอนเช่า) */}
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900">
                      <Wallet className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>โอนชำระเงินมัดจำและค่าเช่ารถ (Deposit & Rental Payment)</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-flex items-center w-fit">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      ต้องโอนมัดจำ {deposit.isWaived ? '0 THB' : `฿${deposit.effectiveDeposit.toLocaleString()}`} ก่อนจอง
                    </span>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('promptpay')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                        paymentMethod === 'promptpay'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <QrCode className="w-5 h-5" />
                      <span className="text-[11px] font-bold">พร้อมเพย์ QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                        paymentMethod === 'credit'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="text-[11px] font-bold">บัตรเครดิต / เดบิต</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                        paymentMethod === 'bank_transfer'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                      <span className="text-[11px] font-bold">โอนเงิน / แนบสลิป</span>
                    </button>
                  </div>

                  {/* Payment Details Container */}
                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 space-y-3">
                    {paymentMethod === 'promptpay' && (
                      <div className="text-center space-y-2">
                        <p className="text-[11px] text-slate-600 font-semibold">
                          สแกน QR Code ด้วยแอปธนาคารใดก็ได้ ชำระยอด ฿{(grandTotal + deposit.effectiveDeposit).toLocaleString()}
                        </p>
                        <div className="w-36 h-36 bg-slate-100 border border-slate-200 rounded-xl p-2 mx-auto flex items-center justify-center relative">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PROMPTPAY-DRIVEERP-${grandTotal + deposit.effectiveDeposit}`}
                            alt="PromptPay QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ชื่อบัญชี: <span className="font-bold text-slate-800">{FINANCE_CONFIG.paymentMethods.promptPay.accountName}</span> | พร้อมเพย์: <span className="font-mono font-bold text-indigo-600">{FINANCE_CONFIG.paymentMethods.promptPay.promptPayNumber}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPaymentVerified(true)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                            isPaymentVerified
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isPaymentVerified ? 'ชำระเงินสำเร็จ (ตรวจสอบแล้ว)' : 'คลิกเพื่อจำลองตรวจสอบการชำระเงินอัตโนมัติ'}</span>
                        </button>
                      </div>
                    )}

                    {paymentMethod === 'credit' && (
                      <div className="space-y-2.5 text-xs">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-1">หมายเลขบัตรเครดิต</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4111 2222 3333 4444"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-1">วันหมดอายุ (MM/YY)</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="12/28"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-1">รหัส CVC / CVV</label>
                            <input
                              type="text"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              placeholder="888"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-1">ชื่อบนบัตร</label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="KITTISAK RENT"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'bank_transfer' && (
                      <div className="space-y-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <p className="font-bold text-slate-800">{FINANCE_CONFIG.paymentMethods.bankTransfer.bankName}</p>
                          <p className="font-mono font-bold text-indigo-600 text-sm">{FINANCE_CONFIG.paymentMethods.bankTransfer.accountNumber}</p>
                          <p className="text-[10px] text-slate-500">
                            ชื่อบัญชี: {FINANCE_CONFIG.paymentMethods.bankTransfer.accountName} ({FINANCE_CONFIG.paymentMethods.bankTransfer.branch})
                          </p>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-1">แนบสลิปหลักฐานการโอน</label>
                          <label className="flex items-center justify-center p-3 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition">
                            <Upload className="w-4 h-4 text-indigo-600 mr-2" />
                            <span className="text-xs text-indigo-700 font-bold">
                              {uploadedSlipName ? `แนบสลิปแล้ว: ${uploadedSlipName}` : 'คลิกเพื่อเลือกไฟล์สลิปชำระเงิน'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setUploadedSlipName(e.target.files[0].name);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Summary Pricing Matrix & Loyalty Points Rate Notice */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>ค่าเช่าฐาน ({durationDays} วัน):</span>
                    <span className="font-mono">฿{pricing.baseAmount.toLocaleString()}</span>
                  </div>

                  {couponDiscountAmount > 0 && (
                    <div className="flex justify-between text-amber-400 font-semibold">
                      <span>ส่วนลดคูปอง ({appliedCoupon?.code}):</span>
                      <span className="font-mono">-฿{couponDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {includeInsurance && (
                    <div className="flex justify-between text-slate-300">
                      <span>ค่าประกันภัยชั้น 1:</span>
                      <span className="font-mono">+฿{addonsTotal.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                    <span>ภาษีมูลค่าเพิ่ม VAT (7%):</span>
                    <span className="font-mono">฿{vatAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                    <span>เงินมัดจำประกันความเสียหาย (ได้คืนเมื่อคืนรถ):</span>
                    <span className="font-mono">+฿{deposit.effectiveDeposit.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-extrabold text-white pt-2 border-t border-slate-700">
                    <span>ยอดชำระสุทธิ (Grand Total):</span>
                    <span className="text-lg text-emerald-400 font-mono">฿{(grandTotal + deposit.effectiveDeposit).toLocaleString()}</span>
                  </div>

                  {/* Loyalty Points Rate Banner */}
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-amber-400">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>แต้มสะสมที่จะได้รับ (เรท 100 บาท = 1 แต้ม):</span>
                    </span>
                    <span className="font-bold font-mono text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md">
                      +{pointsEarned} แต้ม
                    </span>
                  </div>
                </div>

                {/* 7. Digital Signature Pad */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    ลงลายมือชื่อผู้เช่าเพื่อยืนยันสัญญา (Digital Contract Signature)
                  </label>
                  <SignaturePad onSave={(url) => setSignatureData(url)} />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-2xl transition cursor-pointer shadow-lg shadow-indigo-600/30 text-xs flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>ยืนยันการชำระเงิน จองเช่ารถ และออกสัญญา</span>
                </button>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
