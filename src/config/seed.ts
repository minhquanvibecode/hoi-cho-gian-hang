// Dữ liệu mẫu BTC phát cho bảng Kinh tế — chép nguyên văn từ đề.
export type Product = {
  id: string
  name: string
  /** Giá bán mỗi phần, đồng */
  priceVnd: number
  /** Chi phí biến đổi mỗi phần, đồng */
  unitCostVnd: number
  /** Số phần dự kiến (dùng làm cơ cấu phân bổ) */
  plannedQty: number
}

export type FixedCost = { id: string; name: string; amountVnd: number; note: string }

export type Scenario = {
  id: string
  name: string
  /** Lượt khách dự kiến */
  visitors: number
  /** Tỷ lệ mua dự kiến, % (0–100) */
  buyRatePct: number
  note: string
}

export type Order = {
  id: string
  productId: string
  productName: string
  qty: number
  /** Giá tại thời điểm ghi đơn */
  priceVnd: number
  createdAt: string
}

export const SEED_PRODUCTS: Product[] = [
  { id: 'tra-chanh', name: 'Trà chanh', priceVnd: 20000, unitCostVnd: 8000, plannedQty: 80 },
  { id: 'cacao-da', name: 'Cacao đá', priceVnd: 25000, unitCostVnd: 11000, plannedQty: 55 },
  { id: 'banh-quy', name: 'Bánh quy gói', priceVnd: 15000, unitCostVnd: 7000, plannedQty: 60 },
]

export const SEED_FIXED_COSTS: FixedCost[] = [
  { id: 'thue-gian', name: 'Phí thuê gian', amountVnd: 300000, note: 'Một ngày hội chợ' },
  { id: 'trang-tri', name: 'Trang trí và bảng giá', amountVnd: 150000, note: 'Chi một lần' },
  { id: 'du-phong', name: 'Đá, ly và khăn giấy dự phòng', amountVnd: 100000, note: 'Ước tính cho ngày bán' },
]

export const SEED_SCENARIOS: Scenario[] = [
  { id: 'than-trong', name: 'Thận trọng', visitors: 100, buyRatePct: 55, note: 'Lượng khách thấp' },
  { id: 'co-so', name: 'Cơ sở', visitors: 150, buyRatePct: 65, note: 'Ước tính của nhóm' },
]
