# BookSwap Frontend

This React app is the frontend for the BookSwap backend in the parent folder.

## What Is Integrated

- Register with `POST /api/auth/register`
- Login with `POST /api/auth/login`
- Load current user with `GET /api/auth/me`
- Browse listings with `GET /api/listings`
- Create listings with `POST /api/listings`

## Environment

Create a local `.env` in this `frontend` folder if you want to override the backend URL:

```env
VITE_API_URL=http://localhost:5000
```

If you do nothing, the app already defaults to `http://localhost:5000`.

## Run

From the project root:

```powershell
npm run dev
```

In a second terminal:

```powershell
npm run client:dev
```

Then open:

```text
http://localhost:5173
```

## Build Check

```powershell
npm run client:build
```
