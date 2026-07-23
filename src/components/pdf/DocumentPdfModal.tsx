import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RentalPdfDocument } from './RentalPdfDocument';
import { Booking } from '../../types/erp';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  Shield,
  QrCode,
  Building2,
  Receipt,
  FileCheck,
} from 'lucide-react';

interface DocumentPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const DocumentPdfModal: React.FC<DocumentPdfModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const [docType, setDocType] = useState<'receipt' | 'agreement' | 'invoice'>('receipt');

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden relative"
      >
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600/30 border border-emerald-500/40 rounded-2xl text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center space-x-2">
                <span>ศูนย์ออกเอกสารและสัญญาเช่า PDF</span>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                  PDF Engine Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                รหัสเอกสารอ้างอิง: <strong className="text-emerald-400">{booking.bookingNumber || booking.id}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Document Selector */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Document Type Tabs */}
          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs text-xs font-bold">
            <button
              type="button"
              onClick={() => setDocType('receipt')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                docType === 'receipt'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>ใบยืนยัน & ใบชำระเงิน</span>
            </button>

            <button
              type="button"
              onClick={() => setDocType('agreement')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                docType === 'agreement'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>สัญญาเช่า & ใบส่งมอบ</span>
            </button>

            <button
              type="button"
              onClick={() => setDocType('invoice')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                docType === 'invoice'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>ใบแจ้งหนี้ IFRS 15</span>
            </button>
          </div>

          {/* Download & Print Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>พิมพ์เอกสาร</span>
            </button>

            <PDFDownloadLink
              document={<RentalPdfDocument booking={booking} docType={docType} />}
              fileName={`DriveERP-${docType}-${booking.bookingCode || booking.id}.pdf`}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
            >
              {({ loading }) => (
                <>
                  <Download className="w-4 h-4" />
                  <span>{loading ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF'}</span>
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        {/* Printable Document Sheet Preview */}
        <div className="p-6 overflow-y-auto bg-slate-200/60 flex-1 flex justify-center">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-300 p-8 max-w-2xl w-full text-slate-800 text-xs space-y-6 print:m-0 print:p-0 print:shadow-none print:border-none">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm">
                    D
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">DriveERP Car Rental</h2>
                    <p className="text-[10px] text-slate-500 font-semibold">บริษัท ดรัยฟ์อีอาร์พี จำกัด (มหาชน)</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  เลขประจำตัวผู้เสียภาษี: 0105567012341 | โทร 02-999-8888
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-xs">
                  {docType === 'receipt' && 'ใบยืนยันการจอง & ใบเสร็จ'}
                  {docType === 'agreement' && 'สัญญาเช่ารถยนต์'}
                  {docType === 'invoice' && 'ใบแจ้งหนี้ / ใบกำกับภาษี'}
                </span>
                <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                  เลขที่: {booking.bookingCode || booking.id}
                </p>
                <p className="text-[11px] text-slate-500">วันที่: {booking.createdDate || '2026-07-21'}</p>
              </div>
            </div>

            {/* Grid Customer & Vehicle Details */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  ข้อมูลผู้เช่า (Customer Details)
                </span>
                <p className="font-bold text-slate-900 text-sm">{booking.customerName}</p>
                <p className="text-slate-600">รหัสผู้เช่า: {booking.customerId}</p>
                <p className="text-slate-600">อีเมล: customer@driveerp.com</p>
              </div>

              <div className="space-y-1.5 border-l border-slate-200 pl-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  รายละเอียดรถยนต์ (Vehicle Details)
                </span>
                <p className="font-bold text-slate-900 text-sm">{booking.vehicleModel}</p>
                <p className="text-slate-600">ทะเบียน: <strong className="text-indigo-700">{booking.vehiclePlate}</strong></p>
                <p className="text-slate-600">ประกันภัย: ชั้น 1 คุ้มครองเต็มรูปแบบ</p>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">วันเวลารับรถ</span>
                  <strong className="text-slate-900 font-extrabold">{booking.startDate}</strong>
                  <span className="text-slate-500 text-[11px] block">({booking.pickupBranch})</span>
                </div>
                <div className="text-center px-3 py-1 bg-emerald-200/80 rounded-xl text-emerald-900 font-extrabold text-xs">
                  {booking.totalDays} วัน
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">วันเวลาส่งคืนรถ</span>
                  <strong className="text-slate-900 font-extrabold">{booking.endDate}</strong>
                  <span className="text-slate-500 text-[11px] block">({booking.dropoffBranch})</span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">รายการ</th>
                    <th className="p-3 text-center">จำนวนวัน</th>
                    <th className="p-3 text-right">ราคา/วัน</th>
                    <th className="p-3 text-right">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">ค่าเช่ารถยนต์ {booking.vehicleModel}</td>
                    <td className="p-3 text-center">{booking.totalDays}</td>
                    <td className="p-3 text-right">
                      {Math.round((booking.grandTotal || 0) / (booking.totalDays || 1)).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {(booking.grandTotal || 0).toLocaleString()}
                    </td>
                  </tr>
                  {booking.depositAmount > 0 && (
                    <tr>
                      <td className="p-3 font-medium text-slate-700">เงินประกันความเสียหาย (Refundable Deposit)</td>
                      <td className="p-3 text-center">1</td>
                      <td className="p-3 text-right">{booking.depositAmount.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {booking.depositAmount.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Grand */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>สถานะสัญญา: {booking.status}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-xs block">ยอดรวมทั้งสิ้น (Grand Total)</span>
                <span className="text-xl font-black text-emerald-700">
                  {((booking.grandTotal || 0) + (booking.depositAmount || 0)).toLocaleString()} บาท
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-slate-500">
              <div>
                <div className="border-b border-slate-300 mb-2 h-10" />
                <p className="font-bold text-slate-800">ลงชื่อผู้เช่ารถยนต์</p>
                <p className="text-[10px] text-slate-400">({booking.customerName})</p>
              </div>
              <div>
                <div className="border-b border-slate-300 mb-2 h-10" />
                <p className="font-bold text-slate-800">ลงชื่อเจ้าหน้าที่ส่งมอบรถ</p>
                <p className="text-[10px] text-slate-400">(เจ้าหน้าที่เคาน์เตอร์ DriveERP)</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
