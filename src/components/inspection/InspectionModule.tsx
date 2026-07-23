import React, { useState } from 'react';
import { DamageMark, InspectionRecord, Vehicle, Booking } from '../../types/erp';
import { SignaturePad } from '../common/SignaturePad';
import { PdfDocumentViewer } from '../pdf/PdfDocumentViewer';
import { AlertTriangle, Plus, Trash2, Fuel, Gauge, FileText, CheckCircle, Camera, ShieldCheck } from 'lucide-react';

interface InspectionModuleProps {
  vehicles: Vehicle[];
  bookings: Booking[];
  onUpdateVehicleOdometerAndFuel: (vehicleId: string, odo: number, fuel: number) => void;
}

export const InspectionModule: React.FC<InspectionModuleProps> = ({
  vehicles,
  bookings,
  onUpdateVehicleOdometerAndFuel,
}) => {
  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || '');
  const [inspectionType, setInspectionType] = useState<'Check-out' | 'Check-in'>('Check-in');
  const [odometerInput, setOdometerInput] = useState<number>(28400);
  const [fuelLevelInput, setFuelLevelInput] = useState<number>(85);
  const [inspectorName, setInspectorName] = useState<string>('นายวิชัย สุวรรณรัตน์');
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([
    {
      id: 'dm-1',
      positionX: 25,
      positionY: 30,
      part: 'Front',
      type: 'Scratch',
      severity: 'Minor',
      notes: 'รอยขูดขีดแมวข่วนที่กันชนหน้าซ้าย ความยาวประมาณ 3 ซม.',
    },
  ]);

  const [newDamagePart, setNewDamagePart] = useState<DamageMark['part']>('Front');
  const [newDamageType, setNewDamageType] = useState<DamageMark['type']>('Scratch');
  const [newDamageNotes, setNewDamageNotes] = useState<string>('');
  const [showPdf, setShowPdf] = useState<boolean>(false);

  const currentBooking = bookings.find((b) => b.id === selectedBookingId);
  const currentVehicle = vehicles.find((v) => v.id === currentBooking?.vehicleId);

  // Click on 2D Car Diagram canvas to place mark pin
  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newMark: DamageMark = {
      id: `dm-${Date.now()}`,
      positionX: x,
      positionY: y,
      part: newDamagePart,
      type: newDamageType,
      severity: 'Minor',
      notes: newDamageNotes || 'รอยจุดตรวจใหม่',
    };

    setDamageMarks([...damageMarks, newMark]);
    setNewDamageNotes('');
  };

  const removeDamageMark = (id: string) => {
    setDamageMarks(damageMarks.filter((d) => d.id !== id));
  };

  // Fuel deficit penalty calculation (if check-in fuel < 100%)
  const fuelDeficitPercent = Math.max(0, 100 - fuelLevelInput);
  const fuelPenaltyTHB = Math.round((fuelDeficitPercent / 100) * 2000); // 2000 THB full tank refuel rate

  const handleSubmitInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentVehicle) {
      onUpdateVehicleOdometerAndFuel(currentVehicle.id, Number(odometerInput), Number(fuelLevelInput));
      alert(`บันทึกการตรวจรับรถ (${inspectionType}) เรียบร้อยแล้ว! อัปเดตเลขไมล์ ${odometerInput} กม. และระดับน้ำมัน ${fuelLevelInput}% เข้าสู่ ERP`);
      setShowPdf(true);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Module Title */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">การตรวจรับสภาพรถยนต์ดิจิทัล (Digital Vehicle Inspection & Report)</h2>
            <p className="text-xs text-slate-500">บันทึกรอยขีดข่วน ระดับน้ำมัน เลขไมล์ และออกรายงาน PDF แนบสัญญา</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Damage Diagram & Details */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                แผนผังทำเครื่องหมายรอยขีดข่วน (Visual Scratch & Damage Diagram)
              </h3>
              <span className="text-xs text-indigo-600 font-semibold">คลิกบนตัวรถเพื่อปักหมุดจุดชำรุด</span>
            </div>

            {/* Interactive Car Canvas */}
            <div
              onClick={handleDiagramClick}
              className="relative w-full h-64 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden cursor-crosshair select-none flex items-center justify-center bg-cover bg-center"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80")',
              }}
            >
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />
              <div className="absolute top-3 left-3 text-white text-xs font-bold font-mono bg-slate-900/80 px-2.5 py-1 rounded">
                TOP-DOWN 2D/3D VEHICLE MODEL CANVAS
              </div>

              {/* Pins placed by user */}
              {damageMarks.map((dm, idx) => (
                <div
                  key={dm.id}
                  style={{ left: `${dm.positionX}%`, top: `${dm.positionY}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold text-[11px] flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                    {idx + 1}
                  </div>
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-44 bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl z-20 pointer-events-none">
                    <p className="font-bold text-rose-300">{dm.part}: {dm.type}</p>
                    <p className="text-slate-300">{dm.notes}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Damage list items */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs">รายการรอยชำรุดที่บันทึกไว้ ({damageMarks.length} จุด)</h4>
              
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {damageMarks.map((dm, idx) => (
                  <div key={dm.id} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900">{dm.part}</span> • <span className="text-rose-600 font-semibold">{dm.type}</span>
                        <p className="text-slate-500 text-[11px]">{dm.notes}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDamageMark(dm.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick add damage controls */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
              <h5 className="font-bold text-slate-800">เครื่องมือกำหนดจุดตรวจชำรุดล่วงหน้า</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <select
                  value={newDamagePart}
                  onChange={(e) => setNewDamagePart(e.target.value as any)}
                  className="p-1.5 border border-slate-200 rounded bg-white"
                >
                  <option value="Front">กันชนหน้า (Front)</option>
                  <option value="Rear">กันชนหลัง (Rear)</option>
                  <option value="Left">ตัวถังด้านซ้าย (Left)</option>
                  <option value="Right">ตัวถังด้านขวา (Right)</option>
                  <option value="Roof">หลังคา (Roof)</option>
                  <option value="Interior">ห้องโดยสาร (Interior)</option>
                </select>

                <select
                  value={newDamageType}
                  onChange={(e) => setNewDamageType(e.target.value as any)}
                  className="p-1.5 border border-slate-200 rounded bg-white"
                >
                  <option value="Scratch">รอยขีดข่วน (Scratch)</option>
                  <option value="Dent">รอยบุบ (Dent)</option>
                  <option value="Crack">กระจกร้าว (Crack)</option>
                  <option value="Stain">คราบสกปรก (Stain)</option>
                </select>

                <input
                  type="text"
                  placeholder="หมายเหตุเพิ่มเติม..."
                  value={newDamageNotes}
                  onChange={(e) => setNewDamageNotes(e.target.value)}
                  className="p-1.5 border border-slate-200 rounded"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Right 1 Col: Odometer, Fuel & Signatures Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmitInspection} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              บันทึกผลการตรวจรับ-ส่งมอบ
            </h3>

            <div>
              <label className="block font-bold text-slate-800 mb-1">เลือกสัญญาเช่า / รถยนต์</label>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl bg-white font-medium"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bookingCode} - {b.vehicleModel} ({b.customerName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">ประเภทการตรวจ</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInspectionType('Check-out')}
                  className={`py-2 rounded-xl font-bold cursor-pointer transition ${
                    inspectionType === 'Check-out'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ส่งมอบรถ (Check-out)
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionType('Check-in')}
                  className={`py-2 rounded-xl font-bold cursor-pointer transition ${
                    inspectionType === 'Check-in'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  รับรถคืน (Check-in)
                </button>
              </div>
            </div>

            {/* Odometer */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เลขไมล์ปัจจุบัน (Odometer)</span>
                </span>
                <span className="text-[10px] text-slate-400">กิโลเมตร</span>
              </label>
              <input
                type="number"
                value={odometerInput}
                onChange={(e) => setOdometerInput(Number(e.target.value))}
                className="w-full p-2 border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900"
                required
              />
            </div>

            {/* Fuel Level */}
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ระดับน้ำมันคงเหลือ (%)</span>
                </span>
                <span className="font-bold text-emerald-600">{fuelLevelInput}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={fuelLevelInput}
                onChange={(e) => setFuelLevelInput(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0% (เกลี้ยงถัง)</span>
                <span>50% (ครึ่งถัง)</span>
                <span>100% (เต็มถัง)</span>
              </div>
            </div>

            {/* Fuel Penalty Preview */}
            {fuelPenaltyTHB > 0 && inspectionType === 'Check-in' && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-900 text-xs">
                <span className="font-bold">คำนวณค่าปรับน้ำมันขาด:</span>
                <p>ขาดอีก {fuelDeficitPercent}% คิดเป็นค่าปรับ <strong>+{fuelPenaltyTHB.toLocaleString()} THB</strong></p>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-800 mb-1">ชื่อเจ้าหน้าที่ผู้ตรวจสภาพ</label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl font-medium"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              บันทึกผล & ออกรายงาน Inspection PDF
            </button>

          </form>
        </div>

      </div>

      {/* PDF Inspection Viewer Modal */}
      {showPdf && (
        <PdfDocumentViewer
          type="Inspection"
          booking={currentBooking}
          vehicle={currentVehicle}
          onClose={() => setShowPdf(false)}
        />
      )}

    </div>
  );
};
