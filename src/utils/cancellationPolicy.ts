import { differenceInDays, parseISO, format } from 'date-fns';
import { Booking } from '../types/erp';

export interface CancellationPolicyResult {
  daysUntilRental: number;
  policyTierName: string;
  refundPercentage: number;
  forfeitPercentage: number;
  suggestedRefundAmount: number;
  suggestedForfeitAmount: number;
  policySummary: string;
  policyColor: 'green' | 'amber' | 'red';
}

/**
 * Calculates smart cancellation deposit refund suggestion according to rental company rules:
 * - > 7 days prior to rental start: 100% Refund (0% Forfeit)
 * - 3 - 7 days prior to rental start: 50% Refund (50% Forfeit)
 * - < 3 days prior to rental start: 0% Refund (100% Forfeit)
 */
export function calculateCancellationPolicy(
  booking: Booking,
  requestDateStr?: string
): CancellationPolicyResult {
  const deposit = booking.depositAmount || 0;
  
  // Use today or cancellationRequestedAt
  const reqDateStr = requestDateStr || booking.cancellationRequestedAt || format(new Date(), 'yyyy-MM-dd');
  
  let daysUntilRental = 0;
  try {
    const startDate = parseISO(booking.startDate);
    const reqDate = parseISO(reqDateStr.slice(0, 10));
    daysUntilRental = differenceInDays(startDate, reqDate);
  } catch (e) {
    daysUntilRental = 0;
  }

  if (daysUntilRental >= 7) {
    return {
      daysUntilRental,
      policyTierName: 'ยกเลิกล่วงหน้ามากกว่า 7 วัน (คืนเงินมัดจำ 100%)',
      refundPercentage: 100,
      forfeitPercentage: 0,
      suggestedRefundAmount: deposit,
      suggestedForfeitAmount: 0,
      policySummary: `ขอยกเลิกล่วงหน้า ${daysUntilRental} วัน (เข้าเงื่อนไข > 7 วัน) → แนะนำคืนเงินมัดจำเต็มจำนวน 100% (฿${deposit.toLocaleString()})`,
      policyColor: 'green',
    };
  } else if (daysUntilRental >= 3) {
    const forfeit = Math.round(deposit * 0.5);
    const refund = Math.max(0, deposit - forfeit);
    return {
      daysUntilRental,
      policyTierName: 'ยกเลิกล่วงหน้า 3 - 7 วัน (คืนมัดจำ 50% / ยึดมัดจำ 50%)',
      refundPercentage: 50,
      forfeitPercentage: 50,
      suggestedRefundAmount: refund,
      suggestedForfeitAmount: forfeit,
      policySummary: `ขอยกเลิกล่วงหน้า ${daysUntilRental} วัน (เข้าเงื่อนไข 3 - 7 วัน) → แนะนำคืนมัดจำ 50% (฿${refund.toLocaleString()}) และยึดมัดจำ 50% (฿${forfeit.toLocaleString()})`,
      policyColor: 'amber',
    };
  } else {
    return {
      daysUntilRental,
      policyTierName: 'ยกเลิกล่วงหน้าน้อยกว่า 3 วัน / กะทันหัน (ยึดมัดจำ 100%)',
      refundPercentage: 0,
      forfeitPercentage: 100,
      suggestedRefundAmount: 0,
      suggestedForfeitAmount: deposit,
      policySummary: `ขอยกเลิกล่วงหน้าเพียง ${Math.max(0, daysUntilRental)} วัน (< 72 ชม.) → แนะนำยึดมัดจำ 100% (฿${deposit.toLocaleString()}) เพื่อชดเชยการเสียโอกาสปล่อยเช่า`,
      policyColor: 'red',
    };
  }
}
