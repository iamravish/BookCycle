# BookSwap Startup Guide

Use this whenever you close the project or switch off the PC and want to run the app again.

## 1. Start PostgreSQL

Make sure your PostgreSQL server is running before starting the backend.

You can check it using:
- `pgAdmin`
- `SQL Shell (psql)`
- Windows Services if needed

If PostgreSQL is not running, the backend will not connect to the database.

## 2. Open The Project Folder

Open PowerShell and go to:

```powershell
cd "D:\Project MCA\bookswap-backend"
```

## 3. Start The Backend

Open the first terminal and run:

```powershell
npm run dev
```

If it starts correctly, you should see:

```text
BookSwap API running on http://localhost:5000
```

## 4. Start The Frontend

Open a second terminal in the same folder and run:

```powershell
cd "D:\Project MCA\bookswap-backend"
npm run client:dev
```

This should start the React frontend.

## 5. Open The App

Open your browser and go to:

```text
http://localhost:5173
```

## 6. Optional Backend Check

If you want to confirm the backend is alive, open:

```text
http://localhost:5000/health
```

## Normal Startup Order

1. Start PostgreSQL
2. Start backend with `npm run dev`
3. Start frontend with `npm run client:dev`
4. Open `http://localhost:5173`

## Common Problems

### Port 5000 already in use

That means the backend is already running in another terminal.

Fix:
- use the already running backend, or
- stop the old one with `Ctrl + C` and restart once

### Port 5173 already in use

That means the frontend is already running in another terminal.

Fix:
- use the already running frontend, or
- stop the old one with `Ctrl + C` and restart once

### Database connection error

Check:
- PostgreSQL is running
- `.env` exists in the root project folder
- `DATABASE_URL` is correct

## Project URLs

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend health: [http://localhost:5000/health](http://localhost:5000/health)
