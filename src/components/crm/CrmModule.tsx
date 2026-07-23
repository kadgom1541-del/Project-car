import React, { useState } from 'react';
import { Customer, Booking } from '../../types/erp';
import { PdfDocumentViewer } from '../pdf/PdfDocumentViewer';
import { Smartphone, ShieldAlert, Award, User, Phone, Mail, FileText, Download, CheckCircle, ExternalLink, PlusCircle, Zap } from 'lucide-react';

interface CrmModuleProps {
  customers: Customer[];
  bookings: Booking[];
  onToggleBlacklist: (customerId: string, reason?: string) => void;
  onAdjustPoints?: (customerId: string, pointsDelta: number, reason?: string) => void;
}

export const CrmModule: React.FC<CrmModuleProps> = ({ customers, bookings, onToggleBlacklist, onAdjustPoints }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [activePdfDoc, setActivePdfDoc] = useState<{
    type: 'Contract' | 'Voucher' | 'TaxInvoice' | 'Inspection';
    booking: Booking;
  } | null>(null);

  const [customAddAmount, setCustomAddAmount] = useState<number>(100);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const customerBookings = bookings.filter((b) => b.customerId === selectedCustomerId);

  const handleQuickAddPoints = (cId: string, amount: number) => {
    if (onAdjustPoints) {
      onAdjustPoints(cId, amount, 'เพิ่มแต้มพิเศษโดยเจ้าของระบบ (Admin Manual Grant)');
      alert(`เพิ่มคะแนนสะสมจำนวน +${amount} แต้มเรียบร้อยแล้ว!`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">CRM, Risk Control & LINE OA Mini-App Simulator</h2>
            <p className="text-xs text-slate-500">จัดการข้อมูลลูกค้า สแกน Blacklist และจำลองหน้าจอ LINE LIFF บนมือถือ</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Customer Master Table & Risk Details */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">ฐานข้อมูลลูกค้า & คะแนนความประพฤติ (Customer Master)</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">ชื่อ-นามสกุล</th>
                    <th className="p-3">เลขบัตรประชาชน / โทร</th>
                    <th className="p-3 text-center">Tier สมาชิก</th>
                    <th className="p-3 text-right">แต้มสะสม</th>
                    <th className="p-3 text-center">การจัดการแต้ม</th>
                    <th className="p-3 text-center">Blacklist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`cursor-pointer transition ${
                        selectedCustomerId === c.id ? 'bg-indigo-50/70 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{c.fullName}</p>
                        <p className="text-[10px] text-slate-500">{c.email}</p>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        <p>{c.phone}</p>
                        <p className="text-[10px]">{c.nationalId}</p>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.tier === 'Platinum'
                              ? 'bg-indigo-100 text-indigo-800'
                              : c.tier === 'Gold'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.tier}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-600">
                        {c.pointsBalance.toLocaleString()} pt
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAddPoints(c.id, 100);
                          }}
                          className="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition cursor-pointer inline-flex items-center space-x-1"
                        >
                          <PlusCircle className="w-3 h-3 text-amber-700" />
                          <span>+100 แต้ม</span>
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleBlacklist(c.id, 'ปรับสถานะโดยผู้ดูแลระบบ');
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                            c.isBlacklisted
                              ? 'bg-rose-600 text-white hover:bg-rose-700'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800'
                          }`}
                        >
                          {c.isBlacklisted ? '🚨 BLACKLIST' : 'ปกติ (Normal)'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Customer Detailed Profile Card */}
          {selectedCustomer && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Customer Risk & Credit Profile</span>
                  <h3 className="font-bold text-base text-slate-900">{selectedCustomer.fullName}</h3>
                </div>
                <span className="font-mono text-slate-500">ID: {selectedCustomer.id}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px]">วงเงินสินเชื่อ (Credit Limit)</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedCustomer.creditLimitTHB.toLocaleString()} THB</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px]">ยอดใช้จ่ายสะสม</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedCustomer.totalSpentTHB.toLocaleString()} THB</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px]">ใบขับขี่</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedCustomer.driverLicenseNo}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px]">LINE ID</span>
                  <p className="font-semibold text-emerald-600 mt-0.5">{selectedCustomer.lineId || '-'}</p>
                </div>
              </div>

              {selectedCustomer.isBlacklisted && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs">
                  <span className="font-bold">สาเหตุที่ติด Blacklist:</span>
                  <p className="mt-0.5">{selectedCustomer.blacklistReason}</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right 1 Col: Phone Mockup for LINE Official Account Mini-App */}
        <div className="space-y-3 flex flex-col items-center">
          
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>จำลองหน้าจอ LINE LIFF Customer App</span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-[320px] bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 relative">
            
            {/* Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-b-xl mx-auto mb-2" />

            {/* Phone Screen Area */}
            <div className="bg-slate-100 rounded-[28px] overflow-hidden text-slate-800 text-xs flex flex-col min-h-[500px]">
              
              {/* LINE Header */}
              <div className="bg-[#06C755] text-white p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-white text-[#06C755] font-black text-xs flex items-center justify-center">
                    D
                  </div>
                  <span className="font-bold text-xs">DriveERP Loyalty Official</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>

              {/* LIFF Member Card */}
              {selectedCustomer && (
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                  
                  {/* Member Badge Card */}
                  <div className="bg-gradient-to-tr from-indigo-900 to-indigo-700 text-white p-4 rounded-2xl shadow-md space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-mono">MEMBERSHIP CARD</span>
                        <h4 className="font-bold text-sm">{selectedCustomer.fullName}</h4>
                      </div>
                      <span className="bg-amber-400 text-slate-900 font-black text-[10px] px-2 py-0.5 rounded-full">
                        {selectedCustomer.tier}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/20 flex justify-between items-end">
                      <div>
                        <span className="text-[10px] text-slate-300">คะแนนสะสมคงเหลือ</span>
                        <p className="text-xl font-extrabold text-amber-300 font-mono">{selectedCustomer.pointsBalance} pt</p>
                      </div>
                      <span className="text-[10px] text-slate-300">DriveERP Rewards</span>
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm font-semibold text-slate-800">
                      🎁 คูปองของฉัน (2)
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm font-semibold text-slate-800">
                      🚗 สัญญาเช่ารถ
                    </div>
                  </div>

                  {/* Active Bookings inside LINE */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 text-[11px]">สัญญาเช่าที่เปิดใช้งานอยู่</h5>
                    
                    {customerBookings.length > 0 ? (
                      customerBookings.map((bk) => (
                        <div key={bk.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-bold text-slate-900 text-[11px]">{bk.bookingCode}</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              {bk.status}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-800">{bk.vehicleModel}</p>
                          <p className="text-[10px] text-slate-500">วันคืนรถ: {bk.endDate}</p>

                          {/* PDF Download Button inside LINE */}
                          <div className="pt-1 flex space-x-1">
                            <button
                              onClick={() => setActivePdfDoc({ type: 'Contract', booking: bk })}
                              className="w-full py-1 bg-indigo-600 text-white rounded text-[10px] font-bold cursor-pointer hover:bg-indigo-700 flex items-center justify-center space-x-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>โหลดสัญญา PDF</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-400 italic text-center py-2">ไม่มีสัญญาเช่าที่กำลังใช้งาน</p>
                    )}
                  </div>

                </div>
              )}

              <div className="p-2 text-center text-[9px] text-slate-400 bg-slate-200 border-t border-slate-300">
                LINE LIFF v2.1 • Powered by DriveERP Cloud
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* PDF View Modal */}
      {activePdfDoc && (
        <PdfDocumentViewer
          type={activePdfDoc.type}
          booking={activePdfDoc.booking}
          customer={customers.find((c) => c.id === activePdfDoc.booking.customerId)}
          onClose={() => setActivePdfDoc(null)}
        />
      )}

    </div>
  );
};
