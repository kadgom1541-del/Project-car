import React, { useState } from 'react';
import { Customer, TierConfig } from '../../types/erp';
import { tierConfigs } from '../../data/initialData';
import { ShieldCheck, Award, Gift, DollarSign, Zap, RefreshCw, CheckCircle, ArrowRight, PlusCircle, MinusCircle, UserCheck } from 'lucide-react';

interface LoyaltyModuleProps {
  customers: Customer[];
  onRedeemPoints: (customerId: string, pointsAmount: number, rewardName: string) => void;
  onAdjustPoints?: (customerId: string, pointsDelta: number, reason?: string) => void;
}

export const LoyaltyModule: React.FC<LoyaltyModuleProps> = ({ customers, onRedeemPoints, onAdjustPoints }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [selectedReward, setSelectedReward] = useState<{ code: string; cost: number; title: string }>({
    code: 'REW-CASH-100',
    cost: 100,
    title: 'คูปองส่วนลดแทนเงินสด 100 บาท',
  });

  // Admin Manual Adjustment state
  const [adjustCustomerId, setAdjustCustomerId] = useState<string>(customers[0]?.id || '');
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustMode, setAdjustMode] = useState<'add' | 'subtract'>('add');
  const [adjustReason, setAdjustReason] = useState<string>('ชดเชยระบบขัดข้อง / ชดเชยกรณีพิเศษ');

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const adjustCustomer = customers.find((c) => c.id === adjustCustomerId);

  const handleExecuteAdjustPoints = () => {
    if (!adjustCustomer) return;
    if (adjustAmount <= 0) {
      alert('กรุณาระบุจำนวนแต้มที่ต้องการเพิ่มหรือลด');
      return;
    }

    const delta = adjustMode === 'add' ? adjustAmount : -adjustAmount;
    if (onAdjustPoints) {
      onAdjustPoints(adjustCustomerId, delta, adjustReason);
      alert(
        `${adjustMode === 'add' ? 'เพิ่ม' : 'หัก'} คะแนนจำนวน ${adjustAmount} แต้ม ให้คุณ ${
          adjustCustomer.fullName
        } เรียบร้อยแล้ว! (เหตุผล: ${adjustReason})`
      );
    }
  };

  // Total Points Liability Calculation
  const totalOutstandingPoints = customers.reduce((sum, c) => sum + c.pointsBalance, 0);
  const totalPointsLiabilityTHB = totalOutstandingPoints * 1.0; // 1 point = 1 THB standard liability

  const redemptionRewards = [
    { code: 'REW-CASH-100', cost: 100, title: 'คูปองส่วนลดแทนเงินสด 100 บาท', estValue: '100 บาท' },
    { code: 'REW-UPGRADE', cost: 350, title: 'คูปองฟรี อัปเกรดรุ่นรถ 1 ระดับ', estValue: '500 - 800 บาท' },
    { code: 'REW-INSURANCE', cost: 400, title: 'คูปองฟรี ประกันภัย No-Deductible ตลอดสัญญา', estValue: '600 - 1,200 บาท' },
    { code: 'REW-FREE-DAY', cost: 800, title: 'คูปองฟรี ค่าเช่ารถ 1 วัน (กลุ่ม Sedan 1.5L)', estValue: '1,200 - 1,500 บาท' },
  ];

  const handleExecuteRedemption = () => {
    if (!selectedCustomer) return;
    if (selectedCustomer.pointsBalance < selectedReward.cost) {
      alert(`คะแนนสะสมไม่พอสำหรับการแลกสิทธิ์นี้ (ต้องการ ${selectedReward.cost} คะแนน, มีอยู่ ${selectedCustomer.pointsBalance} คะแนน)`);
      return;
    }

    onRedeemPoints(selectedCustomer.id, selectedReward.cost, selectedReward.title);
    alert(`แลกรับสิทธิ์ "${selectedReward.title}" สำเร็จ! ตัดคะแนนสะสม ${selectedReward.cost} คะแนน และออกคูปองเรียบร้อยแล้ว`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">สถาปัตยกรรมระบบสะสมแต้มและสมาชิก (Loyalty Points & Membership Engine)</h2>
            <p className="text-xs text-slate-500">คำนวณคะแนนตาม Tier Multipliers และบันทึกภาระผูกพันทางการเงิน (Point Liability)</p>
          </div>
        </div>
      </div>

      {/* Point Liability Overview Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider">IFRS 15 Financial Liability Metrics</span>
          <h3 className="text-2xl font-black mt-1">
            ยอดรวมภาระผูกพันคะแนนสะสม (Total Point Liability)
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            คะแนนหมุนเวียนคงเหลือในระบบ: <strong className="text-amber-400 font-mono text-sm">{totalOutstandingPoints.toLocaleString()} คะแนน</strong>
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-right">
          <span className="text-slate-300 text-xs">มูลค่าหนี้สินรอการรับรู้รายได้</span>
          <p className="text-3xl font-extrabold text-amber-300 font-mono">{totalPointsLiabilityTHB.toLocaleString()} THB</p>
        </div>
      </div>

      {/* Tier Matrix Display Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tierConfigs.map((tc) => (
          <div
            key={tc.tier}
            className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 relative overflow-hidden ${
              tc.tier === 'Platinum'
                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                : tc.tier === 'Gold'
                ? 'border-amber-300'
                : 'border-slate-200'
            }`}
          >
            {tc.tier === 'Platinum' && (
              <span className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                VIP TIER
              </span>
            )}

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">MEMBERSHIP TIER</span>
              <h3 className="font-extrabold text-xl text-slate-900 flex items-center space-x-2">
                <span>{tc.tier} Tier</span>
                <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {tc.multiplier}x Points
                </span>
              </h3>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <p>เกณฑ์การปรับระดับ: <strong>{tc.minRentals}+ ครั้ง/ปี</strong> หรือ ยอดเช่า <strong>{tc.minSpend.toLocaleString()} THB</strong></p>
              <p>สิทธิ์มัดจำ: <strong className="text-indigo-600">{tc.depositDiscountPercent}% Deposit Discount</strong></p>
            </div>

            <ul className="space-y-2 text-xs text-slate-700">
              {tc.benefits.map((b, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Point Redemption Simulator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Gift className="w-4 h-4 text-indigo-600" />
            <span>ศูนย์แลกคะแนนสะสม (Loyalty Point Redemption Matrix)</span>
          </h3>
          <span className="text-xs text-slate-500">แลกคะแนนเป็นคูปองส่วนลดทันที</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">1. เลือกลูกค้าที่จะแลกสิทธิ์</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-800"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} (แต้มคงเหลือ: {c.pointsBalance} คะแนน)
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-slate-800 mb-1">2. เลือกของรางวัลสิทธิประโยชน์</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {redemptionRewards.map((rw) => {
                const isSelected = selectedReward.code === rw.code;
                return (
                  <div
                    key={rw.code}
                    onClick={() => setSelectedReward(rw)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex justify-between items-center ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{rw.title}</p>
                      <p className="text-[11px] text-slate-500">มูลค่าเทียบเท่า: {rw.estValue}</p>
                    </div>
                    <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-lg shrink-0">
                      {rw.cost} แต้ม
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Execution button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">ลูกค้าปัจจุบัน:</span>{' '}
            <strong className="text-slate-900">{selectedCustomer?.fullName}</strong> | แต้มคงเหลือ:{' '}
            <strong className="text-amber-600">{selectedCustomer?.pointsBalance} คะแนน</strong>
          </div>

          <button
            onClick={handleExecuteRedemption}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <span>ยืนยันการแลกคะแนน</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Admin / Manager / Supervisor Manual Point & Tier Override Panel */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                ระบบจัดการ/เพิ่มคะแนนสะสมและระดับสมาชิก (Manager & Supervisor Membership Override)
              </h3>
              <p className="text-xs text-slate-500">
                ผู้จัดการ (Manager) และ ผู้ดูแลระบบ/สมาชิก (Supervisor / Admin) มีสิทธิ์เพิ่ม/ลดแต้มและปรับระดับ Tier สมาชิกให้ลูกค้า
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-full border border-amber-300">
            MANAGER, SUPERVISOR & OWNER PERMISSION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">เลือกลูกค้าสมาชิก</label>
            <select
              value={adjustCustomerId}
              onChange={(e) => setAdjustCustomerId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} [{c.tier}] ({c.pointsBalance} แต้ม)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">ปรับระดับสมาชิก (Tier)</label>
            <select
              value={adjustCustomer?.tier || 'Silver'}
              onChange={(e) => {
                if (adjustCustomer) {
                  adjustCustomer.tier = e.target.value as any;
                  alert(`อัปเดตระดับสมาชิกของคุณ ${adjustCustomer.fullName} เป็นระดับ ${e.target.value} เรียบร้อยแล้ว`);
                }
              }}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Standard">Standard (สมาชิกทั่วไป)</option>
              <option value="Silver">Silver Tier (ส่วนลด 0% มัดจำ)</option>
              <option value="Gold">Gold Tier (ส่วนลด 20% มัดจำ)</option>
              <option value="Platinum">Platinum Tier (ส่วนลด 100% ฟรีมัดจำ)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">ประเภทการปรับแต้ม</label>
            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={() => setAdjustMode('add')}
                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center space-x-1 cursor-pointer transition ${
                  adjustMode === 'add'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>เพิ่ม</span>
              </button>
              <button
                type="button"
                onClick={() => setAdjustMode('subtract')}
                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center space-x-1 cursor-pointer transition ${
                  adjustMode === 'subtract'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MinusCircle className="w-3.5 h-3.5" />
                <span>หัก</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">จำนวนคะแนน (Points)</label>
            <input
              type="number"
              min="1"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(Number(e.target.value))}
              placeholder="100"
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">สาเหตุ / บันทึกกำกับ</label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="ชดเชยระบบ / มอบของขวัญวันเกิด"
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 text-xs">
          <div className="text-slate-600 text-[11px]">
            ลูกค้า: <strong className="text-slate-900">{adjustCustomer?.fullName}</strong> | แต้มก่อนปรับ:{' '}
            <strong className="text-amber-700 font-mono">{adjustCustomer?.pointsBalance} แต้ม</strong>{' '}
            ➔ แต้มหลังปรับ:{' '}
            <strong className="text-emerald-700 font-mono">
              {Math.max(0, (adjustCustomer?.pointsBalance || 0) + (adjustMode === 'add' ? adjustAmount : -adjustAmount))} แต้ม
            </strong>
          </div>

          <button
            onClick={handleExecuteAdjustPoints}
            className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-amber-600/20"
          >
            <UserCheck className="w-4 h-4" />
            <span>ยืนยันการปรับปรุงคะแนน</span>
          </button>
        </div>
      </div>

    </div>
  );
};
