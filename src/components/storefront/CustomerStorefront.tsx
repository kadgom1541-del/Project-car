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
  Receipt,
  Copy,
  Award,
  Crown,
  Zap,
  TrendingUp,
  Layers
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
import { getVehicleActiveRentalInfo, checkBookingConflict } from '../../utils/bookingConflictChecker';
import { CancelBookingModal } from '../booking/CancelBookingModal';
import { CustomerCancelModal } from './CustomerCancelModal';
import { RefundSlipModal } from '../common/RefundSlipModal';
import { XCircle, RotateCcw } from 'lucide-react';

function getPromptPayQrUrl(mobile: string, amount: number) {
  const crc16 = (data: string) => {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
        else crc = (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const cleanMobile = mobile.replace(/[^0-9]/g, '');
  const formattedMobile = '0066' + cleanMobile.replace(/^0/, '');
  const targetLength = ('00' + formattedMobile.length).slice(-2);
  const targetField = '01' + targetLength + formattedMobile;
  const ppPayload = '0016A000000677010111' + targetField;
  
  let payload = '000201010211' + '29' + ('00' + ppPayload.length).slice(-2) + ppPayload + '5802TH5303764';
  if (amount && amount > 0) {
    const amtStr = Number(amount).toFixed(2);
    payload += '54' + ('00' + amtStr.length).slice(-2) + amtStr;
  }
  payload += '6304';
  payload += crc16(payload);
  
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
}

import { CouponType } from '../../types/erp';

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  requiredPoints: number;
  category: 'Discount' | 'Addon' | 'Gift';
  badgeText: string;
  iconBg: string;
  couponTemplate?: {
    type: CouponType;
    discountValue: number;
    minSpendTHB: number;
    minDurationDays: number;
    addonType?: Coupon['addonType'];
  };
}

export const REWARD_CATALOG: RewardItem[] = [
  {
    id: 'rw-disc-100-75pts',
    title: 'คูปองส่วนลดค่าเช่า 100 บาท',
    description: 'แลกส่วนลดค่าเช่ารถ 100 บาท ใช้เป็นส่วนลดตรงในการจองรถทุกคัน',
    requiredPoints: 75,
    category: 'Discount',
    badgeText: 'ส่วนลด ฿100 (75 Pts)',
    iconBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    couponTemplate: {
      type: 'FixedAmount',
      discountValue: 100,
      minSpendTHB: 300,
      minDurationDays: 1,
    },
  },
  {
    id: 'rw-cash-100-100pts',
    title: 'คูปองแทนเงินสด 100 บาท',
    description: 'คูปองเงินสด 100 บาท ใช้แทนเงินสดในการเช่ารถได้ทันที ไม่มีขั้นต่ำ',
    requiredPoints: 100,
    category: 'Discount',
    badgeText: 'คูปองเงินสด ฿100 (100 Pts)',
    iconBg: 'bg-amber-100 text-amber-800 border-amber-300',
    couponTemplate: {
      type: 'FixedAmount',
      discountValue: 100,
      minSpendTHB: 0,
      minDurationDays: 1,
    },
  },
  {
    id: 'rw-disc-200-150pts',
    title: 'คูปองส่วนลดค่าเช่า 200 บาท',
    description: 'ส่วนลดพิเศษ 200 บาท เมื่อสะสมครบ 150 แต้ม คุ้มค่าที่สุดสำหรับการจองรถ',
    requiredPoints: 150,
    category: 'Discount',
    badgeText: 'ส่วนลด ฿200 (150 Pts)',
    iconBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    couponTemplate: {
      type: 'FixedAmount',
      discountValue: 200,
      minSpendTHB: 800,
      minDurationDays: 1,
    },
  },
  {
    id: 'rw-cash-200-200pts',
    title: 'คูปองแทนเงินสด 200 บาท',
    description: 'คูปองแทนเงินสดมูลค่า 200 บาท ใช้ชำระค่าเช่ารถหรือมัดจำโดยไม่มีเงื่อนไขขั้นต่ำ',
    requiredPoints: 200,
    category: 'Discount',
    badgeText: 'คูปองเงินสด ฿200 (200 Pts)',
    iconBg: 'bg-purple-100 text-purple-800 border-purple-300',
    couponTemplate: {
      type: 'FixedAmount',
      discountValue: 200,
      minSpendTHB: 0,
      minDurationDays: 1,
    },
  },
  {
    id: 'rw-disc-500-350pts',
    title: 'คูปองส่วนลดพิเศษ 500 บาท',
    description: 'ส่วนลดระดับ VIP มูลค่า 500 บาท สำหรับใช้กับการจองรถทุกประเภท',
    requiredPoints: 350,
    category: 'Discount',
    badgeText: 'ส่วนลด ฿500 (350 Pts)',
    iconBg: 'bg-rose-100 text-rose-800 border-rose-300',
    couponTemplate: {
      type: 'FixedAmount',
      discountValue: 500,
      minSpendTHB: 1500,
      minDurationDays: 1,
    },
  },
  {
    id: 'rw-addon-ins-120pts',
    title: 'ฟรี! ค่าประกันภัยอุบัติเหตุความเสียหาย',
    description: 'สิทธิ์เว้นเว้นค่าประกันภัยความเสียหายส่วนแรก (Insurance Waiver) ไม่ต้องจ่ายเพิ่ม',
    requiredPoints: 120,
    category: 'Addon',
    badgeText: 'ฟรีประกัน (120 Pts)',
    iconBg: 'bg-blue-100 text-blue-800 border-blue-300',
    couponTemplate: {
      type: 'AddonWaiver',
      discountValue: 200,
      minSpendTHB: 0,
      minDurationDays: 1,
      addonType: 'InsuranceDeductible',
    },
  },
  {
    id: 'rw-addon-del-150pts',
    title: 'ฟรี! ค่าบริการจัดส่งรถถึงบ้าน / สนามบิน',
    description: 'บริการจัดส่งและรับรถคืนถึงที่พักหรือสนามบินสุวรรณภูมิ/ดอนเมือง ฟรี',
    requiredPoints: 150,
    category: 'Addon',
    badgeText: 'ฟรีจัดส่งรถ (150 Pts)',
    iconBg: 'bg-teal-100 text-teal-800 border-teal-300',
    couponTemplate: {
      type: 'AddonWaiver',
      discountValue: 300,
      minSpendTHB: 0,
      minDurationDays: 1,
      addonType: 'DeliveryFee',
    },
  },
];

export interface TierBenefitInfo {
  tierKey: 'Standard' | 'Silver' | 'Gold' | 'Platinum';
  name: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  iconBg: string;
  minSpendTHB: number;
  minRentalsCount: number;
  pointsMultiplier: string;
  discountRate: string;
  benefits: string[];
}

export const TIER_BENEFITS_GUIDE: TierBenefitInfo[] = [
  {
    tierKey: 'Standard',
    name: 'Standard Member (เริ่มต้น)',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    textColor: 'text-slate-900',
    borderColor: 'border-slate-200',
    iconBg: 'bg-slate-200 text-slate-700',
    minSpendTHB: 0,
    minRentalsCount: 0,
    pointsMultiplier: '1.0x (100 บาท = 1 Pts)',
    discountRate: 'ส่วนลดปกติ',
    benefits: [
      'สมัครสมาชิกฟรี รับสิทธิ์สะสมแต้มทันทีทุกออเดอร์',
      'รับคูปองส่วนลดต้อนรับสมาชิกใหม่ 100 บาท',
      'บริการจองและเลือกรุ่นรถยนต์ออนไลน์ตลอด 24 ชั่วโมง',
      'สิทธิ์เข้าถึงโปรโมชันประจำเดือนของทางร้าน'
    ],
  },
  {
    tierKey: 'Silver',
    name: 'Silver Member (ซิลเวอร์)',
    badgeBg: 'bg-slate-200 text-slate-800 border-slate-400',
    textColor: 'text-slate-900',
    borderColor: 'border-slate-300',
    iconBg: 'bg-slate-300 text-slate-800',
    minSpendTHB: 5000,
    minRentalsCount: 3,
    pointsMultiplier: '1.2x (รับแต้มเพิ่ม 20%)',
    discountRate: 'ส่วนลดประจำระดับ 5%',
    benefits: [
      'สะสมแต้มไวขึ้น 1.2 เท่า สำหรับทุกยอดการเช่ารถ',
      'รับส่วนลดประจำระดับสมาชิก 5% อัตโนมัติทุกการจอง',
      'สิทธิ์ขยายเวลาคืนรถล่าช้าฟรีได้ถึง 1 ชั่วโมง',
      'รับโบนัสแต้มวันเกิดฟรี 50 Pts ในเดือนเกิด'
    ],
  },
  {
    tierKey: 'Gold',
    name: 'Gold Member (โกลด์)',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    textColor: 'text-amber-950',
    borderColor: 'border-amber-300',
    iconBg: 'bg-amber-200 text-amber-800',
    minSpendTHB: 20000,
    minRentalsCount: 8,
    pointsMultiplier: '1.5x (รับแต้มเพิ่ม 50%)',
    discountRate: 'ส่วนลดประจำระดับ 10%',
    benefits: [
      'สะสมแต้มไวขึ้น 1.5 เท่า สำหรับทุกยอดใช้จ่าย',
      'รับส่วนลดประจำระดับสมาชิก 10% อัตโนมัติทุกการจอง',
      'ฟรี! บริการจัดส่งและรับรถคืนถึงที่พัก/สนามบิน 2 ครั้ง/ปี',
      'ฟรี! ผู้ขับขี่เสริม (Additional Driver) เพิ่ม 1 ท่าน',
      'ช่องทางบริการลูกค้า Fast-Track VIP สายด่วนพิเศษ'
    ],
  },
  {
    tierKey: 'Platinum',
    name: 'Platinum VIP (แพลตตินัม)',
    badgeBg: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900 border-purple-300',
    textColor: 'text-purple-950',
    borderColor: 'border-purple-300',
    iconBg: 'bg-purple-200 text-purple-900',
    minSpendTHB: 50000,
    minRentalsCount: 15,
    pointsMultiplier: '2.0x (รับแต้มทวีคูณ 2 เท่า!)',
    discountRate: 'ส่วนลด VIP สูงสุด 15%',
    benefits: [
      'รับแต้มสะสม x2 เท่า ทุกยอดชำระเงินโดยไม่มีเงื่อนไข',
      'ส่วนลดระดับ VIP 15% สำหรับรถยนต์ทุกรุ่นทุกหมวดหมู่',
      'ฟรี! อัปเกรดรุ่นรถเช่าสูงขึ้น 1 Class (ขึ้นอยู่กับรถว่าง)',
      'ฟรี! ประกันภัยคุ้มครองความเสียหายส่วนแรก (Zero Deductible)',
      'สิทธิ์เปลี่ยนวันเดินทางหรือยกเลิกการจองฟรีแบบไม่จำกัด',
      'บริการผู้ช่วยส่วนตัว (Personal Butler) ดูแลการจองตลอด 24 ชม.'
    ],
  },
];

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
  onCancelBooking?: (bookingId: string, forfeitDepositAmount: number, cancelReason: string) => void;
  onCustomerRequestCancellation?: (
    bookingId: string,
    reason: string,
    bankName: string,
    bankAccountName: string,
    bankAccountNumber: string
  ) => void;
  onRedeemReward?: (pointsCost: number, newCoupon?: Coupon) => void;
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
  onCancelBooking,
  onCustomerRequestCancellation,
  onRedeemReward,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_bookings' | 'my_coupons' | 'redeem_points'>('catalog');
  const [loyaltySubTab, setLoyaltySubTab] = useState<'rewards' | 'tier_guide'>('rewards');
  const [rewardCategoryFilter, setRewardCategoryFilter] = useState<'All' | 'Discount' | 'Addon' | 'Gift'>('All');
  const [redeemedRewardInfo, setRedeemedRewardInfo] = useState<{ reward: RewardItem; couponCode: string } | null>(null);
  const [copiedRewardCode, setCopiedRewardCode] = useState<boolean>(false);

  // Customer Interactive Booking Modal State
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [customerCancelRequestBooking, setCustomerCancelRequestBooking] = useState<Booking | null>(null);
  const [viewingRefundSlipBooking, setViewingRefundSlipBooking] = useState<Booking | null>(null);
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

  const handleRedeemItem = (reward: RewardItem) => {
    if (!user) {
      onOpenLogin('customer');
      return;
    }

    const currentPoints = matchingCustomer?.pointsBalance ?? user.points ?? 0;
    if (currentPoints < reward.requiredPoints) {
      alert(`แต้มสะสมของคุณไม่เพียงพอ (ต้องการ ${reward.requiredPoints} Pts แต่คุณมี ${currentPoints} Pts)`);
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const generatedCode = reward.couponTemplate
      ? `RDM-${reward.couponTemplate.discountValue}-${randomSuffix}`
      : `GIFT-${reward.requiredPoints}-${randomSuffix}`;

    let newCoupon: Coupon | undefined;

    if (reward.couponTemplate) {
      newCoupon = {
        id: `cpn-rdm-${Date.now()}`,
        code: generatedCode,
        name: reward.title,
        description: reward.description,
        type: reward.couponTemplate.type,
        discountValue: reward.couponTemplate.discountValue,
        minDurationDays: reward.couponTemplate.minDurationDays,
        minSpendTHB: reward.couponTemplate.minSpendTHB,
        blackoutDates: [],
        applicableCategories: [],
        usageLimitGlobal: 100,
        usedCountGlobal: 0,
        usageLimitPerUser: 1,
        allowStacking: true,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '2027-12-31',
        addonType: reward.couponTemplate.addonType,
      };
    }

    if (onRedeemReward) {
      onRedeemReward(reward.requiredPoints, newCoupon);
    }

    setCopiedRewardCode(false);
    setRedeemedRewardInfo({
      reward,
      couponCode: generatedCode,
    });
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

  const dateConflict = bookingVehicle
    ? checkBookingConflict(bookingVehicle.id, startDate, endDate, bookings)
    : { hasConflict: false, conflictingBooking: null, message: '' };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingVehicle || !user) return;

    // Double Booking Anti-Overlapping Protection
    if (dateConflict.hasConflict) {
      alert(`⚠️ ระบบป้องกันการเช่ารถซ้อน!\n\n${dateConflict.message}\n\nกรุณาเปลี่ยนวันเช่าเป็นช่วงที่รถคันนี้ว่าง`);
      return;
    }

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
                    {matchingCustomer?.tier || user.tier || 'Standard'} • แต้มสะสม: {matchingCustomer?.pointsBalance ?? user.points ?? 0} Pts
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
                  <span className="font-bold text-amber-400">{matchingCustomer?.tier || user.tier || 'Standard'}</span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>คะแนนสะสมคงเหลือ:</span>
                  <span className="font-bold text-emerald-400">{matchingCustomer?.pointsBalance ?? user.points ?? 0} แต้ม</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Navigation Tabs (Storefront vs My Bookings vs My Coupons vs Redeem Points) */}
        <div className="flex items-center space-x-2 border-b border-slate-200 mb-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer whitespace-nowrap ${
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
              className={`flex items-center space-x-2 py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer whitespace-nowrap ${
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
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'my_coupons'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>คูปองส่วนลดพิเศษ ({coupons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('redeem_points')}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'redeem_points'
                ? 'border-amber-500 text-amber-700 bg-amber-50/60 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-amber-600'
            }`}
          >
            <Gift className="w-4 h-4 text-amber-500" />
            <span className="font-extrabold">🎁 แลกแต้มสะสม / MemberTier </span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => {
                const rentalInfo = getVehicleActiveRentalInfo(vehicle, bookings);
                const weeklyRateEst = Math.round(vehicle.dailyRate * 7 * 0.85);
                const monthlyRateEst = Math.round(vehicle.dailyRate * 30 * 0.65);

                return (
                  <div
                    key={vehicle.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group relative"
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

                        {/* Rental Status Badge */}
                        <span className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center space-x-1 shadow-xs ${
                          rentalInfo.isRentedOrReserved
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-emerald-600 text-white border-emerald-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rentalInfo.isRentedOrReserved ? 'bg-amber-300 animate-pulse' : 'bg-white'}`}></span>
                          <span>{rentalInfo.isRentedOrReserved ? 'เช่าแล้ว' : 'พร้อมให้เช่า'}</span>
                        </span>
                      </div>

                      {/* Content Details */}
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">
                              {vehicle.brand} {vehicle.model}
                            </h3>
                            <p className="text-xs text-slate-500">
                              ปี {vehicle.year} • สี{vehicle.color} • ทะเบียน {vehicle.plateNumber} ({vehicle.province})
                            </p>
                          </div>
                        </div>

                        {/* Remaining Rental Days Banner (If currently rented) */}
                        {rentalInfo.isRentedOrReserved && (
                          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-800 flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-rose-600 shrink-0 animate-spin-slow" />
                            <div className="leading-tight">
                              <span className="font-bold block">
                                ถูกเช่าอยู่ — ระยะเวลาเหลืออีก <span className="text-rose-700 font-extrabold text-sm">{rentalInfo.remainingDays} วัน</span>
                              </span>
                              <span className="text-[10px] text-rose-600">
                                กำหนดคืนรถวันที่ {rentalInfo.returnDateFormatted}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl text-slate-600">
                          <div>
                            <span className="text-[10px] text-slate-400 block">เชื้อเพลิง:</span>
                            <span className="font-semibold text-slate-800">{vehicle.fuelType}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">เลขไมล์ปัจจุบัน:</span>
                            <span className="font-semibold text-slate-800">{vehicle.currentOdometer.toLocaleString()} กม.</span>
                          </div>
                        </div>

                        {/* Pricing Tiers breakdown display */}
                        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-2 text-[11px] space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>อัตราเช่าสัปดาห์ (Weekly -15%):</span>
                            <span className="font-bold text-indigo-700">฿{weeklyRateEst.toLocaleString()} / สัปดาห์</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>อัตราเช่าเดือน (Monthly -35%):</span>
                            <span className="font-bold text-purple-700">฿{monthlyRateEst.toLocaleString()} / เดือน</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing and Action Footer */}
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">อัตราค่าเช่าฐาน</span>
                        <span className="text-lg font-extrabold text-indigo-600">
                          ฿{vehicle.dailyRate.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500"> / วัน</span>
                      </div>

                      <button
                        onClick={() => handleStartBooking(vehicle)}
                        className={`text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-sm ${
                          rentalInfo.isRentedOrReserved
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{rentalInfo.isRentedOrReserved ? `จองล่วงหน้า (คิวว่าง ${rentalInfo.returnDateFormatted})` : 'จองคันนี้'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
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
                  <div key={b.id} className={`border rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${
                    b.status.startsWith('Cancelled') ? 'bg-slate-50/90 border-slate-300' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                          {b.bookingCode}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{b.vehicleModel} ({b.vehiclePlate})</span>
                        
                        {b.status === 'Cancellation Pending' && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1 animate-pulse">
                            <span>⏳ อยู่ระหว่างเจ้าหน้าที่ตรวจสอบยกเลิก</span>
                          </span>
                        )}

                        {b.status === 'Cancelled (Refund Pending)' && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 flex items-center space-x-1">
                            <span>🔵 อนุมัติแล้ว - กำลังโอนเงินคืน</span>
                          </span>
                        )}

                        {b.status === 'Cancelled (Refund Completed)' && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1">
                            <span>🟢 คืนเงินมัดจำเรียบร้อยแล้ว</span>
                          </span>
                        )}

                        {b.status === 'Cancelled' && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            ยกเลิกการจองแล้ว
                          </span>
                        )}

                        {(b.status === 'Active' || b.status === 'Confirmed' || b.status === 'Pending') && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {b.status}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600">
                        ระยะเวลาเช่า: <span className="font-semibold">{b.startDate} ถึง {b.endDate} ({b.totalDays} วัน)</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        สถานที่รับรถ: {b.pickupBranch} | คืนรถ: {b.dropoffBranch}
                      </p>

                      {/* Loyalty points info */}
                      <div className="flex items-center space-x-2 text-xs pt-0.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center space-x-1 ${
                          b.status.startsWith('Cancelled')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          <Gift className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {b.status.startsWith('Cancelled')
                              ? `หักแต้มคืน AUTO (-${b.pointsEarned} pt)`
                              : `ได้รับแต้มสะสม AUTO (+${b.pointsEarned} pt)`}
                          </span>
                        </span>

                        <span className="text-[11px] font-medium text-slate-600">
                          มัดจำ: ฿{b.depositAmount.toLocaleString()}
                        </span>
                      </div>

                      {/* Details for cancellation states */}
                      {b.status === 'Cancellation Pending' && (
                        <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5 space-y-1">
                          <p className="font-bold">📝 เหตุผลที่ขอยกเลิก: {b.cancelReason}</p>
                          <p className="text-[11px] text-amber-800">
                            บัญชีรับเงินคืน: {b.bankName} ({b.bankAccountName} - {b.bankAccountNumber})
                          </p>
                          <p className="text-[10px] text-amber-700 italic">
                            * เจ้าหน้าที่จะตรวจสอบเงื่อนไขระยะเวลาก่อนเริ่มเดินทางและแจ้งผลอนุมัติโอนเงินคืนตามนโยบายครับ
                          </p>
                        </div>
                      )}

                      {b.status === 'Cancelled (Refund Pending)' && (
                        <div className="mt-2 text-xs bg-sky-50 border border-sky-200 text-sky-900 rounded-xl p-2.5 space-y-1">
                          <p className="font-bold">✅ อนุมัติการยกเลิกการจองเรียบร้อยแล้ว</p>
                          <p className="text-[11px]">
                            ยอดเงินมัดจำที่จะได้รับคืน: <strong className="text-emerald-700">฿{(b.depositRefundedAmount ?? b.depositAmount).toLocaleString()}</strong>
                            {b.depositForfeitedAmount && b.depositForfeitedAmount > 0 ? ` (หักตามเงื่อนไข: ฿${b.depositForfeitedAmount.toLocaleString()})` : ''}
                          </p>
                          <p className="text-[11px] text-sky-700">
                            โอนเข้าบัญชี: {b.bankName} ({b.bankAccountNumber}) • ฝ่ายการเงินกำลังดำเนินการโอนเงินคืนและจะแนบสลิปเร็วๆ นี้
                          </p>
                        </div>
                      )}

                      {b.status === 'Cancelled (Refund Completed)' && (
                        <div className="mt-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-2.5 space-y-1">
                          <p className="font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>โอนเงินคืนมัดจำสำเร็จเรียบร้อยแล้ว</span>
                          </p>
                          <p className="text-[11px] text-emerald-800">
                            โอนคืนเงินสำเร็จเมื่อ: {b.refundCompletedAt ? new Date(b.refundCompletedAt).toLocaleString('th-TH') : 'ล่าสุด'} | ยอดคืนสุทธิ: <strong>฿{(b.depositRefundedAmount ?? b.depositAmount).toLocaleString()}</strong>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-end md:items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-slate-400">ราคารวมทั้งสิ้น</p>
                        <p className="text-lg font-extrabold text-indigo-600">฿{b.grandTotal.toLocaleString()}</p>
                      </div>

                      {(b.status === 'Active' || b.status === 'Confirmed' || b.status === 'Pending') && (
                        <button
                          type="button"
                          onClick={() => setCustomerCancelRequestBooking(b)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
                        >
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>ยื่นคำขอยกเลิกการจอง</span>
                        </button>
                      )}

                      {b.status === 'Cancelled (Refund Completed)' && (
                        <button
                          type="button"
                          onClick={() => setViewingRefundSlipBooking(b)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-md"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>ดูสลิปโอนเงินคืน</span>
                        </button>
                      )}
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

        {/* REDEEM POINTS TAB */}
        {activeTab === 'redeem_points' && (
          <div className="space-y-6">
            {/* Loyalty Dashboard Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/30 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center space-x-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold px-3 py-1 rounded-full mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>DriveCar Club Loyalty Rewards</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
                    <span>ศูนย์แลกแต้มสะสมและสิทธิพิเศษตามระดับสมาชิก</span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    เช่ารถทุกครั้งรับแต้มสะสมทันที (ทุก 100 บาท = 1 Pts) พร้อมรับสิทธิ์รับแต้มคูณสูงสุด 2.0x และส่วนลดประจำระดับสมาชิกสูงสุด 15%!
                  </p>
                </div>

                {/* Points Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 w-full md:w-72 shrink-0 text-center">
                  <span className="text-[11px] text-slate-300 font-medium block">แต้มสะสมของคุณในขณะนี้</span>
                  <div className="text-3xl font-black text-amber-400 my-1 flex items-center justify-center space-x-1">
                    <Award className="w-7 h-7 text-amber-400" />
                    <span>{matchingCustomer?.pointsBalance ?? user?.points ?? 0}</span>
                    <span className="text-sm font-bold text-slate-300 ml-1">Pts</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-300 border-t border-white/10 pt-2 mt-2">
                    <span>ระดับสมาชิก: <strong className="text-amber-300 font-extrabold">{matchingCustomer?.tier || user?.tier || 'Standard'}</strong></span>
                    {!user ? (
                      <button
                        onClick={() => onOpenLogin('customer')}
                        className="text-amber-300 font-bold hover:underline cursor-pointer"
                      >
                        เข้าสู่ระบบ
                      </button>
                    ) : (
                      <span className="text-slate-400">เช่าสะสม {matchingCustomer?.totalRentalsCount ?? 0} ครั้ง</span>
                    )}
                  </div>

                  <button
                    onClick={() => setLoyaltySubTab(loyaltySubTab === 'rewards' ? 'tier_guide' : 'rewards')}
                    className="mt-3 w-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-[11px] font-extrabold py-1.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>{loyaltySubTab === 'rewards' ? 'ดูเงื่อนไขอัปเกรดระดับสมาชิก >' : 'ดูแคตตาล็อกของรางวัล >'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sub Navigation Bar inside Loyalty Hub */}
            <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setLoyaltySubTab('rewards')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-2 ${
                  loyaltySubTab === 'rewards'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gift className="w-4 h-4 text-amber-500" />
                <span>🎁 แคตตาล็อกแลกของรางวัล</span>
              </button>

              <button
                onClick={() => setLoyaltySubTab('tier_guide')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-2 ${
                  loyaltySubTab === 'tier_guide'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crown className="w-4 h-4 text-slate-900" />
                <span>👑 ระดับสมาชิก & เงื่อนไขการอัปเกรด (Member Tiers)</span>
              </button>
            </div>

            {/* TAB 1: REWARDS CATALOG */}
            {loyaltySubTab === 'rewards' && (
              <div className="space-y-6">
                {/* Filter Pills for Reward Categories */}
                <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">หมวดหมู่ของรางวัล:</span>
                  </div>
                  <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
                    {[
                      { key: 'All', label: 'ทั้งหมด' },
                      { key: 'Discount', label: 'ส่วนลดค่าเช่ารถ' },
                      { key: 'Addon', label: 'สิทธิพิเศษ/บริการเสริม' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setRewardCategoryFilter(f.key as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          rewardCategoryFilter === f.key
                            ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rewards Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {REWARD_CATALOG.filter(
                    (item) => rewardCategoryFilter === 'All' || item.category === rewardCategoryFilter
                  ).map((reward) => {
                    const currentPoints = matchingCustomer?.pointsBalance ?? user?.points ?? 0;
                    const canRedeem = !!user && currentPoints >= reward.requiredPoints;
                    const pointsNeeded = reward.requiredPoints - currentPoints;

                    return (
                      <div
                        key={reward.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition relative overflow-hidden group"
                      >
                        <div>
                          {/* Top Required Points Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${reward.iconBg}`}>
                              {reward.badgeText}
                            </span>
                            <div className="flex items-center space-x-1 text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                              <Gift className="w-3.5 h-3.5" />
                              <span>{reward.requiredPoints} Pts</span>
                            </div>
                          </div>

                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition">
                            {reward.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            {reward.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                          <p className="text-[10px] text-slate-400">
                            {reward.couponTemplate
                              ? `ใช้ขั้นต่ำ ฿${reward.couponTemplate.minSpendTHB.toLocaleString()} | หมดอายุ 31 ธ.ค. 2027`
                              : 'รับสินค้าได้ที่สาขาเมื่อเข้าใช้บริการเช่ารถ'}
                          </p>

                          {!user ? (
                            <button
                              onClick={() => onOpenLogin('customer')}
                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                            >
                              เข้าสู่ระบบเพื่อแลก
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRedeemItem(reward)}
                              disabled={!canRedeem}
                              className={`w-full text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer ${
                                canRedeem
                                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-amber-500/20'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              }`}
                            >
                              <Gift className="w-4 h-4" />
                              <span>
                                {canRedeem
                                  ? 'กดแลกรางวัลนี้'
                                  : `แต้มไม่พอ (ขาดอีก ${pointsNeeded} Pts)`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: MEMBER TIERS UPGRADE GUIDE */}
            {loyaltySubTab === 'tier_guide' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* User Current Tier Status & Upgrade Progress */}
                {user && (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-amber-100 border border-amber-300 rounded-2xl flex items-center justify-center text-amber-700 shadow-xs">
                          <Crown className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-500 font-medium">ระดับสมาชิกของคุณ:</span>
                            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-500">
                              {matchingCustomer?.tier || user?.tier || 'Standard'}
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                            {matchingCustomer?.fullName || user.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-xs text-slate-600 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/80 w-full md:w-auto justify-around">
                        <div>
                          <span className="text-[10px] text-slate-400 block">ยอดเช่าสะสม</span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            ฿{(matchingCustomer?.totalSpentTHB ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div>
                          <span className="text-[10px] text-slate-400 block">จำนวนครั้งเช่า</span>
                          <span className="font-extrabold text-indigo-600 text-sm">
                            {matchingCustomer?.totalRentalsCount ?? 0} ครั้ง
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress to Next Tier */}
                    {(() => {
                      const userSpent = matchingCustomer?.totalSpentTHB ?? 0;
                      const userRentals = matchingCustomer?.totalRentalsCount ?? 0;
                      const currentTier = matchingCustomer?.tier ?? user?.tier ?? 'Standard';

                      let nextTierName = 'Silver';
                      let targetSpend = 5000;
                      let targetRentals = 3;

                      if (currentTier === 'Silver') {
                        nextTierName = 'Gold';
                        targetSpend = 20000;
                        targetRentals = 8;
                      } else if (currentTier === 'Gold') {
                        nextTierName = 'Platinum VIP';
                        targetSpend = 50000;
                        targetRentals = 15;
                      } else if (currentTier === 'Platinum') {
                        nextTierName = 'VIP Max Tier';
                        targetSpend = 50000;
                        targetRentals = 15;
                      }

                      const spendPct = Math.min(100, Math.round((userSpent / targetSpend) * 100));
                      const rentalPct = Math.min(100, Math.round((userRentals / targetRentals) * 100));
                      const maxProgressPct = currentTier === 'Platinum' ? 100 : Math.max(spendPct, rentalPct);

                      const remSpend = Math.max(0, targetSpend - userSpent);
                      const remRentals = Math.max(0, targetRentals - userRentals);

                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700 flex items-center space-x-1">
                              <TrendingUp className="w-4 h-4 text-indigo-600" />
                              <span>ความคืบหน้าสู่ระดับต่อไป: <strong>{nextTierName}</strong></span>
                            </span>
                            <span className="font-extrabold text-indigo-600">{maxProgressPct}%</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 p-0.5">
                            <div
                              className="bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500 shadow-xs"
                              style={{ width: `${maxProgressPct}%` }}
                            />
                          </div>

                          <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                            {currentTier === 'Platinum' ? (
                              <span className="text-emerald-600 font-extrabold flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>คุณอยู่ในระดับสูงสุด Platinum VIP แล้ว! เพลิดเพลินกับสิทธิประโยชน์ x2 แต้มสะสมและส่วนลด 15%</span>
                              </span>
                            ) : (
                              <span>
                                💡 อีกเพียง <strong className="text-indigo-600">฿{remSpend.toLocaleString()}</strong> บาท หรือ เช่ารถเพิ่มอีก <strong className="text-indigo-600">{remRentals} ครั้ง</strong> เพื่อปรับเป็นระดับ <strong>{nextTierName}</strong> อัตโนมัติ!
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Tier Benefits Cards Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      <span>ระดับสมาชิกและสิทธิประโยชน์ (Member Tiers & Benefits)</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">ปรับระดับให้อัตโนมัติเมื่อครบเกณฑ์</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {TIER_BENEFITS_GUIDE.map((tier) => {
                      const isCurrentTier = (matchingCustomer?.tier || user?.tier || 'Standard') === tier.tierKey;

                      return (
                        <div
                          key={tier.tierKey}
                          className={`bg-white rounded-3xl border ${tier.borderColor} p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition relative overflow-hidden ${
                            isCurrentTier ? 'ring-2 ring-amber-500 ring-offset-2' : ''
                          }`}
                        >
                          {isCurrentTier && (
                            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-xs">
                              ระดับปัจจุบันของคุณ
                            </div>
                          )}

                          <div>
                            {/* Tier Badge & Name */}
                            <div className="flex items-center space-x-2 mb-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${tier.iconBg}`}>
                                <Crown className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className={`font-black text-sm ${tier.textColor}`}>{tier.name}</h4>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {tier.minSpendTHB === 0
                                    ? 'สำหรับสมาชิกใหม่'
                                    : `ยอดเช่า ฿${tier.minSpendTHB.toLocaleString()} หรือ ${tier.minRentalsCount} ครั้ง`}
                                </span>
                              </div>
                            </div>

                            {/* Key Rates */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 my-3 space-y-1 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] text-slate-500">อัตราสะสมแต้ม:</span>
                                <span className="font-extrabold text-indigo-600">{tier.pointsMultiplier}</span>
                              </div>
                              <div className="flex justify-between items-center border-t border-slate-200/60 pt-1">
                                <span className="text-[11px] text-slate-500">ส่วนลดประจำระดับ:</span>
                                <span className="font-extrabold text-emerald-600">{tier.discountRate}</span>
                              </div>
                            </div>

                            {/* Benefits List */}
                            <div className="space-y-2 mt-4">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                สิทธิประโยชน์ที่คุณจะได้รับ:
                              </span>
                              {tier.benefits.map((benefit, idx) => (
                                <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span className="leading-tight">{benefit}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium text-center">
                            {tier.minSpendTHB === 0
                              ? 'ฟรีไม่มีค่าใช้จ่าย'
                              : `ยอดเช่าสะสมครบ ฿${tier.minSpendTHB.toLocaleString()}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* How to Upgrade Step-by-Step Guide */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
                  <h3 className="text-sm font-extrabold text-amber-400 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>วิธีสะสมยอดและอัปเกรดระดับสมาชิก (How to Level Up)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                      <div className="w-7 h-7 bg-amber-400 text-slate-950 font-black rounded-xl flex items-center justify-center text-xs mb-2">
                        1
                      </div>
                      <h4 className="font-bold text-white text-sm">1. เช่ารถและชำระเงิน</h4>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        เลือกจองรถยนต์รุ่นใดก็ได้ผ่านหน้าเว็บ และชำระเงินค่ายอดเช่าจนเสร็จสิ้น
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                      <div className="w-7 h-7 bg-indigo-400 text-slate-950 font-black rounded-xl flex items-center justify-center text-xs mb-2">
                        2
                      </div>
                      <h4 className="font-bold text-white text-sm">2. สะสมยอดอัตโนมัติ</h4>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        ระบบจะนำยอดเงินและจำนวนครั้งมาบันทึกสะสมเข้าสู่บัญชีของคุณทันทีเมื่อเริ่มสัญญาเช่า
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                      <div className="w-7 h-7 bg-emerald-400 text-slate-950 font-black rounded-xl flex items-center justify-center text-xs mb-2">
                        3
                      </div>
                      <h4 className="font-bold text-white text-sm">3. อัปเกรดและรับสิทธิ์ทันที</h4>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        เมื่อยอดเช่าสะสมหรือจำนวนครั้งครบเกณฑ์ ระบบจะปรับระดับสมาชิกและมอบส่วนลดให้อัตโนมัติ!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* REDEMPTION SUCCESS MODAL */}
      {redeemedRewardInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-center relative overflow-hidden">
            <button
              onClick={() => setRedeemedRewardInfo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-amber-100 border border-amber-300 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-md">
              <Gift className="w-9 h-9 animate-bounce" />
            </div>

            <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-3 py-1 rounded-full">
              🎉 แลกรางวัลสำเร็จแล้ว!
            </span>

            <h3 className="text-lg font-extrabold text-slate-900 mt-2">
              {redeemedRewardInfo.reward.title}
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              หักแต้มสะสมออก {redeemedRewardInfo.reward.requiredPoints} Pts • แต้มคงเหลือ {matchingCustomer?.pointsBalance ?? user?.points ?? 0} Pts
            </p>

            {/* Code Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 my-5 border border-slate-800 relative">
              <span className="text-[10px] text-slate-400 block mb-1">รหัสคูปอง/วอเชอร์ของคุณ</span>
              <div className="font-mono text-xl font-black text-amber-400 tracking-wider">
                {redeemedRewardInfo.couponCode}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(redeemedRewardInfo.couponCode);
                  setCopiedRewardCode(true);
                  setTimeout(() => setCopiedRewardCode(false), 2000);
                }}
                className="mt-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center justify-center space-x-1.5 mx-auto cursor-pointer"
              >
                {copiedRewardCode ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>คัดลอกรหัสแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>คัดลอกรหัสคูปอง</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-6 bg-amber-50 p-3 rounded-xl border border-amber-200 text-left leading-relaxed">
              💡 <strong>คำแนะนำ:</strong> รหัสนี้ถูกเพิ่มลงในหน้า <strong>"คูปองส่วนลดพิเศษ"</strong> ของคุณแล้วเรียบร้อย สามารถนำไปกรอกในช่องส่วนลดเพื่อประหยัดค่าเช่ารถได้ทันที!
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setRedeemedRewardInfo(null);
                  setActiveTab('my_coupons');
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                ดูคูปองทั้งหมด
              </button>
              <button
                onClick={() => {
                  setRedeemedRewardInfo(null);
                  setActiveTab('catalog');
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                ไปเลือกรถเช่าทันที
              </button>
            </div>
          </div>
        </div>
      )}

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

                  {/* Anti-Overlapping Conflict Warning Alert */}
                  {dateConflict.hasConflict && (
                    <div className="bg-rose-100 border-2 border-rose-400 rounded-xl p-3 text-xs text-rose-900 space-y-1">
                      <div className="flex items-center space-x-2 font-bold text-rose-800">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>🚫 แจ้งเตือน: ป้องกันการเช่ารถซ้อน!</span>
                      </div>
                      <p className="text-[11px] text-rose-800 font-medium pl-6">
                        {dateConflict.message}
                      </p>
                      <p className="text-[10px] text-rose-700 font-bold pl-6">
                        💡 กรุณาเลือกวันเริ่มต้นเช่าหลังจากวันที่ {dateConflict.conflictingBooking?.endDate} หรือเลือกรถคันอื่น
                      </p>
                    </div>
                  )}

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
                      <div className="text-center space-y-3">
                        <p className="text-xs text-slate-600 font-semibold">
                          สแกน QR Code ด้วยแอปธนาคารใดก็ได้ ชำระยอด <span className="text-indigo-600 font-bold">฿{(grandTotal + deposit.effectiveDeposit).toLocaleString()}</span>
                        </p>

                        {/* Official K+ Thai QR Payment Card */}
                        <div className="w-80 max-w-full mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md text-center font-sans my-2 relative group">
                          {/* Top Header Bar (Dark Navy Blue #0C3859) */}
                          <div className="bg-[#0C3859] text-white px-4 py-3 flex items-center justify-between shadow-xs">
                            <div className="flex items-center space-x-2.5 mx-auto">
                              {/* Thai QR Logo Emblem */}
                              <div className="w-6 h-6 rounded bg-teal-500/20 border border-teal-300/40 flex items-center justify-center p-0.5">
                                <div className="w-full h-full border-2 border-white rounded-2xs flex items-center justify-center relative">
                                  <div className="w-1.5 h-1.5 bg-teal-300 rounded-2xs"></div>
                                </div>
                              </div>
                              <span className="font-extrabold text-sm tracking-wider text-white font-sans uppercase">
                                THAI QR PAYMENT
                              </span>
                            </div>
                          </div>

                          {/* PromptPay Badge */}
                          <div className="pt-3 pb-1 flex justify-center">
                            <div className="border border-slate-300 rounded px-3 py-0.5 text-xs font-bold text-[#0C3859] bg-white flex items-center gap-1 shadow-2xs">
                              <span className="text-[#0C3859] font-extrabold tracking-tight">Prompt</span>
                              <span className="text-[#129A98] font-extrabold tracking-tight">Pay</span>
                            </div>
                          </div>

                          {/* QR Code (Dynamic with fallback to custom uploaded image or /qr-bank.svg) */}
                          <div className="p-2 flex justify-center items-center relative">
                            <div className="bg-white p-2 border border-slate-100 rounded-xl relative shadow-2xs">
                              <img
                                src={
                                  FINANCE_CONFIG.paymentMethods.promptPay.customQrImageUrl ||
                                  getPromptPayQrUrl(
                                    FINANCE_CONFIG.paymentMethods.promptPay.promptPayNumber,
                                    grandTotal + deposit.effectiveDeposit
                                  )
                                }
                                alt={`THAI QR PAYMENT - ${FINANCE_CONFIG.paymentMethods.promptPay.accountName}`}
                                className="w-48 h-48 object-contain mx-auto"
                                onError={(e) => {
                                  e.currentTarget.src = '/qr-bank.svg';
                                }}
                              />
                            </div>
                          </div>

                          {/* Account Details */}
                          <div className="px-4 pb-3.5 space-y-1">
                            <p className="text-[#129A98] font-bold text-xs tracking-tight">
                              สแกน QR เพื่อโอนเข้าบัญชี
                            </p>
                            <p className="text-slate-800 font-bold text-sm">
                              ชื่อ: {FINANCE_CONFIG.paymentMethods.promptPay.accountName}
                            </p>
                            <p className="text-slate-600 font-mono text-xs">
                              บัญชี: {FINANCE_CONFIG.paymentMethods.promptPay.accountNumberMasked || 'xxx-x-x7437-x'}
                            </p>
                            <p className="text-slate-400 font-mono text-[10px]">
                              เลขที่อ้างอิง: {FINANCE_CONFIG.paymentMethods.promptPay.refNo || '004999222186800'}
                            </p>
                          </div>

                          {/* Footer (K+ Accepts all banks) */}
                          <div className="border-t-2 border-[#00A950] px-3 py-2 bg-slate-50/80 flex items-center justify-center space-x-1.5 text-[11px]">
                            <span className="font-extrabold text-[#00A950] text-base">K+</span>
                            <span className="text-slate-600 font-medium">Accepts all banks | รับเงินได้จากทุกธนาคาร</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsPaymentVerified(true)}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                            isPaymentVerified
                              ? 'bg-emerald-600 text-white shadow-sm'
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
                  disabled={dateConflict.hasConflict}
                  className={`w-full text-white font-bold py-3.5 rounded-2xl transition cursor-pointer shadow-lg text-xs flex items-center justify-center space-x-2 ${
                    dateConflict.hasConflict
                      ? 'bg-slate-400 hover:bg-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {dateConflict.hasConflict
                      ? '🚫 ไม่สามารถจองได้ (มีคิวเช่าซ้อนช่วงวันที่นี้)'
                      : 'ยืนยันการชำระเงิน จองเช่ารถ และออกสัญญา'}
                  </span>
                </button>

              </form>
            )}

          </div>
        </div>
      )}

      {/* CUSTOMER 2-STEP CANCELLATION REQUEST MODAL */}
      {customerCancelRequestBooking && (
        <CustomerCancelModal
          isOpen={!!customerCancelRequestBooking}
          booking={customerCancelRequestBooking}
          onClose={() => setCustomerCancelRequestBooking(null)}
          onSubmitRequest={(bookingId, reason, bankName, accountName, accountNumber) => {
            if (onCustomerRequestCancellation) {
              onCustomerRequestCancellation(bookingId, reason, bankName, accountName, accountNumber);
            }
            setCustomerCancelRequestBooking(null);
          }}
        />
      )}

      {/* REFUND SLIP VIEWER MODAL */}
      {viewingRefundSlipBooking && (
        <RefundSlipModal
          isOpen={!!viewingRefundSlipBooking}
          booking={viewingRefundSlipBooking}
          onClose={() => setViewingRefundSlipBooking(null)}
        />
      )}

    </div>
  );
};
