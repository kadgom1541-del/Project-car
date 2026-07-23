import React, { useState } from 'react';
import { UserProfile, getAllowedModulesForUser } from '../types/auth';
import {
  Car,
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Gift,
  DollarSign,
  Users,
  MapPin,
  Menu,
  X,
  ChevronRight,
  UserCheck,
  Wrench,
  FileText,
} from 'lucide-react';

interface SidebarProps {
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
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  user?: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  metrics,
  isOpenMobile,
  setIsOpenMobile,
  user = null,
}) => {
  const allowedModuleIds = getAllowedModulesForUser(user);

  const navItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', sub: 'Executive Overview', icon: LayoutDashboard },
    { id: 'fleet', label: 'จัดการคลังรถ', sub: 'Fleet Inventory', icon: Car, badge: `${metrics.availableVehicles}/${metrics.totalVehicles}` },
    { id: 'booking', label: 'การจอง & สัญญา', sub: 'Bookings & Contracts', icon: FileText, badge: `${metrics.activeRentals} เช่าอยู่` },
    { id: 'inspection', label: 'ตรวจรับรถ', sub: 'Vehicle Inspection', icon: AlertTriangle },
    { id: 'maintenance', label: 'ซ่อมบำรุง', sub: 'Service Maintenance', icon: Wrench, alert: metrics.maintenanceAlerts > 0 ? metrics.maintenanceAlerts : undefined },
    { id: 'coupons', label: 'คูปองส่วนลด', sub: 'Coupon Engine', icon: Gift },
    { id: 'loyalty', label: 'คะแนนสะสม', sub: 'Loyalty Points', icon: ShieldCheck },
    { id: 'accounting', label: 'ระบบบัญชี IFRS 15', sub: 'Financial Ledger', icon: DollarSign },
    { id: 'crm', label: 'CRM & LINE OA', sub: 'Customer Profile', icon: Users },
  ].filter((item) => allowedModuleIds.includes(item.id));

  const handleSelect = (id: string) => {
    setActiveModule(id);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 lg:w-72 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out shrink-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header inside Sidebar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">DriveERP</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  PRO v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Car Rental & Accounting ERP</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branch Info Tag */}
        <div className="px-4 pt-3 pb-1">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5 flex items-center space-x-2 text-xs text-indigo-300">
            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="overflow-hidden">
              <p className="font-bold text-white text-[11px] truncate">สุวรรณภูมิ HQ Main Hub</p>
              <p className="text-[10px] text-slate-400">เวลาในระบบ: {new Date().toLocaleDateString('th-TH')}</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-none">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            เมนูการใช้งาน (Main Modules)
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                  <div className="text-left truncate">
                    <p className="leading-tight">{item.label}</p>
                    <p className={`text-[10px] font-normal truncate ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {item.sub}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  {item.alert && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                      {item.alert}
                    </span>
                  )}
                  {item.badge && !item.alert && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-white opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Manager Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user?.name || 'User'}
              className="w-9 h-9 rounded-full border border-indigo-500/40 object-cover shrink-0"
            />
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'สมชาย มั่นคง'}</p>
              <p className="text-[10px] text-indigo-300 font-medium truncate">
                {user?.role === 'owner' ? '👑 เจ้าของระบบ (Owner)' : user?.roleTitle || '💼 พนักงานปฏิบัติการ'}
              </p>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
};
