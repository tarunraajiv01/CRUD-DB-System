# 🚀 Installation Instructions

## Quick Start (If you already have Node.js and MySQL)

```bash
npm install
npm start
```

**⚠️ If you get "Access denied" error:**
1. Open `server.js`
2. Change line 4: `const MYSQL_ROOT_PASSWORD = ... || 'root';` to your MySQL password
3. Run `npm start` again

---

## Step-by-Step Setup Guide for Windows and Mac

---

## Prerequisites Installation

### For Mac Users

#### Step 1: Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, add Homebrew to your PATH:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### Step 2: Install Node.js
```bash
brew install node
```

Verify installation:
```bash
node --version
npm --version
```

#### Step 3: Install MySQL
```bash
brew install mysql
```

#### Step 4: Start MySQL
```bash
brew services start mysql
```

Verify MySQL is running:
```bash
mysql --version
```

---

### For Windows Users

#### Step 1: Install Node.js

1. Go to https://nodejs.org/
2. Download the **LTS version** (Long Term Support)
3. Run the installer (.msi file)
4. Follow the installation wizard (accept all defaults)
5. Restart your computer

Verify installation (open Command Prompt):
```cmd
node --version
npm --version
```

#### Step 2: Install MySQL

**Option A: Using MySQL Installer (Recommended)**

1. Go to https://dev.mysql.com/downloads/installer/
2. Download **MySQL Installer for Windows**
3. Run the installer
4. Choose "Developer Default" setup type
5. Click "Execute" to install all components
6. Set root password (or leave empty for development)
7. Complete the installation

**Option B: Using XAMPP (Easier)**

1. Go to https://www.apachefriends.org/
2. Download XAMPP for Windows
3. Install XAMPP
4. Open XAMPP Control Panel
5. Click "Start" next to MySQL

Verify installation (open Command Prompt):
```cmd
mysql --version
```

#### Step 3: Start MySQL Service

**If using MySQL Installer:**
- MySQL should start automatically
- Or open Services (Win + R, type `services.msc`)
- Find "MySQL80" and click "Start"

**If using XAMPP:**
- Open XAMPP Control Panel
- Click "Start" button next to MySQL

---

## Project Installation

### Step 1: Navigate to Project Folder

**Mac:**
```bash
cd /path/to/CrudDB
```

**Windows (Command Prompt):**
```cmd
cd C:\path\to\CrudDB
```

**Windows (PowerShell):**
```powershell
cd C:\path\to\CrudDB
```

### Step 2: Install Project Dependencies

This command installs all required Node.js packages (express, mysql2, bcryptjs, cors, body-parser):

```bash
npm install
```

Wait for installation to complete (may take 1-2 minutes).

### Step 3: Configure MySQL Password (Windows Users)

**⚠️ IMPORTANT FOR WINDOWS USERS:**

If you get an "Access denied" error when starting the server, you need to set your MySQL password.

**Option A: Edit server.js (Easiest)**
1. Open `server.js` in any text editor
2. Find line 4 (at the very top):
   ```javascript
   const MYSQL_ROOT_PASSWORD = process.env.MYSQL_PASSWORD || 'root';
   ```
3. Change `'root'` to your MySQL password:
   ```javascript
   const MYSQL_ROOT_PASSWORD = process.env.MYSQL_PASSWORD || 'yourpassword';
   ```
   Common passwords: `'root'`, `'password'`, `''` (empty), or what you set during installation

**Option B: Use Environment Variable (Advanced)**
```cmd
set MYSQL_PASSWORD=yourpassword
npm start
```

**Mac Users:** If using Homebrew, MySQL usually has no password. The default `'root'` will be tried, but if that fails, try changing it to `''` (empty string).

### Step 4: Start the Application

```bash
npm start
```

You should see:
```
📦 Starting Employee-Admin CRUD System...
✅ Middleware configured
✅ Connected to MySQL
✅ Database ready
✅ Users table ready
✅ Leave applications table ready
✅ Biodata table ready
✅ Default admin user created

==================================================
🚀 Server is running on http://localhost:3000
📂 Open http://localhost:3000 in your browser
==================================================
```

### Step 5: Open in Browser

Open your web browser and go to:
```
http://localhost:3000
```

---

## Default Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Employee Account:**
- Click "Employee Login" → "Sign up" to create a new account

---

## Stopping the Server

Press `Ctrl + C` in the terminal/command prompt

---

## Troubleshooting

### Issue: "npm: command not found" or "node: command not found"

**Solution:** Node.js is not installed or not in PATH
- Reinstall Node.js
- Restart your terminal/command prompt
- On Windows, restart your computer

### Issue: "mysql: command not found"

**Solution:** MySQL is not installed or not in PATH
- Verify MySQL is installed
- On Windows with XAMPP: use XAMPP control panel instead

### Issue: "Cannot connect to MySQL"

**Solution:** MySQL is not running
- **Mac:** `brew services start mysql`
- **Windows (MySQL):** Start MySQL service from Services
- **Windows (XAMPP):** Start MySQL from XAMPP Control Panel

### Issue: Port 3000 already in use

**Solution:** Another application is using port 3000

**Mac:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Windows (Command Prompt):**
```cmd
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

### Issue: "Access denied for user 'root'" ⚠️ MOST COMMON

**Solution:** MySQL password is incorrect

**Quick Fix (Windows):**
1. Open `server.js`
2. Edit line 4 at the top:
   ```javascript
   const MYSQL_ROOT_PASSWORD = process.env.MYSQL_PASSWORD || 'YOUR_PASSWORD_HERE';
   ```
3. Replace `'YOUR_PASSWORD_HERE'` with your actual MySQL password
4. Common passwords to try: `'root'`, `'password'`, `''` (empty string)
5. Save and run `npm start` again

**Mac Users:** Try changing to `''` (empty string) if you're using Homebrew MySQL

**Alternative Method - Environment Variable:**
```cmd
# Windows
set MYSQL_PASSWORD=yourpassword
npm start

# Mac
export MYSQL_PASSWORD=yourpassword
npm start
```

### Issue: "Cannot find module 'express'"
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'YOUR_MYSQL_PASSWORD',  // Update this
    database: 'employee_admin_system'
};
```

### Issue: npm install fails

**Solution:** Clear npm cache and retry
```bash
npm cache clean --force
npm install
```

---

## What Happens Automatically?

When you run `npm start`, the application automatically:

1. ✅ Connects to MySQL
2. ✅ Creates database `employee_admin_system` (if not exists)
3. ✅ Creates `users` table (if not exists)
4. ✅ Creates `leave_applications` table (if not exists)
5. ✅ Creates `biodata` table (if not exists)
6. ✅ Inserts default admin user (if not exists)
7. ✅ Starts web server on port 3000
8. ✅ Serves all HTML/CSS/JS files

**No manual database setup required!**

---

## System Requirements

### Minimum Requirements
- **OS:** Windows 10/11 or macOS 10.14+
- **RAM:** 4GB
- **Disk Space:** 500MB
- **Node.js:** v14 or higher
- **MySQL:** v5.7 or higher

### Recommended Requirements
- **OS:** Windows 11 or macOS 12+
- **RAM:** 8GB
- **Disk Space:** 1GB
- **Node.js:** v18 or higher
- **MySQL:** v8.0 or higher

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Install dependencies | `npm install` |
| Start application | `npm start` |
| Stop application | `Ctrl + C` |
| Check Node version | `node --version` |
| Check npm version | `npm --version` |
| Check MySQL version | `mysql --version` |
| Start MySQL (Mac) | `brew services start mysql` |
| Stop MySQL (Mac) | `brew services stop mysql` |

---

## Additional Notes

- The application runs on **localhost:3000** by default
- Database name is **employee_admin_system**
- All data persists in MySQL database
- Theme preference saves in browser localStorage
- Server must be running to use the application

---

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure MySQL is running
4. Check terminal/command prompt for error messages
5. Restart terminal and try again

---

**Installation Complete! You're ready to use the Employee-Admin CRUD System.** 🎉
