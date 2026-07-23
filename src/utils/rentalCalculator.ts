import {
  differenceInDays,
  differenceInHours,
  parseISO,
  format,
  addDays,
  isBefore,
  isAfter,
  isValid,
} from 'date-fns';
import { th } from 'date-fns/locale';

export interface RentalCalculationResult {
  rentalDays: number;
  rentalHoursTotal: number;
  startDateFormatted: string;
  endDateFormatted: string;
  isOverdue: boolean;
  overdueHours: number;
  overdueFee: number;
  dailyRate: number;
  baseRentalCost: number;
  vat7Percent: number;
  grandTotalWithVat: number;
  ifrs15DailyRecognizedRevenue: number;
}

/**
 * Calculates rental totals, days, overtime fees, and IFRS 15 daily revenue amortizations using date-fns
 */
export function calculateRentalBreakdown(
  startDateStr: string,
  endDateStr: string,
  dailyRate: number,
  addonsTotalPerDay: number = 0,
  discount: number = 0,
  actualReturnDateStr?: string
): RentalCalculationResult {
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);

  const isValidStart = isValid(start);
  const isValidEnd = isValid(end);

  const validStart = isValidStart ? start : new Date();
  const validEnd = isValidEnd ? end : addDays(new Date(), 1);

  let rentalDays = differenceInDays(validEnd, validStart);
  if (rentalDays <= 0) rentalDays = 1;

  const rentalHoursTotal = Math.max(24, differenceInHours(validEnd, validStart));

  // Overdue check
  let isOverdue = false;
  let overdueHours = 0;
  let overdueFee = 0;

  if (actualReturnDateStr) {
    const actualReturn = parseISO(actualReturnDateStr);
    if (isValid(actualReturn) && isAfter(actualReturn, validEnd)) {
      isOverdue = true;
      overdueHours = differenceInHours(actualReturn, validEnd);
      // Hourly overtime rate = (Daily Rate / 24) * 1.5
      const hourlyRate = (dailyRate / 24) * 1.5;
      overdueFee = Math.round(overdueHours * hourlyRate);
    }
  }

  const baseRentalCost = (dailyRate + addonsTotalPerDay) * rentalDays - discount;
  const netRentalCost = Math.max(0, baseRentalCost) + overdueFee;
  const vat7Percent = Math.round(netRentalCost * 0.07);
  const grandTotalWithVat = netRentalCost + vat7Percent;

  // IFRS 15 Daily Recognized Revenue
  const ifrs15DailyRecognizedRevenue = Math.round(netRentalCost / rentalDays);

  return {
    rentalDays,
    rentalHoursTotal,
    startDateFormatted: format(validStart, 'dd/MM/yyyy HH:mm', { locale: th }),
    endDateFormatted: format(validEnd, 'dd/MM/yyyy HH:mm', { locale: th }),
    isOverdue,
    overdueHours,
    overdueFee,
    dailyRate,
    baseRentalCost,
    vat7Percent,
    grandTotalWithVat,
    ifrs15DailyRecognizedRevenue,
  };
}

/**
 * Format Thai date strings safely
 */
export function formatThaiDate(dateIsoStr: string, pattern: string = 'dd MMMM yyyy'): string {
  try {
    const d = parseISO(dateIsoStr);
    if (!isValid(d)) return dateIsoStr;
    return format(d, pattern, { locale: th });
  } catch {
    return dateIsoStr;
  }
}
