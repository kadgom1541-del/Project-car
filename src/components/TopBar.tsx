import React from 'react';
import { Menu, Plus, Store, LogOut, User, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types/auth';

interface TopBarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  metrics: {
    totalVehicles: number;
    availableVehicles: number;
    activeRentals: number;
    utilizationRate: number;
    monthlyRevenue: number;
    maintenanceAlerts: number;
    pointsLiability: number;
  };
  onOpenMobileSidebar: () => void;
  user: UserProfile | null;
  onSwitchToStorefront: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenStaffModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeModule,
  setActiveModule,
  metrics,
  onOpenMobileSidebar,
  user,
  onSwitchToStorefront,
  onOpenLogin,
  onLogout,
  onOpenStaffModal,
}) => {
  const moduleTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'ภาพรวมระบบบริหารงาน (Executive Dashboard)', subtitle: 'ภาพรวมคลังรถ ยอดเช่า รายได้ และสถานะบัญชี IFRS 15' },
    fleet: { title: 'จัดการคลังรถยนต์ (Fleet Management)', subtitle: 'บันทึกข้อมูลรถ สถานะความพร้อม อัตราเช่า และเลขไมล์' },
    booking: { title: 'การจองและสัญญาเช่า (Bookings & Contracts)', subtitle: 'คำนวณราคาอัตโนมัติ หักคูปองสะสมแต้ม และพิมพ์สัญญา PDF' },
    inspection: { title: 'ตรวจรับรถคืนและน้ำมัน (Vehicle Inspection)', subtitle: 'บันทึกรูปถ่าย บันทึกระดับน้ำมัน และคำนวณค่าปรับเกินกำหนด' },
    maintenance: { title: 'ระบบแจ้งซ่อมและเช็กระยะ (Service Maintenance)', subtitle: 'จัดการใบสั่งซ่อม แจ้งเตือนเช็กระยะกิโลเมตร และบันทึกต้นทุน' },
    coupons: { title: 'ระบบคูปองส่วนลด (Coupon Engine)', subtitle: 'กำหนดเงื่อนไขส่วนลด คูปองเงินสด และตรวจสอบสิทธิ์การใช้' },
    loyalty: { title: 'ระบบคะแนนสะสม (Loyalty Points & Tier)', subtitle: 'บริหารระดับสมาชิก Platinum/Gold/Silver และคำนวณหนี้สินแต้ม' },
    accounting: { title: 'ระบบการเงิน บัญชี IFRS 15 (Financial Accounting)', subtitle: 'บันทึกรายได้ แยก Deferred Revenue และงบกำไรขาดทุนรายคัน' },
    crm: { title: 'CRM & LINE Official Account', subtitle: 'ฐานข้อมูลลูกค้า ตรวจสอบ Blacklist และจำลอง mini-app บนมือถือ' },
  };

  const currentInfo = moduleTitles[activeModule] || {
    title: 'DriveERP Enterprise',
    subtitle: 'ระบบบริหารงานเช่ารถยนต์ครบวงจร',
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-xs flex items-center justify-between gap-4">
      
      {/* Left: Hamburger & Page Title */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          title="เปิดเมนูข้าง"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="font-bold text-slate-900 text-sm sm:text-base truncate">{currentInfo.title}</h1>
          <p className="text-[11px] text-slate-500 truncate hidden sm:block">{currentInfo.subtitle}</p>
        </div>
      </div>

      {/* Right: Quick Metrics, Storefront Switch & User Profile */}
      <div className="flex items-center space-x-3 shrink-0">
        
        {/* Owner Staff Management Button */}
        {user?.role === 'owner' && onOpenStaffModal && (
          <button
            onClick={onOpenStaffModal}
            className="hidden md:flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl transition border border-emerald-200 cursor-pointer shadow-2xs"
            title="จัดการรายชื่อพนักงานและรหัส PIN 6 หลัก"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>พนักงาน & PIN 6 หลัก</span>
          </button>
        )}

        {/* Switch to Storefront Button */}
        <button
          onClick={onSwitchToStorefront}
          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition border border-slate-200 cursor-pointer"
          title="สลับไปยังหน้าร้านค้าลูกค้า"
        >
          <Store className="w-4 h-4 text-indigo-600" />
          <span className="hidden sm:inline">หน้าร้านค้า (Storefront)</span>
        </button>

        {/* User Profile / Login */}
        {user ? (
          <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-xl p-1 px-2.5">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
              <p className="text-[10px] text-indigo-600 font-bold uppercase">
                {user.role === 'owner' ? '👑 เจ้าของร้าน' : user.role === 'staff' ? `💼 ${user.roleTitle || 'พนักงาน'}` : '👤 ลูกค้า'}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>เข้าสู่ระบบ</span>
          </button>
        )}

        {/* Action Button */}
        {activeModule !== 'booking' && (
          <button
            onClick={() => setActiveModule('booking')}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">+ สร้างรายการเช่า</span>
            <span className="sm:hidden">สร้าง</span>
          </button>
        )}

      </div>

    </header>
  );
};


