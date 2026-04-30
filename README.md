# ?? BookSwap Backend

BookSwap is the marketplace API for buying, selling, renting, and swapping books locally.

Built with **Node.js + Express**, **PostgreSQL**, and **Prisma ORM**.

## ?? Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### Install dependencies

```bash
npm install
npm --prefix frontend install
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL URL and JWT secret:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/bookswap_db"
JWT_SECRET="change-this-to-a-random-secret"
```

### Database setup

```bash
npm run db:migrate
npm run db:generate
npm run db:seed
```

Use Prisma Studio for inspection:

```bash
npm run db:studio
```

### Run the app

```bash
npm run dev
npm run client:dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

## ??? Project Structure

```
bookswap-backend/
+-- frontend/                # React app
+-- prisma/
¦   +-- migrations/         # Prisma migration files
¦   +-- schema.prisma        # DB schema and enums
¦   +-- seed.js              # sample data seeding
+-- src/
¦   +-- controllers/         # request handlers
¦   +-- middleware/          # auth, uploads, error handling
¦   +-- routes/              # Express routers
¦   +-- utils/               # shared helpers
¦   +-- index.js             # app entrypoint
+-- uploads/                 # image storage
+-- .env.example
+-- package.json
```

## ?? API Overview

### Auth

- `POST /api/auth/register` — create account
- `POST /api/auth/login` — login and receive JWT
- `GET /api/auth/me` — current user profile
- `PATCH /api/auth/change-password` — update password

### Listings

- `GET /api/listings` — browse listings
- `GET /api/listings/:id` — listing detail
- `GET /api/listings/my` — current user listings
- `POST /api/listings` — create listing
- `PATCH /api/listings/:id` — update listing
- `DELETE /api/listings/:id` — delete listing
- `POST /api/listings/:id/report` — report a listing
- `GET /api/listings/reports` — admin only list of reported listings

### Offers

- `POST /api/offers` — create an offer
- `GET /api/offers/sent` — sent offers
- `GET /api/offers/received` — received offers
- `PATCH /api/offers/:id/respond` — accept or reject

### Messages

- `POST /api/messages` — send a message
- `GET /api/messages/inbox` — fetch conversations
- `GET /api/messages/unread/count` — unread badge
- `GET /api/messages/:userId` — fetch conversation with a user

### Users

- `GET /api/users/:id` — public profile
- `PATCH /api/users/profile` — update own profile
- `GET /api/users/wishlist` — get wishlist
- `POST /api/users/wishlist/:listingId` — toggle wishlist
- `POST /api/users/:id/review` — leave a review

## ?? Admin / Moderation

- Admins are identified by `User.isAdmin`
- The frontend exposes `/admin` for admin users
- Reports are stored in `ListingReport`
- Admin routes are protected by `authorizeAdmin`

To make a user an admin, set `isAdmin = true` for that user in the database, for example via Prisma Studio or SQL.

## ? Seeded Accounts

After `npm run db:seed`, two sample users are available:

- `alice@bookswap.com` / `password123`
- `bob@bookswap.com` / `password123`

## ??? Commands

```bash
npm run dev
npm run client:dev
npm run client:build
npm run db:migrate
npm run db:generate
npm run db:studio
npm run db:seed
```

## Notes

- Images are stored locally in `/uploads`
- Auth uses `Authorization: Bearer <token>`
- Frontend and backend run separately for development
