import React, { useState, useEffect } from 'react';
import {
  initialVehicles,
  initialCustomers,
  initialCoupons,
  initialBookings,
  initialWorkOrders,
  initialJournalEntries,
} from './data/initialData';
import { Vehicle, Customer, Coupon, Booking, MaintenanceWorkOrder, JournalEntry, VehicleStatus } from './types/erp';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { FleetModule } from './components/fleet/FleetModule';
import { BookingModule } from './components/booking/BookingModule';
import { InspectionModule } from './components/inspection/InspectionModule';
import { MaintenanceModule } from './components/maintenance/MaintenanceModule';
import { CouponModule } from './components/coupons/CouponModule';
import { LoyaltyModule } from './components/loyalty/LoyaltyModule';
import { AccountingModule } from './components/accounting/AccountingModule';
import { CrmModule } from './components/crm/CrmModule';
import { CustomerStorefront } from './components/storefront/CustomerStorefront';
import { LoginModal } from './components/auth/LoginModal';
import { UserProfile, UserRole, StaffMember, getAllowedModulesForUser } from './types/auth';
import { DEMO_USERS, INITIAL_STAFF_MEMBERS, getCurrentAuthUser, signOutUser } from './lib/supabaseAuth';
import { isSupabaseConfigured } from './lib/supabase';
import { fetchAllData } from './lib/supabaseService';
import { StaffManagementModal } from './components/staff/StaffManagementModal';
import { DocumentPdfModal } from './components/pdf/DocumentPdfModal';
import { useErpStore } from './store/useErpStore';

export default function App() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  // Portal & User Auth State
  const [portal, setPortal] = useState<'storefront' | 'admin'>('storefront');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [initialLoginRole, setInitialLoginRole] = useState<UserRole>('customer');

  // Staff Members Management State
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(INITIAL_STAFF_MEMBERS);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);

  // PDF Engine Zustand state
  const { pdfDocumentBooking, pdfModalOpen, closePdfModal } = useErpStore();

  // Core ERP Master States

  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>(initialWorkOrders);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialJournalEntries);

  // Restore auth session on mount/refresh
  useEffect(() => {
    getCurrentAuthUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        const savedPortal = localStorage.getItem('app_user_portal') as 'storefront' | 'admin';
        if (savedPortal === 'admin' || savedPortal === 'storefront') {
          setPortal(savedPortal);
        }
      }
    });
  }, []);

  // Sync with Supabase on mount if configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchAllData().then((res) => {
        if (res) {
          if (res.vehicles && res.vehicles.length > 0) setVehicles(res.vehicles);
          if (res.customers && res.customers.length > 0) setCustomers(res.customers);
          if (res.coupons && res.coupons.length > 0) setCoupons(res.coupons);
          if (res.bookings && res.bookings.length > 0) setBookings(res.bookings);
          if (res.workOrders && res.workOrders.length > 0) setWorkOrders(res.workOrders);
          if (res.journalEntries && res.journalEntries.length > 0) setJournalEntries(res.journalEntries);
          setDbConnected(true);
        }
      });
    }
  }, []);

  // Sync currentUser points and tier live with customers array
  useEffect(() => {
    if (currentUser) {
      const matched = customers.find(
        (c) => c.email === currentUser.email || c.fullName.includes(currentUser.name) || c.id === currentUser.id
      );
      if (matched && (matched.pointsBalance !== currentUser.points || matched.tier !== currentUser.tier)) {
        const updatedUser: UserProfile = {
          ...currentUser,
          points: matched.pointsBalance,
          tier: matched.tier,
        };
        setCurrentUser(updatedUser);
        try {
          localStorage.setItem('app_user_profile', JSON.stringify(updatedUser));
        } catch (e) {
          // ignore
        }
      }
    }
  }, [customers, currentUser]);

  // Computed Metrics
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter((v) => v.status === 'Available').length;
  const activeRentals = vehicles.filter((v) => v.status === 'Rented').length;
  const utilizationRate = totalVehicles > 0 ? (activeRentals / totalVehicles) * 100 : 0;
  const monthlyRevenue = bookings.reduce((sum, b) => sum + (b.grandTotal - b.vatAmount), 0);
  const maintenanceAlerts = vehicles.filter((v) => v.currentOdometer >= v.nextServiceKm - 1000).length;
  const pointsLiability = customers.reduce((sum, c) => sum + c.pointsBalance, 0);

  // Automatically enforce module access based on active user's staff role
  useEffect(() => {
    if (portal === 'admin' && currentUser) {
      const allowed = getAllowedModulesForUser(currentUser);
      if (allowed.length > 0 && !allowed.includes(activeModule)) {
        setActiveModule(allowed[0]);
      }
    }
  }, [currentUser, portal, activeModule]);

  // Auth Handlers
  const handleOpenLogin = (role: UserRole = 'customer') => {
    setInitialLoginRole(role);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (user: UserProfile, targetPortal: 'storefront' | 'admin') => {
    setCurrentUser(user);
    setPortal(targetPortal);
    try {
      localStorage.setItem('app_user_profile', JSON.stringify(user));
      localStorage.setItem('app_user_portal', targetPortal);
    } catch (e) {
      console.warn('Failed to save user session to localStorage', e);
    }
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('app_user_profile');
      localStorage.removeItem('app_user_portal');
    } catch (e) {
      console.warn('Failed to remove user session from localStorage', e);
    }
    signOutUser();
  };

  const handleStorefrontBooking = (vehicleId: string) => {
    if (!currentUser) {
      handleOpenLogin('customer');
      return;
    }
    // Jump to admin booking page to process contract
    setPortal('admin');
    setActiveModule('booking');
  };

  // Actions
  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehicles([newVehicle, ...vehicles]);
  };

  const handleUpdateVehicleStatus = (vehicleId: string, newStatus: VehicleStatus) => {
    setVehicles(
      vehicles.map((v) => (v.id === vehicleId ? { ...v, status: newStatus } : v))
    );
  };

  const handleUpdateVehicleOdometerAndFuel = (vehicleId: string, odo: number, fuel: number) => {
    setVehicles(
      vehicles.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              currentOdometer: odo,
              fuelLevelPercent: fuel,
              status: fuel < 100 ? 'Available' : v.status,
            }
          : v
      )
    );
  };

  const handleAddBooking = (newBooking: Booking) => {
    setBookings([newBooking, ...bookings]);

    // 1. Update vehicle status
    handleUpdateVehicleStatus(newBooking.vehicleId, 'Rented');

    // 2. Add points to customer (and create customer record if doesn't exist yet)
    setCustomers((prev) => {
      const matchIndex = prev.findIndex(
        (c) =>
          c.id === newBooking.customerId ||
          c.fullName.includes(newBooking.customerName) ||
          (currentUser && (c.email === currentUser.email || c.fullName === currentUser.name))
      );

      if (matchIndex >= 0) {
        return prev.map((c, idx) =>
          idx === matchIndex
            ? {
                ...c,
                pointsBalance: c.pointsBalance + newBooking.pointsEarned,
                totalRentalsCount: c.totalRentalsCount + 1,
                totalSpentTHB: c.totalSpentTHB + newBooking.grandTotal,
              }
            : c
        );
      } else {
        const newCust: Customer = {
          id: newBooking.customerId || `cust-${Date.now()}`,
          fullName: newBooking.customerName,
          nationalId: '3-1002-00821-44-1',
          driverLicenseNo: 'DL-99120033',
          phone: currentUser?.phone || '081-998-8822',
          email: currentUser?.email || 'customer@driveerp.com',
          tier: 'Silver',
          pointsBalance: newBooking.pointsEarned,
          totalRentalsCount: 1,
          totalSpentTHB: newBooking.grandTotal,
          isBlacklisted: false,
          creditLimitTHB: 10000,
          registeredDate: new Date().toISOString().split('T')[0],
        };
        return [newCust, ...prev];
      }
    });

    // 3. Update active user profile points directly
    if (currentUser) {
      const updatedUser: UserProfile = {
        ...currentUser,
        points: (currentUser.points || 0) + newBooking.pointsEarned,
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('app_user_profile', JSON.stringify(updatedUser));
      } catch (e) {
        // ignore
      }
    }

    // 4. Create IFRS 15 Journal Entry automatically
    const newJe: JournalEntry = {
      id: `je-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      voucherNo: `JV-202607-${Math.floor(100 + Math.random() * 900)}`,
      description: `รับชำระค่าเช่ารถ พร้อมตั้ง Deferred Revenue แต้มสะสม (${newBooking.pointsEarned} pt) - สัญญา ${newBooking.bookingCode}`,
      debitAccount: '1110 - เงินสด/เงินฝากธนาคาร (Cash & Bank)',
      debitAmount: newBooking.grandTotal,
      creditAccount: '4110 - รายได้ค่าเช่ารถยนต์ (Rental Revenue)',
      creditAmount: newBooking.grandTotal - newBooking.vatAmount,
      bookingRefId: newBooking.id,
      vehicleRefId: newBooking.vehicleId,
      notes: `รวม Deferred Revenue (Point Liability) จำนวน ${newBooking.pointsEarned} THB`,
    };

    setJournalEntries([newJe, ...journalEntries]);
  };

  const handleUpdateBookingStatus = (bookingId: string, status: Booking['status']) => {
    setBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
  };

  const handleCancelBooking = (
    bookingId: string,
    forfeitDepositAmount: number,
    cancelReason: string
  ) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;

    const refundedDepositAmount = Math.max(0, targetBooking.depositAmount - forfeitDepositAmount);

    // 1. Update Booking status to 'Cancelled'
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'Cancelled',
              cancelReason,
              cancelledAt: new Date().toISOString().split('T')[0],
              depositForfeitedAmount: forfeitDepositAmount,
              depositRefundedAmount: refundedDepositAmount,
            }
          : b
      )
    );

    // 2. Release Vehicle back to Available status
    handleUpdateVehicleStatus(targetBooking.vehicleId, 'Available');

    // 3. AUTO DEDUCT REWARD POINTS & adjust customer stats
    setCustomers((prev) =>
      prev.map((c) => {
        if (
          c.id === targetBooking.customerId ||
          c.fullName.includes(targetBooking.customerName) ||
          (currentUser && (c.email === currentUser.email || c.fullName === currentUser.name))
        ) {
          const newPoints = Math.max(0, c.pointsBalance - targetBooking.pointsEarned);
          const newCount = Math.max(0, c.totalRentalsCount - 1);
          const newSpent = Math.max(0, c.totalSpentTHB - targetBooking.grandTotal);
          return {
            ...c,
            pointsBalance: newPoints,
            totalRentalsCount: newCount,
            totalSpentTHB: newSpent,
          };
        }
        return c;
      })
    );

    if (currentUser) {
      const updatedUser: UserProfile = {
        ...currentUser,
        points: Math.max(0, (currentUser.points || 0) - targetBooking.pointsEarned),
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('app_user_profile', JSON.stringify(updatedUser));
      } catch (e) {
        // ignore
      }
    }

    // 4. Create Accounting Journal Entry for Booking Cancellation & Deposit Forfeiture
    const cancelJe: JournalEntry = {
      id: `je-cancel-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      voucherNo: `JV-CANCEL-${Math.floor(1000 + Math.random() * 9000)}`,
      description: `ยกเลิกการจอง ${targetBooking.bookingCode} (สาเหตุ: ${cancelReason}) - ริบเงินมัดจำ ฿${forfeitDepositAmount.toLocaleString()} / คืนมัดจำ ฿${refundedDepositAmount.toLocaleString()} / หักแต้มคืน AUTO ${targetBooking.pointsEarned} pt`,
      debitAccount: '2110 - เงินมัดจำรอดำเนินการ (Deposit Liability)',
      debitAmount: targetBooking.depositAmount,
      creditAccount: forfeitDepositAmount > 0 
        ? '4210 - รายได้จากการริบเงินมัดจำ (Forfeited Deposit Income)' 
        : '1110 - เงินสด/เงินฝากธนาคาร (Cash & Bank)',
      creditAmount: targetBooking.depositAmount,
      bookingRefId: targetBooking.id,
      vehicleRefId: targetBooking.vehicleId,
      notes: `หักแต้มสะสม ${targetBooking.pointsEarned} pt คืนจากบัญชีลูกค้า AUTO`,
    };

    setJournalEntries((prev) => [cancelJe, ...prev]);
  };

  const handleAddWorkOrder = (wo: MaintenanceWorkOrder) => {
    setWorkOrders([wo, ...workOrders]);
    handleUpdateVehicleStatus(wo.vehicleId, 'Maintenance');
  };

  const handleUpdateWorkOrderStatus = (woId: string, status: MaintenanceWorkOrder['status']) => {
    setWorkOrders(
      workOrders.map((wo) => {
        if (wo.id === woId) {
          if (status === 'Completed') {
            handleUpdateVehicleStatus(wo.vehicleId, 'Available');
          }
          return { ...wo, status };
        }
        return wo;
      })
    );
  };

  const handleAddCoupon = (coupon: Coupon) => {
    setCoupons([coupon, ...coupons]);
  };

  const handleRedeemPoints = (customerId: string, pointsAmount: number, rewardName: string) => {
    setCustomers(
      customers.map((c) =>
        c.id === customerId
          ? { ...c, pointsBalance: Math.max(0, c.pointsBalance - pointsAmount) }
          : c
      )
    );
  };

  const handleAdjustCustomerPoints = (customerId: string, pointsDelta: number, reason?: string) => {
    setCustomers(
      customers.map((c) =>
        c.id === customerId
          ? { ...c, pointsBalance: Math.max(0, c.pointsBalance + pointsDelta) }
          : c
      )
    );
  };

  const handleToggleBlacklist = (customerId: string, reason?: string) => {
    setCustomers(
      customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              isBlacklisted: !c.isBlacklisted,
              blacklistReason: !c.isBlacklisted ? reason || 'ผู้ดูแลระบบตั้งค่าเป็น Blacklist' : undefined,
            }
          : c
      )
    );
  };

  // Staff Management Handlers
  const handleAddStaff = (newStaffData: Omit<StaffMember, 'id' | 'createdAt'>) => {
    const newStaff: StaffMember = {
      ...newStaffData,
      id: 'stf-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setStaffMembers([newStaff, ...staffMembers]);
  };

  const handleUpdateStaffPin = (staffId: string, newPin: string) => {
    setStaffMembers(
      staffMembers.map((s) => (s.id === staffId ? { ...s, pin: newPin } : s))
    );
  };

  const handleDeleteStaff = (staffId: string) => {
    setStaffMembers(staffMembers.filter((s) => s.id !== staffId));
  };

  const metrics = {
    totalVehicles,
    availableVehicles,
    activeRentals,
    utilizationRate,
    monthlyRevenue,
    maintenanceAlerts,
    pointsLiability,
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Auth Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialRole={initialLoginRole}
        staffMembers={staffMembers}
      />

      {/* Staff Management Modal for Owner */}
      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        staffMembers={staffMembers}
        onAddStaff={handleAddStaff}
        onUpdateStaffPin={handleUpdateStaffPin}
        onDeleteStaff={handleDeleteStaff}
      />

      {/* Document PDF Renderer Modal */}
      <DocumentPdfModal
        isOpen={pdfModalOpen}
        onClose={closePdfModal}
        booking={pdfDocumentBooking}
      />


      {/* PORTAL SWITCHING */}
      {portal === 'storefront' ? (
        /* Customer Storefront View */
        <CustomerStorefront
          vehicles={vehicles}
          customers={customers}
          user={currentUser}
          onOpenLogin={() => handleOpenLogin('customer')}
          onLogout={handleLogout}
          onOpenBookingModal={handleStorefrontBooking}
          onSwitchToAdmin={() => {
            if (!currentUser || currentUser.role === 'customer') {
              handleOpenLogin('owner');
            } else {
              setPortal('admin');
            }
          }}
          bookings={bookings}
          coupons={coupons}
          onAddBooking={handleAddBooking}
          onCancelBooking={handleCancelBooking}
        />
      ) : (
        /* Owner & Staff DriveERP Admin View */
        <div className="flex min-h-screen">
          {/* Left Sidebar */}
          <Sidebar
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            metrics={metrics}
            isOpenMobile={isOpenMobile}
            setIsOpenMobile={setIsOpenMobile}
            user={currentUser}
          />

          {/* Right Main Content Column */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            
            {/* Top Header Bar */}
            <TopBar
              activeModule={activeModule}
              setActiveModule={setActiveModule}
              metrics={metrics}
              onOpenMobileSidebar={() => setIsOpenMobile(true)}
              user={currentUser}
              onSwitchToStorefront={() => setPortal('storefront')}
              onOpenLogin={() => handleOpenLogin('owner')}
              onLogout={handleLogout}
              onOpenStaffModal={() => setIsStaffModalOpen(true)}
            />

            {/* Main Workspace Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
              {activeModule === 'dashboard' && (
                <DashboardModule
                  vehicles={vehicles}
                  bookings={bookings}
                  customers={customers}
                  coupons={coupons}
                  workOrders={workOrders}
                  journalEntries={journalEntries}
                  onNavigateModule={setActiveModule}
                />
              )}

              {activeModule === 'fleet' && (
                <FleetModule
                  vehicles={vehicles}
                  onAddVehicle={handleAddVehicle}
                  onUpdateVehicleStatus={handleUpdateVehicleStatus}
                />
              )}

              {activeModule === 'booking' && (
                <BookingModule
                  bookings={bookings}
                  vehicles={vehicles}
                  customers={customers}
                  coupons={coupons}
                  onAddBooking={handleAddBooking}
                  onUpdateBookingStatus={handleUpdateBookingStatus}
                  onCancelBooking={handleCancelBooking}
                />
              )}

              {activeModule === 'inspection' && (
                <InspectionModule
                  vehicles={vehicles}
                  bookings={bookings}
                  onUpdateVehicleOdometerAndFuel={handleUpdateVehicleOdometerAndFuel}
                />
              )}

              {activeModule === 'maintenance' && (
                <MaintenanceModule
                  workOrders={workOrders}
                  vehicles={vehicles}
                  onAddWorkOrder={handleAddWorkOrder}
                  onUpdateWorkOrderStatus={handleUpdateWorkOrderStatus}
                />
              )}

              {activeModule === 'coupons' && (
                <CouponModule
                  coupons={coupons}
                  customers={customers}
                  onAddCoupon={handleAddCoupon}
                />
              )}

              {activeModule === 'loyalty' && (
                <LoyaltyModule
                  customers={customers}
                  onRedeemPoints={handleRedeemPoints}
                  onAdjustPoints={handleAdjustCustomerPoints}
                />
              )}

              {activeModule === 'accounting' && (
                <AccountingModule
                  journalEntries={journalEntries}
                  vehicles={vehicles}
                  bookings={bookings}
                />
              )}

              {activeModule === 'crm' && (
                <CrmModule
                  customers={customers}
                  bookings={bookings}
                  onToggleBlacklist={handleToggleBlacklist}
                  onAdjustPoints={handleAdjustCustomerPoints}
                />
              )}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-5 border-t border-slate-800 text-xs mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
                <p>© 2026 DriveERP Systems • Car Rental ERP, Coupon Engine & Loyalty Points Architecture</p>
                <div className="flex items-center space-x-3 text-slate-500 font-mono text-[11px]">
                  <span>IFRS 15 Compliant</span>
                  <span>•</span>
                  <span>Supabase Auth & Database</span>
                  <span>•</span>
                  <span>Automated Contracts</span>
                </div>
              </div>
            </footer>

          </div>
        </div>
      )}

    </div>
  );
}

