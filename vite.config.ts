import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base './' → cùng một bản build chạy được ở gốc subdomain cPanel
// lẫn thư mục con https://<owner>.github.io/<repo>/
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
