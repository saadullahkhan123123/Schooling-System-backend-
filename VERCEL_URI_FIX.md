# 🔧 Fix MongoDB URI in Vercel

## ⚠️ Issue Detected

Your `/health/db` endpoint shows:
```json
{
  "uriType": "Custom"
}
```

This means your MONGO_URI doesn't start with `mongodb+srv://`, which is required for MongoDB Atlas.

## ✅ Correct Format

Your MONGO_URI in Vercel **MUST** start with `mongodb+srv://`

**Correct Format:**
```
mongodb+srv://wasi:saadullah123%21%4021@cluster0.60u4pme.mongodb.net/schooling_system
```

## 🔍 How to Fix

### Step 1: Check Current Value in Vercel

1. Go to: https://vercel.com/dashboard
2. Select project: **schooling-system-backend**
3. Go to: **Settings** → **Environment Variables**
4. Find `MONGO_URI`
5. Check what value is currently set

### Step 2: Common Mistakes

❌ **WRONG** (missing `+srv`):
```
mongodb://wasi:saadullah123%21%4021@cluster0.60u4pme.mongodb.net/schooling_system
```

❌ **WRONG** (not URL-encoded):
```
mongodb+srv://wasi:saadullah123!@21@cluster0.60u4pme.mongodb.net/schooling_system
```

✅ **CORRECT**:
```
mongodb+srv://wasi:saadullah123%21%4021@cluster0.60u4pme.mongodb.net/schooling_system
```

### Step 3: Update in Vercel

1. Click **"Edit"** on `MONGO_URI`
2. **Delete** the current value
3. **Paste** this exact value:
   ```
   mongodb+srv://wasi:saadullah123%21%4021@cluster0.60u4pme.mongodb.net/schooling_system
   ```
4. Click **"Save"**
5. **Redeploy** your application

### Step 4: Verify

After redeploying, check:
```
https://schooling-system-backend.vercel.app/health/db
```

You should now see:
```json
{
  "database": {
    "uriType": "Atlas",  // ✅ Changed from "Custom" to "Atlas"
    "uriPrefix": "mongodb+srv://wasi:***@cluster0.60u4pme.mongodb.net/schooling_system"
  }
}
```

## 📝 Key Points

1. **Must start with `mongodb+srv://`** (not just `mongodb://`)
2. **Password must be URL-encoded:**
   - `!` → `%21`
   - `@` → `%40`
3. **No spaces** before or after the URI
4. **Include database name** at the end: `/schooling_system`

## 🔄 After Fixing

1. ✅ Update MONGO_URI in Vercel
2. ✅ Redeploy
3. ✅ Check `/health/db` - should show `"uriType": "Atlas"`
4. ✅ Should see `"connected": true` after a few seconds

