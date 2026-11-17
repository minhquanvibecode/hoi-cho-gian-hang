// Chụp ảnh trước/sau cho 4 mục giao diện ở 375px + kiểm tra nhanh.
// Dùng: node scripts/ui-shots.mjs <before|after> [url]
import { chromium } from 'playwright'
const tag = process.argv[2] || 'after'
const url = process.argv[3] || 'http://localhost:4173/'
const dir = 'evidence/ui'
const { mkdirSync } = await import('node:fs')
mkdirSync(dir, { recursive: true })
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {})
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const log = (m) => console.log(`[${tag}] ${m}`)
await page.goto(url)
await page.evaluate(() => localStorage.clear())
await page.goto(url + '#tong-quan')
await page.reload()
await page.waitForTimeout(300)

// Mục 1: màn hình đầu
await page.screenshot({ path: `${dir}/${tag}-1-man-hinh-dau.png` })
log(`Màn hình đầu: ${(await page.locator('.kpi-strip').count()) ? 'có dải số' : 'không có dải số'}`)

// Mục 3: biểu đồ (dữ liệu BTC)
const chart = page.locator('.chart')
await chart.scrollIntoViewIfNeeded()
await chart.screenshot({ path: `${dir}/${tag}-3-bieu-do.png` })
log(`Biểu đồ: ${await chart.locator('svg text').count()} nhãn chữ, ${await chart.locator('rect[rx]').count()} cột`)

// Mục 2: cuộn cuối Tổng quan rồi bấm Giả định
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(200)
await page.click('[data-tab="gia-dinh"]')
await page.waitForTimeout(300)
log(`Sau khi bấm Giả định: scrollY = ${await page.evaluate(() => window.scrollY)}`)
await page.screenshot({ path: `${dir}/${tag}-2-doi-tab.png` })
await page.evaluate(() => window.scrollTo(0, 600))
await page.evaluate(() => { location.hash = 'don-thu' })
await page.waitForTimeout(300)
log(`Sau khi đổi hash #don-thu: scrollY = ${await page.evaluate(() => window.scrollY)}`)

// Mục 4: lượt khách Thận trọng = 50
await page.click('[data-tab="tong-quan"]')
await page.getByLabel(/Lượt khách/).first().fill('50')
await page.waitForTimeout(200)
await page.screenshot({ path: `${dir}/${tag}-4a-dau-trang-lo.png` })
const sliders = page.locator('section', { hasText: 'Thử nhanh lượng khách' })
await sliders.screenshot({ path: `${dir}/${tag}-4b-thu-nhanh-lo.png` })
await page.locator('section', { hasText: 'So sánh kịch bản' }).first().screenshot({ path: `${dir}/${tag}-4c-bang-lo.png` })
await chart.screenshot({ path: `${dir}/${tag}-4d-bieu-do-lo.png` })
await page.locator('section', { has: page.locator('h2', { hasText: /^Kịch bản Thận trọng/ }) }).screenshot({ path: `${dir}/${tag}-4e-the-kich-ban-lo.png` })
const main = await page.locator('main').innerText()
log(`Có chữ "Lỗ": ${/Lỗ/.test(main)} · có "thiếu … phần để hòa vốn": ${/thiếu \d+ phần để hòa vốn/.test(main)}`)
const sw = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
log(`scrollWidth/clientWidth = ${sw.join('/')}`)
await browser.close()
