import React, { useState } from 'react';
import { Vehicle, VehicleStatus, VehicleCategory } from '../../types/erp';
import { Car, Plus, AlertCircle, Wrench, ShieldAlert, MapPin, Gauge, Fuel, Calendar, Search, Filter, Eye, LayoutGrid, Table } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { TanStackDataTable } from '../common/TanStackDataTable';

interface FleetModuleProps {
  vehicles: Vehicle[];
  onAddVehicle: (newVehicle: Vehicle) => void;
  onUpdateVehicleStatus: (vehicleId: string, newStatus: VehicleStatus) => void;
}

export const FleetModule: React.FC<FleetModuleProps> = ({
  vehicles,
  onAddVehicle,
  onUpdateVehicleStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehicle | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // TanStack Table Column Definitions
  const fleetColumns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: 'model',
      header: 'รุ่นรถยนต์ / ยี่ห้อ',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <img
            src={row.original.imageUrl}
            alt={row.original.model}
            className="w-12 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
          />
          <div>
            <p className="font-extrabold text-slate-900 text-xs">{row.original.brand} {row.original.model}</p>
            <p className="text-[10px] text-slate-400">ปี {row.original.year} • {row.original.fuelType}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'plateNumber',
      header: 'ทะเบียนรถ',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200">
          {row.original.plateNumber}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'หมวดหมู่',
      cell: ({ row }) => (
        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'สถานะคลังรถ',
      cell: ({ row }) => {
        const st = row.original.status;
        const style = statusColors[st] || { bg: 'bg-slate-100 text-slate-700', border: 'border-slate-200' };
        return (
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${style.bg} ${style.border}`}>
            {st}
          </span>
        );
      },
    },
    {
      accessorKey: 'currentOdometer',
      header: 'เลขไมล์สะสม',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {row.original.currentOdometer.toLocaleString()} กม.
        </span>
      ),
    },
    {
      accessorKey: 'dailyRate',
      header: 'ราคาเช่า/วัน',
      cell: ({ row }) => (
        <span className="font-extrabold text-xs text-emerald-700">
          {row.original.dailyRate.toLocaleString()} THB
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'จัดการ',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setSelectedVehicleForDetail(row.original)}
          className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>รายละเอียด</span>
        </button>
      ),
    },
  ];

  // New vehicle form state
  const [newBrand, setNewBrand] = useState('Toyota');
  const [newModel, setNewModel] = useState('Corolla Cross 1.8 Hybrid');
  const [newPlate, setNewPlate] = useState('5กฮ-8821');
  const [newCategory, setNewCategory] = useState<VehicleCategory>('Crossover / SUV');
  const [newRate, setNewRate] = useState(2500);
  const [newOdometer, setNewOdometer] = useState(12500);
  const [newYear, setNewYear] = useState(2025);
  const [newColor, setNewColor] = useState('White Pearl');
  const [newFuelType, setNewFuelType] = useState<'Gasoline 95' | 'Gasohol 91/95' | 'Diesel' | 'Electric (EV)'>('Gasohol 91/95');

  // Edit vehicle state inside modal
  const [editOdometerVal, setEditOdometerVal] = useState<number>(0);
  const [isEditingOdometer, setIsEditingOdometer] = useState<boolean>(false);

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesStatus = selectedStatus === 'All' || v.status === selectedStatus;
    const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
    const matchesSearch =
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Calculate Document Expiration Warnings
  const expiringDocs = vehicles.filter(
    (v) => v.documents.taxWarningDays < 30 || v.documents.insuranceWarningDays < 30
  );

  const statusColors: Record<VehicleStatus, { bg: string; text: string; border: string }> = {
    Available: { bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', border: 'border-emerald-200' },
    Reserved: { bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700', border: 'border-blue-200' },
    Rented: { bg: 'bg-purple-50 text-purple-700', text: 'text-purple-700', border: 'border-purple-200' },
    Maintenance: { bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', border: 'border-amber-200' },
    'In-Transit': { bg: 'bg-sky-50 text-sky-700', text: 'text-sky-700', border: 'border-sky-200' },
    Decommissioned: { bg: 'bg-slate-100 text-slate-600', text: 'text-slate-600', border: 'border-slate-300' },
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Vehicle = {
      id: `veh-${Date.now().toString().slice(-4)}`,
      plateNumber: newPlate,
      province: 'กรุงเทพมหานคร',
      brand: newBrand,
      model: newModel,
      year: Number(newYear),
      color: newColor,
      category: newCategory,
      vin: `MRO${Math.floor(10000000 + Math.random() * 90000000)}`,
      engineNumber: `ENG-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Available',
      currentOdometer: Number(newOdometer) || 5000,
      nextServiceKm: (Number(newOdometer) || 5000) + 10000,
      dailyRate: Number(newRate),
      fuelType: newFuelType,
      fuelLevelPercent: 100,
      documents: {
        taxExpiryDate: '2027-06-30',
        insuranceExpiryDate: '2027-06-30',
        actExpiryDate: '2027-06-30',
        taxWarningDays: 345,
        insuranceWarningDays: 345,
      },
      gpsLocation: {
        lat: 13.7563,
        lng: 100.5018,
        locationName: 'สาขาสุวรรณภูมิ HQ',
        lastUpdated: 'เพิ่งอัปเดต',
      },
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      purchasePrice: 989000,
      salvageValue: 200000,
      usefulLifeYears: 5,
      acquisitionDate: '2024-06-01',
    };
    onAddVehicle(created);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Expiration Warning Alert Banner */}
      {expiringDocs.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start space-x-3 text-amber-900 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-900 text-sm">
              แจ้งเตือนเอกสารยานพาหนะใกล้หมดอายุ ({expiringDocs.length} คัน)
            </h4>
            <p className="text-amber-700 mt-0.5">
              มีรถที่ภาษีหรือประกันภัย พ.ร.บ. จะหมดอายุภายใน 30 วัน กรุณาดำเนินการต่ออายุเพื่อป้องกันค่าปรับและปัญหาทางกฎหมาย:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {expiringDocs.map((v) => (
                <span key={v.id} className="bg-amber-100 text-amber-800 font-mono text-[11px] px-2.5 py-0.5 rounded-md border border-amber-300">
                  {v.plateNumber} ({v.model}): ภาษีหมดอายุ {v.documents.taxExpiryDate}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">การจัดการฟลีตรถยนต์ (Fleet & Asset Master)</h2>
              <p className="text-xs text-slate-500">ติดตามสถานะ Real-time, ตำแหน่ง GPS, เลขไมล์ และเอกสารทางกฎหมาย</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรถเข้าฟลีต (Add Vehicle)</span>
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาทะเบียน, รุ่น, แบรนด์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-700"
          >
            <option value="All">หมวดหมู่รถทั้งหมด (All Categories)</option>
            <option value="Sedan 1.5L">Sedan 1.5L (เก๋ง Eco / City Car)</option>
            <option value="Compact">Compact (เก๋งคอมแพค)</option>
            <option value="Crossover / SUV">Crossover / SUV (อเนกประสงค์)</option>
            <option value="EV / Electric">EV / Electric (รถยนต์ไฟฟ้า 100%)</option>
            <option value="MPV / Minivan">MPV / Minivan (รถตู้ VIP / ครอบครัว)</option>
            <option value="Luxury">Luxury / Executive (หรูหรา / ผู้บริหาร)</option>
            <option value="Pickup Truck">Pickup Truck (รถกระบะ)</option>
            <option value="Sports / Performance">Sports / Performance (รถสปอร์ต)</option>
          </select>

          {/* Status Matrix Quick Filters */}
          <div className="md:col-span-2 flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
            {['All', 'Available', 'Reserved', 'Rented', 'Maintenance', 'In-Transit'].map((st) => {
              const count = st === 'All' ? vehicles.length : vehicles.filter((v) => v.status === st).length;
              const isSelected = selectedStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'All' ? 'ทั้งหมด' : st} ({count})
                </button>
              );
            })}
          </div>

        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-500">
            แสดงข้อมูลคลังรถยนต์ ({filteredVehicles.length} คัน)
          </span>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>ตาราง TanStack</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>การ์ดรูปภาพ</span>
            </button>
          </div>
        </div>

      </div>

      {/* Fleet Display Rendering */}
      {viewMode === 'table' ? (
        <TanStackDataTable
          data={filteredVehicles}
          columns={fleetColumns}
          title="ตารางวิเคราะห์คลังรถยนต์ (TanStack Data Grid)"
          subtitle="ค้นหา เรียงลำดับข้อมูลสถานะรถ เลขไมล์สะสม และส่งออก CSV ได้ทันที"
          searchPlaceholder="ค้นหาตามยี่ห้อ รุ่น หรือ ทะเบียนรถ..."
          exportFileName="fleet-inventory.csv"
        />
      ) : (
        /* Fleet Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((v) => {
          const statusStyle = statusColors[v.status];
          const isServiceSoon = v.currentOdometer >= v.nextServiceKm - 1000;

          return (
            <div
              key={v.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
            >
              {/* Image & Badges */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  src={v.imageUrl}
                  alt={v.model}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${statusStyle.bg} ${statusStyle.border}`}>
                    {v.status}
                  </span>
                  <span className="bg-slate-900/80 text-white backdrop-blur-sm text-[10px] font-mono px-2 py-0.5 rounded">
                    {v.category}
                  </span>
                </div>

                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-slate-900 font-extrabold text-xs shadow">
                  {v.dailyRate.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">บาท/วัน</span>
                </div>

                {isServiceSoon && (
                  <div className="absolute bottom-2 left-2 right-2 bg-amber-500/90 text-white backdrop-blur-sm px-2 py-1 rounded text-[10px] font-semibold flex items-center justify-center space-x-1">
                    <Wrench className="w-3 h-3" />
                    <span>ใกล้ถึงรอบเช็กระยะแล้ว ({v.currentOdometer.toLocaleString()} / {v.nextServiceKm.toLocaleString()} กม.)</span>
                  </div>
                )}
              </div>

              {/* Vehicle Content Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 text-sm">{v.brand} {v.model}</h3>
                    <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {v.plateNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">ปี {v.year} • สี {v.color} • {v.fuelType}</p>
                </div>

                {/* Status metrics bar */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    <span>ไมล์: <strong>{v.currentOdometer.toLocaleString()}</strong> กม.</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <Fuel className="w-3.5 h-3.5 text-emerald-500" />
                    <span>ถังน้ำมัน: <strong>{v.fuelLevelPercent}%</strong></span>
                  </div>
                </div>

                {/* GPS Location preview */}
                {v.gpsLocation && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 truncate">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{v.gpsLocation.locationName} ({v.gpsLocation.lastUpdated})</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  
                  {/* Status switcher dropdown */}
                  <select
                    value={v.status}
                    onChange={(e) => onUpdateVehicleStatus(v.id, e.target.value as VehicleStatus)}
                    className="text-[11px] font-semibold border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Available">Available (พร้อมเช่า)</option>
                    <option value="Reserved">Reserved (จองแล้ว)</option>
                    <option value="Rented">Rented (อยู่ระหว่างเช่า)</option>
                    <option value="Maintenance">Maintenance (เข้าศูนย์)</option>
                    <option value="In-Transit">In-Transit (ขนส่ง)</option>
                    <option value="Decommissioned">Decommissioned (ปลดจำหน่าย)</option>
                  </select>

                  <button
                    onClick={() => setSelectedVehicleForDetail(v)}
                    className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>รายละเอียด GPS/บัญชี</span>
                  </button>

                </div>

              </div>

            </div>
          );
        })}
        </div>
      )}

      {/* Vehicle Detail & Telematics Modal */}
      {selectedVehicleForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Vehicle Master & Asset Accounting</span>
                <h3 className="font-bold text-xl text-slate-900">
                  {selectedVehicleForDetail.brand} {selectedVehicleForDetail.model} ({selectedVehicleForDetail.plateNumber})
                </h3>
              </div>
              <button
                onClick={() => setSelectedVehicleForDetail(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400">เลขตัวถัง (VIN)</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedVehicleForDetail.vin}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400">เลขเครื่องยนต์</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedVehicleForDetail.engineNumber}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400">ราคาทุนทรัพย์สิน</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedVehicleForDetail.purchasePrice.toLocaleString()} THB</p>
              </div>
            </div>

            {/* Current Odometer Update Panel */}
            <div className="bg-indigo-50/80 border border-indigo-200 p-3.5 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-indigo-900 font-bold block text-[11px]">⚡ เลขไมล์สะสมปัจจุบัน (Current Odometer):</span>
                <span className="font-mono text-xl font-black text-indigo-900">
                  {selectedVehicleForDetail.currentOdometer.toLocaleString()} <span className="text-xs font-semibold text-slate-600">กม.</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newOdoStr = prompt('กรอกเลขไมล์ปัจจุบันใหม่ (กม.):', selectedVehicleForDetail.currentOdometer.toString());
                  if (newOdoStr && !isNaN(Number(newOdoStr))) {
                    const newVal = Number(newOdoStr);
                    selectedVehicleForDetail.currentOdometer = newVal;
                    alert(`อัปเดตเลขไมล์เป็น ${newVal.toLocaleString()} กม. เรียบร้อยแล้ว`);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
              >
                <Gauge className="w-4 h-4" />
                <span>แก้ไขเลขไมล์</span>
              </button>
            </div>

            {/* Telematics / GPS Location Live Preview */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>GPS Telematics Live Tracking</span>
                </span>
                <span className="text-slate-400 text-[11px]">อัปเดตสัญญานแล้ว</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-slate-200">{selectedVehicleForDetail.gpsLocation?.locationName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Lat: {selectedVehicleForDetail.gpsLocation?.lat}, Lng: {selectedVehicleForDetail.gpsLocation?.lng}
                  </p>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2 py-1 rounded">
                  ONLINE GPS
                </span>
              </div>
            </div>

            {/* Expiration Documents */}
            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <h4 className="font-bold text-slate-900">วันต่ออายุเอกสารทางกฎหมาย</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 p-2 rounded text-center">
                  <span className="text-slate-500 text-[10px]">ภาษีประจำปี</span>
                  <p className="font-bold text-slate-800">{selectedVehicleForDetail.documents.taxExpiryDate}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center">
                  <span className="text-slate-500 text-[10px]">ประกันภัยชั้น 1</span>
                  <p className="font-bold text-slate-800">{selectedVehicleForDetail.documents.insuranceExpiryDate}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center">
                  <span className="text-slate-500 text-[10px]">พ.ร.บ.</span>
                  <p className="font-bold text-slate-800">{selectedVehicleForDetail.documents.actExpiryDate}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedVehicleForDetail(null)}
                className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateVehicle} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-200 pb-3">
              เพิ่มยานพาหนะใหม่เข้าฟลีต (New Asset Registration)
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">แบรนด์รถ (Brand)</label>
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">รุ่นรถ (Model)</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">ทะเบียนรถ (Plate)</label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">หมวดหมู่รถ (Category) *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as VehicleCategory)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-semibold"
                >
                  <option value="Sedan 1.5L">Sedan 1.5L (เก๋ง Eco / City Car)</option>
                  <option value="Compact">Compact (เก๋งคอมแพค)</option>
                  <option value="Crossover / SUV">Crossover / SUV (อเนกประสงค์)</option>
                  <option value="EV / Electric">EV / Electric (รถยนต์ไฟฟ้า 100%)</option>
                  <option value="MPV / Minivan">MPV / Minivan (รถตู้ VIP / ครอบครัว)</option>
                  <option value="Luxury">Luxury / Executive (หรูหรา / ผู้บริหาร)</option>
                  <option value="Pickup Truck">Pickup Truck (รถกระบะ)</option>
                  <option value="Sports / Performance">Sports / Performance (รถสปอร์ต)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold text-indigo-900">
                  ⚡ เลขไมล์ปัจจุบัน / Odometer (กิโลเมตร) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newOdometer}
                  onChange={(e) => setNewOdometer(Number(e.target.value))}
                  placeholder="เช่น 15200"
                  className="w-full p-2 border-2 border-indigo-300 bg-indigo-50/50 rounded-lg font-mono font-extrabold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">ปีจดทะเบียน (Year)</label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">สีรถยนต์ (Color)</label>
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">ประเภทน้ำมัน / พลังงาน</label>
                <select
                  value={newFuelType}
                  onChange={(e) => setNewFuelType(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Gasohol 91/95">Gasohol 91/95</option>
                  <option value="Gasoline 95">Gasoline 95</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric (EV)">Electric (EV รถยนต์ไฟฟ้า)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">ราคาเช่ารายวัน (Daily Rate THB) *</label>
                <input
                  type="number"
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                บันทึกเข้าฟลีต
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
