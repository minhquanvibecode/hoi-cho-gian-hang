// Kiểm tra chuẩn điện thoại ở 360 và 390px, chụp ảnh minh chứng.
// Dùng: npm run build && npx vite preview --port 4173  (chạy nền)
//       node scripts/check-mobile.mjs [url]
// Quy ước: mỗi nút tab có thuộc tính data-tab="<id>".
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const url = process.argv[2] || 'http://localhost:4173/'
const widths = [360, 390]
const MIN_TAP = 44
const MIN_FONT = 13
mkdirSync('evidence', { recursive: true })

const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {})
let problems = 0

for (const width of widths) {
  const page = await browser.newPage({
    viewport: { width, height: 800 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(url, { waitUntil: 'networkidle' })

  const tabs = await page.$$eval('[data-tab]', (els) => els.map((e) => e.getAttribute('data-tab')))
  const targets = tabs.length ? tabs : ['(trang)']

  for (const tab of targets) {
    if (tab !== '(trang)') {
      await page.click(`[data-tab="${tab}"]`)
      await page.waitForTimeout(250)
    }
    const report = await page.evaluate(
      ({ width, MIN_TAP, MIN_FONT }) => {
        const out = []
        const sw = document.documentElement.scrollWidth
        if (sw > width) out.push(`Cuộn ngang: rộng ${sw}px > ${width}px`)
        const visible = (el) => {
          const r = el.getBoundingClientRect()
          const s = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
        }
        const label = (el) =>
          `${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute('aria-label') || el.getAttribute('name') || '').trim().slice(0, 30)}"`
        for (const el of document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [data-tab]')) {
          if (!visible(el)) continue
          const r = el.getBoundingClientRect()
          const isCheck = el.type === 'checkbox' || el.type === 'radio'
          if (!isCheck && r.height < MIN_TAP) out.push(`Nút/ô nhỏ (${Math.round(r.height)}px cao): ${label(el)}`)
          if (r.right > width + 1) out.push(`Tràn phải (${Math.round(r.right)}px): ${label(el)}`)
        }
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        const seen = new Set()
        while (walker.nextNode()) {
          const el = walker.currentNode.parentElement
          if (!el || seen.has(el) || !walker.currentNode.textContent.trim() || !visible(el)) continue
          seen.add(el)
          const fs = parseFloat(getComputedStyle(el).fontSize)
          if (fs < MIN_FONT) out.push(`Chữ nhỏ (${fs}px): "${walker.currentNode.textContent.trim().slice(0, 30)}"`)
        }
        return out
      },
      { width, MIN_TAP, MIN_FONT },
    )
    const file = `evidence/${width}-${tab.replace(/[^\w-]/g, '_')}.png`
    await page.screenshot({ path: file, fullPage: true })
    const unique = [...new Set(report)]
    problems += unique.length
    console.log(`\n[${width}px] tab ${tab} → ${file}`)
    for (const p of unique) console.log(`  ✗ ${p}`)
    if (!unique.length) console.log('  ✓ đạt')
  }
  if (errors.length) {
    problems += errors.length
    console.log(`\n[${width}px] Lỗi JavaScript:`)
    for (const e of errors) console.log(`  ✗ ${e}`)
  }
  await page.close()
}

await browser.close()
console.log(problems ? `\nCòn ${problems} vấn đề cần sửa.` : '\nĐạt chuẩn điện thoại ở 360 và 390px.')
process.exit(problems ? 1 : 0)
