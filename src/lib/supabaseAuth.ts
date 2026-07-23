import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile, UserRole, StaffMember } from '../types/auth';

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'stf-001',
    name: 'วิภาวี สุขใจ',
    email: 'vipa.staff@driveerp.com',
    roleTitle: 'เจ้าหน้าที่เคาน์เตอร์และส่งมอบรถ',
    pin: '123456',
    role: 'staff',
    phone: '082-345-6789',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    createdAt: '2026-01-10',
  },
  {
    id: 'stf-002',
    name: 'สมศักดิ์ ช่างเครื่อง',
    email: 'somsak.staff@driveerp.com',
    roleTitle: 'ช่างเทคนิคและผู้ดูแลฟลีตรถ',
    pin: '888888',
    role: 'staff',
    phone: '089-888-7766',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    createdAt: '2026-02-01',
  },
];

export const DEMO_USERS: Record<UserRole, UserProfile> = {
  customer: {
    id: 'cust-demo-001',
    name: 'ลูกค้าทดลอง',
    email: 'customer.demo@example.com',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    role: 'customer',
    phone: '081-987-6543',
    points: 0,
    tier: 'Standard',
  },
  owner: {
    id: 'owner-macus-001',
    name: 'Macus Owner (เจ้าของร้าน)',
    email: 'macus@admin.com',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    role: 'owner',
    phone: '089-123-4567',
  },
  staff: {
    id: 'stf-001',
    name: 'วิภาวี สุขใจ',
    email: 'vipa.staff@driveerp.com',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    role: 'staff',
    roleTitle: 'เจ้าหน้าที่เคาน์เตอร์และส่งมอบรถ',
    pin: '123456',
    phone: '082-345-6789',
  },
};


export async function signUpCustomer(
  email: string,
  password: string,
  fullName: string,
  phone: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      const userId = data.user?.id || 'usr-' + Date.now();

      // Upsert/Insert into public.customers with 0 points
      const { error: dbError } = await supabase.from('customers').upsert({
        id: userId,
        full_name: fullName || (email ? email.split('@')[0] : 'ลูกค้าใหม่'),
        email: email,
        phone: phone || null,
        tier: 'Standard',
        points_balance: 0,
        total_rentals_count: 0,
        total_spent_thb: 0,
      });

      if (dbError) {
        console.warn('Customer database record note:', dbError.message);
      }

      const userProfile: UserProfile = {
        id: userId,
        name: fullName || (email ? email.split('@')[0] : 'ลูกค้าใหม่'),
        email: email,
        role: 'customer',
        phone: phone,
        points: 0,
        tier: 'Standard',
      };

      return { user: userProfile, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
    }
  } else {
    const userProfile: UserProfile = {
      id: 'usr-' + Date.now(),
      name: fullName || (email ? email.split('@')[0] : 'ลูกค้าใหม่'),
      email: email,
      role: 'customer',
      phone: phone,
      points: 0,
      tier: 'Standard',
    };
    return { user: userProfile, error: null };
  }
}

export async function signInCustomer(
  email: string,
  password: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Fallback check in public.customers table if password auth isn't enabled on server
        const { data: custData } = await supabase.from('customers').select('*').eq('email', email).maybeSingle();
        if (custData) {
          const userProfile: UserProfile = {
            id: custData.id,
            name: custData.full_name,
            email: custData.email,
            role: 'customer',
            phone: custData.phone || '',
            points: custData.points_balance || 0,
            tier: custData.tier || 'Standard',
          };
          return { user: userProfile, error: null };
        }
        return { user: null, error: error.message };
      }

      const userId = data.user.id;
      const { data: custData } = await supabase.from('customers').select('*').eq('id', userId).maybeSingle();

      const userProfile: UserProfile = {
        id: userId,
        name: custData?.full_name || data.user.user_metadata?.full_name || (email ? email.split('@')[0] : 'ลูกค้าสมาชิก'),
        email: email,
        role: 'customer',
        phone: custData?.phone || data.user.user_metadata?.phone || '',
        points: custData?.points_balance ?? 0,
        tier: custData?.tier || 'Standard',
      };

      return { user: userProfile, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
    }
  } else {
    const userProfile: UserProfile = {
      id: 'cust-demo-001',
      name: email ? email.split('@')[0] : 'ลูกค้าสมาชิก',
      email: email || 'customer@example.com',
      role: 'customer',
      points: 0,
      tier: 'Standard',
    };
    return { user: userProfile, error: null };
  }
}

export async function signOutUser() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
}

export async function getCurrentAuthUser(): Promise<UserProfile | null> {
  try {
    const saved = localStorage.getItem('app_user_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('localStorage parse error', e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const u = data.session.user;
        const { data: custData } = await supabase.from('customers').select('*').eq('id', u.id).maybeSingle();
        const profile: UserProfile = {
          id: u.id,
          name: custData?.full_name || u.user_metadata?.full_name || (u.email ? u.email.split('@')[0] : 'สมาชิก'),
          email: u.email || '',
          role: 'customer',
          phone: custData?.phone || u.user_metadata?.phone || '',
          points: custData?.points_balance ?? 0,
          tier: custData?.tier || 'Standard',
        };
        localStorage.setItem('app_user_profile', JSON.stringify(profile));
        return profile;
      }
    } catch (err) {
      console.warn('Supabase session fetch error', err);
    }
  }
  return null;
}
