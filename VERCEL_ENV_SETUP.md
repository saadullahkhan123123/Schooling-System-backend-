# 🚀 Vercel Environment Variables Setup Guide

## For Production Deployment

Your backend is deployed at: `https://schooling-system-backend.vercel.app/`

## ⚠️ Current Issue

You're seeing: **"Database connection not available"** because the `MONGO_URI` environment variable is not set correctly in Vercel.

## ✅ Solution: Set Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Find your backend project: **schooling-system-backend**
3. Click on the project

### Step 2: Navigate to Environment Variables

1. Click on **"Settings"** tab (top menu)
2. Click on **"Environment Variables"** (left sidebar)

### Step 3: Add/Update MONGO_URI

**Your MongoDB Connection String:**

With password: `saadullah123!@21`

**URL-Encoded Password:** `saadullah123%21%4021`
- `!` → `%21`
- `@` → `%40`

**Complete MONGO_URI:**
```
mongodb+srv://wasi:saadullah123%21%4021@cluster0.60u4pme.mongodb.net/schooling_system
```

**Steps:**
1. Click **"Add New"** or find existing `MONGO_URI` and click **"Edit"**
2. **Key:** `MONGO_URI`
3. **Value:** `mongodb+srv://wasi:saadullah123%21%4021@cluster0.60u4pme.mongodb.net/schooling_system`
4. **Environment:** Select all (Production, Preview, Development)
5. Click **"Save"**

### Step 4: Add Other Required Environment Variables

Also make sure you have these set:

1. **JWT_SECRET**
   - Key: `JWT_SECRET`
   - Value: Your secret key (e.g., `your_super_secret_jwt_key_change_this`)
   - Environment: All

2. **EMAIL_USER** (Optional - for email features)
   - Key: `EMAIL_USER`
   - Value: Your email address

3. **EMAIL_PASS** (Optional - for email features)
   - Key: `EMAIL_PASS`
   - Value: Your email app password

### Step 5: Redeploy

**IMPORTANT:** After adding/updating environment variables:

1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click the **"⋯"** (three dots) menu
4. Click **"Redeploy"**
5. Confirm redeployment

**OR** push a new commit to trigger automatic redeployment

### Step 6: Verify Connection

After redeployment, check:

1. Go to: `https://schooling-system-backend.vercel.app/health/db`
2. You should see:
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

## 🔍 Troubleshooting

### If connection still fails:

1. **Check MongoDB Atlas Network Access:**
   - Go to MongoDB Atlas → Network Access
   - Make sure `0.0.0.0/0` is allowed (for Vercel servers)

2. **Verify Password Encoding:**
   - Password: `saadullah123!@21`
   - Must be encoded as: `saadullah123%21%4021`
   - No spaces in the URI

3. **Check Database Name:**
   - Make sure `schooling_system` matches your actual database name in MongoDB Atlas
   - Or replace it with your actual database name

4. **Verify MongoDB Atlas Cluster:**
   - Make sure your cluster is running
   - Check MongoDB Atlas dashboard

5. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → "Deployments"
   - Click on latest deployment → "Functions" tab
   - Check for error messages

## 📝 Quick Reference

**Environment Variable Format:**
```
MONGO_URI=mongodb+srv://wasi:saadullah123%21%4021@cluster0.60u4pme.mongodb.net/schooling_system
```

**Password Encoding:**
- Original: `saadullah123!@21`
- Encoded: `saadullah123%21%4021`

**Vercel Settings Path:**
- Project → Settings → Environment Variables

**Health Check URL:**
- `https://schooling-system-backend.vercel.app/health/db`

