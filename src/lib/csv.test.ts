import { describe, expect, it } from 'vitest'
import { csvFileName, ordersToCsv } from './csv'

describe('Xuất CSV đơn bán thử', () => {
  const orders = [
    { id: '1', productId: 'cacao-da', productName: 'Cacao đá', qty: 3, priceVnd: 25000, createdAt: '2026-11-17T04:30:00Z' },
    { id: '2', productId: 'x', productName: 'Bánh "đặc biệt", nhỏ', qty: 1, priceVnd: 15000, createdAt: '2026-11-17T04:31:00Z' },
  ]
  const csv = ordersToCsv(orders)
  const lines = csv.replace('﻿', '').trim().split('\r\n')

  it('có BOM, tiêu đề, từng đơn và dòng tổng', () => {
    expect(csv.startsWith('﻿')).toBe(true)
    expect(lines[0]).toBe('Thời gian,Sản phẩm,Số lượng (phần),Giá bán (đ/phần),Doanh thu đơn (đ)')
    expect(lines[1]).toBe('"11:30, 17/11/2026",Cacao đá,3,25000,75000')
    expect(lines[3]).toBe('Tổng,,4,,90000')
  })
  it('bọc ngoặc kép khi tên có dấu phẩy/ngoặc kép', () => {
    expect(lines[2]).toContain('"Bánh ""đặc biệt"", nhỏ"')
  })
  it('tên file theo giờ Việt Nam', () => {
    expect(csvFileName(new Date('2026-11-17T04:30:00Z'))).toBe('don-ban-thu-20261117-1130.csv')
  })
})
