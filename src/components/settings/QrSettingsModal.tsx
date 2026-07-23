import React, { useState, useEffect } from 'react';
import { X, Upload, QrCode, ShieldCheck, Check, Sparkles, AlertCircle, Building2, CreditCard, Image as ImageIcon, Trash2 } from 'lucide-react';
import { UserProfile } from '../../types/auth';
import { FINANCE_CONFIG } from '../../config/financeConfig';

interface QrSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onConfigUpdated?: () => void;
}

export const QrSettingsModal: React.FC<QrSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfigUpdated,
}) => {
  const [accountName, setAccountName] = useState<string>('');
  const [promptPayNumber, setPromptPayNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [refNo, setRefNo] = useState<string>('');
  const [customQrImage, setCustomQrImage] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load existing configuration on open
  useEffect(() => {
    if (isOpen) {
      // Try loading from localStorage first
      const saved = localStorage.getItem('driveerp_payment_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAccountName(parsed.accountName || FINANCE_CONFIG.paymentMethods.promptPay.accountName);
          setPromptPayNumber(parsed.promptPayNumber || FINANCE_CONFIG.paymentMethods.promptPay.promptPayNumber);
          setBankName(parsed.bankName || FINANCE_CONFIG.paymentMethods.bankTransfer.bankName);
          setAccountNumber(parsed.accountNumber || FINANCE_CONFIG.paymentMethods.bankTransfer.accountNumber);
          setRefNo(parsed.refNo || FINANCE_CONFIG.paymentMethods.promptPay.refNo);
          setCustomQrImage(parsed.customQrImageUrl || FINANCE_CONFIG.paymentMethods.promptPay.customQrImageUrl || '');
        } catch {
          loadDefaultConfig();
        }
      } else {
        loadDefaultConfig();
      }
    }
  }, [isOpen]);

  const loadDefaultConfig = () => {
    setAccountName(FINANCE_CONFIG.paymentMethods.promptPay.accountName);
    setPromptPayNumber(FINANCE_CONFIG.paymentMethods.promptPay.promptPayNumber);
    setBankName(FINANCE_CONFIG.paymentMethods.bankTransfer.bankName);
    setAccountNumber(FINANCE_CONFIG.paymentMethods.bankTransfer.accountNumber);
    setRefNo(FINANCE_CONFIG.paymentMethods.promptPay.refNo);
    setCustomQrImage(FINANCE_CONFIG.paymentMethods.promptPay.customQrImageUrl || '');
  };

  if (!isOpen) return null;

  // STRICT ACCESS CONTROL: Only Owner allowed!
  if (user?.role !== 'owner') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">สิทธิ์การเข้าถึงจำกัดเฉพาะ Owner</h3>
          <p className="text-xs text-slate-600">
            เฉพาะเจ้าของระบบ (Owner) เท่านั้นที่มีสิทธิ์แก้ไขรูปภาพ QR Code สแกนจ่ายเงินและข้อมูลบัญชีรับชำระเงิน
          </p>
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            ตกลง / ปิดหน้าต่าง
          </button>
        </div>
      </div>
    );
  }

  // Handle image upload from file selector
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (.PNG, .JPG, .JPEG, .WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomQrImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle drop
  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (.PNG, .JPG, .JPEG, .WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomQrImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Update global FINANCE_CONFIG reference
    FINANCE_CONFIG.paymentMethods.promptPay.accountName = accountName;
    FINANCE_CONFIG.paymentMethods.promptPay.promptPayNumber = promptPayNumber;
    FINANCE_CONFIG.paymentMethods.promptPay.customQrImageUrl = customQrImage;
    FINANCE_CONFIG.paymentMethods.promptPay.refNo = refNo;
    FINANCE_CONFIG.paymentMethods.bankTransfer.bankName = bankName;
    FINANCE_CONFIG.paymentMethods.bankTransfer.accountNumber = accountNumber;
    FINANCE_CONFIG.paymentMethods.bankTransfer.accountName = accountName;

    // Save to localStorage for persistence
    const configToSave = {
      accountName,
      promptPayNumber,
      bankName,
      accountNumber,
      refNo,
      customQrImageUrl: customQrImage,
    };
    localStorage.setItem('driveerp_payment_config', JSON.stringify(configToSave));

    setSaveSuccess(true);
    if (onConfigUpdated) onConfigUpdated();
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900">ตั้งค่า QR Code รับชำระเงิน (Owner Only)</h3>
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>เจ้าของระบบ</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">อัปโหลดรูป QR Code (PNG/JPG) และแก้ไขข้อมูลบัญชีรับเงิน PromptPay</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveSuccess && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>บันทึกตั้งค่ารูป QR Code และข้อมูลบัญชีสำเร็จแล้ว!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* QR Code File Upload Section */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-slate-800 text-xs font-bold flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>รูปภาพ QR Code สแกนจ่ายเงิน (PNG, JPG, WEBP)</span>
              </label>
              {customQrImage && (
                <button
                  type="button"
                  onClick={() => setCustomQrImage('')}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบรูปภาพ</span>
                </button>
              )}
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDropImage}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="file"
                id="owner-qr-file-upload"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="owner-qr-file-upload" className="cursor-pointer block space-y-2">
                {customQrImage ? (
                  <div className="space-y-2">
                    <img
                      src={customQrImage}
                      alt="QR Code Preview"
                      className="w-44 h-44 object-contain mx-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xs"
                    />
                    <p className="text-xs text-indigo-600 font-bold underline">คลิกหรือลากวางเพื่อเปลี่ยนรูป QR Code</p>
                  </div>
                ) : (
                  <div className="py-3 space-y-1">
                    <div className="mx-auto w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      ลากไฟล์รูปภาพ QR Code มาวางที่นี่ หรือ <span className="text-indigo-600 underline">คลิกเลือกไฟล์ PNG/JPG</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      รองรับไฟล์ .PNG, .JPG, .JPEG, .WEBP (รูปสแกนพร้อมเพย์จากธนาคาร)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* PromptPay & Bank Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                เบอร์พร้อมเพย์ / เลขประจำตัวผู้เสียภาษี *
              </label>
              <input
                type="text"
                value={promptPayNumber}
                onChange={(e) => setPromptPayNumber(e.target.value)}
                placeholder="เช่น 065-850-2711"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ชื่อบัญชีผู้รับเงิน (Account Name) *
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="เช่น นาย เกียรติยศ ชุนเชิด"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ธนาคาร (Bank Name)
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="เช่น ธนาคารกสิกรไทย (KBANK)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                เลขที่บัญชีธนาคาร (Account Number)
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="เช่น 214-857437-8"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-semibold mb-1">
              เลขที่อ้างอิง Ref No. (Optional)
            </label>
            <input
              type="text"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              placeholder="เช่น 004999222186800"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกการตั้งค่า (Owner)</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
