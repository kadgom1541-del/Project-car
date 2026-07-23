import { create } from 'zustand';
import { Vehicle, Booking, Customer } from '../types/erp';
import { differenceInDays, differenceInHours, parseISO, format } from 'date-fns';

export interface BookingDraft {
  vehicleId: string | null;
  selectedVehicle: Vehicle | null;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
  pickupLocation: string;
  returnLocation: string;
  driverName: string;
  driverPhone: string;
  driverLicenseNo: string;
  couponCode: string;
  discountAmount: number;
  selectedAddons: { id: string; name: string; pricePerDay: number }[];
  note: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
}

interface ErpState {
  // Booking Draft state
  bookingDraft: BookingDraft;
  setBookingDraft: (draft: Partial<BookingDraft>) => void;
  resetBookingDraft: () => void;
  
  // Cart & Addon state
  selectedAddons: { id: string; name: string; pricePerDay: number }[];
  toggleAddon: (addon: { id: string; name: string; pricePerDay: number }) => void;
  
  // Notification Toast System
  notifications: ToastNotification[];
  addNotification: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  
  // Fleet Quick Filter State
  fleetSearchQuery: string;
  setFleetSearchQuery: (query: string) => void;
  fleetCategoryFilter: string;
  setFleetCategoryFilter: (category: string) => void;
  fleetStatusFilter: string;
  setFleetStatusFilter: (status: string) => void;

  // Active Selected PDF Document
  pdfDocumentBooking: Booking | null;
  pdfModalOpen: boolean;
  openPdfModal: (booking: Booking) => void;
  closePdfModal: () => void;
}

const initialBookingDraft: BookingDraft = {
  vehicleId: null,
  selectedVehicle: null,
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: format(new Date(Date.now() + 86400000 * 3), 'yyyy-MM-dd'),
  pickupLocation: 'สาขาสุวรรณภูมิ HQ',
  returnLocation: 'สาขาสุวรรณภูมิ HQ',
  driverName: '',
  driverPhone: '',
  driverLicenseNo: '',
  couponCode: '',
  discountAmount: 0,
  selectedAddons: [
    { id: 'add-1', name: 'ประกันภัยชั้น 1 แบบไม่มีค่าเสียหายส่วนแรก (Zero Deductible)', pricePerDay: 250 },
  ],
  note: '',
};

export const useErpStore = create<ErpState>((set, get) => ({
  bookingDraft: initialBookingDraft,

  setBookingDraft: (draft) =>
    set((state) => ({
      bookingDraft: { ...state.bookingDraft, ...draft },
    })),

  resetBookingDraft: () =>
    set({
      bookingDraft: initialBookingDraft,
      selectedAddons: initialBookingDraft.selectedAddons,
    }),

  selectedAddons: initialBookingDraft.selectedAddons,

  toggleAddon: (addon) =>
    set((state) => {
      const exists = state.selectedAddons.some((a) => a.id === addon.id);
      const updated = exists
        ? state.selectedAddons.filter((a) => a.id !== addon.id)
        : [...state.selectedAddons, addon];
      return {
        selectedAddons: updated,
        bookingDraft: { ...state.bookingDraft, selectedAddons: updated },
      };
    }),

  notifications: [],

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        },
        ...state.notifications.slice(0, 4), // Keep max 5
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  fleetSearchQuery: '',
  setFleetSearchQuery: (query) => set({ fleetSearchQuery: query }),
  
  fleetCategoryFilter: 'All',
  setFleetCategoryFilter: (category) => set({ fleetCategoryFilter: category }),

  fleetStatusFilter: 'All',
  setFleetStatusFilter: (status) => set({ fleetStatusFilter: status }),

  pdfDocumentBooking: null,
  pdfModalOpen: false,

  openPdfModal: (booking) => set({ pdfDocumentBooking: booking, pdfModalOpen: true }),
  closePdfModal: () => set({ pdfDocumentBooking: null, pdfModalOpen: false }),
}));

/**
 * Helper hook to calculate dynamic rental price totals using date-fns
 */
export function useRentalCalculation() {
  const { bookingDraft, selectedAddons } = useErpStore();

  const start = bookingDraft.startDate ? parseISO(bookingDraft.startDate) : new Date();
  const end = bookingDraft.endDate ? parseISO(bookingDraft.endDate) : new Date();

  let days = differenceInDays(end, start);
  if (days <= 0) days = 1;

  const dailyRate = bookingDraft.selectedVehicle?.dailyRate || 0;
  const subtotalRental = dailyRate * days;

  const addonsPerDay = selectedAddons.reduce((sum, item) => sum + item.pricePerDay, 0);
  const totalAddons = addonsPerDay * days;

  const grossTotal = subtotalRental + totalAddons;
  const netTotal = Math.max(0, grossTotal - bookingDraft.discountAmount);
  const vat7Percent = Math.round(netTotal * 0.07);
  const grandTotal = netTotal + vat7Percent;
  const depositAmount = 3000; // Standard security deposit

  return {
    days,
    dailyRate,
    subtotalRental,
    totalAddons,
    grossTotal,
    discountAmount: bookingDraft.discountAmount,
    netTotal,
    vat7Percent,
    grandTotal,
    depositAmount,
  };
}
