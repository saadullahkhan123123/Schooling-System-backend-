# 🔧 Database Connection Troubleshooting Guide

## Current Error

```
Database connection not available. Please check your MongoDB connection string and ensure MongoDB is accessible. For production, use MongoDB Atlas (cloud).
```

## Step-by-Step Troubleshooting

### 1. Verify Environment Variable in Vercel

**Check if MONGO_URI is set:**

1. Go to: https://vercel.com/dashboard
2. Select your project: **schooling-system-backend**
3. Go to: **Settings** → **Environment Variables**
4. Verify `MONGO_URI` exists and is set correctly

**Correct Format:**
```
mongodb+srv://wasi:saadullah123%21%4021@cluster0.60u4pme.mongodb.net/schooling_system
```

**Common Mistakes:**
- ❌ Wrong: `mongodb+srv://wasi:saadullah123!@21@cluster0...` (not URL-encoded)
- ✅ Correct: `mongodb+srv://wasi:saadullah123%21%4021@cluster0...` (URL-encoded)

### 2. Check MongoDB Atlas Network Access

**Critical Step - This is often the issue!**

1. Go to: https://cloud.mongodb.com/
2. Log in to your account
3. Select your cluster
4. Click **"Network Access"** (left sidebar)
5. Click **"Add IP Address"**
6. Click **"ALLOW ACCESS FROM ANYWHERE"** (or enter `0.0.0.0/0`)
7. Click **"Confirm"**

**Important:** Vercel uses dynamic IP addresses, so you MUST allow `0.0.0.0/0` for it to work.

### 3. Verify Database User Credentials

1. Go to MongoDB Atlas → **Database Access**
2. Verify user: `wasi`
3. Make sure password is: `saadullah123!@21`
4. If password is different, update the MONGO_URI in Vercel

### 4. Check Database Name

1. Go to MongoDB Atlas → **Database** → **Browse Collections**
2. Verify your database name (might be `schooling_system` or something else)
3. Update MONGO_URI in Vercel if database name is different

### 5. Test Connection String Format

**Password Encoding:**
- Original: `saadullah123!@21`
- Encoded: `saadullah123%21%4021`
- `!` → `%21`
- `@` → `%40`

**Complete URI Format:**
```
mongodb+srv://[username]:[encoded_password]@[cluster]/[database]
```

### 6. Redeploy After Changes

**After updating environment variables:**
1. Go to Vercel → **Deployments**
2. Click **"⋯"** on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### 7. Check Vercel Logs

**View deployment logs:**
1. Go to Vercel → **Deployments**
2. Click on latest deployment
3. Click **"Functions"** tab
4. Look for error messages related to MongoDB

**View runtime logs:**
1. Go to Vercel → Your Project
2. Click **"Logs"** tab
3. Look for MongoDB connection errors

### 8. Test Health Endpoint

Visit this URL after redeployment:
```
https://schooling-system-backend.vercel.app/health/db
```

**Expected Response (Success):**
```json
{
  "status": "OK",
  "database": {
    "connected": true,
    "status": "connected",
    "uriConfigured": true,
    "uriType": "Atlas"
  }
}
```

**If Still Failing:**
```json
{
  "status": "ERROR",
  "database": {
    "connected": false,
    "uriConfigured": true/false,
    "uriType": "Atlas"
  },
  "recommendations": [...]
}
```

### 9. Common Issues & Solutions

#### Issue: "ENOTFOUND" or "getaddrinfo"
**Solution:** Check cluster hostname is correct: `cluster0.60u4pme.mongodb.net`

#### Issue: "Authentication failed"
**Solution:** 
- Verify username and password
- Make sure password is URL-encoded
- Check Database Access settings in MongoDB Atlas

#### Issue: "Connection timeout"
**Solution:**
- Check Network Access (allow `0.0.0.0/0`)
- Verify cluster is running in MongoDB Atlas
- Check if cluster is paused (free tier can pause after inactivity)

#### Issue: "Database not found"
**Solution:**
- Database name in URI must match database in MongoDB Atlas
- MongoDB Atlas creates database automatically on first write
- Try without database name: `mongodb+srv://...@cluster0.../`

### 10. Quick Test Script

You can test your connection string locally first:

1. Create a test file `test-vercel-connection.js`:
```javascript
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://wasi:saadullah123%21%4021@cluster0.60u4pme.mongodb.net/schooling_system';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ Connection successful!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
```

2. Run: `node test-vercel-connection.js`

## ✅ Checklist

Before asking for help, verify:

- [ ] MONGO_URI is set in Vercel Environment Variables
- [ ] Password is URL-encoded (`!` → `%21`, `@` → `%40`)
- [ ] Network Access allows `0.0.0.0/0` in MongoDB Atlas
- [ ] Database user credentials are correct
- [ ] Cluster is running (not paused)
- [ ] Redeployed after setting environment variables
- [ ] Checked Vercel logs for specific error messages
- [ ] Tested `/health/db` endpoint

## 🆘 Still Not Working?

If all above steps are correct and it still doesn't work:

1. **Double-check the exact error** in Vercel logs
2. **Try creating a new database user** in MongoDB Atlas with a simpler password (no special characters)
3. **Try connecting without database name** (MongoDB creates it automatically)
4. **Check MongoDB Atlas status page** for outages

