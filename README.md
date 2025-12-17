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

## 🎯 Features

### Admin Features (8 Modules)

#### 1. **Leave Applications Management**
- View all employee leave requests in a centralized table
- See leave details: employee name, leave type, dates, duration, reason
- Review and monitor leave status (pending, approved, rejected)
- Click 👁️ icon to expand full leave details

#### 2. **Employee Biodata Management**
- Access complete employee profiles and personal information
- View all biodata: full name, email, phone, address, DOB, gender, position, department, joining date
- Monitor employee information across the organization
- Click 👁️ icon to view detailed biodata

#### 3. **Payroll/Salary Management**
- Add salary records for any employee with detailed breakdown
- Input: Basic salary, allowances (HRA, travel, medical, special)
- Deductions: Provident fund, professional tax, income tax, other deductions
- Auto-calculates: Total salary, total deductions, net salary
- Auto-assigns payment date (current date)
- View all salary records in a table format
- Delete salary records with confirmation
- Employee dropdown shows all registered users

#### 4. **Company Holiday Calendar**
- Add company-wide holidays for the year
- Input: Holiday name and date
- Auto-extracts year from selected date
- View all holidays organized by date
- Delete holidays with confirmation
- Helps plan workforce scheduling

#### 5. **Grievance Management System**
- View all employee grievances in centralized dashboard
- See grievance details: employee name, subject, description, status, submission date
- Statuses: Pending, Under Review, Resolved
- Click "View Details" to see full grievance and respond
- Provide admin response/resolution notes
- Update grievance status (Pending → Under Review → Resolved)
- Real-time updates reflect in employee portal

#### 6. **Resignation Management System**
- View all resignation requests from employees
- See details: Employee name, reason, last working day, submission date, status
- Statuses: Pending, Accepted, Rejected
- Click "View Details" to review resignation
- Add admin notes (feedback, exit process details, etc.)
- Accept or Reject resignations
- Updates reflect immediately in employee portal

#### 7. **Manage Employees (User Management)**
- View all registered employees in a table
- See: User ID, Username, User Type, Account Creation Date
- Shows "Not provided" for employees without biodata
- Add new employee accounts (username + password)
- Edit existing employees (change username/password)
- Delete employees (removes user and all related data: leave, biodata, salary, grievances, resignations)
- Confirmation dialog before deletion to prevent accidental data loss

#### 8. **Statistics Dashboard**
- Total employees count
- Total leave applications
- Pending requests
- Approved requests
- Total salary records
- Total holidays

### Employee Features (6 Modules)

#### 1. **Leave Management**
- Submit leave applications with type, dates, and reason
- View personal leave history in a table
- Edit pending leave applications
- Delete leave applications
- See status: Pending, Approved, Rejected
- Auto-calculates leave duration

#### 2. **My Biodata**
- Add personal biodata information
- Fields: Full name, email, phone, address, date of birth, gender, position, department, joining date
- Edit biodata details
- Delete biodata records
- View complete profile information

#### 3. **Salary Details**
- View personal salary records
- See breakdown: Basic salary, allowances, deductions, net salary
- View payment dates
- Monitor salary history
- Read-only view (employees cannot edit/delete)

#### 4. **Yearly Holiday List**
- View current year's company holidays
- See holiday names and dates with day of week
- Organized chronologically
- Helps plan personal time off
- Read-only view

#### 5. **Grievances Portal**
- Submit grievances with subject and detailed description
- View submitted grievances history
- Track grievance status (Pending, Under Review, Resolved)
- See admin responses once provided
- View submission and update dates
- Click "View Details" to see full grievance with admin response

#### 6. **Resignation Portal**
- Submit resignation requests
- Input: Reason for resignation and last working day date
- View resignation status (Pending, Accepted, Rejected)
- See admin notes/feedback
- View submission date
- Track resignation processing
- Click "View Details" to see admin response

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

**✅ AUTOMATIC PASSWORD DETECTION (Built-in Feature):**
The application now auto-detects your operating system:
- **Windows:** Automatically tries password `Root@12345`
- **Mac/Linux:** Automatically tries empty password `''`

If auto-detection fails, manually set your password:

**Quick Fix:**
1. Open `server.js`
2. Edit line 4 at the top:
   ```javascript
   const MYSQL_ROOT_PASSWORD = process.env.MYSQL_PASSWORD || 'YOUR_PASSWORD_HERE';
   ```
3. Replace `'YOUR_PASSWORD_HERE'` with your actual MySQL password
4. Common passwords to try:
   - Windows: `'Root@12345'`, `'root'`, `'password'`
   - Mac: `''` (empty string), `'root'`
5. Save and run `npm start` again

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

**Solution:** Dependencies not installed
```bash
npm install
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

1. ✅ Detects your OS and sets MySQL password
2. ✅ Connects to MySQL
3. ✅ Creates database `employee_admin_system` (if not exists)
4. ✅ Creates `users` table (if not exists)
5. ✅ Creates `leave_applications` table (if not exists)
6. ✅ Creates `biodata` table (if not exists)
7. ✅ Creates `salaries` table (if not exists)
8. ✅ Creates `company_holidays` table (if not exists)
9. ✅ Creates `grievances` table (if not exists)
10. ✅ Creates `resignations` table (if not exists)
11. ✅ Sets up foreign key relationships with CASCADE delete
12. ✅ Inserts default admin user (if not exists)
13. ✅ Starts web server on port 3000
14. ✅ Serves all HTML/CSS/JS files

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
- **Cross-platform support:** Auto-detects Windows/Mac/Linux for MySQL password
- **Security:** Passwords hashed with bcryptjs, prepared SQL statements prevent injection
- **Cascading deletes:** When employee is deleted, all related data (leave, biodata, salary, grievances, resignations) is automatically removed
- **Form validation:** All input fields are trimmed and validated before submission
- **XSS protection:** DOM manipulation used instead of innerHTML for user-generated content
- **Auto-calculations:** Salary net amount calculated automatically from inputs
- **Timestamps:** All records have created_at and updated_at fields

---

## Database Schema

### 7 Tables Created Automatically:

#### 1. `users` - User accounts
- id, username, password (hashed), user_type (admin/employee), created_at

#### 2. `leave_applications` - Leave requests
- id, employee_id (FK), leave_type, start_date, end_date, reason, status (pending/approved/rejected), created_at, updated_at

#### 3. `biodata` - Employee profiles
- id, employee_id (FK), full_name, email, phone, address, date_of_birth, gender, position, department, joining_date, created_at, updated_at

#### 4. `salaries` - Payroll records
- id, employee_id (FK), basic_salary, hra, travel_allowance, medical_allowance, special_allowance, pf, professional_tax, income_tax, other_deductions, total_salary, total_deductions, net_salary, payment_date, created_at

#### 5. `company_holidays` - Holiday calendar
- id, holiday_name, holiday_date, year, created_at

#### 6. `grievances` - Employee grievances
- id, employee_id (FK), subject, description, status (pending/under_review/resolved), admin_response, created_at, updated_at

#### 7. `resignations` - Resignation requests
- id, employee_id (FK), reason, last_working_day, status (pending/accepted/rejected), admin_notes, created_at, updated_at

**Foreign Keys:** All tables with employee_id have CASCADE delete - when user is deleted, all related records are automatically removed.

---

## API Endpoints (35+)

### Authentication
- `POST /api/signup` - Register new user
- `POST /api/login` - Authenticate user

### Leave Management
- `GET /api/leave?employee_id={id}` - Get employee's leaves
- `GET /api/leave?id={id}` - Get single leave
- `GET /api/leave?all=true` - Get all leaves (admin)
- `POST /api/leave` - Create leave
- `PUT /api/leave/:id` - Update leave
- `DELETE /api/leave/:id` - Delete leave

### Biodata Management
- `GET /api/biodata?employee_id={id}` - Get employee's biodata
- `GET /api/biodata?id={id}` - Get single biodata
- `GET /api/biodata?all=true` - Get all biodata (admin)
- `POST /api/biodata` - Create biodata
- `PUT /api/biodata/:id` - Update biodata
- `DELETE /api/biodata/:id` - Delete biodata

### Salary Management
- `GET /api/salaries?employee_id={id}` - Get employee's salaries
- `GET /api/salaries?all=true` - Get all salaries (admin)
- `POST /api/salaries` - Add salary record (admin)
- `DELETE /api/salaries/:id` - Delete salary record (admin)

### Holiday Management
- `GET /api/holidays` - Get all holidays
- `GET /api/holidays?year={year}` - Get holidays by year
- `POST /api/holidays` - Add holiday (admin)
- `DELETE /api/holidays/:id` - Delete holiday (admin)

### Grievance Management
- `GET /api/grievances?employee_id={id}` - Get employee's grievances
- `GET /api/grievances?id={id}` - Get single grievance
- `GET /api/grievances?all=true` - Get all grievances (admin)
- `POST /api/grievances` - Submit grievance (employee)
- `PUT /api/grievances/:id` - Update grievance status/response (admin)

### Resignation Management
- `GET /api/resignations?employee_id={id}` - Get employee's resignations
- `GET /api/resignations?id={id}` - Get single resignation
- `GET /api/resignations?all=true` - Get all resignations (admin)
- `POST /api/resignations` - Submit resignation (employee)
- `PUT /api/resignations/:id` - Accept/Reject resignation (admin)

### User Management
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get single user (admin)
- `POST /api/users` - Create new employee account (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user and all related data (admin)

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
