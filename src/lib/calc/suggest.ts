import type { FixedCost, Product, Scenario } from '../../config/seed'
import { breakEven, projectScenario, unitMarginVnd } from './plan'

export type Suggestion = {
  id: string
  title: string
  /** Lợi nhuận kịch bản tham chiếu trước/sau, đồng */
  profitBeforeVnd: number
  profitAfterVnd: number
  /** Số phần hòa vốn trước/sau */
  breakEvenBefore: number | null
  breakEvenAfter: number | null
  explanation: string
  caution: string
}

export const PRICE_STEP_VND = 2000
export const MIX_SHIFT_UNITS = 10

/** Số lượt khách tối thiểu để hòa vốn ở tỷ lệ mua của kịch bản (làm tròn lên) */
export function minVisitorsToBreakEven(products: Product[], costs: FixedCost[], buyRatePct: number): number | null {
  const be = breakEven(products, costs).units
  if (be === null || buyRatePct <= 0) return null
  // Số khách mua làm tròn gần nhất → tìm lượt khách nhỏ nhất cho roundHalfUp(v × r) ≥ be
  let v = Math.max(0, Math.floor(((be - 0.5) * 100) / buyRatePct))
  while (Math.round((v * buyRatePct) / 100) < be) v++
  return v
}

/** Gợi ý cải thiện lợi nhuận, so trên kịch bản tham chiếu (kịch bản đầu tiên — Thận trọng). */
export function suggestions(products: Product[], costs: FixedCost[], ref: Scenario): Suggestion[] {
  const base = projectScenario(ref, products, costs)
  const beBase = breakEven(products, costs).units
  const out: Suggestion[] = []

  // 1. Tăng giá mỗi món 2.000 đ
  const pricier = products.map((p) => ({ ...p, priceVnd: p.priceVnd + PRICE_STEP_VND }))
  const p1 = projectScenario(ref, pricier, costs)
  out.push({
    id: 'tang-gia',
    title: `Tăng giá mỗi món ${PRICE_STEP_VND.toLocaleString('vi-VN')} đ`,
    profitBeforeVnd: base.profitVnd,
    profitAfterVnd: p1.profitVnd,
    breakEvenBefore: beBase,
    breakEvenAfter: breakEven(pricier, costs).units,
    explanation: `Mỗi phần lãi thêm ${PRICE_STEP_VND.toLocaleString('vi-VN')} đ, với ${base.totalQty} phần là +${(PRICE_STEP_VND * base.totalQty).toLocaleString('vi-VN')} đ.`,
    caution: 'Giá cao hơn có thể làm tỷ lệ mua giảm — thử hạ tỷ lệ mua ở tab Giả định để kiểm tra.',
  })

  // 2. Chuyển 10 phần dự kiến từ món lãi góp thấp nhất sang món lãi góp cao nhất
  if (products.length >= 2) {
    const sorted = [...products].sort((a, b) => unitMarginVnd(a) - unitMarginVnd(b))
    const low = sorted[0]
    const high = sorted[sorted.length - 1]
    const shift = Math.min(MIX_SHIFT_UNITS, low.plannedQty)
    if (shift > 0 && unitMarginVnd(high) > unitMarginVnd(low)) {
      const mixed = products.map((p) =>
        p.id === low.id ? { ...p, plannedQty: p.plannedQty - shift } : p.id === high.id ? { ...p, plannedQty: p.plannedQty + shift } : p,
      )
      const p2 = projectScenario(ref, mixed, costs)
      out.push({
        id: 'doi-co-cau',
        title: `Đẩy ${high.name}: chuyển ${shift} phần dự kiến từ ${low.name}`,
        profitBeforeVnd: base.profitVnd,
        profitAfterVnd: p2.profitVnd,
        breakEvenBefore: beBase,
        breakEvenAfter: breakEven(mixed, costs).units,
        explanation: `${high.name} lãi ${unitMarginVnd(high).toLocaleString('vi-VN')} đ/phần, ${low.name} chỉ ${unitMarginVnd(low).toLocaleString('vi-VN')} đ/phần — mời khách món lãi cao hơn (đặt ở đầu bảng giá, combo).`,
        caution: `Cần chuẩn bị thêm nguyên liệu ${high.name}, bớt ${low.name}.`,
      })
    }
  }

  // 3. Giảm 10% chi phí cố định (xin giảm phí, tự làm trang trí…)
  const cheaper = costs.map((c) => ({ ...c, amountVnd: Math.round(c.amountVnd * 0.9) }))
  const p3 = projectScenario(ref, products, cheaper)
  const saved = base.fixedVnd - p3.fixedVnd
  out.push({
    id: 'giam-co-dinh',
    title: 'Giảm 10% chi phí cố định',
    profitBeforeVnd: base.profitVnd,
    profitAfterVnd: p3.profitVnd,
    breakEvenBefore: beBase,
    breakEvenAfter: breakEven(products, cheaper).units,
    explanation: `Tiết kiệm ${saved.toLocaleString('vi-VN')} đ (tự làm trang trí, mượn ly, mua đá theo nhu cầu) — lợi nhuận tăng đúng bằng số tiết kiệm ở mọi kịch bản.`,
    caution: 'Không cắt khoản dự phòng đá/ly quá tay: hết ly giữa buổi là mất khách.',
  })

  return out
}
