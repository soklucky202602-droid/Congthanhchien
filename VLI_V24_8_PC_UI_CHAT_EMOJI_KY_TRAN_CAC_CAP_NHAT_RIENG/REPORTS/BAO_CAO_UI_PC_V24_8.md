# Võ Lâm Idle H5 Offline — Bản cập nhật PC Client UI V24.8

## 1. Cơ sở đối chiếu
Người dùng cung cấp ảnh chụp client Sword3CTC: Kỳ Trân Các (năm danh mục), nhân vật, võ công, hội nhóm, bang phái, liên lạc, chat và bảng biểu tượng. Bản H5 nền V24.3 có `shell.js`, `bridge.js`, `controls-v24-2.js` và các giao diện PC đã chuyển trước.

## 2. Các chỉnh sửa
| Mục | Thực hiện | Giới hạn |
| --- | --- | --- |
| Kỳ Trân Các PC | Khung 575×508, 5 thẻ, lưới **3×5 = 15** mỗi trang, nút Trước/Kế/Mua/Đóng | Dữ liệu cửa hàng V6 chỉ có 13 món khác PC; các món còn thiếu không được tạo giả. |
| Cửa hàng H5 | `data-game="ktc"` và `ktcModal()` (khi UI PC bật) mở bảng PC; nút Mua gọi `ktcBuy(key,1,true)` | Điều kiện mua, giá, save và logic vật phẩm vẫn thuộc game gốc. |
| Chat | Khung nhập được tái tạo từ ảnh PC, xóa chuỗi chat mẫu, neo dưới trái | Offline chat kế thừa V24.2; chưa gửi được lên server bên ngoài. |
| Icon chat | Bảng chọn **72 biểu tượng (9×8)** bằng ảnh PC; chèn shortcode `:pcNN:`; chuyển thành sprite trong log hiển thị | Đây là icon hiển thị trong H5, không chứng minh truyền icon tới client multiplayer. |
| Võ công | Đổi vùng danh sách sang icon dạng lưới 5 cột, lọc chiêu tấn công/kỹ năng hỗ trợ | Không sửa nội dung kỹ năng, không thay animation PC. |
| Nhân vật | Ghi các thông số hiện có từ S/R lên lớp phủ PC, che phần chữ nền bị trùng | Chỉ những thuộc tính có dữ liệu được hiển thị; không khẳng định giao diện đúng 100% PC. |
| Tổ đội, Hảo hữu, Bang phái | Khung/nhãn/điều hướng PC, nút Đóng hoạt động | Game gốc thiếu backend nên một số nút hiển thị nhưng khóa. |
| Dock | Thu nhỏ hàng phím tắt nhiều chữ thành dãy biểu tượng có tooltip | Một số icon dùng ký hiệu thay vì sprite gốc PC. |

## 3. Tài nguyên
- `assets/pc-emoticons-reference.png`: bảng PC được người dùng cung cấp.
- `assets/pc-emotes-9x8.png`: bản cắt dành cho các icon đặt trong log.
- `assets/pc-chat-entry-strip.png`: thanh chat PC; đã bỏ chữ người dùng gõ trong ảnh tham chiếu.
- `assets/pc-shop-empty-cell.png`: nền ô shop PC trống.
- Viền và nút tiếp tục dùng asset từ V24.3 trong `vli-pc-v24/assets/pc-v22/`.

## 4. Kiểm thử
- Kiểm tra cú pháp `node --check`: đạt.
- Kiểm tra giao diện mô phỏng Playwright (`page.set_content`, Chromium): **15 ô shop**, chuyển danh mục, nút mua gọi đúng callback mô phỏng, **72 icon**, chèn `:pcNN:`, render icon; không có lỗi JavaScript trong các thao tác đó.
- Trang game thật không được nạp bằng Chromium ở môi trường kiểm thử vì trình duyệt trả `ERR_BLOCKED_BY_ADMINISTRATOR` cho cả URL cục bộ và `file:`. **Chưa kiểm thử được đầy đủ trong game thực tế.**
- Chưa chạy bộ cài PowerShell trực tiếp trên Windows; logic sao lưu, kiểm tra tệp và chống chồng lấn được kiểm tra mã nguồn.

## 5. Giữ nguyên và hoàn tác
Bản cập nhật chỉ thêm `vli-pc-ui-v248/` và thẻ tải CSS/JS vào `index.html`. Không chỉnh `js/main.js`, `js/render.js`, dữ liệu save, vũ khí, kỹ năng, hiệu ứng Cái Bang V24.7, hay Tống Kim. Mỗi lần cài tạo sao lưu trong `_BACKUP_PC_UI_V24_8`, có `KHOI_PHUC_TRUOC_V24_8.cmd`.

## 6. Những phần chưa đạt "giống PC 100%"
- Một số skin, font và icon của các cửa sổ PC chưa tách thành từng tài nguyên sprite gốc.
- Cửa hàng H5 không chứa đủ mặt hàng như các ảnh PC; không được thay số lượng/giá để tạo vẻ giống nhưng sai gameplay.
- Backend xã hội (hảo hữu, bang phái, tổ đội) chưa hoạt động hoàn chỉnh trong game offline.
- Chưa kiểm thử toàn bộ quy trình mua vật phẩm, xử lý chat, đóng/mở nhiều cửa sổ trong phiên Windows thật.
