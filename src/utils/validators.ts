import { z } from 'zod';

/**
 * Zod Schema for Booking Form Validation
 */
export const bookingFormSchema = z.object({
  driverName: z
    .string()
    .min(3, { message: 'กรุณากรอกชื่อ-นามสกุลให้ครบถ้วนอย่างน้อย 3 ตัวอักษร' }),
  driverPhone: z
    .string()
    .regex(/^0[0-9]{8,9}$/, { message: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ขึ้นต้นด้วย 0 จำนวน 9-10 หลัก)' }),
  driverLicenseNo: z
    .string()
    .min(5, { message: 'กรุณากรอกใบขับขี่ให้ถูกต้องอย่างน้อย 5 หลัก' }),
  nationalIdOrPassport: z
    .string()
    .min(7, { message: 'กรุณากรอกเลขบัตรประชาชน 13 หลัก หรือ พาสปอร์ต' }),
  startDate: z.string().min(1, { message: 'กรุณาระบุวันเริ่มต้นรับรถ' }),
  endDate: z.string().min(1, { message: 'กรุณาระบุวันส่งคืนรถ' }),
  pickupLocation: z.string().min(1, { message: 'กรุณาเลือกลเคชันรับรถ' }),
  returnLocation: z.string().min(1, { message: 'กรุณาเลือกลเคชันคืนรถ' }),
});

export type BookingFormInput = z.infer<typeof bookingFormSchema>;

/**
 * Zod Schema for Staff Management Form Validation
 */
export const staffFormSchema = z.object({
  name: z.string().min(2, { message: 'กรุณาระบุชื่อพนักงาน' }),
  email: z.string().email({ message: 'กรุณาระบุรูปแบบอีเมลให้ถูกต้อง' }),
  roleTitle: z.string().min(1, { message: 'กรุณาเลือกตำแหน่งพนักงาน' }),
  pin: z.string().length(6, { message: 'รหัส PIN ต้องเป็นตัวเลข 6 หลักเท่านั้น' }),
  phone: z.string().min(9, { message: 'กรุณาระบุเบอร์โทรศัพท์' }),
});

export type StaffFormInput = z.infer<typeof staffFormSchema>;
