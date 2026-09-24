import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  TrendingUp,
  DollarSign,
  BedDouble,
  UserCircle,
  Edit3,
  Trash2,
  Plus,
  Save,
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Shield,
  Star,
  Minus,
  Globe,
  Image as ImageIcon,
  Type,
  List,
  Settings,
  Monitor,
  Tag,
  Hash,
  Maximize2,
  Bold,
  Italic,
  Heading2,
  Heading3,
  ListOrdered,
  Link2,
  Languages,
  Sparkles,
  Upload,
  Film,
  Crop,
  Trash,
  ExternalLink,
  FileType2,
  ChevronUp,
  ChevronDown,
  Pencil,
  QrCode,
  UserPlus,
  KeyRound,
  UserCog,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  Download,
  FileSpreadsheet,
  Receipt,
  Printer,
  Send,
  Palette,
  Bell,
  Building2,
  FilePlus2,
  CalendarDays,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice, rooms as defaultRooms, amenities as defaultAmenities, testimonials as defaultTestimonials, galleryImages as defaultGallery, stats as defaultStats } from '@/data/hotelData';
import type { Language } from '@/data/hotelData';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { generateQRDataURL, getBankName, vietnameseBanks } from '@/lib/vietqr';
import * as XLSX from 'xlsx';

type BookingRow = {
  id: string;
  clerk_user_id: string;
  user_email: string;
  user_name: string;
  room_id: string;
  room_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  phone: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: string | null;
  is_active?: boolean | null;
  updated_at?: string | null;
};

type PaymentRow = {
  id: string;
  booking_id: string | null;
  clerk_user_id: string | null;
  user_email: string | null;
  amount: number;
  currency: string;
  provider: string;
  provider_payment_id: string | null;
  status: string;
  method: string | null;
  notes: string | null;
  created_at: string;
};

type PaymentMethodRow = {
  id: string;
  label: Record<string, string>;
  description: Record<string, string>;
  icon: string;
  type: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  bank_bin?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  amount_fixed?: boolean | null;
};

type ContentRow = {
  id: string;
  category: string;
  key: string;
  content: Record<string, unknown>;
  is_published: boolean;
  sort_order: number;
  updated_at: string;
};

type AdminTab = 'overview' | 'users' | 'bookings' | 'content' | 'payments' | 'payment_methods' | 'invoices' | 'settings';

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type CustomInvoiceRow = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  issue_date: string;
  due_date: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  currency: string;
  status: string;
  notes: string | null;
  created_at: string;
};

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label_vi: string; label_en: string }> = {
  pending: { color: 'text-warning-600 bg-warning-50 border-warning-200 dark:text-warning-400 dark:bg-warning-900/30 dark:border-warning-800', icon: Clock, label_vi: 'Chờ xác nhận', label_en: 'Pending' },
  confirmed: { color: 'text-success-600 bg-success-50 border-success-200 dark:text-success-400 dark:bg-success-900/30 dark:border-success-800', icon: CheckCircle2, label_vi: 'Đã xác nhận', label_en: 'Confirmed' },
  cancelled: { color: 'text-error-600 bg-error-50 border-error-200 dark:text-error-400 dark:bg-error-900/30 dark:border-error-800', icon: XCircle, label_vi: 'Đã hủy', label_en: 'Cancelled' },
};

const payStatusConfig: Record<string, { color: string; label_vi: string; label_en: string }> = {
  pending: { color: 'text-warning-600 bg-warning-50 border-warning-200 dark:text-warning-400 dark:bg-warning-900/30 dark:border-warning-800', label_vi: 'Chờ thanh toán', label_en: 'Pending' },
  paid: { color: 'text-success-600 bg-success-50 border-success-200 dark:text-success-400 dark:bg-success-900/30 dark:border-success-800', label_vi: 'Đã thanh toán', label_en: 'Paid' },
  failed: { color: 'text-error-600 bg-error-50 border-error-200 dark:text-error-400 dark:bg-error-900/30 dark:border-error-800', label_vi: 'Thất bại', label_en: 'Failed' },
  refunded: { color: 'text-secondary-600 bg-secondary-50 border-secondary-200 dark:text-secondary-400 dark:bg-secondary-900/30 dark:border-secondary-800', label_vi: 'Đã hoàn tiền', label_en: 'Refunded' },
};

type AdminPanelProps = {
  onBack: () => void;
};

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { lang } = useApp();
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [content, setContent] = useState<ContentRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRow[]>([]);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodRow | null>(null);
  const [creatingMethod, setCreatingMethod] = useState(false);
  const [editingUser, setEditingUser] = useState<ProfileRow | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [invoiceBooking, setInvoiceBooking] = useState<BookingRow | null>(null);
  const [customInvoices, setCustomInvoices] = useState<CustomInvoiceRow[]>([]);
  const [showInvoiceEditor, setShowInvoiceEditor] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<CustomInvoiceRow | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<CustomInvoiceRow | null>(null);
  const [emailNotifStatus, setEmailNotifStatus] = useState<{ bookingId: string; status: 'sending' | 'sent' | 'error' } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [bookingFilter, setBookingFilter] = useState<string>('all');

  const tr = lang === 'vi' ? adminTr.vi : lang === 'kr' ? adminTr.kr : adminTr.en;

  const loadBookings = useCallback(async () => {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    setBookings((data as BookingRow[]) ?? []);
  }, []);

  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    setProfiles((data as ProfileRow[]) ?? []);
  }, []);

  const loadPayments = useCallback(async () => {
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    setPayments((data as PaymentRow[]) ?? []);
  }, []);

  const loadContent = useCallback(async () => {
    const { data, error } = await supabase.from('site_content').select('*').order('category', { ascending: true }).order('sort_order', { ascending: true });
    if (error) { console.error(error); return; }
    setContent((data as ContentRow[]) ?? []);
  }, []);

  const loadPaymentMethods = useCallback(async () => {
    const { data, error } = await supabase.from('payment_methods').select('*').order('sort_order', { ascending: true });
    if (error) { console.error(error); return; }
    setPaymentMethods((data as PaymentMethodRow[]) ?? []);
  }, []);

  const loadCustomInvoices = useCallback(async () => {
    const { data, error } = await supabase.from('custom_invoices').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    setCustomInvoices((data as CustomInvoiceRow[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadBookings(), loadProfiles(), loadPayments(), loadContent(), loadPaymentMethods(), loadCustomInvoices()]);
      setLoading(false);
    })();
  }, [loadBookings, loadProfiles, loadPayments, loadContent, loadPaymentMethods, loadCustomInvoices]);

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    confirmedBookings: bookings.filter((b) => b.status === 'confirmed').length,
    totalRevenue: bookings.filter((b) => b.status === 'confirmed').reduce((sum, b) => sum + b.total_price, 0),
    totalUsers: profiles.length,
    totalPayments: payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: payments.filter((p) => p.status === 'pending').length,
    publishedContent: content.filter((c) => c.is_published).length,
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = bookingFilter === 'all' || b.status === bookingFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || b.user_name.toLowerCase().includes(q) || b.user_email.toLowerCase().includes(q) || b.room_name.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const filteredProfiles = profiles.filter((p) => {
    const q = searchQuery.toLowerCase();
    return !q || (p.email ?? '').toLowerCase().includes(q) || (p.full_name ?? '').toLowerCase().includes(q);
  });

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) { console.error(error); return; }
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    if (status === 'confirmed') {
      const booking = bookings.find((b) => b.id === id);
      if (booking) {
        await supabase.from('payments').insert({
          booking_id: booking.id,
          clerk_user_id: booking.clerk_user_id,
          user_email: booking.user_email,
          amount: booking.total_price,
          currency: 'VND',
          provider: 'manual',
          status: 'pending',
          method: 'bank_transfer',
        });
        loadPayments();
      }
    }
  };

  const updatePaymentStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('payments').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { console.error(error); return; }
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));

    // When payment is marked as paid, send email notifications to admin/staff and customer
    if (status === 'paid') {
      const payment = payments.find((p) => p.id === id);
      if (payment?.booking_id) {
        const booking = bookings.find((b) => b.id === payment.booking_id);
        if (booking) {
          sendPaymentNotifications(booking, payment.amount);
        }
      }
    }
  };

  const sendPaymentNotifications = async (booking: BookingRow, amount: number) => {
    setEmailNotifStatus({ bookingId: booking.id, status: 'sending' });
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          userEmail: booking.user_email,
          userName: booking.user_name,
          roomName: booking.room_name,
          amount,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          guests: booking.guests,
        }),
      });
      if (!resp.ok) throw new Error('Notification failed');
      setEmailNotifStatus({ bookingId: booking.id, status: 'sent' });
      setTimeout(() => setEmailNotifStatus(null), 4000);
    } catch (err) {
      console.error(err);
      setEmailNotifStatus({ bookingId: booking.id, status: 'error' });
      setTimeout(() => setEmailNotifStatus(null), 4000);
    }
  };

  const exportPaymentsToExcel = () => {
    const rows = payments.map((p) => ({
      [tr.excelDate]: new Date(p.created_at).toLocaleDateString('vi-VN'),
      [tr.excelBookingId]: p.booking_id ?? '',
      [tr.excelCustomer]: p.user_email ?? '',
      [tr.excelAmount]: p.amount,
      [tr.excelCurrency]: p.currency,
      [tr.excelProvider]: p.provider,
      [tr.excelMethod]: p.method ?? '',
      [tr.excelStatus]: lang === 'vi' ? (payStatusConfig[p.status]?.label_vi ?? p.status) : (payStatusConfig[p.status]?.label_en ?? p.status),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 36 }, { wch: 28 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, `payments-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const toggleContentPublished = async (id: string, current: boolean) => {
    const { error } = await supabase.from('site_content').update({ is_published: !current, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { console.error(error); return; }
    setContent((prev) => prev.map((c) => (c.id === id ? { ...c, is_published: !current } : c)));
  };

  const deleteContent = async (id: string) => {
    const { error } = await supabase.from('site_content').delete().eq('id', id);
    if (error) { console.error(error); return; }
    setContent((prev) => prev.filter((c) => c.id !== id));
  };

  const moveContent = async (row: ContentRow, dir: 'up' | 'down') => {
    const sorted = content.filter((c) => c.category === row.category).sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((c) => c.id === row.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapRow = sorted[swapIdx];
    await supabase.from('site_content').update({ sort_order: swapRow.sort_order, updated_at: new Date().toISOString() }).eq('id', row.id);
    await supabase.from('site_content').update({ sort_order: row.sort_order, updated_at: new Date().toISOString() }).eq('id', swapRow.id);
    loadContent();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(lang === 'vi' ? 'vi-VN' : lang === 'kr' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const statCards = [
    { label: tr.totalBookings, value: stats.totalBookings, icon: Calendar, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' },
    { label: tr.pendingBookings, value: stats.pendingBookings, icon: Clock, color: 'bg-warning-100 text-warning-600 dark:bg-warning-900/40 dark:text-warning-400' },
    { label: tr.totalRevenue, value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-400' },
    { label: tr.totalUsers, value: stats.totalUsers, icon: Users, color: 'bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400' },
    { label: tr.totalPayments, value: formatPrice(stats.totalPayments), icon: CreditCard, color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400' },
    { label: tr.pendingPayments, value: stats.pendingPayments, icon: TrendingUp, color: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-700/60 dark:text-secondary-300' },
    { label: tr.publishedContent, value: stats.publishedContent, icon: FileText, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' },
    { label: tr.confirmedBookings, value: stats.confirmedBookings, icon: CheckCircle2, color: 'bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-400' },
  ];

  const tabs: { key: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'overview', label: tr.overview, icon: LayoutDashboard },
    { key: 'users', label: tr.users, icon: Users },
    { key: 'bookings', label: tr.bookings, icon: Calendar },
    { key: 'content', label: tr.content, icon: FileText },
    { key: 'payments', label: tr.payments, icon: CreditCard },
    { key: 'payment_methods', label: tr.paymentMethodsTab, icon: CreditCard },
    { key: 'invoices', label: tr.invoicesTab, icon: Receipt },
    { key: 'settings', label: tr.settingsTab, icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-secondary-900 dark:text-white">{tr.adminTitle}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
                  {tr.adminPanel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-600 text-white text-sm font-bold overflow-hidden shrink-0">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName || 'Avatar'} className="w-full h-full object-cover" /> : user.initials}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-secondary-900 dark:text-white">{user.fullName || 'Admin'}</div>
                  {user.email && <div className="text-xs text-secondary-500 dark:text-secondary-400">{user.email}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-secondary-800 rounded-xl p-1.5 border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm w-fit overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearchQuery(''); setBookingFilter('all'); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${tab === t.key ? 'bg-primary-600 text-white shadow-md' : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="relative bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 opacity-70" />
                    <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-display font-bold text-secondary-900 dark:text-white">{stat.value}</div>
                    <div className="text-sm text-secondary-500 dark:text-secondary-400 mt-0.5">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Recent Bookings */}
            <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-secondary-100 dark:border-secondary-700/50">
                <h2 className="font-display text-lg font-bold text-secondary-900 dark:text-white">{tr.recentBookings}</h2>
              </div>
              {bookings.length === 0 ? (
                <div className="p-8 text-center text-secondary-400 dark:text-secondary-500 text-sm">{tr.noBookings}</div>
              ) : (
                <div className="divide-y divide-secondary-100 dark:divide-secondary-700/50">
                  {bookings.slice(0, 5).map((b) => {
                    const sc = statusConfig[b.status] ?? statusConfig.pending;
                    const SIcon = sc.icon;
                    return (
                      <div key={b.id} className="flex items-center gap-4 p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/30 transition-colors">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 shrink-0">
                          <BedDouble className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-secondary-900 dark:text-white text-sm truncate">{b.room_name}</div>
                          <div className="text-xs text-secondary-400 dark:text-secondary-500">{b.user_name} · {formatDate(b.check_in)} → {formatDate(b.check_out)}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display font-bold text-secondary-900 dark:text-white text-sm">{formatPrice(b.total_price)}</div>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${sc.color}`}>
                            <SIcon className="w-3 h-3" /> {lang === 'vi' ? sc.label_vi : sc.label_en}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Payments */}
            <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-secondary-100 dark:border-secondary-700/50">
                <h2 className="font-display text-lg font-bold text-secondary-900 dark:text-white">{tr.recentPayments}</h2>
              </div>
              {payments.length === 0 ? (
                <div className="p-8 text-center text-secondary-400 dark:text-secondary-500 text-sm">{tr.noPayments}</div>
              ) : (
                <div className="divide-y divide-secondary-100 dark:divide-secondary-700/50">
                  {payments.slice(0, 5).map((p) => {
                    const sc = payStatusConfig[p.status] ?? payStatusConfig.pending;
                    return (
                      <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/30 transition-colors">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-secondary-900 dark:text-white text-sm">{p.user_email ?? '—'}</div>
                          <div className="text-xs text-secondary-400 dark:text-secondary-500">{p.provider} · {formatDate(p.created_at)}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display font-bold text-secondary-900 dark:text-white text-sm">{formatPrice(p.amount)}</div>
                          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${sc.color}`}>
                            {lang === 'vi' ? sc.label_vi : sc.label_en}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="space-y-4">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} placeholder={tr.searchUsers} />
            <UserManager
              profiles={filteredProfiles}
              allProfiles={profiles}
              onReload={loadProfiles}
              tr={tr}
              lang={lang}
              editingUser={editingUser}
              setEditingUser={setEditingUser}
              showAddStaff={showAddStaff}
              setShowAddStaff={setShowAddStaff}
              currentUserId={user?.id ?? ''}
              formatDate={formatDate}
            />
          </div>
        )}

        {/* Bookings Tab */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} placeholder={tr.searchBookings} />
              <div className="flex gap-1 bg-white dark:bg-secondary-800 rounded-xl p-1 border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm">
                {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setBookingFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${bookingFilter === f ? 'bg-primary-600 text-white' : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'}`}
                  >
                    {f === 'all' ? tr.all : lang === 'vi' ? (statusConfig[f]?.label_vi ?? f) : (statusConfig[f]?.label_en ?? f)}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm overflow-hidden">
              {filteredBookings.length === 0 ? (
                <div className="p-8 text-center text-secondary-400 dark:text-secondary-500 text-sm">{tr.noBookings}</div>
              ) : (
                <div className="divide-y divide-secondary-100 dark:divide-secondary-700/50">
                  {filteredBookings.map((b) => {
                    const sc = statusConfig[b.status] ?? statusConfig.pending;
                    const SIcon = sc.icon;
                    return (
                      <div key={b.id} className="p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 shrink-0">
                            <BedDouble className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-secondary-900 dark:text-white text-sm">{b.room_name}</div>
                            <div className="text-xs text-secondary-400 dark:text-secondary-500">{b.user_name} · {b.user_email}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-display font-bold text-secondary-900 dark:text-white text-sm">{formatPrice(b.total_price)}</div>
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${sc.color}`}>
                              <SIcon className="w-3 h-3" /> {lang === 'vi' ? sc.label_vi : sc.label_en}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pl-14">
                          <div className="text-xs text-secondary-400 dark:text-secondary-500">
                            {formatDate(b.check_in)} → {formatDate(b.check_out)} · {b.guests} {tr.guests}
                          </div>
                          <div className="flex gap-2">
                            {b.status !== 'cancelled' && (
                              <button onClick={() => setInvoiceBooking(b)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-sky-100 text-sky-600 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50 transition-all">
                                <Receipt className="w-3.5 h-3.5" /> {tr.invoice}
                              </button>
                            )}
                            {b.status !== 'confirmed' && (
                              <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-success-100 text-success-600 hover:bg-success-200 dark:bg-success-900/30 dark:text-success-400 dark:hover:bg-success-900/50 transition-all">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {tr.confirm}
                              </button>
                            )}
                            {b.status !== 'cancelled' && (
                              <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-error-100 text-error-600 hover:bg-error-200 dark:bg-error-900/30 dark:text-error-400 dark:hover:bg-error-900/50 transition-all">
                                <XCircle className="w-3.5 h-3.5" /> {tr.cancel}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Tab */}
        {tab === 'content' && (
          <ContentManager content={content} onReload={loadContent} tr={tr} lang={lang} onTogglePublished={toggleContentPublished} onDelete={deleteContent} onMove={moveContent} />
        )}

        {/* Payments Tab */}
        {tab === 'payments' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-success-500" />
                  <span className="text-sm text-secondary-500 dark:text-secondary-400">{tr.totalPaid}</span>
                </div>
                <div className="text-2xl font-display font-bold text-secondary-900 dark:text-white">{formatPrice(stats.totalPayments)}</div>
              </div>
              <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-warning-500" />
                  <span className="text-sm text-secondary-500 dark:text-secondary-400">{tr.pendingPayments}</span>
                </div>
                <div className="text-2xl font-display font-bold text-secondary-900 dark:text-white">{stats.pendingPayments}</div>
              </div>
              <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-sky-500" />
                  <span className="text-sm text-secondary-500 dark:text-secondary-400">{tr.totalTransactions}</span>
                </div>
                <div className="text-2xl font-display font-bold text-secondary-900 dark:text-white">{payments.length}</div>
              </div>
            </div>

            <button
              onClick={exportPaymentsToExcel}
              disabled={payments.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-success-300 dark:border-success-700 text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 transition-all text-sm font-semibold disabled:opacity-40"
            >
              <FileSpreadsheet className="w-4 h-4" /> {tr.exportExcel}
            </button>

            {/* Email notification status toast */}
            {emailNotifStatus && (
              <div className={`fixed bottom-6 right-6 z-[120] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-fade-in ${
                emailNotifStatus.status === 'sending' ? 'bg-warning-500 text-white' :
                emailNotifStatus.status === 'sent' ? 'bg-success-500 text-white' :
                'bg-error-500 text-white'
              }`}>
                {emailNotifStatus.status === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
                {emailNotifStatus.status === 'sent' && <CheckCircle className="w-4 h-4" />}
                {emailNotifStatus.status === 'error' && <XCircle className="w-4 h-4" />}
                <span className="text-sm font-semibold">
                  {emailNotifStatus.status === 'sending' ? tr.emailSending :
                   emailNotifStatus.status === 'sent' ? tr.emailSent : tr.emailSendError}
                </span>
              </div>
            )}

            <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm overflow-hidden">
              {payments.length === 0 ? (
                <div className="p-8 text-center text-secondary-400 dark:text-secondary-500 text-sm">{tr.noPayments}</div>
              ) : (
                <div className="divide-y divide-secondary-100 dark:divide-secondary-700/50">
                  {payments.map((p) => {
                    const sc = payStatusConfig[p.status] ?? payStatusConfig.pending;
                    return (
                      <div key={p.id} className="p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 shrink-0">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-secondary-900 dark:text-white text-sm">{p.user_email ?? '—'}</div>
                            <div className="text-xs text-secondary-400 dark:text-secondary-500">{p.provider} · {p.method ?? '—'} · {formatDate(p.created_at)}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-display font-bold text-secondary-900 dark:text-white text-sm">{formatPrice(p.amount)} {p.currency}</div>
                            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${sc.color}`}>
                              {lang === 'vi' ? sc.label_vi : sc.label_en}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-3">
                          {p.status === 'pending' && (
                            <button onClick={() => updatePaymentStatus(p.id, 'paid')} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-success-100 text-success-600 hover:bg-success-200 dark:bg-success-900/30 dark:text-success-400 dark:hover:bg-success-900/50 transition-all">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {tr.markPaid}
                            </button>
                          )}
                          {p.status === 'paid' && (
                            <button onClick={() => updatePaymentStatus(p.id, 'refunded')} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-secondary-100 text-secondary-600 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-600 transition-all">
                              {tr.markRefunded}
                            </button>
                          )}
                          {p.status === 'pending' && (
                            <button onClick={() => updatePaymentStatus(p.id, 'failed')} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-error-100 text-error-600 hover:bg-error-200 dark:bg-error-900/30 dark:text-error-400 dark:hover:bg-error-900/50 transition-all">
                              <XCircle className="w-3.5 h-3.5" /> {tr.markFailed}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {tab === 'payment_methods' && (
          <PaymentMethodManager
            methods={paymentMethods}
            onReload={loadPaymentMethods}
            tr={tr}
            lang={lang}
            editingMethod={editingMethod}
            setEditingMethod={setEditingMethod}
            creatingMethod={creatingMethod}
            setCreatingMethod={setCreatingMethod}
          />
        )}

        {/* Invoices Tab */}
        {tab === 'invoices' && (
          <InvoiceManager
            invoices={customInvoices}
            onReload={loadCustomInvoices}
            tr={tr}
            lang={lang}
            formatDate={formatDate}
            showEditor={showInvoiceEditor}
            setShowEditor={setShowInvoiceEditor}
            editingInvoice={editingInvoice}
            setEditingInvoice={setEditingInvoice}
            viewingInvoice={viewingInvoice}
            setViewingInvoice={setViewingInvoice}
          />
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <SettingsManager tr={tr} lang={lang} />
        )}
      </div>

      {invoiceBooking && (
        <InvoiceModal
          booking={invoiceBooking}
          tr={tr}
          lang={lang}
          onClose={() => setInvoiceBooking(null)}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

/* ---------- Settings Manager ---------- */

function SettingsManager({ tr, lang }: { tr: typeof adminTr.vi; lang: Language }) {
  const { settings, reloadSettings } = useApp();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<'general' | 'banner' | 'footer' | 'colors' | 'email'>('general');

  useEffect(() => { setForm(settings); }, [settings]);

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('site_settings').select('id').order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (existing) {
        await supabase.from('site_settings').update({ settings: form, updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('site_settings').insert({ settings: form });
      }
      reloadSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const sections: { key: typeof section; label: string; icon: typeof Globe }[] = [
    { key: 'general', label: tr.stGeneral, icon: Settings },
    { key: 'banner', label: tr.stBanner, icon: ImageIcon },
    { key: 'footer', label: tr.stFooter, icon: Globe },
    { key: 'colors', label: tr.stColors, icon: Palette },
    { key: 'email', label: tr.stEmail, icon: Bell },
  ];

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-1 bg-white dark:bg-secondary-800 rounded-xl p-1.5 border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm w-fit overflow-x-auto">
        {sections.map((s) => {
          const SIcon = s.icon;
          return (
            <button key={s.key} onClick={() => setSection(s.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${section === s.key ? 'bg-primary-600 text-white' : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'}`}>
              <SIcon className="w-4 h-4" /> {s.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm p-6 space-y-5">
        {/* General */}
        {section === 'general' && (
          <>
            <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-2">{tr.stGeneral}</h3>
            <div>
              <label className={labelClass}>{tr.stHotelName}</label>
              <input type="text" value={form.hotelName} onChange={(e) => update('hotelName', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{tr.stHotelNameKr}</label>
              <input type="text" value={form.hotelNameKr} onChange={(e) => update('hotelNameKr', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{tr.stTagline}</label>
              <textarea value={form.tagline} onChange={(e) => update('tagline', e.target.value)} rows={2} className={inputClass} />
            </div>
          </>
        )}

        {/* Banner */}
        {section === 'banner' && (
          <>
            <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-2">{tr.stBanner}</h3>
            <div>
              <label className={labelClass}>{tr.stHeroImage}</label>
              <input type="text" value={form.heroImage} onChange={(e) => update('heroImage', e.target.value)} placeholder="https://..." className={inputClass} />
              {form.heroImage && (
                <div className="mt-3 rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700">
                  <img src={form.heroImage} alt="Banner preview" className="w-full h-48 object-cover" />
                </div>
              )}
            </div>
            <div className="bg-secondary-50 dark:bg-secondary-700/30 rounded-xl p-4 text-sm text-secondary-500 dark:text-secondary-400">
              {tr.stHeroImageHint}
            </div>
          </>
        )}

        {/* Footer / Contact */}
        {section === 'footer' && (
          <>
            <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-2">{tr.stFooter}</h3>
            <div>
              <label className={labelClass}>{tr.stAddress}</label>
              <input type="text" value={form.contactAddress} onChange={(e) => update('contactAddress', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{tr.stAddressKr}</label>
              <input type="text" value={form.contactAddressKr} onChange={(e) => update('contactAddressKr', e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{tr.stPhone}</label>
                <input type="text" value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{tr.stContactEmail}</label>
                <input type="email" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>{tr.stReceptionHours}</label>
              <input type="text" value={form.receptionHours} onChange={(e) => update('receptionHours', e.target.value)} className={inputClass} />
            </div>
            <div className="border-t border-secondary-100 dark:border-secondary-700/50 pt-4">
              <h4 className="font-semibold text-secondary-900 dark:text-white text-sm mb-3">{tr.stSocial}</h4>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Facebook</label>
                  <input type="text" value={form.socialFacebook} onChange={(e) => update('socialFacebook', e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Instagram</label>
                  <input type="text" value={form.socialInstagram} onChange={(e) => update('socialInstagram', e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>YouTube</label>
                  <input type="text" value={form.socialYoutube} onChange={(e) => update('socialYoutube', e.target.value)} placeholder="https://youtube.com/..." className={inputClass} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Colors */}
        {section === 'colors' && (
          <>
            <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-2">{tr.stColors}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{tr.stPrimaryColor}</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} className="w-12 h-10 rounded-lg border border-secondary-200 dark:border-secondary-600 cursor-pointer bg-transparent" />
                  <input type="text" value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} className={`${inputClass} flex-1`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{tr.stAccentColor}</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} className="w-12 h-10 rounded-lg border border-secondary-200 dark:border-secondary-600 cursor-pointer bg-transparent" />
                  <input type="text" value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} className={`${inputClass} flex-1`} />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="mt-4 p-4 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-700/30">
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">{tr.stColorPreview}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <button className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: form.primaryColor }}>
                  {tr.stPrimaryColor}
                </button>
                <button className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: form.accentColor }}>
                  {tr.stAccentColor}
                </button>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: form.primaryColor + '20', color: form.primaryColor }}>
                  Badge
                </span>
              </div>
            </div>
            <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-4 text-sm text-warning-600 dark:text-warning-400">
              {tr.stColorHint}
            </div>
          </>
        )}

        {/* Email */}
        {section === 'email' && (
          <>
            <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-2">{tr.stEmail}</h3>
            <div>
              <label className={labelClass}>{tr.stNotifEmail}</label>
              <input type="email" value={form.notifEmailAdmin} onChange={(e) => update('notifEmailAdmin', e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-secondary-200 dark:border-secondary-700">
              <div>
                <p className="font-semibold text-secondary-900 dark:text-white text-sm">{tr.stNotifEnabled}</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">{tr.stNotifEnabledHint}</p>
              </div>
              <button
                onClick={() => update('notifEmailEnabled', !form.notifEmailEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.notifEmailEnabled ? 'bg-success-500' : 'bg-secondary-300 dark:bg-secondary-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.notifEmailEnabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="bg-secondary-50 dark:bg-secondary-700/30 rounded-xl p-4 text-sm text-secondary-500 dark:text-secondary-400">
              {tr.stEmailHint}
            </div>
          </>
        )}

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-100 dark:border-secondary-700/50">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success-600 dark:text-success-400">
              <CheckCircle className="w-4 h-4" /> {tr.stSaved}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {tr.stSave}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Custom Invoice Manager ---------- */

function generateInvoiceNumber(existing: CustomInvoiceRow[]): string {
  const year = new Date().getFullYear();
  const count = existing.filter((i) => i.invoice_number.startsWith(`INV-${year}`)).length + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
}

function InvoiceManager({ invoices, onReload, tr, lang, formatDate, showEditor, setShowEditor, editingInvoice, setEditingInvoice, viewingInvoice, setViewingInvoice }: {
  invoices: CustomInvoiceRow[];
  onReload: () => void;
  tr: typeof adminTr.vi;
  lang: Language;
  formatDate: (d: string) => string;
  showEditor: boolean;
  setShowEditor: (v: boolean) => void;
  editingInvoice: CustomInvoiceRow | null;
  setEditingInvoice: (v: CustomInvoiceRow | null) => void;
  viewingInvoice: CustomInvoiceRow | null;
  setViewingInvoice: (v: CustomInvoiceRow | null) => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm(tr.invConfirmDelete)) return;
    const { error } = await supabase.from('custom_invoices').delete().eq('id', id);
    if (error) { console.error(error); return; }
    onReload();
  };

  if (showEditor || editingInvoice) {
    return (
      <CustomInvoiceEditor
        existing={editingInvoice}
        allInvoices={invoices}
        onSave={async (data) => {
          if (editingInvoice) {
            const { error } = await supabase.from('custom_invoices').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editingInvoice.id);
            if (error) { console.error(error); return; }
          } else {
            const { error } = await supabase.from('custom_invoices').insert({ ...data });
            if (error) { console.error(error); return; }
          }
          setEditingInvoice(null);
          setShowEditor(false);
          onReload();
        }}
        onCancel={() => { setEditingInvoice(null); setShowEditor(false); }}
        tr={tr}
        lang={lang}
      />
    );
  }

  if (viewingInvoice) {
    return (
      <CustomInvoiceView
        invoice={viewingInvoice}
        tr={tr}
        lang={lang}
        formatDate={formatDate}
        onClose={() => setViewingInvoice(null)}
      />
    );
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300',
    sent: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    paid: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400',
    overdue: 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200/70 dark:border-secondary-700/80 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-secondary-400" />
            <span className="text-xs text-secondary-500 dark:text-secondary-400">{tr.invTotal}</span>
          </div>
          <div className="text-xl font-display font-bold text-secondary-900 dark:text-white">{invoices.length}</div>
        </div>
        <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200/70 dark:border-secondary-700/80 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-success-400" />
            <span className="text-xs text-secondary-500 dark:text-secondary-400">{tr.invPaid}</span>
          </div>
          <div className="text-xl font-display font-bold text-secondary-900 dark:text-white">{invoices.filter((i) => i.status === 'paid').length}</div>
        </div>
        <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200/70 dark:border-secondary-700/80 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-warning-400" />
            <span className="text-xs text-secondary-500 dark:text-secondary-400">{tr.invPending}</span>
          </div>
          <div className="text-xl font-display font-bold text-secondary-900 dark:text-white">{invoices.filter((i) => i.status === 'sent' || i.status === 'draft').length}</div>
        </div>
      </div>

      <button
        onClick={() => setShowEditor(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-sm font-semibold"
      >
        <FilePlus2 className="w-4 h-4" /> {tr.invCreate}
      </button>

      {invoices.length === 0 ? (
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm p-8 text-center text-secondary-400 dark:text-secondary-500 text-sm">
          {tr.invNoInvoices}
        </div>
      ) : (
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-secondary-100 dark:divide-secondary-700/50">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-secondary-900 dark:text-white text-sm">{inv.invoice_number}</div>
                    <div className="text-xs text-secondary-400 dark:text-secondary-500">{inv.customer_name} · {formatDate(inv.issue_date)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display font-bold text-secondary-900 dark:text-white text-sm">{formatPrice(inv.total)}</div>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[inv.status] ?? statusColors.draft}`}>
                      {tr.invStatusDraft && inv.status === 'draft' ? tr.invStatusDraft : inv.status === 'sent' ? tr.invStatusSent : inv.status === 'paid' ? tr.invStatusPaid : inv.status === 'overdue' ? tr.invStatusOverdue : inv.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => setViewingInvoice(inv)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-sky-100 text-sky-600 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400 transition-all">
                    <Eye className="w-3.5 h-3.5" /> {tr.invView}
                  </button>
                  <button onClick={() => setEditingInvoice(inv)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 transition-all">
                    <Edit3 className="w-3.5 h-3.5" /> {tr.invEdit}
                  </button>
                  <button onClick={() => handleDelete(inv.id)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-error-100 text-error-600 hover:bg-error-200 dark:bg-error-900/30 dark:text-error-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> {tr.invDelete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Custom Invoice Editor ---------- */

function CustomInvoiceEditor({ existing, allInvoices, onSave, onCancel, tr, lang }: {
  existing: CustomInvoiceRow | null;
  allInvoices: CustomInvoiceRow[];
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  tr: typeof adminTr.vi;
  lang: Language;
}) {
  const [invoiceNumber, setInvoiceNumber] = useState(existing?.invoice_number ?? generateInvoiceNumber(allInvoices));
  const [customerName, setCustomerName] = useState(existing?.customer_name ?? '');
  const [customerEmail, setCustomerEmail] = useState(existing?.customer_email ?? '');
  const [customerPhone, setCustomerPhone] = useState(existing?.customer_phone ?? '');
  const [customerAddress, setCustomerAddress] = useState(existing?.customer_address ?? '');
  const [issueDate, setIssueDate] = useState(existing?.issue_date?.split('T')[0] ?? new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(existing?.due_date?.split('T')[0] ?? '');
  const [status, setStatus] = useState(existing?.status ?? 'draft');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [taxRate, setTaxRate] = useState(existing?.tax_rate ?? 0);
  const [discount, setDiscount] = useState(existing?.discount ?? 0);
  const [items, setItems] = useState<InvoiceItem[]>(existing?.items ?? [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]);

  const recalcItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      updated.amount = updated.quantity * updated.unitPrice;
      return updated;
    }));
  };

  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + taxAmount - discount;

  const handleSave = () => {
    if (!customerName.trim()) { alert(tr.invCustomerRequired); return; }
    if (items.length === 0 || items.every((i) => !i.description.trim())) { alert(tr.invItemRequired); return; }
    onSave({
      invoice_number: invoiceNumber,
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      customer_address: customerAddress || null,
      issue_date: new Date(issueDate).toISOString(),
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      items: items.filter((i) => i.description.trim()),
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount,
      total,
      currency: 'VND',
      status,
      notes: notes || null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white">{existing ? tr.invEditTitle : tr.invCreateTitle}</h3>
        <button onClick={onCancel} className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm p-6 space-y-5">
        {/* Invoice meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{tr.invNumber}</label>
            <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{tr.invStatus}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="draft">{tr.invStatusDraft}</option>
              <option value="sent">{tr.invStatusSent}</option>
              <option value="paid">{tr.invStatusPaid}</option>
              <option value="overdue">{tr.invStatusOverdue}</option>
            </select>
          </div>
        </div>

        {/* Customer info */}
        <div className="border-t border-secondary-100 dark:border-secondary-700/50 pt-4">
          <h4 className="font-semibold text-secondary-900 dark:text-white text-sm mb-3">{tr.invCustomerInfo}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{tr.invCustomerName} *</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{tr.invCustomerEmail}</label>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{tr.invCustomerPhone}</label>
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{tr.invCustomerAddress}</label>
              <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{tr.invIssueDate}</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{tr.invDueDate}</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Line items */}
        <div className="border-t border-secondary-100 dark:border-secondary-700/50 pt-4">
          <h4 className="font-semibold text-secondary-900 dark:text-white text-sm mb-3">{tr.invItems}</h4>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder={tr.invItemDesc}
                  value={item.description}
                  onChange={(e) => recalcItem(idx, 'description', e.target.value)}
                  className={`${inputClass} col-span-12 sm:col-span-5`}
                />
                <input
                  type="number"
                  placeholder="1"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => recalcItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                  className={`${inputClass} col-span-3 sm:col-span-2`}
                />
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={item.unitPrice}
                  onChange={(e) => recalcItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                  className={`${inputClass} col-span-4 sm:col-span-2`}
                />
                <div className="col-span-4 sm:col-span-2 text-right text-sm font-semibold text-secondary-900 dark:text-white py-2.5">
                  {formatPrice(item.amount)}
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  className="col-span-1 flex items-center justify-center p-2.5 rounded-lg text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                  disabled={items.length === 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addItem}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {tr.invAddItem}
          </button>
        </div>

        {/* Totals */}
        <div className="border-t border-secondary-100 dark:border-secondary-700/50 pt-4">
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-secondary-600">
                <span>{tr.invSubtotal}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-secondary-600">
                <span className="flex items-center gap-1">{tr.invTax} (%)</span>
                <input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-right text-sm" />
              </div>
              <div className="flex justify-between text-sm text-secondary-600">
                <span>{tr.invTaxAmount}</span>
                <span>{formatPrice(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-secondary-600">
                <span>{tr.invDiscount}</span>
                <input type="number" min="0" value={discount} onChange={(e) => setDiscount(parseInt(e.target.value) || 0)} className="w-24 px-2 py-1 rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-right text-sm" />
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-primary-600">
                <span className="font-display font-bold text-lg text-primary-700">{tr.invTotal}</span>
                <span className="font-display font-bold text-lg text-primary-700">{formatPrice(total)} VND</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-secondary-100 dark:border-secondary-700/50 pt-4">
          <label className={labelClass}>{tr.invNotes}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} placeholder={tr.invNotesPlaceholder} />
        </div>

        {/* Save buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-100 dark:border-secondary-700/50">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">
            {tr.cancel}
          </button>
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
            <Save className="w-4 h-4" /> {tr.save}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Custom Invoice View ---------- */

function CustomInvoiceView({ invoice, tr, lang, formatDate, onClose }: {
  invoice: CustomInvoiceRow;
  tr: typeof adminTr.vi;
  lang: Language;
  formatDate: (d: string) => string;
  onClose: () => void;
}) {
  const { settings } = useApp();
  const [invoiceLang, setInvoiceLang] = useState<Language>(lang);
  const it = invoiceTr[invoiceLang];
  const hotelName = invoiceLang === 'kr' ? settings.hotelNameKr : settings.hotelName;
  const hotelAddr = invoiceLang === 'kr' ? settings.contactAddressKr : settings.contactAddress;
  const statusColors: Record<string, string> = {
    draft: 'bg-secondary-100 text-secondary-700',
    sent: 'bg-sky-100 text-sky-700',
    paid: 'bg-success-100 text-success-700',
    overdue: 'bg-error-100 text-error-700',
  };
  const statusLabels: Record<string, string> = {
    draft: tr.invStatusDraft,
    sent: tr.invStatusSent,
    paid: tr.invStatusPaid,
    overdue: tr.invStatusOverdue,
  };

  return (
    <div className="fixed inset-0 z-[110] bg-secondary-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-100 no-print">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-primary-500" />
            <h3 className="font-display font-bold text-secondary-900">{invoice.invoice_number}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-secondary-100 rounded-lg p-0.5">
              {(['vi', 'en', 'kr'] as const).map((l) => (
                <button key={l} onClick={() => setInvoiceLang(l)} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${invoiceLang === l ? 'bg-primary-600 text-white' : 'text-secondary-500 hover:text-secondary-700'}`}>
                  {l === 'vi' ? 'VI' : l === 'kr' ? 'KR' : 'EN'}
                </button>
              ))}
            </div>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors">
              <Printer className="w-3.5 h-3.5" /> {it.print}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice content */}
        <div className="p-8 invoice-content">
          {/* Hotel header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-primary-600">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 text-white shadow-md shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-primary-700">{hotelName}</h2>
                <p className="text-xs text-secondary-500 mt-1">{hotelAddr}</p>
                <p className="text-xs text-secondary-500">{settings.contactPhone} · {settings.contactEmail}</p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="font-display text-xl font-bold text-secondary-900 uppercase tracking-wider">{it.title}</h3>
              <p className="text-xs text-secondary-500 mt-1">{it.invoiceNo}: <span className="font-mono font-semibold">{invoice.invoice_number}</span></p>
              <p className="text-xs text-secondary-500">{it.date}: {formatDate(invoice.issue_date)}</p>
              {invoice.due_date && <p className="text-xs text-secondary-500">{tr.invDueDate}: {formatDate(invoice.due_date)}</p>}
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs font-semibold text-secondary-400 uppercase tracking-wide mb-1">{it.billTo}</p>
              <p className="font-semibold text-secondary-900">{invoice.customer_name}</p>
              {invoice.customer_email && <p className="text-sm text-secondary-600">{invoice.customer_email}</p>}
              {invoice.customer_phone && <p className="text-sm text-secondary-600">{invoice.customer_phone}</p>}
              {invoice.customer_address && <p className="text-sm text-secondary-600">{invoice.customer_address}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-secondary-400 uppercase tracking-wide mb-1">{it.status}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[invoice.status] ?? statusColors.draft}`}>
                {statusLabels[invoice.status] ?? invoice.status}
              </span>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="border-b-2 border-secondary-200">
                <th className="text-left py-2 font-semibold text-secondary-700">{it.description}</th>
                <th className="text-center py-2 font-semibold text-secondary-700">{it.quantity}</th>
                <th className="text-right py-2 font-semibold text-secondary-700">{it.unitPrice}</th>
                <th className="text-right py-2 font-semibold text-secondary-700">{it.amount}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-secondary-100">
                  <td className="py-3 text-secondary-900 font-medium">{item.description}</td>
                  <td className="py-3 text-center text-secondary-600">{item.quantity}</td>
                  <td className="py-3 text-right text-secondary-600">{formatPrice(item.unitPrice)}</td>
                  <td className="py-3 text-right font-semibold text-secondary-900">{formatPrice(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-secondary-600">
                <span>{it.subtotal}</span>
                <span>{formatPrice(invoice.subtotal)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <>
                  <div className="flex justify-between text-sm text-secondary-600">
                    <span>{it.invoiceNo.includes('HÓA') ? `Thuế (${invoice.tax_rate}%)` : `Tax (${invoice.tax_rate}%)`}</span>
                    <span>{formatPrice(invoice.tax_amount)}</span>
                  </div>
                </>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm text-secondary-600">
                  <span>{tr.invDiscount}</span>
                  <span>-{formatPrice(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-primary-600">
                <span className="font-display font-bold text-lg text-primary-700">{it.total}</span>
                <span className="font-display font-bold text-lg text-primary-700">{formatPrice(invoice.total)} VND</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6 p-4 rounded-xl bg-secondary-50 border border-secondary-100">
              <p className="text-xs font-semibold text-secondary-400 uppercase tracking-wide mb-1">{tr.invNotes}</p>
              <p className="text-sm text-secondary-600">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-6 border-t border-secondary-100">
            <p className="text-sm text-secondary-500 italic">{it.thankYou}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Invoice Modal ---------- */

const invoiceTr = {
  vi: { title: 'HÓA ĐƠN', invoiceNo: 'Số hóa đơn', date: 'Ngày phát hành', billTo: 'Khách hàng', room: 'Phòng', checkIn: 'Nhận phòng', checkOut: 'Trả phòng', guests: 'Số khách', nights: 'Số đêm', unitPrice: 'Đơn giá', quantity: 'Số lượng', amount: 'Thành tiền', subtotal: 'Tạm tính', total: 'TỔNG CỘNG', status: 'Trạng thái', confirmed: 'Đã xác nhận', pending: 'Chờ xác nhận', cancelled: 'Đã hủy', thankYou: 'Cảm ơn quý khách đã chọn khách sạn của chúng tôi!', hotelName: 'KHÁCH SẠN SAIGON', hotelAddr: '123 Nguyễn Huệ, Q.1, TP.HCM', hotelTel: '+84 28 1234 5678', hotelEmail: 'info@saigonhotel.vn', description: 'Phòng đặt', perNight: '/đêm', print: 'In hóa đơn' },
  en: { title: 'INVOICE', invoiceNo: 'Invoice No.', date: 'Issue Date', billTo: 'Bill To', room: 'Room', checkIn: 'Check-in', checkOut: 'Check-out', guests: 'Guests', nights: 'Nights', unitPrice: 'Unit Price', quantity: 'Quantity', amount: 'Amount', subtotal: 'Subtotal', total: 'TOTAL', status: 'Status', confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled', thankYou: 'Thank you for choosing our hotel!', hotelName: 'SAIGON HOTEL', hotelAddr: '123 Nguyen Hue, Dist.1, HCMC', hotelTel: '+84 28 1234 5678', hotelEmail: 'info@saigonhotel.vn', description: 'Room Booking', perNight: '/night', print: 'Print Invoice' },
  kr: { title: '청구서', invoiceNo: '청구서 번호', date: '발행일', billTo: '고객', room: '객실', checkIn: '체크인', checkOut: '체크아웃', guests: '인원', nights: '박수', unitPrice: '단가', quantity: '수량', amount: '금액', subtotal: '소계', total: '총액', status: '상태', confirmed: '확정됨', pending: '대기 중', cancelled: '취소됨', thankYou: '저희 호텔을 이용해주셔서 감사합니다!', hotelName: '사이공 호텔', hotelAddr: '123 응우엔 후에, 1구, 호치민시', hotelTel: '+84 28 1234 5678', hotelEmail: 'info@saigonhotel.vn', description: '객실 예약', perNight: '/박', print: '청구서 인쇄' },
};

function InvoiceModal({ booking, tr, lang, onClose, formatDate }: {
  booking: BookingRow;
  tr: typeof adminTr.vi;
  lang: Language;
  onClose: () => void;
  formatDate: (d: string) => string;
}) {
  const { settings } = useApp();
  const [invoiceLang, setInvoiceLang] = useState<Language>(lang);
  const it = invoiceTr[invoiceLang];
  const hotelName = invoiceLang === 'kr' ? settings.hotelNameKr : settings.hotelName;
  const hotelAddr = invoiceLang === 'kr' ? settings.contactAddressKr : settings.contactAddress;
  const nights = Math.max(1, Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)));
  const unitPrice = Math.round(booking.total_price / nights);
  const statusLabel = booking.status === 'confirmed' ? it.confirmed : booking.status === 'cancelled' ? it.cancelled : it.pending;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-secondary-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header bar - not printed */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-100 no-print">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-primary-500" />
            <h3 className="font-display font-bold text-secondary-900">{it.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Language switcher for invoice */}
            <div className="flex gap-1 bg-secondary-100 rounded-lg p-0.5">
              {(['vi', 'en', 'kr'] as const).map((l) => (
                <button key={l} onClick={() => setInvoiceLang(l)} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${invoiceLang === l ? 'bg-primary-600 text-white' : 'text-secondary-500 hover:text-secondary-700'}`}>
                  {l === 'vi' ? 'VI' : l === 'kr' ? 'KR' : 'EN'}
                </button>
              ))}
            </div>
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors">
              <Printer className="w-3.5 h-3.5" /> {it.print}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice content - printed */}
        <div className="p-8 invoice-content">
          {/* Hotel header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-primary-600">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 text-white shadow-md shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-primary-700">{hotelName}</h2>
                <p className="text-xs text-secondary-500 mt-1">{hotelAddr}</p>
                <p className="text-xs text-secondary-500">{settings.contactPhone} · {settings.contactEmail}</p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="font-display text-xl font-bold text-secondary-900 uppercase tracking-wider">{it.title}</h3>
              <p className="text-xs text-secondary-500 mt-1">{it.invoiceNo}: <span className="font-mono font-semibold">{booking.id.slice(0, 8).toUpperCase()}</span></p>
              <p className="text-xs text-secondary-500">{it.date}: {formatDate(booking.created_at)}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs font-semibold text-secondary-400 uppercase tracking-wide mb-1">{it.billTo}</p>
              <p className="font-semibold text-secondary-900">{booking.user_name}</p>
              <p className="text-sm text-secondary-600">{booking.user_email}</p>
              {booking.phone && <p className="text-sm text-secondary-600">{booking.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-secondary-400 uppercase tracking-wide mb-1">{it.status}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                booking.status === 'confirmed' ? 'bg-success-100 text-success-700' :
                booking.status === 'cancelled' ? 'bg-error-100 text-error-700' :
                'bg-warning-100 text-warning-700'
              }`}>{statusLabel}</span>
            </div>
          </div>

          {/* Booking details table */}
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="border-b-2 border-secondary-200">
                <th className="text-left py-2 font-semibold text-secondary-700">{it.description}</th>
                <th className="text-center py-2 font-semibold text-secondary-700">{it.checkIn}</th>
                <th className="text-center py-2 font-semibold text-secondary-700">{it.checkOut}</th>
                <th className="text-center py-2 font-semibold text-secondary-700">{it.nights}</th>
                <th className="text-right py-2 font-semibold text-secondary-700">{it.unitPrice}</th>
                <th className="text-right py-2 font-semibold text-secondary-700">{it.amount}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-secondary-100">
                <td className="py-3 text-secondary-900 font-medium">{booking.room_name}</td>
                <td className="py-3 text-center text-secondary-600">{formatDate(booking.check_in)}</td>
                <td className="py-3 text-center text-secondary-600">{formatDate(booking.check_out)}</td>
                <td className="py-3 text-center text-secondary-600">{nights}</td>
                <td className="py-3 text-right text-secondary-600">{formatPrice(unitPrice)}{it.perNight}</td>
                <td className="py-3 text-right font-semibold text-secondary-900">{formatPrice(booking.total_price)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-secondary-600">
                <span>{it.subtotal}</span>
                <span>{formatPrice(booking.total_price)}</span>
              </div>
              <div className="flex justify-between text-sm text-secondary-600">
                <span>{it.guests}</span>
                <span>{booking.guests}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-primary-600">
                <span className="font-display font-bold text-lg text-primary-700">{it.total}</span>
                <span className="font-display font-bold text-lg text-primary-700">{formatPrice(booking.total_price)} VND</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-secondary-100">
            <p className="text-sm text-secondary-500 italic">{it.thankYou}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- User Manager ---------- */

const roleConfig: Record<string, { color: string; bg: string; icon: typeof Shield; label_vi: string; label_en: string; label_kr: string }> = {
  admin: { color: 'text-accent-700 dark:text-accent-300', bg: 'bg-accent-100 dark:bg-accent-900/40', icon: Shield, label_vi: 'Quản trị viên', label_en: 'Admin', label_kr: '관리자' },
  staff: { color: 'text-primary-700 dark:text-primary-300', bg: 'bg-primary-100 dark:bg-primary-900/40', icon: UserCog, label_vi: 'Nhân viên', label_en: 'Staff', label_kr: '직원' },
  guest: { color: 'text-secondary-600 dark:text-secondary-300', bg: 'bg-secondary-100 dark:bg-secondary-700', icon: Users, label_vi: 'Khách', label_en: 'Guest', label_kr: '게스트' },
};

function callUserManagement(action: string, data: Record<string, unknown>) {
  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-management`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ action, ...data }),
  }).then(async (r) => {
    const json = await r.json();
    if (!r.ok) throw new Error(json.error || 'Request failed');
    return json;
  });
}

function UserManager({ profiles, allProfiles, onReload, tr, lang, editingUser, setEditingUser, showAddStaff, setShowAddStaff, currentUserId, formatDate }: {
  profiles: ProfileRow[];
  allProfiles: ProfileRow[];
  onReload: () => void;
  tr: typeof adminTr.vi;
  lang: Language;
  editingUser: ProfileRow | null;
  setEditingUser: (u: ProfileRow | null) => void;
  showAddStaff: boolean;
  setShowAddStaff: (v: boolean) => void;
  currentUserId: string;
  formatDate: (d: string) => string;
}) {
  const [resetTarget, setResetTarget] = useState<ProfileRow | null>(null);
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const roleLabel = (role: string | null | undefined) => {
    const rc = roleConfig[role ?? 'guest'] ?? roleConfig.guest;
    return lang === 'vi' ? rc.label_vi : lang === 'kr' ? rc.label_kr : rc.label_en;
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await callUserManagement('update_role', { userId, role });
      onReload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await callUserManagement('toggle_active', { userId, isActive: !isActive });
      onReload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetStatus('sending');
    try {
      await callUserManagement('reset_password', { email: resetTarget.email });
      setResetStatus('sent');
    } catch (err) {
      console.error(err);
      setResetStatus('error');
    }
  };

  if (showAddStaff) {
    return (
      <AddStaffForm
        onSave={async (data) => {
          try {
            const { data: result, error } = await supabase.auth.admin.createUser({
              email: data.email,
              password: data.password,
              email_confirm: true,
              user_metadata: { full_name: data.fullName },
            });
            if (error) throw error;
            await supabase.from('profiles').upsert({
              id: result.user.id,
              email: data.email,
              full_name: data.fullName,
              phone: data.phone || null,
              role: data.role,
              is_admin: data.role === 'admin',
              is_active: true,
            });
            setShowAddStaff(false);
            onReload();
          } catch (err) {
            console.error(err);
          }
        }}
        onCancel={() => setShowAddStaff(false)}
        tr={tr}
        lang={lang}
      />
    );
  }

  if (editingUser) {
    return (
      <UserEditModal
        user={editingUser}
        onSave={async (data) => {
          try {
            await callUserManagement('update_profile', { userId: editingUser.id, ...data });
            setEditingUser(null);
            onReload();
          } catch (err) {
            console.error(err);
          }
        }}
        onCancel={() => setEditingUser(null)}
        tr={tr}
        lang={lang}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200/70 dark:border-secondary-700/80 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-secondary-400" />
            <span className="text-xs text-secondary-500 dark:text-secondary-400">{tr.umTotalUsers}</span>
          </div>
          <div className="text-xl font-display font-bold text-secondary-900 dark:text-white">{allProfiles.length}</div>
        </div>
        <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200/70 dark:border-secondary-700/80 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <UserCog className="w-4 h-4 text-primary-400" />
            <span className="text-xs text-secondary-500 dark:text-secondary-400">{tr.umStaffCount}</span>
          </div>
          <div className="text-xl font-display font-bold text-secondary-900 dark:text-white">{allProfiles.filter((p) => p.role === 'staff' || p.role === 'admin').length}</div>
        </div>
        <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200/70 dark:border-secondary-700/80 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Ban className="w-4 h-4 text-error-400" />
            <span className="text-xs text-secondary-500 dark:text-secondary-400">{tr.umInactiveCount}</span>
          </div>
          <div className="text-xl font-display font-bold text-secondary-900 dark:text-white">{allProfiles.filter((p) => p.is_active === false).length}</div>
        </div>
      </div>

      {/* Add Staff button */}
      <button
        onClick={() => setShowAddStaff(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-secondary-300 dark:border-secondary-600 text-secondary-500 dark:text-secondary-400 hover:border-primary-400 hover:text-primary-500 dark:hover:border-primary-500 dark:hover:text-primary-400 transition-all text-sm font-semibold"
      >
        <UserPlus className="w-4 h-4" /> {tr.umAddStaff}
      </button>

      {/* User list */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm overflow-hidden">
        {profiles.length === 0 ? (
          <div className="p-8 text-center text-secondary-400 dark:text-secondary-500 text-sm">{tr.noUsers}</div>
        ) : (
          <div className="divide-y divide-secondary-100 dark:divide-secondary-700/50">
            {profiles.map((p) => {
              const role = p.role ?? (p.is_admin ? 'admin' : 'guest');
              const rc = roleConfig[role] ?? roleConfig.guest;
              const RIcon = rc.icon;
              const isActive = p.is_active !== false;
              const isSelf = p.id === currentUserId;
              return (
                <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/30 transition-colors">
                  <div className="relative shrink-0">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold overflow-hidden">
                      {p.avatar_url ? <img src={p.avatar_url} alt={p.full_name ?? 'Avatar'} className="w-full h-full object-cover" /> : (p.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-secondary-800 ${isActive ? 'bg-success-500' : 'bg-secondary-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-secondary-900 dark:text-white text-sm truncate">{p.full_name ?? tr.unnamed}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${rc.bg} ${rc.color} shrink-0`}>
                        <RIcon className="w-3 h-3" /> {roleLabel(role)}
                      </span>
                      {isSelf && <span className="text-xs text-secondary-400 dark:text-secondary-500">(You)</span>}
                    </div>
                    <div className="text-xs text-secondary-400 dark:text-secondary-500 truncate">{p.email}</div>
                    {p.phone && <div className="text-xs text-secondary-400 dark:text-secondary-500">{p.phone}</div>}
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-xs text-secondary-400 dark:text-secondary-500">{tr.joined}</div>
                    <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300">{formatDate(p.created_at)}</div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Edit */}
                    <button onClick={() => setEditingUser(p)} className="p-2 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-secondary-700 transition-colors" title={tr.umEdit}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    {/* Reset password */}
                    <button
                      onClick={() => { setResetTarget(p); setResetStatus('idle'); }}
                      className="p-2 rounded-lg text-warning-500 hover:bg-warning-50 dark:hover:bg-secondary-700 transition-colors"
                      title={tr.umResetPassword}
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    {/* Activate/Deactivate */}
                    {!isSelf && (
                      <button
                        onClick={() => handleToggleActive(p.id, isActive)}
                        className={`p-2 rounded-lg transition-colors ${isActive ? 'text-error-500 hover:bg-error-50 dark:hover:bg-secondary-700' : 'text-success-500 hover:bg-success-50 dark:hover:bg-secondary-700'}`}
                        title={isActive ? tr.umDeactivate : tr.umActivate}
                      >
                        {isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    )}
                    {/* Role dropdown */}
                    {!isSelf && (
                      <select
                        value={role}
                        onChange={(e) => handleRoleChange(p.id, e.target.value)}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 border-0 focus:ring-2 focus:ring-primary-400 cursor-pointer"
                      >
                        <option value="admin">{lang === 'vi' ? 'Quản trị' : lang === 'kr' ? '관리자' : 'Admin'}</option>
                        <option value="staff">{lang === 'vi' ? 'Nhân viên' : lang === 'kr' ? '직원' : 'Staff'}</option>
                        <option value="guest">{lang === 'vi' ? 'Khách' : lang === 'kr' ? '게스트' : 'Guest'}</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Password Reset Confirmation Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-[110] bg-secondary-900/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setResetTarget(null)}>
          <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white">{tr.umResetPassword}</h3>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">{resetTarget.email}</p>
              </div>
            </div>
            {resetStatus === 'sent' ? (
              <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-success-600 dark:text-success-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">{tr.umResetSent}</span>
                </div>
              </div>
            ) : resetStatus === 'error' ? (
              <div className="bg-error-50 dark:bg-error-900/20 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-error-600 dark:text-error-400">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">{tr.umResetError}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-secondary-600 dark:text-secondary-300 mb-4">{tr.umResetConfirm}</p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setResetTarget(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">
                {resetStatus === 'sent' ? tr.umClose : tr.cancel}
              </button>
              {resetStatus !== 'sent' && (
                <button
                  onClick={handleResetPassword}
                  disabled={resetStatus === 'sending'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-warning-500 text-white text-sm font-semibold hover:bg-warning-600 transition-colors disabled:opacity-60"
                >
                  {resetStatus === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {tr.umSendReset}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserEditModal({ user, onSave, onCancel, tr, lang }: {
  user: ProfileRow;
  onSave: (data: { fullName: string; phone: string; email: string }) => void;
  onCancel: () => void;
  tr: typeof adminTr.vi;
  lang: Language;
}) {
  const [fullName, setFullName] = useState(user.full_name ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    onSave({ fullName, phone, email });
  };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-secondary-100 dark:border-secondary-700/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
            <UserCog className="w-5 h-5" />
          </div>
          <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white">{tr.umEditUser}</h3>
        </div>
        <button onClick={onCancel} className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div>
        <label className={labelClass}>{tr.umFullName}</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={lang === 'vi' ? 'Nguyễn Văn A' : lang === 'kr' ? '홍길동' : 'John Doe'} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>{tr.umEmail}</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className={`${inputClass} pl-9`} />
        </div>
      </div>

      <div>
        <label className={labelClass}>{tr.umPhone}</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901 234 567" className={`${inputClass} pl-9`} />
        </div>
      </div>

      <div className="bg-secondary-50 dark:bg-secondary-700/30 rounded-xl p-3 text-xs text-secondary-500 dark:text-secondary-400">
        {tr.umRoleInfo}: <span className="font-semibold">{user.role ?? (user.is_admin ? 'admin' : 'guest')}</span>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-secondary-100 dark:border-secondary-700/50">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">{tr.cancel}</button>
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {tr.save}
        </button>
      </div>
    </div>
  );
}

function AddStaffForm({ onSave, onCancel, tr, lang }: {
  onSave: (data: { email: string; password: string; fullName: string; phone: string; role: string }) => void;
  onCancel: () => void;
  tr: typeof adminTr.vi;
  lang: Language;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('staff');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    onSave({ email, password, fullName, phone, role });
  };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-secondary-100 dark:border-secondary-700/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white">{tr.umAddStaff}</h3>
        </div>
        <button onClick={onCancel} className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div>
        <label className={labelClass}>{tr.umFullName}</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={lang === 'vi' ? 'Nguyễn Văn A' : lang === 'kr' ? '홍길동' : 'John Doe'} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>{tr.umEmail}</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className={`${inputClass} pl-9`} />
        </div>
      </div>

      <div>
        <label className={labelClass}>{tr.umPhone}</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901 234 567" className={`${inputClass} pl-9`} />
        </div>
      </div>

      <div>
        <label className={labelClass}>{tr.umPassword}</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${inputClass} pr-10`} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className={labelClass}>{tr.umRole}</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
          <option value="staff">{lang === 'vi' ? 'Nhân viên' : lang === 'kr' ? '직원' : 'Staff'}</option>
          <option value="admin">{lang === 'vi' ? 'Quản trị viên' : lang === 'kr' ? '관리자' : 'Admin'}</option>
          <option value="guest">{lang === 'vi' ? 'Khách' : lang === 'kr' ? '게스트' : 'Guest'}</option>
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-secondary-100 dark:border-secondary-700/50">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">{tr.cancel}</button>
        <button onClick={handleSave} disabled={saving || !email || !password} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {tr.umAddStaff}
        </button>
      </div>
    </div>
  );
}

function SearchBar({ searchQuery, setSearchQuery, placeholder }: { searchQuery: string; setSearchQuery: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-secondary-800 border border-secondary-200/70 dark:border-secondary-700/80 text-sm text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-400/50"
      />
    </div>
  );
}

/* ---------- Payment Methods Manager ---------- */

const paymentIcons = ['CreditCard', 'Wallet', 'Landmark', 'Smartphone', 'Banknote', 'QrCode', 'Building2', 'Coins'];
const paymentTypes = ['cash', 'bank_transfer', 'credit_card', 'e_wallet', 'qr_code', 'other'];

function PaymentMethodManager({ methods, onReload, tr, lang, editingMethod, setEditingMethod, creatingMethod, setCreatingMethod }: {
  methods: PaymentMethodRow[];
  onReload: () => void;
  tr: typeof adminTr.vi;
  lang: Language;
  editingMethod: PaymentMethodRow | null;
  setEditingMethod: (m: PaymentMethodRow | null) => void;
  creatingMethod: boolean;
  setCreatingMethod: (v: boolean) => void;
}) {
  const sorted = [...methods].sort((a, b) => a.sort_order - b.sort_order);

  const togglePublished = async (id: string, current: boolean) => {
    await supabase.from('payment_methods').update({ is_published: !current }).eq('id', id);
    onReload();
  };

  const deleteMethod = async (id: string) => {
    await supabase.from('payment_methods').delete().eq('id', id);
    onReload();
  };

  const moveMethod = async (method: PaymentMethodRow, dir: 'up' | 'down') => {
    const idx = sorted.findIndex((m) => m.id === method.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      supabase.from('payment_methods').update({ sort_order: other.sort_order }).eq('id', method.id),
      supabase.from('payment_methods').update({ sort_order: method.sort_order }).eq('id', other.id),
    ]);
    onReload();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-secondary-500 dark:text-secondary-400">{tr.paymentMethodsHint}</p>

      {creatingMethod ? (
        <PaymentMethodEditor
          onSave={async (data) => {
            const { error } = await supabase.from('payment_methods').insert({ ...data, sort_order: sorted.length });
            if (error) { console.error(error); return; }
            setCreatingMethod(false);
            onReload();
          }}
          onCancel={() => setCreatingMethod(false)}
          tr={tr}
          lang={lang}
        />
      ) : editingMethod ? (
        <PaymentMethodEditor
          initial={editingMethod}
          onSave={async (data) => {
            const { error } = await supabase.from('payment_methods').update(data).eq('id', editingMethod.id);
            if (error) { console.error(error); return; }
            setEditingMethod(null);
            onReload();
          }}
          onCancel={() => setEditingMethod(null)}
          tr={tr}
          lang={lang}
        />
      ) : (
        <>
          <button
            onClick={() => setCreatingMethod(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-secondary-300 dark:border-secondary-600 text-secondary-500 dark:text-secondary-400 hover:border-primary-400 hover:text-primary-500 dark:hover:border-primary-500 dark:hover:text-primary-400 transition-all text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> {tr.addPaymentMethod}
          </button>

          {sorted.map((method, idx) => {
            const label = method.label?.[lang] || method.label?.vi || method.label?.en || '';
            const desc = method.description?.[lang] || method.description?.vi || method.description?.en || '';
            return (
              <div key={method.id} className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-secondary-900 dark:text-white text-sm">{label || tr.untitled}</div>
                    {desc && <div className="text-xs text-secondary-400 dark:text-secondary-500 mt-0.5">{desc}</div>}
                    <div className="text-xs text-secondary-400 dark:text-secondary-500 mt-0.5">{method.type}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => moveMethod(method, 'up')} disabled={idx === 0} className="p-1.5 rounded-lg text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 disabled:opacity-30 transition-colors">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveMethod(method, 'down')} disabled={idx === sorted.length - 1} className="p-1.5 rounded-lg text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 disabled:opacity-30 transition-colors">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => togglePublished(method.id, method.is_published)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${method.is_published ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400' : 'bg-secondary-100 text-secondary-500 dark:bg-secondary-700 dark:text-secondary-400'}`}>
                      {method.is_published ? tr.published : tr.draft}
                    </button>
                    <button onClick={() => setEditingMethod(method)} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-secondary-700 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteMethod(method.id)} className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-secondary-700 transition-colors">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {sorted.length === 0 && (
            <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-dashed border-secondary-300 dark:border-secondary-600 p-8 text-center text-sm text-secondary-400 dark:text-secondary-500">
              {tr.noPaymentMethods}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PaymentMethodEditor({ initial, onSave, onCancel, tr, lang }: {
  initial?: PaymentMethodRow;
  onSave: (data: { label: Record<string, string>; description: Record<string, string>; icon: string; type: string; is_published: boolean; bank_bin?: string | null; bank_account_number?: string | null; bank_account_name?: string | null; amount_fixed?: boolean | null }) => void;
  onCancel: () => void;
  tr: typeof adminTr.vi;
  lang: Language;
}) {
  const [label, setLabel] = useState<Record<string, string>>(initial?.label ?? { vi: '', en: '', kr: '' });
  const [description, setDescription] = useState<Record<string, string>>(initial?.description ?? { vi: '', en: '', kr: '' });
  const [icon, setIcon] = useState(initial?.icon ?? 'CreditCard');
  const [type, setType] = useState(initial?.type ?? 'other');
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true);
  const [activeLang, setActiveLang] = useState<Language>(lang);
  const [bankBin, setBankBin] = useState(initial?.bank_bin ?? '');
  const [bankAccountNumber, setBankAccountNumber] = useState(initial?.bank_account_number ?? '');
  const [bankAccountName, setBankAccountName] = useState(initial?.bank_account_name ?? '');
  const [amountFixed, setAmountFixed] = useState(initial?.amount_fixed ?? false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  const isBankTransfer = type === 'bank_transfer' || type === 'qr_code';
  const showBankFields = isBankTransfer;

  useEffect(() => {
    if (!showBankFields || !bankBin || !bankAccountNumber) { setQrPreview(null); return; }
    let cancelled = false;
    generateQRDataURL({ bank_bin: bankBin, bank_account_number: bankAccountNumber, bank_account_name: bankAccountName, amount: amountFixed ? 1000000 : undefined, description: 'Thanh toan dat phong' }).then((url) => {
      if (!cancelled) setQrPreview(url);
    });
    return () => { cancelled = true; };
  }, [showBankFields, bankBin, bankAccountNumber, bankAccountName, amountFixed]);

  const handleSave = () => {
    onSave({
      label, description, icon, type, is_published: isPublished,
      bank_bin: showBankFields ? bankBin || null : null,
      bank_account_number: showBankFields ? bankAccountNumber || null : null,
      bank_account_name: showBankFields ? bankAccountName || null : null,
      amount_fixed: showBankFields ? amountFixed : false,
    });
  };

  const bankName = bankBin ? getBankName(bankBin) : '';

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-secondary-100 dark:border-secondary-700/50">
        <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white">{initial ? tr.editPaymentMethod : tr.addPaymentMethod}</h3>
        <button onClick={onCancel} className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-1">
        {allLangs.map((l) => (
          <button key={l} onClick={() => setActiveLang(l)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeLang === l ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300'}`}>
            {l === 'vi' ? 'Tiếng Việt' : l === 'kr' ? '한국어' : 'English'}
          </button>
        ))}
      </div>

      <div>
        <label className={labelClass}>{tr.pmLabel} ({activeLang})</label>
        <input type="text" value={label[activeLang] ?? ''} onChange={(e) => setLabel({ ...label, [activeLang]: e.target.value })} placeholder={activeLang === 'vi' ? 'Ví dụ: Chuyển khoản ngân hàng' : activeLang === 'kr' ? '예: 은행 송금' : 'e.g. Bank Transfer'} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>{tr.pmDescription} ({activeLang})</label>
        <textarea value={description[activeLang] ?? ''} onChange={(e) => setDescription({ ...description, [activeLang]: e.target.value })} rows={3} placeholder={activeLang === 'vi' ? 'Ví dụ: Vui lòng chuyển khoản đến STK 123456789, Vietcombank' : activeLang === 'kr' ? '예: 계좌번호 123456789, Vietcombank로 송금해주세요' : 'e.g. Please transfer to account 123456789, Vietcombank'} className={inputClass} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{tr.pmType}</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {paymentTypes.map((pt) => (<option key={pt} value={pt}>{pt}</option>))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{tr.pmIcon}</label>
          <select value={icon} onChange={(e) => setIcon(e.target.value)} className={inputClass}>
            {paymentIcons.map((ic) => (<option key={ic} value={ic}>{ic}</option>))}
          </select>
        </div>
      </div>

      {/* Bank Account Fields with Live QR Preview */}
      {showBankFields && (
        <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start bg-primary-50/50 dark:bg-secondary-700/30 rounded-xl p-4 border border-primary-100 dark:border-secondary-700/50">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">{tr.bankAccountSection}</p>
            <div>
              <label className={labelClass}>{tr.bankName}</label>
              <select value={bankBin} onChange={(e) => setBankBin(e.target.value)} className={inputClass}>
                <option value="">{lang === 'vi' ? '-- Chọn ngân hàng --' : lang === 'kr' ? '-- 은행 선택 --' : '-- Select bank --'}</option>
                {vietnameseBanks.map((b) => (<option key={b.bin} value={b.bin}>{b.name}</option>))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{tr.accountNumber}</label>
              <input type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0123456789" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{tr.accountHolder}</label>
              <input type="text" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder={lang === 'vi' ? 'NGUYEN VAN A' : lang === 'kr' ? '홍길동' : 'JOHN DOE'} className={inputClass} />
            </div>
            <label className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-300 cursor-pointer">
              <input type="checkbox" checked={amountFixed} onChange={(e) => setAmountFixed(e.target.checked)} className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-400" />
              {tr.fixedAmount}
            </label>
          </div>

          {/* Live QR Preview */}
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white rounded-xl p-3 shadow-sm border border-secondary-200 dark:border-secondary-600 w-[180px] h-[180px] flex items-center justify-center">
              {qrPreview ? (
                <img src={qrPreview} alt="QR Preview" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-xs text-secondary-400 dark:text-secondary-500">
                  <QrCode className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  {tr.qrPreviewHint}
                </div>
              )}
            </div>
            {bankName && bankAccountNumber && (
              <div className="text-center text-xs">
                <div className="font-semibold text-secondary-700 dark:text-secondary-200">{bankName}</div>
                <div className="text-secondary-500 dark:text-secondary-400">{bankAccountNumber}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => setIsPublished(!isPublished)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isPublished ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400' : 'bg-secondary-100 text-secondary-500 dark:bg-secondary-700 dark:text-secondary-400'}`}>
          {isPublished ? tr.published : tr.draft}
        </button>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-secondary-100 dark:border-secondary-700/50">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">{tr.cancel}</button>
        <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">{tr.save}</button>
      </div>
    </div>
  );
}

/* ---------- Content Manager ---------- */

type ContentManagerProps = {
  content: ContentRow[];
  onReload: () => void;
  tr: typeof adminTr.vi;
  lang: Language;
  onTogglePublished: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onMove: (row: ContentRow, dir: 'up' | 'down') => void;
};

const contentCategories = [
  { key: 'room', label_vi: 'Phòng', label_en: 'Rooms', label_kr: '객실' },
  { key: 'amenity', label_vi: 'Tiện nghi', label_en: 'Amenities', label_kr: '편의시설' },
  { key: 'testimonial', label_vi: 'Đánh giá', label_en: 'Testimonials', label_kr: '리뷰' },
  { key: 'gallery', label_vi: 'Thư viện ảnh', label_en: 'Gallery', label_kr: '갤러리' },
  { key: 'stat', label_vi: 'Thống kê', label_en: 'Stats', label_kr: '통계' },
  { key: 'section_text', label_vi: 'Văn bản trang', label_en: 'Section Texts', label_kr: '섹션 텍스트' },
  { key: 'page', label_vi: 'Trang tùy chỉnh', label_en: 'Custom Pages', label_kr: '커스텀 페이지' },
  { key: 'general', label_vi: 'Chung', label_en: 'General', label_kr: '일반' },
];

function ContentManager({ content, onReload, tr, lang, onTogglePublished, onDelete, onMove }: ContentManagerProps) {
  const [activeCat, setActiveCat] = useState('room');
  const [editing, setEditing] = useState<ContentRow | null>(null);
  const [creating, setCreating] = useState(false);

  const catContent = content.filter((c) => c.category === activeCat).sort((a, b) => a.sort_order - b.sort_order);
  const catLabel = contentCategories.find((c) => c.key === activeCat);
  const catLabelStr = lang === 'vi' ? catLabel?.label_vi ?? activeCat : lang === 'kr' ? catLabel?.label_kr ?? activeCat : catLabel?.label_en ?? activeCat;

  const seedAll = async () => {
    const inserts: { category: string; key: string; content: Record<string, unknown>; is_published: boolean; sort_order: number }[] = [];

    for (let i = 0; i < defaultRooms.length; i++) {
      const r = defaultRooms[i];
      if (!content.some((c) => c.category === 'room' && c.key === r.id)) {
        inserts.push({ category: 'room', key: r.id, content: { name: r.name, description: r.description, price: r.price, size: r.size, capacity: r.capacity, beds: r.beds, image: r.image, features: r.features }, is_published: true, sort_order: i });
      }
    }
    for (let i = 0; i < defaultAmenities.length; i++) {
      const a = defaultAmenities[i];
      if (!content.some((c) => c.category === 'amenity' && c.key === a.id)) {
        inserts.push({ category: 'amenity', key: a.id, content: { name: a.name, description: a.description, image: a.image, icon: a.icon }, is_published: true, sort_order: i });
      }
    }
    for (let i = 0; i < defaultTestimonials.length; i++) {
      const t = defaultTestimonials[i];
      if (!content.some((c) => c.category === 'testimonial' && c.key === t.id)) {
        inserts.push({ category: 'testimonial', key: t.id, content: { name: t.name, avatar: t.avatar, location: t.location, rating: t.rating, text: t.text }, is_published: true, sort_order: i });
      }
    }
    for (let i = 0; i < defaultGallery.length; i++) {
      const g = defaultGallery[i];
      const gKey = `gallery-${i}`;
      if (!content.some((c) => c.category === 'gallery' && c.key === gKey)) {
        inserts.push({ category: 'gallery', key: gKey, content: { url: g.url, caption: g.caption, category: g.category }, is_published: true, sort_order: i });
      }
    }
    for (let i = 0; i < defaultStats.length; i++) {
      const s = defaultStats[i];
      const sKey = `stat-${i}`;
      if (!content.some((c) => c.category === 'stat' && c.key === sKey)) {
        inserts.push({ category: 'stat', key: sKey, content: { label: s.label, value: s.value }, is_published: true, sort_order: i });
      }
    }

    if (inserts.length > 0) {
      await supabase.from('site_content').insert(inserts);
    }
    onReload();
  };

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {contentCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => { setActiveCat(cat.key); setEditing(null); setCreating(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeCat === cat.key ? 'bg-primary-600 text-white shadow-md' : 'bg-white dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 border border-secondary-200/70 dark:border-secondary-700/80 hover:bg-secondary-100 dark:hover:bg-secondary-700'}`}
          >
            {lang === 'vi' ? cat.label_vi : lang === 'kr' ? cat.label_kr : cat.label_en}
            <span className="ml-1.5 text-xs opacity-70">({content.filter((c) => c.category === cat.key).length})</span>
          </button>
        ))}
      </div>

      {/* Seed button when no content in current category */}
      {catContent.length === 0 && !creating && (
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-dashed border-secondary-300 dark:border-secondary-600 p-6 text-center">
          <FileText className="w-10 h-10 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-4">{tr.seedAllHint}</p>
          <button onClick={seedAll} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" /> {tr.seedAll}
          </button>
        </div>
      )}

      {/* Create new */}
      {creating && (
        <ContentEditor
          category={activeCat}
          sortOrder={catContent.length}
          onSave={async (key, contentData, isPublished) => {
            const { error } = await supabase.from('site_content').insert({
              category: activeCat,
              key,
              content: contentData,
              is_published: isPublished,
              sort_order: catContent.length,
            });
            if (error) { console.error(error); return; }
            setCreating(false);
            onReload();
          }}
          onCancel={() => setCreating(false)}
          tr={tr}
          lang={lang}
        />
      )}

      {/* Content list */}
      {!creating && (
        <div className="space-y-3">
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-secondary-300 dark:border-secondary-600 text-secondary-500 dark:text-secondary-400 hover:border-primary-400 hover:text-primary-500 dark:hover:border-primary-500 dark:hover:text-primary-400 transition-all text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> {tr.addNew}
          </button>

          {catContent.map((row, idx) => (
            <div key={row.id} className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm overflow-hidden">
              {editing?.id === row.id ? (
                <ContentEditor
                  category={row.category}
                  sortOrder={row.sort_order}
                  initialKey={row.key}
                  initialContent={row.content}
                  initialPublished={row.is_published}
                  onSave={async (key, contentData, isPublished) => {
                    const { error } = await supabase.from('site_content').update({
                      key,
                      content: contentData,
                      is_published: isPublished,
                      updated_at: new Date().toISOString(),
                    }).eq('id', row.id);
                    if (error) { console.error(error); return; }
                    setEditing(null);
                    onReload();
                  }}
                  onCancel={() => setEditing(null)}
                  tr={tr}
                  lang={lang}
                />
              ) : (
                <ContentPreviewCard
                  row={row}
                  tr={tr}
                  lang={lang}
                  idx={idx}
                  total={catContent.length}
                  onMove={onMove}
                  onTogglePublished={onTogglePublished}
                  onEdit={() => setEditing(row)}
                  onDelete={onDelete}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ContentEditorProps = {
  category: string;
  sortOrder: number;
  initialKey?: string;
  initialContent?: Record<string, unknown>;
  initialPublished?: boolean;
  onSave: (key: string, content: Record<string, unknown>, isPublished: boolean) => void;
  onCancel: () => void;
  tr: typeof adminTr.vi;
  lang: Language;
};

type FieldType = 'text' | 'number' | 'auto-text' | 'rich-text' | 'image' | 'auto-list' | 'rating' | 'select';

type FieldDef = {
  key: string;
  type: FieldType;
  label: string;
  options?: string[];
};

const fieldSchemas: Record<string, FieldDef[]> = {
  room: [
    { key: 'name', type: 'auto-text', label: 'fldName' },
    { key: 'price', type: 'number', label: 'fldPrice' },
    { key: 'size', type: 'text', label: 'fldSize' },
    { key: 'capacity', type: 'number', label: 'fldCapacity' },
    { key: 'beds', type: 'auto-text', label: 'fldBeds' },
    { key: 'image', type: 'image', label: 'fldImage' },
    { key: 'description', type: 'rich-text', label: 'fldDescription' },
    { key: 'features', type: 'auto-list', label: 'fldFeatures' },
  ],
  amenity: [
    { key: 'name', type: 'auto-text', label: 'fldName' },
    { key: 'icon', type: 'select', label: 'fldIcon', options: ['Waves', 'UtensilsCrossed', 'Flower2', 'Dumbbell', 'Briefcase', 'Sofa', 'Wifi', 'Car', 'Coffee', 'Wine', 'Droplets', 'Sun'] },
    { key: 'image', type: 'image', label: 'fldImage' },
    { key: 'description', type: 'rich-text', label: 'fldDescription' },
  ],
  testimonial: [
    { key: 'name', type: 'text', label: 'fldGuestName' },
    { key: 'avatar', type: 'image', label: 'fldAvatar' },
    { key: 'location', type: 'auto-text', label: 'fldLocation' },
    { key: 'rating', type: 'rating', label: 'fldRating' },
    { key: 'text', type: 'rich-text', label: 'fldReview' },
  ],
  gallery: [
    { key: 'url', type: 'image', label: 'fldImage' },
    { key: 'caption', type: 'auto-text', label: 'fldCaption' },
    { key: 'category', type: 'select', label: 'fldCategory', options: ['rooms', 'amenities', 'dining'] },
  ],
  stat: [
    { key: 'label', type: 'auto-text', label: 'fldStatLabel' },
    { key: 'value', type: 'text', label: 'fldStatValue' },
  ],
  section_text: [
    { key: 'title', type: 'auto-text', label: 'fldName' },
  ],
  page: [
    { key: 'title', type: 'auto-text', label: 'fldPageTitle' },
    { key: 'body', type: 'rich-text', label: 'fldPageBody' },
  ],
  general: [
    { key: 'title', type: 'auto-text', label: 'fldName' },
    { key: 'value', type: 'rich-text', label: 'fldDescription' },
  ],
};

const allLangs: Language[] = ['vi', 'en', 'kr'];

/* Auto-translate helper: calls edge function, fills all languages */
async function autoTranslate(text: string): Promise<Record<string, string> | null> {
  if (!text.trim()) return null;
  try {
    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: { text, target_langs: allLangs },
    });
    if (error || !data?.translations) return null;
    return data.translations as Record<string, string>;
  } catch {
    return null;
  }
}

/* Strip HTML tags for preview display */
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-secondary-50 dark:bg-secondary-700/50 border border-secondary-200/70 dark:border-secondary-700/80 text-sm text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400/50 transition-all';
const labelClass = 'block text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wide mb-1.5';

function ContentEditor({ category, initialKey, initialContent, initialPublished, onSave, onCancel, tr }: ContentEditorProps) {
  const [key, setKey] = useState(initialKey ?? '');
  const [data, setData] = useState<Record<string, unknown>>(initialContent ?? {});
  const [isPublished, setIsPublished] = useState(initialPublished ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imageSizes, setImageSizes] = useState<Record<string, string>>({});

  const fields = fieldSchemas[category] ?? fieldSchemas.general;
  const imageFields = fields.filter((f) => f.type === 'image');

  const setField = (fieldKey: string, value: unknown) => {
    setData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const setImageSize = (fieldKey: string, size: string) => {
    setImageSizes((prev) => ({ ...prev, [fieldKey]: size }));
    setData((prev) => ({ ...prev, [`${fieldKey}_size`]: size }));
  };

  /* Get the "source" text from an auto-translated field (first non-empty lang) */
  const getSourceText = (fieldKey: string): string => {
    const raw = data[fieldKey];
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, string>;
      return obj.vi || obj.en || obj.kr || '';
    }
    return '';
  };

  /* Set an auto-translated field from a single source text, auto-translating to all langs */
  const setAutoText = async (fieldKey: string, sourceText: string, isHtml: boolean) => {
    const plain = isHtml ? stripHtml(sourceText) : sourceText;
    if (!plain.trim()) {
      setField(fieldKey, { vi: '', en: '', kr: '' });
      return;
    }
    // Optimistic: set source lang immediately
    const detected = detectSourceLang(plain);
    setField(fieldKey, { vi: '', en: '', kr: '', [detected]: sourceText });
    // Auto-translate
    const translations = await autoTranslate(plain);
    if (translations) {
      // For rich text, preserve HTML structure by replacing text content per language
      if (isHtml) {
        const result: Record<string, string> = {};
        for (const lang of allLangs) {
          result[lang] = translations[lang] ?? sourceText;
        }
        setField(fieldKey, result);
      } else {
        setField(fieldKey, translations);
      }
    }
  };

  const handleSave = (publish?: boolean) => {
    if (!key.trim()) { setError(tr.keyRequired); return; }
    const finalPublished = publish !== undefined ? publish : isPublished;
    setIsPublished(finalPublished);
    setSaving(true);
    onSave(key.trim(), data, finalPublished);
    setSaving(false);
  };

  const previewTitle = getSourceText('name') || getSourceText('title') || getSourceText('caption') || key || tr.untitled;
  const previewDescRaw = getSourceText('description') || getSourceText('text') || getSourceText('value') || '';
  const previewDesc = stripHtml(previewDescRaw);
  const previewImage = String(data.image ?? data.url ?? data.avatar ?? '');
  const previewPrice = data.price ? formatPrice(Number(data.price)) : '';
  const previewRating = data.rating ? Number(data.rating) : 0;
  const featuresRaw = data.features;
  const previewFeatures: string[] = featuresRaw && typeof featuresRaw === 'object'
    ? ((featuresRaw as Record<string, unknown>).vi ?? (featuresRaw as Record<string, unknown>).en ?? []) as string[]
    : [];
  const previewLocation = getSourceText('location');

  return (
    <div className="p-5">
      {/* Editor header bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-secondary-100 dark:border-secondary-700/50">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            <Tag className="w-3 h-3" /> {category}
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isPublished ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400' : 'bg-secondary-100 text-secondary-500 dark:bg-secondary-700 dark:text-secondary-400'}`}>
            {isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {isPublished ? tr.published : tr.draft}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
            <Languages className="w-3 h-3" /> {tr.autoTranslate}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${showPreview ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'}`}
        >
          <Monitor className="w-3.5 h-3.5" /> {tr.livePreview}
        </button>
      </div>

      {/* 2-column layout: main content + sidebar */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* ===== LEFT: Main content (2/3) ===== */}
        <div className="lg:col-span-2 space-y-5">
          {/* Slug / key */}
          <div>
            <label className={labelClass}><Hash className="w-3 h-3 inline mr-1" />{tr.slug}</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. deluxe, pool, t1..."
              className={inputClass}
            />
          </div>

          {/* Dynamic fields */}
          {fields.map((field) => (
            <div key={field.key}>
              <label className={labelClass}>{tr[field.label] ?? field.label}</label>

              {field.type === 'text' && (
                <input type="text" value={String(data[field.key] ?? '')} onChange={(e) => setField(field.key, e.target.value)} className={inputClass} />
              )}

              {field.type === 'number' && (
                <input type="number" value={String(data[field.key] ?? '')} onChange={(e) => setField(field.key, Number(e.target.value) || 0)} className={inputClass} />
              )}

              {field.type === 'select' && (
                <select value={String(data[field.key] ?? field.options?.[0] ?? '')} onChange={(e) => setField(field.key, e.target.value)} className={inputClass}>
                  {field.options?.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              )}

              {field.type === 'rating' && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setField(field.key, n)} className={`p-1 rounded-lg transition-all ${n <= Number(data[field.key] ?? 0) ? 'text-warning-400' : 'text-secondary-300 dark:text-secondary-600'} hover:scale-110`}>
                      <Star className={`w-7 h-7 ${n <= Number(data[field.key] ?? 0) ? 'fill-warning-400' : ''}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-secondary-700 dark:text-secondary-300">{Number(data[field.key] ?? 0)}/5</span>
                </div>
              )}

              {field.type === 'auto-text' && (
                <AutoTextInput
                  value={getSourceText(field.key)}
                  onChange={(v) => setAutoText(field.key, v, false)}
                  tr={tr}
                />
              )}

              {field.type === 'rich-text' && (
                <RichTextEditor
                  value={getSourceText(field.key)}
                  onChange={(v) => setAutoText(field.key, v, true)}
                  tr={tr}
                />
              )}

              {field.type === 'auto-list' && (
                <AutoListEditor
                  items={previewFeatures}
                  onChange={async (items) => {
                    // Translate all items at once
                    const allText = items.join('\n');
                    const translations = await autoTranslate(allText);
                    if (translations) {
                      const result: Record<string, string[]> = {};
                      for (const lang of allLangs) {
                        result[lang] = (translations[lang] ?? allText).split('\n').filter(Boolean);
                      }
                      setField(field.key, result);
                    } else {
                      setField(field.key, { vi: items, en: items, kr: items });
                    }
                  }}
                  tr={tr}
                />
              )}
            </div>
          ))}
        </div>

        {/* ===== RIGHT: Sidebar (1/3) ===== */}
        <div className="space-y-4">
          {/* Publish box */}
          <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-secondary-50 dark:bg-secondary-700/40 border-b border-secondary-100 dark:border-secondary-700/50">
              <Save className="w-4 h-4 text-primary-500" />
              <span className="font-display text-sm font-bold text-secondary-900 dark:text-white">{tr.publishBox}</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary-50 dark:bg-secondary-700/40">
                <div className="flex items-center gap-2">
                  {isPublished ? <Eye className="w-4 h-4 text-success-500" /> : <EyeOff className="w-4 h-4 text-secondary-400" />}
                  <span className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">{isPublished ? tr.published : tr.draft}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isPublished ? 'bg-success-500' : 'bg-secondary-300 dark:bg-secondary-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isPublished ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {error && <div className="text-sm text-error-600 dark:text-error-400">{error}</div>}

              <div className="space-y-2">
                <button onClick={() => handleSave(true)} disabled={saving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm">
                  <Save className="w-4 h-4" /> {isPublished ? tr.save : tr.savePublish}
                </button>
                <button onClick={() => handleSave(false)} disabled={saving} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 text-sm font-semibold hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors disabled:opacity-50">
                  {tr.saveDraft}
                </button>
                <button onClick={onCancel} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-secondary-500 dark:text-secondary-400 text-sm font-semibold hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">
                  <X className="w-4 h-4" /> {tr.cancel}
                </button>
              </div>
            </div>
          </div>

          {/* Media / Featured Image box — WordPress style */}
          {imageFields.map((field) => (
            <MediaUploader
              key={field.key}
              label={tr[field.label] ?? field.label}
              value={String(data[field.key] ?? '')}
              onChange={(v) => setField(field.key, v)}
              sizeMode={imageSizes[field.key] ?? String(data[`${field.key}_size`] ?? 'original')}
              setSizeMode={(s) => setImageSize(field.key, s)}
              tr={tr}
            />
          ))}

          {/* Content settings box */}
          <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-secondary-50 dark:bg-secondary-700/40 border-b border-secondary-100 dark:border-secondary-700/50">
              <Settings className="w-4 h-4 text-secondary-500" />
              <span className="font-display text-sm font-bold text-secondary-900 dark:text-white">{tr.contentSettings}</span>
            </div>
            <div className="p-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-secondary-400 dark:text-secondary-500">{tr.category}</span>
                <span className="font-semibold text-secondary-700 dark:text-secondary-300 capitalize">{category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-400 dark:text-secondary-500">{tr.slug}</span>
                <span className="font-mono text-xs font-semibold text-secondary-700 dark:text-secondary-300 max-w-[120px] truncate">{key || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-400 dark:text-secondary-500">{tr.status}</span>
                <span className={`font-semibold ${isPublished ? 'text-success-600 dark:text-success-400' : 'text-secondary-500'}`}>{isPublished ? tr.published : tr.draft}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-400 dark:text-secondary-500 flex items-center gap-1"><Languages className="w-3.5 h-3.5" /> {tr.translation}</span>
                <span className="font-semibold text-accent-600 dark:text-accent-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {tr.autoLabel}</span>
              </div>
            </div>
          </div>

          {/* Live preview box */}
          {showPreview && (
            <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary-50 dark:bg-secondary-700/40 border-b border-secondary-100 dark:border-secondary-700/50">
                <Monitor className="w-4 h-4 text-accent-500" />
                <span className="font-display text-sm font-bold text-secondary-900 dark:text-white">{tr.previewBox}</span>
              </div>
              <div className="p-4">
                <LivePreview category={category} title={previewTitle} desc={previewDesc} image={previewImage} price={previewPrice} rating={previewRating} features={previewFeatures} capacity={Number(data.capacity ?? 0)} size={String(data.size ?? '')} icon={String(data.icon ?? '')} guestName={String(data.name ?? '')} location={previewLocation} tr={tr} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Detect source language from text */
function detectSourceLang(text: string): string {
  if (/[\uAC00-\uD7AF]/.test(text)) return 'kr';
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return 'vi';
  return 'en';
}

/* ---------- Live Preview ---------- */

function LivePreview({
  category, title, desc, image, price, rating, features, capacity, size, icon, guestName, location, tr,
}: {
  category: string;
  title: string;
  desc: string;
  image: string;
  price: string;
  rating: number;
  features: string[];
  capacity: number;
  size: string;
  icon: string;
  guestName: string;
  location: string;
  tr: typeof adminTr.vi;
}) {
  if (category === 'room') {
    return (
      <div className="rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700">
        {image && <div className="aspect-video bg-secondary-100 dark:bg-secondary-700"><img src={image} alt={title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>}
        <div className="p-3 space-y-2">
          <div className="font-display font-bold text-sm text-secondary-900 dark:text-white">{title || tr.untitled}</div>
          {price && <div className="text-primary-600 dark:text-primary-400 font-bold text-sm">{price}<span className="text-xs text-secondary-400">/đêm</span></div>}
          {desc && <div className="text-xs text-secondary-500 dark:text-secondary-400 line-clamp-2">{desc}</div>}
          <div className="flex items-center gap-2 text-xs text-secondary-400">
            {capacity > 0 && <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {capacity}</span>}
            {size && <span className="flex items-center gap-0.5"><Maximize2 className="w-3 h-3" /> {size}</span>}
          </div>
          {features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {features.slice(0, 4).map((f, i) => (<span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">{f}</span>))}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (category === 'testimonial') {
    return (
      <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 p-4 space-y-2">
        <div className="flex items-center gap-2">
          {image && <img src={image} alt={guestName} className="w-10 h-10 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          <div><div className="font-semibold text-sm text-secondary-900 dark:text-white">{guestName || '—'}</div>
          {location && <div className="text-xs text-secondary-400">{location}</div>}</div>
        </div>
        {rating > 0 && <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-warning-400 fill-warning-400' : 'text-secondary-300 dark:text-secondary-600'}`} />))}</div>}
        {desc && <p className="text-xs text-secondary-600 dark:text-secondary-300 italic">&ldquo;{desc}&rdquo;</p>}
      </div>
    );
  }
  if (category === 'gallery') {
    return (
      <div className="rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700">
        {image && <div className="aspect-video bg-secondary-100 dark:bg-secondary-700"><img src={image} alt={title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>}
        {title && <div className="p-2 text-center text-xs font-semibold text-secondary-700 dark:text-secondary-300">{title}</div>}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 p-4 space-y-2">
      {image && <div className="aspect-video rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-700 mb-1"><img src={image} alt={title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>}
      <div className="font-display font-bold text-sm text-secondary-900 dark:text-white">{title || tr.untitled}</div>
      {icon && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">{icon}</span>}
      {desc && <div className="text-xs text-secondary-500 dark:text-secondary-400 line-clamp-3">{desc}</div>}
    </div>
  );
}

/* ---------- Auto-Translate Text Input ---------- */

function AutoTextInput({ value, onChange, tr }: { value: string; onChange: (v: string) => void; tr: typeof adminTr.vi }) {
  const [translating, setTranslating] = useState(false);
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (v: string) => {
    setTranslating(true);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    debounceRef[1] = setTimeout(async () => {
      await onChange(v);
      setTranslating(false);
    }, 800);
  };

  return (
    <div className="relative">
      <input
        type="text"
        defaultValue={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={tr.typeToTranslate}
        className={inputClass}
      />
      {translating && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-accent-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        </div>
      )}
      {!translating && value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-success-500">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}

/* ---------- Rich Text Editor ---------- */

function RichTextEditor({ value, onChange, tr }: { value: string; onChange: (v: string) => void; tr: typeof adminTr.vi }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [translating, setTranslating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      handleInput();
    }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setTranslating(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await onChange(html);
      setTranslating(false);
    }, 1000);
  };

  const toolbarBtn = 'flex items-center justify-center w-8 h-8 rounded-lg text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors';
  const toolbarBtnActive = 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400';

  return (
    <div className="rounded-xl border border-secondary-200/70 dark:border-secondary-700/80 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-secondary-50 dark:bg-secondary-700/40 border-b border-secondary-200/70 dark:border-secondary-700/80 flex-wrap">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className={toolbarBtn} title="Bold"><Bold className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className={toolbarBtn} title="Italic"><Italic className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-secondary-200 dark:bg-secondary-600 mx-1" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h2>'); }} className={toolbarBtn} title="Heading 2"><Heading2 className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h3>'); }} className={toolbarBtn} title="Heading 3"><Heading3 className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<p>'); }} className={toolbarBtn} title="Paragraph"><Type className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-secondary-200 dark:bg-secondary-600 mx-1" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} className={toolbarBtn} title="Bullet List"><List className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }} className={toolbarBtn} title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-secondary-200 dark:bg-secondary-600 mx-1" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); const url = prompt('URL:'); if (url) exec('createLink', url); }} className={toolbarBtn} title="Link"><Link2 className="w-4 h-4" /></button>
        <div className="flex-1" />
        {translating ? (
          <span className="flex items-center gap-1 text-xs text-accent-500 px-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {tr.translating}</span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-success-500 px-2"><Sparkles className="w-3.5 h-3.5" /> {tr.autoLabel}</span>
        )}
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        className="w-full min-h-[120px] px-4 py-3 bg-white dark:bg-secondary-800 text-sm text-secondary-900 dark:text-white focus:outline-none prose prose-sm dark:prose-invert max-w-none [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary-500 [&_a]:underline"
        data-placeholder={tr.typeRichText}
      />
    </div>
  );
}

/* ---------- Auto-Translate List Editor ---------- */

function AutoListEditor({ items, onChange, tr }: { items: string[]; onChange: (items: string[]) => void; tr: typeof adminTr.vi }) {
  const [localItems, setLocalItems] = useState<string[]>(items);
  const [newItem, setNewItem] = useState('');
  const [translating, setTranslating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocalItems(items); }, [items]);

  const triggerTranslate = (newItems: string[]) => {
    setLocalItems(newItems);
    setTranslating(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await onChange(newItems);
      setTranslating(false);
    }, 1000);
  };

  const add = () => {
    if (!newItem.trim()) return;
    triggerTranslate([...localItems, newItem.trim()]);
    setNewItem('');
  };

  return (
    <div className="rounded-xl border border-secondary-200/70 dark:border-secondary-700/80 overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-secondary-50 dark:bg-secondary-700/40 border-b border-secondary-200/70 dark:border-secondary-700/80">
        <List className="w-3.5 h-3.5 text-secondary-400 mr-1" />
        <span className="text-xs font-semibold text-secondary-500 dark:text-secondary-400">{tr.features}</span>
        <div className="flex-1" />
        {translating ? (
          <span className="flex items-center gap-1 text-xs text-accent-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /></span>
        ) : localItems.length > 0 ? (
          <span className="flex items-center gap-1 text-xs text-success-500"><Sparkles className="w-3.5 h-3.5" /></span>
        ) : null}
      </div>
      <div className="p-3 space-y-2 bg-white dark:bg-secondary-800">
        {localItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 text-xs font-bold shrink-0">
              {i + 1}
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => { const next = [...localItems]; next[i] = e.target.value; triggerTranslate(next); }}
              className="flex-1 px-3 py-1.5 rounded-lg bg-secondary-50 dark:bg-secondary-700/50 border border-secondary-200/60 dark:border-secondary-700/60 text-sm text-secondary-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-400/50"
            />
            <button
              type="button"
              onClick={() => triggerTranslate(localItems.filter((_, idx) => idx !== i))}
              className="p-1.5 rounded-lg text-error-400 hover:bg-error-100 dark:hover:bg-error-900/30 transition-colors shrink-0"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder={tr.addItem}
            className="flex-1 px-3 py-1.5 rounded-lg bg-secondary-50 dark:bg-secondary-700/50 border border-dashed border-secondary-300 dark:border-secondary-600 text-sm text-secondary-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-400/50"
          />
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 text-xs font-semibold hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> {tr.add}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Media Uploader — WordPress style ---------- */

function MediaUploader({ label, value, onChange, tr, sizeMode, setSizeMode }: { label: string; value: string; onChange: (v: string) => void; tr: typeof adminTr.vi; sizeMode: string; setSizeMode: (s: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const isVideo = value.match(/\.(mp4|webm|ogg|mov|avi)(\?|$)/i);
  const isImage = value.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i);

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setUploadError(tr.fileTooLarge);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `uploads/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      onChange(urlData.publicUrl);
    } catch (err) {
      setUploadError(String(err?.message ?? err));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const confirmUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const removeMedia = () => {
    onChange('');
    setSizeMode('original');
  };

  const sizeOptions: { key: string; label: string; w: number }[] = [
    { key: 'thumbnail', label: tr.sizeThumb, w: 150 },
    { key: 'medium', label: tr.sizeMedium, w: 300 },
    { key: 'large', label: tr.sizeLarge, w: 600 },
    { key: 'original', label: tr.sizeFull, w: 0 },
  ];

  const sizeOpt = sizeOptions.find((o) => o.key === sizeMode);
  const imgWidth = sizeOpt && sizeOpt.w > 0 ? `${sizeOpt.w}px` : '100%';

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-secondary-50 dark:bg-secondary-700/40 border-b border-secondary-100 dark:border-secondary-700/50">
        {isVideo ? <Film className="w-4 h-4 text-accent-500" /> : <ImageIcon className="w-4 h-4 text-primary-500" />}
        <span className="font-display text-sm font-bold text-secondary-900 dark:text-white">{label}</span>
        {value && (
          <button
            type="button"
            onClick={removeMedia}
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-error-500 hover:text-error-600 transition-colors"
          >
            <Trash className="w-3.5 h-3.5" /> {tr.remove}
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Preview area */}
        {value ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700 bg-secondary-100 dark:bg-secondary-700 group">
              {isVideo ? (
                <video src={value} controls className="w-full max-h-48 object-contain bg-black" />
              ) : isImage ? (
                <div className="flex justify-center bg-secondary-50 dark:bg-secondary-700/30" style={{ maxWidth: imgWidth === '100%' ? '100%' : imgWidth, margin: '0 auto' }}>
                  <img src={value} alt={label} className="max-h-48 object-contain rounded-lg" style={{ width: imgWidth === '100%' ? '100%' : 'auto', maxWidth: '100%' }} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-secondary-400 gap-2">
                  <FileType2 className="w-8 h-8" />
                  <span className="text-xs">{value.split('/').pop()}</span>
                </div>
              )}
              {/* Overlay actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white/90 dark:bg-secondary-800/90 text-secondary-600 dark:text-secondary-300 hover:bg-white shadow-sm transition-colors"
                  title={tr.openNewTab}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Size selector for images */}
            {isImage && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wide text-secondary-400 flex items-center gap-1">
                  <Crop className="w-3 h-3" /> {tr.imageSize}
                </label>
                <div className="flex gap-1 flex-wrap">
                  {sizeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSizeMode(opt.key)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${sizeMode === opt.key ? 'bg-primary-600 text-white shadow-sm' : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-500 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-600'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* URL display + edit */}
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-secondary-50 dark:bg-secondary-700/50 border border-secondary-200/60 dark:border-secondary-700/60 text-xs text-secondary-600 dark:text-secondary-400 font-mono focus:outline-none focus:ring-1 focus:ring-primary-400/50"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 text-xs font-semibold hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors shrink-0"
              >
                <Upload className="w-3.5 h-3.5" /> {tr.replace}
              </button>
            </div>
          </div>
        ) : (
          /* Upload dropzone */
          <div className="space-y-3">
            <div
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer rounded-xl border-2 border-dashed border-secondary-300 dark:border-secondary-600 hover:border-primary-400 dark:hover:border-primary-500 transition-colors py-8 px-4 text-center group"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  <span className="text-xs font-semibold text-secondary-500 dark:text-secondary-400">{tr.uploading}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-primary-500" />
                  </div>
                  <div className="text-sm font-bold text-secondary-700 dark:text-secondary-300">{tr.dropOrClick}</div>
                  <div className="text-xs text-secondary-400 dark:text-secondary-500">{tr.fileTypesDesc}</div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); e.target.value = ''; }}
                className="hidden"
              />
            </div>

            {/* URL paste option */}
            {showUrlInput ? (
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmUrl(); } }}
                  placeholder="https://..."
                  autoFocus
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-secondary-50 dark:bg-secondary-700/50 border border-secondary-200/60 dark:border-secondary-700/60 text-xs text-secondary-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-400/50"
                />
                <button type="button" onClick={confirmUrl} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors shrink-0">{tr.confirm}</button>
                <button type="button" onClick={() => setShowUrlInput(false)} className="px-2 py-1.5 rounded-lg text-secondary-400 text-xs hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-secondary-500 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> {tr.insertFromUrl}
              </button>
            )}

            {uploadError && (
              <div className="text-xs text-error-500 bg-error-50 dark:bg-error-900/20 rounded-lg px-3 py-2">{uploadError}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Image Input with Preview (legacy, used by ContentPreviewCard) ---------- */

function ImageInput({ value, onChange, tr }: { value: string; onChange: (v: string) => void; tr: typeof adminTr.vi }) {
  return (
    <div className="flex gap-3">
      {value && (
        <div className="w-20 h-20 rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700 shrink-0 bg-secondary-100 dark:bg-secondary-700">
          <img src={value} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
      <div className="flex-1 flex flex-col gap-2">
        <div className="relative">
          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.pexels.com/..."
            className={`${inputClass} pl-9`}
          />
        </div>
        {!value && (
          <div className="flex items-center gap-1.5 text-xs text-secondary-400 dark:text-secondary-500">
            <ImageIcon className="w-3.5 h-3.5" />
            {tr.imageHint}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Content Preview Card ---------- */

type ContentPreviewCardProps = {
  row: ContentRow;
  tr: typeof adminTr.vi;
  lang: Language;
  idx: number;
  total: number;
  onMove: (row: ContentRow, dir: 'up' | 'down') => void;
  onTogglePublished: (id: string, current: boolean) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
};

function ContentPreviewCard({ row, tr, lang, idx, total, onMove, onTogglePublished, onEdit, onDelete }: ContentPreviewCardProps) {
  const c = row.content;
  const getMl = (field: string, l: Language): string => {
    const raw = c[field];
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object') return String((raw as Record<string, string>)[l] ?? '');
    return '';
  };

  const imageUrl = String(c.image ?? c.url ?? c.avatar ?? '');
  const title = getMl('name', lang) || getMl('title', lang) || getMl('caption', lang) || String(c.name ?? c.title ?? row.key);
  const desc = getMl('description', lang) || getMl('text', lang) || getMl('value', lang) || '';
  const price = c.price ? formatPrice(Number(c.price)) : '';
  const rating = c.rating ? Number(c.rating) : 0;
  const features = c.features && typeof c.features === 'object' ? (c.features as Record<string, unknown>)[lang] : undefined;
  const featureList = Array.isArray(features) ? features.map(String) : [];

  return (
    <div className="flex items-start gap-4 p-4">
      {imageUrl && (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700 shrink-0 bg-secondary-100 dark:bg-secondary-700">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-secondary-900 dark:text-white text-sm">{title}</span>
          <span className="text-xs text-secondary-400 dark:text-secondary-500 font-mono">#{row.key}</span>
          {row.is_published ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400">
              <Eye className="w-3 h-3" /> {tr.published}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-500 dark:bg-secondary-700 dark:text-secondary-400">
              <EyeOff className="w-3 h-3" /> {tr.draft}
            </span>
          )}
        </div>
        {desc && (
          <div className="text-xs text-secondary-400 dark:text-secondary-500 line-clamp-2 mb-1">{desc}</div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          {price && (
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> {price}
            </span>
          )}
          {c.capacity && (
            <span className="text-xs text-secondary-400 dark:text-secondary-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {String(c.capacity)} {tr.guests}
            </span>
          )}
          {rating > 0 && (
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-warning-400 fill-warning-400' : 'text-secondary-300 dark:text-secondary-600'}`} />
              ))}
            </span>
          )}
          {c.icon && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">{String(c.icon)}</span>
          )}
          {c.category && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300">{String(c.category)}</span>
          )}
          {featureList.length > 0 && (
            <span className="text-xs text-secondary-400 dark:text-secondary-500">{featureList.length} {tr.features}</span>
          )}
        </div>
        <div className="text-xs text-secondary-300 dark:text-secondary-600 mt-1">{tr.updated}: {new Date(row.updated_at).toLocaleDateString()}</div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => onMove(row, 'up')} disabled={idx === 0} className="p-1.5 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ArrowUp className="w-4 h-4" />
        </button>
        <button onClick={() => onMove(row, 'down')} disabled={idx === total - 1} className="p-1.5 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ArrowDown className="w-4 h-4" />
        </button>
        <button onClick={() => onTogglePublished(row.id, row.is_published)} className="p-1.5 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">
          {row.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button onClick={onEdit} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
          <Edit3 className="w-4 h-4" />
        </button>
        <button onClick={() => { if (confirm(tr.confirmDelete)) onDelete(row.id); }} className="p-1.5 rounded-lg text-error-500 hover:bg-error-100 dark:hover:bg-error-900/30 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Translations ---------- */

const adminTr: Record<Language, Record<string, string>> = {
  vi: {
    adminTitle: 'Quản trị hệ thống',
    adminPanel: 'Quản trị viên',
    overview: 'Tổng quan',
    users: 'Người dùng',
    bookings: 'Đặt phòng',
    content: 'Nội dung',
    payments: 'Thanh toán',
    totalBookings: 'Tổng đặt phòng',
    pendingBookings: 'Chờ xác nhận',
    confirmedBookings: 'Đã xác nhận',
    totalRevenue: 'Tổng doanh thu',
    totalUsers: 'Tổng người dùng',
    totalPayments: 'Đã thanh toán',
    pendingPayments: 'Chờ thanh toán',
    publishedContent: 'Nội dung xuất bản',
    totalTransactions: 'Tổng giao dịch',
    totalPaid: 'Đã thu',
    recentBookings: 'Đặt phòng gần đây',
    recentPayments: 'Thanh toán gần đây',
    noBookings: 'Chưa có đặt phòng nào',
    noUsers: 'Chưa có người dùng nào',
    noPayments: 'Chưa có giao dịch nào',
    searchUsers: 'Tìm kiếm người dùng...',
    searchBookings: 'Tìm kiếm đặt phòng...',
    guests: 'khách',
    confirm: 'Xác nhận',
    cancel: 'Hủy',
    makeAdmin: 'Cấp Admin',
    removeAdmin: 'Bỏ Admin',
    joined: 'Tham gia',
    unnamed: 'Chưa đặt tên',
    umTotalUsers: 'Tổng người dùng',
    umStaffCount: 'Nhân viên',
    umInactiveCount: 'Tài khoản bị khóa',
    umAddStaff: 'Thêm nhân viên',
    umEditUser: 'Sửa thông tin',
    umEdit: 'Sửa',
    umResetPassword: 'Đặt lại mật khẩu',
    umResetConfirm: 'Hệ thống sẽ gửi email hướng dẫn đặt lại mật khẩu cho người dùng này. Bạn có chắc chắn?',
    umSendReset: 'Gửi email đặt lại',
    umResetSent: 'Email đặt lại mật khẩu đã được gửi thành công!',
    umResetError: 'Có lỗi xảy ra. Vui lòng thử lại.',
    umClose: 'Đóng',
    umActivate: 'Kích hoạt',
    umDeactivate: 'Khóa tài khoản',
    umFullName: 'Họ và tên',
    umEmail: 'Email',
    umPhone: 'Số điện thoại',
    umPassword: 'Mật khẩu',
    umRole: 'Vai trò',
    umRoleInfo: 'Vai trò hiện tại',
    exportExcel: 'Xuất file Excel thanh toán',
    invoice: 'Hóa đơn',
    emailSending: 'Đang gửi email thông báo...',
    emailSent: 'Đã gửi email thông báo thành công!',
    emailSendError: 'Lỗi gửi email. Vui lòng thử lại.',
    excelDate: 'Ngày',
    excelBookingId: 'Mã đặt phòng',
    excelCustomer: 'Khách hàng',
    excelAmount: 'Số tiền',
    excelCurrency: 'Tiền tệ',
    excelProvider: 'Nguồn',
    excelMethod: 'Phương thức',
    excelStatus: 'Trạng thái',
    all: 'Tất cả',
    addNew: 'Thêm mới',
    published: 'Đã xuất bản',
    draft: 'Bản nháp',
    updated: 'Cập nhật',
    save: 'Lưu',
    contentKey: 'Khóa nội dung',
    contentJson: 'Dữ liệu (JSON)',
    keyRequired: 'Vui lòng nhập khóa nội dung',
    invalidJson: 'JSON không hợp lệ',
    confirmDelete: 'Bạn có chắc muốn xóa nội dung này?',
    seedAll: 'Nạp toàn bộ nội dung mẫu',
    seedAllHint: 'Chưa có nội dung. Bạn có thể nạp toàn bộ dữ liệu mẫu (phòng, tiện nghi, đánh giá, thư viện, thống kê) từ hệ thống.',
    markPaid: 'Đã thu',
    markRefunded: 'Hoàn tiền',
    markFailed: 'Thất bại',
    langVi: 'Tiếng Việt',
    langEn: 'English',
    langKr: '한국어',
    fldName: 'Tên',
    fldPrice: 'Giá (VND)',
    fldSize: 'Diện tích',
    fldCapacity: 'Sức chứa (khách)',
    fldBeds: 'Giường',
    fldImage: 'Ảnh',
    fldDescription: 'Mô tả',
    fldFeatures: 'Tiện nghi',
    fldIcon: 'Icon',
    fldGuestName: 'Tên khách',
    fldAvatar: 'Ảnh đại diện',
    fldLocation: 'Vị trí',
    fldRating: 'Đánh giá',
    fldReview: 'Nội dung đánh giá',
    fldCaption: 'Chú thích ảnh',
    fldCategory: 'Danh mục',
    fldPageTitle: 'Tiêu đề trang',
    fldPageBody: 'Nội dung trang',
    fldStatLabel: 'Nhãn thống kê',
    fldStatValue: 'Giá trị',
    addItem: 'Thêm mục...',
    add: 'Thêm',
    imageHint: 'Dán đường dẫn ảnh vào ô bên cạnh',
    features: 'tiện nghi',
    slug: 'Đường dẫn (slug)',
    publishBox: 'Xuất bản',
    savePublish: 'Lưu & Xuất bản',
    saveDraft: 'Lưu bản nháp',
    contentSettings: 'Cấu hình nội dung',
    category: 'Danh mục',
    status: 'Trạng thái',
    language: 'Ngôn ngữ',
    previewBox: 'Xem trước',
    livePreview: 'Xem trực tiếp',
    untitled: 'Chưa có tiêu đề',
    autoTranslate: 'Tự động dịch',
    autoLabel: 'Auto',
    translating: 'Đang dịch...',
    translation: 'Dịch thuật',
    typeToTranslate: 'Nhập nội dung (tự động dịch sang VI/EN/KR)...',
    typeRichText: 'Nhập nội dung... (tự động dịch)',
    dropOrClick: 'Kéo thả file vào đây hoặc click để chọn',
    fileTypesDesc: 'Hỗ trợ ảnh (JPG, PNG, WebP, GIF) và video (MP4, WebM) — tối đa 50MB',
    uploading: 'Đang tải lên...',
    insertFromUrl: 'Chèn từ URL',
    remove: 'Xóa',
    replace: 'Thay',
    openNewTab: 'Mở tab mới',
    imageSize: 'Kích thước hiển thị',
    sizeThumb: 'Nhỏ',
    sizeMedium: 'Vừa',
    sizeLarge: 'Lớn',
    sizeFull: 'Gốc',
    fileTooLarge: 'File quá lớn. Tối đa 50MB.',
    paymentMethodsTab: 'Phương thức thanh toán',
    paymentMethodsHint: 'Quản lý các phương thức thanh toán hiển thị cho khách khi đặt phòng.',
    addPaymentMethod: 'Thêm phương thức thanh toán',
    editPaymentMethod: 'Sửa phương thức thanh toán',
    noPaymentMethods: 'Chưa có phương thức thanh toán nào. Thêm mới để khách có thể chọn khi đặt phòng.',
    pmLabel: 'Tên hiển thị',
    pmDescription: 'Hướng dẫn thanh toán',
    pmType: 'Loại',
    pmIcon: 'Biểu tượng',
    bankAccountSection: 'Thông tin tài khoản ngân hàng',
    bankName: 'Ngân hàng',
    accountNumber: 'Số tài khoản',
    accountHolder: 'Chủ tài khoản',
    fixedAmount: 'Gắn số tiền vào mã QR (khách quét sẽ thấy đúng số tiền cần chuyển)',
    qrPreviewHint: 'Nhập ngân hàng và số tài khoản để xem QR',
    settingsTab: 'Cài đặt',
    invoicesTab: 'Hóa đơn',
    invTotal: 'Tổng hóa đơn',
    invPaid: 'Đã thanh toán',
    invPending: 'Chờ thanh toán',
    invCreate: 'Tạo hóa đơn mới',
    invNoInvoices: 'Chưa có hóa đơn nào. Tạo mới để bắt đầu.',
    invCreateTitle: 'Tạo hóa đơn',
    invEditTitle: 'Sửa hóa đơn',
    invNumber: 'Số hóa đơn',
    invStatus: 'Trạng thái',
    invStatusDraft: 'Bản nháp',
    invStatusSent: 'Đã gửi',
    invStatusPaid: 'Đã thanh toán',
    invStatusOverdue: 'Quá hạn',
    invCustomerInfo: 'Thông tin khách hàng',
    invCustomerName: 'Tên khách hàng',
    invCustomerEmail: 'Email',
    invCustomerPhone: 'Số điện thoại',
    invCustomerAddress: 'Địa chỉ',
    invIssueDate: 'Ngày phát hành',
    invDueDate: 'Hạn thanh toán',
    invItems: 'Hạng mục',
    invItemDesc: 'Mô tả dịch vụ',
    invAddItem: 'Thêm hạng mục',
    invSubtotal: 'Tạm tính',
    invTax: 'Thuế',
    invTaxAmount: 'Tiền thuế',
    invDiscount: 'Giảm giá',
    invTotal: 'TỔNG CỘNG',
    invNotes: 'Ghi chú',
    invNotesPlaceholder: 'Ghi chú thêm cho khách hàng...',
    invView: 'Xem',
    invEdit: 'Sửa',
    invDelete: 'Xóa',
    invConfirmDelete: 'Bạn có chắc muốn xóa hóa đơn này?',
    invCustomerRequired: 'Vui lòng nhập tên khách hàng',
    invItemRequired: 'Vui lòng thêm ít nhất một hạng mục',
    stGeneral: 'Chung',
    stBanner: 'Ảnh bìa',
    stFooter: 'Liên hệ & Footer',
    stColors: 'Màu sắc',
    stEmail: 'Email thông báo',
    stHotelName: 'Tên khách sạn (VI/EN)',
    stHotelNameKr: 'Tên khách sạn (Tiếng Hàn)',
    stTagline: 'Khẩu hiệu',
    stHeroImage: 'Đường dẫn ảnh bìa (URL)',
    stHeroImageHint: 'Dán đường dẫn ảnh (URL) vào ô trên. Khuyên dùng ảnh ngang chất lượng cao (1920x1080).',
    stAddress: 'Địa chỉ (VI/EN)',
    stAddressKr: 'Địa chỉ (Tiếng Hàn)',
    stPhone: 'Số điện thoại',
    stContactEmail: 'Email liên hệ',
    stReceptionHours: 'Giờ tiếp tân',
    stSocial: 'Mạng xã hội',
    stPrimaryColor: 'Màu chính',
    stAccentColor: 'Màu nhấn',
    stColorPreview: 'Xem trước màu',
    stColorHint: 'Lưu ý: Thay đổi màu sắc sẽ áp dụng ngay sau khi lưu. Mọi trang sẽ tự động cập nhật.',
    stNotifEmail: 'Email nhận thông báo',
    stNotifEnabled: 'Bật thông báo email',
    stNotifEnabledHint: 'Gửi email thông báo cho admin và khách khi thanh toán thành công',
    stEmailHint: 'Email này sẽ nhận thông báo khi có đặt phòng hoặc thanh toán mới.',
    stSaved: 'Đã lưu!',
    stSave: 'Lưu cài đặt',
  },
  en: {
    adminTitle: 'Admin Dashboard',
    adminPanel: 'Administrator',
    overview: 'Overview',
    users: 'Users',
    bookings: 'Bookings',
    content: 'Content',
    payments: 'Payments',
    totalBookings: 'Total Bookings',
    pendingBookings: 'Pending',
    confirmedBookings: 'Confirmed',
    totalRevenue: 'Total Revenue',
    totalUsers: 'Total Users',
    totalPayments: 'Payments Received',
    pendingPayments: 'Pending Payments',
    publishedContent: 'Published Content',
    totalTransactions: 'Total Transactions',
    totalPaid: 'Total Paid',
    recentBookings: 'Recent Bookings',
    recentPayments: 'Recent Payments',
    noBookings: 'No bookings yet',
    noUsers: 'No users yet',
    noPayments: 'No transactions yet',
    searchUsers: 'Search users...',
    searchBookings: 'Search bookings...',
    guests: 'guests',
    confirm: 'Confirm',
    cancel: 'Cancel',
    makeAdmin: 'Make Admin',
    removeAdmin: 'Remove Admin',
    joined: 'Joined',
    unnamed: 'Unnamed',
    umTotalUsers: 'Total Users',
    umStaffCount: 'Staff Members',
    umInactiveCount: 'Inactive Accounts',
    umAddStaff: 'Add Staff Member',
    umEditUser: 'Edit User',
    umEdit: 'Edit',
    umResetPassword: 'Reset Password',
    umResetConfirm: 'The system will send a password reset email to this user. Are you sure?',
    umSendReset: 'Send Reset Email',
    umResetSent: 'Password reset email has been sent successfully!',
    umResetError: 'An error occurred. Please try again.',
    umClose: 'Close',
    umActivate: 'Activate',
    umDeactivate: 'Deactivate',
    umFullName: 'Full Name',
    umEmail: 'Email',
    umPhone: 'Phone Number',
    umPassword: 'Password',
    umRole: 'Role',
    umRoleInfo: 'Current role',
    exportExcel: 'Export Payments to Excel',
    invoice: 'Invoice',
    emailSending: 'Sending notification emails...',
    emailSent: 'Notification emails sent successfully!',
    emailSendError: 'Failed to send emails. Please try again.',
    excelDate: 'Date',
    excelBookingId: 'Booking ID',
    excelCustomer: 'Customer',
    excelAmount: 'Amount',
    excelCurrency: 'Currency',
    excelProvider: 'Provider',
    excelMethod: 'Method',
    excelStatus: 'Status',
    all: 'All',
    addNew: 'Add New',
    published: 'Published',
    draft: 'Draft',
    updated: 'Updated',
    save: 'Save',
    contentKey: 'Content Key',
    contentJson: 'Data (JSON)',
    keyRequired: 'Please enter a content key',
    invalidJson: 'Invalid JSON format',
    confirmDelete: 'Are you sure you want to delete this content?',
    seedAll: 'Seed All Sample Content',
    seedAllHint: 'No content yet. You can seed all sample data (rooms, amenities, testimonials, gallery, stats) from the system.',
    markPaid: 'Mark Paid',
    markRefunded: 'Refund',
    markFailed: 'Mark Failed',
    langVi: 'Vietnamese',
    langEn: 'English',
    langKr: 'Korean',
    fldName: 'Name',
    fldPrice: 'Price (VND)',
    fldSize: 'Size',
    fldCapacity: 'Capacity (guests)',
    fldBeds: 'Beds',
    fldImage: 'Image',
    fldDescription: 'Description',
    fldFeatures: 'Features',
    fldIcon: 'Icon',
    fldGuestName: 'Guest Name',
    fldAvatar: 'Avatar',
    fldLocation: 'Location',
    fldRating: 'Rating',
    fldReview: 'Review Text',
    fldCaption: 'Caption',
    fldCategory: 'Category',
    fldPageTitle: 'Page Title',
    fldPageBody: 'Page Content',
    fldStatLabel: 'Stat Label',
    fldStatValue: 'Value',
    addItem: 'Add item...',
    add: 'Add',
    imageHint: 'Paste image URL in the field',
    features: 'features',
    slug: 'Slug',
    publishBox: 'Publish',
    savePublish: 'Save & Publish',
    saveDraft: 'Save Draft',
    contentSettings: 'Content Settings',
    category: 'Category',
    status: 'Status',
    language: 'Language',
    previewBox: 'Live Preview',
    livePreview: 'Preview',
    untitled: 'Untitled',
    autoTranslate: 'Auto-translate',
    autoLabel: 'Auto',
    translating: 'Translating...',
    translation: 'Translation',
    typeToTranslate: 'Type content (auto-translates to VI/EN/KR)...',
    typeRichText: 'Type content... (auto-translates)',
    dropOrClick: 'Drop a file here or click to select',
    fileTypesDesc: 'Supports images (JPG, PNG, WebP, GIF) and video (MP4, WebM) — max 50MB',
    uploading: 'Uploading...',
    insertFromUrl: 'Insert from URL',
    remove: 'Remove',
    replace: 'Replace',
    openNewTab: 'Open in new tab',
    imageSize: 'Display size',
    sizeThumb: 'Thumbnail',
    sizeMedium: 'Medium',
    sizeLarge: 'Large',
    sizeFull: 'Full',
    fileTooLarge: 'File too large. Max 50MB.',
    paymentMethodsTab: 'Payment Methods',
    paymentMethodsHint: 'Manage the payment methods shown to guests at checkout.',
    addPaymentMethod: 'Add Payment Method',
    editPaymentMethod: 'Edit Payment Method',
    noPaymentMethods: 'No payment methods yet. Add one so guests can choose at checkout.',
    pmLabel: 'Display Name',
    pmDescription: 'Payment Instructions',
    pmType: 'Type',
    pmIcon: 'Icon',
    bankAccountSection: 'Bank Account Information',
    bankName: 'Bank',
    accountNumber: 'Account Number',
    accountHolder: 'Account Holder',
    fixedAmount: 'Embed amount in QR (customer scans and sees the exact amount)',
    qrPreviewHint: 'Enter bank and account number to preview QR',
    settingsTab: 'Settings',
    invoicesTab: 'Invoices',
    invTotal: 'Total Invoices',
    invPaid: 'Paid',
    invPending: 'Pending',
    invCreate: 'Create New Invoice',
    invNoInvoices: 'No invoices yet. Create one to get started.',
    invCreateTitle: 'Create Invoice',
    invEditTitle: 'Edit Invoice',
    invNumber: 'Invoice Number',
    invStatus: 'Status',
    invStatusDraft: 'Draft',
    invStatusSent: 'Sent',
    invStatusPaid: 'Paid',
    invStatusOverdue: 'Overdue',
    invCustomerInfo: 'Customer Information',
    invCustomerName: 'Customer Name',
    invCustomerEmail: 'Email',
    invCustomerPhone: 'Phone',
    invCustomerAddress: 'Address',
    invIssueDate: 'Issue Date',
    invDueDate: 'Due Date',
    invItems: 'Line Items',
    invItemDesc: 'Service description',
    invAddItem: 'Add line item',
    invSubtotal: 'Subtotal',
    invTax: 'Tax',
    invTaxAmount: 'Tax Amount',
    invDiscount: 'Discount',
    invTotal: 'TOTAL',
    invNotes: 'Notes',
    invNotesPlaceholder: 'Additional notes for the customer...',
    invView: 'View',
    invEdit: 'Edit',
    invDelete: 'Delete',
    invConfirmDelete: 'Are you sure you want to delete this invoice?',
    invCustomerRequired: 'Please enter a customer name',
    invItemRequired: 'Please add at least one line item',
    stGeneral: 'General',
    stBanner: 'Banner Image',
    stFooter: 'Contact & Footer',
    stColors: 'Colors',
    stEmail: 'Email Notifications',
    stHotelName: 'Hotel Name (VI/EN)',
    stHotelNameKr: 'Hotel Name (Korean)',
    stTagline: 'Tagline',
    stHeroImage: 'Banner Image URL',
    stHeroImageHint: 'Paste an image URL above. Recommended: high-quality landscape image (1920x1080).',
    stAddress: 'Address (VI/EN)',
    stAddressKr: 'Address (Korean)',
    stPhone: 'Phone Number',
    stContactEmail: 'Contact Email',
    stReceptionHours: 'Reception Hours',
    stSocial: 'Social Media',
    stPrimaryColor: 'Primary Color',
    stAccentColor: 'Accent Color',
    stColorPreview: 'Color Preview',
    stColorHint: 'Note: Color changes apply immediately after saving. All pages will update automatically.',
    stNotifEmail: 'Notification Email',
    stNotifEnabled: 'Enable Email Notifications',
    stNotifEnabledHint: 'Send email notifications to admin and customer when payment is confirmed',
    stEmailHint: 'This email will receive notifications for new bookings and payments.',
    stSaved: 'Saved!',
    stSave: 'Save Settings',
  },
  kr: {
    adminTitle: '관리자 대시보드',
    adminPanel: '관리자',
    overview: '개요',
    users: '사용자',
    bookings: '예약',
    content: '콘텐츠',
    payments: '결제',
    totalBookings: '총 예약',
    pendingBookings: '대기 중',
    confirmedBookings: '확정됨',
    totalRevenue: '총 수익',
    totalUsers: '총 사용자',
    totalPayments: '결제 완료',
    pendingPayments: '결제 대기',
    publishedContent: '게시된 콘텐츠',
    totalTransactions: '총 거래',
    totalPaid: '총 수금',
    recentBookings: '최근 예약',
    recentPayments: '최근 결제',
    noBookings: '예약이 없습니다',
    noUsers: '사용자가 없습니다',
    noPayments: '거래가 없습니다',
    searchUsers: '사용자 검색...',
    searchBookings: '예약 검색...',
    guests: '명',
    confirm: '확정',
    cancel: '취소',
    makeAdmin: '관리자 부여',
    removeAdmin: '관리자 해제',
    joined: '가입일',
    unnamed: '이름 없음',
    umTotalUsers: '전체 사용자',
    umStaffCount: '직원 수',
    umInactiveCount: '비활성 계정',
    umAddStaff: '직원 추가',
    umEditUser: '사용자 수정',
    umEdit: '수정',
    umResetPassword: '비밀번호 재설정',
    umResetConfirm: '이 사용자에게 비밀번호 재설정 이메일이 발송됩니다. 계속하시겠습니까?',
    umSendReset: '재설정 이메일 발송',
    umResetSent: '비밀번호 재설정 이메일이 발송되었습니다!',
    umResetError: '오류가 발생했습니다. 다시 시도해주세요.',
    umClose: '닫기',
    umActivate: '활성화',
    umDeactivate: '비활성화',
    umFullName: '이름',
    umEmail: '이메일',
    umPhone: '전화번호',
    umPassword: '비밀번호',
    umRole: '역할',
    umRoleInfo: '현재 역할',
    exportExcel: '결제 내역 Excel 내보내기',
    invoice: '청구서',
    emailSending: '이메일 알림 발송 중...',
    emailSent: '이메일 알림이 발송되었습니다!',
    emailSendError: '이메일 발송 실패. 다시 시도해주세요.',
    excelDate: '날짜',
    excelBookingId: '예약 ID',
    excelCustomer: '고객',
    excelAmount: '금액',
    excelCurrency: '통화',
    excelProvider: '제공자',
    excelMethod: '방법',
    excelStatus: '상태',
    all: '전체',
    addNew: '새로 추가',
    published: '게시됨',
    draft: '초안',
    updated: '수정됨',
    save: '저장',
    contentKey: '콘텐츠 키',
    contentJson: '데이터 (JSON)',
    keyRequired: '콘텐츠 키를 입력하세요',
    invalidJson: '잘못된 JSON 형식',
    confirmDelete: '이 콘텐츠를 삭제하시겠습니까?',
    seedAll: '전체 샘플 콘텐츠 불러오기',
    seedAllHint: '콘텐츠가 없습니다. 시스템에서 모든 샘플 데이터(객실, 편의시설, 리뷰, 갤러리, 통계)를 불러올 수 있습니다.',
    markPaid: '결제 완료',
    markRefunded: '환불',
    markFailed: '실패 표시',
    langVi: '베트남어',
    langEn: '영어',
    langKr: '한국어',
    fldName: '이름',
    fldPrice: '가격 (VND)',
    fldSize: '크기',
    fldCapacity: '수용 인원',
    fldBeds: '침대',
    fldImage: '이미지',
    fldDescription: '설명',
    fldFeatures: '편의시설',
    fldIcon: '아이콘',
    fldGuestName: '게스트 이름',
    fldAvatar: '아바타',
    fldLocation: '위치',
    fldRating: '평점',
    fldReview: '리뷰 내용',
    fldCaption: '캡션',
    fldCategory: '카테고리',
    fldPageTitle: '페이지 제목',
    fldPageBody: '페이지 내용',
    fldStatLabel: '통계 라벨',
    fldStatValue: '값',
    addItem: '항목 추가...',
    add: '추가',
    imageHint: '이미지 URL을 입력하세요',
    features: '편의시설',
    slug: '슬러그',
    publishBox: '게시',
    savePublish: '저장 & 게시',
    saveDraft: '초안 저장',
    contentSettings: '콘텐츠 설정',
    category: '카테고리',
    status: '상태',
    language: '언어',
    previewBox: '미리보기',
    livePreview: '미리보기',
    untitled: '제목 없음',
    autoTranslate: '자동 번역',
    autoLabel: '자동',
    translating: '번역 중...',
    translation: '번역',
    typeToTranslate: '내용 입력 (VI/EN/KR 자동 번역)...',
    typeRichText: '내용 입력... (자동 번역)',
    dropOrClick: '여기에 파일을 끌어다 놓거나 클릭하여 선택',
    fileTypesDesc: '이미지(JPG, PNG, WebP, GIF) 및 비디오(MP4, WebM) 지원 — 최대 50MB',
    uploading: '업로드 중...',
    insertFromUrl: 'URL에서 삽입',
    remove: '삭제',
    replace: '교체',
    openNewTab: '새 탭에서 열기',
    imageSize: '표시 크기',
    sizeThumb: '썸네일',
    sizeMedium: '중간',
    sizeLarge: '크게',
    sizeFull: '원본',
    fileTooLarge: '파일이 너무 큽니다. 최대 50MB.',
    paymentMethodsTab: '결제 방법',
    paymentMethodsHint: '예약 시 게스트에게 표시되는 결제 방법을 관리합니다.',
    addPaymentMethod: '결제 방법 추가',
    editPaymentMethod: '결제 방법 수정',
    noPaymentMethods: '결제 방법이 없습니다. 예약 시 선택할 수 있도록 추가하세요.',
    pmLabel: '표시 이름',
    pmDescription: '결제 안내',
    pmType: '유형',
    pmIcon: '아이콘',
    bankAccountSection: '은행 계좌 정보',
    bankName: '은행',
    accountNumber: '계좌번호',
    accountHolder: '예금주',
    fixedAmount: 'QR에 금액 포함 (고객이 스캔하면 정확한 금액 표시)',
    qrPreviewHint: '은행과 계좌번호를 입력하면 QR이 표시됩니다',
    settingsTab: '설정',
    invoicesTab: '청구서',
    invTotal: '전체 청구서',
    invPaid: '결제 완료',
    invPending: '결제 대기',
    invCreate: '새 청구서 작성',
    invNoInvoices: '청구서가 없습니다. 새로 만들어 시작하세요.',
    invCreateTitle: '청구서 작성',
    invEditTitle: '청구서 수정',
    invNumber: '청구서 번호',
    invStatus: '상태',
    invStatusDraft: '임시',
    invStatusSent: '발송됨',
    invStatusPaid: '결제 완료',
    invStatusOverdue: '기한 초과',
    invCustomerInfo: '고객 정보',
    invCustomerName: '고객명',
    invCustomerEmail: '이메일',
    invCustomerPhone: '전화번호',
    invCustomerAddress: '주소',
    invIssueDate: '발행일',
    invDueDate: '결제 기한',
    invItems: '항목',
    invItemDesc: '서비스 설명',
    invAddItem: '항목 추가',
    invSubtotal: '소계',
    invTax: '세금',
    invTaxAmount: '세액',
    invDiscount: '할인',
    invTotal: '총액',
    invNotes: '비고',
    invNotesPlaceholder: '고객을 위한 추가 메모...',
    invView: '보기',
    invEdit: '수정',
    invDelete: '삭제',
    invConfirmDelete: '이 청구서를 삭제하시겠습니까?',
    invCustomerRequired: '고객명을 입력해주세요',
    invItemRequired: '최소한 하나의 항목을 추가해주세요',
    stGeneral: '일반',
    stBanner: '배너 이미지',
    stFooter: '연락처 & 푸터',
    stColors: '색상',
    stEmail: '이메일 알림',
    stHotelName: '호텔 이름 (VI/EN)',
    stHotelNameKr: '호텔 이름 (한국어)',
    stTagline: '태그라인',
    stHeroImage: '배너 이미지 URL',
    stHeroImageHint: '위 입력란에 이미지 URL을 붙여넣으세요. 추천: 고품질 가로 이미지 (1920x1080).',
    stAddress: '주소 (VI/EN)',
    stAddressKr: '주소 (한국어)',
    stPhone: '전화번호',
    stContactEmail: '연락처 이메일',
    stReceptionHours: '리셉션 운영 시간',
    stSocial: '소셜 미디어',
    stPrimaryColor: '주 색상',
    stAccentColor: '강조 색상',
    stColorPreview: '색상 미리보기',
    stColorHint: '참고: 색상 변경은 저장 즉시 적용됩니다. 모든 페이지가 자동으로 업데이트됩니다.',
    stNotifEmail: '알림 수신 이메일',
    stNotifEnabled: '이메일 알림 활성화',
    stNotifEnabledHint: '결제 확인 시 관리자와 고객에게 이메일 알림 발송',
    stEmailHint: '이 이메일은 새 예약 및 결제 알림을 수신합니다.',
    stSaved: '저장됨!',
    stSave: '설정 저장',
  },
};
