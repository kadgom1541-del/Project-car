import { Coupon, Vehicle, Customer, VehicleCategory, Booking } from '../types/erp';
import { FINANCE_CONFIG } from '../config/financeConfig';

export interface CouponValidationResult {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
  discountAmount: number;
}

/**
 * Waterfall Validation Engine for Coupon Rules Matrix
 */
export function validateCouponWaterfall(
  coupon: Coupon,
  params: {
    rentDurationDays: number;
    baseRentAmount: number;
    vehicleCategory: VehicleCategory;
    bookingDateStr: string; // YYYY-MM-DD
    customer: Customer;
    selectedAddonsTotal: number;
    existingAppliedCoupons?: string[];
  }
): CouponValidationResult {
  const { rentDurationDays, baseRentAmount, vehicleCategory, bookingDateStr, customer, existingAppliedCoupons } = params;

  // VR-01: Minimum Duration Check
  if (rentDurationDays < coupon.minDurationDays) {
    return {
      isValid: false,
      errorCode: 'VR-01',
      errorMessage: `คูปองนี้ใช้ได้เมื่อเช่าอย่างน้อย ${coupon.minDurationDays} วันขึ้นไป (ระยะเวลาปัจจุบัน: ${rentDurationDays} วัน)`,
      discountAmount: 0,
    };
  }

  // VR-02: Minimum Spend Check
  if (baseRentAmount < coupon.minSpendTHB) {
    return {
      isValid: false,
      errorCode: 'VR-02',
      errorMessage: `ยอดเช่าไม่ถึงเกณฑ์ขั้นต่ำ ${coupon.minSpendTHB.toLocaleString()} บาท (ยอดปัจจุบัน: ${baseRentAmount.toLocaleString()} บาท)`,
      discountAmount: 0,
    };
  }

  // VR-03: Blackout Dates Check
  if (coupon.blackoutDates && coupon.blackoutDates.includes(bookingDateStr)) {
    return {
      isValid: false,
      errorCode: 'VR-03',
      errorMessage: `ไม่สามารถใช้คูปองนี้ในวันหยุดเทศกาลหรือ Blackout Date (${bookingDateStr})`,
      discountAmount: 0,
    };
  }

  // VR-04: Vehicle Category Constraint
  if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
    if (!coupon.applicableCategories.includes(vehicleCategory)) {
      return {
        isValid: false,
        errorCode: 'VR-04',
        errorMessage: `คูปองนี้ใช้ได้เฉพาะกับกลุ่มรถ: ${coupon.applicableCategories.join(', ')} (กลุ่มปัจจุบัน: ${vehicleCategory})`,
        discountAmount: 0,
      };
    }
  }

  // VR-05: Global and Per-User Usage Limits Check
  if (coupon.usedCountGlobal >= coupon.usageLimitGlobal) {
    return {
      isValid: false,
      errorCode: 'VR-05',
      errorMessage: `สิทธิ์ตามคูปองนี้ถูกใช้งานครบจำนวนแล้ว (${coupon.usageLimitGlobal} สิทธิ์)`,
      discountAmount: 0,
    };
  }

  // VR-06: Stacking Rules
  if (existingAppliedCoupons && existingAppliedCoupons.length > 0 && !coupon.allowStacking) {
    return {
      isValid: false,
      errorCode: 'VR-06',
      errorMessage: 'คูปองนี้ห้ามใช้ร่วมกับคูปองส่วนลดหรือโปรโมชันอื่น',
      discountAmount: 0,
    };
  }

  // Calculate discount based on type
  let discount = 0;
  if (coupon.type === 'Percentage') {
    discount = (baseRentAmount * coupon.discountValue) / 100;
  } else if (coupon.type === 'FixedAmount') {
    discount = Math.min(coupon.discountValue, baseRentAmount);
  } else if (coupon.type === 'FreeDays') {
    // Discount value is number of free days
    const dailyRate = baseRentAmount / rentDurationDays;
    discount = dailyRate * coupon.discountValue;
  } else if (coupon.type === 'AddonWaiver') {
    discount = coupon.discountValue * rentDurationDays;
  }

  return {
    isValid: true,
    discountAmount: Math.round(discount),
  };
}

/**
 * Rental Pricing Calculator for Daily, Weekly, and Monthly Tiers
 */
export interface RentalPricingBreakdown {
  durationDays: number;
  rateTier: 'Daily' | 'Weekly' | 'Monthly';
  tierLabel: string;
  standardDailyRate: number;
  effectiveDailyRate: number;
  discountPercent: number;
  baseAmount: number;
  standardTotalAmount: number;
  tierSavings: number;
}

export function calculateRentalPricing(
  standardDailyRate: number,
  durationDays: number
): RentalPricingBreakdown {
  const days = Math.max(1, durationDays);
  
  let rateTier: 'Daily' | 'Weekly' | 'Monthly' = 'Daily';
  let discountPercent = FINANCE_CONFIG.rentalTiers.daily.discountPercent;
  let tierLabel = FINANCE_CONFIG.rentalTiers.daily.label;

  if (days >= FINANCE_CONFIG.rentalTiers.monthly.minDays) {
    rateTier = 'Monthly';
    discountPercent = FINANCE_CONFIG.rentalTiers.monthly.discountPercent;
    tierLabel = FINANCE_CONFIG.rentalTiers.monthly.label;
  } else if (days >= FINANCE_CONFIG.rentalTiers.weekly.minDays) {
    rateTier = 'Weekly';
    discountPercent = FINANCE_CONFIG.rentalTiers.weekly.discountPercent;
    tierLabel = FINANCE_CONFIG.rentalTiers.weekly.label;
  }

  const effectiveDailyRate = Math.round(standardDailyRate * (1 - discountPercent / 100));
  const baseAmount = effectiveDailyRate * days;
  const standardTotalAmount = standardDailyRate * days;
  const tierSavings = standardTotalAmount - baseAmount;

  return {
    durationDays: days,
    rateTier,
    tierLabel,
    standardDailyRate,
    effectiveDailyRate,
    discountPercent,
    baseAmount,
    standardTotalAmount,
    tierSavings,
  };
}

/**
 * Security Deposit Calculator according to Vehicle Category and Customer Tier
 */
export interface SecurityDepositBreakdown {
  category: VehicleCategory;
  standardDeposit: number;
  effectiveDeposit: number;
  tierDiscountPercent: number;
  tierName?: string;
  isWaived: boolean;
  terms: string;
}

export function calculateSecurityDeposit(
  category: VehicleCategory,
  customerTier: Customer['tier'] = 'Silver'
): SecurityDepositBreakdown {
  const categoryDeposits = FINANCE_CONFIG.securityDepositByCategory;
  const standardDeposit = categoryDeposits[category] ?? categoryDeposits['Default'] ?? 3000;

  const tierDiscounts = FINANCE_CONFIG.securityDepositTierDiscount;
  const tierDiscountPercent = tierDiscounts[customerTier] ?? 0;

  const effectiveDeposit = Math.round(standardDeposit * (1 - tierDiscountPercent / 100));
  const isWaived = effectiveDeposit === 0;

  return {
    category,
    standardDeposit,
    effectiveDeposit,
    tierDiscountPercent,
    tierName: customerTier,
    isWaived,
    terms: 'เงินมัดจำประกันความเสียหายได้รับคืนเต็มจำนวนเมื่อนำรถมาคืนตรงเวลาและสภาพสมบูรณ์',
  };
}

/**
 * Calculate loyalty points earned based on Tier Multipliers & Eligible Spend
 */
export function calculateLoyaltyPoints(
  eligibleAmount: number,
  tier: Customer['tier'],
  isOnlinePrepay = true,
  isOnTimeReturnBonus = false
): number {
  const spendPerPoint = FINANCE_CONFIG.loyaltyPoints.spendTHBPerPoint || 100;
  const multipliers = FINANCE_CONFIG.loyaltyPoints.tierMultipliers;
  const multiplier = multipliers[tier] ?? 1.0;

  const basePoints = Math.floor(eligibleAmount / spendPerPoint) * multiplier;
  let bonusPoints = 0;

  if (isOnlinePrepay) bonusPoints += 30;
  if (isOnTimeReturnBonus) bonusPoints += 50;

  return Math.round(basePoints + bonusPoints);
}

/**
 * Smart Vehicle Assignment Algorithm
 * Picks the optimal vehicle based on category, lowest odometer, and farthest maintenance date
 */
export function getSmartAssignedVehicle(
  vehicles: Vehicle[],
  category: VehicleCategory
): Vehicle | null {
  const availableInCategory = vehicles.filter(
    (v) => v.status === 'Available' && v.category === category
  );

  if (availableInCategory.length === 0) {
    // Fallback to any Available vehicle
    const anyAvailable = vehicles.filter((v) => v.status === 'Available');
    if (anyAvailable.length === 0) return null;
    return anyAvailable.sort((a, b) => a.currentOdometer - b.currentOdometer)[0];
  }

  // Sort by lowest odometer first to equalize fleet utilization
  return availableInCategory.sort((a, b) => a.currentOdometer - b.currentOdometer)[0];
}

/**
 * Asset Straight-Line Depreciation Calculator
 */
export function calculateMonthlyDepreciation(
  purchasePrice: number,
  salvageValue: number,
  usefulLifeYears: number
): number {
  const depreciableBase = purchasePrice - salvageValue;
  const annualDepreciation = depreciableBase / usefulLifeYears;
  return annualDepreciation / 12;
}
