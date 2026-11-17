import { describe, expect, it } from 'vitest'
import { countChanged, seedAssumptions } from './state'

describe('Đếm giả định đã chỉnh', () => {
  it('dữ liệu BTC → 0', () => expect(countChanged(seedAssumptions())).toBe(0))
  it('thêm 1 sản phẩm + xoá 1 khoản chi + sửa 1 giá → 3', () => {
    const a = seedAssumptions()
    a.products.push({ id: 'p-new', name: 'Nước cam', priceVnd: 20000, unitCostVnd: 9000, plannedQty: 30 })
    a.fixedCosts = a.fixedCosts.filter((c) => c.id !== 'trang-tri')
    a.products[0].priceVnd = 22000
    expect(countChanged(a)).toBe(3)
  })
})
