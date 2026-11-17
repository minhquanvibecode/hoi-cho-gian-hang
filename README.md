# Gian hàng hội chợ cuối tuần

Ứng dụng web tiếng Việt giúp nhóm sinh viên lập kế hoạch gian hàng đồ uống và bánh đóng gói: chỉnh giả định, ghi đơn bán thử, biết cần bán bao nhiêu phần để hòa vốn và so sánh kịch bản lượng khách.

## Link demo
- **https://minhquanvibecode.github.io/hoi-cho-gian-hang/** (GitHub Pages, tự cập nhật mỗi lần push lên `main`)
- Mở trên điện thoại là dùng được ngay, không cần đăng nhập. Tab **Giả định** → **Nạp dữ liệu mẫu** để khôi phục dữ liệu BTC.

## Tính năng
### Theo yêu cầu đề
- [x] R1 Bảng sản phẩm: giá bán, chi phí biến đổi, số phần dự kiến; sửa được mọi giả định (sản phẩm, chi phí cố định, kịch bản).
- [x] R2 Ghi đơn bán thử: chọn sản phẩm + số lượng → doanh thu đơn hiện ngay, lưu đơn cộng vào "Đã bán".
- [x] R3 Doanh thu dự kiến, tổng chi phí biến đổi, chi phí cố định, lợi nhuận, số phần hòa vốn — có đơn vị và khối **Cách tính** (công thức → số thật → làm tròn).
- [x] R4 So sánh kịch bản Thận trọng và Cơ sở (thêm cột Kế hoạch để tham khảo); đổi lượt khách/tỷ lệ mua là cập nhật ngay.
- [x] R5 Thiết kế cho điện thoại 360px; toast khi lưu đơn/nạp mẫu/xoá đơn (có Hoàn tác); lỗi nhập hiện ngay dưới ô.
- [x] R6 Nút **Nạp dữ liệu mẫu** với hộp thoại xác nhận trong trang (tuỳ chọn xoá cả đơn thử).

### Phần nâng cao
- **Giả định có nguồn gốc**: mỗi ô có nhãn "BTC" hoặc "Đã chỉnh" (tô vàng, ghi giá trị BTC, nút ↺ trả về); banner ở Tổng quan báo đang chỉnh bao nhiêu ô.
- **Biên an toàn**: mỗi kịch bản vượt/thiếu bao nhiêu phần so với hòa vốn, quy ra số lượt khách có thể hụt mà vẫn không lỗ.
- **Kế hoạch so với thực tế**: thanh tiến độ đơn thử đã bán / số phần hòa vốn.
- **Biểu đồ** cột so sánh doanh thu – tổng chi phí – lợi nhuận giữa hai kịch bản.
- **Lọc đơn bán thử** theo sản phẩm, có tổng số đơn, số phần, doanh thu theo bộ lọc.
- **Ghi đơn nhanh tại quầy**: chạm ô sản phẩm (hiện giá và số đã bán) + nút số lượng nhanh 1/2/3/5 → 2–3 lần chạm là lưu xong một đơn.
- **Thanh trượt lượt khách và tỷ lệ mua** ngay trên Tổng quan: kéo là thấy số phần, lợi nhuận, biên an toàn đổi ngay; giá trị lưu chung với tab Giả định.
- **Thêm / xoá sản phẩm và khoản chi cố định** (có hộp thoại xác nhận; tối đa 8 sản phẩm, 10 khoản chi). Mục đội thêm có nhãn "Đội thêm"; "Nạp dữ liệu mẫu" trả về đúng danh mục BTC.
- **Xuất CSV** danh sách đơn bán thử theo bộ lọc (có dòng tổng, mở được bằng Excel/Google Sheets).
- **Bố cục 2 cột trên máy tính** (màn hình từ 900px), vẫn một cột trên điện thoại.
- **Gợi ý cải thiện** (tính bằng code, so trên kịch bản Thận trọng): tăng giá 2.000 đ, đẩy món lãi góp cao, giảm 10% chi phí cố định — kèm lợi nhuận và điểm hòa vốn trước/sau, cảnh báo đi kèm; số lượt khách tối thiểu để hòa vốn ở từng tỷ lệ mua.

## Công thức và cách làm tròn
| Chỉ số | Công thức | Đơn vị | Làm tròn |
|---|---|---|---|
| Lãi góp/phần | Giá bán − Chi phí biến đổi | đ/phần | không |
| Chi phí cố định | Tổng các khoản chi cố định | đ | không |
| Lãi góp bình quân | Σ(lãi góp × số phần dự kiến) ÷ Σ số phần dự kiến (cơ cấu 80:55:60) | đ/phần | giữ số lẻ khi tính |
| Số phần hòa vốn | Chi phí cố định ÷ Lãi góp bình quân | phần | **làm tròn lên** |
| Số khách mua | Lượt khách × Tỷ lệ mua | khách | gần nhất (0,5 lên) |
| Số phần từng món | Số khách mua × tỷ trọng số phần dự kiến | phần | phần nguyên, **phần dư lớn nhất** để tổng = số khách mua |
| Doanh thu | Σ(Giá bán × số phần) | đ | không |
| Tổng CP biến đổi | Σ(Chi phí biến đổi × số phần) | đ | không |
| Lợi nhuận | Doanh thu − CP biến đổi − CP cố định | đ | không |
| Biên an toàn | Số phần bán − Số phần hòa vốn | phần | — |
| Doanh thu đơn | Giá lúc ghi đơn × Số lượng | đ | không |

### Kết quả với dữ liệu BTC (khớp test `src/lib/calc/plan.test.ts`)
Lãi góp bình quân = 2.210.000 ÷ 195 = 11.333,33 đ/phần → hòa vốn 550.000 ÷ 11.333,33 = 48,53 → **49 phần**.

| | Thận trọng | Cơ sở |
|---|---|---|
| Số khách mua | 100 × 55% = 55 | 150 × 65% = 97,5 → 98 |
| Trà chanh / Cacao đá / Bánh quy | 23 / 15 / 17 | 40 / 28 / 30 |
| Doanh thu | 1.090.000 đ | 1.950.000 đ |
| CP biến đổi | 468.000 đ | 838.000 đ |
| CP cố định | 550.000 đ | 550.000 đ |
| Lợi nhuận | **72.000 đ** | **562.000 đ** |
| Biên an toàn | 6 phần | 49 phần |

## Dữ liệu mẫu và giả định
| Sản phẩm | Giá bán/phần (đ) | Chi phí biến đổi/phần (đ) | Số phần dự kiến |
|---|---|---|---|
| Trà chanh | 20.000 | 8.000 | 80 |
| Cacao đá | 25.000 | 11.000 | 55 |
| Bánh quy gói | 15.000 | 7.000 | 60 |

| Khoản chi cố định | Số tiền (đ) | Ghi chú |
|---|---|---|
| Phí thuê gian | 300.000 | Một ngày hội chợ |
| Trang trí và bảng giá | 150.000 | Chi một lần |
| Đá, ly và khăn giấy dự phòng | 100.000 | Ước tính cho ngày bán |

| Kịch bản | Lượt khách | Tỷ lệ mua | Ghi chú |
|---|---|---|---|
| Thận trọng | 100 | 55% | Lượng khách thấp |
| Cơ sở | 150 | 65% | Ước tính của nhóm |

Giả định của đội: mỗi khách mua 1 phần; mức thay đổi trong phần Gợi ý (+2.000 đ, chuyển 10 phần, −10% chi phí cố định) là ví dụ do đội chọn.

## Quyết định với điểm đề chưa rõ
| Đề chưa rõ | Cách xử lý |
|---|---|
| Mỗi khách mua mấy phần | 1 khách = 1 phần |
| 97,5 khách | Làm tròn gần nhất → 98 |
| Làm tròn từng món làm lệch tổng (23+16+17 = 56 ≠ 55) | Phần dư lớn nhất: tổng luôn bằng số khách mua |
| Hòa vốn 48,53 phần | Làm tròn lên 49 (bán 48 phần vẫn lỗ) |
| Cơ cấu tính lãi góp bình quân | Theo số phần dự kiến đang dùng (sửa số phần dự kiến → đổi theo) |
| Nạp mẫu có xoá đơn thử không | Mặc định giữ đơn; hộp thoại có ô "Xoá cả đơn bán thử" |
| Đổi giá sau khi đã ghi đơn | Đơn giữ giá lúc ghi |
| Xoá sản phẩm đã có đơn thử | Giữ đơn (doanh thu đơn không đổi); bộ lọc hiện "(đã xoá)" |
| Giá ≤ chi phí | Cảnh báo dưới ô; lãi góp bình quân ≤ 0 → "Không thể hòa vốn" |

## Công nghệ
Vite + React + TypeScript · Vitest · lưu trên trình duyệt (localStorage) · triển khai GitHub Pages (GitHub Actions). Không có máy chủ, không thu thập dữ liệu cá nhân.

## Chạy trên máy
```bash
npm install
npm run dev        # mở http://localhost:5173
npm test           # chạy kiểm thử tính toán
npm run build      # build ra thư mục dist/
```

## Ảnh chụp (khổ 360px)
| Tổng quan | Giả định | Đơn thử |
|---|---|---|
| ![Tổng quan](evidence/360-tong-quan.png) | ![Giả định](evidence/360-gia-dinh.png) | ![Đơn thử](evidence/demo-3-don-thu.png) |

## Minh chứng quá trình
- Lịch sử commit: https://github.com/minhquanvibecode/hoi-cho-gian-hang/commits/main
- Nhật ký thời gian: [docs/TIMELINE.md](docs/TIMELINE.md)
- Phân tích đề: [docs/PHAN-TICH-DE.md](docs/PHAN-TICH-DE.md)
- Kiểm tra điện thoại: `scripts/check-mobile.mjs`; chạy kịch bản demo tự động (15 bước, gồm cả khổ máy tính 1280px): `scripts/demo-flow.mjs` (ảnh trong `evidence/`)

![Máy tính 1280px](evidence/desktop-1280-tong-quan.png)
