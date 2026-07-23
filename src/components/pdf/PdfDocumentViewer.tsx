import React from 'react';
import { Booking, Vehicle, Customer, InspectionRecord } from '../../types/erp';
import { Printer, Download, X, CheckCircle, Shield, FileText, QrCode } from 'lucide-react';

interface PdfDocumentViewerProps {
  type: 'Contract' | 'Voucher' | 'TaxInvoice' | 'Inspection';
  booking?: Booking;
  vehicle?: Vehicle;
  customer?: Customer;
  inspection?: InspectionRecord;
  onClose: () => void;
}

export const PdfDocumentViewer: React.FC<PdfDocumentViewerProps> = ({
  type,
  booking,
  vehicle,
  customer,
  inspection,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm overflow-y-auto">
      {/* Container with print-specific style */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header toolbar (Hidden during window.print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {type === 'Contract' && 'สัญญาเช่ารถยนต์อิเล็กทรอนิกส์ (Rental Agreement PDF)'}
                {type === 'Voucher' && 'ใบยืนยันการจองรถเช่า (Booking Voucher PDF)'}
                {type === 'TaxInvoice' && 'ใบกำกับภาษี / ใบเสร็จรับเงิน (Tax Invoice / Receipt PDF)'}
                {type === 'Inspection' && 'ใบตรวจรับสภาพรถยนต์ (Digital Vehicle Inspection PDF)'}
              </h3>
              <p className="text-xs text-slate-400">ระบบออกเอกสารอัตโนมัติ สอดคล้องมาตรฐานบัญชีและกฎหมาย</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer shadow-md"
              title="พิมพ์เอกสาร A4 หรือ Slip Thermal"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable PDF Canvas Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50 text-slate-800 print:p-0 print:bg-white print:overflow-visible">
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-3xl mx-auto text-sm font-sans relative print:shadow-none print:border-none print:p-0">
            
            {/* Watermark */}
            <div className="absolute top-32 right-10 text-slate-200/50 text-6xl font-black rotate-[-25deg] select-none pointer-events-none uppercase tracking-widest print:opacity-20">
              ORIGINAL
            </div>

            {/* Document Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                    D
                  </div>
                  <span className="font-bold text-xl text-slate-900 tracking-tight">DriveERP Thailand</span>
                </div>
                <p className="text-xs text-slate-500">บริษัท ไดรฟ์ อีอาร์พี จำกัด (สำนักงานใหญ่)</p>
                <p className="text-xs text-slate-500">เลขประจำตัวผู้เสียภาษี: 0105566099881 | โทร: 02-998-8888</p>
                <p className="text-xs text-slate-500">88/1 ถนนวิภาวดีรังสิต แขวงสนามบิน เขตดอนเมือง กรุงเทพฯ 10210</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full text-xs mb-2">
                  {type === 'Contract' && 'RENTAL CONTRACT'}
                  {type === 'Voucher' && 'BOOKING VOUCHER'}
                  {type === 'TaxInvoice' && 'TAX INVOICE / RECEIPT'}
                  {type === 'Inspection' && 'INSPECTION REPORT'}
                </span>
                <p className="font-mono text-base font-bold text-slate-900">
                  {booking ? booking.bookingCode : `DOC-${Date.now().toString().slice(-6)}`}
                </p>
                <p className="text-xs text-slate-500">วันที่ออกเอกสาร: {todayStr}</p>
              </div>
            </div>

            {/* Content Switcher based on Type */}

            {/* 1. RENTAL CONTRACT */}
            {type === 'Contract' && booking && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 text-indigo-700">
                      ผู้เช่า (Customer Details)
                    </h4>
                    <p className="font-semibold text-slate-900">{booking.customerName}</p>
                    <p className="text-xs text-slate-600">รหัสลูกค้า: {booking.customerId}</p>
                    <p className="text-xs text-slate-600">ประเภทสมาชิก: <span className="font-bold text-amber-600">{customer?.tier || 'Silver'}</span></p>
                    <p className="text-xs text-slate-600">เบอร์โทรศัพท์: {customer?.phone || '081-892-3341'}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 text-indigo-700">
                      ยานพาหนะ (Vehicle Info)
                    </h4>
                    <p className="font-semibold text-slate-900">{booking.vehicleModel}</p>
                    <p className="text-xs text-slate-600">ทะเบียน: <span className="font-mono font-bold text-slate-900">{booking.vehiclePlate}</span> ({vehicle?.province || 'กรุงเทพฯ'})</p>
                    <p className="text-xs text-slate-600">ประเภท: {booking.vehicleCategory}</p>
                    <p className="text-xs text-slate-600">เลขไมล์ ณ วันรับรถ: {vehicle?.currentOdometer.toLocaleString()} กม.</p>
                  </div>
                </div>

                {/* Rental Period */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 text-indigo-700">
                    กำหนดการเช่า (Rental Schedule)
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">วันเวลาเริ่มสัญญา:</span>
                      <p className="font-semibold text-slate-900 text-sm">{booking.startDate} เวลา 09:00 น.</p>
                      <p className="text-slate-500">สาขารับรถ: {booking.pickupBranch}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">วันเวลาสิ้นสุดสัญญา:</span>
                      <p className="font-semibold text-slate-900 text-sm">{booking.endDate} เวลา 09:00 น.</p>
                      <p className="text-slate-500">สาขาคืนรถ: {booking.dropoffBranch}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing & Payments */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="text-left p-3 font-bold text-slate-700">รายการ (Description)</th>
                        <th className="text-center p-3 font-bold text-slate-700">จำนวน/วัน</th>
                        <th className="text-right p-3 font-bold text-slate-700">ราคา/หน่วย</th>
                        <th className="text-right p-3 font-bold text-slate-700">รวมเงิน (THB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3">ค่าเช่ารถยนต์ ({booking.vehicleModel})</td>
                        <td className="p-3 text-center">{booking.totalDays} วัน</td>
                        <td className="p-3 text-right">{booking.dailyRate.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium">{booking.baseAmount.toLocaleString()}</td>
                      </tr>
                      {booking.discountAmount > 0 && (
                        <tr className="bg-emerald-50 text-emerald-800 font-medium">
                          <td className="p-3">ส่วนลดคูปอง ({booking.appliedCouponCode})</td>
                          <td className="p-3 text-center">-</td>
                          <td className="p-3 text-right">-</td>
                          <td className="p-3 text-right">-{booking.discountAmount.toLocaleString()}</td>
                        </tr>
                      )}
                      {booking.addonsAmount > 0 && (
                        <tr>
                          <td className="p-3">ค่าบริการเพิ่มเติม / ประกันภัย</td>
                          <td className="p-3 text-center">{booking.totalDays} วัน</td>
                          <td className="p-3 text-right">300</td>
                          <td className="p-3 text-right font-medium">{booking.addonsAmount.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="p-3 text-slate-500">ภาษีมูลค่าเพิ่ม (VAT 7%)</td>
                        <td className="p-3 text-center">-</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right text-slate-600">{booking.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="bg-slate-900 text-white font-bold text-sm">
                        <td colSpan={3} className="p-3 text-right">ยอดเงินรวมสุทธิ (Grand Total):</td>
                        <td className="p-3 text-right">{booking.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</td>
                      </tr>
                      <tr className="bg-amber-50 text-amber-900 font-semibold text-xs">
                        <td colSpan={3} className="p-3 text-right">เงินมัดจำประกันความเสียหาย (Security Deposit):</td>
                        <td className="p-3 text-right">{booking.depositAmount.toLocaleString()} THB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Loyalty Info */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>คะแนนสะสมที่ได้รับจากสัญญานี้: <strong>+{booking.pointsEarned} คะแนน</strong> (IFRS 15 Deferred Revenue)</span>
                  </div>
                  <span className="font-mono text-slate-500">TIER: {customer?.tier || 'Silver'}</span>
                </div>

                {/* Terms Summary */}
                <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                  <p className="font-bold text-slate-700">ข้อตกลงและเงื่อนไขการเช่า:</p>
                  <p>1. ผู้เช่าตกลงจะนำรถคืนตรงตามกำหนดเวลา หากเกินกำหนดจะคิดค่าปรับชั่วโมงละ 200 บาท</p>
                  <p>2. รถเช่าทุกคันได้รับการทำความสะอาดและเติมน้ำมันเต็มถัง ผู้เช่าต้องคืนน้ำมันระดับเดิม</p>
                  <p>3. เงินมัดจำจะทำการคืนเข้าบัตรเครดิต/บัญชีภายใน 1-3 วันทำการหลังจากการตรวจรับรถไม่พบความเสียหายเพิ่มเติม</p>
                </div>

                {/* Signatures & QR */}
                <div className="pt-6 grid grid-cols-3 gap-6 items-end">
                  <div className="text-center space-y-10">
                    <div className="border-b border-slate-400 pb-1 font-mono text-xs text-slate-700">
                      {booking.signatureDataUrl ? (
                        <img src={booking.signatureDataUrl} alt="Customer Sign" className="h-10 mx-auto" />
                      ) : (
                        <span className="text-slate-400 font-sans italic">[ลงนามอิเล็กทรอนิกส์แล้ว]</span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-800">ลายมือชื่อผู้เช่า (Lessee)</p>
                  </div>

                  <div className="text-center space-y-10">
                    <div className="border-b border-slate-400 pb-1 font-mono text-xs text-slate-700 italic">
                      สมศักดิ์ นิมิตไพศาล
                    </div>
                    <p className="text-xs font-semibold text-slate-800">ผู้รับมอบอำนาจ (Authorized Staff)</p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 border border-slate-200 rounded-lg bg-white">
                    <QrCode className="w-16 h-16 text-slate-800" />
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">Scan to Verify PDF</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. TAX INVOICE */}
            {type === 'TaxInvoice' && booking && (
              <div className="space-y-6">
                <div className="border-b border-slate-300 pb-3 flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">ใบกำกับภาษีเต็มรูปแบบ / ใบเสร็จรับเงิน (TAX INVOICE)</span>
                  <span className="text-xs text-slate-500 font-mono">INV-2026-00891</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-700">ลูกค้า / ผู้ซื้อ:</span>
                    <p className="font-semibold text-slate-900">{booking.customerName}</p>
                    <p className="text-slate-600">เลขประจำตัวประชาชน: {customer?.nationalId || '1-1002-00341-99-1'}</p>
                    <p className="text-slate-600">ที่อยู่: 88 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร</p>
                  </div>
                  <div className="text-right">
                    <p><span className="text-slate-500">อ้างอิงสัญญา:</span> <strong className="font-mono">{booking.bookingCode}</strong></p>
                    <p><span className="text-slate-500">วันที่ชำระเงิน:</span> {todayStr}</p>
                    <p><span className="text-slate-500">วิธีชำระ:</span> บัตรเครดิต (Pre-authorized)</p>
                  </div>
                </div>

                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="p-2 text-left">ลำดับ</th>
                      <th className="p-2 text-left">รายการบริการ</th>
                      <th className="p-2 text-right">จำนวนเงินก่อน VAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2">1</td>
                      <td className="p-2">ค่าบริการเช่ารถยนต์ {booking.vehicleModel} ({booking.totalDays} วัน)</td>
                      <td className="p-2 text-right">{(booking.grandTotal - booking.vatAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="bg-slate-50 font-semibold">
                      <td colSpan={2} className="p-2 text-right">มูลค่าสินค้า/บริการ (Subtotal):</td>
                      <td className="p-2 text-right">{(booking.grandTotal - booking.vatAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="p-2 text-right text-slate-600">ภาษีมูลค่าเพิ่ม 7% (VAT 7%):</td>
                      <td className="p-2 text-right text-slate-600">{booking.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="bg-slate-900 text-white font-bold">
                      <td colSpan={2} className="p-2 text-right">จำนวนเงินรวมทั้งสิ้น (Grand Total):</td>
                      <td className="p-2 text-right">{booking.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</td>
                    </tr>
                  </tbody>
                </table>

                <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded">
                  * หมายเหตุบัญชี IFRS 15: มีการแยกรับรู้รายได้ค่าเช่า และตั้งสำรองหนี้สินคะแนนสะสม (Loyalty Point Liability) จำนวน {booking.pointsEarned} บาท
                </div>
              </div>
            )}

            {/* 3. INSPECTION REPORT */}
            {type === 'Inspection' && (
              <div className="space-y-6">
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-indigo-900 text-sm">การตรวจรับสภาพรถยนต์ (Check-in Inspection)</span>
                    <p className="text-indigo-700">ทะเบียน: <strong className="font-mono">3ขก-4412 (Honda Civic)</strong> | เลขไมล์: 28,400 กม.</p>
                  </div>
                  <span className="bg-emerald-600 text-white px-3 py-1 rounded-full font-bold">STATUS: PASSED</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="border border-slate-200 p-3 rounded-lg">
                    <h5 className="font-bold text-slate-800 mb-2">ระดับน้ำมัน & ไมล์ (Fuel & Odometer)</h5>
                    <p className="text-slate-600">ระดับน้ำมันคงเหลือ: <strong>85% (3/4 ถัง)</strong></p>
                    <p className="text-slate-600">เลขไมล์สะสม: <strong>28,400 กม.</strong></p>
                    <p className="text-slate-600">ค่าปรับน้ำมันขาด: <span className="text-emerald-600 font-bold">0 THB (ตรงตามสัญญา)</span></p>
                  </div>
                  <div className="border border-slate-200 p-3 rounded-lg">
                    <h5 className="font-bold text-slate-800 mb-2">รายการความเสียหาย (Damage Log)</h5>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      <li>กันชนหน้าซ้าย: รอยขีดข่วนแมวข่วนเล็กน้อย (Minor Scratch)</li>
                      <li>ประตูหลังขวา: ไม่มีรอยใหม่</li>
                    </ul>
                  </div>
                </div>

                <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 text-center">
                  <p className="text-xs text-slate-500 mb-2">แผนผังรอยขีดข่วนบันทึกบนระบบ 3D/2D Inspection Canvas</p>
                  <div className="h-28 bg-white border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 font-mono text-xs">
                    [ VISUAL CAR DIAGRAM WITH 1 DAMAGE PIN AT FRONT-LEFT ]
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
              <p>เอกสารนี้ออกโดยระบบ DriveERP Cloud System • สัญญาฉบับอิเล็กทรอนิกส์สมบูรณ์ตาม พ.ร.บ.ธุรกรรมทางอิเล็กทรอนิกส์</p>
              <p className="font-mono">PAGE 1 OF 1</p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
