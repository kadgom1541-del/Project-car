import React, { useState } from 'react';
import { Booking } from '../../types/erp';
import { X, ShieldAlert, AlertTriangle, Building2, CreditCard, Send, CheckCircle2, DollarSign } from 'lucide-react';

interface CustomerCancelModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSubmitRequest: (
    bookingId: string,
    reason: string,
    bankName: string,
    bankAccountName: string,
    bankAccountNumber: string
  ) => void;
}

const THAI_BANKS = [
  { code: 'KBANK', name: 'ธนาคารกสิกรไทย (KBank)' },
  { code: 'SCB', name: 'ธนาคารไทยพาณิชย์ (SCB)' },
  { code: 'BBL', name: 'ธนาคารกรุงเทพ (BBL)' },
  { code: 'KTB', name: 'ธนาคารกรุงไทย (KTB)' },
  { code: 'BAY', name: 'ธนาคารกรุงศรีอยุธยา (BAY)' },
  { code: 'TTB', name: 'ธนาคารทหารไทยธนชาต (ttb)' },
  { code: 'GSB', name: 'ธนาคารออมสิน' },
  { code: 'PROMPTPAY', name: 'พร้อมเพย์ (PromptPay)' },
];

export const CustomerCancelModal: React.FC<CustomerCancelModalProps> = ({
  isOpen,
  booking,
  onClose,
  onSubmitRequest,
}) => {
  if (!isOpen || !booking) return null;

  const [cancelReason, setCancelReason] = useState<string>('เปลี่ยนแผนการเดินทาง / ยกเลิกทริป');
  const [customReason, setCustomReason] = useState<string>('');
  const [bankName, setBankName] = useState<string>('ธนาคารกสิกรไทย (KBank)');
  const [bankAccountName, setBankAccountName] = useState<string>(booking.customerName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('');

  const finalReason = cancelReason === 'อื่นๆ' ? customReason || 'ยกเลิกการจอง' : cancelReason;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountNumber.trim()) {
      alert('กรุณาระบุเลขที่บัญชีธนาคาร หรือ เบอร์พร้อมเพย์ สำหรับรับเงินคืนมัดจำ');
      return;
    }

    onSubmitRequest(
      booking.id,
      finalReason,
      bankName,
      bankAccountName,
      bankAccountNumber
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden relative my-8">
        
        {/* Header */}
        <div className="bg-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-rose-800 rounded-xl flex items-center justify-center text-white border border-rose-500/30">
              <ShieldAlert className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">ส่งคำขอยกเลิกการจอง & คืนเงินมัดจำ</h3>
              <p className="text-xs text-rose-100 font-mono">
                รหัสจอง: {booking.bookingCode} | {booking.vehicleModel}
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Booking Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>ช่วงเวลาเช่า:</span>
              <span className="font-bold text-slate-900">{booking.startDate} ถึง {booking.endDate} ({booking.totalDays} วัน)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ยอดค่าเช่ารวม:</span>
              <span className="font-bold text-slate-900">฿{booking.grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-2">
              <span>เงินมัดจำประกันความเสียหายที่จะพิจารณาคืน:</span>
              <span className="font-extrabold text-emerald-600 text-sm">฿{booking.depositAmount.toLocaleString()} THB</span>
            </div>
          </div>

          {/* Cancellation Notice Policy Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1 text-xs text-amber-900">
            <p className="font-extrabold flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>กระบวนการตรวจสอบการยกเลิก (Cancellation Workflow)</span>
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed pl-5">
              เมื่อกดส่งคำขอ สถานะออเดอร์จะเปลี่ยนเป็น <strong>"รอเจ้าหน้าที่ตรวจสอบ"</strong> โดยเจ้าหน้าที่หลังบ้านจะพิจารณาคืนเงินมัดจำตามเงื่อนไขระยะเวลานโยบาย และโอนเงินคืนเข้าบัญชีภายใน 1-3 วันทำการ
            </p>
          </div>

          {/* Reason Select */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              สาเหตุการยกเลิกการจอง <span className="text-rose-500">*</span>
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="เปลี่ยนแผนการเดินทาง / ยกเลิกทริป">เปลี่ยนแผนการเดินทาง / ยกเลิกทริป</option>
              <option value="ปัญหาสุขภาพ / ติดภารกิจด่วน">ปัญหาสุขภาพ / ติดภารกิจด่วน</option>
              <option value="จองผิดรุ่นรถหรือผิดวันที่">จองผิดรุ่นรถหรือผิดวันที่</option>
              <option value="พบปัญหาระบบการชำระเงิน">พบปัญหาระบบการชำระเงิน</option>
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

          {/* Bank Account Details for Refund */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-xs">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>ข้อมูลบัญชีธนาคารสำหรับรับโอนเงินมัดจำคืน</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  เลือกธนาคาร <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {THAI_BANKS.map((b) => (
                    <option key={b.code} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ชื่อบัญชีผู้รับเงิน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="เช่น นายสมชาย วงศ์สวัสดิ์"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                เลขที่บัญชี / เบอร์พร้อมเพย์ (PromptPay) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="ระบุเลขที่บัญชี 10 หลัก หรือ เบอร์พร้อมเพย์ 10 หลัก..."
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-indigo-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition cursor-pointer shadow-md shadow-rose-600/20 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>ส่งคำขอยกเลิกจอง & ขอรับเงินคืน</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
