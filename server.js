// ==================== CONFIGURATION ====================
// MYSQL PASSWORD: Change this if you get "Access denied" error
// Common values: 'root', 'password', '' (empty), or your custom password
const MYSQL_ROOT_PASSWORD = process.env.MYSQL_PASSWORD || 'Root@12345';
// =======================================================

console.log('⏳ Loading modules...');

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

console.log('📦 Starting Employee-Admin CRUD System...');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

console.log('✅ Middleware configured');

// MySQL Database Connection (without database first)
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: MYSQL_ROOT_PASSWORD,
    database: 'employee_admin_system'
};

let db;

// Function to initialize database and tables
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // First connect without specifying database
        const tempConnection = mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        tempConnection.connect((err) => {
            if (err) {
                console.error('❌ MySQL connection failed:', err.message);
                console.log('\n💡 Troubleshooting:');
                console.log('   Windows: Update password in server.js (line 25) to match your MySQL root password');
                console.log('   Mac: Run "brew services start mysql" or check if MySQL is installed');
                console.log('   Common passwords: "root", "password", "" (empty), or what you set during installation\n');
                reject(err);
                return;
            }

            console.log('✅ Connected to MySQL');

            // Create database if it doesn't exist
            tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`, (err) => {
                if (err) {
                    console.error('❌ Failed to create database:', err);
                    reject(err);
                    return;
                }

                console.log('✅ Database ready');

                // Now connect to the specific database
                tempConnection.changeUser({ database: dbConfig.database }, (err) => {
                    if (err) {
                        console.error('❌ Failed to switch to database:', err);
                        reject(err);
                        return;
                    }

                    // Create tables
                    const createUsersTable = `
                        CREATE TABLE IF NOT EXISTS users (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            username VARCHAR(50) UNIQUE NOT NULL,
                            password VARCHAR(255) NOT NULL,
                            user_type ENUM('admin', 'employee') NOT NULL,
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
                            employee_id INT NOT NULL,
                            full_name VARCHAR(100) NOT NULL,
                            email VARCHAR(100) NOT NULL,
                            phone VARCHAR(20) NOT NULL,
                            address TEXT NOT NULL,
                            date_of_birth DATE NOT NULL,
                            gender ENUM('male', 'female', 'other') NOT NULL,
                            position VARCHAR(100) NOT NULL,
                            department VARCHAR(100) NOT NULL,
                            joining_date DATE NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
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
                                            'INSERT INTO users (username, password, user_type) VALUES (?, ?, ?)',
                                            ['admin', hashedPassword, 'admin'],
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
                                        // Set the global db connection
                                        db = tempConnection;
                                        resolve();
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

// ==================== Authentication Routes ====================

// Signup Route
app.post('/api/signup', async (req, res) => {
    const { username, password, user_type } = req.body;
    
    // Validate input
    if (!username || !password || !user_type) {
        return res.json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    // Check if username already exists
    db.query('SELECT id FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            return res.json({
                success: false,
                message: 'Database error'
            });
        }
        
        if (results.length > 0) {
            return res.json({
                success: false,
                message: 'Username already exists'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        db.query(
            'INSERT INTO users (username, password, user_type) VALUES (?, ?, ?)',
            [username, hashedPassword, user_type],
            (err, result) => {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Registration failed'
                    });
                }
                
                res.json({
                    success: true,
                    message: 'User registered successfully'
                });
            }
        );
    });
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
    
    // Query user
    db.query(
        'SELECT id, username, password, user_type FROM users WHERE username = ? AND user_type = ?',
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
            
            if (isValidPassword) {
                // Remove password from response
                delete user.password;
                
                res.json({
                    success: true,
                    message: 'Login successful',
                    user: user
                });
            } else {
                res.json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
        }
    );
});

// ==================== Leave Management Routes ====================

// Get Leave Applications
app.get('/api/leave', (req, res) => {
    const { id, employee_id, all } = req.query;
    
    if (id) {
        // Get single leave application
        db.query(
            `SELECT l.*, u.username 
             FROM leave_applications l 
             JOIN users u ON l.employee_id = u.id 
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
            `SELECT l.*, u.username 
             FROM leave_applications l 
             JOIN users u ON l.employee_id = u.id 
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
            `SELECT l.*, u.username 
             FROM leave_applications l 
             JOIN users u ON l.employee_id = u.id 
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
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;
    
    if (!employee_id || !leave_type || !start_date || !end_date || !reason) {
        return res.json({
            success: false,
            message: 'All fields are required'
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
    const { leave_type, start_date, end_date, reason } = req.body;
    
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
    
    db.query('DELETE FROM leave_applications WHERE id = ?', [id], (err, result) => {
        if (err) {
            return res.json({
                success: false,
                message: 'Failed to delete leave application'
            });
        }
        
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
    
    if (id) {
        // Get single biodata
        db.query(
            `SELECT b.*, u.username 
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
        // Get biodata for specific employee
        db.query(
            `SELECT b.*, u.username 
             FROM biodata b 
             JOIN users u ON b.employee_id = u.id 
             WHERE b.employee_id = ? 
             ORDER BY b.created_at DESC`,
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
        // Get all biodata (for admin)
        db.query(
            `SELECT b.*, u.username 
             FROM biodata b 
             JOIN users u ON b.employee_id = u.id 
             ORDER BY b.created_at DESC`,
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

// Create Biodata
app.post('/api/biodata', (req, res) => {
    const { 
        employee_id, full_name, email, phone, address, 
        date_of_birth, gender, position, department, joining_date 
    } = req.body;
    
    if (!employee_id || !full_name || !email || !phone || !address || 
        !date_of_birth || !gender || !position || !department || !joining_date) {
        return res.json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    db.query(
        `INSERT INTO biodata 
         (employee_id, full_name, email, phone, address, date_of_birth, gender, position, department, joining_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [employee_id, full_name, email, phone, address, date_of_birth, gender, position, department, joining_date],
        (err, result) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to add biodata'
                });
            }
            
            res.json({
                success: true,
                message: 'Biodata added successfully',
                id: result.insertId
            });
        }
    );
});

// Update Biodata
app.put('/api/biodata/:id', (req, res) => {
    const { id } = req.params;
    const { 
        full_name, email, phone, address, 
        date_of_birth, gender, position, department, joining_date 
    } = req.body;
    
    if (!full_name || !email || !phone || !address || 
        !date_of_birth || !gender || !position || !department || !joining_date) {
        return res.json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    db.query(
        `UPDATE biodata 
         SET full_name = ?, email = ?, phone = ?, address = ?, date_of_birth = ?, 
             gender = ?, position = ?, department = ?, joining_date = ? 
         WHERE id = ?`,
        [full_name, email, phone, address, date_of_birth, gender, position, department, joining_date, id],
        (err, result) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to update biodata'
                });
            }
            
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
    
    db.query('DELETE FROM biodata WHERE id = ?', [id], (err, result) => {
        if (err) {
            return res.json({
                success: false,
                message: 'Failed to delete biodata'
            });
        }
        
        res.json({
            success: true,
            message: 'Biodata deleted successfully'
        });
    });
});

// ==================== Start Server ====================

// Initialize database and then start server
initializeDatabase()
    .then(() => {
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
        console.log('   2. Check MySQL credentials in server.js (line 25)');
        console.log('   3. Windows: Update password to match your MySQL root password');
        console.log('   4. Mac: Run "brew services start mysql"\n');
        process.exit(1);
    });
