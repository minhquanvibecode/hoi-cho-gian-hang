// Ghi minh chứng bản nộp tại thời điểm chốt: video + ảnh từng bước trên link thật, khổ điện thoại 375px.
// Dùng: PW_CHANNEL=chrome node scripts/record-evidence.mjs <commit-sha> <actions-run-url> [url]
import { chromium } from 'playwright'
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'

const sha = process.argv[2] || 'unknown'
const runUrl = process.argv[3] || ''
const base = process.argv[4] || 'https://minhquanvibecode.github.io/hoi-cho-gian-hang/'
const dir = 'evidence/nop-bai'
const tmp = `${dir}/.video-tmp`
rmSync(dir, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })

const now = new Date()
const stamp = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric', hour12: false,
}).format(now)
const label = `Minh chứng chốt bài · ${stamp} · commit ${sha.slice(0, 7)}`
const results = []
const ok = (c, m) => { results.push(`${c ? '✓' : '✗'} ${m}`); console.log(`${c ? '✓' : '✗'} ${m}`); if (!c) process.exitCode = 1 }

const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {})
const ctx = await browser.newContext({
  viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  recordVideo: { dir: tmp, size: { width: 375, height: 812 } },
})
const page = await ctx.newPage()
// Nhãn giờ chốt chỉ thêm vào bản chụp minh chứng, không thuộc app
const addLabel = () => page.evaluate((t) => {
  const el = document.createElement('div')
  el.textContent = t
  el.style.cssText = 'position:fixed;left:8px;right:8px;bottom:68px;z-index:9999;background:rgba(15,17,21,.82);color:#fff;font:600 12px/1.4 system-ui;padding:6px 8px;border-radius:8px;text-align:center;pointer-events:none'
  document.body.appendChild(el)
}, label)
const pause = (ms = 900) => page.waitForTimeout(ms)
const shot = async (name) => { await pause(400); await page.screenshot({ path: `${dir}/${name}.png` }) }

await page.goto(base + '?v=' + now.getTime())
await page.evaluate(() => localStorage.clear())
await page.reload()
await addLabel()
await pause(1200)
await shot('01-mo-link-tong-quan')
const strip = await page.locator('.kpi-strip').innerText()
ok(strip.includes('49 phần') && strip.includes('72.000') && strip.includes('562.000'), 'Mở link: dải số 49 phần · 72.000 đ · 562.000 đ')

// Bước 1: Nạp dữ liệu mẫu
await page.click('[data-tab="gia-dinh"]'); await pause()
await page.getByRole('button', { name: 'Nạp dữ liệu mẫu' }).click(); await pause()
await page.getByRole('dialog').getByRole('button', { name: 'Nạp dữ liệu mẫu' }).click()
await shot('02-nap-du-lieu-mau')
ok(await page.getByText('Đã nạp dữ liệu mẫu BTC.').isVisible(), 'Nạp dữ liệu mẫu → thông báo')

// Bước 2: đổi lượt khách Thận trọng
await page.click('[data-tab="tong-quan"]'); await pause()
const visitors = page.getByLabel(/Lượt khách/).first()
await visitors.scrollIntoViewIfNeeded(); await pause()
for (const v of [90, 75, 60, 50]) { await visitors.fill(String(v)); await pause(500) }
await page.evaluate(() => window.scrollTo(0, 0)); await pause()
await shot('03-keo-luot-khach-lo')
ok((await page.locator('.kpi-strip').innerText()).includes('Lỗ Thận trọng'), 'Lượt khách 50 → dải số báo "Lỗ Thận trọng"')
await visitors.fill('100'); await pause(600)

// Bước 3: ghi một đơn thử
await page.click('[data-tab="don-thu"]'); await pause()
await page.getByRole('radio', { name: /Cacao đá/ }).click(); await pause(600)
await page.getByRole('button', { name: '3', exact: true }).click(); await pause(600)
await page.getByRole('button', { name: 'Lưu đơn' }).click()
await shot('04-ghi-don-thu')
ok(await page.getByText('Đã lưu đơn: Cacao đá × 3').isVisible(), 'Ghi đơn Cacao đá × 3 = 75.000 đ → thông báo')

// Bước 4: so sánh hai kịch bản
await page.click('[data-tab="tong-quan"]'); await pause()
await page.locator('section', { has: page.locator('h2', { hasText: /^So sánh kịch bản/ }) }).scrollIntoViewIfNeeded()
await shot('05-so-sanh-kich-ban')
await page.locator('.chart').scrollIntoViewIfNeeded()
await shot('06-bieu-do')
ok((await page.locator('.chart rect[rx]').count()) === 9, 'Biểu đồ đủ 3 nhóm, 9 cột')
const sw = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
ok(sw[0] === sw[1], `Không cuộn ngang (${sw[0]}/${sw[1]}px)`)
await pause(800)
const video = page.video()
await ctx.close()
renameSync(await video.path(), `${dir}/demo.webm`)
rmSync(tmp, { recursive: true, force: true })

// Máy tính
const desk = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await desk.goto(base + '?v=' + now.getTime())
await desk.evaluate((t) => {
  const el = document.createElement('div'); el.textContent = t
  el.style.cssText = 'position:fixed;right:16px;top:16px;z-index:9999;background:rgba(15,17,21,.82);color:#fff;font:600 13px/1.4 system-ui;padding:6px 10px;border-radius:8px'
  document.body.appendChild(el)
}, label)
await desk.waitForTimeout(600)
await desk.screenshot({ path: `${dir}/07-may-tinh.png` })
await browser.close()

writeFileSync(`${dir}/MINH-CHUNG.md`, `# Minh chứng bản nộp

- Thời điểm chốt: **${stamp}** (giờ Việt Nam)
- Link demo đã kiểm tra: ${base}
- Commit đang chạy trên link demo: \`${sha}\` — https://github.com/minhquanvibecode/hoi-cho-gian-hang/commit/${sha}
- Lần build/đăng trang: ${runUrl}
- Thiết bị giả lập: điện thoại 375×812 (Chrome), máy tính 1280×800

Các file minh chứng được thêm trong commit ngay sau commit trên; commit đó chỉ thêm thư mục \`evidence/nop-bai/\`, không đổi mã nguồn app.

## Kết quả kiểm tra tự động
${results.map((r) => `- ${r}`).join('\n')}

## File
${readdirSync(dir).filter((f) => f !== 'MINH-CHUNG.md').sort().map((f) => `- \`${f}\``).join('\n')}

Video \`demo.webm\` mở bằng Chrome, Edge hoặc Firefox (kéo thả file vào trình duyệt).
`)
console.log(`\nĐã ghi minh chứng vào ${dir} lúc ${stamp}`)
