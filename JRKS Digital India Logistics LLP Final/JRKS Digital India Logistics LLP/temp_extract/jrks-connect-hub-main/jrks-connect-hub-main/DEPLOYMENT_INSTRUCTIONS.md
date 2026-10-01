# JRKS Logistics ERP — Deployment Instructions

## Package Contents

### 1. **jrks_final_deploy.zip** (3.7 MB)
Production-ready deployment package containing:
- `index.js` — Server entry point
- `package.json` — Production dependencies
- `server/` — Express API backend
  - `index.js` — API routes + SSR handler
  - `db.js` — MySQL database module
  - `.env` — Database configuration (ready for production)
  - `package.json` — Server dependencies
- `dist/` — Built frontend
  - `client/` — Static assets (CSS, JS, images)
  - `server/` — TanStack Start SSR bundle

### 2. **jrks_production_export.sql** (27 KB)
Complete database dump with:
- All 14 tables (trucks, companies, banks, brokers, bookings, etc.)
- All existing data
- Schema with proper constraints and indexes

---

## Deployment Steps

### **Step 1: Upload Files**
1. Extract `jrks_final_deploy.zip`
2. Upload **all extracted contents** to:
   ```
   /home/digipl-jrkslogistics/htdocs/jrkslogistics.digipl.us/
   ```

Your folder structure should be:
```
/home/digipl-jrkslogistics/htdocs/jrkslogistics.digipl.us/
├── index.js
├── package.json
├── server/
│   ├── index.js
│   ├── db.js
│   ├── .env
│   └── package.json
└── dist/
    ├── client/
    └── server/
```

### **Step 2: Import Database**
1. Go to hosting **Databases** tab
2. Create new database:
   - **Database name:** `jrks`
   - **Database user:** `jrksdb`
   - **Password:** `Malaveeka@20`
3. Import `jrks_production_export.sql` via phpMyAdmin or command line:
   ```bash
   mysql -u jrksdb -pMalaveeka@20 jrks < jrks_production_export.sql
   ```

### **Step 3: Install Node Dependencies**
SSH into your server and run:
```bash
cd /home/digipl-jrkslogistics/htdocs/jrkslogistics.digipl.us
npm install
```

This installs only 4 production dependencies:
- express
- mysql2
- cors
- dotenv

### **Step 4: Configure & Start Node.js App**

**Node.js Settings (from your hosting panel):**
- **Node.js Version:** 22 LTS (already configured)
- **App Port:** 3047 (already configured)
- **Entry Point:** `index.js`
- **Start Command:** `node index.js`

Make sure the domain `jrkslogistics.digipl.us` is pointing to:
- **Root Directory:** `/home/digipl-jrkslogistics/htdocs/jrkslogistics.digipl.us`

Then start/restart the Node.js application from the hosting panel.

### **Step 5: Verify Deployment**

Visit: **https://jrkslogistics.digipl.us**

You should see the login page. Test with:
- **Username:** `admin`
- **Password:** `jrks123`

OR

- **Username:** `Trichybranch`
- **Password:** `Trichy@123`

---

## Configuration

### Database Credentials
The `.env` file in `server/` folder is already configured:
```env
DB_HOST=localhost
DB_USER=jrksdb
DB_PASSWORD=Malaveeka@20
DB_NAME=jrks
DB_PORT=3306
PORT=3047
```

**Important:** If your database host/user differs, update `server/.env` accordingly.

### Port Configuration
The app runs on port **3047** (configured in hosting panel). All API routes are accessible at:
- `/api/*` — API endpoints
- All other routes — SSR frontend

---

## Tech Stack
- **Frontend:** React 19, TypeScript, TanStack Router (SSR), Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MySQL 8.0
- **Dependencies:** express, mysql2, cors, dotenv (production only)

---

## Troubleshooting

### 1. **Server not starting**
- Check Node.js version is 22 LTS
- Verify port 3047 is not in use
- Check server logs for errors

### 2. **Database connection failed**
- Verify MySQL credentials in `server/.env`
- Ensure database `jrks` exists
- Confirm user `jrksdb` has access to `jrks` database

### 3. **Blank page or 404 errors**
- Ensure `dist/` folder exists with `client/` and `server/` subfolders
- Restart the Node.js application
- Check browser console for errors

### 4. **Login not working**
- Verify the database import completed successfully
- Check browser console for API errors
- Ensure `/api/*` routes are responding (check Network tab)

---

## Support

For issues or questions, contact the development team.

**Deployment Date:** July 24, 2026
**Version:** 1.0.0
