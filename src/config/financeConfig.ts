/**
 * ====================================================================
 * 💰 DRIVEERP - FINANCIAL & PRICING CONFIGURATION (ตั้งค่าระบบการเงิน)
 * ====================================================================
 * ไฟล์นี้รวมการตั้งค่าตัวเลขทางการเงินทั้งหมดของระบบ DriveERP 
 * ท่านสามารถแก้ไขตัวเลขในไฟล์นี้เพื่อปรับเปลี่ยน อัตราส่วนลด, เงินมัดจำ, คะแนนสะสม, VAT และค่าบริการได้ทันที
 */

import qrBankImage from '../assets/images/qr_bank_promptpay_1784778370699.jpg';

export const FINANCE_CONFIG = {
  // 1. อัตราส่วนลดตามระยะเวลาการเช่า (Rental Duration Tier Discounts)
  rentalTiers: {
    monthly: {
      minDays: 30,
      discountPercent: 30, // ส่วนลดเช่ารายเดือน (30%)
      label: 'อัตราส่วนลดพิเศษรายเดือน (30+ วัน ลด 30%)',
    },
    weekly: {
      minDays: 7,
      discountPercent: 15, // ส่วนลดเช่ารายสัปดาห์ (15%)
      label: 'อัตราส่วนลดพิเศษรายสัปดาห์ (7-29 วัน ลด 15%)',
    },
    daily: {
      minDays: 1,
      discountPercent: 0, // อัตราปกติรายวัน
      label: 'อัตราปกติรายวัน (1-6 วัน)',
    },
  },

  // 2. เงินมัดจำประกันความเสียหายตามประเภทรถ (Security Deposits by Category in THB)
  securityDepositByCategory: {
    'Sedan 1.5L': 1,
    'Compact': 3000,
    'SUV': 5000,
    'EV / Eco': 5000,
    'Luxury': 10000,
    'Van': 10000,
    'Default': 3000,
  } as Record<string, number>,

  // 3. ส่วนลดเงินมัดจำตามระดับสมาชิก (%) (Deposit Discount by Customer Tier)
  securityDepositTierDiscount: {
    Silver: 0,      // สมาชิก Silver: จ่ายมัดจำเต็มจำนวน
    Gold: 20,       // สมาชิก Gold: ได้รับส่วนลดมัดจำ 20%
    Platinum: 100,  // สมาชิก Platinum: ยกเว้นเงินมัดจำ (ฟรีมัดจำ 100%)
  } as Record<string, number>,

  // 4. อัตราการสะสมคะแนน Loyalty Points (เรท 100 บาท = 1 คะแนน)
  loyaltyPoints: {
    spendTHBPerPoint: 100, // ยอดใช้จ่ายกี่บาทได้ 1 แต้ม (100 THB = 1 Point)
    tierMultipliers: {
      Silver: 1.0,   // สมาชิก Silver: รับแต้มอัตราปกติ 1.0x
      Gold: 1.25,    // สมาชิก Gold: รับแต้มโบนัส 1.25x
      Platinum: 1.5, // สมาชิก Platinum: รับแต้มโบนัส 1.5x
    } as Record<string, number>,
  },

  // 5. ภาษีมูลค่าเพิ่ม & ประกันภัย (VAT & Insurance Rates)
  taxAndAddons: {
    vatPercent: 7, // ภาษีมูลค่าเพิ่ม (7%)
    dailyInsurancePriceTHB: 300, // ค่าประกันภัยชั้น 1 (300 บาท/วัน)
  },

  // 6. ข้อมูลช่องทางการชำระเงิน & บัญชีธนาคาร (Bank Transfer & Payment Gateway Configuration)
  paymentMethods: {
    promptPay: {
      accountName: 'นาย เกียรติยศ ชุนเชิด',
      promptPayNumber: '065-850-2711',
      accountNumberMasked: 'xxx-x-x7437-x',
      refNo: '004999222186800',
      qrApiTemplate: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=',
      customQrImageUrl: qrBankImage, // รูป QR Code Bank PromptPay
    },
    bankTransfer: {
      bankName: 'ธนาคารกสิกรไทย (KBANK)',
      accountNumber: '2148574378',
      accountName: 'นาย เกียรติยศ ชุนเชิด',
      branch: 'Macus',
    },
    creditCard: {
      enabled: true,
      gatewayName: 'DriveERP Payment Gateway (256-bit SSL Encrypted)',
    },
  },
};
