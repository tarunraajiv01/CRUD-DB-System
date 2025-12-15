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
  - Sidebar navigation (Leave Applications, Employee Biodata)
  - Statistics cards (total, pending, approved counts)
  - Data tables showing ALL employee information
  - Expandable detail views (click 👁️ icon)
  - Logout button
  - Theme toggle
- **Access:** Admin users only
- **Data Shown:** All employees' leave applications and biodata

#### `employee-dashboard.html`
- **Purpose:** Employee control panel
- **Features:**
  - Sidebar navigation (Leave Management, My Biodata)
  - Forms to add new leave/biodata entries
  - Data tables showing personal data only
  - Edit and delete buttons for own records
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
  - Tab switching (Leave/Biodata)
  - Loads all employee leave applications
  - Loads all employee biodata
  - Displays statistics (counts)
  - Expandable detail view for records
  - Formats dates and data for display
  - Logout functionality
- **API Endpoints Used:**
  - GET `/api/leave?all=true`
  - GET `/api/leave?id={id}`
  - GET `/api/biodata?all=true`
  - GET `/api/biodata?id={id}`
- **Functions:**
  - `loadAllLeaveApplications()` - Fetches all leaves
  - `viewLeaveDetails(id)` - Shows detailed leave view
  - `loadAllBiodata()` - Fetches all biodata
  - `viewBiodataDetails(id)` - Shows detailed biodata view
  - `formatDate()` - Date formatting
  - `calculateDuration()` - Leave duration calculation
- **Lines:** ~200 lines

#### `js/employee-dashboard.js`
- **Purpose:** Employee dashboard functionality
- **Features:**
  - Session validation (redirects if not employee)
  - Tab switching (Leave/Biodata)
  - CRUD operations for leave applications
  - CRUD operations for biodata
  - Form handling (add/edit)
  - Modal management
  - Data table rendering
  - Logout functionality
- **API Endpoints Used:**
  - GET `/api/leave?employee_id={id}`
  - GET `/api/leave?id={id}`
  - POST `/api/leave`
  - PUT `/api/leave/{id}`
  - DELETE `/api/leave/{id}`
  - GET `/api/biodata?employee_id={id}`
  - GET `/api/biodata?id={id}`
  - POST `/api/biodata`
  - PUT `/api/biodata/{id}`
  - DELETE `/api/biodata/{id}`
- **Functions:**
  - `loadLeaveApplications()` - Fetch employee's leaves
  - `editLeave(id)` - Load leave for editing
  - `deleteLeave(id)` - Delete leave application
  - `loadBiodata()` - Fetch employee's biodata
  - `editBiodata(id)` - Load biodata for editing
  - `deleteBiodata(id)` - Delete biodata record
  - `formatDate()` - Date formatting
- **Lines:** ~300 lines

---

### 🖥️ Backend Files

#### `server.js`
- **Purpose:** Node.js + Express backend server
- **Features:**
  - Express web server setup
  - MySQL database connection
  - Automatic database initialization
  - Automatic table creation
  - Default admin user creation
  - RESTful API endpoints
  - Static file serving
  - CORS configuration
  - Error handling
  - Password hashing with bcryptjs
- **Database Operations:**
  - Creates `employee_admin_system` database
  - Creates `users` table
  - Creates `leave_applications` table
  - Creates `biodata` table
  - Inserts default admin user
- **API Routes:**
  
  **Authentication:**
  - `POST /api/signup` - User registration
  - `POST /api/login` - User authentication
  
  **Leave Management:**
  - `GET /api/leave?employee_id={id}` - Get employee's leaves
  - `GET /api/leave?id={id}` - Get single leave
  - `GET /api/leave?all=true` - Get all leaves (admin)
  - `POST /api/leave` - Create leave application
  - `PUT /api/leave/:id` - Update leave application
  - `DELETE /api/leave/:id` - Delete leave application
  
  **Biodata Management:**
  - `GET /api/biodata?employee_id={id}` - Get employee's biodata
  - `GET /api/biodata?id={id}` - Get single biodata
  - `GET /api/biodata?all=true` - Get all biodata (admin)
  - `POST /api/biodata` - Create biodata
  - `PUT /api/biodata/:id` - Update biodata
  - `DELETE /api/biodata/:id` - Delete biodata

- **Port:** 3000
- **Lines:** ~650 lines

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

#### Table: `users`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- username (VARCHAR, UNIQUE)
- password (VARCHAR) - Hashed with bcryptjs
- user_type (ENUM: 'admin', 'employee')
- created_at (TIMESTAMP)
```

#### Table: `leave_applications`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- employee_id (INT, FOREIGN KEY → users.id)
- leave_type (VARCHAR)
- start_date (DATE)
- end_date (DATE)
- reason (TEXT)
- status (ENUM: 'pending', 'approved', 'rejected')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Table: `biodata`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- employee_id (INT, FOREIGN KEY → users.id)
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
| Leave CRUD | `employee-dashboard.js`, `server.js` |
| Biodata CRUD | `employee-dashboard.js`, `server.js` |
| Admin Review | `admin-dashboard.js`, `server.js` |
| Theme Toggle | `theme.js`, `style.css` |
| Database Setup | `server.js` |
| Responsive Design | `style.css` |
| API Endpoints | `server.js` |

---

## Startup Sequence

When you run `npm start`, this happens:

1. **server.js** executes
2. Loads dependencies (express, mysql2, etc.)
3. Connects to MySQL
4. Runs `initializeDatabase()` function:
   - Creates database if not exists
   - Creates tables if not exist
   - Inserts default admin
5. Configures Express middleware
6. Sets up API routes
7. Serves static files (HTML/CSS/JS)
8. Starts listening on port 3000
9. Console logs: "Server is running..."

---

**Total Project Files:** 14 files (excluding node_modules)  
**Total Lines of Code:** ~2,500+ lines  
**Auto-Generated Files:** 1 (package-lock.json)  
**Documentation Files:** 2 (INSTALLATION.md, PROJECT_STRUCTURE.md)
