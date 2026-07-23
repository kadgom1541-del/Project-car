import React, { useState } from 'react';
import { Coupon, VehicleCategory, Customer } from '../../types/erp';
import { validateCouponWaterfall } from '../../utils/erpEngine';
import { Gift, Plus, CheckCircle, XCircle, Tag, Layers, Calendar, DollarSign, ShieldAlert } from 'lucide-react';

interface CouponModuleProps {
  coupons: Coupon[];
  customers: Customer[];
  onAddCoupon: (coupon: Coupon) => void;
}

export const CouponModule: React.FC<CouponModuleProps> = ({ coupons, customers, onAddCoupon }) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Waterfall Tester state
  const [testCode, setTestCode] = useState<string>('DRIVE15');
  const [testDuration, setTestDuration] = useState<number>(2);
  const [testSpend, setTestSpend] = useState<number>(3500);
  const [testCategory, setTestCategory] = useState<VehicleCategory>('Sedan 1.5L');
  const [testDate, setTestDate] = useState<string>('2026-08-01');

  // Form state
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<Coupon['type']>('Percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minDurationDays, setMinDurationDays] = useState<number>(1);
  const [minSpendTHB, setMinSpendTHB] = useState<number>(1000);

  const selectedTestCoupon = coupons.find((c) => c.code.toUpperCase() === testCode.toUpperCase());
  const dummyCustomer = customers[0];

  const testValidationResult = selectedTestCoupon && dummyCustomer
    ? validateCouponWaterfall(selectedTestCoupon, {
        rentDurationDays: testDuration,
        baseRentAmount: testSpend,
        vehicleCategory: testCategory,
        bookingDateStr: testDate,
        customer: dummyCustomer,
        selectedAddonsTotal: 0,
      })
    : null;

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const newCoup: Coupon = {
      id: `coup-${Date.now().toString().slice(-4)}`,
      code: code.toUpperCase(),
      name,
      description,
      type,
      discountValue: Number(discountValue),
      minDurationDays: Number(minDurationDays),
      minSpendTHB: Number(minSpendTHB),
      blackoutDates: ['2026-12-31', '2027-01-01'],
      applicableCategories: ['Sedan 1.5L', 'Compact', 'SUV', 'EV / Eco'],
      usageLimitGlobal: 100,
      usedCountGlobal: 0,
      usageLimitPerUser: 1,
      allowStacking: false,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
    };

    onAddCoupon(newCoup);
    setShowAddModal(false);
    setCode('');
    setName('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">สถาปัตยกรรมระบบคูปองโปรโมชัน (Coupon & Promotion Engine)</h2>
            <p className="text-xs text-slate-500">กำหนดกฎ Waterfall Validation Rules (VR-01 ถึง VR-06) ป้องกันการใช้สิทธิ์ซ้ำซ้อน</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างคูปองใหม่ (Create Coupon)</span>
        </button>
      </div>

      {/* Waterfall Rules Inspector Matrix */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-indigo-200">
              เครื่องมือทดสอบ Waterfall Rules Matrix Simulator
            </h3>
          </div>
          <span className="text-xs text-slate-400">ประมวลผลกฎ 6 ลำดับชั้นแบบ Real-time</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">รหัสคูปองทดสอบ</label>
            <select
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
            >
              {coupons.map((c) => (
                <option key={c.id} value={c.code}>{c.code} ({c.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">จำนวนวันเช่า</label>
            <input
              type="number"
              value={testDuration}
              onChange={(e) => setTestDuration(Number(e.target.value))}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">ยอดเงินฐาน (THB)</label>
            <input
              type="number"
              value={testSpend}
              onChange={(e) => setTestSpend(Number(e.target.value))}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">กลุ่มรถยนต์</label>
            <select
              value={testCategory}
              onChange={(e) => setTestCategory(e.target.value as VehicleCategory)}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
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
            <label className="block text-slate-400 mb-1">วันที่ใช้สิทธิ์</label>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
        </div>

        {/* Validation Waterfall Result Box */}
        {testValidationResult && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs transition ${
              testValidationResult.isValid
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                : 'bg-rose-950/80 border-rose-700 text-rose-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {testValidationResult.isValid ? (
                <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {testValidationResult.isValid
                    ? 'ผ่านการตรวจสอบเงื่อนไข Waterfall Validation Rules (APPROVED)'
                    : `ปฏิเสธการประยุกต์ใช้คูปอง (${testValidationResult.errorCode})`}
                </p>
                <p className="text-slate-300 mt-0.5">
                  {testValidationResult.isValid
                    ? `ได้รับส่วนลดจำนวน: ${testValidationResult.discountAmount.toLocaleString()} THB`
                    : testValidationResult.errorMessage}
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-[11px] text-slate-400">
              RULE ID: {testValidationResult.errorCode || 'VR-PASS'}
            </div>
          </div>
        )}

      </div>

      {/* Active Coupons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg text-sm tracking-wider">
                  {c.code}
                </span>
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  {c.type}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                สิทธิ์ที่ใช้ไป: <strong className="text-slate-800">{c.usedCountGlobal}</strong> / {c.usageLimitGlobal}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
            </div>

            {/* Waterfall Conditions List */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block">ระยะเวลาเช่าขั้นต่ำ:</span>
                <strong className="text-slate-800">{c.minDurationDays} วัน</strong>
              </div>
              <div>
                <span className="text-slate-400 block">ยอดเช่าขั้นต่ำ:</span>
                <strong className="text-slate-800">{c.minSpendTHB.toLocaleString()} THB</strong>
              </div>
              <div>
                <span className="text-slate-400 block">กลุ่มรถที่ใช้ได้:</span>
                <strong className="text-slate-800 truncate block">{c.applicableCategories.join(', ')}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Stacking Rules:</span>
                <strong className="text-slate-800">{c.allowStacking ? 'อนุญาตใช้ร่วม' : 'ห้ามใช้ร่วมกับโค้ดอื่น'}</strong>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex justify-between pt-1">
              <span>ระยะเวลาใช้งาน: {c.validFrom} ถึง {c.validTo}</span>
              <span>จำกัด {c.usageLimitPerUser} สิทธิ์/คน</span>
            </div>
          </div>
        ))}
      </div>

      {/* New Coupon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateCoupon} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-200 pb-3">
              สร้างคูปองส่วนลดใหม่ (New Promotion Code)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">รหัสคูปอง (Promo Code)</label>
                <input
                  type="text"
                  placeholder="เช่น DRIVE20"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">ประเภทส่วนลด</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Percentage">ส่วนลด % (Percentage)</option>
                  <option value="FixedAmount">ส่วนลดมูลค่าคงที่ (THB)</option>
                  <option value="FreeDays">เช่า X แถม Y (Free Days)</option>
                  <option value="AddonWaiver">ฟรีค่าประกันภัย/บริการเสริม</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">ชื่อโปรโมชัน</label>
              <input
                type="text"
                placeholder="เช่น ส่วนลดต้อนรับสมาชิกใหม่"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">รายละเอียดเงื่อนไข</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">มูลค่าส่วนลด</label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">ขั้นต่ำ (วัน)</label>
                <input
                  type="number"
                  value={minDurationDays}
                  onChange={(e) => setMinDurationDays(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">ขั้นต่ำ (บาท)</label>
                <input
                  type="number"
                  value={minSpendTHB}
                  onChange={(e) => setMinSpendTHB(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 cursor-pointer"
              >
                บันทึกคูปอง
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
