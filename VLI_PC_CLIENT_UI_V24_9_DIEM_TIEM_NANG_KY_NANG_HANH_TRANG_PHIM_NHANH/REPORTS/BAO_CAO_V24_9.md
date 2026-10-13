# Báo cáo cập nhật PC Client UI V24.9 (Võ Lâm Idle Offline H5)

## Tích hợp
- Bản cập nhật riêng, chỉ có `vli-pc-ui-v249/pc-controls-v249.js` và `.css`.
- Cần game V6 đã cài giao diện PC V24.3; tương thích V24.8 (Kỳ Trân Các + chat).
- Dùng `attrAddModal('str'|'dex'|'vit'|'eng')` để cộng thủ công, **có kiểm tra điểm và cơ chế lưu sẵn của game**.
- Một bảng Võ công chung hiển thị **toàn bộ kỹ năng đã học**, bao gồm tấn công, hỗ trợ và bị động. Bấm chọn chiêu chính; chuột phải gán vào ô đánh phải.
- Lưới hành trang 6 cột × 10 hàng, phân trang do V24.3 quản lý, các ô trống không làm phát sinh vật phẩm.
- Dịch ô vật phẩm 1/2/3 gọi hàm `drinkNow(life)`, `drinkNow(mana)`, `goTown/backFromTown`; chuột phải ở ô 1/2 mở `potSlotModal`.
- Hai ô kỹ năng bổ sung phía phải dùng `pressSlot(0)` / `pressSlot(1)` và chuột phải chọn `skSlotModal(0)` / `skSlotModal(1)`.

## Giới hạn
- Không thay toàn bộ HUD và không thể bảo đảm giống PC 100% từng pixel khi màn hình có độ phân giải khác.
- Tệp V24.9 chỉ chứa mã bổ sung và CSS; không chứa lại tài nguyên PC 24.3/V24.8.
- Hai nút kỹ năng vẫn sử dụng **một hệ thống chiêu chính của gameplay H5**, chưa phải hai cơ chế chuột trái/phải độc lập như PC.
- Chỉ hiển thị kỹ năng đã học, không tạo kỹ năng chưa học hoặc thiếu dữ liệu.
- Chưa kiểm thử trực tiếp trên máy Windows của người dùng. Cần thực nghiệm sau khi cài.

## Khôi phục
- Installer sao lưu `index.html` và bộ cập nhật cũ trước khi ghi.
- Chạy `KHOI_PHUC_TRUOC_V24_9.cmd` để trở lại giao diện trước cập nhật.

## Kiểm thử trước phát hành
- `node --check`: đạt, JavaScript hợp lệ.
- Chromium DOM mô phỏng (không phải bản game cài Windows): **4 nút cộng**, một khung kỹ năng, **60 ô hành trang** (2 vật phẩm + 58 ô trống), **3 phím vật phẩm**, **2 ô đánh**, không ghi nhận lỗi JavaScript.
- Thao tác thật trên nút được chuyển đúng về hàm V6 trong mock: `attrAddModal(str)`, `selectPrimarySkillV8(768)`, `assignSlot(1,769)`, `drinkNow(life/mana)`, `goTown`, `pressSlot(0)`, `skSlotModal(1)`.
- Việc chạy trực tiếp bản game tại địa chỉ trình duyệt bị môi trường kiểm thử chặn; **chưa thể kiểm tra sự chồng lấn cửa sổ trên bản Windows của người dùng**.
