# BÁO CÁO VLI PC CLIENT UI V24.10

## Phạm vi
Bản cập nhật RIÊNG cài lên Võ Lâm Idle Offline H5 **đã có V24.9** (và nền V24.3/V24.8). Không thay game, không chép save, không can thiệp mã skill 120/150 hoặc chiến trường Tống Kim.

## Các thay đổi

| Yêu cầu | Đã triển khai | Cơ chế/giới hạn |
| --- | --- | --- |
| Bỏ thanh menu chữ dư | Thu gọn `.quick-dock` | Có nút `Chức năng ≡` để vẫn truy cập các cửa sổ |
| Chữ/bảng dư ở trang nhân vật | Giảm lớp chữ bị chồng, phủ tiêu đề Việt và nền sau ô trang bị | Những phần skin PC gốc không thể làm đẹp tuyệt đối bằng CSS |
| Túi không có tiền | Hiển thị S.gold thành `vạn/lượng`, S.knb thành Kim Nguyên Bảo | Lấy trực tiếp trạng thái game hiện tại |
| Dọn túi | Sắp xếp giao diện theo độ quý, cấp, vị trí, sức mạnh... | **Không bán hoặc xóa vật phẩm** |
| Bán nhanh | Sử dụng `sellUnmatched()` gốc, có xác nhận | Chặn giao dịch nếu bộ lọc có nguy cơ bán đồ hiếm/Hoàng Kim/Bạch Kim chưa bảo vệ; không hoàn tác được khi đã bán |
| Lọc trang bị | Tất cả/Hoàng Kim/Bạch Kim/Đã khóa, cho truy cập Bộ lọc nhặt | Lọc hiển thị trong túi, không thay luật nhặt đồ trừ khi tự đổi trong menu lọc gốc |
| Bấm ngựa mở Mã Trường | Chặn sự kiện mở bảng vật phẩm bình thường, dùng `actModal('horse')` gốc | Cửa sổ Mã Trường gốc vẫn là modal H5, chưa phải skin PC 1:1 |
| Kênh Tất cả/Mật/Tên/Bang hội/Môn phái/Khác | Tất cả đều chọn, nhập, hiển thị được; tin ngoại tuyến lưu localStorage theo nhân vật | Tin chat lưu cục bộ **không phải tin gửi cho người chơi khác**; Tất cả chỉ gọi `chatSend` thật khi cấu hình backend online |
| Hiệu ứng Hoàng Kim môn phái | Khi trang bị thay đổi: kiểm tra đồng bộ R.look bằng heroLook; nút `Khôi phục hiệu ứng Hoàng Kim` bật `S.lookFx=true`, `S.lowFx=false` rồi gọi `recalc`/`jxPreload` | Hiệu ứng chỉ xuất hiện nếu vật phẩm và bộ đồ đạt điều kiện gốc. **Chưa bảo đảm đã lấy được hiệu ứng PC nguyên bản** nếu thiếu sprite nguồn |

## Tính an toàn
- Trình cài lưu bản sao `index.html` và tệp patch cũ trong `_BACKUP_PC_UI_V24_10/<timestamp>`.
- Chỉ chép thư mục `vli-pc-ui-v2410` và sửa thẻ CSS/JS trong index.html.
- Bộ cài cho phép giải nén trong thư mục game, chỉ chặn đường dẫn nguồn/đích thực sự trùng hoặc lồng nhau.
- Nút `KHOI_PHUC_TRUOC_V24_10.cmd` phục hồi `index.html` và thư mục patch. **Giao dịch bán vật phẩm/đổi thiết lập đã làm trong lúc chơi không bị hoàn tác**.
- Chat địa phương lưu trong trình duyệt. Không chia sẻ tin giữa các máy.

## Kiểm thử
- `node --check`: JavaScript hợp lệ.
- VM Node: định nghĩa API V24.10, mở Mã Trường, bật và đồng bộ hiệu ứng, xử lý bộ lọc (PASS).
- Tệp CSS/JS được kiểm tra kích thước và đường dẫn.
- Kiểm tra ZIP bằng `ZipFile.testzip` và SHA-256.
- **Chưa kiểm thử trực tiếp trên trình duyệt đang chạy game ở máy của người dùng.** Môi trường thử Chromium hiện chặn điều hướng tới trang thử nghiệm nội bộ (`ERR_BLOCKED_BY_ADMINISTRATOR`), do đó không có kết luận “đã kiểm thử 100% trên Chromium”.

## Cách xác nhận
1. Cài V24.10 lên game có V24.9.
2. Ctrl+F5, mở Nhân vật, Hành trang, bấm ô ngựa, thử kênh Mật.
3. F12: `VLI_PC_UI_V2410.status()` — cần `ready: true`, `pcUI: true`.
4. Với hiệu ứng Hoàng Kim: mở Nhân vật, bấm `Khôi phục hiệu ứng Hoàng Kim`, xem `goldFx` trong `status()`; `hasAura: false` có thể do bộ chưa đủ điều kiện.
5. Khi bán nhanh hãy kiểm tra bộ lọc trước và sao lưu save game nếu cần.
