# 📚 BookSwap Backend API

> OLX for books — buy, sell, rent, and swap books with fellow readers.

Built with **Node.js + Express**, **PostgreSQL**, and **Prisma ORM**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### 1. Install dependencies

```bash
cd bookswap-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your PostgreSQL connection string:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/bookswap_db"
JWT_SECRET="change-this-to-a-random-secret"
```

### 3. Set up the database

```bash
# Create DB and run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# (Optional) Seed with sample data
npm run db:seed
```

### 4. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

## 📡 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Create account |
| POST | `/login` | ❌ | Login, returns JWT |
| GET | `/me` | ✅ | Get own profile |
| PATCH | `/change-password` | ✅ | Change password |

**Register body:**
```json
{
  "name": "Alice Sharma",
  "email": "alice@example.com",
  "password": "securepassword",
  "phone": "9876543210",
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

**Auth header for protected routes:**
```
Authorization: Bearer <token>
```

---

### Listings — `/api/listings`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | Browse listings (with filters) |
| GET | `/:id` | ❌ | Get single listing |
| GET | `/my` | ✅ | My listings |
| POST | `/` | ✅ | Create listing (multipart/form-data) |
| PATCH | `/:id` | ✅ | Update listing |
| DELETE | `/:id` | ✅ | Delete listing |

**Query params for GET /:**
- `search` — text search across title, author, ISBN
- `genre` — FICTION, NON_FICTION, TEXTBOOK, etc.
- `condition` — NEW, LIKE_NEW, GOOD, ACCEPTABLE, POOR
- `listingType` — SELL, RENT, SWAP, SELL_OR_SWAP, RENT_OR_SELL
- `city`, `state`
- `minPrice`, `maxPrice`
- `sortBy` — createdAt, price, views (default: createdAt)
- `order` — asc, desc
- `page`, `limit`

**Create listing body (multipart/form-data):**
```
title, author, description, isbn, genre, condition, price,
listingType, rentPerDay, city, state, images (up to 5 files)
```

**Listing types:**
- `SELL` — selling only
- `RENT` — renting only
- `SWAP` — book swap only
- `SELL_OR_SWAP` — flexible
- `RENT_OR_SELL` — flexible

---

### Offers — `/api/offers`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Make an offer |
| GET | `/received` | ✅ | Offers on my listings |
| GET | `/sent` | ✅ | Offers I've made |
| PATCH | `/:id/respond` | ✅ | Accept or reject |
| PATCH | `/:id/withdraw` | ✅ | Withdraw offer |

**Make offer body:**
```json
{
  "listingId": "uuid",
  "type": "BUY",
  "message": "I'm interested!",
  "price": 120
}
```

For rent: include `"rentDays": 7`
For swap: include `"swapBookTitle": "Sapiens"`

**Respond body:**
```json
{ "status": "ACCEPTED" }
```

When a seller accepts an offer:
- Listing is marked unavailable
- All other pending offers are auto-rejected

---

### Messages — `/api/messages`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Send a message |
| GET | `/inbox` | ✅ | All conversations |
| GET | `/unread/count` | ✅ | Unread count badge |
| GET | `/:userId` | ✅ | Conversation with user |

**Send message body:**
```json
{
  "receiverId": "uuid",
  "content": "Is this still available?",
  "listingId": "uuid"
}
```

---

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:id` | ❌ | Public profile |
| PATCH | `/profile` | ✅ | Update own profile |
| GET | `/wishlist` | ✅ | My wishlist |
| POST | `/wishlist/:listingId` | ✅ | Toggle wishlist |
| POST | `/:id/review` | ✅ | Leave a review (1–5 stars) |

---

## 🗂️ Project Structure

```
bookswap-backend/
├── prisma/
│   ├── schema.prisma        # All DB models & enums
│   └── seed.js              # Sample data
├── src/
│   ├── index.js             # Express app entry point
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── listing.routes.js
│   │   ├── offer.routes.js
│   │   ├── message.routes.js
│   │   └── user.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── listing.controller.js
│   │   ├── offer.controller.js
│   │   ├── message.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verify
│   │   ├── error.middleware.js  # Global error handler
│   │   └── upload.middleware.js # Multer image uploads
│   └── utils/
│       └── jwt.utils.js
├── uploads/                 # Stored images (gitignored)
├── .env.example
└── package.json
```

---

## 📦 Key Design Decisions

- **Prisma** over raw SQL — type-safe queries, easy migrations, clean schema
- **UUID primary keys** — safe to expose in URLs, no sequential guessing
- **Soft listing closure** — accepting an offer auto-rejects other pending offers and marks the listing unavailable
- **Optional auth** on browse endpoints — logged-in users can see extra fields (wishlist status, etc.)
- **Rate limiting** — 200 req/15min globally, 20 req/15min on auth routes
- **Image uploads** — stored locally to `/uploads`, served as static files. Swap out multer storage for S3/Cloudinary in production

---

## 🔮 What's Next

- [ ] Frontend (React)
- [ ] Email notifications (Nodemailer)
- [ ] Real-time chat (Socket.io)
- [ ] Image hosting on Cloudinary
- [ ] Search with Elasticsearch or Postgres full-text
- [ ] Admin dashboard
