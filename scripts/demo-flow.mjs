// Chạy kịch bản demo của đề, chụp ảnh minh chứng. Dùng: node scripts/demo-flow.mjs [url]
import { chromium } from 'playwright'
const url = process.argv[2] || 'http://localhost:4173/'
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {})
const page = await browser.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const ok = (c, m) => { console.log(`${c ? '✓' : '✗'} ${m}`); if (!c) process.exitCode = 1 }
await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.reload()

// 1. Nạp dữ liệu mẫu
await page.click('[data-tab="gia-dinh"]')
await page.getByRole('button', { name: 'Nạp dữ liệu mẫu' }).click()
await page.getByRole('dialog').getByRole('button', { name: 'Nạp dữ liệu mẫu' }).click()
ok(await page.getByText('Đã nạp dữ liệu mẫu BTC.').isVisible(), 'Nạp mẫu → toast')

// 2. Nhập sai → lỗi dưới ô; đổi lượt khách Thận trọng 100 → 120
const visitors = page.getByLabel('Lượt khách dự kiến').first()
await visitors.fill('abc')
ok(await page.getByText('Chỉ nhập số nguyên').first().isVisible(), 'Nhập sai → báo lỗi dưới ô')
await visitors.fill('120')
ok(await page.getByText('Đã chỉnh').first().isVisible(), 'Ô đã chỉnh có nhãn')
await page.screenshot({ path: 'evidence/demo-1-gia-dinh.png', fullPage: false })

// 3. Tổng quan cập nhật: 120 × 55% = 66 phần
await page.click('[data-tab="tong-quan"]')
const txt = await page.locator('main').innerText()
ok(txt.includes('Bán 66 phần'), 'Thận trọng cập nhật theo 120 lượt khách (66 phần)')
ok(txt.includes('Đã chỉnh 2') || txt.includes('đã chỉnh 1 ô'), 'Banner giả định báo đã chỉnh')
await page.screenshot({ path: 'evidence/demo-2-tong-quan.png', fullPage: true })

// 4. Ghi đơn: thiếu sản phẩm → lỗi; hợp lệ → toast
await page.click('[data-tab="don-thu"]')
await page.getByRole('button', { name: 'Lưu đơn' }).click()
ok(await page.getByText('Vui lòng chọn sản phẩm.').isVisible(), 'Lưu đơn thiếu sản phẩm → báo lỗi')
await page.selectOption('#order-product', 'cacao-da')
await page.fill('#order-qty', '3')
ok((await page.locator('.order-preview').innerText()).includes('75.000'), 'Doanh thu đơn 3 × 25.000 = 75.000 đ')
await page.getByRole('button', { name: 'Lưu đơn' }).click()
ok(await page.getByText('Đã lưu đơn: Cacao đá × 3').isVisible(), 'Lưu đơn → toast')
ok((await page.locator('table').first().innerText()).includes('Cacao đá\t3'), 'Đã bán Cacao đá = 3')
await page.screenshot({ path: 'evidence/demo-3-don-thu.png', fullPage: true })
await browser.close()
