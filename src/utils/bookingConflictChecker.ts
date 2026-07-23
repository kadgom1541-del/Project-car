import { Booking, Vehicle } from '../types/erp';
import { differenceInDays, parseISO, isAfter, isBefore, isEqual, format } from 'date-fns';
import { th } from 'date-fns/locale';

export interface VehicleRentalStatusInfo {
  isRentedOrReserved: boolean;
  statusLabel: 'พร้อมให้เช่า' | 'เช่าอยู่' | 'ติดจอง' | 'ส่งซ่อม';
  activeBooking: Booking | null;
  remainingDays: number;
  returnDateFormatted: string;
  nextAvailableDate: string; // YYYY-MM-DD
}

/**
 * Calculates current rental status, active booking, and remaining rental days for a vehicle.
 */
export function getVehicleActiveRentalInfo(vehicle: Vehicle, bookings: Booking[]): VehicleRentalStatusInfo {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const today = new Date();
  
  // Find booking that is Active/Confirmed and currently ongoing or in progress
  const activeBooking = bookings.find((b) => {
    if (b.vehicleId !== vehicle.id) return false;
    if (b.status === 'Cancelled' || b.status === 'Completed') return false;
    return b.status === 'Active' || b.status === 'Confirmed';
  });

  const isRented = vehicle.status === 'Rented' || activeBooking?.status === 'Active';
  const isReserved = vehicle.status === 'Reserved' || activeBooking?.status === 'Confirmed';

  if (!isRented && !isReserved && !activeBooking) {
    return {
      isRentedOrReserved: false,
      statusLabel: vehicle.status === 'Maintenance' ? 'ส่งซ่อม' : 'พร้อมให้เช่า',
      activeBooking: null,
      remainingDays: 0,
      returnDateFormatted: '',
      nextAvailableDate: todayStr,
    };
  }

  const targetEndDateStr = activeBooking?.endDate || todayStr;
  const endDate = parseISO(targetEndDateStr);
  let remainingDays = differenceInDays(endDate, today);
  if (remainingDays < 1) remainingDays = 1; // At least 1 day remaining or ending today

  let returnDateFormatted = targetEndDateStr;
  try {
    returnDateFormatted = format(endDate, 'd MMM yyyy', { locale: th });
  } catch (e) {
    returnDateFormatted = targetEndDateStr;
  }

  return {
    isRentedOrReserved: true,
    statusLabel: isRented ? 'เช่าอยู่' : 'ติดจอง',
    activeBooking: activeBooking || null,
    remainingDays,
    returnDateFormatted,
    nextAvailableDate: targetEndDateStr,
  };
}

export interface BookingConflictResult {
  hasConflict: boolean;
  conflictingBooking: Booking | null;
  message: string;
}

/**
 * Anti-Overlapping double booking check for a vehicle during selected start and end dates.
 */
export function checkBookingConflict(
  vehicleId: string,
  startDateStr: string,
  endDateStr: string,
  bookings: Booking[],
  excludeBookingId?: string
): BookingConflictResult {
  if (!vehicleId || !startDateStr || !endDateStr) {
    return { hasConflict: false, conflictingBooking: null, message: '' };
  }

  const requestedStart = parseISO(startDateStr);
  const requestedEnd = parseISO(endDateStr);

  const conflictingBooking = bookings.find((b) => {
    if (b.vehicleId !== vehicleId) return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status === 'Cancelled' || b.status === 'Completed') return false;

    const bStart = parseISO(b.startDate);
    const bEnd = parseISO(b.endDate);

    // Overlap condition: requestedStart <= bEnd AND requestedEnd >= bStart
    const isOverlapping =
      (isBefore(requestedStart, bEnd) || isEqual(requestedStart, bEnd)) &&
      (isAfter(requestedEnd, bStart) || isEqual(requestedEnd, bStart));

    return isOverlapping;
  });

  if (conflictingBooking) {
    let startFormatted = conflictingBooking.startDate;
    let endFormatted = conflictingBooking.endDate;
    try {
      startFormatted = format(parseISO(conflictingBooking.startDate), 'd MMM yyyy', { locale: th });
      endFormatted = format(parseISO(conflictingBooking.endDate), 'd MMM yyyy', { locale: th });
    } catch (e) {}

    return {
      hasConflict: true,
      conflictingBooking,
      message: `รถคันนี้มีการเช่า/ติดจองซ้อนในช่วงวันที่ ${startFormatted} ถึง ${endFormatted} แล้ว (ผู้เช่า: ${conflictingBooking.customerName})`,
    };
  }

  return { hasConflict: false, conflictingBooking: null, message: '' };
}
