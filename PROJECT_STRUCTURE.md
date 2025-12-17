# 📁 Project Structure

## Complete File and Folder Organization

```
CrudDB/
│
├── index.html                      # Landing page with Admin/Employee login buttons
├── admin-login.html                # Admin authentication page (login/signup)
├── employee-login.html             # Employee authentication page (login/signup)
├── admin-dashboard.html            # Admin portal to view all employee data
├── employee-dashboard.html         # Employee portal for leave and biodata management
│
├── css/
│   └── style.css                   # Complete styling with dark/light theme
│
├── js/
│   ├── theme.js                    # Theme toggle functionality (dark/light mode)
│   ├── admin-login.js              # Admin login and signup logic
│   ├── employee-login.js           # Employee login and signup logic
│   ├── admin-dashboard.js          # Admin dashboard functionality
│   └── employee-dashboard.js       # Employee dashboard functionality
│
├── server.js                       # Node.js + Express backend server
├── package.json                    # Node.js dependencies and scripts
├── package-lock.json               # Locked versions of dependencies (auto-generated)
│
├── .gitignore                      # Git ignore rules for version control
├── INSTALLATION.md                 # Complete installation guide (this file's companion)
└── PROJECT_STRUCTURE.md            # This file - project documentation
```

---

## Detailed File Descriptions

### 🌐 HTML Files (Frontend Pages)

#### `index.html`
- **Purpose:** Landing page / Home page
- **Features:**
  - Welcome screen with company branding
  - Two main buttons: "Admin Login" and "Employee Login"
  - Theme toggle button (top-right corner)
  - Responsive design for all devices
- **Navigation:** Starting point of the application

#### `admin-login.html`
- **Purpose:** Admin authentication page
- **Features:**
  - Login form (username + password)
  - Signup modal for new admin users
  - Back button to return to landing page
  - Error message display
  - Form validation
- **Navigation:** 
  - Success → `admin-dashboard.html`
  - Back → `index.html`

#### `employee-login.html`
- **Purpose:** Employee authentication page
- **Features:**
  - Login form (username + password)
  - Signup modal for new employees
  - Back button to return to landing page
  - Error message display
  - Form validation
- **Navigation:** 
  - Success → `employee-dashboard.html`
  - Back → `index.html`

#### `admin-dashboard.html`
- **Purpose:** Admin control panel
- **Features:**
  - Sidebar navigation with 8 tabs:
    1. **Leave Applications** - View/review all employee leaves
    2. **Employee Biodata** - View all employee profiles
    3. **Payroll/Salaries** - Manage salary records, add/delete payments
    4. **Holidays** - Manage company holiday calendar
    5. **Grievances** - View/respond to employee grievances
    6. **Resignations** - Review/process resignation requests
    7. **Manage Employees** - Add/edit/delete employee accounts
    8. **Statistics** - Dashboard with counts and metrics
  - Statistics cards (total employees, leaves, holidays, salaries, grievances, resignations)
  - Data tables showing ALL employee information
  - Expandable detail views (click 👁️ icon or "View Details" buttons)
  - Add/Edit/Delete forms for all modules
  - Confirmation dialogs for deletions
  - Logout button
  - Theme toggle
  - Auto-calculated fields (net salary, totals)
- **Access:** Admin users only
- **Data Shown:** All employees' records across all 7 database tables

#### `employee-dashboard.html`
- **Purpose:** Employee control panel
- **Features:**
  - Sidebar navigation with 6 tabs:
    1. **Leave Management** - Apply for/manage leave requests
    2. **My Biodata** - Add/edit personal profile
    3. **Salary Details** - View salary records (read-only)
    4. **Holidays** - View yearly company holidays (read-only)
    5. **Grievances** - Submit/track grievances
    6. **Resignation** - Submit/track resignation requests
  - Forms to add new leave/biodata/grievance/resignation entries
  - Data tables showing personal data only
  - Edit and delete buttons for own leave/biodata records
  - View-only access to salary and holiday data
  - Status tracking for grievances and resignations
  - "View Details" buttons to see admin responses
  - Logout button
  - Theme toggle
- **Access:** Employee users only
- **Data Shown:** Only logged-in employee's data

---

### 🎨 CSS Files (Styling)

#### `css/style.css`
- **Purpose:** Complete application styling
- **Features:**
  - CSS Variables for theme colors
  - Dark theme styles (`[data-theme="dark"]`)
  - Light theme styles (default)
  - Responsive design (mobile, tablet, desktop)
  - Animations and transitions
  - Button styles
  - Form styles
  - Table styles
  - Modal styles
  - Layout grid system
- **Lines:** ~1,400 lines
- **Organization:**
  - Variables section
  - Global styles
  - Component styles
  - Layout styles
  - Responsive media queries
  - Animation keyframes

---

### ⚡ JavaScript Files (Frontend Logic)

#### `js/theme.js`
- **Purpose:** Dark/Light theme toggle functionality
- **Features:**
  - Reads theme preference from localStorage
  - Applies theme on page load
  - Toggles between light/dark modes
  - Updates theme icon (🌙/☀️)
  - Saves preference to localStorage
- **Used By:** All HTML pages
- **Lines:** ~20 lines

#### `js/admin-login.js`
- **Purpose:** Admin authentication logic
- **Features:**
  - Handles login form submission
  - Handles signup form submission
  - Password confirmation validation
  - API calls to `/api/login` and `/api/signup`
  - Stores user session in sessionStorage
  - Redirects to admin dashboard on success
  - Displays error messages
  - Modal open/close functionality
- **API Endpoints Used:**
  - POST `/api/login`
  - POST `/api/signup`
- **Lines:** ~120 lines

#### `js/employee-login.js`
- **Purpose:** Employee authentication logic
- **Features:**
  - Handles login form submission
  - Handles signup form submission
  - Password confirmation validation
  - API calls to `/api/login` and `/api/signup`
  - Stores user session in sessionStorage
  - Redirects to employee dashboard on success
  - Displays error messages
  - Modal open/close functionality
- **API Endpoints Used:**
  - POST `/api/login`
  - POST `/api/signup`
- **Lines:** ~120 lines

#### `js/admin-dashboard.js`
- **Purpose:** Admin dashboard functionality
- **Features:**
  - Session validation (redirects if not admin)
  - Tab switching (8 modules)
  - Loads all employee data from all tables
  - Displays statistics and counts
  - Expandable detail views for records
  - Formats dates and data for display
  - CRUD operations for all modules
  - Modal management for forms
  - Confirmation dialogs before deletions
  - XSS protection using DOM methods (not innerHTML)
  - Logout functionality
- **API Endpoints Used:**
  - GET `/api/leave?all=true` - All leaves
  - GET `/api/leave?id={id}` - Single leave
  - GET `/api/biodata?all=true` - All biodata
  - GET `/api/biodata?id={id}` - Single biodata
  - GET `/api/salaries?all=true` - All salaries
  - POST `/api/salaries` - Add salary
  - DELETE `/api/salaries/:id` - Delete salary
  - GET `/api/holidays` - All holidays
  - POST `/api/holidays` - Add holiday
  - DELETE `/api/holidays/:id` - Delete holiday
  - GET `/api/grievances?all=true` - All grievances
  - GET `/api/grievances?id={id}` - Single grievance
  - PUT `/api/grievances/:id` - Update grievance
  - GET `/api/resignations?all=true` - All resignations
  - GET `/api/resignations?id={id}` - Single resignation
  - PUT `/api/resignations/:id` - Update resignation
  - GET `/api/users` - All users
  - POST `/api/users` - Add employee
  - PUT `/api/users/:id` - Edit employee
  - DELETE `/api/users/:id` - Delete employee
- **Functions:**
  - `loadAllLeaveApplications()` - Fetches all leaves
  - `viewLeaveDetails(id)` - Shows detailed leave view
  - `loadAllBiodata()` - Fetches all biodata
  - `viewBiodataDetails(id)` - Shows detailed biodata view
  - `loadAllSalaries()` - Fetches all salary records
  - `loadEmployeesForSalary()` - Loads employee dropdown from users table
  - `addSalary()` - Submits new salary with auto-calculations
  - `deleteSalary(id)` - Removes salary record
  - `loadAllHolidays()` - Fetches company holidays
  - `deleteHoliday(id)` - Removes holiday
  - `loadAllGrievances()` - Fetches all grievances
  - `viewGrievance(id)` - Shows grievance details + response form
  - `updateGrievance(id)` - Updates status and admin response
  - `loadAllResignations()` - Fetches all resignations
  - `viewResignation(id)` - Shows resignation details + response form
  - `updateResignation(id)` - Accepts/rejects with admin notes
  - `loadAllEmployees()` - Fetches all users for management table
  - `editEmployee(id, username)` - Loads employee for editing
  - `deleteEmployee(id, username)` - Deletes user with confirmation
  - `formatDate()` - Date formatting
  - `calculateDuration()` - Leave duration calculation
  - `calculateNetSalary()` - Auto-calculates net salary from inputs
- **Lines:** ~1,208 lines

#### `js/employee-dashboard.js`
- **Purpose:** Employee dashboard functionality
- **Features:**
  - Session validation (redirects if not employee)
  - Tab switching (6 modules)
  - CRUD operations for leave applications
  - CRUD operations for biodata
  - View-only access to salaries and holidays
  - Submit and track grievances
  - Submit and track resignations
  - Form handling (add/edit)
  - Modal management
  - Data table rendering
  - Input validation with .trim() to prevent whitespace-only submissions
  - Logout functionality
- **API Endpoints Used:**
  - GET `/api/leave?employee_id={id}` - Employee's leaves
  - GET `/api/leave?id={id}` - Single leave
  - POST `/api/leave` - Create leave
  - PUT `/api/leave/{id}` - Update leave
  - DELETE `/api/leave/{id}` - Delete leave
  - GET `/api/biodata?employee_id={id}` - Employee's biodata
  - GET `/api/biodata?id={id}` - Single biodata
  - POST `/api/biodata` - Create biodata
  - PUT `/api/biodata/{id}` - Update biodata
  - DELETE `/api/biodata/{id}` - Delete biodata
  - GET `/api/salaries?employee_id={id}` - Employee's salary records
  - GET `/api/holidays?year={year}` - Current year holidays
  - GET `/api/grievances?employee_id={id}` - Employee's grievances
  - GET `/api/grievances?id={id}` - Single grievance
  - POST `/api/grievances` - Submit grievance
  - GET `/api/resignations?employee_id={id}` - Employee's resignations
  - GET `/api/resignations?id={id}` - Single resignation
  - POST `/api/resignations` - Submit resignation
- **Functions:**
  - `loadLeaveApplications()` - Fetch employee's leaves
  - `editLeave(id)` - Load leave for editing
  - `deleteLeave(id)` - Delete leave application
  - `loadBiodata()` - Fetch employee's biodata
  - `editBiodata(id)` - Load biodata for editing
  - `deleteBiodata(id)` - Delete biodata record
  - `loadSalaryRecords()` - Fetch employee's salary history
  - `loadHolidays()` - Fetch current year holidays with day names
  - `loadGrievances()` - Fetch employee's grievances
  - `viewGrievanceDetails(id)` - Show grievance with admin response
  - `loadResignations()` - Fetch employee's resignations
  - `viewResignationDetails(id)` - Show resignation with admin notes
  - `formatDate()` - Date formatting
  - `getDayName()` - Convert date to day of week
- **Lines:** ~751 lines

---

### 🖥️ Backend Files

#### `server.js`
- **Purpose:** Node.js + Express backend server
- **Features:**
  - Express web server setup
  - MySQL database connection
  - **Cross-platform MySQL password detection:**
    - Auto-detects Windows → tries `Root@12345`
    - Auto-detects Mac/Linux → tries empty password `''`
    - Falls back to environment variable or manual configuration
  - Automatic database initialization
  - Automatic table creation (7 tables)
  - Foreign key relationships with CASCADE delete
  - Default admin user creation
  - RESTful API endpoints (35+)
  - Static file serving
  - CORS configuration
  - JSON body parsing
  - Error handling
  - Password hashing with bcryptjs
  - SQL injection prevention using prepared statements
- **Database Operations:**
  - Creates `employee_admin_system` database
  - Creates 7 tables:
    1. `users` - User accounts
    2. `leave_applications` - Leave requests (FK to users)
    3. `biodata` - Employee profiles (FK to users)
    4. `salaries` - Payroll records (FK to users)
    5. `company_holidays` - Holiday calendar
    6. `grievances` - Employee grievances (FK to users)
    7. `resignations` - Resignation requests (FK to users)
  - Sets up foreign keys with ON DELETE CASCADE
  - Inserts default admin user
- **API Routes:**
  
  **Authentication (2 endpoints):**
  - `POST /api/signup` - User registration
  - `POST /api/login` - User authentication
  
  **Leave Management (6 endpoints):**
  - `GET /api/leave?employee_id={id}` - Get employee's leaves
  - `GET /api/leave?id={id}` - Get single leave
  - `GET /api/leave?all=true` - Get all leaves (admin)
  - `POST /api/leave` - Create leave application
  - `PUT /api/leave/:id` - Update leave application
  - `DELETE /api/leave/:id` - Delete leave application
  
  **Biodata Management (6 endpoints):**
  - `GET /api/biodata?employee_id={id}` - Get employee's biodata
  - `GET /api/biodata?id={id}` - Get single biodata
  - `GET /api/biodata?all=true` - Get all biodata (admin)
  - `POST /api/biodata` - Create biodata
  - `PUT /api/biodata/:id` - Update biodata
  - `DELETE /api/biodata/:id` - Delete biodata
  
  **Salary Management (4 endpoints):**
  - `GET /api/salaries?employee_id={id}` - Get employee's salaries
  - `GET /api/salaries?all=true` - Get all salaries (admin)
  - `POST /api/salaries` - Add salary record (auto-calculates net, auto-assigns payment date)
  - `DELETE /api/salaries/:id` - Delete salary record (admin)
  
  **Holiday Management (4 endpoints):**
  - `GET /api/holidays` - Get all holidays
  - `GET /api/holidays?year={year}` - Get holidays by year
  - `POST /api/holidays` - Add holiday (auto-extracts year from date)
  - `DELETE /api/holidays/:id` - Delete holiday (admin)
  
  **Grievance Management (5 endpoints):**
  - `GET /api/grievances?employee_id={id}` - Get employee's grievances
  - `GET /api/grievances?id={id}` - Get single grievance
  - `GET /api/grievances?all=true` - Get all grievances (admin)
  - `POST /api/grievances` - Submit grievance (employee)
  - `PUT /api/grievances/:id` - Update grievance status/response (admin, updates updated_at timestamp)
  
  **Resignation Management (5 endpoints):**
  - `GET /api/resignations?employee_id={id}` - Get employee's resignations
  - `GET /api/resignations?id={id}` - Get single resignation
  - `GET /api/resignations?all=true` - Get all resignations (admin)
  - `POST /api/resignations` - Submit resignation (employee)
  - `PUT /api/resignations/:id` - Accept/Reject resignation (admin, updates updated_at timestamp)
  
  **User Management (5 endpoints):**
  - `GET /api/users` - Get all users (admin, LEFT JOIN with biodata)
  - `GET /api/users/:id` - Get single user (admin)
  - `POST /api/users` - Create new employee account (admin)
  - `PUT /api/users/:id` - Update user credentials (admin)
  - `DELETE /api/users/:id` - Delete user and all related data (admin, CASCADE deletes: leaves, biodata, salaries, grievances, resignations)

- **Port:** 3000
- **Lines:** ~1,353 lines

---

### 📦 Configuration Files

#### `package.json`
- **Purpose:** Node.js project configuration
- **Contains:**
  - Project metadata (name, version, description)
  - Dependencies list:
    - `express` (^4.18.2) - Web server framework
    - `mysql2` (^3.6.5) - MySQL database driver
    - `cors` (^2.8.5) - Cross-Origin Resource Sharing
    - `bcryptjs` (^2.4.3) - Password hashing
    - `body-parser` (^1.20.2) - Request body parsing
  - Dev dependencies:
    - `nodemon` (^3.0.2) - Auto-restart during development
  - Scripts:
    - `npm start` - Starts the server
    - `npm run dev` - Starts with auto-reload
    - `npm run setup` - Runs installation

#### `package-lock.json`
- **Purpose:** Locked dependency versions
- **Auto-generated:** Created by npm install
- **Do not edit manually**
- **Ensures:** Same versions across all installations

---

### 🔒 Other Files

#### `.gitignore`
- **Purpose:** Specifies files to ignore in version control
- **Ignores:**
  - `node_modules/` - Dependencies folder
  - `package-lock.json` - Lock file
  - `.env` - Environment variables
  - `*.log` - Log files
  - `.DS_Store` - Mac system files
  - `Thumbs.db` - Windows thumbnails
  - IDE configuration folders

---

## Database Structure

### Database: `employee_admin_system`

#### Table 1: `users`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- username (VARCHAR, UNIQUE)
- password (VARCHAR) - Hashed with bcryptjs
- user_type (ENUM: 'admin', 'employee')
- created_at (TIMESTAMP)
```

#### Table 2: `leave_applications`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- employee_id (INT, FOREIGN KEY → users.id, ON DELETE CASCADE)
- leave_type (VARCHAR)
- start_date (DATE)
- end_date (DATE)
- reason (TEXT)
- status (ENUM: 'pending', 'approved', 'rejected')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Table 3: `biodata`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- employee_id (INT, FOREIGN KEY → users.id, ON DELETE CASCADE)
- full_name (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- address (TEXT)
- date_of_birth (DATE)
- gender (ENUM: 'male', 'female', 'other')
- position (VARCHAR)
- department (VARCHAR)
- joining_date (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Table 4: `salaries`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- employee_id (INT, FOREIGN KEY → users.id, ON DELETE CASCADE)
- basic_salary (DECIMAL)
- hra (DECIMAL) - House Rent Allowance
- travel_allowance (DECIMAL)
- medical_allowance (DECIMAL)
- special_allowance (DECIMAL)
- pf (DECIMAL) - Provident Fund
- professional_tax (DECIMAL)
- income_tax (DECIMAL)
- other_deductions (DECIMAL)
- total_salary (DECIMAL) - Auto-calculated: basic + all allowances
- total_deductions (DECIMAL) - Auto-calculated: sum of all deductions
- net_salary (DECIMAL) - Auto-calculated: total_salary - total_deductions
- payment_date (DATE) - Auto-assigned: current date
- created_at (TIMESTAMP)
```

#### Table 5: `company_holidays`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- holiday_name (VARCHAR)
- holiday_date (DATE)
- year (INT) - Auto-extracted from holiday_date
- created_at (TIMESTAMP)
```

#### Table 6: `grievances`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- employee_id (INT, FOREIGN KEY → users.id, ON DELETE CASCADE)
- subject (VARCHAR)
- description (TEXT)
- status (ENUM: 'pending', 'under_review', 'resolved')
- admin_response (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP) - Auto-updated when status/response changes
```

#### Table 7: `resignations`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- employee_id (INT, FOREIGN KEY → users.id, ON DELETE CASCADE)
- reason (TEXT)
- last_working_day (DATE)
- status (ENUM: 'pending', 'accepted', 'rejected')
- admin_notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP) - Auto-updated when status/notes change
```

**Foreign Key Behavior:**
- All tables with `employee_id` have `ON DELETE CASCADE`
- When a user is deleted from `users` table:
  - All their leave applications are deleted
  - All their biodata records are deleted
  - All their salary records are deleted
  - All their grievances are deleted
  - All their resignations are deleted
- This ensures data integrity and prevents orphaned records

---

## Data Flow

### Employee Login Flow:
1. User opens `index.html`
2. Clicks "Employee Login" → `employee-login.html`
3. Enters credentials → `js/employee-login.js`
4. Sends to → `server.js` → `/api/login`
5. Validates against → MySQL `users` table
6. Success → Redirects to `employee-dashboard.html`

### Employee Creates Leave:
1. User in `employee-dashboard.html`
2. Clicks "Apply for Leave" → Opens modal
3. Fills form → `js/employee-dashboard.js`
4. Sends POST to → `server.js` → `/api/leave`
5. Saves to → MySQL `leave_applications` table
6. Refreshes → Shows in table

### Admin Views All Leaves:
1. Admin in `admin-dashboard.html`
2. Page loads → `js/admin-dashboard.js`
3. Fetches GET from → `server.js` → `/api/leave?all=true`
4. Queries → MySQL `leave_applications` + `users` (JOIN)
5. Returns all leaves → Displays in table

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5 | Page structure |
| **Frontend** | CSS3 | Styling and themes |
| **Frontend** | JavaScript (ES6+) | Client-side logic |
| **Backend** | Node.js | JavaScript runtime |
| **Backend** | Express.js | Web server framework |
| **Database** | MySQL | Data persistence |
| **Security** | bcryptjs | Password hashing |
| **API** | RESTful | Client-server communication |

---

## File Size Summary

| File Type | Count | Approx. Size |
|-----------|-------|--------------|
| HTML | 5 | ~25 KB |
| CSS | 1 | ~50 KB |
| JavaScript | 5 | ~30 KB |
| Backend | 1 | ~25 KB |
| Config | 2 | ~200 KB (with dependencies) |
| **Total** | **14** | **~330 KB** |

*Note: node_modules folder adds ~50-100 MB*

---

## Key Features by File

| Feature | Primary File(s) |
|---------|----------------|
| Landing Page | `index.html` |
| User Authentication | `admin-login.js`, `employee-login.js`, `server.js` |
| Leave CRUD | `employee-dashboard.js`, `admin-dashboard.js`, `server.js` |
| Biodata CRUD | `employee-dashboard.js`, `admin-dashboard.js`, `server.js` |
| Salary Management | `admin-dashboard.js`, `employee-dashboard.js`, `server.js` |
| Holiday Calendar | `admin-dashboard.js`, `employee-dashboard.js`, `server.js` |
| Grievance System | `employee-dashboard.js`, `admin-dashboard.js`, `server.js` |
| Resignation Processing | `employee-dashboard.js`, `admin-dashboard.js`, `server.js` |
| User Management | `admin-dashboard.js`, `server.js` |
| Admin Review | `admin-dashboard.js`, `server.js` |
| Theme Toggle | `theme.js`, `style.css` |
| Database Setup | `server.js` |
| Responsive Design | `style.css` |
| API Endpoints | `server.js` |
| Cross-platform Support | `server.js` (OS detection for MySQL password) |
| Security | `server.js` (bcryptjs hashing, prepared statements), `admin-dashboard.js` (XSS protection) |

---

## Startup Sequence

When you run `npm start`, this happens:

1. **server.js** executes
2. Loads dependencies (express, mysql2, bcryptjs, cors, body-parser)
3. **Detects operating system** for MySQL password:
   - Windows → tries `Root@12345`
   - Mac/Linux → tries empty password `''`
   - Falls back to environment variable or manual config
4. Connects to MySQL
5. Runs `initializeDatabase()` function:
   - Creates `employee_admin_system` database if not exists
   - Creates 7 tables if not exist:
     - users
     - leave_applications (FK to users)
     - biodata (FK to users)
     - salaries (FK to users)
     - company_holidays
     - grievances (FK to users)
     - resignations (FK to users)
   - Sets up foreign key relationships with CASCADE delete
   - Inserts default admin user (if not exists)
6. Configures Express middleware (CORS, body-parser, static files)
7. Sets up API routes (35+ endpoints)
8. Serves static files (HTML/CSS/JS from root directory)
9. Starts listening on port 3000
10. Console logs: "🚀 Server is running on http://localhost:3000"

---

**Total Project Files:** 14 files (excluding node_modules)  
**Total Lines of Code:** ~3,572+ lines  
**Backend:** 1,353 lines (server.js)  
**Frontend JS:** 2,219 lines (admin-dashboard.js: 1,208, employee-dashboard.js: 751, admin-login.js: 120, employee-login.js: 120, theme.js: 22)  
**Auto-Generated Files:** 1 (package-lock.json)  
**Documentation Files:** 2 (README.md, PROJECT_STRUCTURE.md)  
**Database Tables:** 7 tables  
**API Endpoints:** 35+ RESTful routes  
**Features:** 8 admin modules + 6 employee modules  
**Security:** bcryptjs password hashing, SQL injection prevention, XSS protection, CASCADE deletes  
**Cross-platform:** Auto-detects OS for MySQL password (Windows/Mac/Linux)

---

## Recent Improvements & Bug Fixes

### Critical Bug Fixes (Latest Update)
1. **Salary Insert Error Fixed**
   - Issue: "Field 'payment_date' doesn't have a default value"
   - Fix: Auto-assigns payment_date = current date on salary creation
   - Location: [server.js](server.js#L823-L848)

2. **Employee Delete Error Fixed**
   - Issue: SQL syntax error with multi-statement DELETE query
   - Fix: Changed to 5 nested sequential DELETE queries (salaries → grievances → resignations → biodata → leave → user)
   - Location: [server.js](server.js#L1290-L1328)

3. **Grievance/Resignation Update Fixed**
   - Issue: Changes not reflecting in portal after admin response
   - Fix: Added `updated_at = NOW()` to UPDATE queries
   - Locations: [server.js](server.js#L1048), [server.js](server.js#L1146)

4. **XSS Vulnerability Fixed**
   - Issue: String interpolation in onclick attributes creating XSS risk
   - Fix: Replaced innerHTML with DOM createElement + event listeners
   - Location: [admin-dashboard.js](admin-dashboard.js#L1016-L1048)

5. **Employee Dropdown Empty**
   - Issue: Payroll dropdown was querying biodata table (doesn't include all users)
   - Fix: Changed to query users table with LEFT JOIN to biodata
   - Location: [admin-dashboard.js](admin-dashboard.js#L521-L535)

6. **Form Validation Improvements**
   - Issue: "All fields required" errors on valid submissions
   - Fix: Added .trim() to all input fields to remove whitespace
   - Applied across all form submissions in both dashboard files

### Feature Additions
- ✅ Payroll/Salary Management (4 endpoints, auto-calculations)
- ✅ Company Holiday Calendar (4 endpoints, year extraction)
- ✅ Grievance System (5 endpoints, status workflow)
- ✅ Resignation Processing (5 endpoints, accept/reject workflow)
- ✅ User Management/Manage Employees (5 endpoints, CRUD operations)
- ✅ Cross-platform MySQL password detection (OS auto-detection)
- ✅ Enhanced statistics dashboard with counts for all modules

---

## Code Quality & Security

### Security Measures
- **Password Hashing:** bcryptjs with salt rounds
- **SQL Injection Prevention:** Parameterized queries (prepared statements)
- **XSS Protection:** DOM manipulation instead of innerHTML
- **Session Management:** sessionStorage for user sessions
- **Input Validation:** .trim() on all inputs, required field checks
- **Cascading Deletes:** Prevents orphaned records, maintains data integrity

### Data Integrity
- **Foreign Keys:** All child tables reference users.id
- **ON DELETE CASCADE:** Auto-removes related records when user deleted
- **Timestamps:** created_at and updated_at on all tables
- **Auto-calculations:** Net salary, total deductions computed server-side
- **Enums:** Constrained values (status, user_type, gender) prevent invalid data

### Error Handling
- Try-catch blocks on all API endpoints
- User-friendly error messages
- Console logging for debugging
- MySQL connection error handling
- Graceful failure on database operations

````
