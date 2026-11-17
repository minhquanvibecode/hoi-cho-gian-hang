# Hồ sơ nộp bài — Gian hàng hội chợ cuối tuần

## 1. Link demo và cách mở sản phẩm
- **Link demo:** https://minhquanvibecode.github.io/hoi-cho-gian-hang/
- Mở bằng Chrome hoặc Safari trên điện thoại hay máy tính. Không cần đăng nhập, không cần cài đặt.
- Link phải có đuôi `/hoi-cho-gian-hang/`; trang gốc `minhquanvibecode.github.io` không có nội dung.
- Cách dùng nhanh (đúng kịch bản demo của đề):
  1. Tab **Giả định** → **Nạp dữ liệu mẫu** → xác nhận.
  2. Tab **Tổng quan** → kéo thanh **Lượt khách** hoặc **Tỷ lệ mua** → doanh thu, lợi nhuận, điểm hòa vốn cập nhật ngay.
  3. Tab **Đơn thử** → chạm một món → chọn số lượng → **Lưu đơn**.
  4. Quay lại **Tổng quan** → so sánh hai kịch bản Thận trọng và Cơ sở; bấm **Cách tính** để xem công thức.

## 2. Source code
- **Repo (public):** https://github.com/minhquanvibecode/hoi-cho-gian-hang
- **Đúng bản demo:** link demo được build tự động từ nhánh `main` bằng GitHub Actions (`.github/workflows/pages.yml`), chỉ đăng khi toàn bộ test qua. Lịch sử build: https://github.com/minhquanvibecode/hoi-cho-gian-hang/actions
- **Bản chốt:** tag `nop-bai` và trang Release https://github.com/minhquanvibecode/hoi-cho-gian-hang/releases/tag/nop-bai (có file mã nguồn nén và `dist.zip` là bản build đang chạy trên link demo).

## 3. README
https://github.com/minhquanvibecode/hoi-cho-gian-hang#readme gồm:
- Cách mở sản phẩm, cài đặt và chạy trên máy (`npm install`, `npm run dev`, `npm test`, `npm run build`).
- Công nghệ: React + TypeScript, Vite, Vitest, Playwright, localStorage, GitHub Pages.
- Dữ liệu mẫu BTC, công thức và cách làm tròn, bảng kết quả tính tay, các quyết định với điểm đề chưa rõ.

## 4. Minh chứng bản nộp tại thời điểm chốt
Thư mục [evidence/nop-bai/](evidence/nop-bai/):
- `demo.webm`: video quay màn hình điện thoại (375px) chạy đúng kịch bản demo trên link thật.
- Ảnh `01`–`07`: từng bước của kịch bản; góc dưới mỗi ảnh có nhãn giờ chốt và mã commit.
- `MINH-CHUNG.md`: giờ chốt, mã commit của bản đang chạy, kết quả kiểm tra.

Minh chứng quá trình: [lịch sử commit](https://github.com/minhquanvibecode/hoi-cho-gian-hang/commits/main), [docs/TIMELINE.md](docs/TIMELINE.md), [docs/PHAN-TICH-DE.md](docs/PHAN-TICH-DE.md).
