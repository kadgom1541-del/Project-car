export type UserRole = 'customer' | 'staff' | 'owner';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  phone?: string;
  points?: number;
  tier?: 'Standard' | 'Member' | 'Silver' | 'Gold' | 'Platinum';
  pin?: string;
  roleTitle?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  pin: string;
  role: 'staff';
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  portal: 'storefront' | 'admin';
  isLoading: boolean;
}

export function getAllowedModulesForUser(user: UserProfile | null): string[] {
  if (!user) return ['fleet', 'booking'];

  // Owner has full access to all 9 modules
  if (user.role === 'owner') {
    return ['dashboard', 'fleet', 'booking', 'inspection', 'maintenance', 'coupons', 'loyalty', 'accounting', 'crm'];
  }

  // Role-specific filtering for Staff members
  if (user.role === 'staff') {
    const title = user.roleTitle || '';

    // 1. ผู้จัดการสาขา และ ผู้ดูแลระบบ / ผู้ดูแลสมาชิก (Manager & Supervisor / Admin)
    if (
      title.includes('ผู้จัดการ') ||
      title.includes('ผู้ดูแล') ||
      title.includes('Manager') ||
      title.includes('Supervisor') ||
      title.includes('Admin')
    ) {
      return ['dashboard', 'fleet', 'booking', 'inspection', 'maintenance', 'coupons', 'loyalty', 'accounting', 'crm'];
    }

    // 2. ช่างเทคนิคและผู้ดูแลฟลีตรถ
    if (title.includes('ช่างเทคนิค') || title.includes('ฟลีตรถ') || title.includes('Technician')) {
      return ['fleet', 'inspection', 'maintenance', 'loyalty'];
    }

    // 3. เจ้าหน้าที่บัญชีและการเงิน
    if (title.includes('บัญชี') || title.includes('การเงิน') || title.includes('Accounting')) {
      return ['dashboard', 'accounting', 'booking', 'crm', 'loyalty'];
    }

    // 4. เจ้าหน้าที่เคาน์เตอร์และส่งมอบรถ
    if (title.includes('เคาน์เตอร์') || title.includes('ส่งมอบ') || title.includes('Counter')) {
      return ['fleet', 'booking', 'inspection', 'coupons', 'loyalty', 'crm'];
    }

    // Default fallback for general staff (always grant access to loyalty / membership)
    return ['fleet', 'booking', 'inspection', 'crm', 'loyalty'];
  }

  return ['fleet', 'booking'];
}

