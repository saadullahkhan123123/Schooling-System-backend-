# 👤 Admin Setup Guide

## Initial Admin User

The system allows **only ONE admin** to be created. After the first admin is created, admin registration is disabled.

## Pre-configured Admin Credentials

**Username:** `wasiahmed`  
**Email:** `muhammadsaadullah093@gmail.com`  
**Password:** `wasi.123.saad`  
**Role:** `admin`

## How to Initialize Admin

### Option 1: Using npm script (Recommended)

```bash
cd "wasi schooling backend/Schooling-System-back-end"
npm run init-admin
```

This will:
- Connect to your MongoDB database
- Check if an admin already exists
- Create the admin user if it doesn't exist
- Show success/error messages

### Option 2: Manual Creation

If the admin doesn't exist, you can register via the API:

```bash
POST /auth/register
{
  "username": "wasiahmed",
  "email": "muhammadsaadullah093@gmail.com",
  "password": "wasi.123.saad",
  "role": "admin"
}
```

**Note:** This will only work if NO admin exists in the database.

## Important Notes

1. **Only ONE admin allowed:** After the first admin is created, all subsequent admin registration attempts will be rejected.

2. **Admin cannot be deleted via API:** To reset/change admin, you need to manually delete from MongoDB or use MongoDB Compass/Atlas.

3. **Security:** Change the default password after first login for security.

4. **Database Required:** Make sure your MongoDB connection is configured before running the initialization script.

## Troubleshooting

### "Admin already exists"
- An admin user already exists in the database
- You can login with the existing admin credentials
- To create a new admin, delete the existing one first from MongoDB

### "Database connection failed"
- Check your `.env` file has `MONGO_URI` set
- Make sure MongoDB is running (or MongoDB Atlas is accessible)
- Verify the connection string is correct

### "Username or email already exists"
- The username or email is already taken
- Use a different username/email or delete the existing user

