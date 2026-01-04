# 📝 .env File Configuration

## Current MongoDB URI Format

Your `.env` file should have this exact format:

```
PORT=3000
MONGO_URI=mongodb+srv://wasi:saadullah123%21%4021@cluster0.60u4pme.mongodb.net/schooling_system
JWT_SECRET=your_super_secret_jwt_key_here_change_this
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

## Important Points:

1. **Password Encoding**: 
   - Original password: `saadullah123!@21`
   - URL-encoded: `saadullah123%21%4021`
   - `!` → `%21`
   - `@` → `%40`

2. **URI Format**:
   - Must start with `mongodb+srv://`
   - Format: `mongodb+srv://username:encoded_password@cluster/database`
   - No spaces before or after the `=`

3. **Database Name**: 
   - Replace `schooling_system` with your actual database name if different

## Steps to Fix:

1. Open: `wasi schooling backend/Schooling-System-back-end/.env`
2. Find the `MONGO_URI=` line
3. Replace it with:
   ```
   MONGO_URI=mongodb+srv://wasi:saadullah123%21%4021@cluster0.60u4pme.mongodb.net/schooling_system
   ```
4. Save the file
5. Restart your server

## Verification:

After restarting, you should see:
- ✅ `📝 MongoDB Atlas (Cloud)`
- ✅ `📝 Host: cluster0.60u4pme.mongodb.net`
- ✅ `📝 Database: schooling_system`
- ✅ `✅ MongoDB Connected Successfully!`

If you still see errors, check:
- No extra spaces in the URI
- Password is properly URL-encoded
- Database name matches your MongoDB Atlas database

