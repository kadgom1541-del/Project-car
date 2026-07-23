export type VehicleStatus = 'Available' | 'Reserved' | 'Rented' | 'Maintenance' | 'In-Transit' | 'Decommissioned';

export type VehicleCategory =
  | 'Sedan 1.5L'
  | 'Compact'
  | 'SUV'
  | 'Luxury'
  | 'Van'
  | 'EV / Eco'
  | 'Crossover / SUV'
  | 'EV / Electric'
  | 'MPV / Minivan'
  | 'Pickup Truck'
  | 'Sports / Performance';

export interface ExpirationDocument {
  taxExpiryDate: string; // YYYY-MM-DD
  insuranceExpiryDate: string;
  actExpiryDate: string; // พ.ร.บ.
  taxWarningDays: number;
  insuranceWarningDays: number;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  province: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  category: VehicleCategory;
  vin: string;
  engineNumber: string;
  status: VehicleStatus;
  currentOdometer: number;
  nextServiceKm: number;
  dailyRate: number;
  fuelType: 'Gasoline 95' | 'Gasohol 91/95' | 'Diesel' | 'Electric (EV)';
  fuelLevelPercent: number;
  documents: ExpirationDocument;
  gpsLocation?: {
    lat: number;
    lng: number;
    locationName: string;
    lastUpdated: string;
  };
  imageUrl: string;
  images?: string[];
  purchasePrice: number;
  salvageValue: number;
  usefulLifeYears: number;
  acquisitionDate: string;
}

export type CouponType = 'Percentage' | 'FixedAmount' | 'FreeDays' | 'AddonWaiver';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: CouponType;
  discountValue: number; // e.g. 15 for 15%, or 500 for 500 THB
  minDurationDays: number;
  minSpendTHB: number;
  blackoutDates: string[]; // YYYY-MM-DD array
  applicableCategories: VehicleCategory[];
  usageLimitGlobal: number;
  usedCountGlobal: number;
  usageLimitPerUser: number;
  allowStacking: boolean;
  validFrom: string;
  validTo: string;
  addonType?: 'InsuranceDeductible' | 'CarSeat' | 'GPS' | 'DeliveryFee';
}

export type MemberTier = 'Silver' | 'Gold' | 'Platinum';

export interface Customer {
  id: string;
  fullName: string;
  nationalId: string;
  driverLicenseNo: string;
  phone: string;
  email: string;
  lineId?: string;
  tier: MemberTier;
  pointsBalance: number;
  totalRentalsCount: number;
  totalSpentTHB: number;
  isBlacklisted: boolean;
  blacklistReason?: string;
  creditLimitTHB: number;
  registeredDate: string;
}

export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Active'
  | 'Completed'
  | 'Cancelled'
  | 'Cancellation Pending'
  | 'Cancelled (Refund Pending)'
  | 'Cancelled (Refund Completed)';

export interface BookingAddon {
  id: string;
  name: string;
  dailyPrice: number;
  selected: boolean;
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleCategory: VehicleCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  pickupBranch: string;
  dropoffBranch: string;
  status: BookingStatus;
  
  dailyRate: number;
  totalDays: number;
  baseAmount: number;
  
  appliedCouponCode?: string;
  discountAmount: number;
  
  addons: BookingAddon[];
  addonsAmount: number;
  
  vatAmount: number; // 7%
  depositAmount: number;
  grandTotal: number;
  
  pointsEarned: number;
  pointsRedeemed?: number;
  pointsDiscountAmount?: number;
  
  signatureDataUrl?: string;
  contractSignedAt?: string;
  createdDate: string;
  
  cancelReason?: string;
  cancelledAt?: string;
  cancellationRequestedAt?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  depositForfeitedAmount?: number;
  depositRefundedAmount?: number;
  refundSuggestedAmount?: number;
  refundPolicyNote?: string;
  refundAdminNote?: string;
  refundSlipUrl?: string;
  refundCompletedAt?: string;
}

export interface DamageMark {
  id: string;
  positionX: number; // percentage 0-100
  positionY: number; // percentage 0-100
  part: 'Front' | 'Rear' | 'Left' | 'Right' | 'Roof' | 'Interior' | 'Windshield';
  type: 'Scratch' | 'Dent' | 'Crack' | 'Stain' | 'Missing Part';
  severity: 'Minor' | 'Moderate' | 'Severe';
  notes: string;
  photoUrl?: string;
}

export interface InspectionRecord {
  id: string;
  bookingId: string;
  vehicleId: string;
  type: 'Check-out' | 'Check-in';
  date: string;
  inspectorName: string;
  odometer: number;
  fuelLevelPercent: number;
  damageMarks: DamageMark[];
  fuelFeePenalty: number;
  damageFeePenalty: number;
  inspectorSignature?: string;
  customerSignature?: string;
  status: 'Draft' | 'Submitted';
}

export interface MaintenanceWorkOrder {
  id: string;
  workOrderNo: string;
  vehicleId: string;
  vehiclePlate: string;
  type: 'Preventive' | 'Corrective' | 'Tire Change' | 'Insurance Repair';
  description: string;
  garageName: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'Pending' | 'In-Progress' | 'Completed';
  partsCost: number;
  laborCost: number;
  totalCost: number;
  odometerAtService: number;
  notes: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  voucherNo: string;
  description: string;
  debitAccount: string;
  debitAmount: number;
  creditAccount: string;
  creditAmount: number;
  bookingRefId?: string;
  vehicleRefId?: string;
  notes: string;
}

export interface TierConfig {
  tier: MemberTier;
  minRentals: number;
  minSpend: number;
  multiplier: number;
  depositDiscountPercent: number;
  benefits: string[];
}
