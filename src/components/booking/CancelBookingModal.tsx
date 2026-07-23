import React, { useState } from 'react';
import { Booking, Customer } from '../../types/erp';
import { AlertTriangle, X, ShieldAlert, Zap, ArrowRight, RotateCcw, DollarSign, CheckCircle2 } from 'lucide-react';

interface CancelBookingModalProps {
  isOpen: boolean;
  booking: Booking | null;
  customer?: Customer | null;
  onClose: () => void;
  onConfirmCancel: (
    bookingId: string,
    forfeitDepositAmount: number,
    cancelReason: string
  ) => void;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  booking,
  customer,
  onClose,
  onConfirmCancel,
}) => {
  if (!isOpen || !booking) return null;

  const [cancelReason, setCancelReason] = useState<string>('เปลี่ยนแผนการเดินทาง');
  const [customReason, setCustomReason] = useState<string>('');
  const [depositOption, setDepositOption] = useState<'full' | 'partial' | 'refund'>('full');
  const [customForfeitAmount, setCustomForfeitAmount] = useState<number>(booking.depositAmount);

  const depositAmount = booking.depositAmount || 0;

  let forfeitAmount = depositAmount;
  if (depositOption === 'refund') {
    forfeitAmount = 0;
  } else if (depositOption === 'partial') {
    forfeitAmount = Math.min(depositAmount, Math.max(0, customForfeitAmount));
  }
  const refundAmount = Math.max(0, depositAmount - forfeitAmount);

  const finalReason = cancelReason === 'อื่นๆ' ? customReason || 'ยกเลิกการจอง' : cancelReason;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmCancel(booking.id, forfeitAmount, finalReason);
    onClose();
  };

  const pointsEarned = booking.pointsEarned || 0;
  const currentPoints = customer?.pointsBalance ?? 0;
  const newPointsAfterCancel = Math.max(0, currentPoints - pointsEarned);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden relative my-8">
        
        {/* Modal Header */}
        <div className="bg-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-rose-800/80 rounded-xl flex items-center justify-center text-white border border-rose-500/30">
              <ShieldAlert className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                ยกเลิกการจอง & หักเงินมัดจำ
              </h3>
              <p className="text-xs text-rose-100 font-mono">
                รหัสจอง: {booking.bookingCode} | {booking.vehicleModel} ({booking.vehiclePlate})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-rose-200 hover:text-white bg-rose-800/50 hover:bg-rose-800 p-2 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Booking Context Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>ผู้เช่า / ลูกค้า:</span>
              <span className="font-bold text-slate-900">{booking.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ช่วงเวลาเช่า:</span>
              <span className="font-medium text-slate-800">{booking.startDate} ถึง {booking.endDate} ({booking.totalDays} วัน)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ยอดค่าเช่ารวม:</span>
              <span className="font-bold text-slate-900">฿{booking.grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ยอดเงินมัดจำประกันความเสียหาย:</span>
              <span className="font-extrabold text-rose-600">฿{depositAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Cancellation Reason Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              สาเหตุการยกเลิกการจอง <span className="text-rose-500">*</span>
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="เปลี่ยนแผนการเดินทาง">เปลี่ยนแผนการเดินทาง / ยกเลิกทริป</option>
              <option value="ปัญหาส่วนตัว / สุขภาพ">ปัญหาส่วนตัว / สุขภาพ</option>
              <option value="จองผิดรุ่นรถหรือผิดวันที่">จองผิดรุ่นรถหรือผิดวันที่</option>
              <option value="พบปัญหาระบบการชำระเงินมัดจำ">พบปัญหาระบบการชำระเงินมัดจำ</option>
              <option value="อื่นๆ">อื่นๆ (ระบุเพิ่มเติม)</option>
            </select>

            {cancelReason === 'อื่นๆ' && (
              <input
                type="text"
                placeholder="ระบุสาเหตุเพิ่มเติม..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
                className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500"
              />
            )}
          </div>

          {/* Security Deposit Forfeiture Handling */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800">
              กำหนดการจัดการเงินมัดจำประกันความเสียหาย (Deposit Handling)
            </label>

            <div className="space-y-2">
              {/* Option 1: Forfeit 100% */}
              <label className={`flex items-start p-3 border rounded-xl cursor-pointer transition ${
                depositOption === 'full'
                  ? 'bg-rose-50/70 border-rose-400 ring-1 ring-rose-400'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="depositOption"
                  checked={depositOption === 'full'}
                  onChange={() => setDepositOption('full')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div className="ml-2.5 text-xs">
                  <p className="font-bold text-rose-900">
                    🔴 หักเงินมัดจำเต็มจำนวน (Forfeit 100% Deposit - ฿{depositAmount.toLocaleString()})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ยึดมัดจำเพื่อชดเชยการเสียโอกาสจากการยกเลิกกระทันหัน (คืนเงินลูกค้า ฿0)
                  </p>
                </div>
              </label>

              {/* Option 2: Partial Forfeit */}
              <label className={`flex items-start p-3 border rounded-xl cursor-pointer transition ${
                depositOption === 'partial'
                  ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-400'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="depositOption"
                  checked={depositOption === 'partial'}
                  onChange={() => setDepositOption('partial')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div className="ml-2.5 text-xs w-full">
                  <p className="font-bold text-amber-900">
                    🟡 หักมัดจำบางส่วน (Partial Deposit Forfeit)
                  </p>
                  {depositOption === 'partial' && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-slate-600 text-[11px]">จำนวนเงินที่จะหัก:</span>
                      <input
                        type="number"
                        min={0}
                        max={depositAmount}
                        value={customForfeitAmount}
                        onChange={(e) => setCustomForfeitAmount(Number(e.target.value))}
                        className="w-28 bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-slate-600 text-[11px]">บาท (คืนลูกค้า ฿{refundAmount.toLocaleString()})</span>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 3: Full Refund */}
              <label className={`flex items-start p-3 border rounded-xl cursor-pointer transition ${
                depositOption === 'refund'
                  ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="depositOption"
                  checked={depositOption === 'refund'}
                  onChange={() => setDepositOption('refund')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="ml-2.5 text-xs">
                  <p className="font-bold text-emerald-900">
                    🟢 คืนเงินมัดจำเต็มจำนวน (Full Refund - ฿{depositAmount.toLocaleString()})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ไม่หักเงินมัดจำ คืนเงินมัดจำเต็ม 100% ให้ลูกค้า
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Automatic System Deductions Notice (AUTO REVERSAL) */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center space-x-1.5 text-amber-900 font-extrabold text-xs">
              <Zap className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>สรุปการทำรายการปรับเปลี่ยนระบบอัตโนมัติ (AUTO)</span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-700">
              
              {/* Point Reversal Notice */}
              <div className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-amber-200/60">
                <div className="flex items-center space-x-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span><strong>หักแต้มสะสมคืน AUTO:</strong></span>
                </div>
                <span className="font-bold text-rose-600">-{pointsEarned} แต้ม</span>
              </div>

              {/* Vehicle Release Notice */}
              <div className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-amber-200/60">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span><strong>ปรับสถานะรถยนต์ AUTO:</strong></span>
                </div>
                <span className="font-bold text-emerald-700">{booking.vehicleModel} → พร้อมให้เช่า</span>
              </div>

              {/* Deposit Forfeit Breakdown */}
              <div className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-amber-200/60">
                <div className="flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  <span><strong>ยอดริบมัดจำสุทธิ:</strong></span>
                </div>
                <span className="font-extrabold text-slate-900">฿{forfeitAmount.toLocaleString()} (คืนเงินลูกค้า ฿{refundAmount.toLocaleString()})</span>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              ยกเลิก / ปิดหน้าต่าง
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-rose-600/20 flex items-center space-x-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>ยืนยันการยกเลิกจอง & หักมัดจำ</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
