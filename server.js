// ==================== CONFIGURATION ====================
// Auto-detect OS and set appropriate MySQL password
// Windows: Root@12345
// Mac/Linux: (empty string - no password)
const os = require('os');
const platform = os.platform();

let MYSQL_ROOT_PASSWORD;
if (platform === 'win32') {
    // Windows
    MYSQL_ROOT_PASSWORD = process.env.MYSQL_PASSWORD || 'Root@12345';
    console.log('🖥️  Detected Windows - Using Windows MySQL password');
} else {
    // Mac/Linux
    MYSQL_ROOT_PASSWORD = process.env.MYSQL_PASSWORD || '';
    console.log('🍎 Detected Mac/Linux - Using default MySQL configuration (no password)');
}
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

// ==================== SALARY ROUTES ====================

// Get all salaries (Admin)
app.get('/api/salaries', (req, res) => {
    const query = `
        SELECT s.*, u.username
        FROM salaries s
        JOIN users u ON s.employee_id = u.id
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
    
    const query = `
        SELECT s.*, u.username
        FROM salaries s
        JOIN users u ON s.employee_id = u.id
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
    const { employee_id, basic_salary, allowances, deductions, month, year } = req.body;
    
    if (!employee_id || !basic_salary || !month || !year) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const net_salary = parseFloat(basic_salary) + parseFloat(allowances || 0) - parseFloat(deductions || 0);
    const payment_date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const query = `
        INSERT INTO salaries (employee_id, basic_salary, allowances, deductions, net_salary, month, year, payment_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [employee_id, basic_salary, allowances || 0, deductions || 0, net_salary, month, year, payment_date], (err, result) => {
        if (err) {
            console.error('Error adding salary:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Salary record added successfully', id: result.insertId });
    });
});

// Update salary record (Admin)
app.put('/api/salaries/:id', (req, res) => {
    const { id } = req.params;
    const { basic_salary, allowances, deductions, month, year } = req.body;
    
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
        res.json({ success: true, message: 'Salary record updated successfully' });
    });
});

// Delete salary record (Admin)
app.delete('/api/salaries/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM salaries WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting salary:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
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
    const { holiday_name, holiday_date, description, year } = req.body;
    
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
        res.json({ success: true, message: 'Holiday added successfully', id: result.insertId });
    });
});

// Update holiday (Admin)
app.put('/api/holidays/:id', (req, res) => {
    const { id } = req.params;
    const { holiday_name, holiday_date, description, year } = req.body;
    
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
        res.json({ success: true, message: 'Holiday updated successfully' });
    });
});

// Delete holiday (Admin)
app.delete('/api/holidays/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM company_holidays WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting holiday:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Holiday deleted successfully' });
    });
});

// ==================== GRIEVANCES ROUTES ====================

// Get all grievances (Admin)
app.get('/api/grievances', (req, res) => {
    const query = `
        SELECT g.*, u.username
        FROM grievances g
        JOIN users u ON g.employee_id = u.id
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
        SELECT * FROM grievances
        WHERE employee_id = ?
        ORDER BY created_at DESC
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
    const { employee_id, subject, description } = req.body;
    
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
        res.json({ success: true, message: 'Grievance submitted successfully', id: result.insertId });
    });
});

// Update grievance status (Admin)
app.patch('/api/grievances/:id', (req, res) => {
    const { id } = req.params;
    const { status, admin_response } = req.body;
    
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
        res.json({ success: true, message: 'Grievance updated successfully' });
    });
});

// Delete grievance
app.delete('/api/grievances/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM grievances WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting grievance:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Grievance deleted successfully' });
    });
});

// ==================== RESIGNATIONS ROUTES ====================

// Get all resignations (Admin)
app.get('/api/resignations', (req, res) => {
    const query = `
        SELECT r.*, u.username
        FROM resignations r
        JOIN users u ON r.employee_id = u.id
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
        SELECT * FROM resignations
        WHERE employee_id = ?
        ORDER BY created_at DESC
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
    const { employee_id, reason, last_working_day } = req.body;
    
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
        res.json({ success: true, message: 'Resignation submitted successfully', id: result.insertId });
    });
});

// Update resignation status (Admin)
app.patch('/api/resignations/:id', (req, res) => {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
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
        res.json({ success: true, message: 'Resignation updated successfully' });
    });
});

// Delete resignation
app.delete('/api/resignations/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM resignations WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting resignation:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Resignation deleted successfully' });
    });
});

// ==================== EMPLOYEE MANAGEMENT ROUTES ====================

// Get all employees (Admin)
app.get('/api/users', (req, res) => {
    const query = `
        SELECT u.id, u.username, u.user_type, u.created_at,
               b.full_name, b.email, b.phone, b.position, b.department
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
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    
    try {
        // Check if username already exists
        const checkQuery = 'SELECT id FROM users WHERE username = ?';
        db.query(checkQuery, [username], async (err, results) => {
            if (err) {
                console.error('Error checking username:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'Username already exists' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert new employee
            const insertQuery = `
                INSERT INTO users (username, password, user_type)
                VALUES (?, ?, 'employee')
            `;
            
            db.query(insertQuery, [username, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Error adding employee:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }
                res.json({ 
                    success: true, 
                    message: 'Employee added successfully. Please ask employee to add their biodata.', 
                    employeeId: result.insertId 
                });
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
    const { username, password } = req.body;
    
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
                            
                            res.json({ success: true, message: 'Employee and related data deleted successfully' });
                        });
                    });
                });
            });
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
