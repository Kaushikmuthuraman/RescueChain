# Complete Setup Guide - RescueChain Application

This is a comprehensive step-by-step guide to get the RescueChain application running from scratch.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- [ ] **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- [ ] **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community) OR use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud)
- [ ] **npm** (comes with Node.js)
- [ ] **Git** (optional, for cloning)

---

## 🗄️ Step 1: Database Setup

### 1.1 PostgreSQL Setup

1. **Install PostgreSQL** (if not installed)
   - Windows: Download installer from postgresql.org
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Start PostgreSQL Service**
   - Windows: Check Services (`services.msc`) → Start "postgresql"
   - macOS: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

3. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE rescuechain;
   
   # Exit
   \q
   ```

4. **Run Schema**
   ```bash
   # Navigate to project root
   cd /path/to/RescueChain-7
   
   # Run schema SQL
   psql -U postgres -d rescuechain -f database/schemas/schema.sql
   ```

5. **Verify Tables Created**
   ```bash
   psql -U postgres -d rescuechain
   \dt
   # Should show: users, complaints, donations, blockchain_audit_logs, etc.
   \q
   ```

6. **Seed Database (Optional - for demo data)**
   ```bash
   psql -U postgres -d rescuechain -f database/seeders/seed_data.sql
   ```

### 1.2 MongoDB Setup

**Option A: Local MongoDB**

1. **Install MongoDB** (if not installed)
   - Windows: Download installer from mongodb.com
   - macOS: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb`

2. **Start MongoDB Service**
   - Windows: Check Services → Start "MongoDB"
   - macOS: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

3. **Verify MongoDB is Running**
   ```bash
   mongosh
   # Should connect successfully
   exit
   ```

**Option B: MongoDB Atlas (Cloud - Recommended)**

1. **Create Free Account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Create a Cluster** (Free tier: M0)
3. **Create Database User** (username/password)
4. **Whitelist IP** (Add `0.0.0.0/0` for development)
5. **Get Connection String** (Format: `mongodb+srv://username:password@cluster.mongodb.net/rescuechain`)

---

## 🔧 Step 2: Backend Setup

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

This installs:
- Express, PostgreSQL client (pg), Mongoose (MongoDB)
- JWT, bcrypt, multer, ethers, etc.

### 2.2 Create Backend Environment File

Create `backend/.env` file:

```bash
# Windows PowerShell
New-Item .env

# Linux/macOS
touch .env
```

Add the following content to `backend/.env`:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rescuechain
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# MongoDB Configuration (REQUIRED)
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/rescuechain

# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rescuechain?retryWrites=true&w=majority

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# JWT Secret (REQUIRED - generate a random string)
# Generate with: openssl rand -base64 32
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345

# IPFS Configuration (Optional - uses mock by default)
IPFS_PROVIDER=mock
IPFS_GATEWAY_URL=https://ipfs.io/ipfs

# Polygon Blockchain Configuration (Optional - uses mock if not set)
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_PRIVATE_KEY=
POLYGON_CONTRACT_ADDRESS=
```

**Important:** Replace:
- `DB_PASSWORD` with your PostgreSQL password
- `MONGODB_URI` with your MongoDB connection string
- `JWT_SECRET` with a random string (use `openssl rand -base64 32`)

### 2.3 Verify Backend Setup

```bash
# Test database connection (will fail if DB not running, but should show no syntax errors)
cd backend
node server.js
```

Press `Ctrl+C` to stop. If you see connection errors, check your `.env` file.

---

## 🎨 Step 3: Frontend Setup

### 3.1 Install Dependencies

```bash
cd frontend
npm install
```

### 3.2 Create Frontend Environment File

Create `frontend/.env` file:

```bash
# Windows PowerShell
New-Item .env

# Linux/macOS
touch .env
```

Add the following content to `frontend/.env`:

```env
# API Base URL (Backend server URL)
VITE_API_BASE_URL=http://localhost:3000/api
```

**Note:** If your backend runs on a different port, update this URL.

---

## 🚀 Step 4: Run the Application

### 4.1 Start PostgreSQL (if not already running)

```bash
# Windows: Check Services
# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

### 4.2 Start MongoDB (if using local MongoDB)

```bash
# Windows: Check Services
# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

### 4.3 Start Backend Server

Open **Terminal 1**:

```bash
cd backend
npm run dev
```

**Expected Output:**
```
[MongoDB] Connected successfully
RescueChain API server running on http://0.0.0.0:3000
Environment: development
```

**If MongoDB connection fails:**
- Check `MONGODB_URI` in `backend/.env`
- Verify MongoDB is running
- For Atlas: Check IP whitelist and credentials

### 4.4 Start Frontend Server

Open **Terminal 2**:

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## ✅ Step 5: Verify Everything Works

### 5.1 Test Backend API

Open browser: http://localhost:3000

Should see API information JSON.

### 5.2 Test Frontend

Open browser: http://localhost:5173

Should see RescueChain homepage.

### 5.3 Test Login

**Victim Login (OTP):**
- Phone: `+91-9123456780` (or any number)
- OTP: `123456` (fixed demo OTP)

**NGO Login:**
- Username: `redcross`
- Password: `password123`

**DDMA Login:**
- Username: `ddma_delhi`
- Password: `password123`

**SDMA Login:**
- Username: `sdma_admin`
- Password: `password123`

---

## 🔍 Troubleshooting

### Issue: MongoDB Connection Error

**Error:** `[MongoDB] Connection error: ...` or `MONGODB_URI is not set`

**Solutions:**
1. Check `MONGODB_URI` in `backend/.env` is set correctly
2. For local MongoDB: Verify service is running
3. For Atlas: Check connection string, username, password, IP whitelist
4. Test connection: `mongosh "your_connection_string"`

### Issue: PostgreSQL Connection Error

**Error:** `Connection refused` or `password authentication failed`

**Solutions:**
1. Verify PostgreSQL is running
2. Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` in `backend/.env`
3. Verify database exists: `psql -U postgres -l`
4. Test connection: `psql -U postgres -d rescuechain`

### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solutions:**
1. Change `PORT` in `backend/.env` to `3001`
2. Update `frontend/.env`: `VITE_API_BASE_URL=http://localhost:3001/api`
3. Or kill the process:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/macOS
   lsof -ti:3000 | xargs kill -9
   ```

### Issue: Frontend Can't Connect to Backend

**Error:** `Failed to fetch` or `Network Error`

**Solutions:**
1. Verify backend is running: http://localhost:3000
2. Check `VITE_API_BASE_URL` in `frontend/.env`
3. Check browser console for specific error
4. Verify CORS is enabled in backend (should be by default)

### Issue: Module Not Found

**Error:** `Cannot find module 'xxx'`

**Solutions:**
1. Run `npm install` in the directory with error
2. Delete `node_modules` and `package-lock.json`, then `npm install`
3. Verify Node.js version: `node --version` (should be v18+)

---

## 📝 Quick Reference

### Environment Variables Summary

**Backend (`backend/.env`):**
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL
- `MONGODB_URI` - MongoDB (REQUIRED)
- `PORT`, `HOST`, `NODE_ENV` - Server config
- `JWT_SECRET` - Authentication (REQUIRED)
- `POLYGON_RPC_URL`, `POLYGON_PRIVATE_KEY` - Blockchain (optional)

**Frontend (`frontend/.env`):**
- `VITE_API_BASE_URL` - Backend API URL (REQUIRED)

### Common Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev         # Start dev server
npm start           # Start production server

# Frontend
cd frontend
npm install          # Install dependencies
npm run dev         # Start dev server
npm run build       # Build for production

# Database
psql -U postgres -d rescuechain -f database/schemas/schema.sql  # Run schema
psql -U postgres -d rescuechain -f database/seeders/seed_data.sql  # Seed data
```

---

## 🎯 Complete Checklist

Use this checklist to ensure everything is set up:

- [ ] PostgreSQL installed and running
- [ ] PostgreSQL database `rescuechain` created
- [ ] PostgreSQL schema executed (`database/schemas/schema.sql`)
- [ ] PostgreSQL seed data loaded (optional: `database/seeders/seed_data.sql`)
- [ ] MongoDB installed/running OR MongoDB Atlas account created
- [ ] MongoDB connection string obtained
- [ ] Backend dependencies installed (`npm install` in `backend/`)
- [ ] Backend `.env` file created with all required variables
- [ ] Frontend dependencies installed (`npm install` in `frontend/`)
- [ ] Frontend `.env` file created with `VITE_API_BASE_URL`
- [ ] Backend server running (`npm run dev` in `backend/`)
- [ ] Frontend server running (`npm run dev` in `frontend/`)
- [ ] Can access frontend: http://localhost:5173
- [ ] Can access backend: http://localhost:3000
- [ ] Can login with test accounts
- [ ] MongoDB connection successful (check backend console)

---

## 🎉 You're All Set!

Once all steps are complete, you should have:
- ✅ Backend API running on port 3000
- ✅ Frontend app running on port 5173
- ✅ PostgreSQL database with schema
- ✅ MongoDB connected for image storage
- ✅ Ability to login and use the application

**Next Steps:**
- Explore the application features
- Read `docs/DEMO_SCRIPT.md` for demo scenarios
- Check `backend/API_DOCUMENTATION.md` for API details
- Review `docs/DATABASE_SCHEMA.md` for database structure

---

**Need Help?**
- Check the troubleshooting section above
- Review error logs in terminal/console
- Verify all environment variables are set correctly
- Ensure all services (PostgreSQL, MongoDB) are running
