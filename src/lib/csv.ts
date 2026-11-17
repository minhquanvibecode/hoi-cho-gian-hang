import type { Order } from '../config/seed'
import { formatDateTime } from './format'
import { orderRevenueVnd } from './calc/plan'

const esc = (v: string | number) => {
  const s = String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Danh sách đơn → CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt). Số để dạng số nguyên, không dấu chấm. */
export function ordersToCsv(orders: Order[]): string {
  const header = ['Thời gian', 'Sản phẩm', 'Số lượng (phần)', 'Giá bán (đ/phần)', 'Doanh thu đơn (đ)']
  const rows = orders.map((o) => [formatDateTime(o.createdAt), o.productName, o.qty, o.priceVnd, orderRevenueVnd(o)])
  const totalQty = orders.reduce((s, o) => s + o.qty, 0)
  const totalRev = orders.reduce((s, o) => s + orderRevenueVnd(o), 0)
  const lines = [header, ...rows, ['Tổng', '', totalQty, '', totalRev]].map((r) => r.map(esc).join(','))
  return '﻿' + lines.join('\r\n') + '\r\n'
}

/** Tên file: don-ban-thu-20261117-1130.csv (giờ Việt Nam) */
export function csvFileName(now: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  )
  return `don-ban-thu-${p.year}${p.month}${p.day}-${p.hour}${p.minute}.csv`
}

export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
