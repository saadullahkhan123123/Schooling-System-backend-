# 🚀 How to Start the Backend Server

## Quick Start

1. **Navigate to the backend directory:**
   ```bash
   cd "wasi schooling backend/Schooling-System-back-end"
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Create a `.env` file** (if it doesn't exist) with the following:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/attendance_system
   JWT_SECRET=your_super_secret_jwt_key_here_change_this
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Verify the server is running:**
   - You should see: `🚀 Server Started Successfully!`
   - Open in browser: http://localhost:3000/health
   - You should see: `{"status":"OK","timestamp":"...","uptime":...}`

## Troubleshooting

### Port Already in Use
If you see `Port 3000 is already in use`:
- Kill the process: `npx kill-port 3000`
- Or use a different port by setting `PORT=3001` in your `.env` file

### MongoDB Connection Issues
The server will still run even if MongoDB is not connected, but some features may not work.
- Make sure MongoDB is installed and running
- Check your `MONGO_URI` in the `.env` file

### CORS Errors
If you see CORS errors, make sure your frontend origin is in the `allowedOrigins` array in `index.js`.

