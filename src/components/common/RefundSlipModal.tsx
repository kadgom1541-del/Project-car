import React from 'react';
import { Booking } from '../../types/erp';
import { X, CheckCircle2, Download, Building, Receipt, FileCheck } from 'lucide-react';

interface RefundSlipModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export const RefundSlipModal: React.FC<RefundSlipModalProps> = ({
  isOpen,
  booking,
  onClose,
}) => {
  if (!isOpen || !booking) return null;

  const refundAmount = booking.depositRefundedAmount ?? (booking.depositAmount - (booking.depositForfeitedAmount || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden relative my-8">
        
        {/* Header */}
        <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center text-white border border-emerald-400/30">
              <FileCheck className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">หลักฐานการโอนเงินคืนมัดจำ</h3>
              <p className="text-xs text-emerald-100 font-mono">
                รหัสจอง: {booking.bookingCode}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-emerald-100 hover:text-white bg-emerald-700/50 hover:bg-emerald-700 p-2 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Status Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
            <div className="inline-flex items-center space-x-1.5 text-emerald-800 font-extrabold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ทำรายการโอนคืนเงินสำเร็จเรียบร้อย</span>
            </div>
            <p className="text-xs text-slate-600">
              วันเวลาที่ดำเนินการ: {booking.refundCompletedAt ? new Date(booking.refundCompletedAt).toLocaleString('th-TH') : '2026-07-23 10:30 น.'}
            </p>
            <div className="text-2xl font-black text-emerald-700 mt-2">
              ฿{refundAmount.toLocaleString()} THB
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>ผู้รับเงิน (ลูกค้า):</span>
              <span className="font-bold text-slate-900">{booking.customerName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>ธนาคารปลายทาง:</span>
              <span className="font-bold text-slate-800">{booking.bankName || 'ธนาคารกสิกรไทย (KBank)'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>เลขที่บัญชี / PromptPay:</span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {booking.bankAccountNumber || '098-XXX-8899'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 border-t border-slate-200 pt-2">
              <span>สาเหตุการยกเลิก:</span>
              <span className="font-medium text-slate-800">{booking.cancelReason || 'เปลี่ยนแผนการเดินทาง'}</span>
            </div>
            {booking.refundAdminNote && (
              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-500 block text-[11px]">หมายเหตุจากเจ้าหน้าที่:</span>
                <p className="text-slate-800 italic bg-amber-50 p-2 rounded-lg border border-amber-200/80 mt-1">
                  "{booking.refundAdminNote}"
                </p>
              </div>
            )}
          </div>

          {/* Slip Image Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              สลิปโอนเงิน (Transfer Slip):
            </label>
            <div className="bg-slate-900 rounded-2xl p-2 flex items-center justify-center border border-slate-800 shadow-inner max-h-72 overflow-hidden">
              {booking.refundSlipUrl ? (
                <img
                  src={booking.refundSlipUrl}
                  alt="Refund Transfer Slip"
                  className="max-h-64 object-contain rounded-xl"
                />
              ) : (
                <div className="p-6 text-center space-y-2 text-white">
                  <Receipt className="w-12 h-12 mx-auto text-emerald-400 animate-pulse" />
                  <p className="text-xs font-bold">สลิปการโอนเงินคืนมัดจำ (E-Slip)</p>
                  <p className="text-[10px] text-slate-400 font-mono">REF: TXN-20260723-REFUND-9912</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
