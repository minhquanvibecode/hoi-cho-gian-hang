import { describe, expect, it } from 'vitest'
import { SEED_FIXED_COSTS, SEED_PRODUCTS, SEED_SCENARIOS } from '../../config/seed'
import { minVisitorsToBreakEven, suggestions } from './suggest'

describe('Gợi ý cải thiện (kịch bản Thận trọng)', () => {
  const s = suggestions(SEED_PRODUCTS, SEED_FIXED_COSTS, SEED_SCENARIOS[0])

  it('tăng giá 2.000 đ: lợi nhuận 72.000 → 182.000, hòa vốn 49 → 42', () => {
    const x = s.find((i) => i.id === 'tang-gia')!
    expect(x.profitBeforeVnd).toBe(72000)
    expect(x.profitAfterVnd).toBe(182000)
    expect(x.breakEvenAfter).toBe(42)
  })

  it('chuyển 10 phần Bánh quy → Cacao đá: 80:65:50 → 23/18/14, lợi nhuận 90.000, hòa vốn 48', () => {
    const x = s.find((i) => i.id === 'doi-co-cau')!
    expect(x.title).toContain('Cacao đá')
    expect(x.profitAfterVnd).toBe(90000)
    expect(x.breakEvenAfter).toBe(48)
  })

  it('giảm 10% chi phí cố định: +55.000 đ, hòa vốn 495.000 ÷ 11.333,33 = 43,7 → 44', () => {
    const x = s.find((i) => i.id === 'giam-co-dinh')!
    expect(x.profitAfterVnd).toBe(127000)
    expect(x.breakEvenAfter).toBe(44)
  })
})

describe('Lượt khách tối thiểu để hòa vốn', () => {
  it('49 phần ở 55% → 89 lượt (89 × 55% = 48,95 → 49)', () => {
    expect(minVisitorsToBreakEven(SEED_PRODUCTS, SEED_FIXED_COSTS, 55)).toBe(89)
  })
  it('ở 65% → 75 lượt (75 × 65% = 48,75 → 49)', () => {
    expect(minVisitorsToBreakEven(SEED_PRODUCTS, SEED_FIXED_COSTS, 65)).toBe(75)
  })
  it('tỷ lệ 0% → null', () => {
    expect(minVisitorsToBreakEven(SEED_PRODUCTS, SEED_FIXED_COSTS, 0)).toBeNull()
  })
})
