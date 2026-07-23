import React, { useState } from 'react';
import { StaffMember } from '../../types/auth';
import { Shield, KeyRound, Plus, Trash2, Edit2, RefreshCw, X, UserCheck, AlertCircle, Phone, Mail, CheckCircle2 } from 'lucide-react';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMembers: StaffMember[];
  onAddStaff: (newStaff: Omit<StaffMember, 'id' | 'createdAt'>) => void;
  onUpdateStaffPin: (staffId: string, newPin: string) => void;
  onDeleteStaff: (staffId: string) => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  staffMembers,
  onAddStaff,
  onUpdateStaffPin,
  onDeleteStaff,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // New Staff Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleTitle, setRoleTitle] = useState('เจ้าหน้าที่เคาน์เตอร์และส่งมอบรถ');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(generateRandom6DigitPin());
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  function generateRandom6DigitPin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  const handleRegeneratePin = () => {
    setPin(generateRandom6DigitPin());
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุลพนักงาน');
      return;
    }
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setErrorMsg('กรุณาระบุรหัส PIN ตัวเลข 6 หลักให้ถูกต้อง');
      return;
    }

    onAddStaff({
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@driveerp.com`,
      roleTitle,
      pin,
      role: 'staff',
      phone: phone || '081-000-0000',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
    });

    // Reset Form
    setName('');
    setEmail('');
    setRoleTitle('เจ้าหน้าที่เคาน์เตอร์และส่งมอบรถ');
    setPhone('');
    setPin(generateRandom6DigitPin());
    setIsAdding(false);
    setErrorMsg('');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg border border-emerald-400/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">ระบบจัดการบทบาทพนักงาน & PIN 6 หลัก</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                กำหนดสิทธิ์พนักงาน เพิ่มบทบาทหน้าที่ และสร้างรหัส PIN เข้าใช้งานหน้าร้านสำหรับทีมงาน
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                รายชื่อพนักงานในระบบ ({staffMembers.length} คน)
              </h3>
              <p className="text-xs text-slate-500">
                พนักงานสามารถใช้รหัส PIN 6 หลักที่กำหนดเข้าสู่ระบบจัดการได้โดยตรง
              </p>
            </div>

            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มพนักงานใหม่</span>
              </button>
            )}
          </div>

          {/* Add Staff Member Form */}
          {isAdding && (
            <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-5 space-y-4 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <span className="font-bold text-xs text-emerald-900 flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>แบบฟอร์มสร้างพนักงานและกำหนด PIN 6 หลัก</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  ยกเลิก
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ชื่อ-นามสกุล พนักงาน *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น อานนท์ ขยันดี"
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">บทบาท / ตำแหน่ง *</label>
                    <select
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold"
                    >
                      <option value="ผู้จัดการสาขา (Branch Manager)">ผู้จัดการสาขา (Branch Manager - สิทธิ์ครบทุกโมดูล)</option>
                      <option value="ผู้ดูแลระบบและสมาชิก (Supervisor / Admin)">ผู้ดูแลระบบและสมาชิก (Supervisor / Admin - สิทธิ์ MEMBERSHIP)</option>
                      <option value="เจ้าหน้าที่เคาน์เตอร์และส่งมอบรถ">เจ้าหน้าที่เคาน์เตอร์และส่งมอบรถ (Counter & Loyalty)</option>
                      <option value="ช่างเทคนิคและผู้ดูแลฟลีตรถ">ช่างเทคนิคและผู้ดูแลฟลีตรถ (Technician & Fleet)</option>
                      <option value="เจ้าหน้าที่บัญชีและการเงิน">เจ้าหน้าที่บัญชีและการเงิน (Accounting & Finance)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="081-999-0000"
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">อีเมลพนักงาน</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="arnon.staff@driveerp.com"
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>
                </div>

                {/* 6-Digit PIN Generation Box */}
                <div className="bg-white p-3.5 rounded-xl border border-emerald-300 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                      รหัส PIN 6 หลัก สำหรับเข้าสู่ระบบ:
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="font-mono text-xl font-extrabold text-emerald-700 tracking-widest bg-transparent focus:outline-none border-b border-emerald-400 w-32"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRegeneratePin}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>สุ่ม PIN ใหม่</span>
                  </button>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-300 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกพนักงานใหม่</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Staff List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffMembers.map((staff) => (
              <div
                key={staff.id}
                className="bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 p-4 transition shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={staff.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={staff.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{staff.name}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`คุณต้องการลบพนักงาน ${staff.name} ออกจากระบบหรือไม่?`)) {
                            onDeleteStaff(staff.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="ลบพนักงาน"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <span className="inline-block bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-md mt-0.5">
                      {staff.roleTitle}
                    </span>

                    <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{staff.email}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{staff.phone || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PIN Display & Regenerate */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-500 text-[11px] font-medium">รหัส PIN 6 หลัก:</span>
                    <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-sm">
                      {staff.pin}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newPin = generateRandom6DigitPin();
                      onUpdateStaffPin(staff.id, newPin);
                      alert(`เปลี่ยนรหัส PIN ให้พนักงาน ${staff.name} เป็น ${newPin} เรียบร้อยแล้ว`);
                    }}
                    className="text-[10px] font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition cursor-pointer flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>เปลี่ยน PIN</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs flex justify-between items-center text-slate-500">
          <span className="text-slate-400 font-medium">* ระบบจำกัดสิทธิ์ตามบทบาทและรหัส PIN 6 หลักของพนักงานแต่ละท่าน</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
