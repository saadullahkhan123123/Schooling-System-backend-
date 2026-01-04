# 🔧 MongoDB URI Configuration Fix

## Issue Found

Your MongoDB URI contains special characters in the password that need to be **URL-encoded**.

## Problem

If your password contains special characters like `!`, `@`, `#`, `%`, etc., they need to be URL-encoded in the connection string.

## Solution

### Step 1: URL-encode your password

Common special characters and their URL-encoded values:
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `*` → `%2A`
- `+` → `%2B`
- `/` → `%2F`
- `=` → `%3D`
- `?` → `%3F`

### Step 2: Update your .env file

**Current format (WRONG):**
```
MONGO_URI=mongodb+srv://wasi:saadullah123!@cluster0.60u4pme.mongodb.net/
```

**Correct format (with URL-encoded password):**
```
MONGO_URI=mongodb+srv://wasi:saadullah123%21@cluster0.60u4pme.mongodb.net/your_database_name
```

**Example with password `saadullah123!`:**
- Password: `saadullah123!`
- Encoded: `saadullah123%21`
- Full URI: `mongodb+srv://wasi:saadullah123%21@cluster0.60u4pme.mongodb.net/your_database_name`

### Step 3: Add Database Name

Make sure to include your database name at the end:
```
mongodb+srv://wasi:saadullah123%21@cluster0.60u4pme.mongodb.net/schooling_system
```

### Step 4: Verify Connection

Run the test script:
```bash
node test-connection.js
```

Or restart your server and check the `/health/db` endpoint.

## Quick URL-encoder

You can use online tools like:
- https://www.urlencoder.org/
- Just encode the password part, not the entire URI

## For Vercel (Production)

If deploying to Vercel, make sure to:
1. URL-encode the password in the MONGO_URI environment variable
2. Set it in: Vercel Dashboard → Your Project → Settings → Environment Variables

