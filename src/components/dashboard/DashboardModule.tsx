import React from 'react';
import {
  Vehicle,
  Booking,
  Customer,
  Coupon,
  MaintenanceWorkOrder,
  JournalEntry,
} from '../../types/erp';
import {
  Car,
  ShieldCheck,
  Clock,
  DollarSign,
  AlertTriangle,
  Gift,
  PlusCircle,
  TrendingUp,
  CheckCircle2,
  Users,
  Activity,
  ArrowRight,
  FileText,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardModuleProps {
  vehicles: Vehicle[];
  bookings: Booking[];
  customers: Customer[];
  coupons: Coupon[];
  workOrders: MaintenanceWorkOrder[];
  journalEntries: JournalEntry[];
  onNavigateModule: (module: string) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  vehicles,
  bookings,
  customers,
  coupons,
  workOrders,
  journalEntries,
  onNavigateModule,
}) => {
  // Key Calculations
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter((v) => v.status === 'Available').length;
  const rentedVehicles = vehicles.filter((v) => v.status === 'Rented').length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'Maintenance').length;
  const reservedVehicles = vehicles.filter((v) => v.status === 'Reserved').length;

  const utilizationRate = totalVehicles > 0 ? (rentedVehicles / totalVehicles) * 100 : 0;

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.grandTotal - b.vatAmount), 0);
  const totalVat = bookings.reduce((sum, b) => sum + b.vatAmount, 0);
  const totalDeposits = bookings.reduce((sum, b) => sum + b.depositAmount, 0);

  const totalPointsLiability = customers.reduce((sum, c) => sum + c.pointsBalance, 0);
  const serviceAlertsCount = vehicles.filter((v) => v.currentOdometer >= v.nextServiceKm - 1000).length;
  const blacklistedCount = customers.filter((c) => c.isBlacklisted).length;

  // Pie Chart Data: Fleet Status Distribution
  const fleetStatusData = [
    { name: 'พร้อมใช้งาน (Available)', value: availableVehicles, color: '#10B981' },
    { name: 'ระหว่างเช่า (Rented)', value: rentedVehicles, color: '#6366F1' },
    { name: 'จองแล้ว (Reserved)', value: reservedVehicles, color: '#3B82F6' },
    { name: 'ซ่อมบำรุง (Maintenance)', value: maintenanceVehicles, color: '#EF4444' },
  ].filter((item) => item.value > 0);

  // Revenue By Category Data for Chart
  const categoryRevenueMap: Record<string, number> = {};
  bookings.forEach((b) => {
    const cat = b.vehicleCategory || 'General';
    categoryRevenueMap[cat] = (categoryRevenueMap[cat] || 0) + (b.grandTotal - b.vatAmount);
  });

  const categoryRevenueData = Object.keys(categoryRevenueMap).map((cat) => ({
    category: cat,
    revenue: categoryRevenueMap[cat],
  }));

  // Monthly / Weekly Simulation Trend
  const revenueTrendData = [
    { date: '15 ก.ค.', revenue: 14200, bookingsCount: 2 },
    { date: '16 ก.ค.', revenue: 18500, bookingsCount: 3 },
    { date: '17 ก.ค.', revenue: 22000, bookingsCount: 4 },
    { date: '18 ก.ค.', revenue: 19800, bookingsCount: 3 },
    { date: '19 ก.ค.', revenue: 28500, bookingsCount: 5 },
    { date: '20 ก.ค.', revenue: 31200, bookingsCount: 6 },
    { date: '21 ก.ค.', revenue: totalRevenue > 0 ? Math.round(totalRevenue / 2) : 24000, bookingsCount: bookings.length },
  ];

  return (
    <div className="space-y-6">
      
      {/* Banner / Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-500/30 text-indigo-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-indigo-500/40 uppercase tracking-widest">
              Executive Dashboard
            </span>
            <span className="text-xs text-slate-400 font-mono">DriveERP Central Hub</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            ศูนย์ควบคุมบริหารฟลีตรถยนต์ และระบบบัญชี IFRS 15
          </h2>
          <p className="text-xs text-slate-300">
            ภาพรวมการใช้ประโยชน์ยานพาหนะ (Utilization), รายได้ค่าเช่า, ภาระผูกพันแต้มสะสม และสถานะความเสี่ยง
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateModule('booking')}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ เปิดรายการจองใหม่</span>
          </button>
          <button
            onClick={() => onNavigateModule('inspection')}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>ตรวจรับรถคืน</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Fleet Utilization */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet Utilization</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 font-mono">{utilizationRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-1">
              กำลังเช่าอยู่ <strong className="text-indigo-600 font-bold">{rentedVehicles} คัน</strong> จากทั้งหมด {totalVehicles} คัน
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${utilizationRate}%` }} />
          </div>
        </div>

        {/* KPI 2: Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">รายได้ค่าเช่าสุทธิ (Revenue)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-600 font-mono">
              ฿{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              ยอดสัญญารวม VAT: <strong className="text-slate-800 font-mono">฿{(totalRevenue + totalVat).toLocaleString()}</strong>
            </p>
          </div>
          <div className="flex items-center text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>อัตราการเติบโตยอดจองเช่าดีเยี่ยม (+18.4%)</span>
          </div>
        </div>

        {/* KPI 3: Financial Liability (IFRS 15) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">IFRS 15 Points Liability</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-amber-600 font-mono">
              ฿{totalPointsLiability.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              แต้มสะสมลูกค้ารวม: <strong className="text-amber-700 font-bold">{totalPointsLiability.toLocaleString()} pt</strong>
            </p>
          </div>
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between">
            <span>เงินมัดจำถือครองสะสม:</span>
            <strong className="text-slate-800 font-mono">฿{totalDeposits.toLocaleString()}</strong>
          </div>
        </div>

        {/* KPI 4: Maintenance & Risk Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">การเฝ้าระวัง & ความเสี่ยง</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-rose-600 font-mono">{serviceAlertsCount} คัน</p>
            <p className="text-xs text-slate-500 mt-1">
              รถใกล้ครบรอบเปลี่ยนถ่ายน้ำมันเครื่อง/เช็กระยะ
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
            <span>ลูกค้าติด Blacklist:</span>
            <strong className="font-mono text-rose-800">{blacklistedCount} ราย</strong>
          </div>
        </div>

      </div>

      {/* Visual Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Revenue & Rental Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>แนวโน้มรายได้การเช่าประจำสัปดาห์ (Weekly Revenue & Rental Performance)</span>
              </h3>
              <p className="text-xs text-slate-500">เปรียบเทียบยอดเงินค่าเช่าสุทธิกับจำนวนรายการจองในแต่ละวัน</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              REAL-TIME
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, 'รายได้']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Fleet Status Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Car className="w-4 h-4 text-indigo-600" />
              <span>สัดส่วนสถานะฟลีตรถยนต์ (Fleet Composition)</span>
            </h3>
            <p className="text-xs text-slate-500">การกระจายตัวของฝูงรถในปัจจุบัน</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fleetStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {fleetStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} คัน`, 'จำนวน']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            <div className="bg-emerald-50 p-2 rounded-xl text-center">
              <span className="text-slate-500 block text-[10px]">พร้อมปล่อยเช่า</span>
              <strong className="text-emerald-700 font-bold text-sm">{availableVehicles} คัน</strong>
            </div>
            <div className="bg-indigo-50 p-2 rounded-xl text-center">
              <span className="text-slate-500 block text-[10px]">กำลังใช้งาน</span>
              <strong className="text-indigo-700 font-bold text-sm">{rentedVehicles} คัน</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Module Shortcuts Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>ทางลัดเข้าสู่โมดูลหลัก (Quick Access Modules)</span>
          </h3>
          <span className="text-xs text-slate-400">คลิกเพื่อไปยังส่วนงานนั้นทันที</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
          {[
            { id: 'fleet', name: 'ฟลีตรถยนต์', icon: Car, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
            { id: 'booking', name: 'การจอง & สัญญา', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { id: 'inspection', name: 'ตรวจรับรถ', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { id: 'maintenance', name: 'ซ่อมบำรุง', icon: Wrench, color: 'text-rose-600 bg-rose-50 border-rose-200' },
            { id: 'coupons', name: 'คูปองส่วนลด', icon: Gift, color: 'text-purple-600 bg-purple-50 border-purple-200' },
            { id: 'loyalty', name: 'คะแนนสะสม', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { id: 'accounting', name: 'บัญชี IFRS 15', icon: DollarSign, color: 'text-slate-700 bg-slate-100 border-slate-200' },
            { id: 'crm', name: 'CRM / LINE OA', icon: Users, color: 'text-emerald-700 bg-emerald-100 border-emerald-300' },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onNavigateModule(m.id)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border hover:shadow-md transition cursor-pointer space-y-2 bg-white hover:border-indigo-500 group"
              >
                <div className={`p-2.5 rounded-xl border ${m.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-800 text-[11px] text-center">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Active Bookings Table & Service Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active & Recent Bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>รายการจองและสัญญาเช่าล่าสุด (Active & Recent Contracts)</span>
            </h3>
            <button
              onClick={() => onNavigateModule('booking')}
              className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1"
            >
              <span>ดูทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">รหัสจอง</th>
                  <th className="p-3">ชื่อผู้เช่า</th>
                  <th className="p-3">รุ่นรถ / ทะเบียน</th>
                  <th className="p-3 text-center">ระยะเวลา</th>
                  <th className="p-3 text-right">ยอดเงินรวม</th>
                  <th className="p-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-indigo-600">{b.bookingCode}</td>
                    <td className="p-3 font-semibold text-slate-900">{b.customerName}</td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-800">{b.vehicleModel}</p>
                      <p className="text-[10px] font-mono text-slate-500">{b.vehiclePlate}</p>
                    </td>
                    <td className="p-3 text-center text-[11px]">
                      {b.startDate} ถึง {b.endDate} ({b.totalDays} วัน)
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      ฿{b.grandTotal.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'Confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'Completed'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Maintenance Alerts & Customer Risk Summary */}
        <div className="space-y-4">
          
          {/* Maintenance Alert Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-rose-600" />
                <span>การแจ้งเตือนการเช็กระยะ</span>
              </h3>
              <button
                onClick={() => onNavigateModule('maintenance')}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                จัดการ
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {vehicles
                .filter((v) => v.currentOdometer >= v.nextServiceKm - 1000)
                .map((v) => (
                  <div key={v.id} className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>{v.plateNumber} ({v.model})</span>
                      <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded">ถึงกำหนด!</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono">
                      เลขไมล์ปัจจุบัน: {v.currentOdometer.toLocaleString()} กม. (กำหนด: {v.nextServiceKm.toLocaleString()} กม.)
                    </p>
                  </div>
                ))}

              {vehicles.filter((v) => v.currentOdometer >= v.nextServiceKm - 1000).length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">รถยนต์ทุกคันอยู่ในสถานะสมบูรณ์พร้อมใช้งาน</p>
              )}
            </div>
          </div>

          {/* Loyalty Top Tier Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>สรุประดับสมาชิก Platinum / Gold</span>
              </h3>
              <button
                onClick={() => onNavigateModule('loyalty')}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                ดูรายละเอียด
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {customers
                .filter((c) => c.tier === 'Platinum' || c.tier === 'Gold')
                .slice(0, 3)
                .map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">{c.fullName}</p>
                      <p className="text-[10px] text-slate-500">เช่าแล้ว {c.totalRentalsCount} ครั้ง • {c.totalSpentTHB.toLocaleString()} THB</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        c.tier === 'Platinum' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.tier} ({c.pointsBalance} pt)
                    </span>
                  </div>
                ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
