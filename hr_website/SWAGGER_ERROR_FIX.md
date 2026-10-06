# Báo cáo: Sửa lỗi 500 trang Swagger API

## 1. Mô tả lỗi
Khi truy cập vào đường link tài liệu Swagger API của dự án (`/api-docs` và `/api/swagger`), hệ thống không tải được giao diện mà trả về lỗi `500 Internal Server Error`.

## 2. Nguyên nhân
Nguyên nhân gốc rễ (root cause) đến từ thư viện `swagger-ui-react` mà dự án đang sử dụng:
- Phiên bản được cài đặt trong `package.json` quá cũ (`^3.23.3`).
- Trong mã nguồn CSS của thư viện phiên bản này có chứa đoạn code CSS dùng thủ thuật (hack) tương thích ngược cho trình duyệt IE cũ, cụ thể là khai báo `*zoom: 1;`.
- Dự án sử dụng Next.js phiên bản mới với trình biên dịch CSS hiện đại (PostCSS / Tailwind v4). Khi trình biên dịch xử lý file `swagger-ui.css`, nó không nhận diện được cú pháp `*zoom: 1;` và ném ra lỗi:
  > `Error: Parsing CSS source code failed`
- Lỗi biên dịch này làm sập quá trình kết xuất (render) trang `/api-docs` khiến máy chủ Next.js báo lỗi 500.

## 3. Cách khắc phục
Nâng cấp thư viện `swagger-ui-react` lên phiên bản mới nhất (`5.33.1`). Ở phiên bản mới, các đoạn mã CSS cũ không tương thích đã được loại bỏ hoàn toàn.

**Lệnh đã thực thi:**
```bash
npm install swagger-ui-react@latest --legacy-peer-deps
```
*(Ghi chú: Cờ `--legacy-peer-deps` được sử dụng để bỏ qua xung đột phiên bản phụ của Eslint trong quá trình cài đặt).*

## 4. Kết quả
Trang `/api-docs` và API endpoint `/api/swagger` đã hoạt động bình thường, hiển thị đầy đủ giao diện tài liệu API cho người dùng.
