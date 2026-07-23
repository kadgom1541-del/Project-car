import React, { useState, useEffect } from 'react';
import { Booking, Customer } from '../../types/erp';
import { calculateCancellationPolicy } from '../../utils/cancellationPolicy';
import {
  ShieldAlert,
  X,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Building,
  CreditCard,
  Sparkles,
  Upload,
  Receipt,
  FileCheck,
  RotateCcw,
  DollarSign,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface CancelBookingModalProps {
  isOpen: boolean;
  booking: Booking | null;
  customer?: Customer | null;
  onClose: () => void;
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

// Mock sample slip images for fast demo testing
const SAMPLE_SLIPS = [
  {
    name: 'สลิป KBank โอนเงินคืนสำเร็จ',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'สลิป SCB PromptPay โอนคืนสำเร็จ',
    url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=500&q=80',
  },
];

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  booking,
  customer,
  onClose,
  onApproveCancellation,
  onCompleteRefund,
}) => {
  if (!isOpen || !booking) return null;

  // Smart policy recommendation
  const policy = calculateCancellationPolicy(booking);

  // Modal tab / step mode:
  // Step 1: Review & Approve Cancellation (Unlocks Car)
  // Step 2: Upload Refund Slip & Complete Refund
  const [activeStep, setActiveStep] = useState<'step1_approval' | 'step2_refund_slip'>(
    booking.status === 'Cancelled (Refund Pending)' ? 'step2_refund_slip' : 'step1_approval'
  );

  useEffect(() => {
    if (booking.status === 'Cancelled (Refund Pending)') {
      setActiveStep('step2_refund_slip');
    } else {
      setActiveStep('step1_approval');
    }
  }, [booking.status]);

  // Form states for Step 1
  const [depositOption, setDepositOption] = useState<'policy' | 'full_refund' | 'full_forfeit' | 'custom'>(
    policy.refundPercentage === 100
      ? 'full_refund'
      : policy.forfeitPercentage === 100
      ? 'full_forfeit'
      : 'policy'
  );
  const [customForfeit, setCustomForfeit] = useState<number>(policy.suggestedForfeitAmount);
  const [cancelReason, setCancelReason] = useState<string>(
    booking.cancelReason || 'เปลี่ยนแผนการเดินทาง / ยกเลิกทริป'
  );
  const [adminNote, setAdminNote] = useState<string>(booking.refundAdminNote || '');

  // Form states for Step 2
  const [refundSlipUrl, setRefundSlipUrl] = useState<string>(
    booking.refundSlipUrl || SAMPLE_SLIPS[0].url
  );

  const depositAmount = booking.depositAmount || 0;

  // Calculate chosen forfeit & refund amounts
  let forfeitAmount = policy.suggestedForfeitAmount;
  let refundAmount = policy.suggestedRefundAmount;

  if (depositOption === 'full_refund') {
    forfeitAmount = 0;
    refundAmount = depositAmount;
  } else if (depositOption === 'full_forfeit') {
    forfeitAmount = depositAmount;
    refundAmount = 0;
  } else if (depositOption === 'custom') {
    forfeitAmount = Math.min(depositAmount, Math.max(0, customForfeit));
    refundAmount = Math.max(0, depositAmount - forfeitAmount);
  }

  // Handle Step 1 Submit (Approve Cancellation & Release Car)
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    onApproveCancellation(
      booking.id,
      forfeitAmount,
      refundAmount,
      cancelReason,
      adminNote
    );
    // Move to step 2 directly
    setActiveStep('step2_refund_slip');
  };

  // Handle Step 2 Submit (Upload Slip & Complete Case)
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    onCompleteRefund(booking.id, refundSlipUrl, adminNote);
    onClose();
  };

  // Handle local file upload convert to base64 data url
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setRefundSlipUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden relative my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white border border-rose-400/30">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">
                  ระบบตรวจสอบ & อนุมัติการยกเลิกจอง
                </h3>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Admin Approval Workflow
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                รหัสจอง: {booking.bookingCode} | {booking.vehicleModel} ({booking.vehiclePlate})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-white/10 p-2 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workflow Progress Stepper (2-Step Approval) */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setActiveStep('step1_approval')}
            className={`flex items-center space-x-2 font-bold transition cursor-pointer ${
              activeStep === 'step1_approval' ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
              activeStep === 'step1_approval' ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              1
            </span>
            <span>ขั้นตอนที่ 1: ตรวจสอบ & ปลดล็อกรถยนต์</span>
          </button>

          <ArrowRight className="w-4 h-4 text-slate-400" />

          <button
            type="button"
            onClick={() => setActiveStep('step2_refund_slip')}
            className={`flex items-center space-x-2 font-bold transition cursor-pointer ${
              activeStep === 'step2_refund_slip' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
              activeStep === 'step2_refund_slip' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
            }`}>
              2
            </span>
            <span>ขั้นตอนที่ 2: โอนเงินคืน & แนบสลิป</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Customer Requested Information Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>ผู้เช่า / ลูกค้า:</span>
              <span className="font-bold text-slate-900">{booking.customerName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>ช่วงเวลาเช่า:</span>
              <span className="font-medium text-slate-800">{booking.startDate} ถึง {booking.endDate} ({booking.totalDays} วัน)</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>เงินมัดจำประกันความเสียหาย:</span>
              <span className="font-extrabold text-slate-900">฿{depositAmount.toLocaleString()} THB</span>
            </div>

            {/* Bank details if provided by customer */}
            {booking.bankAccountNumber ? (
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 space-y-1 mt-2">
                <div className="flex items-center space-x-1.5 font-extrabold text-indigo-900 text-[11px]">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>บัญชีรับเงินคืนที่ลูกค้าระบุ:</span>
                </div>
                <div className="text-[11px] text-slate-700 flex justify-between">
                  <span>ธนาคาร: <strong>{booking.bankName || 'KBank'}</strong></span>
                  <span>ชื่อบัญชี: <strong>{booking.bankAccountName || booking.customerName}</strong></span>
                </div>
                <div className="text-xs font-mono font-extrabold text-indigo-900 pt-0.5">
                  เลขบัญชี / PromptPay: {booking.bankAccountNumber}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic pt-1">
                * ลูกค้ายังไม่ได้ระบุเลขบัญชีผ่านระบบหน้าร้าน (หรือทำรายการยกเลิกโดยตรงโดยเจ้าหน้าที่)
              </div>
            )}
          </div>

          {/* STEP 1: APPROVAL & CAR RELEASE FORM */}
          {activeStep === 'step1_approval' && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              
              {/* Smart Suggestion Calculation Card */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-950 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>คำนวณนโยบายระบบอัตโนมัติ (Smart Suggestion)</span>
                  </span>
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    นโยบายร้าน
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {policy.policySummary}
                </p>

                <div className="flex items-center space-x-4 text-xs pt-1 border-t border-amber-200/80">
                  <div className="text-slate-700">
                    แนะนำคืนเงิน: <strong className="text-emerald-700 font-extrabold">฿{policy.suggestedRefundAmount.toLocaleString()}</strong>
                  </div>
                  <div className="text-slate-700">
                    แนะนำริบมัดจำ: <strong className="text-rose-700 font-extrabold">฿{policy.suggestedForfeitAmount.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Deposit Forfeit / Refund Manual Override Options */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  การจัดการเงินมัดจำจริง (Admin Manual Override)
                </label>

                <div className="space-y-2 text-xs">
                  {/* Option Policy */}
                  <label className={`flex items-start p-3 border rounded-xl cursor-pointer transition ${
                    depositOption === 'policy'
                      ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="depositOpt"
                      checked={depositOption === 'policy'}
                      onChange={() => setDepositOption('policy')}
                      className="mt-0.5 text-amber-600"
                    />
                    <div className="ml-2.5">
                      <p className="font-bold text-amber-900">
                        ⚡ ใช้การคำนวณตามนโยบายอัตโนมัติ ({policy.policyTierName})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        คืนมัดจำ ฿{policy.suggestedRefundAmount.toLocaleString()} | ยึดมัดจำ ฿{policy.suggestedForfeitAmount.toLocaleString()}
                      </p>
                    </div>
                  </label>

                  {/* Option Full Refund */}
                  <label className={`flex items-start p-3 border rounded-xl cursor-pointer transition ${
                    depositOption === 'full_refund'
                      ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="depositOpt"
                      checked={depositOption === 'full_refund'}
                      onChange={() => setDepositOption('full_refund')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div className="ml-2.5">
                      <p className="font-bold text-emerald-900">
                        🟢 อนุมัติคืนมัดจำเต็มจำนวน 100% (Full Refund - ฿{depositAmount.toLocaleString()})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        ไม่หักเงินมัดจำ โอนเงินคืนลูกค้าเต็ม 100%
                      </p>
                    </div>
                  </label>

                  {/* Option Full Forfeit */}
                  <label className={`flex items-start p-3 border rounded-xl cursor-pointer transition ${
                    depositOption === 'full_forfeit'
                      ? 'bg-rose-50/80 border-rose-400 ring-1 ring-rose-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="depositOpt"
                      checked={depositOption === 'full_forfeit'}
                      onChange={() => setDepositOption('full_forfeit')}
                      className="mt-0.5 text-rose-600"
                    />
                    <div className="ml-2.5">
                      <p className="font-bold text-rose-900">
                        🔴 ยึดเงินมัดจำเต็มจำนวน 100% (Full Forfeit - ฿{depositAmount.toLocaleString()})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        ยึดมัดจำชดเชยความเสียหาย คืนเงินลูกค้า ฿0
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Admin Note Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  หมายเหตุ / เหตุผลการอนุมัติสิทธิพิเศษโดยผู้จัดการ (Manager Note):
                </label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="เช่น ลูกค้ามีใบรับรองแพทย์ อนุญาตคืนมัดจำเต็มจำนวนเป็นกรณีพิเศษ..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Vehicle Release Benefit Box */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 flex items-center justify-between text-xs text-indigo-900">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>เมื่อกดอนุมัติ รถยนต์ <strong>{booking.vehicleModel}</strong> จะถูกปลดล็อกเปลี่ยนเป็น <strong>"พร้อมให้เช่า (Available)"</strong> ทันที</span>
                </div>
              </div>

              {/* Step 1 Actions */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition cursor-pointer shadow-md shadow-indigo-600/20 flex items-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>อนุมัติการยกเลิก & ปลดล็อกรถยนต์เข้าสต็อก</span>
                </button>
              </div>

            </form>
          )}

          {/* STEP 2: UPLOAD REFUND SLIP & COMPLETE REFUND FORM */}
          {activeStep === 'step2_refund_slip' && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs text-emerald-950">
                <div className="flex items-center space-x-2 font-extrabold text-sm text-emerald-900">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <span>โอนเงินคืนมัดจำสุทธิ: ฿{refundAmount.toLocaleString()} THB</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  เมื่อฝ่ายการเงินดำเนินการโอนเงินคืนเรียบร้อย ให้ทำการแนบสลิปโอนเงินเข้าสู่ระบบ แล้วกด "ยืนยันโอนเงินคืน & ปิดเคส" เพื่อส่งหลักฐานสลิปให้ลูกค้าดูผ่านหน้าเว็บ
                </p>
              </div>

              {/* Select or Upload Slip */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  อัปโหลด / เลือกรูปภาพสลิปการโอนเงิน (Transfer Slip):
                </label>

                {/* Upload Local File */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">คลิกที่นี่เพื่ออัปโหลดไฟล์สลิปจากเครื่อง</p>
                  <p className="text-[10px] text-slate-400">รองรับไฟล์ JPG, PNG, WEBP</p>
                </div>

                {/* Sample Slips Quick Choose */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    หรือเลือกตัวอย่างสลิปจำลองสำหรับทดสอบ:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_SLIPS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRefundSlipUrl(s.url)}
                        className={`p-2 border rounded-xl text-left text-[11px] font-bold transition flex items-center space-x-2 cursor-pointer ${
                          refundSlipUrl === s.url
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slip Preview Box */}
              {refundSlipUrl && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block">ตัวอย่างสลิปโอนเงินคืน:</span>
                  <div className="bg-slate-900 rounded-2xl p-2 flex items-center justify-center max-h-56 overflow-hidden">
                    <img
                      src={refundSlipUrl}
                      alt="Selected Slip Preview"
                      className="max-h-52 object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Step 2 Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep('step1_approval')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  &lt; ย้อนกลับไปขั้นตอนที่ 1
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition cursor-pointer shadow-md shadow-emerald-600/20 flex items-center space-x-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>ยืนยันการโอนเงินคืนมัดจำ & ปิดเคส</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
