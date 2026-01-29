# RescueChain - Complete Setup Instructions

This guide provides step-by-step instructions to set up and run the RescueChain application, including API configuration, database setup, and photo storage.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend API Setup](#backend-api-setup)
4. [Frontend Setup](#frontend-setup)
5. [Environment Variables](#environment-variables)
6. [Photo Storage Configuration](#photo-storage-configuration)
7. [Running the Application](#running-the-application)
8. [Testing the Setup](#testing-the-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` (should show v14+)
   - Verify npm: `npm --version`

2. **PostgreSQL** (v12 or higher)
   - Download from: https://www.postgresql.org/download/
   - **Windows**: Use PostgreSQL installer
   - **macOS**: `brew install postgresql`
   - **Linux**: `sudo apt-get install postgresql`
   - Verify installation: `psql --version`

3. **pgAdmin 4** (Optional but recommended)
   - Download from: https://www.pgadmin.org/download/
   - Used for database management and visualization

4. **Git** (Optional)
   - Download from: https://git-scm.com/downloads

---

## Database Setup

### Step 1: Create PostgreSQL Database

1. **Open PostgreSQL Command Line** or **pgAdmin 4**

2. **Create a new database**:
   ```sql
   CREATE DATABASE rescuechain;
   ```

   **Using psql command line:**
   ```bash
   psql -U postgres
   CREATE DATABASE rescuechain;
   \q
   ```

   **Using pgAdmin 4:**
   - Right-click on "Databases" → "Create" → "Database"
   - Name: `rescuechain`
   - Click "Save"

### Step 2: Run Database Schema

1. **Navigate to the database schemas directory**:
   ```bash
   cd database/schemas
   ```

2. **Run the schema SQL file**:

   **Option A: Using psql**
   ```bash
   psql -U postgres -d rescuechain -f schema.sql
   ```

   **Option B: Using pgAdmin 4**
   - Connect to `rescuechain` database
   - Right-click → "Query Tool"
   - Open `database/schemas/schema.sql`
   - Click "Execute" (F5)

   **Option C: Using psql interactive**
   ```bash
   psql -U postgres -d rescuechain
   \i database/schemas/schema.sql
   ```

3. **Verify schema creation**:
   ```sql
   \dt  -- List all tables
   ```
   You should see tables: `users`, `complaints`, `donations`, `photo_evidence`, `blockchain_audit_logs`, etc.

### Step 3: Seed Database (Optional - for demo data)

1. **Run seed data script**:

   **Using psql:**
   ```bash
   psql -U postgres -d rescuechain -f database/seeders/seed_data.sql
   ```

   **Using pgAdmin 4:**
   - Open Query Tool
   - Open `database/seeders/seed_data.sql`
   - Execute (F5)

2. **Verify seed data**:
   ```sql
   SELECT user_type, COUNT(*) FROM users WHERE is_seeded = TRUE GROUP BY user_type;
   SELECT status, COUNT(*) FROM complaints WHERE is_seeded = TRUE GROUP BY status;
   ```

---

## Backend API Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- `express` - Web framework
- `pg` - PostgreSQL client
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `multer` - File upload handling
- `ethers` - Blockchain integration
- `exifr` - EXIF data extraction
- And other dependencies

### Step 3: Create Environment File

1. **Create `.env` file** in the `backend/` directory:
   ```bash
   # Windows PowerShell
   New-Item .env
   
   # Linux/macOS
   touch .env
   ```

2. **Add the following content** (see [Environment Variables](#environment-variables) section for details):

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=rescuechain
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password

   # Server Configuration
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=development

   # JWT Secret (generate a random string)
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

   # IPFS Configuration (Optional - uses mock by default)
   IPFS_PROVIDER=mock
   IPFS_GATEWAY_URL=https://ipfs.io/ipfs

   # Polygon Blockchain Configuration (Optional - uses mock if not set)
   POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
   POLYGON_PRIVATE_KEY=
   POLYGON_CONTRACT_ADDRESS=
   ```

3. **Replace values**:
   - `DB_PASSWORD`: Your PostgreSQL password
   - `JWT_SECRET`: Generate a random string (e.g., use `openssl rand -base64 32`)

### Step 4: Verify Backend Setup

```bash
# Check if server starts (will fail without database, but should show no syntax errors)
node server.js
```

Press `Ctrl+C` to stop.

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 2: Install Dependencies

**If using npm:**
```bash
npm install
```

**If using yarn:**
```bash
yarn install
```

**If using pnpm:**
```bash
pnpm install
```

### Step 3: Create Environment File

1. **Create `.env` file** in the `frontend/` directory:
   ```bash
   # Windows PowerShell
   New-Item .env
   
   # Linux/macOS
   touch .env
   ```

2. **Add the following content**:

   ```env
   # API Base URL (Backend server URL)
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

   **Note**: If your backend runs on a different port or domain, update this URL accordingly.

### Step 4: Create UPI QR Code Image (Optional)

For the donation feature, you need a UPI QR code image:

1. **Create directory** (if it doesn't exist):
   ```bash
   mkdir -p frontend/public/assets
   ```

2. **Place your UPI QR code image** at:
   ```
   frontend/public/assets/common_upi_qr.png
   ```
   
   Or create a placeholder image for testing.

---

## Environment Variables

### Backend Environment Variables (`.env` in `backend/`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DB_HOST` | PostgreSQL host | Yes | `localhost` |
| `DB_PORT` | PostgreSQL port | Yes | `5432` |
| `DB_NAME` | Database name | Yes | `rescuechain` |
| `DB_USER` | PostgreSQL username | Yes | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | Yes | - |
| `PORT` | Backend server port | No | `3000` |
| `HOST` | Backend server host | No | `0.0.0.0` |
| `NODE_ENV` | Environment mode | No | `development` |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `IPFS_PROVIDER` | IPFS provider (`mock`, `pinata`, `infura`) | No | `mock` |
| `IPFS_GATEWAY_URL` | IPFS gateway URL | No | `https://ipfs.io/ipfs` |
| `POLYGON_RPC_URL` | Polygon RPC endpoint | No | `https://rpc-mumbai.maticvigil.com` |
| `POLYGON_PRIVATE_KEY` | Polygon wallet private key | No | (uses mock if empty) |
| `POLYGON_CONTRACT_ADDRESS` | Smart contract address | No | (optional) |

### Frontend Environment Variables (`.env` in `frontend/`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | Yes | `http://localhost:3000/api` |

---

## Photo Storage Configuration

### How Photos Are Stored

RescueChain uses **IPFS (InterPlanetary File System)** for photo storage:

1. **Photo Upload Flow**:
   - User uploads photo via frontend
   - Backend receives photo as multipart/form-data
   - Photo is stored in memory (using Multer)
   - EXIF data (GPS, timestamp) is extracted
   - Photo is uploaded to IPFS
   - IPFS returns a **Content ID (CID)**
   - CID is stored in database (`photo_evidence` table)

2. **Photo Storage Locations**:

   **Database** (`photo_evidence` table):
   - `ipfs_cid`: IPFS Content ID (primary storage reference)
   - `photo_url`: Gateway URL for accessing photo
   - `exif_latitude`, `exif_longitude`: GPS coordinates
   - `exif_timestamp`: Photo timestamp

   **IPFS Storage**:
   - Photos are stored on IPFS network
   - Accessible via gateway URL: `https://ipfs.io/ipfs/{cid}`
   - Or custom gateway if configured

3. **IPFS Provider Options**:

   **Mock Provider (Default - Development)**:
   - Photos stored in memory (temporary)
   - Generates mock CIDs
   - Good for testing
   - **No persistent storage**

   **Pinata (Production)**:
   - Requires Pinata API key
   - Persistent storage
   - Configure: `IPFS_PROVIDER=pinata`
   - Add: `PINATA_API_KEY` and `PINATA_SECRET_KEY`

   **Infura (Production)**:
   - Requires Infura project ID
   - Persistent storage
   - Configure: `IPFS_PROVIDER=infura`
   - Add: `INFURA_PROJECT_ID` and `INFURA_PROJECT_SECRET`

4. **Photo File Requirements**:
   - **Formats**: JPEG, JPG, PNG, HEIC, HEIF
   - **Max Size**: 10MB
   - **EXIF Data**: GPS coordinates and timestamp are extracted automatically

5. **Where to Store Photos for Testing**:

   For **development/testing**, photos are stored in memory (mock IPFS). No physical storage needed.

   For **production**, configure a real IPFS provider:
   ```env
   IPFS_PROVIDER=pinata
   PINATA_API_KEY=your_api_key
   PINATA_SECRET_KEY=your_secret_key
   ```

---

## Running the Application

### Step 1: Start PostgreSQL Database

Ensure PostgreSQL is running:

**Windows:**
- Check Services: `services.msc` → Look for "postgresql"
- Or start manually from pgAdmin

**macOS:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
```

### Step 2: Start Backend API Server

1. **Open a terminal** and navigate to backend:
   ```bash
   cd backend
   ```

2. **Start the server**:

   **Development mode (with auto-reload):**
   ```bash
   npm run dev
   ```

   **Production mode:**
   ```bash
   npm start
   ```

3. **Verify backend is running**:
   - You should see: `RescueChain API server running on http://0.0.0.0:3000`
   - Open browser: http://localhost:3000
   - You should see API information JSON

### Step 3: Start Frontend Development Server

1. **Open a NEW terminal** and navigate to frontend:
   ```bash
   cd frontend
   ```

2. **Start the development server**:

   **If using Vite (default):**
   ```bash
   npm run dev
   ```

   **If using Create React App:**
   ```bash
   npm start
   ```

3. **Verify frontend is running**:
   - You should see: `Local: http://localhost:5173` (Vite) or `http://localhost:3000` (CRA)
   - Open browser to the URL shown
   - You should see the RescueChain homepage

### Step 4: Access the Application

- **Frontend**: http://localhost:5173 (or port shown in terminal)
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000 (root endpoint shows all routes)

---

## Testing the Setup

### Test 1: Database Connection

```bash
# In backend directory
node -e "require('dotenv').config(); const db = require('./src/config/database'); db.query('SELECT NOW()').then(r => console.log('DB Connected:', r.rows[0])).catch(e => console.error('DB Error:', e));"
```

### Test 2: Backend API Health

```bash
# Using curl
curl http://localhost:3000/api/health

# Or open in browser
# http://localhost:3000/api/health
```

### Test 3: Frontend API Connection

1. Open frontend in browser
2. Open browser DevTools (F12)
3. Check Network tab
4. Try logging in or making a request
5. Verify API calls go to `http://localhost:3000/api`

### Test 4: Test Accounts

**Victim Login (OTP):**
- Phone: `+91-9123456780` (or any number)
- OTP: `123456` (fixed demo OTP)

**NGO Login:**
- Username: `redcross`
- Password: `password123`

**SDMA Login:**
- Username: `sdma_admin`
- Password: `password123`

**DDMA Login:**
- Username: `ddma_delhi`
- Password: `password123`

---

## Troubleshooting

### Issue: Database Connection Error

**Error**: `Connection refused` or `password authentication failed`

**Solutions**:
1. Verify PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
2. Check `.env` file has correct database credentials
3. Verify database exists: `psql -U postgres -l` (should list `rescuechain`)
4. Check PostgreSQL authentication: Edit `pg_hba.conf` if needed

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solutions**:
1. Change `PORT` in backend `.env` to a different port (e.g., `3001`)
2. Update frontend `.env`: `VITE_API_BASE_URL=http://localhost:3001/api`
3. Or kill the process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/macOS
   lsof -ti:3000 | xargs kill -9
   ```

### Issue: Frontend Can't Connect to Backend

**Error**: `Failed to fetch` or `Network Error`

**Solutions**:
1. Verify backend is running: http://localhost:3000
2. Check `VITE_API_BASE_URL` in frontend `.env`
3. Check CORS settings in backend (should allow frontend origin)
4. Check browser console for specific error

### Issue: Photo Upload Fails

**Error**: `Photo upload failed` or `Invalid file type`

**Solutions**:
1. Verify photo format: JPEG, PNG, or HEIC
2. Check file size: Must be under 10MB
3. Verify IPFS configuration in backend `.env`
4. Check backend logs for specific error

### Issue: Module Not Found

**Error**: `Cannot find module 'xxx'`

**Solutions**:
1. Run `npm install` in the directory with error
2. Delete `node_modules` and `package-lock.json`, then `npm install`
3. Verify Node.js version: `node --version` (should be v14+)

### Issue: JWT Token Errors

**Error**: `Invalid token` or `Token expired`

**Solutions**:
1. Clear browser localStorage: `localStorage.clear()` in console
2. Log in again
3. Check `JWT_SECRET` in backend `.env` is set

### Issue: Blockchain Audit Not Working

**Error**: No blockchain transaction hash in audit logs

**Solutions**:
1. This is **normal** if `POLYGON_PRIVATE_KEY` is not set
2. System uses mock hashes for development
3. To enable real blockchain:
   - Set `POLYGON_PRIVATE_KEY` in backend `.env`
   - Ensure wallet has MATIC tokens for gas fees
   - System will log to Polygon Mumbai testnet

---

## Quick Start Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `rescuechain` created
- [ ] Schema SQL executed (`database/schemas/schema.sql`)
- [ ] Seed data loaded (optional: `database/seeders/seed_data.sql`)
- [ ] Backend dependencies installed (`npm install` in `backend/`)
- [ ] Backend `.env` file created with database credentials
- [ ] Frontend dependencies installed (`npm install` in `frontend/`)
- [ ] Frontend `.env` file created with API URL
- [ ] Backend server running (`npm run dev` in `backend/`)
- [ ] Frontend server running (`npm run dev` in `frontend/`)
- [ ] Can access frontend in browser
- [ ] Can login with test accounts

---

## Next Steps

1. **Explore the Application**:
   - Create a complaint as a victim
   - Login as NGO and update complaint status
   - View SDMA audit logs

2. **Read Documentation**:
   - `docs/DEMO_SCRIPT.md` - Demo script for presentations
   - `backend/API_DOCUMENTATION.md` - API endpoint documentation
   - `docs/DATABASE_SCHEMA.md` - Database schema details

3. **Customize Configuration**:
   - Set up real IPFS provider for production
   - Configure Polygon blockchain for audit logging
   - Update UPI QR code image

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error logs in terminal/console
3. Verify all environment variables are set correctly
4. Check database connection and schema

---

**Happy Coding! 🚀**
