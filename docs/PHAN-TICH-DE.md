# Phiếu phân tích đề — Gian hàng hội chợ cuối tuần

## 1. Bối cảnh
- Ai dùng app: nhóm sinh viên mở gian hàng đồ uống + bánh đóng gói tại hội chợ trong trường.
- Dùng lúc nào / ở đâu: trước ngày bán (lập kế hoạch, chỉnh giả định) và tại gian hàng trên điện thoại (ghi đơn bán thử).
- Câu hỏi chính app phải trả lời: **Bán bao nhiêu phần thì hòa vốn, và với lượng khách thận trọng / cơ sở thì lời hay lỗ bao nhiêu?**

## 2. Checklist yêu cầu bắt buộc
- [ ] R1 Hiển thị sản phẩm, giá bán, chi phí mỗi phần, số lượng dự kiến; cho phép điều chỉnh giả định.
- [ ] R2 Ghi đơn bán thử: chọn sản phẩm + nhập số lượng → tính doanh thu đơn, cập nhật số lượng đã bán.
- [ ] R3 Tính doanh thu dự kiến, tổng chi phí biến đổi, chi phí cố định, lợi nhuận dự kiến, số phần hòa vốn — ghi đơn vị và công thức/cách tính.
- [ ] R4 So sánh ≥ 2 kịch bản lượng khách (Thận trọng, Cơ sở); kết quả đổi theo giả định.
- [ ] R5 Dễ đọc trên điện thoại; phản hồi khi lưu đơn và khi nhập sai.
- [ ] R6 Nút "Nạp dữ liệu mẫu" khôi phục sản phẩm, chi phí, giả định ban đầu của BTC.
- [ ] R7 Hiển thị rõ giả định đang dùng (BTC hay đã chỉnh).

## 3. Dữ liệu mẫu BTC (chép nguyên văn → `src/config/seed.ts`)
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

| Kịch bản | Lượt khách dự kiến | Tỷ lệ mua dự kiến | Ghi chú |
|---|---|---|---|
| Thận trọng | 100 | 55% | Lượng khách thấp |
| Cơ sở | 150 | 65% | Ước tính của nhóm |

## 4. Công thức (đơn vị + làm tròn)
| Chỉ số | Công thức | Đơn vị | Làm tròn |
|---|---|---|---|
| Lãi góp/phần của SP | Giá bán − Chi phí biến đổi | đ/phần | không |
| Chi phí cố định (CPCĐ) | Tổng các khoản chi cố định | đ | không |
| Lãi góp bình quân/phần | Σ(lãi góp × số phần dự kiến) ÷ Σ số phần dự kiến (cơ cấu 80:55:60) | đ/phần | giữ số lẻ khi tính; hiển thị làm tròn tới đồng |
| Số phần hòa vốn | CPCĐ ÷ Lãi góp bình quân | phần | **làm tròn lên** (bán thiếu 1 phần vẫn lỗ) |
| Số khách mua | Lượt khách × Tỷ lệ mua | khách | làm tròn tới số nguyên gần nhất (0,5 → lên) |
| Tổng số phần kịch bản | = Số khách mua (mỗi khách 1 phần) | phần | — |
| Số phần từng SP | Tổng số phần × tỷ trọng số phần dự kiến | phần | làm tròn tới phần nguyên theo **phần dư lớn nhất** để tổng đúng bằng số khách mua |
| Doanh thu dự kiến | Σ(Giá bán × số phần) | đ | không |
| Tổng chi phí biến đổi | Σ(Chi phí biến đổi × số phần) | đ | không |
| Lợi nhuận dự kiến | Doanh thu − CP biến đổi − CPCĐ | đ | không |
| Biên an toàn | Tổng số phần kịch bản − Số phần hòa vốn | phần | — |
| Doanh thu đơn | Giá bán × số lượng | đ | không |

## 5. Bảng số tính tay (đáp án cho test)
Chung: lãi góp/phần Trà chanh 12.000 · Cacao đá 14.000 · Bánh quy 8.000. CPCĐ = 550.000 đ.
Lãi góp bình quân = (12.000×80 + 14.000×55 + 8.000×60) ÷ 195 = 2.210.000 ÷ 195 = **11.333,33 đ/phần**.
Hòa vốn = 550.000 ÷ 11.333,33 = 48,53 → **49 phần**.

| | Kế hoạch (bảng SP) | Thận trọng | Cơ sở |
|---|---|---|---|
| Số khách mua | — | 100×55% = 55 | 150×65% = 97,5 → 98 |
| Chia thô (80:55:60) | 80 / 55 / 60 | 22,564 / 15,513 / 16,923 | 40,205 / 27,641 / 30,154 |
| Số phần TC / CC / BQ | 80 / 55 / 60 | **23 / 15 / 17** | **40 / 28 / 30** |
| Tổng số phần | 195 | 55 | 98 |
| Doanh thu (đ) | 3.875.000 | **1.090.000** | **1.950.000** |
| CP biến đổi (đ) | 1.665.000 | **468.000** | **838.000** |
| CPCĐ (đ) | 550.000 | 550.000 | 550.000 |
| Lợi nhuận (đ) | 1.660.000 | **72.000** | **562.000** |
| Biên an toàn (phần) | 146 | 6 | 49 |

Đơn thử ví dụ: 3 Cacao đá → 75.000 đ; đã bán Cacao đá tăng 3.

## 6. Điểm mơ hồ → quyết định
| # | Đề chưa rõ | Quyết định | Lý do |
|---|---|---|---|
| Q1 | Mỗi khách mua mấy phần? | 1 khách = 1 phần | Đề chia "số phần" từ "số khách mua" |
| Q2 | 97,5 khách | Làm tròn gần nhất → 98 | "Làm tròn tới phần nguyên" |
| Q3 | Làm tròn từng SP làm lệch tổng (23+16+17 = 56 ≠ 55) | Phần dư lớn nhất: tổng luôn = số khách mua | Tránh lệch 1 phần khi trình bày |
| Q4 | Hòa vốn 48,53 phần | Làm tròn **lên** 49 | 48 phần vẫn lỗ |
| Q5 | Lãi góp bình quân dùng cơ cấu nào | Cơ cấu số phần dự kiến hiện tại (đổi khi người dùng sửa số phần dự kiến) | Đúng câu chữ đề |
| Q6 | "Kế hoạch" 195 phần so với kịch bản | Hiện thêm cột "Kế hoạch" để tham khảo; 2 kịch bản là chính | Thấy kế hoạch gốc lạc quan hơn cả kịch bản Cơ sở |
| Q7 | Nạp mẫu có xoá đơn thử? | Hộp thoại có ô "Xoá cả đơn bán thử" (mặc định **không** chọn) | Đề chỉ nói khôi phục SP, chi phí, giả định |
| Q8 | Giá đổi sau khi đã ghi đơn | Đơn lưu giá tại thời điểm ghi | Doanh thu đơn không tự đổi |
| Q9 | Giá trị biên | Số nguyên ≥ 0; tỷ lệ 0–100%; giá ≤ chi phí → cảnh báo vàng (vẫn cho lưu); lãi góp bình quân ≤ 0 → "Không thể hòa vốn"; đơn: số lượng 1–999 | Không chia cho 0, phản hồi ngay dưới ô |

## 7. Gán thang điểm → tính năng
Đề không công bố thang điểm → suy từ yêu cầu + phần mở rộng.

| Tiêu chí (suy ra) | Cách lấy điểm |
|---|---|
| Đúng lõi tính toán | R1–R4 + test khớp mục 5; khối **"Cách tính"** dưới mỗi số (công thức → số thật → làm tròn → đơn vị) |
| Giả định rõ ràng | **V1 Giả định có nguồn gốc**: nhãn "BTC"/"Đã chỉnh", ô đã chỉnh tô màu, nút ↺ từng ô |
| Phân tích | **V2 Biên an toàn + kế hoạch vs thực tế**: mỗi kịch bản cách hòa vốn bao nhiêu phần; đơn thử đã bán / 49 phần hòa vốn (thanh tiến độ) |
| Phần mở rộng đề | **V3 Biểu đồ** cột doanh thu – chi phí – lợi nhuận 2 kịch bản (SVG tự vẽ) · **V4 Lọc đơn** theo sản phẩm + tổng theo bộ lọc · **V5 Gợi ý cải thiện** (tăng giá 2.000 đ, đổi cơ cấu sang SP lãi góp cao…) kèm số trước/sau |
| Giao diện điện thoại | 360px trước, tab dưới, nút ≥ 44px, toast + hộp thoại trong trang |

## 8. Màn hình (4 tab)
| Tab (`data-tab`) | Nội dung | Yêu cầu |
|---|---|---|
| `tong-quan` Tổng quan | Thẻ hòa vốn, 2 kịch bản (doanh thu, CP biến đổi, CPCĐ, lợi nhuận, biên an toàn), biểu đồ, gợi ý, Cách tính | R3, R4, V2, V3, V5 |
| `gia-dinh` Giả định | Bảng SP (giá, chi phí, số phần dự kiến), khoản chi cố định, 2 kịch bản (lượt khách, tỷ lệ mua), nút Nạp dữ liệu mẫu | R1, R4, R6, R7, V1 |
| `don-thu` Đơn thử | Form chọn SP + số lượng → doanh thu đơn; đã bán theo SP; danh sách đơn có lọc, xoá | R2, R5, V4 |

(3 tab là đủ; giữ gọn để kịp giờ.)

## 9. Cắt phạm vi
- Bỏ đầu tiên nếu trễ: V5 Gợi ý cải thiện.
- Bỏ thứ hai: V3 Biểu đồ.
- Không bao giờ bỏ: checklist mục 2, nút Nạp dữ liệu mẫu, Cách tính, deploy, README.

## 10. Thông tin triển khai
- Tên repo: `hoi-cho-gian-hang` (public)
- Link chính: GitHub Pages `https://minhquanvibecode.github.io/hoi-cho-gian-hang/` (chủ dự án quyết định bỏ cPanel)
