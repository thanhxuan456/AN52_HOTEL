import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Calendar,
  BedDouble,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  TrendingUp,
  Crown,
  Star,
  Gift,
  Award,
  Sparkles,
  Medal,
  Zap,
  Moon,
  Coffee,
  Wine,
  Plane,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import ThemeToggle from '@/components/ThemeToggle';
import ProfileSettings from '@/components/ProfileSettings';
import AdminPanel from '@/components/AdminPanel';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/data/hotelData';
import type { Language } from '@/data/hotelData';

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

type DashboardProps = {
  onBack: () => void;
};

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  pending: { color: 'text-warning-600 bg-warning-50 border-warning-200', icon: Clock },
  confirmed: { color: 'text-success-600 bg-success-50 border-success-200', icon: CheckCircle2 },
  cancelled: { color: 'text-error-600 bg-error-50 border-error-200', icon: XCircle },
};

type TierKey = 'silver' | 'gold' | 'platinum' | 'diamond';

type TierInfo = {
  key: TierKey;
  threshold: number;
  pointsMultiplier: number;
  icon: typeof Crown;
  colors: { bg: string; text: string; border: string; badge: string; gradient: string; ring: string };
};

const tiers: TierInfo[] = [
  {
    key: 'silver',
    threshold: 0,
    pointsMultiplier: 1,
    icon: Medal,
    colors: {
      bg: 'bg-slate-100 dark:bg-slate-700/60',
      text: 'text-slate-700 dark:text-slate-200',
      border: 'border-slate-400 dark:border-slate-500',
      badge: 'bg-slate-300 text-slate-800 dark:bg-slate-500 dark:text-white',
      gradient: 'from-slate-400 via-slate-500 to-slate-700',
      ring: 'ring-slate-400/60',
    },
  },
  {
    key: 'gold',
    threshold: 5000000,
    pointsMultiplier: 2,
    icon: Award,
    colors: {
      bg: 'bg-warning-100 dark:bg-warning-900/40',
      text: 'text-warning-700 dark:text-warning-300',
      border: 'border-warning-500 dark:border-warning-500',
      badge: 'bg-warning-300 text-warning-900 dark:bg-warning-600 dark:text-warning-50',
      gradient: 'from-warning-400 via-warning-500 to-warning-700',
      ring: 'ring-warning-400/60',
    },
  },
  {
    key: 'platinum',
    threshold: 20000000,
    pointsMultiplier: 3,
    icon: Sparkles,
    colors: {
      bg: 'bg-primary-100 dark:bg-primary-900/40',
      text: 'text-primary-700 dark:text-primary-300',
      border: 'border-primary-500 dark:border-primary-500',
      badge: 'bg-primary-300 text-primary-900 dark:bg-primary-600 dark:text-primary-50',
      gradient: 'from-primary-400 via-primary-500 to-primary-700',
      ring: 'ring-primary-400/60',
    },
  },
  {
    key: 'diamond',
    threshold: 50000000,
    pointsMultiplier: 5,
    icon: Crown,
    colors: {
      bg: 'bg-sky-100 dark:bg-sky-900/40',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-500 dark:border-sky-500',
      badge: 'bg-sky-300 text-sky-900 dark:bg-sky-600 dark:text-sky-50',
      gradient: 'from-sky-400 via-sky-500 to-sky-700',
      ring: 'ring-sky-400/60',
    },
  },
];

function getTier(totalSpent: number): TierInfo {
  let result = tiers[0];
  for (const t of tiers) {
    if (totalSpent >= t.threshold) result = t;
  }
  return result;
}

function getNextTier(totalSpent: number): TierInfo | null {
  for (const t of tiers) {
    if (totalSpent < t.threshold) return t;
  }
  return null;
}

const tDashboard: Record<Language, Record<string, string>> = {
  vi: {
    dashboard: 'Bảng điều khiển',
    backHome: 'Về trang chủ',
    overview: 'Tổng quan',
    rewards: 'Đặc quyền',
    myBookings: 'Đặt phòng của tôi',
    allBookings: 'Tất cả đặt phòng',
    totalBookings: 'Tổng đặt phòng',
    pendingBookings: 'Chờ xác nhận',
    confirmedBookings: 'Đã xác nhận',
    totalRevenue: 'Tổng doanh thu',
    totalSpent: 'Tổng chi tiêu',
    rewardPoints: 'Điểm thưởng',
    membershipTier: 'Hạng thành viên',
    pointsToNext: 'điểm đến hạng tiếp theo',
    room: 'Phòng',
    guest: 'Khách',
    checkIn: 'Nhận phòng',
    checkOut: 'Trả phòng',
    price: 'Giá',
    status: 'Trạng thái',
    phone: 'Điện thoại',
    email: 'Email',
    name: 'Họ tên',
    bookedAt: 'Đặt lúc',
    confirm: 'Xác nhận',
    cancel: 'Hủy',
    noBookings: 'Chưa có đặt phòng nào',
    noBookingsAdmin: 'Chưa có đặt phòng nào từ khách',
    profile: 'Hồ sơ',
    accountInfo: 'Thông tin tài khoản',
    memberSince: 'Thành viên từ',
    adminPanel: 'Quản trị',
    userPanel: 'Người dùng',
    confirmAction: 'Bạn có chắc muốn thay đổi trạng thái đặt phòng này?',
    guests: 'khách',
    silver: 'Bạc',
    gold: 'Vàng',
    platinum: 'Bạch Kim',
    diamond: 'Kim Cương',
    tierBenefits: 'Quyền lợi hạng thành viên',
    benefitsTitle: 'Đặc quyền & Phần thưởng',
    benefitsSubtitle: 'Ưu đãi dành riêng cho bạn theo hạng thành viên',
    allTiers: 'Bậc hạng thành viên',
    rewardHistory: 'Lịch sử điểm thưởng',
    nightsStayed: 'Đêm lưu trú',
    avgStay: 'Chi tiêu TB / đặt',
    upgradeNow: 'Nâng hạng',
    pointsEarned: 'Điểm tích lũy',
    earnedFromBooking: 'Tích điểm từ đặt phòng',
    memberStatus: 'Trạng thái thành viên',
    active: 'Hoạt động',
    benefitFreeBreakfast: 'Buffet sáng miễn phí',
    benefitLateCheckout: 'Trả phòng muộn (14:00)',
    benefitRoomUpgrade: 'Nâng hạng phòng miễn phí',
    benefitFreeWifi: 'Wifi tốc độ cao miễn phí',
    benefitSpaDiscount: 'Giảm 20% dịch vụ Spa',
    benefitAirportPickup: 'Đưa đón sân bay',
    benefitWelcomeGift: 'Quà chào mừng tại phòng',
    benefitPriorityCheckin: 'Lễ tân ưu tiên',
    benefitFreeNight: '1 đêm miễn phí / 10 đêm',
    benefitLoungeAccess: 'Phòng chờ VIP',
    benefitPersonalConcierge: 'Concierge cá nhân 24/7',
    benefitExclusiveOffers: 'Ưu đãi độc quyền theo mùa',
    benefitEarlyCheckin: 'Nhận phòng sớm (10:00)',
    benefitMiniBarFree: 'Minibar miễn phí',
    locked: 'Khoá',
    unlocked: 'Đã mở khóa',
    settings: 'Cài đặt',
    settingsProfile: 'Hồ sơ cá nhân',
    settingsChangePassword: 'Đổi mật khẩu',
    settingsPasswordHint: 'Mật khẩu mới phải có ít nhất 8 ký tự.',
    settingsFullName: 'Họ tên',
    settingsFullNamePlaceholder: 'Nguyễn Văn A',
    settingsPhone: 'Số điện thoại',
    settingsPhonePlaceholder: '0901 234 567',
    settingsEmail: 'Email',
    settingsSave: 'Lưu thay đổi',
    settingsSaving: 'Đang lưu...',
    settingsProfileSaved: 'Đã lưu thông tin cá nhân!',
    settingsNameRequired: 'Vui lòng nhập họ tên',
    settingsCurrentPassword: 'Mật khẩu hiện tại',
    settingsNewPassword: 'Mật khẩu mới',
    settingsConfirmPassword: 'Xác nhận mật khẩu mới',
    settingsUpdatePassword: 'Cập nhật mật khẩu',
    settingsPwdAllFields: 'Vui lòng điền đầy đủ các trường mật khẩu',
    settingsPwdTooShort: 'Mật khẩu mới phải có ít nhất 8 ký tự',
    settingsPwdMismatch: 'Mật khẩu mới không khớp',
    settingsPwdChanged: 'Đổi mật khẩu thành công!',
    settingsChangeAvatar: 'Đổi ảnh đại diện',
    settingsAvatarHint: 'JPG, PNG. Tối đa 5MB.',
    settingsAvatarUpdated: 'Đã cập nhật ảnh đại diện!',
    settingsAvatarTooLarge: 'Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.',
    settingsSocial: 'Liên kết mạng xã hội',
    settingsSocialHint: 'Liên kết tài khoản mạng xã hội để đăng nhập nhanh hơn.',
    settingsSocialConnected: 'Đã liên kết',
    settingsSocialNotConnected: 'Chưa liên kết',
    settingsSocialConnect: 'Liên kết',
    settingsSocialDisconnect: 'Hủy liên kết',
    settingsSocialGoogle: 'Google',
    settingsSocialUnlinked: 'Đã hủy liên kết tài khoản',
    settingsSocialLinking: 'Đang liên kết...',
    settingsSocialUnlinking: 'Đang hủy liên kết...',
    settingsSocialNoConnections: 'Chưa có tài khoản mạng xã hội nào được liên kết.',
  },
  en: {
    dashboard: 'Dashboard',
    backHome: 'Back to Home',
    overview: 'Overview',
    rewards: 'Rewards',
    myBookings: 'My Bookings',
    allBookings: 'All Bookings',
    totalBookings: 'Total Bookings',
    pendingBookings: 'Pending',
    confirmedBookings: 'Confirmed',
    totalRevenue: 'Total Revenue',
    totalSpent: 'Total Spent',
    rewardPoints: 'Reward Points',
    membershipTier: 'Membership Tier',
    pointsToNext: 'points to next tier',
    room: 'Room',
    guest: 'Guest',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    price: 'Price',
    status: 'Status',
    phone: 'Phone',
    email: 'Email',
    name: 'Name',
    bookedAt: 'Booked at',
    confirm: 'Confirm',
    cancel: 'Cancel',
    noBookings: 'No bookings yet',
    noBookingsAdmin: 'No bookings from guests yet',
    profile: 'Profile',
    accountInfo: 'Account Information',
    memberSince: 'Member since',
    adminPanel: 'Admin',
    userPanel: 'User',
    confirmAction: 'Are you sure you want to change this booking status?',
    guests: 'guests',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    diamond: 'Diamond',
    tierBenefits: 'Tier Benefits',
    benefitsTitle: 'Rewards & Benefits',
    benefitsSubtitle: 'Exclusive perks based on your membership tier',
    allTiers: 'Membership Tiers',
    rewardHistory: 'Reward History',
    nightsStayed: 'Nights Stayed',
    avgStay: 'Avg Spend / Booking',
    upgradeNow: 'Upgrade',
    pointsEarned: 'Points Earned',
    earnedFromBooking: 'Earned from booking',
    memberStatus: 'Member Status',
    active: 'Active',
    benefitFreeBreakfast: 'Free breakfast buffet',
    benefitLateCheckout: 'Late checkout (2 PM)',
    benefitRoomUpgrade: 'Free room upgrade',
    benefitFreeWifi: 'Free high-speed Wi-Fi',
    benefitSpaDiscount: '20% off Spa services',
    benefitAirportPickup: 'Airport pickup',
    benefitWelcomeGift: 'Welcome gift in room',
    benefitPriorityCheckin: 'Priority check-in',
    benefitFreeNight: '1 free night per 10 nights',
    benefitLoungeAccess: 'VIP lounge access',
    benefitPersonalConcierge: '24/7 personal concierge',
    benefitExclusiveOffers: 'Exclusive seasonal offers',
    benefitEarlyCheckin: 'Early check-in (10 AM)',
    benefitMiniBarFree: 'Free minibar',
    locked: 'Locked',
    unlocked: 'Unlocked',
    settings: 'Settings',
    settingsProfile: 'Personal Profile',
    settingsChangePassword: 'Change Password',
    settingsPasswordHint: 'New password must be at least 8 characters.',
    settingsFullName: 'Full Name',
    settingsFullNamePlaceholder: 'John Doe',
    settingsPhone: 'Phone Number',
    settingsPhonePlaceholder: '+1 234 567 890',
    settingsEmail: 'Email',
    settingsSave: 'Save Changes',
    settingsSaving: 'Saving...',
    settingsProfileSaved: 'Profile updated successfully!',
    settingsNameRequired: 'Please enter your name',
    settingsCurrentPassword: 'Current Password',
    settingsNewPassword: 'New Password',
    settingsConfirmPassword: 'Confirm New Password',
    settingsUpdatePassword: 'Update Password',
    settingsPwdAllFields: 'Please fill in all password fields',
    settingsPwdTooShort: 'New password must be at least 8 characters',
    settingsPwdMismatch: 'New passwords do not match',
    settingsPwdChanged: 'Password changed successfully!',
    settingsChangeAvatar: 'Change avatar',
    settingsAvatarHint: 'JPG, PNG. Max 5MB.',
    settingsAvatarUpdated: 'Avatar updated successfully!',
    settingsAvatarTooLarge: 'Image too large. Please choose one under 5MB.',
    settingsSocial: 'Social Connections',
    settingsSocialHint: 'Link your social accounts for faster sign-in.',
    settingsSocialConnected: 'Connected',
    settingsSocialNotConnected: 'Not connected',
    settingsSocialConnect: 'Connect',
    settingsSocialDisconnect: 'Disconnect',
    settingsSocialGoogle: 'Google',
    settingsSocialUnlinked: 'Account disconnected successfully',
    settingsSocialLinking: 'Linking...',
    settingsSocialUnlinking: 'Disconnecting...',
    settingsSocialNoConnections: 'No social accounts connected yet.',
  },
  kr: {
    dashboard: '대시보드',
    backHome: '홈으로',
    overview: '개요',
    rewards: '리워드',
    myBookings: '내 예약',
    allBookings: '전체 예약',
    totalBookings: '총 예약',
    pendingBookings: '대기 중',
    confirmedBookings: '확정됨',
    totalRevenue: '총 수익',
    totalSpent: '총 지출',
    rewardPoints: '리워드 포인트',
    membershipTier: '멤버십 등급',
    pointsToNext: '포인트로 다음 등급',
    room: '객실',
    guest: '게스트',
    checkIn: '체크인',
    checkOut: '체크아웃',
    price: '가격',
    status: '상태',
    phone: '전화',
    email: '이메일',
    name: '이름',
    bookedAt: '예약 시간',
    confirm: '확정',
    cancel: '취소',
    noBookings: '예약이 없습니다',
    noBookingsAdmin: '게스트 예약이 없습니다',
    profile: '프로필',
    accountInfo: '계정 정보',
    memberSince: '가입일',
    adminPanel: '관리자',
    userPanel: '사용자',
    confirmAction: '이 예약 상태를 변경하시겠습니까?',
    guests: '명',
    silver: '실버',
    gold: '골드',
    platinum: '플래티넘',
    diamond: '다이아몬드',
    tierBenefits: '등급 혜택',
    benefitsTitle: '리워드 & 혜택',
    benefitsSubtitle: '멤버십 등급에 따른 독점 혜택',
    allTiers: '멤버십 등급',
    rewardHistory: '리워드 내역',
    nightsStayed: '숙박 일수',
    avgStay: '예약당 평균 지출',
    upgradeNow: '업그레이드',
    pointsEarned: '적립 포인트',
    earnedFromBooking: '예약으로 적립',
    memberStatus: '회원 상태',
    active: '활성',
    benefitFreeBreakfast: '무료 조식 뷔페',
    benefitLateCheckout: '늦은 체크아웃 (14:00)',
    benefitRoomUpgrade: '무료 객실 업그레이드',
    benefitFreeWifi: '무료 고속 Wi-Fi',
    benefitSpaDiscount: '스파 20% 할인',
    benefitAirportPickup: '공항 픽업',
    benefitWelcomeGift: '웰컴 기프트',
    benefitPriorityCheckin: '우선 체크인',
    benefitFreeNight: '10박당 1박 무료',
    benefitLoungeAccess: 'VIP 라운지 이용',
    benefitPersonalConcierge: '24시간 전용 컨시어지',
    benefitExclusiveOffers: '시즌별 독점 혜택',
    benefitEarlyCheckin: '이른 체크인 (10:00)',
    benefitMiniBarFree: '무료 미니바',
    locked: '잠김',
    unlocked: '사용 가능',
    settings: '설정',
    settingsProfile: '개인 프로필',
    settingsChangePassword: '비밀번호 변경',
    settingsPasswordHint: '새 비밀번호는 최소 8자 이상이어야 합니다.',
    settingsFullName: '이름',
    settingsFullNamePlaceholder: '홍길동',
    settingsPhone: '전화번호',
    settingsPhonePlaceholder: '010 1234 5678',
    settingsEmail: '이메일',
    settingsSave: '변경사항 저장',
    settingsSaving: '저장 중...',
    settingsProfileSaved: '프로필이 성공적으로 업데이트되었습니다!',
    settingsNameRequired: '이름을 입력해 주세요',
    settingsCurrentPassword: '현재 비밀번호',
    settingsNewPassword: '새 비밀번호',
    settingsConfirmPassword: '새 비밀번호 확인',
    settingsUpdatePassword: '비밀번호 업데이트',
    settingsPwdAllFields: '모든 비밀번호 필드를 입력해 주세요',
    settingsPwdTooShort: '새 비밀번호는 최소 8자 이상이어야 합니다',
    settingsPwdMismatch: '새 비밀번호가 일치하지 않습니다',
    settingsPwdChanged: '비밀번호가 성공적으로 변경되었습니다!',
    settingsChangeAvatar: '아바타 변경',
    settingsAvatarHint: 'JPG, PNG. 최대 5MB.',
    settingsAvatarUpdated: '아바타가 성공적으로 업데이트되었습니다!',
    settingsAvatarTooLarge: '이미지가 너무 큽니다. 5MB 이하의 이미지를 선택해 주세요.',
    settingsSocial: '소셜 연결',
    settingsSocialHint: '소셜 계정을 연결하여 더 빠르게 로그인하세요.',
    settingsSocialConnected: '연결됨',
    settingsSocialNotConnected: '연결되지 않음',
    settingsSocialConnect: '연결',
    settingsSocialDisconnect: '연결 해제',
    settingsSocialGoogle: 'Google',
    settingsSocialUnlinked: '계정 연결이 해제되었습니다',
    settingsSocialLinking: '연결 중...',
    settingsSocialUnlinking: '해제 중...',
    settingsSocialNoConnections: '연결된 소셜 계정이 없습니다.',
  },
};

type Benefit = {
  key: string;
  icon: typeof Gift;
  tier: TierKey;
};

const allBenefits: Benefit[] = [
  { key: 'benefitFreeBreakfast', icon: Coffee, tier: 'silver' },
  { key: 'benefitFreeWifi', icon: Zap, tier: 'silver' },
  { key: 'benefitEarlyCheckin', icon: Clock, tier: 'silver' },
  { key: 'benefitLateCheckout', icon: Moon, tier: 'gold' },
  { key: 'benefitSpaDiscount', icon: Sparkles, tier: 'gold' },
  { key: 'benefitWelcomeGift', icon: Gift, tier: 'gold' },
  { key: 'benefitRoomUpgrade', icon: TrendingUp, tier: 'platinum' },
  { key: 'benefitPriorityCheckin', icon: Shield, tier: 'platinum' },
  { key: 'benefitAirportPickup', icon: Plane, tier: 'platinum' },
  { key: 'benefitFreeNight', icon: BedDouble, tier: 'platinum' },
  { key: 'benefitLoungeAccess', icon: Wine, tier: 'diamond' },
  { key: 'benefitMiniBarFree', icon: Coffee, tier: 'diamond' },
  { key: 'benefitPersonalConcierge', icon: Star, tier: 'diamond' },
  { key: 'benefitExclusiveOffers', icon: Award, tier: 'diamond' },
];

const tierOrder: Record<TierKey, number> = { silver: 0, gold: 1, platinum: 2, diamond: 3 };

export default function Dashboard({ onBack }: DashboardProps) {
  const { user, isSignedIn } = useAuth();
  const { lang } = useApp();
  const tr = tDashboard[lang];
  const [tab, setTab] = useState<'overview' | 'rewards' | 'bookings' | 'settings'>('overview');
  const [adminMode, setAdminMode] = useState(false);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileDate, setProfileDate] = useState<string>('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (!user?.isAdmin) {
        query = query.eq('clerk_user_id', user?.id || '');
      }
      const { data } = await query;
      setBookings((data as BookingRow[]) || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.created_at) setProfileDate(data.created_at);
    } catch {
      /* noop */
    }
  }, [user]);

  useEffect(() => {
    if (isSignedIn) {
      loadBookings();
      loadProfile();
    }
  }, [isSignedIn, loadBookings, loadProfile]);

  const updateBookingStatus = async (id: string, status: string) => {
    if (!confirm(tr.confirmAction)) return;
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    }
  };

  if (!isSignedIn || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (user.isAdmin && adminMode) {
    return <AdminPanel onBack={() => setAdminMode(false)} />;
  }

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const totalSpent = confirmedBookings.reduce((sum, b) => sum + b.total_price, 0);
  const totalRevenue = totalSpent;
  const totalNights = confirmedBookings.reduce((sum, b) => {
    const nights = Math.max(1, Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000));
    return sum + nights;
  }, 0);
  const avgSpend = confirmedBookings.length > 0 ? Math.round(totalSpent / confirmedBookings.length) : 0;

  const currentTier = getTier(totalSpent);
  const nextTier = getNextTier(totalSpent);
  const rewardPoints = Math.floor(totalSpent / 1000) * currentTier.pointsMultiplier;
  const pointsToNext = nextTier ? Math.max(0, Math.floor((nextTier.threshold - totalSpent) / 1000) * currentTier.pointsMultiplier - rewardPoints) : 0;
  const tierProgress = nextTier
    ? Math.min(100, Math.round(((totalSpent - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100))
    : 100;

  const stats = [
    { label: tr.totalBookings, value: String(bookings.length), icon: BedDouble, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30' },
    { label: tr.pendingBookings, value: String(pendingCount), icon: Clock, color: 'text-warning-600 bg-warning-50 dark:bg-warning-900/30' },
    { label: tr.confirmedBookings, value: String(confirmedCount), icon: CheckCircle2, color: 'text-success-600 bg-success-50 dark:bg-success-900/30' },
    ...(user.isAdmin
      ? [{ label: tr.totalRevenue, value: formatPrice(totalRevenue), icon: DollarSign, color: 'text-accent-600 bg-accent-50 dark:bg-accent-900/30' }]
      : [
          { label: tr.totalSpent, value: formatPrice(totalSpent), icon: DollarSign, color: 'text-accent-600 bg-accent-50 dark:bg-accent-900/30' },
          { label: tr.nightsStayed, value: String(totalNights), icon: Moon, color: 'text-secondary-600 bg-secondary-100 dark:bg-secondary-700' },
          { label: tr.rewardPoints, value: rewardPoints.toLocaleString(), icon: Star, color: 'text-warning-600 bg-warning-50 dark:bg-warning-900/30' },
        ]),
  ];

  const formatDate = (d: string) => new Date(d).toLocaleDateString(lang === 'vi' ? 'vi-VN' : lang === 'kr' ? 'ko-KR' : 'en-US');

  const userBenefits = allBenefits.filter((b) => tierOrder[b.tier] <= tierOrder[currentTier.key]);
  const lockedBenefits = allBenefits.filter((b) => tierOrder[b.tier] > tierOrder[currentTier.key]);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600 text-white">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-secondary-900 dark:text-white">{tr.dashboard}</h1>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.isAdmin ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'}`}>
                  {user.isAdmin ? tr.adminPanel : tr.userPanel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {!user.isAdmin && (
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${currentTier.colors.badge}`}>
                <currentTier.icon className="w-3.5 h-3.5" />
                {tr[currentTier.key]}
              </div>
            )}
            {user.isAdmin && (
              <button
                onClick={() => setAdminMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                CMS
              </button>
            )}
            <ThemeToggle variant="navbar" solid />
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-600 text-white text-sm font-bold overflow-hidden shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName || 'Avatar'} className="w-full h-full object-cover" />
              ) : (
                user.initials
              )}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-secondary-900 dark:text-white">{user.fullName || tr.userPanel}</div>
              {user.email && <div className="text-xs text-secondary-500 dark:text-secondary-400">{user.email}</div>}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-secondary-800 rounded-xl p-1.5 border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm w-fit overflow-x-auto">
          {(['overview', 'rewards', 'bookings', 'settings'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${tab === tabKey ? 'bg-primary-600 text-white shadow-md' : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'}`}
            >
              {tabKey === 'overview' ? tr.overview : tabKey === 'rewards' ? tr.rewards : tabKey === 'bookings' ? (user.isAdmin ? tr.allBookings : tr.myBookings) : tr.settings}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
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

            {/* VIP Membership Card + Profile */}
            {!user.isAdmin && (
              <div className="grid lg:grid-cols-5 gap-6">
                {/* VIP Card */}
                <div className="lg:col-span-3">
                  <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${currentTier.colors.gradient} shadow-2xl ring-1 ring-white/20 dark:ring-black/30`}>
                    {/* Decorative circles */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/20" />
                    <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/15" />
                    <div className="absolute top-1/2 right-8 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-white/5" />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-8">
                        <div>
                          <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1.5">{tr.membershipTier}</div>
                          <div className="flex items-center gap-2">
                            <currentTier.icon className="w-8 h-8 text-white drop-shadow-lg" />
                            <span className="font-display text-3xl font-bold text-white drop-shadow-lg">{tr[currentTier.key]}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1.5">{tr.rewardPoints}</div>
                          <div className="font-display text-3xl font-bold text-white flex items-center gap-1.5 drop-shadow-lg">
                            <Star className="w-6 h-6 fill-white" />
                            {rewardPoints.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Progress to next tier */}
                      <div className="mb-6">
                        {nextTier ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white/80 text-sm font-medium">{tr.pointsToNext}</span>
                              <span className="text-white font-bold text-sm">
                                {tr[nextTier.key]} · {pointsToNext.toLocaleString()} pts
                              </span>
                            </div>
                            <div className="h-3.5 rounded-full bg-white/30 overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${tierProgress}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs text-white/70">
                              <span className="flex items-center gap-1"><currentTier.icon className="w-3 h-3" /> {tr[currentTier.key]}</span>
                              <span className="flex items-center gap-1">{tr[nextTier.key]} <nextTier.icon className="w-3 h-3" /></span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-white">
                            <Crown className="w-5 h-5" />
                            <span className="font-semibold">Highest tier reached — enjoy all benefits!</span>
                          </div>
                        )}
                      </div>

                      {/* Member info bar */}
                      <div className="flex items-center justify-between bg-white/20 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/15 shadow-lg">
                        <div>
                          <div className="text-white/60 text-xs uppercase tracking-wide">{tr.name}</div>
                          <div className="text-white font-bold">{user.fullName || user.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white/60 text-xs uppercase tracking-wide">{tr.memberStatus}</div>
                          <div className="text-white font-bold flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-success-400 animate-pulse" />
                            {tr.active}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Card */}
                <div className="lg:col-span-2">
                  <div className="relative bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 p-6 shadow-md hover:shadow-lg transition-shadow h-full overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
                    <h2 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-5">{tr.accountInfo}</h2>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xl font-bold shrink-0 overflow-hidden ring-2 ring-primary-200 dark:ring-primary-800 shadow-md">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.fullName || 'Avatar'} className="w-full h-full object-cover" />
                        ) : (
                          user.initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-lg font-bold text-secondary-900 dark:text-white truncate">{user.fullName || tr.userPanel}</div>
                        <div className="text-sm text-secondary-500 dark:text-secondary-400 truncate">{user.email}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50/70 dark:bg-secondary-700/40 border border-primary-100/60 dark:border-secondary-700/60">
                        <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-secondary-400 dark:text-secondary-500 uppercase tracking-wide">{tr.email}</div>
                          <div className="text-sm font-medium text-secondary-800 dark:text-secondary-100 truncate">{user.email || '—'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50/70 dark:bg-secondary-700/40 border border-primary-100/60 dark:border-secondary-700/60">
                        <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-secondary-400 dark:text-secondary-500 uppercase tracking-wide">{tr.memberSince}</div>
                          <div className="text-sm font-medium text-secondary-800 dark:text-secondary-100">{profileDate ? formatDate(profileDate) : '—'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-secondary-700/40 dark:to-secondary-700/20 border border-primary-100/60 dark:border-secondary-700/60 text-center">
                          <div className="text-2xl font-display font-bold text-primary-700 dark:text-primary-300">{totalNights}</div>
                          <div className="text-xs text-secondary-400 dark:text-secondary-500 uppercase tracking-wide mt-0.5">{tr.nightsStayed}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100/40 dark:from-secondary-700/40 dark:to-secondary-700/20 border border-accent-100/50 dark:border-secondary-700/60 text-center">
                          <div className="text-2xl font-display font-bold text-accent-700 dark:text-accent-300">{avgSpend > 0 ? formatPrice(avgSpend) : '—'}</div>
                          <div className="text-xs text-secondary-400 dark:text-secondary-500 uppercase tracking-wide mt-0.5">{tr.avgStay}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Profile Card */}
            {user.isAdmin && (
              <div className="relative bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 p-6 shadow-md overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600" />
                <h2 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-5">{tr.accountInfo}</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xl font-bold overflow-hidden ring-2 ring-primary-200 dark:ring-primary-800 shadow-md">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName || 'Avatar'} className="w-full h-full object-cover" />
                    ) : (
                      user.initials
                    )}
                  </div>
                  <div>
                    <div className="font-display text-xl font-bold text-secondary-900 dark:text-white">{user.fullName || tr.userPanel}</div>
                    <div className="text-sm text-secondary-500 dark:text-secondary-400">{user.email}</div>
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
                      <TrendingUp className="w-3 h-3" /> {tr.adminPanel}
                    </span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary-50 dark:bg-secondary-700/50">
                    <Mail className="w-5 h-5 text-primary-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-secondary-400 dark:text-secondary-500 uppercase tracking-wide">{tr.email}</div>
                      <div className="text-sm font-medium text-secondary-800 dark:text-secondary-100 truncate">{user.email || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary-50 dark:bg-secondary-700/50">
                    <Calendar className="w-5 h-5 text-primary-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-secondary-400 dark:text-secondary-500 uppercase tracking-wide">{tr.memberSince}</div>
                      <div className="text-sm font-medium text-secondary-800 dark:text-secondary-100">{profileDate ? formatDate(profileDate) : '—'}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setAdminMode(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <Shield className="w-4 h-4" />
                  Mở CMS Quản trị
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rewards Tab */}
        {tab === 'rewards' && !user.isAdmin && (
          <div className="space-y-6">
            {/* Tier Ladder */}
            <div>
              <h2 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-4">{tr.allTiers}</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {tiers.map((tier) => {
                  const isCurrent = tier.key === currentTier.key;
                  const isUnlocked = tierOrder[tier.key] <= tierOrder[currentTier.key];
                  const TierIcon = tier.icon;
                  return (
                    <div
                      key={tier.key}
                      className={`relative rounded-2xl p-5 border-2 transition-all ${
                        isCurrent
                          ? `${tier.colors.border} ${tier.colors.bg} shadow-2xl scale-105 ring-2 ${tier.colors.ring}`
                          : isUnlocked
                          ? 'border-secondary-200/70 dark:border-secondary-700/80 bg-white dark:bg-secondary-800 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                          : 'border-dashed border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 opacity-60'
                      }`}
                    >
                      {isCurrent && (
                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-xs font-bold ${tier.colors.badge} whitespace-nowrap shadow-md`}>
                          {tr.active}
                        </div>
                      )}
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 ${isUnlocked ? tier.colors.badge : 'bg-secondary-200 text-secondary-400 dark:bg-secondary-700 dark:text-secondary-500'} shadow-sm`}>
                        <TierIcon className="w-7 h-7" />
                      </div>
                      <div className="font-display text-lg font-bold text-secondary-900 dark:text-white">{tr[tier.key]}</div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                        {tier.threshold === 0 ? tr.silver : formatPrice(tier.threshold)}
                      </div>
                      <div className="text-xs font-semibold mt-2 text-secondary-400 dark:text-secondary-500">
                        {tier.pointsMultiplier}x {tr.pointsEarned}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Benefits Grid */}
            <div>
              <h2 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-1">{tr.benefitsTitle}</h2>
              <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-4">{tr.benefitsSubtitle}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userBenefits.map((benefit) => {
                  const Icon = benefit.icon;
                  const tier = tiers.find((t) => t.key === benefit.tier)!;
                  return (
                    <div key={benefit.key} className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                      <div className="flex items-start gap-3">
                        <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${tier.colors.badge}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-secondary-900 dark:text-white text-sm">{tr[benefit.key]}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <tier.icon className={`w-3.5 h-3.5 ${tier.colors.text}`} />
                            <span className={`text-xs font-semibold ${tier.colors.text}`}>{tr[tier.key]}</span>
                          </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-success-500 ml-auto shrink-0" />
                      </div>
                    </div>
                  );
                })}
                {lockedBenefits.map((benefit) => {
                  const Icon = benefit.icon;
                  const tier = tiers.find((t) => t.key === benefit.tier)!;
                  return (
                    <div key={benefit.key} className="bg-secondary-50 dark:bg-secondary-800/50 rounded-2xl border border-dashed border-secondary-200 dark:border-secondary-700 p-5 opacity-60">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-secondary-200 text-secondary-400 dark:bg-secondary-700 dark:text-secondary-500 shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-secondary-500 dark:text-secondary-400 text-sm">{tr[benefit.key]}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <tier.icon className="w-3.5 h-3.5 text-secondary-400" />
                            <span className="text-xs font-semibold text-secondary-400">{tr[tier.key]}</span>
                          </div>
                        </div>
                        <div className="ml-auto text-secondary-300 dark:text-secondary-600 text-xs font-semibold shrink-0 flex items-center gap-1">
                          <Crown className="w-4 h-4" />
                          {tr.locked}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reward History */}
            <div>
              <h2 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-4">{tr.rewardHistory}</h2>
              {confirmedBookings.length === 0 ? (
                <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 p-8 text-center shadow-sm">
                  <Star className="w-10 h-10 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
                  <p className="text-secondary-500 dark:text-secondary-400 text-sm">{tr.noBookings}</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-sm divide-y divide-secondary-100 dark:divide-secondary-700/50">
                  {confirmedBookings.map((b) => {
                    const points = Math.floor(b.total_price / 1000) * currentTier.pointsMultiplier;
                    return (
                      <div key={b.id} className="flex items-center gap-4 p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/30 transition-colors">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400 shrink-0">
                          <Star className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-secondary-900 dark:text-white text-sm">{b.room_name}</div>
                          <div className="text-xs text-secondary-400 dark:text-secondary-500">
                            {formatDate(b.check_in)} → {formatDate(b.check_out)} · {tr.earnedFromBooking}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display font-bold text-warning-600 dark:text-warning-400">+{points.toLocaleString()}</div>
                          <div className="text-xs text-secondary-400 dark:text-secondary-500">pts</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {tab === 'bookings' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200 dark:border-secondary-700 p-12 text-center shadow-sm">
                <BedDouble className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-4" />
                <p className="text-secondary-500 dark:text-secondary-400 text-lg font-medium">
                  {user.isAdmin ? tr.noBookingsAdmin : tr.noBookings}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 shadow-md overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-secondary-200 dark:border-secondary-700">
                        <th className="text-left px-5 py-3.5 font-semibold text-secondary-600 dark:text-secondary-300 uppercase text-xs tracking-wide">{tr.name}</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-secondary-600 dark:text-secondary-300 uppercase text-xs tracking-wide">{tr.room}</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-secondary-600 dark:text-secondary-300 uppercase text-xs tracking-wide">{tr.checkIn}</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-secondary-600 dark:text-secondary-300 uppercase text-xs tracking-wide">{tr.checkOut}</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-secondary-600 dark:text-secondary-300 uppercase text-xs tracking-wide">{tr.guest}</th>
                        <th className="text-right px-5 py-3.5 font-semibold text-secondary-600 dark:text-secondary-300 uppercase text-xs tracking-wide">{tr.price}</th>
                        <th className="text-center px-5 py-3.5 font-semibold text-secondary-600 dark:text-secondary-300 uppercase text-xs tracking-wide">{tr.status}</th>
                        {user.isAdmin && <th className="text-right px-5 py-3.5 font-semibold text-secondary-600 dark:text-secondary-300 uppercase text-xs tracking-wide">{tr.status}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => {
                        const sc = statusConfig[b.status] || statusConfig.pending;
                        const StatusIcon = sc.icon;
                        return (
                          <tr key={b.id} className="border-b border-secondary-100 dark:border-secondary-700/50 hover:bg-secondary-50 dark:hover:bg-secondary-700/30 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-medium text-secondary-900 dark:text-white">{b.user_name}</div>
                              {user.isAdmin && <div className="text-xs text-secondary-400 dark:text-secondary-500">{b.user_email}</div>}
                            </td>
                            <td className="px-5 py-4 text-secondary-700 dark:text-secondary-200">{b.room_name}</td>
                            <td className="px-5 py-4 text-secondary-700 dark:text-secondary-200">{formatDate(b.check_in)}</td>
                            <td className="px-5 py-4 text-secondary-700 dark:text-secondary-200">{formatDate(b.check_out)}</td>
                            <td className="px-5 py-4 text-secondary-700 dark:text-secondary-200">{b.guests} {tr.guests}</td>
                            <td className="px-5 py-4 text-right font-semibold text-secondary-900 dark:text-white">{formatPrice(b.total_price)}</td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${sc.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {b.status}
                              </span>
                            </td>
                            {user.isAdmin && (
                              <td className="px-5 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  {b.status !== 'confirmed' && (
                                    <button
                                      onClick={() => updateBookingStatus(b.id, 'confirmed')}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-900/30 dark:text-success-300 transition-colors"
                                    >
                                      {tr.confirm}
                                    </button>
                                  )}
                                  {b.status !== 'cancelled' && (
                                    <button
                                      onClick={() => updateBookingStatus(b.id, 'cancelled')}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-error-50 text-error-700 hover:bg-error-100 dark:bg-error-900/30 dark:text-error-300 transition-colors"
                                    >
                                      {tr.cancel}
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y divide-secondary-100 dark:divide-secondary-700/50">
                  {bookings.map((b) => {
                    const sc = statusConfig[b.status] || statusConfig.pending;
                    const StatusIcon = sc.icon;
                    return (
                      <div key={b.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-secondary-900 dark:text-white">{b.user_name}</div>
                            {user.isAdmin && <div className="text-xs text-secondary-400 dark:text-secondary-500">{b.user_email}</div>}
                            <div className="text-sm text-secondary-600 dark:text-secondary-300 mt-0.5">{b.room_name}</div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {b.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1.5 text-secondary-600 dark:text-secondary-300">
                            <Calendar className="w-4 h-4 text-primary-400" /> {formatDate(b.check_in)}
                          </div>
                          <div className="flex items-center gap-1.5 text-secondary-600 dark:text-secondary-300">
                            <Calendar className="w-4 h-4 text-primary-400" /> {formatDate(b.check_out)}
                          </div>
                          <div className="flex items-center gap-1.5 text-secondary-600 dark:text-secondary-300">
                            <Users className="w-4 h-4 text-primary-400" /> {b.guests} {tr.guests}
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold text-secondary-900 dark:text-white">
                            <DollarSign className="w-4 h-4 text-primary-400" /> {formatPrice(b.total_price)}
                          </div>
                          {b.phone && (
                            <div className="flex items-center gap-1.5 text-secondary-600 dark:text-secondary-300">
                              <Phone className="w-4 h-4 text-primary-400" /> {b.phone}
                            </div>
                          )}
                        </div>
                        {user.isAdmin && (
                          <div className="flex gap-2 pt-2">
                            {b.status !== 'confirmed' && (
                              <button
                                onClick={() => updateBookingStatus(b.id, 'confirmed')}
                                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-900/30 dark:text-success-300 transition-colors"
                              >
                                {tr.confirm}
                              </button>
                            )}
                            {b.status !== 'cancelled' && (
                              <button
                                onClick={() => updateBookingStatus(b.id, 'cancelled')}
                                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-error-50 text-error-700 hover:bg-error-100 dark:bg-error-900/30 dark:text-error-300 transition-colors"
                              >
                                {tr.cancel}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <ProfileSettings tr={tr} />
        )}
      </div>
    </div>
  );
}
