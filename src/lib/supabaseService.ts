import { supabase, isSupabaseConfigured } from './supabase';
import { Vehicle, Customer, Coupon, Booking, MaintenanceWorkOrder, JournalEntry } from '../types/erp';

export async function fetchAllData() {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const [
      { data: vehiclesData, error: vErr },
      { data: customersData, error: cErr },
      { data: couponsData, error: coupErr },
      { data: bookingsData, error: bErr },
      { data: workOrdersData, error: wErr },
      { data: journalEntriesData, error: jErr },
    ] = await Promise.all([
      supabase.from('vehicles').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('coupons').select('*'),
      supabase.from('bookings').select('*'),
      supabase.from('maintenance_work_orders').select('*'),
      supabase.from('journal_entries').select('*'),
    ]);

    if (vErr || cErr || coupErr || bErr || wErr || jErr) {
      console.warn('Supabase fetch error, using fallback:', { vErr, cErr, coupErr, bErr, wErr, jErr });
      return null;
    }

    const mapVehicle = (row: any): Vehicle => ({
      id: row.id,
      plateNumber: row.plate_number,
      province: row.province,
      brand: row.brand,
      model: row.model,
      year: row.year,
      color: row.color,
      category: row.category,
      vin: row.vin,
      engineNumber: row.engine_number,
      status: row.status,
      currentOdometer: row.current_odometer,
      nextServiceKm: row.next_service_km,
      dailyRate: Number(row.daily_rate),
      fuelType: row.fuel_type,
      fuelLevelPercent: row.fuel_level_percent,
      imageUrl: row.image_url,
      purchasePrice: Number(row.purchase_price || 0),
      salvageValue: Number(row.salvage_value || 0),
      usefulLifeYears: Number(row.useful_life_years || 5),
      acquisitionDate: row.acquisition_date,
      documents: row.documents || {
        taxExpiryDate: '',
        insuranceExpiryDate: '',
        actExpiryDate: '',
        taxWarningDays: 0,
        insuranceWarningDays: 0,
      },
      gpsLocation: row.gps_location || {
        lat: 13.7563,
        lng: 100.5018,
        locationName: 'สาขาสุวรรณภูมิ',
        lastUpdated: '10 นาทีที่แล้ว',
      },
    });

    const mapCustomer = (row: any): Customer => ({
      id: row.id,
      fullName: row.full_name,
      nationalId: row.national_id,
      driverLicenseNo: row.driver_license_no,
      phone: row.phone,
      email: row.email,
      lineId: row.line_id,
      tier: row.tier,
      pointsBalance: row.points_balance,
      totalRentalsCount: row.total_rentals_count,
      totalSpentTHB: Number(row.total_spent_thb),
      isBlacklisted: row.is_blacklisted,
      blacklistReason: row.blacklist_reason,
      creditLimitTHB: Number(row.credit_limit_thb || 0),
      registeredDate: row.registered_date,
    });

    const mapCoupon = (row: any): Coupon => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      type: row.type,
      discountValue: Number(row.discount_value),
      minDurationDays: row.min_duration_days,
      minSpendTHB: Number(row.min_spend_thb),
      blackoutDates: row.blackout_dates || [],
      applicableCategories: row.applicable_categories || [],
      usageLimitGlobal: row.usage_limit_global,
      usedCountGlobal: row.used_count_global,
      usageLimitPerUser: row.usage_limit_per_user,
      allowStacking: row.allow_stacking,
      addonType: row.addon_type,
      validFrom: row.valid_from,
      validTo: row.valid_to,
    });

    const mapBooking = (row: any): Booking => ({
      id: row.id,
      bookingCode: row.booking_code,
      customerId: row.customer_id,
      customerName: row.customer_name,
      vehicleId: row.vehicle_id,
      vehiclePlate: row.vehicle_plate,
      vehicleModel: row.vehicle_model,
      vehicleCategory: row.vehicle_category,
      startDate: row.start_date,
      endDate: row.end_date,
      pickupBranch: row.pickup_branch,
      dropoffBranch: row.dropoff_branch,
      status: row.status,
      dailyRate: Number(row.daily_rate),
      totalDays: row.total_days,
      baseAmount: Number(row.base_amount),
      appliedCouponCode: row.applied_coupon_code,
      discountAmount: Number(row.discount_amount),
      addons: row.addons || [],
      addonsAmount: Number(row.addons_amount),
      vatAmount: Number(row.vat_amount),
      depositAmount: Number(row.deposit_amount),
      grandTotal: Number(row.grand_total),
      pointsEarned: row.points_earned,
      createdDate: row.created_date,
    });

    const mapWorkOrder = (row: any): MaintenanceWorkOrder => ({
      id: row.id,
      workOrderNo: row.work_order_no,
      vehicleId: row.vehicle_id,
      vehiclePlate: row.vehicle_plate,
      type: row.type,
      description: row.description,
      garageName: row.garage_name,
      scheduledDate: row.scheduled_date,
      completedDate: row.completed_date,
      status: row.status,
      partsCost: Number(row.parts_cost),
      laborCost: Number(row.labor_cost),
      totalCost: Number(row.total_cost),
      odometerAtService: row.odometer_at_service,
      notes: row.notes,
    });

    const mapJournalEntry = (row: any): JournalEntry => ({
      id: row.id,
      date: row.date,
      voucherNo: row.voucher_no,
      description: row.description,
      debitAccount: row.debit_account,
      debitAmount: Number(row.debit_amount),
      creditAccount: row.credit_account,
      creditAmount: Number(row.credit_amount),
      bookingRefId: row.booking_ref_id,
      vehicleRefId: row.vehicle_ref_id,
      notes: row.notes,
    });

    return {
      vehicles: vehiclesData ? vehiclesData.map(mapVehicle) : null,
      customers: customersData ? customersData.map(mapCustomer) : null,
      coupons: couponsData ? couponsData.map(mapCoupon) : null,
      bookings: bookingsData ? bookingsData.map(mapBooking) : null,
      workOrders: workOrdersData ? workOrdersData.map(mapWorkOrder) : null,
      journalEntries: journalEntriesData ? journalEntriesData.map(mapJournalEntry) : null,
    };
  } catch (err) {
    console.error('Failed to load Supabase data:', err);
    return null;
  }
}
