export type Language = 'vi' | 'en' | 'kr';

export type ThemeMode = 'light' | 'dark';

export type RoomType = {
  id: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  price: number;
  size: string;
  capacity: number;
  beds: Record<Language, string>;
  image: string;
  features: Record<Language, string[]>;
};

export type AmenityType = {
  id: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  image: string;
  icon: string;
};

export type TestimonialType = {
  id: string;
  name: string;
  location: Record<Language, string>;
  rating: number;
  text: Record<Language, string>;
  avatar: string;
};

export type GalleryImageType = {
  url: string;
  caption: Record<Language, string>;
  category: string;
};

export type StatType = {
  label: Record<Language, string>;
  value: string;
};

export const rooms: RoomType[] = [
  {
    id: 'standard',
    name: {
      vi: 'Standard Room',
      en: 'Standard Room',
      kr: '스탠다드 룸',
    },
    description: {
      vi: 'Phòng tiêu chuẩn với đầy đủ tiện nghi, phù hợp cho 1-2 khách. Không gian tối giản, sạch sẽ và thoải mái.',
      en: 'Standard room with full amenities, suitable for 1-2 guests. Minimalist, clean and comfortable space.',
      kr: '모든 편의시설을 갖춘 스탠다드 룸, 1-2인 게스트에게 적합합니다. 미니멀하고 깨끗하며 편안한 공간.',
    },
    price: 850000,
    size: '25 m²',
    capacity: 2,
    beds: {
      vi: '1 giường đôi',
      en: '1 double bed',
      kr: '더블 베드 1개',
    },
    image: 'https://images.pexels.com/photos/2736388/pexels-photo-2736388.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    features: {
      vi: ['Wifi miễn phí', 'Điều hòa', 'TV 43 inch', 'Minibar', 'Phòng tắm riêng'],
      en: ['Free Wifi', 'Air conditioning', '43-inch TV', 'Minibar', 'Private bathroom'],
      kr: ['무료 와이파이', '에어컨', '43인치 TV', '미니바', '개인 욕실'],
    },
  },
  {
    id: 'deluxe',
    name: {
      vi: 'Deluxe Room',
      en: 'Deluxe Room',
      kr: '디럭스 룸',
    },
    description: {
      vi: 'Phòng Deluxe rộng rãi hơn với ban công nhìn ra thành phố. Thiết kế hiện đại, ánh sáng tự nhiên tràn ngập.',
      en: 'Spacious Deluxe room with city-view balcony. Modern design filled with natural light.',
      kr: '도시 전망 발코니가 있는 넓은 디럭스 룸. 자연광이 가득한 모던 디자인.',
    },
    price: 1250000,
    size: '35 m²',
    capacity: 3,
    beds: {
      vi: '1 giường đôi + 1 giường đơn',
      en: '1 double bed + 1 single bed',
      kr: '더블 베드 1개 + 싱글 베드 1개',
    },
    image: 'https://images.pexels.com/photos/14547139/pexels-photo-14547139.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    features: {
      vi: ['Wifi miễn phí', 'Điều hòa', 'TV 50 inch', 'Minibar', 'Ban công', 'Máy pha cà phê', 'Áo choàng tắm'],
      en: ['Free Wifi', 'Air conditioning', '50-inch TV', 'Minibar', 'Balcony', 'Coffee maker', 'Bathrobes'],
      kr: ['무료 와이파이', '에어컨', '50인치 TV', '미니바', '발코니', '커피메이커', '목욕가운'],
    },
  },
  {
    id: 'suite',
    name: {
      vi: 'Executive Suite',
      en: 'Executive Suite',
      kr: '이그제큐티브 스위트',
    },
    description: {
      vi: 'Suite cao cấp với phòng khách riêng, phòng ngủ và phòng tắm sang trọng. Phù hợp cho doanh nhân và gia đình.',
      en: 'Premium suite with separate living room, bedroom and luxurious bathroom. Ideal for business and families.',
      kr: '별도의 거실, 침실 및 고급 욕실이 있는 프리미엄 스위트. 비즈니스 및 가족에게 이상적입니다.',
    },
    price: 2200000,
    size: '55 m²',
    capacity: 4,
    beds: {
      vi: '1 giường đôi lớn + sofa giường',
      en: '1 king bed + sofa bed',
      kr: '킹 베드 1개 + 소파 베드',
    },
    image: 'https://images.pexels.com/photos/15792555/pexels-photo-15792555.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    features: {
      vi: ['Wifi miễn phí', 'Điều hòa', 'TV 55 inch', 'Minibar', 'Phòng khách riêng', 'Bồn tắm', 'Máy pha cà phê', 'Trái cây chào mừng'],
      en: ['Free Wifi', 'Air conditioning', '55-inch TV', 'Minibar', 'Private living room', 'Bathtub', 'Coffee maker', 'Welcome fruit'],
      kr: ['무료 와이파이', '에어컨', '55인치 TV', '미니바', '개인 거실', '욕조', '커피메이커', '웰컴 과일'],
    },
  },
  {
    id: 'family',
    name: {
      vi: 'Family Room',
      en: 'Family Room',
      kr: '패밀리 룸',
    },
    description: {
      vi: 'Phòng gia đình rộng rãi với nhiều giường, thiết kế tiện lợi cho gia đình có trẻ em. Đầy đủ tiện ích cho cả nhà.',
      en: 'Spacious family room with multiple beds, designed for families with children. Fully equipped for everyone.',
      kr: '여러 베드가 있는 넓은 패밀리 룸, 아이가 있는 가족을 위해 설계되었습니다. 모든 편의시설 완비.',
    },
    price: 1650000,
    size: '45 m²',
    capacity: 5,
    beds: {
      vi: '2 giường đôi',
      en: '2 double beds',
      kr: '더블 베드 2개',
    },
    image: 'https://images.pexels.com/photos/6394574/pexels-photo-6394574.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    features: {
      vi: ['Wifi miễn phí', 'Điều hòa', 'TV 50 inch', 'Minibar', 'Tủ lạnh lớn', 'Máy pha cà phê', 'Bồn tắm', 'Diện tích rộng'],
      en: ['Free Wifi', 'Air conditioning', '50-inch TV', 'Minibar', 'Large fridge', 'Coffee maker', 'Bathtub', 'Spacious'],
      kr: ['무료 와이파이', '에어컨', '50인치 TV', '미니바', '대형 냉장고', '커피메이커', '욕조', '넓은 공간'],
    },
  },
];

export const amenities: AmenityType[] = [
  {
    id: 'pool',
    name: {
      vi: 'Hồ bơi ngoài trời',
      en: 'Outdoor Pool',
      kr: '야외 수영장',
    },
    description: {
      vi: 'Hồ bơi trên tầng thượng với view thành phố, mở cửa từ 6:00 - 22:00 hàng ngày.',
      en: 'Rooftop pool with city views, open daily from 6:00 - 22:00.',
      kr: '도시 전망의 루프탑 수영장, 매일 6:00 - 22:00 운영.',
    },
    image: 'https://images.pexels.com/photos/2259226/pexels-photo-2259226.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    icon: 'Waves',
  },
  {
    id: 'restaurant',
    name: {
      vi: 'Nhà hàng & Bar',
      en: 'Restaurant & Bar',
      kr: '레스토랑 & 바',
    },
    description: {
      vi: 'Nhà hàng phục vụ món Việt và quốc tế, mở cửa từ 6:00 - 23:00. Buffet sáng đa dạng.',
      en: 'Restaurant serving Vietnamese and international cuisine, open 6:00 - 23:00. Rich breakfast buffet.',
      kr: '베트남 및 국제 요리를 제공하는 레스토랑, 6:00 - 23:00 운영. 풍성한 브레이크패스트 뷔페.',
    },
    image: 'https://images.pexels.com/photos/12387869/pexels-photo-12387869.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    icon: 'UtensilsCrossed',
  },
  {
    id: 'spa',
    name: {
      vi: 'Spa & Massage',
      en: 'Spa & Massage',
      kr: '스파 & 마사지',
    },
    description: {
      vi: 'Dịch vụ massage và chăm sóc sức khỏe chuyên nghiệp, thư giãn sau ngày dài.',
      en: 'Professional massage and wellness services, relax after a long day.',
      kr: '전문 마사지 및 웰니스 서비스, 긴 하루 후 휴식을 취하세요.',
    },
    image: 'https://images.pexels.com/photos/9146378/pexels-photo-9146378.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    icon: 'Flower2',
  },
  {
    id: 'gym',
    name: {
      vi: 'Phòng gym',
      en: 'Fitness Center',
      kr: '피트니스 센터',
    },
    description: {
      vi: 'Phòng gym hiện đại với đầy đủ thiết bị, mở cửa 24/7 cho khách lưu trú.',
      en: 'Modern gym with full equipment, open 24/7 for hotel guests.',
      kr: '최신 장비를 갖춘 피트니스 센터, 투숙객을 위해 24시간 운영.',
    },
    image: 'https://images.pexels.com/photos/4716814/pexels-photo-4716814.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    icon: 'Dumbbell',
  },
  {
    id: 'conference',
    name: {
      vi: 'Hội nghị & Sự kiện',
      en: 'Conference & Events',
      kr: '컨퍼런스 & 이벤트',
    },
    description: {
      vi: 'Phòng họp đa năng sức chứa lên đến 200 khách, đầy đủ thiết bị trình chiếu.',
      en: 'Multi-purpose meeting room accommodating up to 200 guests, fully equipped with AV.',
      kr: '최대 200명을 수용할 수 있는 다목적 회의실, 완벽한 AV 장비 완비.',
    },
    image: 'https://images.pexels.com/photos/2883048/pexels-photo-2883048.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    icon: 'Briefcase',
  },
  {
    id: 'lobby',
    name: {
      vi: 'Sảnh đợi sang trọng',
      en: 'Elegant Lobby',
      kr: '우아한 로비',
    },
    description: {
      vi: 'Sảnh chờ rộng rãi, thoải mái với khu vực ngồi đọc sách và quầy lễ tân 24/7.',
      en: 'Spacious, comfortable lobby with reading area and 24/7 reception desk.',
      kr: '넓고 편안한 로비, 독서 공간 및 24시간 리셉션.',
    },
    image: 'https://images.pexels.com/photos/7821349/pexels-photo-7821349.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    icon: 'Sofa',
  },
];

export const testimonials: TestimonialType[] = [
  {
    id: 't1',
    name: 'Nguyễn Minh Anh',
    location: {
      vi: 'Hà Nội',
      en: 'Hanoi',
      kr: '하노이',
    },
    rating: 5,
    text: {
      vi: 'Khách sạn sạch sẽ, nhân viên nhiệt tình và chuyên nghiệp. Phòng ốc thoải mái, view đẹp. Sẽ quay lại lần sau!',
      en: 'Clean hotel, friendly and professional staff. Comfortable rooms, beautiful view. Will come back!',
      kr: '깨끗한 호텔, 친절하고 전문적인 직원. 편안한 객실, 아름다운 전망. 다시 올 것입니다!',
    },
    avatar: 'https://ui-avatars.com/api/?name=Minh+Anh&background=8a7344&color=fff&size=128',
  },
  {
    id: 't2',
    name: 'Trần Quốc Bảo',
    location: {
      vi: 'TP. Hồ Chí Minh',
      en: 'Ho Chi Minh City',
      kr: '호치민시',
    },
    rating: 5,
    text: {
      vi: 'Vị trí tiện lợi, gần trung tâm. Buffet sáng ngon và đa dạng. Hồ bơi trên tầng thượng rất chill. Đáng đồng tiền.',
      en: 'Convenient location, near the center. Tasty and diverse breakfast buffet. Rooftop pool is amazing. Great value.',
      kr: '편리한 위치, 중심가 근처. 맛있고 다양한 브레이크패스트 뷔페. 루프탑 수영장이 멋집니다. 가성비 최고.',
    },
    avatar: 'https://ui-avatars.com/api/?name=Quoc+Bao&background=57482d&color=fff&size=128',
  },
  {
    id: 't3',
    name: 'Lê Thu Hà',
    location: {
      vi: 'Đà Nẵng',
      en: 'Da Nang',
      kr: '다낭',
    },
    rating: 4,
    text: {
      vi: 'Phòng rộng rãi, giường êm ái. Dịch vụ spa rất tốt. Chỉ tiếc là hơi ồn một chút do đường phố, nhưng nói chung rất hài lòng.',
      en: 'Spacious room, comfortable bed. Excellent spa service. A bit noisy from the street, but overall very satisfied.',
      kr: '넓은 객실, 편안한 침대. 훌륭한 스파 서비스. 거리 소음이 조금 있지만 전반적으로 매우 만족합니다.',
    },
    avatar: 'https://ui-avatars.com/api/?name=Thu+Ha&background=a8905a&color=fff&size=128',
  },
  {
    id: 't4',
    name: 'David Wilson',
    location: {
      vi: 'Sydney, Úc',
      en: 'Sydney, Australia',
      kr: '시드니, 호주',
    },
    rating: 5,
    text: {
      vi: 'Khách sạn tiện nghi với cơ sở vật chất hiện đại. Nhân viên nói tiếng Anh tốt và rất hỗ trợ. Hồ bơi trên sân thượng là điểm nhấn!',
      en: 'Great value hotel with modern facilities. The staff speaks English well and is very helpful. The rooftop pool is a highlight!',
      kr: '가성비 좋은 호텔 with 최신 시설. 직원들이 영어를 잘하고 매우 도움이 됩니다. 루프탑 수영장이 하이라이트!',
    },
    avatar: 'https://ui-avatars.com/api/?name=David+W&background=3f5261&color=fff&size=128',
  },
];

export const galleryImages: GalleryImageType[] = [
  { url: 'https://images.pexels.com/photos/2736388/pexels-photo-2736388.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: { vi: 'Phòng Deluxe', en: 'Deluxe Room', kr: '디럭스 룸' }, category: 'rooms' },
  { url: 'https://images.pexels.com/photos/14547139/pexels-photo-14547139.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: { vi: 'Phòng Deluxe cao cấp', en: 'Premium Deluxe Room', kr: '프리미엄 디럭스 룸' }, category: 'rooms' },
  { url: 'https://images.pexels.com/photos/2259226/pexels-photo-2259226.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: { vi: 'Hồ bơi ngoài trời', en: 'Outdoor Pool', kr: '야외 수영장' }, category: 'amenities' },
  { url: 'https://images.pexels.com/photos/12387869/pexels-photo-12387869.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: { vi: 'Nhà hàng', en: 'Restaurant', kr: '레스토랑' }, category: 'dining' },
  { url: 'https://images.pexels.com/photos/8082195/pexels-photo-8082195.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: { vi: 'Phòng tắm sang trọng', en: 'Luxurious Bathroom', kr: '고급 욕실' }, category: 'rooms' },
  { url: 'https://images.pexels.com/photos/9146378/pexels-photo-9146378.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: { vi: 'Spa & Massage', en: 'Spa & Massage', kr: '스파 & 마사지' }, category: 'amenities' },
  { url: 'https://images.pexels.com/photos/7821349/pexels-photo-7821349.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: { vi: 'Sảnh đợi', en: 'Lobby', kr: '로비' }, category: 'amenities' },
  { url: 'https://images.pexels.com/photos/4716814/pexels-photo-4716814.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: { vi: 'Phòng gym', en: 'Fitness Center', kr: '피트니스 센터' }, category: 'amenities' },
  { url: 'https://images.pexels.com/photos/15792555/pexels-photo-15792555.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', caption: { vi: 'Executive Suite', en: 'Executive Suite', kr: '이그제큐티브 스위트' }, category: 'rooms' },
];

export const stats: StatType[] = [
  { label: { vi: 'Phòng', en: 'Rooms', kr: '객실' }, value: '128' },
  { label: { vi: 'Khách hài lòng', en: 'Happy guests', kr: '만족 게스트' }, value: '15K+' },
  { label: { vi: 'Năm kinh nghiệm', en: 'Years', kr: '년 경험' }, value: '8' },
  { label: { vi: 'Điểm đánh giá', en: 'Rating', kr: '평점' }, value: '4.7' },
];

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};
