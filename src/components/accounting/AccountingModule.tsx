import React, { useState } from 'react';
import { JournalEntry, Vehicle, Booking } from '../../types/erp';
import { calculateMonthlyDepreciation } from '../../utils/erpEngine';
import { DollarSign, FileText, PieChart, TrendingUp, BookOpen, Layers } from 'lucide-react';

interface AccountingModuleProps {
  journalEntries: JournalEntry[];
  vehicles: Vehicle[];
  bookings: Booking[];
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  journalEntries,
  vehicles,
  bookings,
}) => {
  const [activeTab, setActiveTab] = useState<'pnl' | 'depreciation' | 'journals'>('pnl');

  // Revenue & Expense metrics
  const totalRentalRevenue = bookings.reduce((sum, b) => sum + (b.grandTotal - b.vatAmount), 0);
  const totalDeferredPointsLiability = bookings.reduce((sum, b) => sum + b.pointsEarned, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">ระบบการเงิน บัญชี และมาตรฐาน IFRS 15 (Financial Accounting & Ledger)</h2>
            <p className="text-xs text-slate-500">บันทึกรายได้ แยก Deferred Revenue แต้มสะสม งบกำไรขาดทุนรายคัน และค่าเสื่อมราคา</p>
          </div>
        </div>

        {/* Subtabs */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pnl')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'pnl' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            P&L รายคัน (P&L per Asset)
          </button>
          <button
            onClick={() => setActiveTab('depreciation')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'depreciation' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ค่าเสื่อมราคา (Depreciation)
          </button>
          <button
            onClick={() => setActiveTab('journals')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'journals' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สมุดรายวัน (Journal Entries)
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500">รายได้ค่าเช่ารถยนต์สุทธิ (Net Rental Revenue)</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {totalRentalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500">รายได้รอการรับรู้ IFRS 15 (Deferred Revenue)</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {totalDeferredPointsLiability.toLocaleString()} THB
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500">อัตรากำไรขั้นต้น (Gross Profit Margin)</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">68.4%</p>
        </div>
      </div>

      {/* Tab 1: P&L per Asset */}
      {activeTab === 'pnl' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">งบกำไรขาดทุนจำแนกรายคัน (Vehicle Asset P&L Attribution)</h3>
            <span className="text-xs text-slate-500 font-mono">Real-time Asset Costing</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">ทะเบียน / รุ่นรถ</th>
                  <th className="p-3 text-right">รายได้ค่าเช่าสะสม</th>
                  <th className="p-3 text-right">ต้นทุนซ่อมบำรุง</th>
                  <th className="p-3 text-right">ค่าเสื่อมราคา/เดือน</th>
                  <th className="p-3 text-right">กำไรขั้นต้น (P&L)</th>
                  <th className="p-3 text-center">ROI (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => {
                  const monthlyDep = calculateMonthlyDepreciation(v.purchasePrice, v.salvageValue, v.usefulLifeYears);
                  const vBookings = bookings.filter((b) => b.vehicleId === v.id);
                  const rev = vBookings.reduce((sum, b) => sum + (b.grandTotal - b.vatAmount), 0);
                  const maintCost = v.currentOdometer > 30000 ? 4700 : 1200;
                  const netPnL = rev - maintCost - monthlyDep;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-900">
                        {v.plateNumber} ({v.brand} {v.model})
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                        +{rev.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-600">
                        -{maintCost.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        -{monthlyDep.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-slate-900">
                        {netPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB
                      </td>
                      <td className="p-3 text-center font-bold text-indigo-600">
                        {rev > 0 ? '12.4%' : '0.0%'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Depreciation Schedule */}
      {activeTab === 'depreciation' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            ตารางคำนวณค่าเสื่อมราคายานพาหนะ (Straight-Line Depreciation Schedule)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">ทะเบียนรถ</th>
                  <th className="p-2.5 text-right">ราคาทุนจัดซื้อ</th>
                  <th className="p-2.5 text-right">ราคาซาก (Salvage)</th>
                  <th className="p-2.5 text-center">อายุงาน (ปี)</th>
                  <th className="p-2.5 text-right">ค่าเสื่อมราคา/ปี</th>
                  <th className="p-2.5 text-right font-bold text-slate-900">ค่าเสื่อมราคา/เดือน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => {
                  const monthlyDep = calculateMonthlyDepreciation(v.purchasePrice, v.salvageValue, v.usefulLifeYears);
                  const annualDep = monthlyDep * 12;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-800">{v.plateNumber} ({v.model})</td>
                      <td className="p-2.5 text-right font-mono">{v.purchasePrice.toLocaleString()} THB</td>
                      <td className="p-2.5 text-right font-mono">{v.salvageValue.toLocaleString()} THB</td>
                      <td className="p-2.5 text-center font-bold">{v.usefulLifeYears} ปี</td>
                      <td className="p-2.5 text-right font-mono">{annualDep.toLocaleString()} THB</td>
                      <td className="p-2.5 text-right font-mono font-bold text-indigo-600">
                        {monthlyDep.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Journal Entries (IFRS 15) */}
      {activeTab === 'journals' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">สมุดรายวันทั่วไป IFRS 15 Ledger (General Journal Vouchers)</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {journalEntries.map((je) => (
              <div key={je.id} className="p-4 space-y-2 text-xs hover:bg-slate-50 transition">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    {je.voucherNo}
                  </span>
                  <span className="text-slate-400 font-mono">{je.date}</span>
                </div>
                <p className="font-semibold text-slate-900">{je.description}</p>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">DEBIT (เดบิต)</span>
                    <span className="font-bold text-emerald-700">{je.debitAccount}</span>
                    <p className="font-bold text-slate-900 mt-0.5">+{je.debitAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">CREDIT (เครดิต)</span>
                    <span className="font-bold text-indigo-700">{je.creditAccount}</span>
                    <p className="font-bold text-slate-900 mt-0.5">+{je.creditAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">{je.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
