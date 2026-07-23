import React, { useState, useEffect } from 'react';
import { Shield, User, Lock, Mail, Store, ArrowRight, X, AlertCircle, Car, KeyRound, UserCheck, Sparkles } from 'lucide-react';
import { UserRole, UserProfile, StaffMember } from '../../types/auth';
import { DEMO_USERS, INITIAL_STAFF_MEMBERS, signUpCustomer, signInCustomer } from '../../lib/supabaseAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile, portal: 'storefront' | 'admin') => void;
  initialRole?: UserRole;
  staffMembers?: StaffMember[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'customer',
  staffMembers = INITIAL_STAFF_MEMBERS,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('macus@admin.com');
  const [password, setPassword] = useState('macus');
  const [staffPin, setStaffPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole);
      setMode('login');
      setFullName('');
      setPhone('');
      setEmail('');
      setPassword('');
      setStaffPin('');
      setErrorMessage('');
      setLoading(false);
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // 1. OWNER LOGIN VERIFICATION
    if (selectedRole === 'owner') {
      if (email.toLowerCase().trim() === 'macus@admin.com' && password === 'macus') {
        const ownerUser: UserProfile = {
          id: 'owner-macus-001',
          name: 'Macus Owner (เจ้าของร้าน)',
          email: 'macus@admin.com',
          role: 'owner',
          phone: '089-123-4567',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        };
        onLoginSuccess(ownerUser, 'admin');
        setLoading(false);
        onClose();
        return;
      } else {
        setErrorMessage('อีเมลหรือรหัสผ่านเจ้าของร้านไม่ถูกต้อง (User: macus@admin.com | Pass: macus)');
        setLoading(false);
        return;
      }
    }

    // 2. STAFF PIN VERIFICATION
    if (selectedRole === 'staff') {
      const cleanPin = staffPin.trim();
      if (!cleanPin || cleanPin.length !== 6) {
        setErrorMessage('กรุณาระบุรหัส PIN ตัวเลข 6 หลักให้ถูกต้อง');
        setLoading(false);
        return;
      }

      const matchedStaff = staffMembers.find((s) => s.pin === cleanPin);
      if (matchedStaff) {
        const staffUser: UserProfile = {
          id: matchedStaff.id,
          name: matchedStaff.name,
          email: matchedStaff.email,
          role: 'staff',
          roleTitle: matchedStaff.roleTitle,
          phone: matchedStaff.phone,
          avatarUrl: matchedStaff.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        };
        onLoginSuccess(staffUser, 'admin');
        setLoading(false);
        onClose();
        return;
      } else {
        setErrorMessage('รหัส PIN 6 หลักไม่ถูกต้อง ไม่พบพนักงานในระบบ (PIN ทดลอง: 123456 หรือ 888888)');
        setLoading(false);
        return;
      }
    }

    // 3. CUSTOMER STOREFRONT LOGIN / REGISTER
    if (mode === 'register') {
      const { user, error } = await signUpCustomer(email, password, fullName, phone);
      if (error) {
        setErrorMessage(error);
        setLoading(false);
        return;
      }
      if (user) {
        onLoginSuccess(user, 'storefront');
        setLoading(false);
        onClose();
      }
    } else {
      const { user, error } = await signInCustomer(email, password);
      if (error) {
        setErrorMessage(error);
        setLoading(false);
        return;
      }
      if (user) {
        onLoginSuccess(user, 'storefront');
        setLoading(false);
        onClose();
      }
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden relative transition-all"
      >
        
        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition cursor-pointer z-30 shadow-sm"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className={`p-6 text-white text-center relative overflow-hidden ${
          selectedRole === 'owner'
            ? 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900'
            : selectedRole === 'staff'
            ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900'
            : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900'
        }`}>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-3 border ${
              selectedRole === 'owner'
                ? 'bg-emerald-600 border-emerald-400/30 shadow-emerald-600/30'
                : selectedRole === 'staff'
                ? 'bg-blue-600 border-blue-400/30 shadow-blue-500/30'
                : 'bg-indigo-600 border-indigo-400/30 shadow-indigo-500/30'
            }`}>
              {selectedRole === 'owner' ? (
                <Shield className="w-6 h-6" />
              ) : selectedRole === 'staff' ? (
                <KeyRound className="w-6 h-6" />
              ) : (
                <Car className="w-6 h-6" />
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {selectedRole === 'owner'
                ? 'เข้าสู่ระบบเจ้าของร้าน (Owner Portal)'
                : selectedRole === 'staff'
                ? 'เข้าสู่ระบบพนักงาน (Staff PIN)'
                : mode === 'login'
                ? 'เข้าสู่ระบบลูกค้า (หน้าร้านค้า)'
                : 'สมัครสมาชิกใหม่ (หน้าร้านค้า)'}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {selectedRole === 'owner'
                ? 'เข้าถึงการตั้งค่าทั้งหมด บัญชี ฟลีตรถ และคะแนนสะสม'
                : selectedRole === 'staff'
                ? 'ยืนยันตัวตนด้วยรหัส PIN 6 หลักของพนักงาน'
                : 'สะสมแต้มส่วนลด รับสิทธิพิเศษจองรถออนไลน์ได้ง่ายๆ'}
            </p>
          </div>
        </div>

        <div className="p-6">

          {/* Role Tabs Selector or Portal Switch Link */}
          {selectedRole !== 'customer' ? (
            <div className="mb-5">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('owner');
                    setEmail('');
                    setPassword('');
                    setErrorMessage('');
                  }}
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedRole === 'owner'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>👑 เจ้าของร้าน</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('staff');
                    setStaffPin('');
                    setErrorMessage('');
                  }}
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedRole === 'staff'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>💼 พนักงาน (PIN 6 หลัก)</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Customer Sub-tabs: Login vs Register */}
          {selectedRole === 'customer' && (
            <div className="flex border-b border-slate-200 mb-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 text-center text-xs font-extrabold border-b-2 transition cursor-pointer ${
                  mode === 'login'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                เข้าสู่ระบบ (Sign In)
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2.5 text-center text-xs font-extrabold border-b-2 transition cursor-pointer ${
                  mode === 'register'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                สมัครสมาชิกใหม่ (Register)
              </button>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmitForm} className="space-y-3">
            {mode === 'register' && selectedRole === 'customer' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">ชื่อ-นามสกุล</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="สมชาย ใจดี"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="081-234-5678"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* STAFF PIN INPUT FIELD */}
            {selectedRole === 'staff' ? (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">กรอกรหัส PIN 6 หลักของพนักงาน</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">อีเมลผู้ใช้งาน</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'customer' ? 'customer@example.com' : 'macus@admin.com'}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">รหัสผ่าน</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-md mt-2 ${
                selectedRole === 'owner'
                  ? 'bg-emerald-700 hover:bg-emerald-600'
                  : selectedRole === 'staff'
                  ? 'bg-blue-700 hover:bg-blue-600'
                  : 'bg-slate-900 hover:bg-indigo-600'
              }`}
            >
              <span>
                {loading
                  ? 'กำลังตรวจสอบการเข้าสู่ระบบ...'
                  : mode === 'register' && selectedRole === 'customer'
                  ? 'ยืนยันสมัครสมาชิก'
                  : selectedRole === 'owner'
                  ? 'เข้าสู่ระบบเจ้าของร้าน (macus@admin.com)'
                  : selectedRole === 'staff'
                  ? 'เข้าสู่ระบบด้วย PIN พนักงาน'
                  : 'เข้าสู่ระบบ'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Discreet Staff & Owner Portal Link */}
          <div className="mt-5 pt-3 border-t border-slate-100 text-center">
            {selectedRole === 'customer' ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('owner');
                  setEmail('');
                  setPassword('');
                  setErrorMessage('');
                }}
                className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition cursor-pointer inline-flex items-center space-x-1"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>สำหรับเจ้าของร้าน & พนักงานเข้าสู่ระบบ (Staff / Owner Portal)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('customer');
                  setMode('login');
                  setErrorMessage('');
                }}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer inline-flex items-center space-x-1"
              >
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>← กลับสู่หน้าเข้าสู่ระบบลูกค้า (Storefront Customer)</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

