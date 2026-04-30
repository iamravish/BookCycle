# BookSwap Backend Testing Guide

This file gives you a quick way to test the backend manually in PowerShell.

## Before You Start

1. Open one PowerShell terminal in this project folder:

```powershell
cd "D:\Project MCA\bookswap-backend"
npm run dev
```

2. Open a second PowerShell terminal in the same folder for API requests.

## 1. Health Check

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/health"
```

## 2. Register User

```powershell
$register = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:5000/api/auth/register" `
  -ContentType "application/json" `
  -Body '{"name":"Test User","email":"test@example.com","password":"123456","city":"Kolkata","state":"WB"}'

$register
```

If the email is already used, use login below instead.

## 3. Login User

```powershell
$login = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:5000/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"123456"}'

$token = $login.token
$token
```

## 4. Get Current User

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/auth/me" `
  -Headers @{ Authorization = "Bearer $token" }
```

## 5. Create Listing

```powershell
$listingResponse = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:5000/api/listings" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{
    "title":"Atomic Habits",
    "author":"James Clear",
    "condition":"GOOD",
    "listingType":"SELL",
    "price":200,
    "city":"Kolkata",
    "state":"WB"
  }'

$listingResponse
$listingId = $listingResponse.listing.id
$listingId
```

## 6. View All Listings

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/listings"
```

## 7. View Single Listing

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/listings/$listingId"
```

## 8. View My Listings

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/listings/my" `
  -Headers @{ Authorization = "Bearer $token" }
```

## 9. Update Listing

```powershell
Invoke-RestMethod -Method PATCH `
  -Uri "http://localhost:5000/api/listings/$listingId" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{
    "price":180,
    "description":"Updated test description",
    "isAvailable":true
  }'
```

## 10. Create Second User

Use another email so you can test offers, messages, wishlist, and reviews.

```powershell
$secondRegister = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:5000/api/auth/register" `
  -ContentType "application/json" `
  -Body '{"name":"Second User","email":"test2@example.com","password":"123456","city":"Delhi","state":"DL"}'

$secondLogin = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:5000/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"test2@example.com","password":"123456"}'

$token2 = $secondLogin.token
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/auth/me" `
  -Headers @{ Authorization = "Bearer $token2" }
```

## 11. Create Offer from Second User

```powershell
$offerResponse = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:5000/api/offers" `
  -Headers @{ Authorization = "Bearer $token2" } `
  -ContentType "application/json" `
  -Body "{
    `"listingId`": `"$listingId`",
    `"type`": `"BUY`",
    `"price`": 170,
    `"message`": `"Interested in buying this book.`"
  }"

$offerResponse
$offerId = $offerResponse.offer.id
$offerId
```

## 12. View Offers Received

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/offers/received" `
  -Headers @{ Authorization = "Bearer $token" }
```

## 13. View Offers Sent

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/offers/sent" `
  -Headers @{ Authorization = "Bearer $token2" }
```

## 14. Respond to Offer

Run this as the listing owner:

```powershell
Invoke-RestMethod -Method PATCH `
  -Uri "http://localhost:5000/api/offers/$offerId/respond" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"status":"ACCEPTED"}'
```

If you want to reject instead:

```powershell
Invoke-RestMethod -Method PATCH `
  -Uri "http://localhost:5000/api/offers/$offerId/respond" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"status":"REJECTED"}'
```

## 15. Send Message

First get the second user id:

```powershell
$user2 = Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/auth/me" `
  -Headers @{ Authorization = "Bearer $token2" }

$user2Id = $user2.user.id
$user2Id
```

Now send a message:

```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:5000/api/messages" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body "{
    `"receiverId`": `"$user2Id`",
    `"content`": `"Hello, is the trade still on?`",
    `"listingId`": `"$listingId`"
  }"
```

## 16. View Inbox

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/messages/inbox" `
  -Headers @{ Authorization = "Bearer $token2" }
```

## 17. View Conversation

Get the first user id:

```powershell
$user1 = Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/auth/me" `
  -Headers @{ Authorization = "Bearer $token" }

$user1Id = $user1.user.id
$user1Id
```

Read messages:

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/messages/$user1Id" `
  -Headers @{ Authorization = "Bearer $token2" }
```

## 18. Wishlist a Listing

Create one more listing with the first user if needed, because users cannot wishlist their own listings.

```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:5000/api/users/wishlist/$listingId" `
  -Headers @{ Authorization = "Bearer $token2" }
```

View wishlist:

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:5000/api/users/wishlist" `
  -Headers @{ Authorization = "Bearer $token2" }
```

## 19. Leave Review

```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:5000/api/users/$user1Id/review" `
  -Headers @{ Authorization = "Bearer $token2" } `
  -ContentType "application/json" `
  -Body '{
    "rating":5,
    "comment":"Smooth communication and quick response."
  }'
```

## 20. Delete Listing

```powershell
Invoke-RestMethod -Method DELETE `
  -Uri "http://localhost:5000/api/listings/$listingId" `
  -Headers @{ Authorization = "Bearer $token" }
```

## Common Problems

### Invalid token

- Login again and set `$token = $login.token`
- Do not paste a shortened token with `...`

### Email already in use

- Change the email in the register request
- Or use the login request instead

### Database connection error

- Make sure PostgreSQL is running
- Check `DATABASE_URL` in `.env`

### Server not reachable

- Make sure `npm run dev` is still running
- Check `http://localhost:5000/health`
