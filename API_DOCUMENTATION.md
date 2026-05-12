# 📺 GienPhim API Documentation

**Phiên bản**: 1.0.0  
**Base URL**: `http://localhost:3000` (hoặc URL server của bạn)  
**Content-Type**: `application/json`

---

## 📋 Mục Lục

1. [Authentication - Xác thực](#authentication--xác-thực)
2. [Users - Quản lý người dùng](#users--quản-lý-người-dùng)
3. [Profiles - Tài khoản con](#profiles--tài-khoản-con)
4. [Movies - Phim](#movies--phim)
5. [Error Handling - Xử lý lỗi](#error-handling--xử-lý-lỗi)

---

## Authentication - Xác thực

### Các Header yêu cầu

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <accessToken>" // Yêu cầu cho endpoints được bảo vệ
}
```

### Token Flow

```
1. Người dùng đăng nhập → nhận accessToken + refreshToken
2. Sử dụng accessToken cho các request tiếp theo
3. Khi accessToken hết hạn → sử dụng refreshToken để lấy token mới
4. Đăng xuất → xóa refreshToken khỏi DB
```

---

## Authentication - Xác thực

### 1. Đăng ký tài khoản

**POST** `/api/auth/register`

#### 📥 Request

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

#### ✅ Validation

- `email`: Bắt buộc, định dạng email hợp lệ
- `password`: Bắt buộc, tối thiểu 6 ký tự

#### 📤 Response (201)

```json
{
  "success": true,
  "message": "Tài khoản đã được đăng ký thành công.",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Kiểm tra email có tồn tại chưa
2. Hash password với bcrypt
3. Lưu user vào DB với status = `PENDING`
4. Tự động tạo profile mặc định cho user

---

### 2. Đăng nhập

**POST** `/api/auth/login`

#### 📥 Request

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

#### ✅ Validation

- `email`: Bắt buộc, định dạng email hợp lệ
- `password`: Bắt buộc, đúng định dạng mạnh (chữ hoa, chữ thường, số, ký tự đặc biệt)

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### ⚙️ Luồng xử lý

1. Tìm user theo email
2. Kiểm tra password đúng (bcrypt compare)
3. Kiểm tra user không bị BAN
4. Kiểm tra user đã ACTIVE
5. Tạo JWT accessToken (thời hạn: ~15 phút)
6. Tạo JWT refreshToken và lưu vào DB (thời hạn: ~7 ngày)
7. Trả về cả hai token

#### ❌ Errors

- `401`: Email hoặc password sai
- `403`: Tài khoản đã bị khóa hoặc chưa kích hoạt

---

### 3. Refresh Token (Lấy token mới)

**POST** `/api/auth/refresh-token`

#### 📥 Request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Lấy token mới thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### ⚙️ Luồng xử lý

1. Verify refreshToken signature
2. Kiểm tra token tồn tại trong DB
3. Kiểm tra token chưa hết hạn
4. Tạo accessToken mới
5. Trả về accessToken

#### ❌ Errors

- `400`: Token không hợp lệ
- `401`: Token hết hạn
- `404`: Refresh token không tồn tại

---

### 4. Đăng xuất

**POST** `/api/auth/logout`

#### 📥 Request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Đăng xuất thành công",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Tìm refreshToken trong DB
2. Xóa token khỏi DB
3. Client xóa tokens khỏi localStorage

---

### 5. Gửi OTP kích hoạt tài khoản

**POST** `/api/auth/send-activate-otp`

#### 📥 Request

```json
{
  "email": "user@example.com"
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "OTP kích hoạt đã được gửi đến email",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Tìm user theo email
2. Kiểm tra user không bị BAN
3. Kiểm tra user chưa ACTIVE
4. Kiểm tra rate limit (chỉ gửi 1 lần/phút)
5. Tạo OTP ngẫu nhiên 6 ký tự
6. Lưu OTP vào in-memory cache (thời hạn: 5 phút)
7. Gửi OTP qua email
8. Ghi nhận lần gửi cho rate limit

#### ❌ Errors

- `403`: Tài khoản đã bị khóa
- `400`: Tài khoản đã được kích hoạt hoặc vượt quá rate limit

---

### 6. Kích hoạt tài khoản (Xác thực OTP)

**POST** `/api/auth/activate-account`

#### 📥 Request

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### ✅ Validation

- `otp`: Bắt buộc, đúng 6 ký tự (chữ và số)

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "kích hoạt tài khoản thành công",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Tìm user theo email
2. Lấy OTP từ in-memory cache
3. Verify OTP (kiểm tra đúng và chưa hết hạn)
4. Xóa OTP khỏi cache
5. Cập nhật user status = `ACTIVE`

#### ❌ Errors

- `400`: OTP không hợp lệ hoặc hết hạn

---

### 7. Quên mật khẩu (Gửi OTP)

**POST** `/api/auth/forgot-password`

#### 📥 Request

```json
{
  "email": "user@example.com"
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "OTP Quên mật khẩu đã được gửi đến email",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Tìm user theo email
2. Kiểm tra user ACTIVE
3. Kiểm tra rate limit
4. Tạo OTP, lưu vào cache
5. Gửi OTP qua email

---

### 8. Xác thực OTP Quên mật khẩu

**POST** `/api/auth/verify-forgot-password`

#### 📥 Request

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "OTP quên mật khẩu hợp lệ",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Tìm user theo email
2. Verify OTP từ cache
3. Nếu hợp lệ → client có thể gọi reset-password

---

### 9. Đặt lại mật khẩu

**POST** `/api/auth/reset-password`

#### 📥 Request

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123!",
  "logoutAllDevices": true
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Đổi mật khẩu cho tài khoản thành công",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Tìm user theo email
2. Verify OTP
3. Xóa OTP khỏi cache
4. Hash password mới
5. Cập nhật password
6. Nếu `logoutAllDevices=true` → xóa tất cả refreshToken

---

### 10. Thu hồi Token (Admin)

**POST** `/api/auth/revoke-token`  
**🔐 Yêu cầu**: Login + Role = ADMIN

#### 📥 Request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Refresh token đã được thu hồi thành công",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Kiểm tra admin đã login
2. Tìm refreshToken trong DB
3. Xóa token khỏi DB → user sẽ bị logout

---

## Users - Quản lý người dùng

### 1. Lấy danh sách người dùng (Admin/Moderator)

**GET** `/api/users?page=1&size=20`  
**🔐 Yêu cầu**: Login + Role = ADMIN hoặc MODERATOR

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2026-05-06T10:30:00Z",
      "updatedAt": "2026-05-06T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### ⚙️ Luồng xử lý

1. Kiểm tra admin/moderator đã login
2. Truy vấn danh sách users từ DB
3. Tính pagination
4. Trả về danh sách + thông tin pagination

---

### 2. Khóa người dùng (Admin)

**PUT** `/api/users/:userId/ban`  
**🔐 Yêu cầu**: Login + Role = ADMIN

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Khóa người dùng thành công",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Kiểm tra admin đã login
2. Tìm user theo userId
3. Cập nhật user status = `BANNED`

---

### 3. Mở khóa người dùng (Admin)

**PUT** `/api/users/:userId/unban`  
**🔐 Yêu cầu**: Login + Role = ADMIN

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Mở khóa người dùng thành công",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Kiểm tra admin đã login
2. Tìm user theo userId
3. Cập nhật user status = `ACTIVE`

---

### 4. Cập nhật Role người dùng (Admin)

**PUT** `/api/users/:userId/roles`  
**🔐 Yêu cầu**: Login + Role = ADMIN

#### 📥 Request

```json
{
  "role": "MODERATOR"
}
```

#### ✅ Validation

- `role`: Bắt buộc, phải là USER, MODERATOR hoặc ADMIN

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Update roles người dùng thành công",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Kiểm tra admin đã login
2. Validate role hợp lệ
3. Tìm user theo userId
4. Cập nhật role

---

### 5. Xóa người dùng (Admin)

**DELETE** `/api/users/:userId`  
**🔐 Yêu cầu**: Login + Role = ADMIN

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Xóa người dùng thành công",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Kiểm tra admin đã login
2. Tìm user theo userId
3. Đánh dấu `isDeleted = true` (soft delete)
4. Xóa tất cả refreshTokens của user

---

## Profiles - Tài khoản con

### 1. Lấy danh sách tài khoản con

**GET** `/api/profiles`  
**🔐 Yêu cầu**: Login

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách tài khoản con thành công.",
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Người dùng mới",
      "avatar": "https://...",
      "hasPin": true,
      "createdAt": "2026-05-06T10:30:00Z"
    }
  ]
}
```

#### ⚙️ Luồng xử lý

1. Lấy userId từ JWT
2. Truy vấn tất cả profiles của user
3. Trả về danh sách (ẩn PIN field)

---

### 2. Tạo tài khoản con mới

**POST** `/api/profiles`  
**🔐 Yêu cầu**: Login  
**Content-Type**: `multipart/form-data` hoặc `application/json`

#### 📥 Request (form-data)

```
name: "Tài khoản con 1"
pin: "1234"  (optional)
avatar: "https://..."  (optional string URL)
avatarFile: <file>  (optional file upload)
```

#### ✅ Validation

- `name`: Bắt buộc, max 50 ký tự
- `pin`: Optional, đúng 4 chữ số

#### 📤 Response (201)

```json
{
  "success": true,
  "message": "Tạo tài khoản con thành công.",
  "data": {
    "id": "uuid",
    "name": "Tài khoản con 1",
    "avatar": "https://...",
    "hasPin": true
  }
}
```

#### ⚙️ Luồng xử lý

1. Lấy userId từ JWT
2. Validate input
3. Nếu có avatar file → upload lên Cloudinary
4. Lưu profile vào DB
5. Trả về profile (ẩn PIN field)

---

### 3. Cập nhật tài khoản con

**PUT** `/api/profiles/:profileId`  
**🔐 Yêu cầu**: Login  
**Content-Type**: `multipart/form-data` hoặc `application/json`

#### 📥 Request

```json
{
  "name": "Tên mới",
  "pin": "5678",
  "avatar": "https://..."
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Cập nhật tài khoản con thành công.",
  "data": {
    "id": "uuid",
    "name": "Tên mới",
    "avatar": "https://...",
    "hasPin": true
  }
}
```

#### ⚙️ Luồng xử lý

1. Kiểm tra profile thuộc user đang login
2. Validate input
3. Cập nhật các trường được cung cấp
4. Trả về profile cập nhật

---

### 4. Xóa tài khoản con

**DELETE** `/api/profiles/:profileId`  
**🔐 Yêu cầu**: Login

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Xóa tài khoản con thành công.",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Kiểm tra profile thuộc user đang login
2. Xóa tất cả histories và favorites của profile
3. Đánh dấu profile `isDeleted = true`

---

### 5. Chuyển đổi/Kích hoạt tài khoản con

**POST** `/api/profiles/:profileId/switch`  
**🔐 Yêu cầu**: Login

#### 📥 Request

```json
{
  "pin": "1234" // required nếu profile có PIN
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Chuyển tài khoản con thành công.",
  "data": {
    "id": "uuid",
    "name": "Tên tài khoản",
    "avatar": "https://...",
    "profileToken": "eyJhbGciOiJIUzI1NiIs...",
    "userId": "uuid"
  }
}
```

#### ⚙️ Luồng xử lý

1. Kiểm tra profile thuộc user đang login
2. Nếu profile có PIN → verify PIN
3. Tạo profileToken (JWT chứa profileId)
4. Trả về profile token (client lưu để gửi cùng requests)

---

## Movies - Phim

### Lưu ý quan trọng

- Endpoints phim cần **CheckLogin** + **CheckProfile** (phải switch profile trước)
- Profile được truyền qua middleware từ profileToken

---

### 1. Lấy danh sách phim yêu thích

**GET** `/api/movies/favorites?page=1&size=20`  
**🔐 Yêu cầu**: Login + Profile được kích hoạt

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách phim yêu thích thành công.",
  "data": [
    {
      "id": "uuid",
      "slug": "avatar-1",
      "name": "Avatar",
      "thumb_url": "https://...",
      "poster_url": "https://...",
      "type": "movie",
      "quality": "HD",
      "lang": "en",
      "year": 2009,
      "savedAt": "2026-05-06T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

#### ⚙️ Luồng xử lý

1. Lấy profileId từ middleware
2. Truy vấn danh sách favorites của profile từ DB
3. Tính pagination
4. Trả về danh sách phim

---

### 2. Lưu phim yêu thích

**POST** `/api/movies/favorites`  
**🔐 Yêu cầu**: Login + Profile được kích hoạt

#### 📥 Request

```json
{
  "slug": "avatar-1"
}
```

#### 📤 Response (201)

```json
{
  "success": true,
  "message": "Lưu phim yêu thích thành công.",
  "data": {
    "id": "uuid",
    "profileId": "uuid",
    "movieId": "uuid",
    "createdAt": "2026-05-06T10:30:00Z"
  }
}
```

#### ⚙️ Luồng xử lý

1. Tìm hoặc tạo movie theo slug
2. Kiểm tra phim chưa được lưu vào favorites
3. Tạo favorite record
4. Trả về favorite

#### ❌ Errors

- `400`: Phim đã có trong danh sách yêu thích

---

### 3. Kiểm tra phim có trong danh sách yêu thích

**GET** `/api/movies/favorites/check/:slug`  
**🔐 Yêu cầu**: Login + Profile được kích hoạt

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Kiểm tra phim yêu thích thành công.",
  "data": {
    "isFavorited": true
  }
}
```

#### ⚙️ Luồng xử lý

1. Lấy profileId từ middleware
2. Kiểm tra favorite record tồn tại
3. Trả về true/false

---

### 4. Xóa phim yêu thích

**DELETE** `/api/movies/favorites`  
**🔐 Yêu cầu**: Login + Profile được kích hoạt

#### 📥 Request (Xóa 1 phim)

```json
{
  "favoriteId": "uuid"
}
```

#### 📥 Request (Xóa nhiều phim)

```json
{
  "favoriteIds": ["uuid1", "uuid2", "uuid3"]
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Xóa phim yêu thích thành công.",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Lấy profileId từ middleware
2. Xóa favorite record(s)
3. Kiểm tra favorite thuộc profile hiện tại

---

### 5. Lấy lịch sử xem phim

**GET** `/api/movies/history?page=1&size=20`  
**🔐 Yêu cầu**: Login + Profile được kích hoạt

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Lấy lịch sử xem phim thành công.",
  "data": [
    {
      "id": "uuid",
      "movieId": "uuid",
      "profileId": "uuid",
      "slug": "avatar-1",
      "name": "Avatar",
      "thumb_url": "https://...",
      "episode": "1",
      "timePos": 3600,
      "watchedAt": "2026-05-06T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### ⚙️ Luồng xử lý

1. Lấy profileId từ middleware
2. Truy vấn danh sách histories của profile
3. Tính pagination
4. Trả về danh sách

---

### 6. Lưu/Cập nhật lịch sử xem phim

**POST** `/api/movies/history`  
**🔐 Yêu cầu**: Login + Profile được kích hoạt

#### 📥 Request

```json
{
  "slug": "avatar-1",
  "episode": "1",
  "timePos": 3600
}
```

#### ✅ Validation

- `slug`: Bắt buộc
- `episode`: Optional, phải là string
- `timePos`: Optional, phải là số

#### 📤 Response (201 hoặc 200)

```json
{
  "success": true,
  "message": "Lưu lịch sử xem phim thành công.",
  "data": {
    "id": "uuid",
    "profileId": "uuid",
    "movieId": "uuid",
    "slug": "avatar-1",
    "episode": "1",
    "timePos": 3600,
    "createdAt": "2026-05-06T10:30:00Z",
    "updatedAt": "2026-05-06T10:35:00Z"
  }
}
```

#### ⚙️ Luồng xử lý

1. Tìm hoặc tạo movie theo slug
2. Kiểm tra history tồn tại (unique: profileId + movieId)
3. Nếu tồn tại → cập nhật episode, timePos, updatedAt
4. Nếu không tồn tại → tạo mới
5. Trả về history record

---

### 7. Xóa lịch sử xem phim

**DELETE** `/api/movies/history`  
**🔐 Yêu cầu**: Login + Profile được kích hoạt

#### 📥 Request (Xóa 1 lịch sử)

```json
{
  "historyId": "uuid"
}
```

#### 📥 Request (Xóa nhiều lịch sử)

```json
{
  "historyIds": ["uuid1", "uuid2"]
}
```

#### 📥 Request (Xóa tất cả)

```json
{
  "deleteAll": true
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Xóa lịch sử xem phim thành công.",
  "data": null
}
```

#### ⚙️ Luồng xử lý

1. Lấy profileId từ middleware
2. Kiểm tra option xóa (1, nhiều, hoặc tất cả)
3. Xóa history records
4. Kiểm tra histories thuộc profile hiện tại

---

### 8. Lấy thông tin 1 bộ phim theo slug

**GET** `/api/movies/:slug`  
**🔐 Yêu cầu**: Không cần login

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Lấy thông tin phim thành công.",
  "data": {
    "id": "uuid",
    "slug": "avatar-1",
    "name": "Avatar",
    "thumb_url": "https://...",
    "poster_url": "https://...",
    "type": "movie",
    "quality": "HD",
    "lang": "en",
    "year": 2009,
    "view": 1000,
    "createdAt": "2026-05-06T10:30:00Z",
    "updatedAt": "2026-05-06T10:30:00Z"
  }
}
```

#### ⚙️ Luồng xử lý

1. Tìm movie theo slug trong DB
2. Nếu không tồn tại → tìm từ API ngoài (nếu có) → lưu vào DB
3. Tăng view count
4. Trả về thông tin phim

---

## Error Handling - Xử lý lỗi

### Cấu trúc Error Response

#### 1. Lỗi thông thường (API Error)

```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "data": null
}
```

#### 2. Lỗi Validation

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email không đúng định dạng",
    "password": "Mật khẩu phải có chữ hoa, chữ thường và số",
    "otp": "Mã OTP phải có đúng 6 ký tự"
  }
}
```

**Giải thích**:

- `errors` là object chứa danh sách field bị lỗi
- Key là tên field, value là lỗi của field đó
- Có thể có nhiều field bị lỗi cùng lúc

### HTTP Status Codes

| Code | Ý nghĩa                            | Ví dụ                         |
| ---- | ---------------------------------- | ----------------------------- |
| 200  | OK - Thành công                    | Lấy dữ liệu, cập nhật         |
| 201  | Created - Tạo mới thành công       | Register, tạo profile         |
| 400  | Bad Request - Request sai          | Validation error, thiếu field |
| 401  | Unauthorized - Chưa đăng nhập      | Token hết hạn, không có token |
| 403  | Forbidden - Không có quyền         | Khóa tài khoản, role không đủ |
| 404  | Not Found - Không tìm thấy         | User, profile không tồn tại   |
| 500  | Internal Server Error - Lỗi server | Database error                |

### Lỗi phổ biến

#### 1. Validation Error (400)

**Request:**

```json
{
  "email": "invalid-email",
  "password": "123"
}
```

**Response:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "email sai dinh dang",
    "password": "Mật khẩu phải có ít nhất 6 ký tự"
  }
}
```

**Giải pháp**: Kiểm tra lại các field theo validation rules

---

#### 2. Validation Error - OTP (400)

**Request:**

```json
{
  "email": "user@example.com",
  "otp": "12"
}
```

**Response:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "otp": "Mã OTP phải có đúng 6 ký tự"
  }
}
```

**Giải pháp**: OTP phải đúng 6 ký tự

---

#### 3. Token hết hạn (401)

```json
{
  "success": false,
  "message": "Unauthorized",
  "data": null
}
```

**Giải pháp**: Sử dụng refreshToken để lấy accessToken mới

---

#### 4. Chưa có quyền (403)

```json
{
  "success": false,
  "message": "You don't have permission to perform this action",
  "data": null
}
```

**Giải pháp**: Kiểm tra role, yêu cầu admin nếu cần

---

#### 5. Tài khoản bị khóa (403)

```json
{
  "success": false,
  "message": "Tài khoản đã bị khóa",
  "data": null
}
```

**Giải pháp**: Liên hệ admin để mở khóa

---

#### 6. Tài khoản chưa kích hoạt (403)

```json
{
  "success": false,
  "message": "Tài khoản chưa được kích hoạt",
  "data": null
}
```

**Giải pháp**:

1. Gọi `POST /api/auth/send-activate-otp`
2. Gọi `POST /api/auth/activate-account`

---

#### 7. Không tìm thấy tài nguyên (404)

```json
{
  "success": false,
  "message": "Refresh token không tồn tại",
  "data": null
}
```

**Giải pháp**: Kiểm tra ID hay token có đúng không

---

#### 8. Profile chưa được kích hoạt (400)

```json
{
  "success": false,
  "message": "Profile token is missing",
  "data": null
}
```

**Giải pháp**: Gọi endpoint switch profile trước: `POST /api/profiles/:profileId/switch`

---

#### 9. Lỗi server (500)

```json
{
  "success": false,
  "message": "Internal Server Error",
  "data": null
}
```

**Giải pháp**: Kiểm tra logs server, liên hệ admin

---

### Xử lý Validation Errors ở Client

**Client code example (JavaScript):**

```javascript
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const data = await response.json();

if (!data.success) {
  if (data.errors) {
    // Là validation error
    Object.keys(data.errors).forEach((field) => {
      console.error(`${field}: ${data.errors[field]}`);
      // Hiển thị lỗi trên form
    });
  } else {
    // Là API error thông thường
    console.error(data.message);
  }
}
```

---

## 🔄 Luồng sử dụng típ nhất

### 1. Đăng ký và kích hoạt tài khoản

```
POST /api/auth/register
  → Tài khoản được tạo (PENDING status)

POST /api/auth/send-activate-otp
  → OTP được gửi email

POST /api/auth/activate-account
  → Tài khoản chuyển ACTIVE

POST /api/auth/login
  → Nhận accessToken + refreshToken
```

### 2. Sử dụng tài khoản con

```
POST /api/auth/login
  → Nhận accessToken + refreshToken

GET /api/profiles
  → Lấy danh sách tài khoản con (dùng accessToken)

POST /api/profiles/:profileId/switch
  → Nhận profileToken

GET /api/movies/favorites
  → Sử dụng accessToken + profileToken
```

### 3. Quên mật khẩu

```
POST /api/auth/forgot-password
  → OTP được gửi

POST /api/auth/verify-forgot-password
  → Verify OTP (không bắt buộc)

POST /api/auth/reset-password
  → Đổi mật khẩu thành công
```

---

## 📝 Ghi chú quan trọng

1. **AccessToken**: Thời hạn ~15 phút, dùng cho mỗi request
2. **RefreshToken**: Thời hạn ~7 ngày, dùng để lấy accessToken mới
3. **ProfileToken**: Thời hạn ~24 giờ, cần để sử dụng movies, favorites, history
4. **Rate Limiting**: OTP gửi tối đa 1 lần/phút
5. **PIN**: 4 chữ số, tùy chọn khi tạo/cập nhật profile
6. **Email**: Phải được verify qua OTP trước khi login
7. **Password**: Min 8 ký tự, phải có chữ hoa, chữ thường, số, ký tự đặc biệt
8. **Roles**: USER (default), MODERATOR, ADMIN

---

**Last Updated**: 2026-05-06  
**Version**: 1.0.0
