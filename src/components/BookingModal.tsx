import { useState, useEffect } from 'react';
import { X, Calendar, Users, Check, Loader2, BedDouble, CreditCard, QrCode, Copy } from 'lucide-react';
import { rooms, formatPrice } from '@/data/hotelData';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateQRDataURL, getBankName } from '@/lib/vietqr';
import type { TranslationKey } from '@/data/translations';
import type { Language } from '@/data/hotelData';

type PaymentMethod = {
  id: string;
  label: Record<string, string>;
  description: Record<string, string>;
  icon: string;
  type: string;
  is_published: boolean;
  sort_order: number;
  bank_bin?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  amount_fixed?: boolean | null;
};

type BookingModalProps = {
  open: boolean;
  onClose: () => void;
  initialRoomId?: string;
};

export default function BookingModal({ open, onClose, initialRoomId }: BookingModalProps) {
  const { t, lang } = useApp();
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [roomId, setRoomId] = useState(initialRoomId || rooms[0].id);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (initialRoomId) setRoomId(initialRoomId);
  }, [initialRoomId]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setStep('form');
      // Load payment methods
      supabase
        .from('payment_methods')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .then(({ data, error }) => {
          if (error) { console.error(error); return; }
          const methods = (data as PaymentMethod[]) ?? [];
          setPaymentMethods(methods);
          if (methods.length > 0) setSelectedPaymentId(methods[0].id);
        });
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const selectedRoom = rooms.find((r) => r.id === roomId) || rooms[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('bookings').insert({
        clerk_user_id: user?.id || 'guest',
        user_email: email,
        user_name: name,
        room_id: selectedRoom.id,
        room_name: selectedRoom.name[lang],
        check_in: checkIn,
        check_out: checkOut,
        guests: parseInt(guests, 10),
        total_price: totalPrice,
        status: 'pending',
        phone,
        payment_method_id: selectedPaymentId,
        payment_method_label: selectedMethod ? (selectedMethod.label[lang] || selectedMethod.label.vi || selectedMethod.label.en) : null,
      });
      if (error) throw error;
      setStep('success');
    } catch {
      setLoading(false);
    }
  };

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const totalPrice = selectedRoom.price * nights;

  const guestOptions: { value: string; key: TranslationKey }[] = [
    { value: '1', key: 'guest1' },
    { value: '2', key: 'guest2' },
    { value: '3', key: 'guest3' },
    { value: '4', key: 'guest4' },
    { value: '5', key: 'guest5' },
  ];

  const pmLabel = (m: PaymentMethod) => m.label[lang] || m.label.vi || m.label.en || '';
  const pmDesc = (m: PaymentMethod) => m.description[lang] || m.description.vi || m.description.en || '';

  const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentId);
  const hasBankInfo = selectedMethod?.bank_bin && selectedMethod?.bank_account_number;

  useEffect(() => {
    if (!hasBankInfo) { setQrCode(null); return; }
    let cancelled = false;
    generateQRDataURL({
      bank_bin: selectedMethod!.bank_bin!,
      bank_account_number: selectedMethod!.bank_account_number!,
      bank_account_name: selectedMethod!.bank_account_name || undefined,
      amount: selectedMethod!.amount_fixed ? totalPrice : undefined,
      description: name ? `Thanh toan ${name}` : 'Thanh toan dat phong',
    }).then((url) => { if (!cancelled) setQrCode(url); });
    return () => { cancelled = true; };
  }, [hasBankInfo, selectedMethod, totalPrice, name]);

  const copyAccountNumber = () => {
    if (selectedMethod?.bank_account_number) {
      navigator.clipboard.writeText(selectedMethod.bank_account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-secondary-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-primary-600 px-6 py-5">
          <h3 className="font-display text-xl font-bold text-white">{t('bookingTitle')}</h3>
          <p className="text-primary-100 text-sm mt-1">{t('bookingSubtitle')}</p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="mb-5">
              <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide mb-2 block">{t('selectRoom')}</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setRoomId(room.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      roomId === room.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-secondary-700'
                        : 'border-secondary-200 dark:border-secondary-600 hover:border-primary-300'
                    }`}
                  >
                    <img src={room.image} alt={room.name[lang]} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-secondary-900 dark:text-white text-sm truncate">{room.name[lang]}</div>
                      <div className="text-xs text-primary-600 dark:text-primary-400 font-medium">{formatPrice(room.price)}{t('perNight')}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">{t('checkIn')}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                  <input
                    type="date"
                    min={today}
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">{t('checkOut')}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                  <input
                    type="date"
                    min={checkIn || today}
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">{t('guests')}</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all appearance-none"
                  >
                    {guestOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">{t('fullName')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'vi' ? 'Nguyễn Văn A' : lang === 'kr' ? '홍길동' : 'John Doe'}
                  className="w-full px-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">{t('phone')}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901 234 567"
                  className="w-full px-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-6">
              <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">{t('email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Payment Methods */}
            {paymentMethods.length > 0 && (
              <div className="mb-5">
                <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide mb-2 block">
                  {lang === 'vi' ? 'Phương thức thanh toán' : lang === 'kr' ? '결제 방법' : 'Payment Method'}
                </label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPaymentId(method.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        selectedPaymentId === method.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-secondary-700'
                          : 'border-secondary-200 dark:border-secondary-600 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-secondary-900 dark:text-white text-sm">{pmLabel(method)}</div>
                        {pmDesc(method) && (
                          <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">{pmDesc(method)}</div>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${selectedPaymentId === method.id ? 'border-primary-500 bg-primary-500' : 'border-secondary-300 dark:border-secondary-600'}`}>
                        {selectedPaymentId === method.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QR Code for bank transfer */}
            {hasBankInfo && qrCode && (
              <div className="mb-5 bg-gradient-to-br from-primary-50 to-white dark:from-secondary-700 dark:to-secondary-800 rounded-2xl p-5 border border-primary-100 dark:border-secondary-700">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="bg-white rounded-xl p-3 shadow-md w-[200px] h-[200px] flex items-center justify-center shrink-0">
                    <img src={qrCode} alt="Payment QR" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                      <QrCode className="w-5 h-5 text-primary-500" />
                      <h4 className="font-display font-bold text-secondary-900 dark:text-white text-sm">
                        {lang === 'vi' ? 'Quét mã QR để chuyển khoản' : lang === 'kr' ? 'QR 코드를 스캔하여 송금하세요' : 'Scan QR to transfer'}
                      </h4>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-center sm:justify-between gap-2">
                        <span className="text-secondary-500 dark:text-secondary-400">{lang === 'vi' ? 'Ngân hàng' : lang === 'kr' ? '은행' : 'Bank'}:</span>
                        <span className="font-semibold text-secondary-900 dark:text-white">{getBankName(selectedMethod!.bank_bin!)}</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-between gap-2">
                        <span className="text-secondary-500 dark:text-secondary-400">{lang === 'vi' ? 'Số tài khoản' : lang === 'kr' ? '계좌번호' : 'Account'}:</span>
                        <span className="font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
                          {selectedMethod!.bank_account_number}
                          <button type="button" onClick={copyAccountNumber} className="p-1 rounded text-primary-400 hover:text-primary-600 transition-colors">
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </span>
                      </div>
                      {selectedMethod!.bank_account_name && (
                        <div className="flex items-center justify-center sm:justify-between gap-2">
                          <span className="text-secondary-500 dark:text-secondary-400">{lang === 'vi' ? 'Chủ tài khoản' : lang === 'kr' ? '예금주' : 'Holder'}:</span>
                          <span className="font-semibold text-secondary-900 dark:text-white">{selectedMethod!.bank_account_name}</span>
                        </div>
                      )}
                      {selectedMethod!.amount_fixed && (
                        <div className="flex items-center justify-center sm:justify-between gap-2 pt-1.5 border-t border-primary-100 dark:border-secondary-600">
                          <span className="text-secondary-500 dark:text-secondary-400">{lang === 'vi' ? 'Số tiền' : lang === 'kr' ? '금액' : 'Amount'}:</span>
                          <span className="font-bold text-primary-600 dark:text-primary-400">{formatPrice(totalPrice)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-primary-50 dark:bg-secondary-700 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between text-secondary-600 dark:text-secondary-300">
                <span>{t('selectedRoom')}</span>
                <span className="font-medium text-secondary-900 dark:text-white flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4" /> {selectedRoom.name[lang]}
                </span>
              </div>
              <div className="flex justify-between text-secondary-600 dark:text-secondary-300">
                <span>{t('numNights')}</span>
                <span className="font-medium text-secondary-900 dark:text-white">{nights} {t('nightsUnit')}</span>
              </div>
              <div className="flex justify-between text-secondary-600 dark:text-secondary-300">
                <span>{t('pricePerNight')}</span>
                <span className="font-medium text-secondary-900 dark:text-white">{formatPrice(selectedRoom.price)}</span>
              </div>
              <div className="border-t border-primary-200 dark:border-secondary-600 pt-2 flex justify-between text-base">
                <span className="font-semibold text-secondary-900 dark:text-white">{t('total')}</span>
                <span className="font-display font-bold text-primary-600 dark:text-primary-400 text-lg">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary-600 text-white font-semibold text-base hover:bg-primary-700 transition-colors disabled:opacity-60 shadow-lg"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t('processing')}</>
              ) : (
                <>{t('confirmBooking')}</>
              )}
            </button>
          </form>
        ) : (
          <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-50 text-success-500 mb-5">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl font-bold text-secondary-900 dark:text-white mb-3">{t('bookingSuccess')}</h3>
            <p className="text-secondary-600 dark:text-secondary-300 mb-2">
              {t('bookingThanks')} <span className="font-semibold text-secondary-900 dark:text-white">{name || '—you'}</span> {t('bookingEmailSent')}
            </p>
            <p className="text-secondary-600 dark:text-secondary-300 mb-6 text-sm">
              {t('bookingEmailSent2')}
            </p>
            <div className="bg-primary-50 dark:bg-secondary-700 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-secondary-500 dark:text-secondary-400">{t('selectRoom')}:</span><span className="font-medium text-secondary-900 dark:text-white">{selectedRoom.name[lang]}</span></div>
                <div className="flex justify-between"><span className="text-secondary-500 dark:text-secondary-400">{t('checkIn')}:</span><span className="font-medium text-secondary-900 dark:text-white">{checkIn || '—'}</span></div>
                <div className="flex justify-between"><span className="text-secondary-500 dark:text-secondary-400">{t('checkOut')}:</span><span className="font-medium text-secondary-900 dark:text-white">{checkOut || '—'}</span></div>
                <div className="flex justify-between"><span className="text-secondary-500 dark:text-secondary-400">{t('total')}:</span><span className="font-bold text-primary-600 dark:text-primary-400">{formatPrice(totalPrice)}</span></div>
                {selectedMethod && (
                  <div className="flex justify-between border-t border-primary-200 dark:border-secondary-600 pt-1.5">
                    <span className="text-secondary-500 dark:text-secondary-400">{lang === 'vi' ? 'Thanh toán' : lang === 'kr' ? '결제' : 'Payment'}:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">{pmLabel(selectedMethod)}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors"
            >
              {t('finish')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
