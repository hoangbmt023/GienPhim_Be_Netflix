# GienPhim API Documentation

Tài liệu hướng dẫn sử dụng các API cho hệ thống GienPhim (Netflix Clone Backend).

**Base URL**: `http://localhost:8080`

---

## 1. Xác thực (Authentication) - `/api/auth`

| Method | Endpoint | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| POST | `/login` | No | Đăng nhập bằng email và password. Trả về `accessToken` và `refreshToken`. |
| POST | `/refresh-token` | No | Lấy `accessToken` mới bằng `refreshToken`. |
| POST | `/logout` | No | Đăng xuất (xóa `refreshToken` khỏi DB). |
| POST | `/revoke-token` | Admin | Thu hồi `refreshToken` của bất kỳ user nào. |
| POST | `/send-activate-otp` | No | Gửi mã OTP kích hoạt tài khoản qua email. |
| POST | `/activate-account` | No | Kích hoạt tài khoản bằng mã OTP. |
| POST | `/forgot-password` | No | Yêu cầu mã OTP để khôi phục mật khẩu. |
| POST | `/verify-forgot-password` | No | Xác nhận mã OTP quên mật khẩu có hợp lệ không. |
| POST | `/reset-password` | No | Đặt lại mật khẩu mới sau khi xác thực OTP. |

---

## 2. Người dùng (Users) - `/api/users`

| Method | Endpoint | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| POST | `/register` | No | Đăng ký tài khoản mới. |
| GET | `/` | Admin | Lấy danh sách toàn bộ người dùng (Phân trang). |
| PUT | `/:userId/ban` | Admin | Khóa/Mở khóa tài khoản người dùng. |
| PUT | `/:userId/roles` | Admin | Cập nhật vai trò (USER, MODERATOR, ADMIN). |

---

## 3. Tài khoản con (Profiles) - `/api/profiles`

Mỗi tài khoản người dùng có thể tạo tối đa **5 tài khoản con** để quản lý lịch sử xem riêng biệt.

| Method | Endpoint | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| GET | `/` | Login | Lấy danh sách các tài khoản con của user hiện tại. |
| POST | `/` | Login | Tạo tài khoản con mới (Tên, Avatar, PIN). |
| PUT | `/:profileId` | Login | Cập nhật thông tin tài khoản con. |
| DELETE | `/:profileId` | Login | Xóa tài khoản con. |

---

## 4. Phim & Lịch sử (Movies & History) - `/api/movies`

Hệ thống tự động đồng bộ thông tin phim từ OPhim khi có yêu cầu xem/lưu lịch sử.

| Method | Endpoint | Auth | Mô tả |
| :--- | :--- | :--- | :--- |
| GET | `/` | No | Lấy danh sách phim đã lưu trong Database cục bộ. |
| GET | `/:slug` | No | Lấy thông tin chi tiết phim theo Slug. Nếu phim chưa có trong DB, hệ thống sẽ tự động fetch từ OPhim và lưu lại các trường cơ bản. |
| GET | `/history/:profileId` | Login | Lấy danh sách lịch sử xem phim của một tài khoản con. |
| POST | `/history` | Login | Lưu hoặc cập nhật tiến độ xem phim (Tập phim, thời gian giây). |
| DELETE | `/history/:profileId/:historyId` | Login | Xóa một bản ghi lịch sử xem phim. |
| DELETE | `/history/:profileId` | Login | Xóa toàn bộ lịch sử xem phim của một tài khoản con. |

---

## Cấu trúc Header Authorization

Hầu hết các API yêu cầu xác thực phải gửi kèm token trong Header:
`Authorization: Bearer <your_access_token>`

## Định dạng Phản hồi (Response)

Hệ thống trả về JSON theo định dạng chuẩn:

**Thành công:**
```json
{
  "success": true,
  "message": "Thành công",
  "data": { ... }
}
```

**Thất bại:**
```json
{
  "success": false,
  "message": "Thông báo lỗi chi tiết"
}
```
