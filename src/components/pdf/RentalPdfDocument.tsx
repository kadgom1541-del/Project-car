import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Booking } from '../../types/erp';

// Register Thai Font (Sarabun) for @react-pdf/renderer
Font.register({
  family: 'Sarabun',
  fonts: [
    {
      src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

// Disable word hyphenation for proper Thai character rendering
Font.registerHyphenationCallback((word) => [word]);

// Create styles for React PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    color: '#1e293b',
    fontFamily: 'Sarabun',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
    paddingBottom: 15,
    marginBottom: 15,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
  },
  companySub: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  docSub: {
    fontSize: 9,
    color: '#059669',
    textAlign: 'right',
    marginTop: 2,
  },
  section: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#64748b',
    fontSize: 9,
  },
  value: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    color: '#ffffff',
    padding: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  col1: { width: '45%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  summaryContainer: {
    marginTop: 10,
    alignSelf: 'flex-end',
    width: '55%',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#94a3b8',
  },
  signatureBox: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sigLine: {
    width: 160,
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    textAlign: 'center',
    paddingTop: 4,
    fontSize: 8,
    color: '#64748b',
  },
});

interface RentalPdfDocumentProps {
  booking: Booking;
  docType?: 'receipt' | 'agreement' | 'invoice';
}

export const RentalPdfDocument: React.FC<RentalPdfDocumentProps> = ({
  booking,
  docType = 'receipt',
}) => {
  const titleMap = {
    receipt: 'ใบยืนยันการจอง & ใบชำระเงิน (Rental Voucher & Receipt)',
    agreement: 'สัญญาเช่ารถยนต์ & ใบส่งมอบรถ (Rental Agreement)',
    invoice: 'ใบแจ้งหนี้ / ใบกำกับภาษี IFRS 15 (Tax Invoice)',
  };

  const baseRate = booking.dailyRate || Math.round((booking.baseAmount || booking.grandTotal) / (booking.totalDays || 1));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>DriveERP Car Rental Co., Ltd.</Text>
            <Text style={styles.companySub}>
              88/1 Suvarnabhumi Airport Link, Bangkok, Thailand
            </Text>
            <Text style={styles.companySub}>Tax ID: 0105567012341 | Tel: 02-999-8888</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>{titleMap[docType]}</Text>
            <Text style={styles.docSub}>Ref ID: {booking.bookingCode || booking.id}</Text>
            <Text style={styles.docSub}>Date: {booking.createdDate || new Date().toISOString().split('T')[0]}</Text>
          </View>
        </View>

        {/* Customer & Vehicle Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลผู้เช่า และ รถยนต์ (Customer & Vehicle Details)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>ชื่อผู้เช่า (Renter Name):</Text>
            <Text style={styles.value}>{booking.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>รหัสผู้เช่า (Customer ID):</Text>
            <Text style={styles.value}>{booking.customerId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>รุ่นรถยนต์ (Vehicle Model):</Text>
            <Text style={styles.value}>{booking.vehicleModel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ทะเบียนรถ (License Plate):</Text>
            <Text style={styles.value}>{booking.vehiclePlate}</Text>
          </View>
        </View>

        {/* Rental Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>กำหนดเวลาเช่า (Rental Schedule)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>วันเวลารับรถ (Pick-up):</Text>
            <Text style={styles.value}>{booking.startDate} ({booking.pickupBranch || 'สาขาสุวรรณภูมิ'})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>วันเวลาคืนรถ (Return):</Text>
            <Text style={styles.value}>{booking.endDate} ({booking.dropoffBranch || 'สาขาสุวรรณภูมิ'})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>จำนวนวันเช่ารวม (Total Days):</Text>
            <Text style={styles.value}>{booking.totalDays} วัน</Text>
          </View>
        </View>

        {/* Financial Item Breakdown Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>รายการ (Description)</Text>
            <Text style={styles.col2}>จำนวนวัน</Text>
            <Text style={styles.col3}>ราคา/วัน (Rate)</Text>
            <Text style={styles.col4}>จำนวนเงิน (THB)</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.col1}>ค่าเช่ารถยนต์ {booking.vehicleModel}</Text>
            <Text style={styles.col2}>{booking.totalDays}</Text>
            <Text style={styles.col3}>{baseRate.toLocaleString()}</Text>
            <Text style={styles.col4}>{(booking.baseAmount || (baseRate * booking.totalDays)).toLocaleString()}</Text>
          </View>

          {booking.discountAmount > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.col1}>ส่วนลดคูปอง ({booking.appliedCouponCode || 'SPECIAL'})</Text>
              <Text style={styles.col2}>-</Text>
              <Text style={styles.col3}>-</Text>
              <Text style={styles.col4}>-{booking.discountAmount.toLocaleString()}</Text>
            </View>
          )}

          {booking.addonsAmount > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.col1}>ประกันภัย No-Deductible Waiver</Text>
              <Text style={styles.col2}>{booking.totalDays}</Text>
              <Text style={styles.col3}>300</Text>
              <Text style={styles.col4}>{booking.addonsAmount.toLocaleString()}</Text>
            </View>
          )}

          {booking.depositAmount > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.col1}>เงินประกันความเสียหาย (Security Deposit - Refundable)</Text>
              <Text style={styles.col2}>1</Text>
              <Text style={styles.col3}>{booking.depositAmount.toLocaleString()}</Text>
              <Text style={styles.col4}>{booking.depositAmount.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Summary Totals */}
        <View style={styles.summaryContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>ยอดค่าเช่าสุทธิ (Rental Total):</Text>
            <Text style={styles.value}>{(booking.grandTotal || 0).toLocaleString()} THB</Text>
          </View>
          {booking.depositAmount > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>เงินมัดจำคืนได้ (Refundable Deposit):</Text>
              <Text style={styles.value}>{booking.depositAmount.toLocaleString()} THB</Text>
            </View>
          )}
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#cbd5e1', paddingTop: 4, marginTop: 4 }]}>
            <Text style={[styles.label, { fontWeight: 'bold', color: '#0f172a' }]}>รวมเงินที่ชำระ (Grand Total):</Text>
            <Text style={[styles.value, { color: '#059669', fontSize: 11 }]}>
              {((booking.grandTotal || 0) + (booking.depositAmount || 0)).toLocaleString()} THB
            </Text>
          </View>
          <View style={[styles.row, { marginTop: 2 }]}>
            <Text style={styles.label}>สถานะสัญญา (Status):</Text>
            <Text style={[styles.value, { color: booking.status.includes('Cancelled') ? '#dc2626' : '#059669' }]}>
              {booking.status}
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureBox}>
          <View>
            <Text style={{ height: 20 }} />
            <Text style={styles.sigLine}>ลงชื่อผู้เช่า (Customer Signature)</Text>
          </View>
          <View>
            <Text style={{ height: 20 }} />
            <Text style={styles.sigLine}>ลงชื่อเจ้าหน้าที่ส่งมอบ (DriveERP Staff)</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>DriveERP System Document - Generated Automatically with Thai Font Support</Text>
          <Text>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
};

