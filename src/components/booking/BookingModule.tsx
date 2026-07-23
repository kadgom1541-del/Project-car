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
import { SignaturePad } from '../common/SignaturePad';
import { PdfDocumentViewer } from '../pdf/PdfDocumentViewer';
import { Calendar, Plus, FileText, CheckCircle, AlertTriangle, ShieldCheck, Tag, DollarSign, Printer, Zap } from 'lucide-react';

interface BookingModuleProps {
  bookings: Booking[];
  vehicles: Vehicle[];
  customers: Customer[];
  coupons: Coupon[];
  onAddBooking: (newBooking: Booking) => void;
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
}

export const BookingModule: React.FC<BookingModuleProps> = ({
  bookings,
  vehicles,
  customers,
  coupons,
  onAddBooking,
  onUpdateBookingStatus,
}) => {
  const { openPdfModal } = useErpStore();
  const [showNewBookingModal, setShowNewBookingModal] = useState<boolean>(false);
  const [activePdfDoc, setActivePdfDoc] = useState<{
    type: 'Contract' | 'Voucher' | 'TaxInvoice' | 'Inspection';
    booking: Booking;
  } | null>(null);

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
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
              st === 'Active'
                ? 'bg-emerald-100 text-emerald-800'
                : st === 'Confirmed'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {st}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'ออกเอกสาร PDF',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => openPdfModal(row.original)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>พิมพ์ / PDF</span>
        </button>
      ),
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

  // Calculate rental days & dynamic rates (Daily / Weekly / Monthly)
  const rentDurationDays = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24))
  );

  const rawDailyRate = assignedVehicle ? assignedVehicle.dailyRate : 1500;
  const pricing = calculateRentalPricing(rawDailyRate, rentDurationDays);
  const baseAmount = pricing.baseAmount;
  const dailyRate = pricing.effectiveDailyRate;

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

    if (!currentCustomer) return;
    if (currentCustomer.isBlacklisted) {
      alert(`ไม่สามารถทำการจองได้ เนื่องจากลูกค้ารายนี้ติด Blacklist: ${currentCustomer.blacklistReason}`);
      return;
    }

    if (!assignedVehicle) {
      alert('ไม่พบรถว่างในกลุ่มนี้ กรุณาเปลี่ยนกลุ่มรถ');
      return;
    }

    const newBk: Booking = {
      id: `bk-${Date.now().toString().slice(-5)}`,
      bookingCode: `DRV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: currentCustomer.id,
      customerName: currentCustomer.fullName,
      vehicleId: assignedVehicle.id,
      vehiclePlate: assignedVehicle.plateNumber,
      vehicleModel: `${assignedVehicle.brand} ${assignedVehicle.model}`,
      vehicleCategory: selectedCategory,
      startDate,
      endDate,
      pickupBranch,
      dropoffBranch: pickupBranch,
      status: 'Confirmed',
      dailyRate,
      totalDays: rentDurationDays,
      baseAmount,
      appliedCouponCode: appliedCoupon?.code,
      discountAmount,
      addons: [{ id: 'ad-1', name: 'ประกันภัย No-Deductible', dailyPrice: 300, selected: includeInsurance }],
      addonsAmount,
      vatAmount,
      depositAmount: baseDeposit,
      grandTotal,
      pointsEarned,
      signatureDataUrl: signatureData,
      contractSignedAt: new Date().toISOString(),
      createdDate: new Date().toISOString().split('T')[0],
    };

    onAddBooking(newBk);
    setShowNewBookingModal(false);
    // Auto show contract preview
    setActivePdfDoc({ type: 'Contract', booking: newBk });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">การจอง จัดทำสัญญาเช่า และออกเอกสาร (Booking & Contracts)</h2>
            <p className="text-xs text-slate-500">ระบบ Smart Vehicle Assignment, ตรวจ Blacklist, คำนวณคูปอง และออก PDF</p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowNewBookingModal(true);
            handleCategoryOrCustomerChange(selectedCategory);
          }}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างการจองใหม่ (New Booking)</span>
        </button>
      </div>

      {/* TanStack Bookings Table */}
      <TanStackDataTable
        data={bookings}
        columns={bookingColumns}
        title="ตารางสัญญาเช่ารถยนต์ (TanStack Data Grid)"
        subtitle="รองรับการค้นหารายการจอง ค้นหาตามชื่อผู้เช่า/รุ่นรถ/รหัสการจอง และพิมพ์เอกสาร PDF ได้ทันที"
        searchPlaceholder="ค้นหาตามรหัสการจอง ชื่อผู้เช่า หรือรุ่นรถ..."
        exportFileName="booking-agreements.csv"
      />

      {/* New Booking Wizard Modal */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <form onSubmit={handleCreateBooking} className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Booking & Rental Contract Engine</span>
                <h3 className="font-bold text-lg text-slate-900">ทำรายการจองและออกสัญญาเช่าใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* 1. Customer Selection & Blacklist Check */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">1. เลือกลูกค้าผู้เช่า (Customer & Blacklist Risk Scan)</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.tier} Tier) - {c.isBlacklisted ? '🚨 BLACKLISTED' : 'พร้อมเช่า'}
                  </option>
                ))}
              </select>

              {currentCustomer?.isBlacklisted && (
                <div className="bg-rose-50 border border-rose-300 p-3 rounded-xl flex items-center space-x-2 text-rose-800 text-xs">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold">ปฏิเสธการทำรายการ (Blacklist Warning):</span>
                    <p>{currentCustomer.blacklistReason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Vehicle Category & Smart Assignment */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">2. เลือกรุ่มกลุ่มรถ (Category)</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryOrCustomerChange(e.target.value as VehicleCategory)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Sedan 1.5L">Sedan 1.5L</option>
                  <option value="Compact">Compact</option>
                  <option value="SUV">SUV</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Van">Van</option>
                  <option value="EV / Eco">EV / Eco</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">สาขารับ-คืนรถ</label>
                <select
                  value={pickupBranch}
                  onChange={(e) => setPickupBranch(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="สาขาสุวรรณภูมิ">สาขาสุวรรณภูมิ (Main Hub)</option>
                  <option value="สาขาดอนเมือง">สาขาดอนเมือง</option>
                  <option value="สาขาเชียงใหม่">สาขาเชียงใหม่</option>
                  <option value="สาขาภูเก็ต">สาขาภูเก็ต</option>
                </select>
              </div>
            </div>

            {/* Smart Vehicle Assignment Preview */}
            {assignedVehicle ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Smart Auto-Assigned Vehicle:</span>
                    <p>{assignedVehicle.brand} {assignedVehicle.model} (ทะเบียน: {assignedVehicle.plateNumber})</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{assignedVehicle.dailyRate.toLocaleString()} THB/วัน</p>
                  <p className="text-[10px] text-emerald-700">เลขไมล์ต่ำสุด: {assignedVehicle.currentOdometer.toLocaleString()} กม.</p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 text-xs">
                ไม่พบรถว่างในกลุ่มนี้
              </div>
            )}

            {/* 3. Dates */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">วันเริ่มสัญญา</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">วันสิ้นสุดสัญญา ({rentDurationDays} วัน)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* 4. Coupon Waterfall Validation Input */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>รหัสคูปองส่วนลด (Coupon Engine Waterfall Rules)</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="เช่น DRIVE15, SAVE500, PAY2GET3"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  className="flex-1 p-2 border border-slate-200 rounded-xl text-xs uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ตรวจสอบเงื่อนไข
                </button>
              </div>

              {couponError && (
                <p className="text-xs text-rose-600 font-medium">{couponError}</p>
              )}
              {couponSuccessMsg && (
                <p className="text-xs text-emerald-600 font-bold">{couponSuccessMsg}</p>
              )}
            </div>

            {/* Price Summary Calculation */}
            <div className="bg-slate-900 text-white p-4 rounded-xl text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>ค่าเช่าฐาน ({rentDurationDays} วัน x {dailyRate.toLocaleString()} THB):</span>
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
                * สัญญานี้จะได้รับคะแนนสะสม loyalty <strong className="text-amber-400">+{pointsEarned} คะแนน</strong> (อัตราสะสม 100 บาท = 1 คะแนน x Tier Multiplier)
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

    </div>
  );
};
