import React, { useState } from 'react';
import { MaintenanceWorkOrder, Vehicle } from '../../types/erp';
import { Wrench, Plus, CheckCircle, Clock, DollarSign, AlertCircle } from 'lucide-react';

interface MaintenanceModuleProps {
  workOrders: MaintenanceWorkOrder[];
  vehicles: Vehicle[];
  onAddWorkOrder: (wo: MaintenanceWorkOrder) => void;
  onUpdateWorkOrderStatus: (woId: string, status: MaintenanceWorkOrder['status']) => void;
}

export const MaintenanceModule: React.FC<MaintenanceModuleProps> = ({
  workOrders,
  vehicles,
  onAddWorkOrder,
  onUpdateWorkOrderStatus,
}) => {
  const [showAddWoModal, setShowAddWoModal] = useState<boolean>(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [type, setType] = useState<MaintenanceWorkOrder['type']>('Preventive');
  const [description, setDescription] = useState<string>('เปลี่ยนถ่ายน้ำมันเครื่องสังเคราะห์แท้ เช็กระบบเบรก');
  const [garageName, setGarageName] = useState<string>('ศูนย์บริการ Toyota Buzz');
  const [partsCost, setPartsCost] = useState<number>(3200);
  const [laborCost, setLaborCost] = useState<number>(800);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    const newWo: MaintenanceWorkOrder = {
      id: `wo-${Date.now().toString().slice(-4)}`,
      workOrderNo: `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleId: selectedVehicle.id,
      vehiclePlate: selectedVehicle.plateNumber,
      type,
      description,
      garageName,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'In-Progress',
      partsCost: Number(partsCost),
      laborCost: Number(laborCost),
      totalCost: Number(partsCost) + Number(laborCost),
      odometerAtService: selectedVehicle.currentOdometer,
      notes: 'บันทึกต้นทุนเข้าบัญชีทรัพย์สิน P&L',
    };

    onAddWorkOrder(newWo);
    setShowAddWoModal(false);
  };

  const totalPartsCost = workOrders.reduce((sum, wo) => sum + wo.partsCost, 0);
  const totalLaborCost = workOrders.reduce((sum, wo) => sum + wo.laborCost, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">ระบบจัดการซ่อมบำรุงและใบสั่งซ่อม (Maintenance Work Orders)</h2>
            <p className="text-xs text-slate-500">ตารางเช็กระยะรอบกิโลเมตร บันทึกค่าอะไหล่ ค่าแรง และปันส่วนเข้าต้นทุนเฉพาะคัน</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddWoModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>เปิดใบสั่งซ่อมใหม่ (New Work Order)</span>
        </button>
      </div>

      {/* Overview Cost Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500">จำนวนใบสั่งซ่อมทั้งหมด</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{workOrders.length} รายการ</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500">ค่าอะไหล่สะสม (Parts Cost)</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalPartsCost.toLocaleString()} THB</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500">ค่าแรงช่างสะสม (Labor Cost)</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalLaborCost.toLocaleString()} THB</p>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-900 text-sm">รายการใบสั่งซ่อม (Work Orders Log)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">เลขที่ WO</th>
                <th className="p-3">ทะเบียนรถ</th>
                <th className="p-3">ประเภท</th>
                <th className="p-3">รายละเอียดการซ่อม</th>
                <th className="p-3">ศูนย์บริการ/อู่</th>
                <th className="p-3 text-right">ค่าอะไหล่</th>
                <th className="p-3 text-right">ค่าแรง</th>
                <th className="p-3 text-right">รวมเงิน</th>
                <th className="p-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-bold text-slate-900">{wo.workOrderNo}</td>
                  <td className="p-3 font-mono font-semibold text-slate-800">{wo.vehiclePlate}</td>
                  <td className="p-3 font-medium text-slate-800">{wo.type}</td>
                  <td className="p-3 max-w-xs truncate text-slate-600">{wo.description}</td>
                  <td className="p-3 text-slate-700">{wo.garageName}</td>
                  <td className="p-3 text-right font-mono">{wo.partsCost.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{wo.laborCost.toLocaleString()}</td>
                  <td className="p-3 text-right font-bold text-slate-900">{wo.totalCost.toLocaleString()} THB</td>
                  <td className="p-3 text-center">
                    <select
                      value={wo.status}
                      onChange={(e) => onUpdateWorkOrderStatus(wo.id, e.target.value as any)}
                      className={`text-[10px] font-bold border rounded-lg px-2 py-0.5 focus:outline-none ${
                        wo.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : wo.status === 'In-Progress'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Work Order Modal */}
      {showAddWoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateWorkOrder} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-200 pb-3">
              เปิดใบสั่งซ่อมใหม่ (Work Order)
            </h3>

            <div>
              <label className="block font-bold text-slate-800 mb-1">เลือกรถยนต์ที่เข้าซ่อม</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl bg-white"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} - {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">ประเภทการซ่อม</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Preventive">ซ่อมบำรุงตามระยะ (Preventive)</option>
                  <option value="Corrective">ซ่อมแซมทั่วไป (Corrective)</option>
                  <option value="Tire Change">เปลี่ยนยางรถยนต์</option>
                  <option value="Insurance Repair">เคลมประกันภัย</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">ชื่อศูนย์บริการ / อู่</label>
                <input
                  type="text"
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">รายละเอียดงานซ่อม</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl h-20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">ค่าอะไหล่ (Parts Cost)</label>
                <input
                  type="number"
                  value={partsCost}
                  onChange={(e) => setPartsCost(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">ค่าแรง (Labor Cost)</label>
                <input
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-xl font-bold"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddWoModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 cursor-pointer"
              >
                เปิดใบสั่งซ่อม
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
