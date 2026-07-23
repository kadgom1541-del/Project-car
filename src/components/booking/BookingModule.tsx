import React, { useState } from 'react';
import { Booking, Vehicle, Customer, Coupon, VehicleCategory } from '../../types/erp';
import { ColumnDef } from '@tanstack/react-table';
import { TanStackDataTable } from '../common/TanStackDataTable';
import { useErpStore } from '../../store/useErpStore';
import {
  validateCouponWaterfall,
  getSmartAssignedVehicle,
  calculateLoyaltyPoints,
  calculateRentalPricing,
  calculateSecurityDeposit
} from '../../utils/erpEngine';
import { checkBookingConflict } from '../../utils/bookingConflictChecker';
import { SignaturePad } from '../common/SignaturePad';
import { PdfDocumentViewer } from '../pdf/PdfDocumentViewer';
import { CancelBookingModal } from './CancelBookingModal';
import { RefundSlipModal } from '../common/RefundSlipModal';
import {
  Calendar,
  Plus,
  FileText,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Tag,
  DollarSign,
  Printer,
  Zap,
  XCircle,
  Hourglass,
  Receipt,
  Search,
  CheckCircle2,
  Filter,
  FileCheck
} from 'lucide-react';

interface BookingModuleProps {
  bookings: Booking[];
  vehicles: Vehicle[];
  customers: Customer[];
  coupons: Coupon[];
  onAddBooking: (newBooking: Booking) => void;
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  onApproveCancellation: (
    bookingId: string,
    forfeitDepositAmount: number,
    refundDepositAmount: number,
    cancelReason: string,
    adminNote?: string
  ) => void;
  onCompleteRefund: (
    bookingId: string,
    refundSlipUrl: string,
    adminNote?: string
  ) => void;
}

export const BookingModule: React.FC<BookingModuleProps> = ({
  bookings,
  vehicles,
  customers,
  coupons,
  onAddBooking,
  onUpdateBookingStatus,
  onApproveCancellation,
  onCompleteRefund,
}) => {
  const { openPdfModal } = useErpStore();
  const [showNewBookingModal, setShowNewBookingModal] = useState<boolean>(false);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [viewingSlipBooking, setViewingSlipBooking] = useState<Booking | null>(null);
  const [activePdfDoc, setActivePdfDoc] = useState<{
    type: 'Contract' | 'Voucher' | 'TaxInvoice' | 'Inspection';
    booking: Booking;
  } | null>(null);

  // Filter Tab State
  const [filterTab, setFilterTab] = useState<string>('All');

  const pendingCancelCount = bookings.filter((b) => b.status === 'Cancellation Pending').length;
  const refundPendingCount = bookings.filter((b) => b.status === 'Cancelled (Refund Pending)').length;

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'All') return true;
    if (filterTab === 'Cancellation Pending') return b.status === 'Cancellation Pending';
    if (filterTab === 'Refund Pending') return b.status === 'Cancelled (Refund Pending)';
    if (filterTab === 'Refund Completed') return b.status === 'Cancelled (Refund Completed)';
    if (filterTab === 'Active') return b.status === 'Active' || b.status === 'Confirmed';
    return true;
  });

  // TanStack Table Columns for Bookings
  const bookingColumns: ColumnDef<Booking>[] = [
    {
      accessorKey: 'bookingCode',
      header: 'รหัสการจอง',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
          {row.original.bookingCode || row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'ชื่อผู้เช่า / ลูกค้า',
      cell: ({ row }) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{row.original.customerName}</p>
          <p className="text-[10px] text-slate-400">ID: {row.original.customerId}</p>
        </div>
      ),
    },
    {
      accessorKey: 'vehicleModel',
      header: 'รุ่นรถ / ทะเบียน',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{row.original.vehicleModel}</p>
          <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
            {row.original.vehiclePlate}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'ช่วงเวลาเช่า',
      cell: ({ row }) => (
        <div className="text-xs">
          <p className="font-medium text-slate-800">{row.original.startDate} ถึง {row.original.endDate}</p>
          <p className="text-[10px] text-slate-400">({row.original.totalDays} วัน)</p>
        </div>
      ),
    },
    {
      accessorKey: 'grandTotal',
      header: 'ยอดเงินรวม',
      cell: ({ row }) => (
        <span className="font-extrabold text-xs text-slate-900">
          {row.original.grandTotal.toLocaleString()} THB
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'สถานะ',
      cell: ({ row }) => {
        const st = row.original.status;
        return (
          <div className="space-y-1">
            {st === 'Cancellation Pending' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center space-x-1 bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                <Hourglass className="w-3 h-3 text-amber-600 shrink-0" />
                <span>⏳ รอตรวจสอบการยกเลิก</span>
              </span>
            )}

            {st === 'Cancelled (Refund Pending)' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center space-x-1 bg-sky-100 text-sky-900 border border-sky-300">
                <DollarSign className="w-3 h-3 text-sky-600 shrink-0" />
                <span>🔵 อนุมัติแล้ว - รอโอนคืนมัดจำ</span>
              </span>
            )}

            {st === 'Cancelled (Refund Completed)' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center space-x-1 bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>🟢 คืนเงินมัดจำเรียบร้อยแล้ว</span>
              </span>
            )}

            {st === 'Active' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-block bg-emerald-100 text-emerald-800">
                Active (กำลังเช่า)
              </span>
            )}

            {st === 'Confirmed' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-block bg-blue-100 text-blue-800">
                Confirmed (ยืนยันแล้ว)
              </span>
            )}

            {st === 'Cancelled' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-block bg-rose-100 text-rose-800 border border-rose-300">
                Cancelled (ยกเลิกแล้ว)
              </span>
            )}

            {st === 'Pending' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-block bg-slate-100 text-slate-700">
                Pending (รอดำเนินการ)
              </span>
            )}

            {row.original.depositRefundedAmount !== undefined && row.original.depositRefundedAmount > 0 && (
              <p className="text-[10px] text-emerald-700 font-semibold">
                คืนมัดจำ: ฿{row.original.depositRefundedAmount.toLocaleString()}
              </p>
            )}
            {row.original.depositForfeitedAmount !== undefined && row.original.depositForfeitedAmount > 0 && (
              <p className="text-[10px] text-rose-700 font-semibold">
                ริบมัดจำ: ฿{row.original.depositForfeitedAmount.toLocaleString()}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'การจัดการ / สัญญา',
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => openPdfModal(b)}
              className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>พิมพ์ PDF</span>
            </button>

            {b.status === 'Cancellation Pending' && (
              <button
                type="button"
                onClick={() => setCancellingBooking(b)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-extrabold shadow-sm transition cursor-pointer animate-bounce"
              >
                <Search className="w-3.5 h-3.5" />
                <span>🔍 ตรวจสอบขอยกเลิก</span>
              </button>
            )}

            {b.status === 'Cancelled (Refund Pending)' && (
              <button
                type="button"
                onClick={() => setCancellingBooking(b)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-extrabold shadow-sm transition cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>💸 โอนคืนมัดจำ & แนบสลิป</span>
              </button>
            )}

            {b.status === 'Cancelled (Refund Completed)' && (
              <button
                type="button"
                onClick={() => setViewingSlipBooking(b)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-extrabold transition cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>🧾 ดูสลิปคืนเงิน</span>
              </button>
            )}

            {(b.status === 'Active' || b.status === 'Confirmed' || b.status === 'Pending') && (
              <button
                type="button"
                onClick={() => setCancellingBooking(b)}
                className="flex items-center space-x-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>ยกเลิกจอง</span>
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // New booking form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('Sedan 1.5L');
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-04');
  const [pickupBranch, setPickupBranch] = useState<string>('สาขาสุวรรณภูมิ');
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState<string | null>(null);
  const [includeInsurance, setIncludeInsurance] = useState<boolean>(true);
  const [signatureData, setSignatureData] = useState<string>('');

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Auto assign vehicle when category changes
  const handleCategoryOrCustomerChange = (cat: VehicleCategory) => {
    setSelectedCategory(cat);
    const assigned = getSmartAssignedVehicle(vehicles, cat);
    setAssignedVehicle(assigned);
  };

  // Calculate rental days & dynamic rates
  const rentDurationDays = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24))
  );

  const rawDailyRate = assignedVehicle ? assignedVehicle.dailyRate : 1500;
  const pricing = calculateRentalPricing(rawDailyRate, rentDurationDays);
  const baseAmount = pricing.baseAmount;
  const deposit = calculateSecurityDeposit(selectedCategory, currentCustomer?.tier);

  // Waterfall Coupon validation test
  const handleApplyCoupon = () => {
    setCouponError(null);
    setCouponSuccessMsg(null);
    if (!couponCodeInput.trim()) return;

    const foundCoupon = coupons.find((c) => c.code.toUpperCase() === couponCodeInput.trim().toUpperCase());
    if (!foundCoupon) {
      setCouponError('ไม่พบรหัสคูปองนี้ในระบบ');
      setAppliedCoupon(null);
      return;
    }

    if (!currentCustomer) return;

    const validation = validateCouponWaterfall(foundCoupon, {
      rentDurationDays,
      baseRentAmount: baseAmount,
      vehicleCategory: selectedCategory,
      bookingDateStr: startDate,
      customer: currentCustomer,
      selectedAddonsTotal: includeInsurance ? 300 * rentDurationDays : 0,
    });

    if (!validation.isValid) {
      setCouponError(`[Waterfall Rules Check Error] ${validation.errorMessage}`);
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(foundCoupon);
      setCouponSuccessMsg(`ประยุกต์ใช้คูปองส่วนลด ${foundCoupon.name} สำเร็จ! (-${validation.discountAmount.toLocaleString()} THB)`);
    }
  };

  // Pricing breakdown
  let discountAmount = 0;
  if (appliedCoupon) {
    const val = validateCouponWaterfall(appliedCoupon, {
      rentDurationDays,
      baseRentAmount: baseAmount,
      vehicleCategory: selectedCategory,
      bookingDateStr: startDate,
      customer: currentCustomer!,
      selectedAddonsTotal: includeInsurance ? 300 * rentDurationDays : 0,
    });
    discountAmount = val.discountAmount;
  }

  const addonsAmount = includeInsurance ? 300 * rentDurationDays : 0;
  const taxableSubtotal = Math.max(0, baseAmount - discountAmount + addonsAmount);
  const vatAmount = Math.round(taxableSubtotal * 0.07 * 100) / 100;
  const grandTotal = taxableSubtotal + vatAmount;

  const baseDeposit = deposit.effectiveDeposit;

  const pointsEarned = currentCustomer
    ? calculateLoyaltyPoints(baseAmount - discountAmount + addonsAmount, currentCustomer.tier, true, false)
    : 0;

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedVehicle) {
      alert('ไม่พบรถว่างในหมวดหมู่นี้ กรุณาเลือกหมวดใหม่อื่น');
      return;
    }

    const conflict = checkBookingConflict(
      bookings,
      assignedVehicle.id,
      startDate,
      endDate
    );

    if (conflict.hasConflict) {
      alert(`[Booking Conflict Warning] รถทะเบียน ${assignedVehicle.plateNumber} มีการจองซ้อนในช่วงเวลา ${conflict.conflictingBooking?.startDate} ถึง ${conflict.conflictingBooking?.endDate}`);
      return;
    }

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      bookingCode: `DRV-202607-${Math.floor(100 + Math.random() * 900)}`,
      customerId: selectedCustomerId,
      customerName: currentCustomer?.fullName || 'ลูกค้าทั่วไป',
      vehicleId: assignedVehicle.id,
      vehiclePlate: assignedVehicle.plateNumber,
      vehicleModel: assignedVehicle.brand + ' ' + assignedVehicle.model,
      vehicleCategory: selectedCategory,
      startDate,
      endDate,
      pickupBranch,
      dropoffBranch: pickupBranch,
      status: 'Confirmed',
      dailyRate: pricing.effectiveDailyRate,
      totalDays: rentDurationDays,
      baseAmount,
      appliedCouponCode: appliedCoupon?.code,
      discountAmount,
      addons: includeInsurance
        ? [{ id: 'ad-1', name: 'ประกันภัย No-Deductible', dailyPrice: 300, selected: true }]
        : [],
      addonsAmount,
      vatAmount,
      depositAmount: baseDeposit,
      grandTotal,
      pointsEarned,
      signatureDataUrl: signatureData,
      createdDate: new Date().toISOString().split('T')[0],
    };

    onAddBooking(newBooking);
    setShowNewBookingModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                การจัดการการจอง & สัญญาเช่า (Bookings & Contracts)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ระบบจัดการสัญญาจอง Smart Assignment รถยนต์ และอนุมัติการยกเลิกคืนเงินมัดจำ 2 ขั้นตอน
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            handleCategoryOrCustomerChange('Sedan 1.5L');
            setShowNewBookingModal(true);
          }}
          className="flex items-center justify-center space-x-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold transition shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างสัญญาจองใหม่ (New Contract)</span>
        </button>
      </div>

      {/* Filter Tabs Banner */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterTab('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            filterTab === 'All'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>รายการจองทั้งหมด</span>
          <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-md ml-1">
            {bookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('Cancellation Pending')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            filterTab === 'Cancellation Pending'
              ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
              : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
          }`}
        >
          <Hourglass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>คำขอยกเลิกรอตรวจสอบ</span>
          {pendingCancelCount > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse ml-1">
              {pendingCancelCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('Refund Pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            filterTab === 'Refund Pending'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>อนุมัติแล้วรอโอนคืนมัดจำ</span>
          {refundPendingCount > 0 && (
            <span className="bg-sky-200 text-sky-900 text-[10px] font-bold px-1.5 py-0.2 rounded-md ml-1">
              {refundPendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('Refund Completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            filterTab === 'Refund Completed'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>คืนเงินสำเร็จเสร็จสิ้น</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('Active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            filterTab === 'Active'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>สัญญาจองที่ใช้งานอยู่</span>
        </button>
      </div>

      {/* Bookings Data Table */}
      <TanStackDataTable
        columns={bookingColumns}
        data={filteredBookings}
        searchPlaceholder="ค้นหาด้วยรหัสจอง, ชื่อลูกค้า, รุ่นรถ, ทะเบียนรถ..."
      />

      {/* New Booking Modal */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden my-8 relative">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">สร้างสัญญาจองใหม่ (New Contract Entry)</h3>
              <button
                type="button"
                onClick={() => setShowNewBookingModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Select Customer */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  1. เลือกผู้เช่า / ลูกค้า (Customer Selection)
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.tier} Tier - แต้มสะสม {c.pointsBalance} pt) {c.isBlacklisted ? '🔴 [ติด BLACKLIST]' : ''}
                    </option>
                  ))}
                </select>

                {currentCustomer?.isBlacklisted && (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1">
                    ⚠️ ลูกค้ารายนี้ติด BLACKLIST: {currentCustomer.blacklistReason} (ไม่อนุญาตให้ออกสัญญา)
                  </p>
                )}
              </div>

              {/* Select Category for Smart Assign */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  2. เลือกหมวดหมู่รถยนต์ (Smart Assignment Rule)
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryOrCustomerChange(e.target.value as VehicleCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Sedan 1.5L">Sedan 1.5L (เช่น City, Civic)</option>
                  <option value="Compact">Compact (เช่น Yaris)</option>
                  <option value="SUV">SUV (เช่น Fortuner)</option>
                  <option value="Van">Van (เช่น Commuter)</option>
                  <option value="Luxury">Luxury (เช่น BMW 530e)</option>
                  <option value="EV / Eco">EV / Eco (เช่น BYD Atto 3)</option>
                </select>

                {assignedVehicle ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs flex justify-between items-center text-emerald-900 mt-2">
                    <div>
                      <span className="font-extrabold text-emerald-950 block">
                        🚗 ระบบจับคู่รถให้อัตโนมัติ: {assignedVehicle.brand} {assignedVehicle.model}
                      </span>
                      <span className="text-[11px] text-emerald-800">
                        ทะเบียน: {assignedVehicle.plateNumber} | อัตราค่าเช่าฐาน: ฿{assignedVehicle.dailyRate.toLocaleString()}/วัน
                      </span>
                    </div>
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      พร้อมใช้งาน
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-rose-600 font-bold mt-1">
                    ❌ ไม่มีรถว่างในหมวดหมู่นี้ในขณะนี้
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">วันที่เริ่มเช่า</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">วันที่คืนรถ</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Coupon Waterfall test input */}
              <div className="space-y-1 border-t border-slate-200 pt-3">
                <label className="block text-xs font-bold text-slate-800">
                  3. คูปองส่วนลดพิเศษ (Waterfall Validation Rule Test)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="ใส่รหัส เช่น DRIVE15, SAVE500, PAY2GET3..."
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                  >
                    ตรวจสอบคูปอง
                  </button>
                </div>

                {couponError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {couponError}
                  </p>
                )}
                {couponSuccessMsg && (
                  <p className="text-xs text-emerald-700 font-bold mt-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    {couponSuccessMsg}
                  </p>
                )}
              </div>

              {/* Addons */}
              <div className="space-y-1">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeInsurance}
                    onChange={(e) => setIncludeInsurance(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>เพิ่มประกันภัย No-Deductible Waiver (300 THB/วัน)</span>
                </label>
              </div>

              {/* Dynamic Calculation summary */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>ค่าเช่าฐาน ({rentDurationDays} วัน @ ฿{pricing.effectiveDailyRate.toLocaleString()}/วัน):</span>
                  <span>{baseAmount.toLocaleString()} THB</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>ส่วนลดคูปอง ({appliedCoupon?.code}):</span>
                    <span>-{discountAmount.toLocaleString()} THB</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>ประกันภัย No-Deductible (300 THB/วัน):</span>
                  <span>{addonsAmount.toLocaleString()} THB</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ภาษีมูลค่าเพิ่ม VAT 7%:</span>
                  <span>{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between font-extrabold text-sm text-white">
                  <span>ยอดเงินชำระสุทธิ (Grand Total):</span>
                  <span className="text-indigo-300">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-300 pt-1">
                  <span>เงินมัดจำ (Security Deposit - Tier Privilege):</span>
                  <span>{baseDeposit > 0 ? `${baseDeposit.toLocaleString()} THB` : 'ยกเว้นมัดจำ (Platinum Privilege)'}</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  * สัญญานี้จะได้รับคะแนนสะสม loyalty <strong className="text-amber-400">+{pointsEarned} คะแนน</strong>
                </div>
              </div>

              {/* Digital Signature Pad */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  5. ลงลายมือชื่อผู้เช่าในสัญญาดิจิทัล (Digital Signature)
                </label>
                <SignaturePad onSave={(data) => setSignatureData(data)} />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-pointer hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={currentCustomer?.isBlacklisted || !assignedVehicle}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
                >
                  อนุมัติสัญญาเช่า & ออกเอกสาร
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PDF View Modal */}
      {activePdfDoc && (
        <PdfDocumentViewer
          type={activePdfDoc.type}
          booking={activePdfDoc.booking}
          customer={customers.find((c) => c.id === activePdfDoc.booking.customerId)}
          vehicle={vehicles.find((v) => v.id === activePdfDoc.booking.vehicleId)}
          onClose={() => setActivePdfDoc(null)}
        />
      )}

      {/* Admin Cancel Booking & Approval Modal */}
      {cancellingBooking && (
        <CancelBookingModal
          isOpen={!!cancellingBooking}
          booking={cancellingBooking}
          customer={customers.find((c) => c.id === cancellingBooking.customerId)}
          onClose={() => setCancellingBooking(null)}
          onApproveCancellation={(id, forfeit, refund, reason, note) => {
            onApproveCancellation(id, forfeit, refund, reason, note);
          }}
          onCompleteRefund={(id, slipUrl, note) => {
            onCompleteRefund(id, slipUrl, note);
            setCancellingBooking(null);
          }}
        />
      )}

      {/* Refund Slip Viewer Modal */}
      {viewingSlipBooking && (
        <RefundSlipModal
          isOpen={!!viewingSlipBooking}
          booking={viewingSlipBooking}
          onClose={() => setViewingSlipBooking(null)}
        />
      )}

    </div>
  );
};
