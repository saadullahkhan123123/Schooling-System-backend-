# 🗄️ MongoDB Setup Guide

## For Production (Vercel)

Your backend needs a MongoDB database to work. **You cannot use `localhost` MongoDB in production** because Vercel servers don't have access to your local machine.

### Option 1: MongoDB Atlas (Recommended - Free Tier Available)

1. **Sign up for MongoDB Atlas** (free tier available):
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Create a free account

2. **Create a Cluster**:
   - Click "Build a Database"
   - Choose "FREE" (M0) tier
   - Select a cloud provider and region (choose closest to your Vercel deployment)
   - Click "Create"

3. **Set up Database Access**:
   - Go to "Database Access" in the left menu
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password (save these!)
   - Set privileges to "Atlas Admin" or "Read and write to any database"
   - Click "Add User"

4. **Set up Network Access**:
   - Go to "Network Access" in the left menu
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for Vercel) or add `0.0.0.0/0`
   - Click "Confirm"

5. **Get Your Connection String**:
   - Go to "Database" in the left menu
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`)
   - Replace `<password>` with your database user password
   - Replace `<database>` with your database name (e.g., `schooling_system`)

6. **Add to Vercel Environment Variables**:
   - Go to your Vercel project dashboard
   - Go to "Settings" → "Environment Variables"
   - Add:
     - **Name:** `MONGO_URI`
     - **Value:** Your complete connection string (from step 5)
   - Click "Save"
   - **Redeploy** your application for changes to take effect

### Option 2: Other Cloud MongoDB Services

- **MongoDB Atlas** (recommended)
- **Railway** (offers MongoDB)
- **Render** (offers MongoDB)
- **DigitalOcean** (MongoDB managed database)

## For Local Development

1. **Install MongoDB locally**:
   - Download from: https://www.mongodb.com/try/download/community
   - Or use Docker: `docker run -d -p 27017:27017 --name mongodb mongo`

2. **Create `.env` file** in `wasi schooling backend/Schooling-System-back-end/`:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/attendance_system
   JWT_SECRET=your_super_secret_jwt_key_here_change_this
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password_here
   ```

3. **Start MongoDB**:
   - Windows: MongoDB should start as a service automatically
   - Mac/Linux: `sudo systemctl start mongod` or `brew services start mongodb-community`

4. **Verify Connection**:
   - Visit: `http://localhost:3000/health`
   - Should show: `"database": "connected"`

## Troubleshooting

### "Database connection not available" Error

1. **Check Environment Variables**:
   - In Vercel: Go to Settings → Environment Variables
   - Ensure `MONGO_URI` is set correctly
   - Make sure there are no extra spaces or quotes

2. **Check MongoDB Atlas Network Access**:
   - Ensure your IP (or `0.0.0.0/0`) is whitelisted
   - Vercel uses dynamic IPs, so allow all IPs for production

3. **Check Connection String Format**:
   - Should start with `mongodb://` or `mongodb+srv://`
   - Should include username, password, and cluster URL
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

4. **Check Database User Permissions**:
   - User should have read/write permissions
   - Try recreating the database user if issues persist

5. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments → Click on latest deployment → View Function Logs
   - Look for MongoDB connection errors

### Connection Timeout

- Increase timeout in `config/db.js` if needed
- Check if MongoDB Atlas cluster is paused (free tier pauses after inactivity)
- Ensure network access is properly configured

### Authentication Failed

- Verify username and password in connection string
- Check if database user exists and has correct permissions
- Try creating a new database user

## Testing Your Connection

After setting up, test your connection:

1. **Check Health Endpoint**:
   ```
   GET https://schooling-system-backend.vercel.app/health
   ```
   Should return: `"database": "connected"`

2. **Try Login/Register**:
   - If database is connected, login/register should work
   - If not, you'll see "Database connection not available" error

## Important Notes

- ⚠️ **Never commit `.env` file to Git** - it contains sensitive information
- ⚠️ **Use strong passwords** for database users
- ⚠️ **Restrict network access** in production when possible (but allow Vercel IPs)
- ✅ **MongoDB Atlas free tier** is sufficient for small to medium applications
- ✅ **Connection string format** must be exact - no extra spaces or characters

