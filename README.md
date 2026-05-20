# 🎬 GienPhim Backend - Movie Streaming Platform API

**A professional Node.js/Express REST API for a Netflix-like movie streaming platform with user authentication, profiles, and content management.**

---

## 🎯 Overview

GienPhim Backend is a robust, scalable REST API built with **Express.js** and **Prisma ORM** that powers a full-featured movie streaming platform. It handles user authentication, profile management, watch history tracking, favorites lists, and contact support with admin controls.

**Key Features:**

- ✅ JWT-based authentication with refresh token rotation
- ✅ User roles (USER, MODERATOR, ADMIN) with permission control
- ✅ Sub-account profiles with PIN protection
- ✅ Watch history & favorites management
- ✅ OTP-based email verification
- ✅ Contact support ticket system
- ✅ Cloudinary image upload integration
- ✅ Rate limiting & validation
- ✅ Production-ready error handling

---

## 📋 Tech Stack

| Technology            | Version | Purpose                   |
| --------------------- | ------- | ------------------------- |
| **Node.js**           | 18.x+   | JavaScript runtime        |
| **Express.js**        | 5.x     | Web framework             |
| **Prisma**            | 5.22.0  | ORM & database management |
| **MySQL**             | 8.0+    | Primary database          |
| **JWT**               | 9.0.3   | Authentication tokens     |
| **Bcrypt**            | 6.0.0   | Password hashing          |
| **Nodemailer**        | 8.0.4   | Email sending             |
| **Cloudinary**        | 2.9.0   | Image upload & CDN        |
| **Express Validator** | 7.3.2   | Request validation        |
| **Multer**            | 2.1.1   | File upload handling      |
| **Socket.io**         | 4.8.3   | Real-time communication   |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- MySQL 8.0+
- npm or yarn
- Cloudinary account (for image uploads)
- SMTP service (for emails)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/GienPhim_Be_Netflix.git
cd GienPhim_Be_Netflix
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=8080

# Database
DATABASE_URL="mysql://user:password@localhost:3306/gienphim_db"

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_EXPIRE=1d
JWT_REFRESH_EXPIRE=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="noreply@gienphim.com"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Admin Configuration
ADMIN_EMAIL=admin@gienphim.com
ADMIN_PASSWORD=AdminPassword123!
```

### 4. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:8080`

---

## 📦 Project Structure

```
GienPhim_Be_Netflix/
├── bin/
│   └── www                          # Server entry point
├── config/
│   ├── cloudinary.js                # Cloudinary configuration
│   └── prisma.js                    # Prisma client config
├── controllers/                     # Business logic
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── profile.controller.js
│   ├── movie.controller.js
│   └── contact.controller.js
├── routes/                          # API endpoints
│   ├── index.js
│   ├── auth.route.js
│   ├── user.route.js
│   ├── profile.route.js
│   ├── movie.route.js
│   └── contact.route.js
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── migrations/                  # Database migrations
├── utils/
│   ├── validators/                  # Request validation
│   ├── jwt/                         # JWT utilities
│   ├── email.util.js                # Email sending
│   ├── media.util.js                # Media handling
│   ├── authHandler.js               # Authentication middleware
│   ├── errors/                      # Error classes
│   └── results/                     # Response formatting
├── templates/
│   └── email/                       # Email templates
├── app.js                           # Express app setup
├── package.json
├── .env                             # Environment variables
└── README.md
```

---

## 🔐 Authentication Flow

### User Registration & Activation

```
┌─────────────┐
│   Register  │ POST /api/auth/register
└──────┬──────┘
       │ (email, password)
       ▼
┌──────────────┐
│ User PENDING │ (email not verified)
└──────┬───────┘
       │
       │ POST /api/auth/send-activate-otp
       ▼
┌──────────────────┐
│ OTP sent to mail │
└──────┬───────────┘
       │
       │ POST /api/auth/activate-account (with OTP)
       ▼
┌────────────────┐
│  User ACTIVE   │ (ready to login)
└────────────────┘
```

### Login & Token Exchange

```
┌──────────┐
│  Login   │ POST /api/auth/login (email, password)
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Validate email & password           │
│ Check user is ACTIVE (not BANNED)   │
└────┬────────────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Generate JWT Tokens:         │
│ • accessToken (1 day)        │
│ • refreshToken (7 days)      │
└────┬─────────────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Save refreshToken in database  │
└────┬──────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Return both tokens to client│
└─────────────────────────────┘
```

### Token Refresh & API Access

```
Client stores tokens:
│
├─ accessToken (in memory or localStorage)
├─ refreshToken (secure localStorage)
└─ selectedProfile/profileToken

Make API Request:
├─ Include Authorization: Bearer <accessToken>
├─ Include x-profile-token: <profileToken>
└─ API validates token signature & expiration

If accessToken expired (401):
├─ Send refreshToken to /api/auth/refresh-token
├─ Get new accessToken
└─ Retry original request
```

---

## 🗄️ Database Schema

### Core Models

**User**

```prisma
model User {
  id              String @id @default(uuid())
  email           String @unique
  password        String (hashed with bcrypt)
  role            Role   @default(USER)
  status          UserStatus @default(PENDING)
  isDeleted       Boolean @default(false)
  profiles        Profile[] (one-to-many)
  refreshTokens   RefreshToken[] (one-to-many)
  contactTickets  ContactTicket[] (one-to-many)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum Role { USER, MODERATOR, ADMIN }
enum UserStatus { PENDING, ACTIVE, BANNED }
```

**Profile** (Sub-Account)

```prisma
model Profile {
  id          String @id @default(uuid())
  userId      String
  user        User @relation(fields: [userId])
  name        String
  avatar      String? (Cloudinary URL)
  pin         String? (4-digit code)
  isDeleted   Boolean @default(false)
  histories   History[] (one-to-many)
  favorites   Favorite[] (one-to-many)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Movie**

```prisma
model Movie {
  id          String @id @default(uuid())
  slug        String @unique
  histories   History[] (one-to-many)
  favorites   Favorite[] (one-to-many)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**History** (Watch Progress)

```prisma
model History {
  id          String @id @default(uuid())
  profileId   String
  profile     Profile @relation(fields: [profileId])
  movieId     String
  movie       Movie @relation(fields: [movieId])
  episode     String? (episode name)
  episodeSlug String? (episode slug)
  server      Int? (server index)
  timePos     Int? (seconds watched)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([profileId, movieId])
}
```

**Favorite** (Saved Movies)

```prisma
model Favorite {
  id          String @id @default(uuid())
  profileId   String
  profile     Profile @relation(fields: [profileId])
  movieId     String
  movie       Movie @relation(fields: [movieId])
  createdAt   DateTime @default(now())

  @@unique([profileId, movieId])
}
```

---

## 📡 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Get new access token
- `POST /api/auth/send-activate-otp` - Send activation OTP
- `POST /api/auth/activate-account` - Verify OTP & activate
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/verify-forgot-password` - Verify reset OTP
- `POST /api/auth/reset-password` - Set new password
- `POST /api/auth/revoke-token` - Admin revoke user token

### Users (Admin/Moderator)

- `GET /api/users` - List all users
- `PUT /api/users/{id}/ban` - Ban user account
- `PUT /api/users/{id}/unban` - Unban user
- `PUT /api/users/{id}/roles` - Change user role
- `DELETE /api/users/{id}` - Delete user

### Profiles

- `GET /api/profiles` - Get user's profiles
- `POST /api/profiles` - Create new profile
- `PUT /api/profiles/{id}` - Update profile
- `DELETE /api/profiles/{id}` - Delete profile
- `POST /api/profiles/{id}/switch` - Activate profile
- `POST /api/profiles/{id}/reset-pin` - Reset PIN

### Movies

- `GET /api/movies/favorites` - Get favorites list
- `POST /api/movies/favorites` - Add to favorites
- `GET /api/movies/favorites/check/{slug}` - Check if favorite
- `DELETE /api/movies/favorites` - Remove favorite(s)
- `GET /api/movies/history` - Get watch history
- `POST /api/movies/history` - Save watch progress
- `DELETE /api/movies/history` - Delete history
- `GET /api/movies/{slug}` - Get movie details

### Contact/Support

- `POST /api/contact` - Create support ticket
- `GET /api/contact/my` - Get user's tickets
- `GET /api/contact` - Get all tickets (admin)
- `GET /api/contact/{id}` - Get ticket details
- `PATCH /api/contact/{id}/status` - Update status
- `POST /api/contact/{id}/reply` - Reply to ticket

---

## 🔑 Request/Response Examples

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**

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

### Get Favorites

```bash
curl -X GET "http://localhost:8080/api/movies/favorites?page=1&size=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "x-profile-token: YOUR_PROFILE_TOKEN"
```

---

## 🧪 Testing

### Using Postman/Insomnia

1. Import API endpoints from `API_DOCUMENTATION.md`
2. Create environment variables:
   ```
   base_url: http://localhost:8080
   accessToken: <your-token>
   profileToken: <your-profile-token>
   ```
3. Use in requests: `{{base_url}}/api/endpoint`

### Using cURL

See examples in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#example-usage-with-curl)

### Manual Testing

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123456!"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123456!"}'

# Get profiles (use accessToken from login response)
curl -X GET http://localhost:8080/api/profiles \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**

```bash
# Change port in .env
PORT=8081

# Or kill process on port 8080
lsof -i :8080
kill -9 <PID>
```

**Database Connection Failed**

```bash
# Verify DATABASE_URL in .env
# Test connection:
npx prisma db push

# Or use MySQL CLI:
mysql -u user -p -h localhost -D gienphim_db
```

**OTP Not Received**

```bash
# Verify SMTP configuration
# Check email templates in templates/email/

# Test email sending:
npm run test:email
```

**Token Validation Errors**

```bash
# JWT secret mismatch - ensure same secret in:
# - .env file
# - All instances use same secret

# Token expired - call refresh-token endpoint
# Profile token missing - switch profile again
```

---

## 🚀 Deployment

### Build for Production

```bash
# Install dependencies
npm install --production

# Set NODE_ENV
export NODE_ENV=production

# Run migrations
npx prisma migrate deploy

# Start server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 8080

CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=mysql://prod_user:prod_password@prod_db_host:3306/gienphim
JWT_SECRET=<strong-secret-key-min-32-chars>
FRONTEND_URL=https://yourdomain.com
# ... other vars
```

---

## 📊 Performance Optimization

- ✅ **Pagination**: Limit results with `page` & `size` params
- ✅ **Caching**: OTP stored in memory (5 min expiry)
- ✅ **Rate Limiting**: Max 5 OTP requests per minute
- ✅ **Database Indexing**: userId, email, slug indexed
- ✅ **JWT Optimization**: Short-lived access tokens + refresh rotation

---

## 🔒 Security

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT with secure expiration
- ✅ OTP rate limiting (prevent brute force)
- ✅ Email verification required
- ✅ CORS enabled for frontend domain
- ✅ Request validation on all endpoints
- ✅ Role-based access control
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection via input validation

---

## 📝 API Documentation

Complete API documentation with all endpoints, request/response examples, and error codes:

👉 **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Submit Pull Request

---

## 📜 License

This project is licensed under the ISC License - see LICENSE file for details.

---

## 👨‍💻 Author

**Hoang Bmt**

- GitHub: [@hoangbmt023](https://github.com/hoangbmt023)
- Email: hoangbmt023@gmail.com

---

## 🆘 Support

For issues and feature requests: [GitHub Issues](https://github.com/yourusername/GienPhim_Be_Netflix/issues)

---

**Last Updated**: May 2026
