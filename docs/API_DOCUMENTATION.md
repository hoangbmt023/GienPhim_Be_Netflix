# 📺 GienPhim Backend - API Documentation

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Base URL**: `http://localhost:8080` (or your server URL)  
**Content-Type**: `application/json`

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Users Management](#users-management)
4. [Profiles (Sub-Accounts)](#profiles-sub-accounts)
5. [Movies](#movies)
6. [Contact Support](#contact-support)
7. [Error Handling](#error-handling)
8. [Response Format](#response-format)

---

## Getting Started

### Required Headers

All requests must include:

```json
{
  "Content-Type": "application/json"
}
```

For protected endpoints, add:

```json
{
  "Authorization": "Bearer <accessToken>",
  "x-profile-token": "<profileToken>"
}
```

### Token Flow

```
1. User login → receive accessToken + refreshToken
2. Use accessToken for subsequent requests
3. When accessToken expires → use refreshToken to get new accessToken
4. Logout → delete refreshToken from DB
```

---

## Authentication

### 1. Register Account

**POST** `/api/users/register`

#### 📥 Request

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

#### ✅ Validation

- `email`: Required, valid email format
- `password`: Required, min 6 characters

#### 📤 Response (201)

```json
{
  "success": true,
  "message": "Tài khoản đã được đăng ký thành công.",
  "data": null
}
```

#### ⚙️ Processing

1. Check email doesn't exist
2. Hash password with bcrypt
3. Save user to DB with status = `PENDING`
4. Auto-create default profile for user

---

### 2. Login

**POST** `/api/auth/login`

#### 📥 Request

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

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

#### ⚙️ Processing

1. Find user by email
2. Verify password (bcrypt compare)
3. Check user not BANNED
4. Check user is ACTIVE
5. Create JWT accessToken (~15 min)
6. Create JWT refreshToken and save to DB (~7 days)
7. Return both tokens

#### ❌ Errors

- `401`: Email or password incorrect
- `403`: Account banned or not activated

---

### 3. Refresh Token

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

---

### 4. Logout

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

---

### 5. Send Activation OTP

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

---

### 6. Activate Account

**POST** `/api/auth/activate-account`

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
  "message": "kích hoạt tài khoản thành công",
  "data": null
}
```

---

### 7. Forgot Password

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

---

### 8. Verify Forgot Password OTP

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

---

### 9. Reset Password

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

---

### 10. Revoke Token (Admin)

**POST** `/api/auth/revoke-token`  
**🔐 Requires**: Login + Role = ADMIN

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

---

## Users Management

### 1. Get All Users (Admin/Moderator)

**GET** `/api/users?page=1&size=20`  
**🔐 Requires**: Login + Role = ADMIN or MODERATOR

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

---

### 2. Ban User (Admin)

**PUT** `/api/users/:userId/ban`  
**🔐 Requires**: Login + Role = ADMIN

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Khóa người dùng thành công",
  "data": null
}
```

---

### 3. Unban User (Admin)

**PUT** `/api/users/:userId/unban`  
**🔐 Requires**: Login + Role = ADMIN

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Mở khóa người dùng thành công",
  "data": null
}
```

---

### 4. Update User Role (Admin)

**PUT** `/api/users/:userId/roles`  
**🔐 Requires**: Login + Role = ADMIN

#### 📥 Request

```json
{
  "role": "MODERATOR"
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Update roles người dùng thành công",
  "data": null
}
```

---

### 5. Delete User (Admin)

**DELETE** `/api/users/:userId`  
**🔐 Requires**: Login + Role = ADMIN

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Xóa người dùng thành công",
  "data": null
}
```

---

## Profiles (Sub-Accounts)

### 1. Get All Profiles

**GET** `/api/profiles`  
**🔐 Requires**: Login

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

---

### 2. Create Profile

**POST** `/api/profiles`  
**🔐 Requires**: Login  
**Content-Type**: `multipart/form-data`

#### 📥 Request

```
name: "Profile Name"
pin: "1234" (optional)
avatar: "https://..." (optional)
avatarFile: <file> (optional)
```

#### 📤 Response (201)

```json
{
  "success": true,
  "message": "Tạo tài khoản con thành công.",
  "data": {
    "id": "uuid",
    "name": "Profile Name",
    "avatar": "https://...",
    "hasPin": true
  }
}
```

---

### 3. Update Profile

**PUT** `/api/profiles/:profileId`  
**🔐 Requires**: Login

#### 📥 Request

```json
{
  "name": "New Name",
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
    "name": "New Name",
    "avatar": "https://...",
    "hasPin": true
  }
}
```

---

### 4. Delete Profile

**DELETE** `/api/profiles/:profileId`  
**🔐 Requires**: Login

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Xóa tài khoản con thành công.",
  "data": null
}
```

---

### 5. Switch Profile

**POST** `/api/profiles/:profileId/switch`  
**🔐 Requires**: Login

#### 📥 Request

```json
{
  "pin": "1234"
}
```

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Chuyển tài khoản con thành công.",
  "data": {
    "id": "uuid",
    "name": "Profile Name",
    "avatar": "https://...",
    "profileToken": "eyJhbGciOiJIUzI1NiIs...",
    "userId": "uuid"
  }
}
```

---

## Movies

### 1. Get Favorites

**GET** `/api/movies/favorites?page=1&size=20`  
**🔐 Requires**: Login + Profile activated

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

---

### 2. Add to Favorites

**POST** `/api/movies/favorites`  
**🔐 Requires**: Login + Profile activated

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

---

### 3. Check Favorite

**GET** `/api/movies/favorites/check/:slug`  
**🔐 Requires**: Login + Profile activated

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

---

### 4. Remove Favorite(s)

**DELETE** `/api/movies/favorites`  
**🔐 Requires**: Login + Profile activated

#### 📥 Request (Single)

```json
{
  "favoriteId": "uuid"
}
```

#### 📥 Request (Multiple)

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

---

### 5. Get Watch History

**GET** `/api/movies/history?page=1&size=20`  
**🔐 Requires**: Login + Profile activated

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Lấy lịch sử xem phim thành công.",
  "data": [
    {
      "id": "uuid",
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

---

### 6. Save Watch Progress

**POST** `/api/movies/history`  
**🔐 Requires**: Login + Profile activated

#### 📥 Request

```json
{
  "slug": "avatar-1",
  "episode": "1",
  "timePos": 3600
}
```

#### 📤 Response (201 or 200)

```json
{
  "success": true,
  "message": "Lưu lịch sử xem phim thành công.",
  "data": {
    "id": "uuid",
    "profileId": "uuid",
    "slug": "avatar-1",
    "episode": "1",
    "timePos": 3600,
    "createdAt": "2026-05-06T10:30:00Z"
  }
}
```

---

### 7. Delete History

**DELETE** `/api/movies/history`  
**🔐 Requires**: Login + Profile activated

#### 📥 Request (Single)

```json
{
  "historyId": "uuid"
}
```

#### 📥 Request (Multiple)

```json
{
  "historyIds": ["uuid1", "uuid2"]
}
```

#### 📥 Request (Clear All)

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

---

### 8. Get Movie Details

**GET** `/api/movies/:slug`  
**🔐 Requires**: No login needed

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
    "createdAt": "2026-05-06T10:30:00Z"
  }
}
```

---

## Contact Support

### 1. Create Ticket

**POST** `/api/contact`  
**🔐 Requires**: Login

#### 📥 Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Cannot watch movies",
  "message": "I'm unable to play videos"
}
```

#### 📤 Response (201)

```json
{
  "success": true,
  "message": "Gửi liên hệ thành công",
  "data": {
    "id": "ticket-uuid-1",
    "status": "PENDING"
  }
}
```

---

### 2. Get My Tickets

**GET** `/api/contact/my`  
**🔐 Requires**: Login

#### 📤 Response (200)

```json
{
  "success": true,
  "message": "Lấy danh sách ticket thành công",
  "data": [
    {
      "id": "ticket-uuid-1",
      "subject": "Cannot watch movies",
      "status": "PENDING",
      "createdAt": "2026-05-06T10:30:00Z"
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

---

### 3. Get All Tickets (Admin)

**GET** `/api/contact`  
**🔐 Requires**: Login + Role = ADMIN

---

### 4. Get Ticket Details (Admin)

**GET** `/api/contact/{ticketId}`  
**🔐 Requires**: Login + Role = ADMIN

---

### 5. Update Ticket Status (Admin)

**PATCH** `/api/contact/{ticketId}/status`  
**🔐 Requires**: Login + Role = ADMIN

#### 📥 Request

```json
{
  "status": "REPLIED"
}
```

---

### 6. Reply to Ticket (Admin)

**POST** `/api/contact/{ticketId}/reply`  
**🔐 Requires**: Login + Role = ADMIN

#### 📥 Request

```json
{
  "message": "Thank you for contacting us"
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "fieldName": "Validation error"
  }
}
```

### HTTP Status Codes

| Code | Meaning      | Example              |
| ---- | ------------ | -------------------- |
| 200  | OK           | Success              |
| 201  | Created      | New resource created |
| 400  | Bad Request  | Validation error     |
| 401  | Unauthorized | Token expired        |
| 403  | Forbidden    | Access denied        |
| 404  | Not Found    | Resource not found   |
| 500  | Server Error | Database error       |

---

**Last Updated**: May 2026  
**Version**: 1.0.0
