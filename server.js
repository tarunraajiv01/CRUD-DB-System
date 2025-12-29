// ==================== CONFIGURATION ====================
// Load environment variables from .env file
require('dotenv').config();

console.log('⏳ Loading modules...');

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('📦 Starting Employee-Admin CRUD System...');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

console.log('✅ Middleware configured');

// Email Transporter Configuration
// For development, using Gmail (you can change this to any SMTP service)
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Set via environment variable
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'   // Use App Password for Gmail
    }
});

// Verify email transporter configuration
emailTransporter.verify((error, success) => {
    if (error) {
        console.log('⚠️  Email service not configured properly:', error.message);
        console.log('💡 Set EMAIL_USER and EMAIL_PASSWORD environment variables to enable email verification');
    } else {
        console.log('✅ Email service ready');
    }
});

// MySQL Database Connection (without database first)
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'employee_admin_system',
    port: process.env.MYSQL_PORT || 3306
};

let db;

// Expected schema for validation
const EXPECTED_USERS_COLUMNS = ['id', 'username', 'email', 'phone', 'password', 'user_type', 'email_verified', 'verification_token', 'token_expiry', 'created_at'];

// Function to validate table schema
function validateUsersTableSchema(connection, callback) {
    connection.query('DESCRIBE users', (err, results) => {
        if (err) {
            // Table doesn't exist
            callback(false);
            return;
        }

        const existingColumns = results.map(row => row.Field);
        const hasAllColumns = EXPECTED_USERS_COLUMNS.every(col => existingColumns.includes(col));

        if (!hasAllColumns) {
            console.log('⚠️  Detected outdated database schema');
            console.log('📋 Expected columns:', EXPECTED_USERS_COLUMNS.join(', '));
            console.log('📋 Found columns:', existingColumns.join(', '));
            callback(false);
        } else {
            callback(true);
        }
    });
}

// Function to initialize database and tables
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // First connect without specifying database
        const tempConnection = mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port
        });

        tempConnection.connect((err) => {
            if (err) {
                console.error('❌ MySQL connection failed:', err.message);
                console.log('\n💡 Troubleshooting:');
                console.log('   1. Check if MySQL is running');
                console.log('   2. Update credentials in .env file');
                console.log('   3. Verify MYSQL_PASSWORD matches your MySQL root password\n');
                reject(err);
                return;
            }

            console.log('✅ Connected to MySQL');

            // Check if database exists and validate schema
            tempConnection.query(`SHOW DATABASES LIKE '${dbConfig.database}'`, (err, results) => {
                if (err) {
                    console.error('❌ Failed to check database:', err);
                    reject(err);
                    return;
                }

                const dbExists = results.length > 0;

                if (dbExists) {
                    // Database exists - validate schema
                    tempConnection.changeUser({ database: dbConfig.database }, (err) => {
                        if (err) {
                            console.error('❌ Failed to switch to database:', err);
                            reject(err);
                            return;
                        }

                        validateUsersTableSchema(tempConnection, (isValid) => {
                            if (!isValid) {
                                // Schema is outdated - drop and recreate
                                console.log('🔄 Dropping outdated database and recreating with correct schema...');
                                tempConnection.query(`DROP DATABASE ${dbConfig.database}`, (err) => {
                                    if (err) {
                                        console.error('❌ Failed to drop database:', err);
                                        reject(err);
                                        return;
                                    }
                                    console.log('✅ Old database dropped');
                                    createDatabaseAndTables(tempConnection, resolve, reject);
                                });
                            } else {
                                // Schema is valid - proceed normally
                                console.log('✅ Database ready');
                                proceedWithTableCreation(tempConnection, resolve, reject);
                            }
                        });
                    });
                } else {
                    // Database doesn't exist - create it
                    createDatabaseAndTables(tempConnection, resolve, reject);
                }
            });
        });
    });
}

// Helper function to create database and tables
function createDatabaseAndTables(tempConnection, resolve, reject) {
    tempConnection.query(`CREATE DATABASE ${dbConfig.database}`, (err) => {
        if (err) {
            console.error('❌ Failed to create database:', err);
            reject(err);
            return;
        }

        console.log('✅ Database created');

        tempConnection.changeUser({ database: dbConfig.database }, (err) => {
            if (err) {
                console.error('❌ Failed to switch to database:', err);
                reject(err);
                return;
            }

            proceedWithTableCreation(tempConnection, resolve, reject);
        });
    });
}

// Helper function to create all tables
function proceedWithTableCreation(tempConnection, resolve, reject) {
    // Create tables
                    const createUsersTable = `
                        CREATE TABLE IF NOT EXISTS users (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            username VARCHAR(50) UNIQUE NOT NULL,
                            email VARCHAR(100) UNIQUE,
                            phone VARCHAR(20) UNIQUE,
                            password VARCHAR(255) NOT NULL,
                            user_type ENUM('admin', 'employee') NOT NULL,
                            email_verified BOOLEAN DEFAULT FALSE,
                            verification_token VARCHAR(255),
                            token_expiry DATETIME,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `;

                    const createLeaveTable = `
                        CREATE TABLE IF NOT EXISTS leave_applications (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            employee_id INT NOT NULL,
                            leave_type VARCHAR(50) NOT NULL,
                            start_date DATE NOT NULL,
                            end_date DATE NOT NULL,
                            reason TEXT NOT NULL,
                            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
                        )
                    `;

                    const createBiodataTable = `
                        CREATE TABLE IF NOT EXISTS biodata (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            employee_id INT NOT NULL UNIQUE,
                            full_name VARCHAR(100) NOT NULL,
                            address TEXT NOT NULL,
                            date_of_birth DATE,
                            gender ENUM('male', 'female', 'other') NOT NULL,
                            position VARCHAR(100) NOT NULL,
                            department VARCHAR(100) NOT NULL,
                            joining_date DATE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
                        )
                    `;

                    const createSalariesTable = `
                        CREATE TABLE IF NOT EXISTS salaries (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            employee_id INT NOT NULL,
                            basic_salary DECIMAL(10, 2) NOT NULL,
                            allowances DECIMAL(10, 2) DEFAULT 0,
                            deductions DECIMAL(10, 2) DEFAULT 0,
                            net_salary DECIMAL(10, 2) NOT NULL,
                            payment_date DATE NOT NULL,
                            month VARCHAR(20) NOT NULL,
                            year INT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
                        )
                    `;

                    const createHolidaysTable = `
                        CREATE TABLE IF NOT EXISTS company_holidays (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            holiday_name VARCHAR(100) NOT NULL,
                            holiday_date DATE NOT NULL,
                            description TEXT,
                            year INT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        )
                    `;

                    const createGrievancesTable = `
                        CREATE TABLE IF NOT EXISTS grievances (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            employee_id INT NOT NULL,
                            subject VARCHAR(200) NOT NULL,
                            description TEXT NOT NULL,
                            status ENUM('pending', 'under_review', 'resolved') DEFAULT 'pending',
                            admin_response TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
                        )
                    `;

                    const createResignationsTable = `
                        CREATE TABLE IF NOT EXISTS resignations (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            employee_id INT NOT NULL,
                            reason TEXT NOT NULL,
                            last_working_day DATE NOT NULL,
                            status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                            admin_notes TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
                        )
                    `;

                    const createActivityLogsTable = `
                        CREATE TABLE IF NOT EXISTS activity_logs (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT,
                            username VARCHAR(50),
                            user_type ENUM('admin', 'employee'),
                            action VARCHAR(100) NOT NULL,
                            description TEXT,
                            ip_address VARCHAR(45),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            INDEX idx_user_id (user_id),
                            INDEX idx_action (action),
                            INDEX idx_created_at (created_at),
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                        )
                    `;

                    const createRolesTable = `
                        CREATE TABLE IF NOT EXISTS roles (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            role_name VARCHAR(100) UNIQUE NOT NULL,
                            description TEXT,
                            permissions JSON NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        )
                    `;

                    const createUserRolesTable = `
                        CREATE TABLE IF NOT EXISTS user_roles (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            role_id INT NOT NULL,
                            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            assigned_by INT,
                            UNIQUE KEY unique_user_role (user_id, role_id),
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                            FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
                        )
                    `;

                    // Execute table creation
                    tempConnection.query(createUsersTable, (err) => {
                        if (err) {
                            console.error('❌ Failed to create users table:', err);
                            reject(err);
                            return;
                        }

                        console.log('✅ Users table ready');

                        tempConnection.query(createLeaveTable, (err) => {
                            if (err) {
                                console.error('❌ Failed to create leave_applications table:', err);
                                reject(err);
                                return;
                            }

                            console.log('✅ Leave applications table ready');

                            tempConnection.query(createBiodataTable, async (err) => {
                                if (err) {
                                    console.error('❌ Failed to create biodata table:', err);
                                    reject(err);
                                    return;
                                }

                                console.log('✅ Biodata table ready');

                                tempConnection.query(createSalariesTable, (err) => {
                                    if (err) {
                                        console.error('❌ Failed to create salaries table:', err);
                                        reject(err);
                                        return;
                                    }

                                    console.log('✅ Salaries table ready');

                                    tempConnection.query(createHolidaysTable, (err) => {
                                        if (err) {
                                            console.error('❌ Failed to create holidays table:', err);
                                            reject(err);
                                            return;
                                        }

                                        console.log('✅ Holidays table ready');

                                        tempConnection.query(createGrievancesTable, (err) => {
                                            if (err) {
                                                console.error('❌ Failed to create grievances table:', err);
                                                reject(err);
                                                return;
                                            }

                                            console.log('✅ Grievances table ready');

                                            tempConnection.query(createResignationsTable, async (err) => {
                                                if (err) {
                                                    console.error('❌ Failed to create resignations table:', err);
                                                    reject(err);
                                                    return;
                                                }

                                                console.log('✅ Resignations table ready');

                                                tempConnection.query(createActivityLogsTable, (err) => {
                                                    if (err) {
                                                        console.error('❌ Failed to create activity_logs table:', err);
                                                        reject(err);
                                                        return;
                                                    }

                                                    console.log('✅ Activity logs table ready');

                                                    tempConnection.query(createRolesTable, (err) => {
                                                        if (err) {
                                                            console.error('❌ Failed to create roles table:', err);
                                                            reject(err);
                                                            return;
                                                        }

                                                        console.log('✅ Roles table ready');

                                                        tempConnection.query(createUserRolesTable, (err) => {
                                                            if (err) {
                                                                console.error('❌ Failed to create user_roles table:', err);
                                                                reject(err);
                                                                return;
                                                            }

                                                            console.log('✅ User roles table ready');

                                // Migration: Add email verification columns if they don't exist
                                tempConnection.query(
                                    `SELECT COLUMN_NAME 
                                     FROM INFORMATION_SCHEMA.COLUMNS 
                                     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified'`,
                                    [dbConfig.database],
                                    (err, results) => {
                                        if (err) {
                                            console.log('⚠️ Could not check for email_verified column:', err.message);
                                        } else if (results.length === 0) {
                                            // Column doesn't exist, add it
                                            tempConnection.query(
                                                `ALTER TABLE users 
                                                 ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
                                                 ADD COLUMN verification_token VARCHAR(255),
                                                 ADD COLUMN token_expiry DATETIME`,
                                                (err) => {
                                                    if (err) {
                                                        console.log('⚠️ Failed to add email verification columns:', err.message);
                                                    } else {
                                                        console.log('✅ Email verification columns added');
                                                    }
                                                }
                                            );
                                        } else {
                                            console.log('✅ Email verification columns already exist');
                                        }
                                    }
                                );

                                // Migration: Remove email and phone from biodata table if they exist
                                tempConnection.query(
                                    `SELECT COLUMN_NAME 
                                     FROM INFORMATION_SCHEMA.COLUMNS 
                                     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'biodata' AND COLUMN_NAME IN ('email', 'phone')`,
                                    [dbConfig.database],
                                    (err, results) => {
                                        if (err) {
                                            console.log('⚠️ Could not check biodata columns:', err.message);
                                        } else if (results.length > 0) {
                                            // Columns exist, drop them
                                            const columns = results.map(r => r.COLUMN_NAME);
                                            const dropStatements = columns.map(col => `DROP COLUMN ${col}`).join(', ');
                                            tempConnection.query(
                                                `ALTER TABLE biodata ${dropStatements}`,
                                                (err) => {
                                                    if (err) {
                                                        console.log('⚠️ Failed to remove email/phone from biodata:', err.message);
                                                    } else {
                                                        console.log('✅ Removed duplicate email/phone columns from biodata');
                                                    }
                                                }
                                            );
                                        }
                                    }
                                );

                                // Migration: Add UNIQUE constraint to biodata.employee_id if not exists
                                tempConnection.query(
                                    `SELECT CONSTRAINT_NAME 
                                     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                                     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'biodata' AND CONSTRAINT_TYPE = 'UNIQUE'`,
                                    [dbConfig.database],
                                    (err, results) => {
                                        if (err) {
                                            console.log('⚠️ Could not check biodata constraints:', err.message);
                                        } else if (results.length === 0) {
                                            // No unique constraint, add it
                                            tempConnection.query(
                                                `ALTER TABLE biodata ADD UNIQUE KEY unique_employee (employee_id)`,
                                                (err) => {
                                                    if (err) {
                                                        console.log('⚠️ Failed to add unique constraint to biodata:', err.message);
                                                    } else {
                                                        console.log('✅ Added UNIQUE constraint to biodata.employee_id');
                                                    }
                                                }
                                            );
                                        }
                                    }
                                );

                                // Check if default admin exists, if not create one
                                tempConnection.query('SELECT id FROM users WHERE username = "admin"', async (err, results) => {
                                    if (err) {
                                        console.error('❌ Failed to check for admin user:', err);
                                        // Set the global db connection
                                        db = tempConnection;
                                        resolve();
                                        return;
                                    }
                                    
                                    if (results.length === 0) {
                                        // Create default admin (password: admin123)
                                        const hashedPassword = await bcrypt.hash('admin123', 10);
                                        tempConnection.query(
                                            'INSERT INTO users (username, email, phone, password, user_type, email_verified) VALUES (?, ?, ?, ?, ?, TRUE)',
                                            ['admin', 'admin@system.local', '+1-0000000000', hashedPassword, 'admin'],
                                            (err) => {
                                                if (err) {
                                                    console.error('❌ Failed to create default admin:', err);
                                                } else {
                                                    console.log('✅ Default admin user created (username: admin, password: admin123)');
                                                }
                                                // Set the global db connection
                                                db = tempConnection;
                                                resolve();
                                            }
                                        );
                                    } else {
                                        console.log('✅ Admin user already exists');
                                        // Update existing admin to be verified if not already
                                        tempConnection.query(
                                            'UPDATE users SET email_verified = TRUE WHERE username = "admin" AND email_verified = FALSE',
                                            (err) => {
                                                if (err) {
                                                    console.log('⚠️ Could not update admin verification status');
                                                }
                                                // Set the global db connection
                                                db = tempConnection;
                                                resolve();
                                            }
                                        );
                                    }
                                });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

// ==================== Initialize Default Roles ====================

async function initializeDefaultRoles() {
    if (!db) return;

    const defaultRoles = [
        {
            role_name: 'Super Admin',
            description: 'Full system access with all permissions',
            permissions: {
                view_employees: true,
                manage_employees: true,
                view_leave: true,
                approve_leave: true,
                view_salaries: true,
                manage_salaries: true,
                view_grievances: true,
                manage_grievances: true,
                view_holidays: true,
                manage_holidays: true,
                view_resignations: true,
                manage_resignations: true,
                view_activity_logs: true,
                manage_roles: true
            }
        },
        {
            role_name: 'HR Manager',
            description: 'Human Resources management with employee, leave, and salary permissions',
            permissions: {
                view_employees: true,
                manage_employees: true,
                view_leave: true,
                approve_leave: true,
                view_salaries: true,
                manage_salaries: true,
                view_grievances: true,
                manage_grievances: true,
                view_holidays: true,
                manage_holidays: false,
                view_resignations: true,
                manage_resignations: true,
                view_activity_logs: true,
                manage_roles: false
            }
        },
        {
            role_name: 'Department Manager',
            description: 'Department-level management with view and approval permissions',
            permissions: {
                view_employees: true,
                manage_employees: false,
                view_leave: true,
                approve_leave: true,
                view_salaries: false,
                manage_salaries: false,
                view_grievances: true,
                manage_grievances: false,
                view_holidays: true,
                manage_holidays: false,
                view_resignations: true,
                manage_resignations: false,
                view_activity_logs: false,
                manage_roles: false
            }
        },
        {
            role_name: 'Employee',
            description: 'Basic employee access with view-only permissions',
            permissions: {
                view_employees: false,
                manage_employees: false,
                view_leave: true,
                approve_leave: false,
                view_salaries: false,
                manage_salaries: false,
                view_grievances: false,
                manage_grievances: false,
                view_holidays: true,
                manage_holidays: false,
                view_resignations: false,
                manage_resignations: false,
                view_activity_logs: false,
                manage_roles: false
            }
        }
    ];

    for (const role of defaultRoles) {
        try {
            // Check if role exists
            const results = await new Promise((resolve, reject) => {
                db.query('SELECT id FROM roles WHERE role_name = ?', [role.role_name], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            if (results.length === 0) {
                // Create role
                await new Promise((resolve, reject) => {
                    db.query(
                        'INSERT INTO roles (role_name, description, permissions) VALUES (?, ?, ?)',
                        [role.role_name, role.description, JSON.stringify(role.permissions)],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
                console.log(`✅ Created default role: ${role.role_name}`);
            }
        } catch (error) {
            console.error(`⚠️ Error creating role ${role.role_name}:`, error.message);
        }
    }
}

// ==================== Activity Logging Utility ====================

// Log user activity
function logActivity(user_id, username, user_type, action, description, ip_address) {
    if (!db) return; // Database not ready yet
    
    db.query(
        'INSERT INTO activity_logs (user_id, username, user_type, action, description, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, username, user_type, action, description, ip_address],
        (err) => {
            if (err) {
                console.error('Failed to log activity:', err);
            }
        }
    );
}

// ==================== Authentication Routes ====================

// Signup Route
app.post('/api/signup', async (req, res) => {
    const { username, email, phone, password, user_type } = req.body;
    
    // Validate input
    if (!username || !email || !phone || !password || !user_type) {
        return res.json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.json({
            success: false,
            message: 'Invalid email format'
        });
    }
    
    // Validate phone format (at least 10 digits)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
        return res.json({
            success: false,
            message: 'Invalid phone number. Must contain at least 10 digits'
        });
    }
    
    // Check if username, email, or phone already exists
    db.query(
        'SELECT id, username, email, phone FROM users WHERE username = ? OR email = ? OR phone = ?',
        [username, email, phone],
        async (err, results) => {
            if (err) {
                console.error('❌ Signup error - checking existing user:', err);
                return res.json({
                    success: false,
                    message: 'Database error: ' + err.message
                });
            }
            
            if (results.length > 0) {
                const existing = results[0];
                if (existing.username === username) {
                    return res.json({
                        success: false,
                        message: 'Username already exists'
                    });
                }
                if (existing.email === email) {
                    return res.json({
                        success: false,
                        message: 'Email already registered'
                    });
                }
                if (existing.phone === phone) {
                    return res.json({
                        success: false,
                        message: 'Phone number already registered'
                    });
                }
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Generate verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
            
            // Insert new user
            db.query(
                'INSERT INTO users (username, email, phone, password, user_type, verification_token, token_expiry) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [username, email, phone, hashedPassword, user_type, verificationToken, tokenExpiry],
                async (err, result) => {
                    if (err) {
                        console.error('❌ Signup error - inserting user:', err);
                        return res.json({
                            success: false,
                            message: 'Registration failed: ' + err.message
                        });
                    }
                    
                    const newUserId = result.insertId;
                    
                    // Create placeholder biodata entry for the new user
                    db.query(
                        `INSERT INTO biodata (employee_id, full_name, address, gender, position, department) 
                         VALUES (?, ?, '', 'male', '', '')`,
                        [newUserId, username], // Use username as initial full_name
                        (biodataErr) => {
                            if (biodataErr) {
                                console.error('Warning: Could not create biodata placeholder:', biodataErr);
                            }
                        }
                    );
                    
                    // Send verification email
                    const verificationLink = `http://localhost:3000/verify-email.html?token=${verificationToken}`;
                    const mailOptions = {
                        from: process.env.EMAIL_USER || 'noreply@yourdomain.com',
                        to: email,
                        subject: 'Email Verification - Employee Management System',
                        html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <style>
                                    body {
                                        font-family: Arial, sans-serif;
                                        line-height: 1.6;
                                        color: #333;
                                    }
                                    .container {
                                        max-width: 600px;
                                        margin: 0 auto;
                                        padding: 20px;
                                        background-color: #f9f9f9;
                                        border-radius: 10px;
                                    }
                                    .header {
                                        background-color: #4CAF50;
                                        color: white;
                                        padding: 20px;
                                        text-align: center;
                                        border-radius: 10px 10px 0 0;
                                    }
                                    .content {
                                        background-color: white;
                                        padding: 30px;
                                        border-radius: 0 0 10px 10px;
                                    }
                                    .button {
                                        display: inline-block;
                                        padding: 12px 30px;
                                        background-color: #4CAF50;
                                        color: white;
                                        text-decoration: none;
                                        border-radius: 5px;
                                        margin: 20px 0;
                                    }
                                    .footer {
                                        text-align: center;
                                        margin-top: 20px;
                                        font-size: 12px;
                                        color: #666;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h1>Welcome to Employee Management System!</h1>
                                    </div>
                                    <div class="content">
                                        <h2>Hi ${username},</h2>
                                        <p>Thank you for registering! Please verify your email address to complete your registration.</p>
                                        <p>Click the button below to verify your email:</p>
                                        <center>
                                            <a href="${verificationLink}" class="button">Verify Email</a>
                                        </center>
                                        <p>Or copy and paste this link in your browser:</p>
                                        <p style="word-break: break-all; color: #4CAF50;">${verificationLink}</p>
                                        <p><strong>Note:</strong> This link will expire in 24 hours.</p>
                                        <p>If you didn't create this account, please ignore this email.</p>
                                    </div>
                                    <div class="footer">
                                        <p>&copy; 2024 Employee Management System. All rights reserved.</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `
                    };
                    
                    try {
                        await emailTransporter.sendMail(mailOptions);
                        
                        // Log signup activity
                        logActivity(result.insertId, username, user_type, 'SIGNUP', `New ${user_type} account created: ${email}`, req.ip);
                        
                        res.json({
                            success: true,
                            message: 'Registration successful! Please check your email to verify your account.',
                            requiresVerification: true
                        });
                    } catch (emailError) {
                        console.error('Failed to send verification email:', emailError);
                        
                        // Log signup activity even if email failed
                        logActivity(result.insertId, username, user_type, 'SIGNUP', `New ${user_type} account created: ${email} (email send failed)`, req.ip);
                        
                        // Registration succeeded but email failed
                        res.json({
                            success: true,
                            message: 'Registration successful! However, we could not send the verification email. Please contact support.',
                            requiresVerification: true
                        });
                    }
                }
            );
        }
    );
});

// Email Verification Route
app.get('/api/verify-email', (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        return res.json({
            success: false,
            message: 'Verification token is required'
        });
    }
    
    // Find user with this token
    db.query(
        'SELECT id, email, email_verified, token_expiry FROM users WHERE verification_token = ?',
        [token],
        (err, results) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Database error'
                });
            }
            
            if (results.length === 0) {
                return res.json({
                    success: false,
                    message: 'Invalid or expired verification token'
                });
            }
            
            const user = results[0];
            
            // Check if already verified
            if (user.email_verified) {
                return res.json({
                    success: true,
                    message: 'Email already verified',
                    alreadyVerified: true
                });
            }
            
            // Check if token is expired
            const now = new Date();
            const expiry = new Date(user.token_expiry);
            
            if (now > expiry) {
                return res.json({
                    success: false,
                    message: 'Verification token has expired. Please request a new one.',
                    expired: true
                });
            }
            
            // Update user as verified
            db.query(
                'UPDATE users SET email_verified = TRUE, verification_token = NULL, token_expiry = NULL WHERE id = ?',
                [user.id],
                (err) => {
                    if (err) {
                        return res.json({
                            success: false,
                            message: 'Failed to verify email'
                        });
                    }
                    
                    // Log email verification
                    db.query('SELECT username, user_type FROM users WHERE id = ?', [user.id], (err, userResults) => {
                        if (!err && userResults.length > 0) {
                            logActivity(user.id, userResults[0].username, userResults[0].user_type, 'EMAIL_VERIFIED', `Email verified: ${user.email}`, req.ip);
                        }
                    });
                    
                    res.json({
                        success: true,
                        message: 'Email verified successfully! You can now log in.'
                    });
                }
            );
        }
    );
});

// Resend Verification Email Route
app.post('/api/resend-verification', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.json({
            success: false,
            message: 'Email is required'
        });
    }
    
    // Find user by email
    db.query(
        'SELECT id, username, email, email_verified FROM users WHERE email = ?',
        [email],
        async (err, results) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Database error'
                });
            }
            
            if (results.length === 0) {
                return res.json({
                    success: false,
                    message: 'No account found with this email'
                });
            }
            
            const user = results[0];
            
            // Check if already verified
            if (user.email_verified) {
                return res.json({
                    success: false,
                    message: 'Email is already verified'
                });
            }
            
            // Generate new verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
            
            // Update token in database
            db.query(
                'UPDATE users SET verification_token = ?, token_expiry = ? WHERE id = ?',
                [verificationToken, tokenExpiry, user.id],
                async (err) => {
                    if (err) {
                        return res.json({
                            success: false,
                            message: 'Failed to generate new token'
                        });
                    }
                    
                    // Send verification email
                    const verificationLink = `http://localhost:3000/verify-email.html?token=${verificationToken}`;
                    const mailOptions = {
                        from: process.env.EMAIL_USER || 'noreply@yourdomain.com',
                        to: email,
                        subject: 'Email Verification - Employee Management System',
                        html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <style>
                                    body {
                                        font-family: Arial, sans-serif;
                                        line-height: 1.6;
                                        color: #333;
                                    }
                                    .container {
                                        max-width: 600px;
                                        margin: 0 auto;
                                        padding: 20px;
                                        background-color: #f9f9f9;
                                        border-radius: 10px;
                                    }
                                    .header {
                                        background-color: #4CAF50;
                                        color: white;
                                        padding: 20px;
                                        text-align: center;
                                        border-radius: 10px 10px 0 0;
                                    }
                                    .content {
                                        background-color: white;
                                        padding: 30px;
                                        border-radius: 0 0 10px 10px;
                                    }
                                    .button {
                                        display: inline-block;
                                        padding: 12px 30px;
                                        background-color: #4CAF50;
                                        color: white;
                                        text-decoration: none;
                                        border-radius: 5px;
                                        margin: 20px 0;
                                    }
                                    .footer {
                                        text-align: center;
                                        margin-top: 20px;
                                        font-size: 12px;
                                        color: #666;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h1>Email Verification</h1>
                                    </div>
                                    <div class="content">
                                        <h2>Hi ${user.username},</h2>
                                        <p>You requested a new verification email. Please verify your email address by clicking the button below:</p>
                                        <center>
                                            <a href="${verificationLink}" class="button">Verify Email</a>
                                        </center>
                                        <p>Or copy and paste this link in your browser:</p>
                                        <p style="word-break: break-all; color: #4CAF50;">${verificationLink}</p>
                                        <p><strong>Note:</strong> This link will expire in 24 hours.</p>
                                        <p>If you didn't request this email, please ignore it.</p>
                                    </div>
                                    <div class="footer">
                                        <p>&copy; 2024 Employee Management System. All rights reserved.</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `
                    };
                    
                    try {
                        await emailTransporter.sendMail(mailOptions);
                        res.json({
                            success: true,
                            message: 'Verification email sent! Please check your inbox.'
                        });
                    } catch (emailError) {
                        console.error('Failed to send verification email:', emailError);
                        res.json({
                            success: false,
                            message: 'Failed to send verification email. Please try again later.'
                        });
                    }
                }
            );
        }
    );
});

// Login Route
app.post('/api/login', (req, res) => {
    const { username, password, user_type } = req.body;
    
    // Validate input
    if (!username || !password || !user_type) {
        return res.json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    // Check if input is email or username
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(username);
    
    // Query user by email or username
    const query = isEmail 
        ? 'SELECT id, username, email, password, user_type, email_verified FROM users WHERE email = ? AND user_type = ?'
        : 'SELECT id, username, email, password, user_type, email_verified FROM users WHERE username = ? AND user_type = ?';
    
    db.query(
        query,
        [username, user_type],
        async (err, results) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Database error'
                });
            }
            
            if (results.length === 0) {
                return res.json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            const user = results[0];
            
            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                // Log failed login attempt
                logActivity(user.id, user.username, user.user_type, 'LOGIN_FAILED', `Failed login attempt for ${isEmail ? 'email' : 'username'}: ${username}`, req.ip);
                
                return res.json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // Check email verification
            if (!user.email_verified) {
                return res.json({
                    success: false,
                    message: 'Please verify your email before logging in. Check your inbox for the verification link.',
                    requiresVerification: true,
                    email: user.email
                });
            }
            
            // Log successful login
            logActivity(user.id, user.username, user.user_type, 'LOGIN', `${user.user_type} logged in successfully`, req.ip);
            
            // Remove password from response
            delete user.password;
            
            res.json({
                success: true,
                message: 'Login successful',
                user: user
            });
        }
    );
});

// ==================== Leave Management Routes ====================

// Get Leave Applications
app.get('/api/leave', (req, res) => {
    const { id, employee_id, all } = req.query;
    
    // Log read operation
    if (req.query.current_user_id) {
        logActivity(
            req.query.current_user_id,
            req.query.current_username || 'Unknown',
            req.query.current_user_type || 'unknown',
            'READ',
            id ? `Viewed leave application ID ${id}` : employee_id ? `Viewed leave applications for employee ID ${employee_id}` : 'Viewed all leave applications',
            req.ip
        );
    }
    
    if (id) {
        // Get single leave application
        db.query(
            `SELECT l.*, u.username, u.email, b.full_name, b.position, b.department
             FROM leave_applications l 
             JOIN users u ON l.employee_id = u.id
             LEFT JOIN biodata b ON u.id = b.employee_id
             WHERE l.id = ?`,
            [id],
            (err, results) => {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Database error'
                    });
                }
                
                if (results.length > 0) {
                    res.json({
                        success: true,
                        data: results[0]
                    });
                } else {
                    res.json({
                        success: false,
                        message: 'Leave application not found'
                    });
                }
            }
        );
    } else if (employee_id) {
        // Get leave applications for specific employee
        db.query(
            `SELECT l.*, u.username, u.email, b.full_name, b.position, b.department
             FROM leave_applications l 
             JOIN users u ON l.employee_id = u.id
             LEFT JOIN biodata b ON u.id = b.employee_id
             WHERE l.employee_id = ? 
             ORDER BY l.created_at DESC`,
            [employee_id],
            (err, results) => {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Database error'
                    });
                }
                
                res.json({
                    success: true,
                    data: results
                });
            }
        );
    } else if (all) {
        // Get all leave applications (for admin)
        db.query(
            `SELECT l.*, u.username, u.email, b.full_name, b.position, b.department
             FROM leave_applications l 
             JOIN users u ON l.employee_id = u.id
             LEFT JOIN biodata b ON u.id = b.employee_id
             ORDER BY l.created_at DESC`,
            (err, results) => {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Database error'
                    });
                }
                
                res.json({
                    success: true,
                    data: results
                });
            }
        );
    }
});

// Create Leave Application
app.post('/api/leave', (req, res) => {
    const { employee_id, leave_type, start_date, end_date, reason, current_user_id, current_username, current_user_type } = req.body;
    
    if (!employee_id || !leave_type || !start_date || !end_date || !reason) {
        return res.json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    // Validate date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (endDate < startDate) {
        return res.json({
            success: false,
            message: 'End date cannot be before start date'
        });
    }
    
    db.query(
        'INSERT INTO leave_applications (employee_id, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
        [employee_id, leave_type, start_date, end_date, reason],
        (err, result) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to submit leave application'
                });
            }
            
            // Log activity
            logActivity(
                current_user_id || employee_id,
                current_username || 'Unknown',
                current_user_type || 'employee',
                'LEAVE_CREATED',
                `Created leave application: ${leave_type} from ${start_date} to ${end_date}`,
                req.ip
            );
            
            res.json({
                success: true,
                message: 'Leave application submitted successfully',
                id: result.insertId
            });
        }
    );
});

// Update Leave Application
app.put('/api/leave/:id', (req, res) => {
    const { id } = req.params;
    const { leave_type, start_date, end_date, reason, current_user_id, current_username, current_user_type } = req.body;
    
    if (!leave_type || !start_date || !end_date || !reason) {
        return res.json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    db.query(
        'UPDATE leave_applications SET leave_type = ?, start_date = ?, end_date = ?, reason = ? WHERE id = ?',
        [leave_type, start_date, end_date, reason, id],
        (err, result) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to update leave application'
                });
            }
            
            // Log activity
            logActivity(
                current_user_id,
                current_username || 'Unknown',
                current_user_type || 'employee',
                'LEAVE_UPDATED',
                `Updated leave application #${id}: ${leave_type}`,
                req.ip
            );
            
            res.json({
                success: true,
                message: 'Leave application updated successfully'
            });
        }
    );
});

// Delete Leave Application
app.delete('/api/leave/:id', (req, res) => {
    const { id } = req.params;
    const { current_user_id, current_username, current_user_type } = req.query;
    
    db.query('DELETE FROM leave_applications WHERE id = ?', [id], (err, result) => {
        if (err) {
            return res.json({
                success: false,
                message: 'Failed to delete leave application'
            });
        }
        
        // Log activity
        logActivity(
            current_user_id,
            current_username || 'Unknown',
            current_user_type || 'employee',
            'LEAVE_DELETED',
            `Deleted leave application #${id}`,
            req.ip
        );
        
        res.json({
            success: true,
            message: 'Leave application deleted successfully'
        });
    });
});

// Update Leave Status (Approve/Decline) - Admin Only
app.patch('/api/leave/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.json({
            success: false,
            message: 'Invalid status. Must be approved, rejected, or pending'
        });
    }
    
    db.query(
        'UPDATE leave_applications SET status = ? WHERE id = ?',
        [status, id],
        (err, result) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to update leave status'
                });
            }
            
            res.json({
                success: true,
                message: `Leave ${status} successfully`
            });
        }
    );
});

// ==================== Biodata Management Routes ====================

// Get Biodata
app.get('/api/biodata', (req, res) => {
    const { id, employee_id, all } = req.query;
    
    // Log read operation
    if (req.query.current_user_id) {
        logActivity(
            req.query.current_user_id,
            req.query.current_username || 'Unknown',
            req.query.current_user_type || 'unknown',
            'READ',
            id ? `Viewed biodata ID ${id}` : employee_id ? `Viewed biodata for employee ID ${employee_id}` : 'Viewed all biodata records',
            req.ip
        );
    }
    
    if (id) {
        // Get single biodata
        db.query(
            `SELECT b.*, u.username, u.email, u.phone
             FROM biodata b 
             JOIN users u ON b.employee_id = u.id 
             WHERE b.id = ?`,
            [id],
            (err, results) => {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Database error'
                    });
                }
                
                if (results.length > 0) {
                    res.json({
                        success: true,
                        data: results[0]
                    });
                } else {
                    res.json({
                        success: false,
                        message: 'Biodata not found'
                    });
                }
            }
        );
    } else if (employee_id) {
        // Get biodata for specific employee (returns user data even if biodata doesn't exist)
        db.query(
            `SELECT u.id as employee_id, u.username, u.email, u.phone, u.created_at as user_created_at,
                    b.id, b.full_name, b.address, b.date_of_birth, b.gender, 
                    b.position, b.department, b.joining_date, b.created_at, b.updated_at
             FROM users u
             LEFT JOIN biodata b ON u.id = b.employee_id
             WHERE u.id = ? AND u.user_type = 'employee'`,
            [employee_id],
            (err, results) => {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Database error'
                    });
                }
                
                res.json({
                    success: true,
                    data: results[0] || null
                });
            }
        );
    } else if (all) {
        // Get all employees with their biodata (for admin)
        db.query(
            `SELECT u.id as employee_id, u.username, u.email, u.phone, u.created_at as user_created_at,
                    b.id as biodata_id, b.full_name, b.address, b.date_of_birth, b.gender, 
                    b.position, b.department, b.joining_date
             FROM users u
             LEFT JOIN biodata b ON u.id = b.employee_id
             WHERE u.user_type = 'employee'
             ORDER BY u.created_at DESC`,
            (err, results) => {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Database error'
                    });
                }
                
                res.json({
                    success: true,
                    data: results
                });
            }
        );
    } else {
        res.json({
            success: false,
            message: 'Missing query parameters'
        });
    }
});

// Create or Update Biodata (Upsert)
app.post('/api/biodata', (req, res) => {
    const { 
        employee_id, full_name, address, 
        date_of_birth, gender, position, department, joining_date,
        current_user_id, current_username, current_user_type
    } = req.body;
    
    if (!employee_id) {
        return res.json({
            success: false,
            message: 'Employee ID is required'
        });
    }
    
    // Check if biodata already exists for this employee
    db.query(
        'SELECT id FROM biodata WHERE employee_id = ?',
        [employee_id],
        (err, results) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Database error'
                });
            }
            
            if (results.length > 0) {
                // Update existing biodata
                const biodataId = results[0].id;
                const updates = [];
                const values = [];
                
                if (full_name !== undefined) { updates.push('full_name = ?'); values.push(full_name); }
                if (address !== undefined) { updates.push('address = ?'); values.push(address); }
                if (date_of_birth !== undefined) { updates.push('date_of_birth = ?'); values.push(date_of_birth || null); }
                if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
                if (position !== undefined) { updates.push('position = ?'); values.push(position); }
                if (department !== undefined) { updates.push('department = ?'); values.push(department); }
                if (joining_date !== undefined) { updates.push('joining_date = ?'); values.push(joining_date || null); }
                
                if (updates.length === 0) {
                    return res.json({
                        success: false,
                        message: 'No fields to update'
                    });
                }
                
                values.push(biodataId);
                
                db.query(
                    `UPDATE biodata SET ${updates.join(', ')} WHERE id = ?`,
                    values,
                    (err) => {
                        if (err) {
                            console.error('Error updating biodata:', err);
                            return res.json({
                                success: false,
                                message: 'Failed to update biodata'
                            });
                        }
                        
                        // Log activity
                        logActivity(
                            current_user_id || employee_id,
                            current_username || 'Unknown',
                            current_user_type || 'employee',
                            'BIODATA_UPDATED',
                            `Updated biodata for employee #${employee_id}`,
                            req.ip
                        );
                        
                        res.json({
                            success: true,
                            message: 'Biodata updated successfully',
                            id: biodataId
                        });
                    }
                );
            } else {
                // Insert new biodata
                db.query(
                    `INSERT INTO biodata 
                     (employee_id, full_name, address, date_of_birth, gender, position, department, joining_date) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [employee_id, full_name, address, date_of_birth || null, gender, position, department, joining_date || null],
                    (err, result) => {
                        if (err) {
                            console.error('Error adding biodata:', err);
                            return res.json({
                                success: false,
                                message: 'Failed to add biodata'
                            });
                        }
                        
                        // Log activity
                        logActivity(
                            current_user_id || employee_id,
                            current_username || 'Unknown',
                            current_user_type || 'employee',
                            'BIODATA_CREATED',
                            `Created biodata for employee #${employee_id}`,
                            req.ip
                        );
                        
                        res.json({
                            success: true,
                            message: 'Biodata added successfully',
                            id: result.insertId
                        });
                    }
                );
            }
        }
    );
});

// Update Biodata
app.put('/api/biodata/:id', (req, res) => {
    const { id } = req.params;
    const { 
        full_name, address, 
        date_of_birth, gender, position, department, joining_date,
        current_user_id, current_username, current_user_type
    } = req.body;
    
    const updates = [];
    const values = [];
    
    if (full_name !== undefined) { updates.push('full_name = ?'); values.push(full_name); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }
    if (date_of_birth !== undefined) { updates.push('date_of_birth = ?'); values.push(date_of_birth || null); }
    if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
    if (position !== undefined) { updates.push('position = ?'); values.push(position); }
    if (department !== undefined) { updates.push('department = ?'); values.push(department); }
    if (joining_date !== undefined) { updates.push('joining_date = ?'); values.push(joining_date || null); }
    
    if (updates.length === 0) {
        return res.json({
            success: false,
            message: 'No fields to update'
        });
    }
    
    values.push(id);
    
    db.query(
        `UPDATE biodata SET ${updates.join(', ')} WHERE id = ?`,
        values,
        (err, result) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to update biodata'
                });
            }
            
            // Log activity
            logActivity(
                current_user_id,
                current_username || 'Unknown',
                current_user_type || 'employee',
                'BIODATA_UPDATED',
                `Updated biodata record #${id}`,
                req.ip
            );
            
            res.json({
                success: true,
                message: 'Biodata updated successfully'
            });
        }
    );
});

// Delete Biodata
app.delete('/api/biodata/:id', (req, res) => {
    const { id } = req.params;
    const { current_user_id, current_username, current_user_type } = req.query;
    
    db.query('DELETE FROM biodata WHERE id = ?', [id], (err, result) => {
        if (err) {
            return res.json({
                success: false,
                message: 'Failed to delete biodata'
            });
        }
        
        // Log activity
        logActivity(
            current_user_id,
            current_username || 'Unknown',
            current_user_type || 'admin',
            'BIODATA_DELETED',
            `Deleted biodata record #${id}`,
            req.ip
        );
        
        res.json({
            success: true,
            message: 'Biodata deleted successfully'
        });
    });
});

// ==================== SALARY ROUTES ====================

// Get all salaries (Admin)
app.get('/api/salaries', (req, res) => {
    // Log read operation
    if (req.query.current_user_id) {
        logActivity(
            req.query.current_user_id,
            req.query.current_username || 'Unknown',
            req.query.current_user_type || 'unknown',
            'READ',
            'Viewed all salary records',
            req.ip
        );
    }
    
    const query = `
        SELECT s.*, u.username, u.email, b.full_name, b.position, b.department
        FROM salaries s
        JOIN users u ON s.employee_id = u.id
        LEFT JOIN biodata b ON u.id = b.employee_id
        ORDER BY s.payment_date DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching salaries:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, salaries: results });
    });
});

// Get salary for specific employee
app.get('/api/salaries/employee/:employeeId', (req, res) => {
    const { employeeId } = req.params;
    
    // Log the read operation
    const userId = req.query.current_user_id || null;
    const username = req.query.current_username || 'System';
    const userType = req.query.current_user_type || 'unknown';
    
    if (userId) {
        logActivity(
            userId,
            username,
            userType,
            'READ',
            `Viewed salary records for employee ID ${employeeId}`,
            req.ip
        );
    }
    
    const query = `
        SELECT s.*, u.username, u.email, b.full_name, b.position, b.department
        FROM salaries s
        JOIN users u ON s.employee_id = u.id
        LEFT JOIN biodata b ON u.id = b.employee_id
        WHERE s.employee_id = ?
        ORDER BY s.payment_date DESC
    `;
    
    db.query(query, [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching employee salaries:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, salaries: results });
    });
});

// Add salary record (Admin)
app.post('/api/salaries', (req, res) => {
    const { employee_id, basic_salary, allowances, deductions, month, year, current_user_id, current_username, current_user_type } = req.body;
    
    if (!employee_id || !basic_salary || !month || !year) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });  
    }
    
    // Validate positive numbers
    const basicSal = parseFloat(basic_salary);
    const allow = parseFloat(allowances) || 0;
    const deduc = parseFloat(deductions) || 0;
    
    if (basicSal < 0) {
        return res.status(400).json({ success: false, message: 'Basic salary cannot be negative' });
    }
    if (allow < 0) {
        return res.status(400).json({ success: false, message: 'Allowances cannot be negative' });
    }
    if (deduc < 0) {
        return res.status(400).json({ success: false, message: 'Deductions cannot be negative' });
    }
    
    const net_salary = basicSal + allow - deduc;
    const payment_date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const query = `
        INSERT INTO salaries (employee_id, basic_salary, allowances, deductions, net_salary, month, year, payment_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [employee_id, basicSal, allow, deduc, net_salary, month, year, payment_date], (err, result) => {
        if (err) {
            console.error('Error adding salary:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id || employee_id,
            current_username || 'Unknown',
            current_user_type || 'admin',
            'SALARY_CREATED',
            `Created salary record for employee #${employee_id}: ${month}/${year}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Salary record added successfully', id: result.insertId, salary: { net_salary } });
    });
});

// Update salary record (Admin)
app.put('/api/salaries/:id', (req, res) => {
    const { id } = req.params;
    const { basic_salary, allowances, deductions, month, year, current_user_id, current_username, current_user_type } = req.body;
    
    if (!basic_salary || !month || !year) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const net_salary = parseFloat(basic_salary) + parseFloat(allowances || 0) - parseFloat(deductions || 0);
    
    const query = `
        UPDATE salaries
        SET basic_salary = ?, allowances = ?, deductions = ?, net_salary = ?, month = ?, year = ?
        WHERE id = ?
    `;
    
    db.query(query, [basic_salary, allowances || 0, deductions || 0, net_salary, month, year, id], (err) => {
        if (err) {
            console.error('Error updating salary:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id,
            current_username || 'Unknown',
            current_user_type || 'admin',
            'SALARY_UPDATED',
            `Updated salary record #${id} for ${month}/${year}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Salary record updated successfully' });
    });
});

// Delete salary record (Admin)
app.delete('/api/salaries/:id', (req, res) => {
    const { id } = req.params;
    const { current_user_id, current_username, current_user_type } = req.query;
    
    db.query('DELETE FROM salaries WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting salary:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id,
            current_username || 'Unknown',
            current_user_type || 'admin',
            'SALARY_DELETED',
            `Deleted salary record #${id}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Salary record deleted successfully' });
    });
});

// ==================== HOLIDAYS ROUTES ====================

// Get all holidays
app.get('/api/holidays', (req, res) => {
    const query = 'SELECT * FROM company_holidays ORDER BY holiday_date DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching holidays:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, holidays: results });
    });
});

// Get holidays for specific year
app.get('/api/holidays/year/:year', (req, res) => {
    const { year } = req.params;
    
    const query = 'SELECT * FROM company_holidays WHERE year = ? ORDER BY holiday_date';
    
    db.query(query, [year], (err, results) => {
        if (err) {
            console.error('Error fetching holidays:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, holidays: results });
    });
});

// Add holiday (Admin)
app.post('/api/holidays', (req, res) => {
    const { holiday_name, holiday_date, description, year, current_user_id, current_username, current_user_type } = req.body;
    
    if (!holiday_name || !holiday_date || !year) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const query = `
        INSERT INTO company_holidays (holiday_name, holiday_date, description, year)
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(query, [holiday_name, holiday_date, description || '', year], (err, result) => {
        if (err) {
            console.error('Error adding holiday:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id,
            current_username || 'Unknown',
            current_user_type || 'admin',
            'HOLIDAY_CREATED',
            `Created holiday: ${holiday_name} on ${holiday_date}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Holiday added successfully', id: result.insertId });
    });
});

// Update holiday (Admin)
app.put('/api/holidays/:id', (req, res) => {
    const { id } = req.params;
    const { holiday_name, holiday_date, description, year, current_user_id, current_username, current_user_type } = req.body;
    
    if (!holiday_name || !holiday_date || !year) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const query = `
        UPDATE company_holidays
        SET holiday_name = ?, holiday_date = ?, description = ?, year = ?
        WHERE id = ?
    `;
    
    db.query(query, [holiday_name, holiday_date, description || '', year, id], (err) => {
        if (err) {
            console.error('Error updating holiday:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id,
            current_username || 'Unknown',
            current_user_type || 'admin',
            'HOLIDAY_UPDATED',
            `Updated holiday #${id}: ${holiday_name}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Holiday updated successfully' });
    });
});

// Delete holiday (Admin)
app.delete('/api/holidays/:id', (req, res) => {
    const { id } = req.params;
    const { current_user_id, current_username, current_user_type } = req.query;
    
    db.query('DELETE FROM company_holidays WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting holiday:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id,
            current_username || 'Unknown',
            current_user_type || 'admin',
            'HOLIDAY_DELETED',
            `Deleted holiday #${id}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Holiday deleted successfully' });
    });
});

// ==================== GRIEVANCES ROUTES ====================

// Get all grievances (Admin)
app.get('/api/grievances', (req, res) => {
    const query = `
        SELECT g.*, u.username, u.email, b.full_name, b.position, b.department
        FROM grievances g
        JOIN users u ON g.employee_id = u.id
        LEFT JOIN biodata b ON u.id = b.employee_id
        ORDER BY g.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching grievances:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, grievances: results });
    });
});

// Get grievances for specific employee
app.get('/api/grievances/employee/:employeeId', (req, res) => {
    const { employeeId } = req.params;
    
    const query = `
        SELECT g.*, u.username, u.email, b.full_name, b.position, b.department
        FROM grievances g
        JOIN users u ON g.employee_id = u.id
        LEFT JOIN biodata b ON u.id = b.employee_id
        WHERE g.employee_id = ?
        ORDER BY g.created_at DESC
    `;
    
    db.query(query, [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching employee grievances:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, grievances: results });
    });
});

// Submit grievance (Employee)
app.post('/api/grievances', (req, res) => {
    const { employee_id, subject, description, current_user_id, current_username, current_user_type } = req.body;
    
    if (!employee_id || !subject || !description) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const query = `
        INSERT INTO grievances (employee_id, subject, description, status)
        VALUES (?, ?, ?, 'pending')
    `;
    
    db.query(query, [employee_id, subject, description], (err, result) => {
        if (err) {
            console.error('Error submitting grievance:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id || employee_id,
            current_username || 'Unknown',
            current_user_type || 'employee',
            'GRIEVANCE_CREATED',
            `Submitted grievance: ${subject}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Grievance submitted successfully', id: result.insertId });
    });
});

// Update grievance status (Admin)
app.patch('/api/grievances/:id', (req, res) => {
    const { id } = req.params;
    const { status, admin_response, current_user_id, current_username, current_user_type } = req.body;
    
    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
    }
    
    const query = `
        UPDATE grievances
        SET status = ?, admin_response = ?, updated_at = NOW()
        WHERE id = ?
    `;
    
    db.query(query, [status, admin_response || '', id], (err) => {
        if (err) {
            console.error('Error updating grievance:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id,
            current_username || 'Unknown',
            current_user_type || 'admin',
            'GRIEVANCE_UPDATED',
            `Updated grievance #${id} status to: ${status}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Grievance updated successfully' });
    });
});

// Delete grievance
app.delete('/api/grievances/:id', (req, res) => {
    const { id } = req.params;
    const { current_user_id, current_username, current_user_type } = req.query;
    
    db.query('DELETE FROM grievances WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting grievance:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id,
            current_username || 'Unknown',
            current_user_type || 'admin',
            'GRIEVANCE_DELETED',
            `Deleted grievance #${id}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Grievance deleted successfully' });
    });
});

// ==================== RESIGNATIONS ROUTES ====================

// Get all resignations (Admin)
app.get('/api/resignations', (req, res) => {
    const query = `
        SELECT r.*, u.username, u.email, b.full_name, b.position, b.department
        FROM resignations r
        JOIN users u ON r.employee_id = u.id
        LEFT JOIN biodata b ON u.id = b.employee_id
        ORDER BY r.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching resignations:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, resignations: results });
    });
});

// Get resignations for specific employee
app.get('/api/resignations/employee/:employeeId', (req, res) => {
    const { employeeId } = req.params;
    
    const query = `
        SELECT r.*, u.username, u.email, b.full_name, b.position, b.department
        FROM resignations r
        JOIN users u ON r.employee_id = u.id
        LEFT JOIN biodata b ON u.id = b.employee_id
        WHERE r.employee_id = ?
        ORDER BY r.created_at DESC
    `;
    
    db.query(query, [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching employee resignations:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, resignations: results });
    });
});

// Submit resignation (Employee)
app.post('/api/resignations', (req, res) => {
    const { employee_id, reason, last_working_day, current_user_id, current_username, current_user_type } = req.body;
    
    if (!employee_id || !reason || !last_working_day) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const query = `
        INSERT INTO resignations (employee_id, reason, last_working_day, status)
        VALUES (?, ?, ?, 'pending')
    `;
    
    db.query(query, [employee_id, reason, last_working_day], (err, result) => {
        if (err) {
            console.error('Error submitting resignation:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id || employee_id,
            current_username || 'Unknown',
            current_user_type || 'employee',
            'RESIGNATION_CREATED',
            `Submitted resignation with last working day: ${last_working_day}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Resignation submitted successfully', id: result.insertId });
    });
});

// Update resignation status (Admin)
app.patch('/api/resignations/:id', (req, res) => {
    const { id } = req.params;
    const { status, admin_notes, current_user_id, current_username, current_user_type } = req.body;
    
    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
    }
    
    const query = `
        UPDATE resignations
        SET status = ?, admin_notes = ?, updated_at = NOW()
        WHERE id = ?
    `;
    
    db.query(query, [status, admin_notes || '', id], (err) => {
        if (err) {
            console.error('Error updating resignation:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id,
            current_username || 'Unknown',
            current_user_type || 'admin',
            'RESIGNATION_UPDATED',
            `Updated resignation #${id} status to: ${status}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Resignation updated successfully' });
    });
});

// Delete resignation
app.delete('/api/resignations/:id', (req, res) => {
    const { id } = req.params;
    const { current_user_id, current_username, current_user_type } = req.query;
    
    db.query('DELETE FROM resignations WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting resignation:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        logActivity(
            current_user_id,
            current_username || 'Unknown',
            current_user_type || 'admin',
            'RESIGNATION_DELETED',
            `Deleted resignation #${id}`,
            req.ip
        );
        
        res.json({ success: true, message: 'Resignation deleted successfully' });
    });
});

// ==================== EMPLOYEE MANAGEMENT ROUTES ====================

// Get all employees (Admin)
app.get('/api/users', (req, res) => {
    const query = `
        SELECT u.id, u.username, u.email, u.phone, u.user_type, u.created_at,
               b.full_name, b.position, b.department
        FROM users u
        LEFT JOIN biodata b ON u.id = b.employee_id
        WHERE u.user_type = 'employee'
        ORDER BY u.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, employees: results });
    });
});

// Add new employee (Admin)
app.post('/api/add-employee', async (req, res) => {
    const { username, email, phone, password } = req.body;
    
    if (!username || !email || !phone || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    
    // Validate phone format (at least 10 digits)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
        return res.status(400).json({ success: false, message: 'Invalid phone number. Must contain at least 10 digits' });
    }
    
    try {
        // Check if username, email, or phone already exists
        const checkQuery = 'SELECT id, username, email, phone FROM users WHERE username = ? OR email = ? OR phone = ?';
        db.query(checkQuery, [username, email, phone], async (err, results) => {
            if (err) {
                console.error('Error checking user:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (results.length > 0) {
                const existing = results[0];
                if (existing.username === username) {
                    return res.status(400).json({ success: false, message: 'Username already exists' });
                }
                if (existing.email === email) {
                    return res.status(400).json({ success: false, message: 'Email already registered' });
                }
                if (existing.phone === phone) {
                    return res.status(400).json({ success: false, message: 'Phone number already registered' });
                }
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Generate verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            
            // Insert new employee
            const insertQuery = `
                INSERT INTO users (username, email, phone, password, user_type, verification_token, token_expiry)
                VALUES (?, ?, ?, ?, 'employee', ?, ?)
            `;
            
            db.query(insertQuery, [username, email, phone, hashedPassword, verificationToken, tokenExpiry], async (err, result) => {
                if (err) {
                    console.error('Error adding employee:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }
                
                const newUserId = result.insertId;
                
                // Create placeholder biodata entry for the new employee
                db.query(
                    `INSERT INTO biodata (employee_id, full_name, address, gender, position, department) 
                     VALUES (?, ?, '', 'male', '', '')`,
                    [newUserId, username], // Use username as initial full_name
                    (biodataErr) => {
                        if (biodataErr) {
                            console.error('Warning: Could not create biodata placeholder:', biodataErr);
                        }
                    }
                );
                
                // Send verification email
                const verificationLink = `http://localhost:3000/verify-email.html?token=${verificationToken}`;
                const mailOptions = {
                    from: process.env.EMAIL_USER || 'noreply@yourdomain.com',
                    to: email,
                    subject: 'Welcome! Verify Your Email - Employee Management System',
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    line-height: 1.6;
                                    color: #333;
                                }
                                .container {
                                    max-width: 600px;
                                    margin: 0 auto;
                                    padding: 20px;
                                    background-color: #f9f9f9;
                                    border-radius: 10px;
                                }
                                .header {
                                    background-color: #4CAF50;
                                    color: white;
                                    padding: 20px;
                                    text-align: center;
                                    border-radius: 10px 10px 0 0;
                                }
                                .content {
                                    background-color: white;
                                    padding: 30px;
                                    border-radius: 0 0 10px 10px;
                                }
                                .button {
                                    display: inline-block;
                                    padding: 12px 30px;
                                    background-color: #4CAF50;
                                    color: white;
                                    text-decoration: none;
                                    border-radius: 5px;
                                    margin: 20px 0;
                                }
                                .credentials {
                                    background-color: #f5f5f5;
                                    padding: 15px;
                                    border-radius: 5px;
                                    margin: 15px 0;
                                }
                                .footer {
                                    text-align: center;
                                    margin-top: 20px;
                                    font-size: 12px;
                                    color: #666;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>Welcome to Employee Management System!</h1>
                                </div>
                                <div class="content">
                                    <h2>Hi ${username},</h2>
                                    <p>An account has been created for you in the Employee Management System.</p>
                                    <div class="credentials">
                                        <p><strong>Your Login Details:</strong></p>
                                        <p>Username: <strong>${username}</strong></p>
                                        <p>Email: <strong>${email}</strong></p>
                                        <p><em>Note: Please change your password after first login.</em></p>
                                    </div>
                                    <p>Before you can log in, please verify your email address by clicking the button below:</p>
                                    <center>
                                        <a href="${verificationLink}" class="button">Verify Email</a>
                                    </center>
                                    <p>Or copy and paste this link in your browser:</p>
                                    <p style="word-break: break-all; color: #4CAF50;">${verificationLink}</p>
                                    <p><strong>Note:</strong> This link will expire in 24 hours.</p>
                                </div>
                                <div class="footer">
                                    <p>&copy; 2024 Employee Management System. All rights reserved.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                };
                
                try {
                    await emailTransporter.sendMail(mailOptions);
                    res.json({ 
                        success: true, 
                        message: 'Employee added successfully! A verification email has been sent.', 
                        employeeId: result.insertId 
                    });
                } catch (emailError) {
                    console.error('Failed to send verification email:', emailError);
                    res.json({ 
                        success: true, 
                        message: 'Employee added successfully! However, verification email could not be sent.', 
                        employeeId: result.insertId 
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error adding employee:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update employee username (Admin)
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, current_user_id, current_username, current_user_type } = req.body;
    
    if (!username) {
        return res.status(400).json({ success: false, message: 'Username is required' });
    }
    
    try {
        // Check if username already exists for different user
        const checkQuery = 'SELECT id FROM users WHERE username = ? AND id != ?';
        db.query(checkQuery, [username, id], async (err, results) => {
            if (err) {
                console.error('Error checking username:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'Username already exists' });
            }
            
            let updateQuery, params;
            
            if (password && password.trim()) {
                // Update both username and password
                const hashedPassword = await bcrypt.hash(password, 10);
                updateQuery = 'UPDATE users SET username = ?, password = ? WHERE id = ?';
                params = [username, hashedPassword, id];
            } else {
                // Update only username
                updateQuery = 'UPDATE users SET username = ? WHERE id = ?';
                params = [username, id];
            }
            
            db.query(updateQuery, params, (err, result) => {
                if (err) {
                    console.error('Error updating employee:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }
                
                // Log activity
                logActivity(
                    current_user_id,
                    current_username || 'Unknown',
                    current_user_type || 'admin',
                    'USER_UPDATED',
                    `Updated user #${id} (username: ${username})`,
                    req.ip
                );
                
                res.json({ success: true, message: 'Employee updated successfully' });
            });
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete employee (Admin)
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { current_user_id, current_username, current_user_type } = req.query;
    
    // Delete related records one by one
    db.query('DELETE FROM biodata WHERE employee_id = ?', [id], (err) => {
        if (err) console.error('Error deleting biodata:', err);
        
        db.query('DELETE FROM leave_applications WHERE employee_id = ?', [id], (err) => {
            if (err) console.error('Error deleting leaves:', err);
            
            db.query('DELETE FROM salaries WHERE employee_id = ?', [id], (err) => {
                if (err) console.error('Error deleting salaries:', err);
                
                db.query('DELETE FROM grievances WHERE employee_id = ?', [id], (err) => {
                    if (err) console.error('Error deleting grievances:', err);
                    
                    db.query('DELETE FROM resignations WHERE employee_id = ?', [id], (err) => {
                        if (err) console.error('Error deleting resignations:', err);
                        
                        // Finally delete the user
                        db.query('DELETE FROM users WHERE id = ? AND user_type = "employee"', [id], (err, result) => {
                            if (err) {
                                console.error('Error deleting employee:', err);
                                return res.status(500).json({ success: false, message: 'Database error' });
                            }
                            
                            if (result.affectedRows === 0) {
                                return res.status(404).json({ success: false, message: 'Employee not found' });
                            }
                            
                            // Log activity
                            logActivity(
                                current_user_id,
                                current_username || 'Unknown',
                                current_user_type || 'admin',
                                'USER_DELETED',
                                `Deleted employee #${id} and all related data`,
                                req.ip
                            );
                            
                            res.json({ success: true, message: 'Employee and related data deleted successfully' });
                        });
                    });
                });
            });
        });
    });
});

// ==================== Activity Logs Management ====================

// Get Activity Logs (Admin Only)
app.get('/api/activity-logs', (req, res) => {
    const { user_id, action, start_date, end_date, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];
    
    // Filter by user_id
    if (user_id) {
        query += ' AND user_id = ?';
        params.push(user_id);
    }
    
    // Filter by action
    if (action) {
        query += ' AND action = ?';
        params.push(action);
    }
    
    // Filter by date range
    if (start_date) {
        query += ' AND created_at >= ?';
        params.push(start_date);
    }
    
    if (end_date) {
        query += ' AND created_at <= ?';
        params.push(end_date);
    }
    
    // Order by newest first
    query += ' ORDER BY created_at DESC';
    
    // Add limit and offset for pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.query(query, params, (err, results) => {
        if (err) {
            return res.json({
                success: false,
                message: 'Database error'
            });
        }
        
        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM activity_logs WHERE 1=1';
        const countParams = [];
        
        if (user_id) {
            countQuery += ' AND user_id = ?';
            countParams.push(user_id);
        }
        
        if (action) {
            countQuery += ' AND action = ?';
            countParams.push(action);
        }
        
        if (start_date) {
            countQuery += ' AND created_at >= ?';
            countParams.push(start_date);
        }
        
        if (end_date) {
            countQuery += ' AND created_at <= ?';
            countParams.push(end_date);
        }
        
        db.query(countQuery, countParams, (err, countResults) => {
            res.json({
                success: true,
                data: results,
                total: countResults[0]?.total || 0,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        });
    });
});

// Get Activity Log Statistics (Admin Only)
app.get('/api/activity-stats', (req, res) => {
    const statsQuery = `
        SELECT 
            action,
            COUNT(*) as count,
            DATE(created_at) as date
        FROM activity_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY action, DATE(created_at)
        ORDER BY date DESC, count DESC
    `;
    
    db.query(statsQuery, (err, results) => {
        if (err) {
            return res.json({
                success: false,
                message: 'Database error'
            });
        }
        
        res.json({
            success: true,
            data: results
        });
    });
});

// ==================== Roles & Permissions Management ====================

// Get all roles
app.get('/api/roles', (req, res) => {
    const query = `
        SELECT r.*, 
               COUNT(DISTINCT ur.user_id) as assigned_users_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        GROUP BY r.id
        ORDER BY r.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching roles:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Parse permissions JSON
        const rolesWithPermissions = results.map(role => ({
            ...role,
            permissions: typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions
        }));
        
        res.json({ success: true, roles: rolesWithPermissions });
    });
});

// Get single role by ID
app.get('/api/roles/:id', (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT r.*,
               COUNT(DISTINCT ur.user_id) as assigned_users_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        WHERE r.id = ?
        GROUP BY r.id
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching role:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }
        
        const role = {
            ...results[0],
            permissions: typeof results[0].permissions === 'string' ? JSON.parse(results[0].permissions) : results[0].permissions
        };
        
        res.json({ success: true, role });
    });
});

// Create new role
app.post('/api/roles', (req, res) => {
    const { role_name, description, permissions } = req.body;
    
    if (!role_name || !permissions) {
        return res.status(400).json({ success: false, message: 'Role name and permissions are required' });
    }
    
    // Validate permissions is an object
    if (typeof permissions !== 'object') {
        return res.status(400).json({ success: false, message: 'Permissions must be an object' });
    }
    
    const query = 'INSERT INTO roles (role_name, description, permissions) VALUES (?, ?, ?)';
    
    db.query(query, [role_name, description || '', JSON.stringify(permissions)], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Role name already exists' });
            }
            console.error('Error creating role:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log activity
        const user = req.body.created_by_user;
        if (user) {
            logActivity(user.id, user.username, user.user_type, 'ROLE_CREATED', `Created role: ${role_name}`, req.ip);
        }
        
        res.json({ 
            success: true, 
            message: 'Role created successfully', 
            roleId: result.insertId 
        });
    });
});

// Update role
app.put('/api/roles/:id', (req, res) => {
    const { id } = req.params;
    const { role_name, description, permissions } = req.body;
    
    if (!role_name || !permissions) {
        return res.status(400).json({ success: false, message: 'Role name and permissions are required' });
    }
    
    const query = 'UPDATE roles SET role_name = ?, description = ?, permissions = ? WHERE id = ?';
    
    db.query(query, [role_name, description || '', JSON.stringify(permissions), id], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Role name already exists' });
            }
            console.error('Error updating role:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }
        
        // Log activity
        const user = req.body.updated_by_user;
        if (user) {
            logActivity(user.id, user.username, user.user_type, 'ROLE_UPDATED', `Updated role: ${role_name}`, req.ip);
        }
        
        res.json({ success: true, message: 'Role updated successfully' });
    });
});

// Delete role
app.delete('/api/roles/:id', (req, res) => {
    const { id } = req.params;
    
    // First check if role is assigned to any users
    db.query('SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error checking role assignments:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (results[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot delete role. It is currently assigned to ${results[0].count} user(s). Remove role assignments first.` 
            });
        }
        
        // Get role name for logging before deleting
        db.query('SELECT role_name FROM roles WHERE id = ?', [id], (err, roleResults) => {
            if (err) {
                console.error('Error fetching role:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (roleResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Role not found' });
            }
            
            const roleName = roleResults[0].role_name;
            
            // Delete role
            db.query('DELETE FROM roles WHERE id = ?', [id], (err, result) => {
                if (err) {
                    console.error('Error deleting role:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }
                
                // Log activity
                const user = req.body.deleted_by_user;
                if (user) {
                    logActivity(user.id, user.username, user.user_type, 'ROLE_DELETED', `Deleted role: ${roleName}`, req.ip);
                }
                
                res.json({ success: true, message: 'Role deleted successfully' });
            });
        });
    });
});

// Assign role to user
app.post('/api/users/:userId/roles', (req, res) => {
    const { userId } = req.params;
    const { role_id, assigned_by } = req.body;
    
    if (!role_id) {
        return res.status(400).json({ success: false, message: 'Role ID is required' });
    }
    
    // Check if user exists
    db.query('SELECT username FROM users WHERE id = ?', [userId], (err, userResults) => {
        if (err) {
            console.error('Error checking user:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (userResults.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const username = userResults[0].username;
        
        // Check if role exists
        db.query('SELECT role_name FROM roles WHERE id = ?', [role_id], (err, roleResults) => {
            if (err) {
                console.error('Error checking role:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (roleResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Role not found' });
            }
            
            const roleName = roleResults[0].role_name;
            
            // Insert role assignment
            const query = 'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)';
            
            db.query(query, [userId, role_id, assigned_by || null], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ success: false, message: 'User already has this role' });
                    }
                    console.error('Error assigning role:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }
                
                // Log activity
                const assignedByUser = req.body.assigned_by_user;
                if (assignedByUser) {
                    logActivity(
                        assignedByUser.id, 
                        assignedByUser.username, 
                        assignedByUser.user_type, 
                        'ROLE_ASSIGNED', 
                        `Assigned role "${roleName}" to user ${username}`, 
                        req.ip
                    );
                }
                
                res.json({ success: true, message: 'Role assigned successfully' });
            });
        });
    });
});

// Remove role from user
app.delete('/api/users/:userId/roles/:roleId', (req, res) => {
    const { userId, roleId } = req.params;
    
    // Get info for logging before deletion
    db.query(
        `SELECT u.username, r.role_name 
         FROM users u, roles r 
         WHERE u.id = ? AND r.id = ?`,
        [userId, roleId],
        (err, results) => {
            if (err) {
                console.error('Error fetching user/role:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: 'User or role not found' });
            }
            
            const username = results[0].username;
            const roleName = results[0].role_name;
            
            // Delete role assignment
            db.query('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?', [userId, roleId], (err, result) => {
                if (err) {
                    console.error('Error removing role:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: 'Role assignment not found' });
                }
                
                // Log activity
                const removedByUser = req.body.removed_by_user;
                if (removedByUser) {
                    logActivity(
                        removedByUser.id, 
                        removedByUser.username, 
                        removedByUser.user_type, 
                        'ROLE_REMOVED', 
                        `Removed role "${roleName}" from user ${username}`, 
                        req.ip
                    );
                }
                
                res.json({ success: true, message: 'Role removed successfully' });
            });
        }
    );
});

// Get roles for a specific user
app.get('/api/users/:userId/roles', (req, res) => {
    const { userId } = req.params;
    
    const query = `
        SELECT r.*, ur.assigned_at, ur.assigned_by
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
        ORDER BY ur.assigned_at DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user roles:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Parse permissions JSON
        const rolesWithPermissions = results.map(role => ({
            ...role,
            permissions: typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions
        }));
        
        res.json({ success: true, roles: rolesWithPermissions });
    });
});

// Check if user has specific permission
app.post('/api/users/:userId/check-permission', (req, res) => {
    const { userId } = req.params;
    const { permission } = req.body;
    
    if (!permission) {
        return res.status(400).json({ success: false, message: 'Permission name is required' });
    }
    
    const query = `
        SELECT r.permissions
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error checking permission:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Check if user has the permission in any of their roles
        let hasPermission = false;
        
        for (const role of results) {
            const permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
            if (permissions[permission] === true) {
                hasPermission = true;
                break;
            }
        }
        
        res.json({ success: true, hasPermission });
    });
});

// ==================== Start Server ====================

// Initialize database and then start server
initializeDatabase()
    .then(() => {
        // Initialize default roles
        initializeDefaultRoles();
        
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(50));
            console.log('🚀 Server is running on http://localhost:' + PORT);
            console.log('📂 Open http://localhost:' + PORT + ' in your browser');
            console.log('='.repeat(50) + '\n');
        });
    })
    .catch((err) => {
        console.error('❌ Failed to initialize database:', err);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Make sure MySQL is installed and running');
        console.log('   2. Check MySQL credentials in .env file');
        console.log('   3. Update MYSQL_PASSWORD in .env to match your MySQL root password');
        console.log('   4. Mac: Run "brew services start mysql"');
        console.log('   5. Windows: Start MySQL from Services or XAMPP\n');
        process.exit(1);
    });
