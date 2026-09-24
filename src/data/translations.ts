import type { Language } from '@/data/hotelData';

export type TranslationKey =
  | 'siteName'
  | 'siteTagline'
  | 'navHome'
  | 'navAbout'
  | 'navRooms'
  | 'navAmenities'
  | 'navGallery'
  | 'navContact'
  | 'bookNow'
  | 'heroBadge'
  | 'heroTitle'
  | 'heroSubtitle'
  | 'checkIn'
  | 'checkOut'
  | 'guests'
  | 'search'
  | 'guest1'
  | 'guest2'
  | 'guest3'
  | 'guest4'
  | 'guest5'
  | 'aboutLabel'
  | 'aboutTitle'
  | 'aboutP1'
  | 'aboutP2'
  | 'wifiFree'
  | 'parking'
  | 'security'
  | 'reception247'
  | 'roomsLabel'
  | 'roomsTitle'
  | 'roomsSubtitle'
  | 'perNight'
  | 'bookThisRoom'
  | 'amenitiesLabel'
  | 'amenitiesTitle'
  | 'amenitiesSubtitle'
  | 'learnMore'
  | 'galleryLabel'
  | 'galleryTitle'
  | 'gallerySubtitle'
  | 'galleryAll'
  | 'galleryRooms'
  | 'galleryAmenities'
  | 'galleryDining'
  | 'testimonialsLabel'
  | 'testimonialsTitle'
  | 'testimonialsRating'
  | 'contactTitle'
  | 'contactAddress'
  | 'contactPhone'
  | 'contactEmail'
  | 'receptionHours'
  | 'quickLinks'
  | 'about'
  | 'rooms'
  | 'amenities'
  | 'gallery'
  | 'newsletter'
  | 'newsletterText'
  | 'emailPlaceholder'
  | 'subscribe'
  | 'subscribed'
  | 'rights'
  | 'terms'
  | 'privacy'
  | 'faq'
  | 'bookingTitle'
  | 'bookingSubtitle'
  | 'selectRoom'
  | 'fullName'
  | 'phone'
  | 'email'
  | 'selectedRoom'
  | 'numNights'
  | 'pricePerNight'
  | 'total'
  | 'confirmBooking'
  | 'processing'
  | 'bookingSuccess'
  | 'bookingThanks'
  | 'bookingEmailSent'
  | 'bookingEmailSent2'
  | 'nightsUnit'
  | 'finish'
  | 'backToTop'
  | 'themeLight'
  | 'themeDark'
  | 'language'
  | 'signIn'
  | 'signUp'
  | 'signOut'
  | 'signInTitle'
  | 'signUpTitle'
  | 'signInSubtitle'
  | 'signUpSubtitle'
  | 'authEmail'
  | 'authPassword'
  | 'authName'
  | 'authConfirmPassword'
  | 'authSignInBtn'
  | 'authSignUpBtn'
  | 'authSigningIn'
  | 'authSigningUp'
  | 'authNoAccount'
  | 'authHaveAccount'
  | 'authPasswordMismatch'
  | 'authNamePlaceholder'
  | 'authEmailPlaceholder'
  | 'authPasswordPlaceholder'
  | 'welcomeBack'
  | 'myAccount'
  | 'authSuccess'
  | 'authSuccessMsg'
  | 'authInvalidCreds'
  | 'authEmailExists'
  | 'authWeakPassword'
  | 'authGoogleBtn'
  | 'authOr'
  | 'dashboard'
  | 'guestUser';

export type TranslationDict = Record<TranslationKey, string>;

export const translations: Record<Language, TranslationDict> = {
  vi: {
    siteName: 'AN52',
    siteTagline: 'Hotel',
    navHome: 'Trang chủ',
    navAbout: 'Giới thiệu',
    navRooms: 'Phòng',
    navAmenities: 'Tiện ích',
    navGallery: 'Thư viện',
    navContact: 'Liên hệ',
    bookNow: 'Đặt phòng ngay',
    heroBadge: '4.7/5 · 15.000+ khách hài lòng',
    heroTitle: 'AN52 Hotel',
    heroSubtitle: 'Khách sạn hiện đại, ấm cúng và tiện nghi — nơi bạn nghỉ ngơi trọn vẹn sau mỗi ngày khám phá.',
    checkIn: 'Nhận phòng',
    checkOut: 'Trả phòng',
    guests: 'Khách',
    search: 'Tìm phòng',
    guest1: '1 khách',
    guest2: '2 khách',
    guest3: '3 khách',
    guest4: '4 khách',
    guest5: '5+ khách',
    aboutLabel: 'Về chúng tôi',
    aboutTitle: 'Nơi sự thoải mái gặp gỡ tiện nghi hiện đại',
    aboutP1: 'AN52 Hotel tự hào mang đến trải nghiệm lưu trú chất lượng với giá cả hợp lý. Không quá xa hoa nhưng đầy đủ tiện nghi, chúng tôi tập trung vào những gì quan trọng nhất: sự sạch sẽ, dịch vụ chu đáo và không gian thư giãn.',
    aboutP2: 'Tọa lạc tại vị trí thuận tiện, gần các điểm tham quan và trung tâm thương mại, AN52 Hotel là lựa chọn lý tưởng cho cả khách du lịch lẫn người đi công tác. Với 128 phòng đa dạng, nhà hàng, hồ bơi, spa và phòng gym, mọi nhu cầu của bạn đều được chăm sóc.',
    wifiFree: 'Wifi miễn phí',
    parking: 'Bãi đỗ xe',
    security: 'An ninh 24/7',
    reception247: 'Lễ tân 24/7',
    roomsLabel: 'Chỗ ở',
    roomsTitle: 'Phòng đa dạng, tiện nghi',
    roomsSubtitle: 'Từ phòng tiêu nhật đến suite cao cấp, chọn lựa phù hợp với nhu cầu và ngân sách của bạn.',
    perNight: '/đêm',
    bookThisRoom: 'Đặt phòng này',
    amenitiesLabel: 'Tiện ích',
    amenitiesTitle: 'Mọi thứ bạn cần đều có sẵn',
    amenitiesSubtitle: 'Dịch vụ đa dạng, đáp ứng mọi nhu cầu từ nghỉ dưỡng, công tác đến tổ chức sự kiện.',
    learnMore: 'Tìm hiểu thêm',
    galleryLabel: 'Thư viện',
    galleryTitle: 'Khám phá AN52 Hotel',
    gallerySubtitle: 'Hình ảnh thực tế từ khách sạn, phòng, tiện ích và nhà hàng.',
    galleryAll: 'Tất cả',
    galleryRooms: 'Phòng',
    galleryAmenities: 'Tiện ích',
    galleryDining: 'Nhà hàng',
    testimonialsLabel: 'Đánh giá',
    testimonialsTitle: 'Khách nói gì về chúng tôi',
    testimonialsRating: '4.7 / 5 · 2.300+ đánh giá',
    contactTitle: 'Liên hệ',
    contactAddress: '52 Nguyễn Văn Luông, Quận 6, TP. Hồ Chí Minh',
    contactPhone: '028 3987 6521',
    contactEmail: 'info@an52hotel.vn',
    receptionHours: 'Lễ tân hoạt động 24/7',
    quickLinks: 'Liên kết nhanh',
    about: 'Giới thiệu',
    rooms: 'Phòng',
    amenities: 'Tiện ích',
    gallery: 'Thư viện',
    newsletter: 'Nhận ưu đãi',
    newsletterText: 'Đăng ký email để nhận thông báo về khuyến mãi và ưu đãi đặc biệt.',
    emailPlaceholder: 'Email của bạn',
    subscribe: 'Đăng ký',
    subscribed: 'Đã đăng ký!',
    rights: '© 2026 AN52 Hotel. Mọi quyền được bảo lưu.',
    terms: 'Điều khoản',
    privacy: 'Chính sách bảo mật',
    faq: 'FAQ',
    bookingTitle: 'Đặt phòng tại AN52 Hotel',
    bookingSubtitle: 'Điền thông tin để hoàn tất đặt phòng',
    selectRoom: 'Chọn phòng',
    fullName: 'Họ tên',
    phone: 'Số điện thoại',
    email: 'Email',
    selectedRoom: 'Phòng đã chọn',
    numNights: 'Số đêm',
    pricePerNight: 'Giá/phòng/đêm',
    total: 'Tổng cộng',
    confirmBooking: 'Xác nhận đặt phòng',
    processing: 'Đang xử lý...',
    bookingSuccess: 'Đặt phòng thành công!',
    bookingThanks: 'Cảm ơn',
    bookingEmailSent: 'đã đặt phòng tại AN52 Hotel.',
    bookingEmailSent2: 'Chúng tôi đã gửi email xác nhận. Đội ngũ lễ tân sẽ liên hệ trong thời gian sớm nhất.',
    finish: 'Hoàn tất',
    backToTop: 'Lên đầu trang',
    themeLight: 'Chế độ sáng',
    themeDark: 'Chế độ tối',
    language: 'Ngôn ngữ',
    nightsUnit: 'đêm',
    signIn: 'Đăng nhập',
    signUp: 'Đăng ký',
    signOut: 'Đăng xuất',
    signInTitle: 'Đăng nhập',
    signUpTitle: 'Tạo tài khoản',
    signInSubtitle: 'Chào mừng bạn quay lại AN52 Hotel',
    signUpSubtitle: 'Đăng ký để đặt phòng nhanh chóng',
    authEmail: 'Email',
    authPassword: 'Mật khẩu',
    authName: 'Họ tên',
    authConfirmPassword: 'Xác nhận mật khẩu',
    authSignInBtn: 'Đăng nhập',
    authSignUpBtn: 'Đăng ký',
    authSigningIn: 'Đang đăng nhập...',
    authSigningUp: 'Đang đăng ký...',
    authNoAccount: 'Chưa có tài khoản?',
    authHaveAccount: 'Đã có tài khoản?',
    authPasswordMismatch: 'Mật khẩu không khớp',
    authNamePlaceholder: 'Nguyễn Văn A',
    authEmailPlaceholder: 'email@example.com',
    authPasswordPlaceholder: '••••••••',
    welcomeBack: 'Chào mừng trở lại',
    myAccount: 'Tài khoản',
    authSuccess: 'Đăng nhập thành công!',
    authSuccessMsg: 'Chào mừng bạn đến với AN52 Hotel',
    authInvalidCreds: 'Email hoặc mật khẩu không đúng',
    authEmailExists: 'Email đã được sử dụng',
    authWeakPassword: 'Mật khẩu phải có ít nhất 6 ký tự',
    authGoogleBtn: 'Tiếp tục với Google',
    authOr: 'hoặc',
    dashboard: 'Bảng điều khiển',
    guestUser: 'Khách',
  } as TranslationDict,

  en: {
    siteName: 'AN52',
    siteTagline: 'Hotel',
    navHome: 'Home',
    navAbout: 'About',
    navRooms: 'Rooms',
    navAmenities: 'Amenities',
    navGallery: 'Gallery',
    navContact: 'Contact',
    bookNow: 'Book Now',
    heroBadge: '4.7/5 · 15,000+ happy guests',
    heroTitle: 'AN52 Hotel',
    heroSubtitle: 'Modern, cozy and comfortable hotel — your perfect retreat after a day of exploration.',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    search: 'Search',
    guest1: '1 guest',
    guest2: '2 guests',
    guest3: '3 guests',
    guest4: '4 guests',
    guest5: '5+ guests',
    aboutLabel: 'About Us',
    aboutTitle: 'Where comfort meets modern convenience',
    aboutP1: 'AN52 Hotel proudly offers quality accommodation at reasonable prices. Not overly luxurious but fully equipped, we focus on what matters most: cleanliness, attentive service and a relaxing atmosphere.',
    aboutP2: 'Conveniently located near attractions and shopping centers, AN52 Hotel is the ideal choice for both leisure and business travelers. With 128 diverse rooms, restaurant, pool, spa and gym, all your needs are taken care of.',
    wifiFree: 'Free Wifi',
    parking: 'Parking',
    security: '24/7 Security',
    reception247: '24/7 Reception',
    roomsLabel: 'Accommodation',
    roomsTitle: 'Diverse & Comfortable Rooms',
    roomsSubtitle: 'From standard rooms to executive suites, choose what fits your needs and budget.',
    perNight: '/night',
    bookThisRoom: 'Book This Room',
    amenitiesLabel: 'Amenities',
    amenitiesTitle: 'Everything You Need',
    amenitiesSubtitle: 'Diverse services for leisure, business and events.',
    learnMore: 'Learn more',
    galleryLabel: 'Gallery',
    galleryTitle: 'Explore AN52 Hotel',
    gallerySubtitle: 'Real photos from our hotel, rooms, amenities and dining.',
    galleryAll: 'All',
    galleryRooms: 'Rooms',
    galleryAmenities: 'Amenities',
    galleryDining: 'Dining',
    testimonialsLabel: 'Reviews',
    testimonialsTitle: 'What Our Guests Say',
    testimonialsRating: '4.7 / 5 · 2,300+ reviews',
    contactTitle: 'Contact',
    contactAddress: '52 Nguyen Van Luong, District 6, Ho Chi Minh City',
    contactPhone: '028 3987 6521',
    contactEmail: 'info@an52hotel.vn',
    receptionHours: 'Reception open 24/7',
    quickLinks: 'Quick Links',
    about: 'About',
    rooms: 'Rooms',
    amenities: 'Amenities',
    gallery: 'Gallery',
    newsletter: 'Newsletter',
    newsletterText: 'Subscribe to receive notifications about promotions and special offers.',
    emailPlaceholder: 'Your email',
    subscribe: 'Subscribe',
    subscribed: 'Subscribed!',
    rights: '© 2026 AN52 Hotel. All rights reserved.',
    terms: 'Terms',
    privacy: 'Privacy Policy',
    faq: 'FAQ',
    bookingTitle: 'Book at AN52 Hotel',
    bookingSubtitle: 'Fill in your details to complete the booking',
    selectRoom: 'Select Room',
    fullName: 'Full Name',
    phone: 'Phone Number',
    email: 'Email',
    selectedRoom: 'Selected room',
    numNights: 'Nights',
    pricePerNight: 'Price/room/night',
    total: 'Total',
    confirmBooking: 'Confirm Booking',
    processing: 'Processing...',
    bookingSuccess: 'Booking Successful!',
    bookingThanks: 'Thank you',
    bookingEmailSent: 'for booking at AN52 Hotel.',
    bookingEmailSent2: 'We have sent a confirmation email. Our reception team will contact you shortly.',
    finish: 'Done',
    backToTop: 'Back to top',
    themeLight: 'Light mode',
    themeDark: 'Dark mode',
    language: 'Language',
    nightsUnit: 'nights',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    signInTitle: 'Sign In',
    signUpTitle: 'Create Account',
    signInSubtitle: 'Welcome back to AN52 Hotel',
    signUpSubtitle: 'Sign up to book rooms quickly',
    authEmail: 'Email',
    authPassword: 'Password',
    authName: 'Full Name',
    authConfirmPassword: 'Confirm Password',
    authSignInBtn: 'Sign In',
    authSignUpBtn: 'Sign Up',
    authSigningIn: 'Signing in...',
    authSigningUp: 'Signing up...',
    authNoAccount: 'No account yet?',
    authHaveAccount: 'Already have an account?',
    authPasswordMismatch: 'Passwords do not match',
    authNamePlaceholder: 'John Doe',
    authEmailPlaceholder: 'email@example.com',
    authPasswordPlaceholder: '••••••••',
    welcomeBack: 'Welcome back',
    myAccount: 'Account',
    authSuccess: 'Sign in successful!',
    authSuccessMsg: 'Welcome to AN52 Hotel',
    authInvalidCreds: 'Invalid email or password',
    authEmailExists: 'Email already in use',
    authWeakPassword: 'Password must be at least 6 characters',
    authGoogleBtn: 'Continue with Google',
    authOr: 'or',
    dashboard: 'Dashboard',
    guestUser: 'Guest',
  } as TranslationDict,

  kr: {
    siteName: 'AN52',
    siteTagline: 'Hotel',
    navHome: '홈',
    navAbout: '소개',
    navRooms: '객실',
    navAmenities: '편의시설',
    navGallery: '갤러리',
    navContact: '연락처',
    bookNow: '예약하기',
    heroBadge: '4.7/5 · 15,000+ 만족 게스트',
    heroTitle: 'AN52 Hotel',
    heroSubtitle: '현대적이고 아늑하며 편안한 호텔 — 하루의 탐험 후 완벽한 휴식처.',
    checkIn: '체크인',
    checkOut: '체크아웃',
    guests: '게스트',
    search: '검색',
    guest1: '1명',
    guest2: '2명',
    guest3: '3명',
    guest4: '4명',
    guest5: '5명 이상',
    aboutLabel: '소개',
    aboutTitle: '편안함과 현대적 편의의 만남',
    aboutP1: 'AN52 호텔은 합리적인 가격으로 고품질 숙박을 제공합니다. 지나치게 화려하지 않지만 완벽하게 갖추어진, 우리는 가장 중요한 것에 집중합니다: 청결함, 세심한 서비스, 편안한 분위기.',
    aboutP2: '관광 명소와 쇼핑센터 근처의 편리한 위치에 자리한 AN52 호텔은 레저와 비즈니스 여행객 모두에게 이상적인 선택입니다. 128개의 다양한 객실, 레스토랑, 수영장, 스파 및 피트니스 센터로 모든 요구를 충족합니다.',
    wifiFree: '무료 와이파이',
    parking: '주차',
    security: '24시간 보안',
    reception247: '24시간 리셉션',
    roomsLabel: '숙박',
    roomsTitle: '다양하고 편안한 객실',
    roomsSubtitle: '스탠다드 룸부터 이그제큐티브 스위트까지, 필요와 예산에 맞게 선택하세요.',
    perNight: '/박',
    bookThisRoom: '이 객실 예약',
    amenitiesLabel: '편의시설',
    amenitiesTitle: '필요한 모든 것이 준비되어 있습니다',
    amenitiesSubtitle: '휴양, 비즈니스 및 이벤트를 위한 다양한 서비스.',
    learnMore: '더 알아보기',
    galleryLabel: '갤러리',
    galleryTitle: 'AN52 호텔 둘러보기',
    gallerySubtitle: '호텔, 객실, 편의시설 및 다이닝의 실제 사진.',
    galleryAll: '전체',
    galleryRooms: '객실',
    galleryAmenities: '편의시설',
    galleryDining: '다이닝',
    testimonialsLabel: '리뷰',
    testimonialsTitle: '게스트들의 이야기',
    testimonialsRating: '4.7 / 5 · 2,300+ 리뷰',
    contactTitle: '연락처',
    contactAddress: '52 응우옌반르엉, 6구, 호치민시',
    contactPhone: '028 3987 6521',
    contactEmail: 'info@an52hotel.vn',
    receptionHours: '리셉션 24시간 운영',
    quickLinks: '빠른 링크',
    about: '소개',
    rooms: '객실',
    amenities: '편의시설',
    gallery: '갤러리',
    newsletter: '뉴스레터',
    newsletterText: '프로모션 및 특별 혜택 알림을 받으려면 구독하세요.',
    emailPlaceholder: '이메일 주소',
    subscribe: '구독',
    subscribed: '구독 완료!',
    rights: '© 2026 AN52 Hotel. 모든 권리 보유.',
    terms: '이용약관',
    privacy: '개인정보처리방침',
    faq: 'FAQ',
    bookingTitle: 'AN52 호텔 예약',
    bookingSubtitle: '예약을 완료하려면 정보를 입력하세요',
    selectRoom: '객실 선택',
    fullName: '이름',
    phone: '전화번호',
    email: '이메일',
    selectedRoom: '선택된 객실',
    numNights: '숙박일수',
    pricePerNight: '객실/박 가격',
    total: '총액',
    confirmBooking: '예약 확인',
    processing: '처리 중...',
    bookingSuccess: '예약 성공!',
    bookingThanks: '감사합니다',
    bookingEmailSent: 'AN52 호텔 예약해 주셔서.',
    bookingEmailSent2: '확인 이메일을 발송했습니다. 리셉션 팀이 곧 연락드리겠습니다.',
    finish: '완료',
    backToTop: '맨 위로',
    themeLight: '라이트 모드',
    themeDark: '다크 모드',
    language: '언어',
    nightsUnit: '박',
    signIn: '로그인',
    signUp: '회원가입',
    signOut: '로그아웃',
    signInTitle: '로그인',
    signUpTitle: '계정 만들기',
    signInSubtitle: 'AN52 호텔에 오신 것을 환영합니다',
    signUpSubtitle: '빠른 예약을 위해 가입하세요',
    authEmail: '이메일',
    authPassword: '비밀번호',
    authName: '이름',
    authConfirmPassword: '비밀번호 확인',
    authSignInBtn: '로그인',
    authSignUpBtn: '가입하기',
    authSigningIn: '로그인 중...',
    authSigningUp: '가입 중...',
    authNoAccount: '계정이 없으신가요?',
    authHaveAccount: '이미 계정이 있으신가요?',
    authPasswordMismatch: '비밀번호가 일치하지 않습니다',
    authNamePlaceholder: '홍길동',
    authEmailPlaceholder: 'email@example.com',
    authPasswordPlaceholder: '••••••••',
    welcomeBack: '다시 오신 것을 환영합니다',
    myAccount: '계정',
    authSuccess: '로그인 성공!',
    authSuccessMsg: 'AN52 호텔에 오신 것을 환영합니다',
    authInvalidCreds: '이메일 또는 비밀번호가 올바르지 않습니다',
    authEmailExists: '이미 사용 중인 이메일입니다',
    authWeakPassword: '비밀번호는 최소 6자 이상이어야 합니다',
    authGoogleBtn: 'Google로 계속하기',
    authOr: '또는',
    dashboard: '대시보드',
    guestUser: '게스트',
  } as TranslationDict,
};
