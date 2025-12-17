// Admin Dashboard Functionality
const API_BASE_URL = 'http://localhost:3000/api';

// Check authentication
const user = JSON.parse(sessionStorage.getItem('user'));
if (!user || user.user_type !== 'admin') {
    window.location.href = 'admin-login.html';
}

// DOM Elements
const usernameEl = document.getElementById('username');
const pageTitleEl = document.getElementById('pageTitle');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

// Leave elements
const leaveTableBody = document.getElementById('leaveTableBody');
const totalLeaveCount = document.getElementById('totalLeaveCount');
const pendingLeaveCount = document.getElementById('pendingLeaveCount');
const approvedLeaveCount = document.getElementById('approvedLeaveCount');
const leaveDetailModal = document.getElementById('leaveDetailModal');
const closeLeaveDetailModal = document.getElementById('closeLeaveDetailModal');
const leaveDetails = document.getElementById('leaveDetails');

// Biodata elements
const biodataTableBody = document.getElementById('biodataTableBody');
const totalEmployeeCount = document.getElementById('totalEmployeeCount');
const biodataDetailModal = document.getElementById('biodataDetailModal');
const closeBiodataDetailModal = document.getElementById('closeBiodataDetailModal');
const biodataDetails = document.getElementById('biodataDetails');
const biodataEditModal = document.getElementById('biodataEditModal');
const closeBiodataEditModal = document.getElementById('closeBiodataEditModal');
const biodataEditForm = document.getElementById('biodataEditForm');
const biodataEditErrorMessage = document.getElementById('biodataEditErrorMessage');

// Set username
usernameEl.textContent = user.username;

// Tab switching
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tabName = item.dataset.tab;
        
        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Update active tab content
        tabContents.forEach(tab => tab.classList.remove('active'));
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        // Update page title
        if (tabName === 'leave') {
            pageTitleEl.textContent = 'Leave Applications';
            loadAllLeaveApplications();
        } else if (tabName === 'biodata') {
            pageTitleEl.textContent = 'Employee Biodata';
            loadAllBiodata();
        } else if (tabName === 'payroll') {
            pageTitleEl.textContent = 'Payroll Management';
            loadAllSalaries();
            loadEmployeesForSalary();
        } else if (tabName === 'holidays') {
            pageTitleEl.textContent = 'Holiday Calendar';
            loadAllHolidays();
        } else if (tabName === 'grievances') {
            pageTitleEl.textContent = 'Grievances';
            loadAllGrievances();
        } else if (tabName === 'resignations') {
            pageTitleEl.textContent = 'Resignations';
            loadAllResignations();
        } else if (tabName === 'addEmployee') {
            pageTitleEl.textContent = 'Manage Employees';
            loadAllEmployees();
            loadEmployeesForSalary();
        }
    });
});

// Logout
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('user');
    window.location.href = 'admin-login.html';
});

// Auto-populate year from date selection for holidays
document.getElementById('holidayDate')?.addEventListener('change', (e) => {
    const yearInput = document.getElementById('holidayYear');
    if (e.target.value && yearInput) {
        const selectedDate = new Date(e.target.value);
        yearInput.value = selectedDate.getFullYear();
    }
});

// Close leave detail modal
closeLeaveDetailModal.addEventListener('click', () => {
    leaveDetailModal.classList.remove('show');
});

// Close biodata detail modal
closeBiodataDetailModal.addEventListener('click', () => {
    biodataDetailModal.classList.remove('show');
});

// Close biodata edit modal
closeBiodataEditModal.addEventListener('click', () => {
    biodataEditModal.classList.remove('show');
    biodataEditForm.reset();
    biodataEditErrorMessage.classList.remove('show');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === leaveDetailModal) {
        leaveDetailModal.classList.remove('show');
    }
    if (e.target === biodataDetailModal) {
        biodataDetailModal.classList.remove('show');
    }
    if (e.target === biodataEditModal) {
        biodataEditModal.classList.remove('show');
        biodataEditForm.reset();
        biodataEditErrorMessage.classList.remove('show');
    }
    if (e.target === document.getElementById('grievanceDetailModal')) {
        document.getElementById('grievanceDetailModal').classList.remove('show');
    }
    if (e.target === document.getElementById('resignationDetailModal')) {
        document.getElementById('resignationDetailModal').classList.remove('show');
    }
});

// ==================== Leave Management ====================

// Load all leave applications
async function loadAllLeaveApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/leave?all=true`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            // Update stats
            totalLeaveCount.textContent = result.data.length;
            pendingLeaveCount.textContent = result.data.filter(l => l.status === 'pending').length;
            approvedLeaveCount.textContent = result.data.filter(l => l.status === 'approved').length;
            
            leaveTableBody.innerHTML = result.data.map(leave => `
                <tr>
                    <td>${leave.username || 'N/A'}</td>
                    <td>${leave.leave_type}</td>
                    <td>${formatDate(leave.start_date)}</td>
                    <td>${formatDate(leave.end_date)}</td>
                    <td>${truncateText(leave.reason, 50)}</td>
                    <td><span class="status-badge ${leave.status}">${leave.status}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon-only btn-view" onclick="viewLeaveDetails(${leave.id})" title="View Details">
                                👁️
                            </button>
                            ${leave.status === 'pending' ? `
                                <button class="btn-icon-only btn-approve" onclick="approveLeave(${leave.id})" title="Approve">
                                    ✅
                                </button>
                                <button class="btn-icon-only btn-reject" onclick="rejectLeave(${leave.id})" title="Reject">
                                    ❌
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            totalLeaveCount.textContent = '0';
            pendingLeaveCount.textContent = '0';
            approvedLeaveCount.textContent = '0';
            leaveTableBody.innerHTML = '<tr class="no-data"><td colspan="7">No leave applications found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading leave applications:', error);
        leaveTableBody.innerHTML = '<tr class="no-data"><td colspan="7">Error loading data</td></tr>';
    }
}

// View leave details
window.viewLeaveDetails = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/leave?id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            const leave = result.data;
            leaveDetails.innerHTML = `
                <div class="detail-item">
                    <span class="detail-label">Employee:</span>
                    <span class="detail-value">${leave.username || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Leave Type:</span>
                    <span class="detail-value">${leave.leave_type}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Start Date:</span>
                    <span class="detail-value">${formatDate(leave.start_date)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">End Date:</span>
                    <span class="detail-value">${formatDate(leave.end_date)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${calculateDuration(leave.start_date, leave.end_date)} days</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Reason:</span>
                    <span class="detail-value">${leave.reason}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value"><span class="status-badge ${leave.status}">${leave.status}</span></span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Applied On:</span>
                    <span class="detail-value">${formatDateTime(leave.created_at)}</span>
                </div>
            `;
            leaveDetailModal.classList.add('show');
        }
    } catch (error) {
        console.error('Error loading leave details:', error);
        alert('Error loading leave details');
    }
};

// Approve Leave
window.approveLeave = async (id) => {
    if (!confirm('Are you sure you want to approve this leave application?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/leave/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'approved' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Leave application approved successfully');
            loadAllLeaveApplications();
        } else {
            alert(result.message || 'Error approving leave application');
        }
    } catch (error) {
        console.error('Error approving leave:', error);
        alert('Error approving leave application');
    }
};

// Reject Leave
window.rejectLeave = async (id) => {
    if (!confirm('Are you sure you want to reject this leave application?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/leave/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'rejected' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Leave application rejected');
            loadAllLeaveApplications();
        } else {
            alert(result.message || 'Error rejecting leave application');
        }
    } catch (error) {
        console.error('Error rejecting leave:', error);
        alert('Error rejecting leave application');
    }
};

// ==================== Biodata Management ====================

// Load all biodata
async function loadAllBiodata() {
    try {
        const response = await fetch(`${API_BASE_URL}/biodata?all=true`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            // Update stats - show biodata count, not total employees
            totalEmployeeCount.textContent = result.data.length;
            
            biodataTableBody.innerHTML = result.data.map(bio => `
                <tr>
                    <td>${bio.full_name}</td>
                    <td>${bio.email}</td>
                    <td>${bio.phone}</td>
                    <td>${bio.position}</td>
                    <td>${bio.department}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon-only btn-view" onclick="viewBiodataDetails(${bio.id})" title="View Details">
                                👁️
                            </button>
                            <button class="btn-icon-only btn-edit" onclick="editBiodataAdmin(${bio.id})" title="Edit">
                                ✏️
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            totalEmployeeCount.textContent = '0';
            biodataTableBody.innerHTML = '<tr class="no-data"><td colspan="6">No employee biodata found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading biodata:', error);
        biodataTableBody.innerHTML = '<tr class="no-data"><td colspan="6">Error loading data</td></tr>';
    }
}

// View biodata details
window.viewBiodataDetails = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/biodata?id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            const bio = result.data;
            biodataDetails.innerHTML = `
                <div class="detail-item">
                    <span class="detail-label">Employee:</span>
                    <span class="detail-value">${bio.username || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Full Name:</span>
                    <span class="detail-value">${bio.full_name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${bio.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${bio.phone}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Date of Birth:</span>
                    <span class="detail-value">${formatDate(bio.date_of_birth)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Gender:</span>
                    <span class="detail-value">${capitalizeFirst(bio.gender)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${bio.address}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Position:</span>
                    <span class="detail-value">${bio.position}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Department:</span>
                    <span class="detail-value">${bio.department}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Joining Date:</span>
                    <span class="detail-value">${formatDate(bio.joining_date)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Created At:</span>
                    <span class="detail-value">${formatDateTime(bio.created_at)}</span>
                </div>
            `;
            biodataDetailModal.classList.add('show');
        }
    } catch (error) {
        console.error('Error loading biodata details:', error);
        alert('Error loading biodata details');
    }
};

// ==================== Utility Functions ====================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}

// Utility function to format date for input fields (YYYY-MM-DD)
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ==================== Admin Biodata Edit Functions ====================

// Edit biodata as admin
window.editBiodataAdmin = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/biodata?id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            const bio = result.data;
            document.getElementById('editBiodataId').value = bio.id;
            document.getElementById('editEmployeeId').value = bio.employee_id;
            document.getElementById('editFullName').value = bio.full_name;
            document.getElementById('editEmail').value = bio.email;
            document.getElementById('editPhone').value = bio.phone;
            document.getElementById('editAddress').value = bio.address;
            document.getElementById('editDateOfBirth').value = formatDateForInput(bio.date_of_birth);
            document.getElementById('editGender').value = bio.gender;
            document.getElementById('editPosition').value = bio.position;
            document.getElementById('editDepartment').value = bio.department;
            document.getElementById('editJoiningDate').value = formatDateForInput(bio.joining_date);
            biodataEditModal.classList.add('show');
        }
    } catch (error) {
        console.error('Error loading biodata:', error);
        alert('Error loading biodata');
    }
};

// Submit biodata edit form
biodataEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    biodataEditErrorMessage.classList.remove('show');
    
    const formData = new FormData(biodataEditForm);
    const biodataId = formData.get('biodataId');
    
    const data = {
        full_name: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        date_of_birth: formData.get('dateOfBirth'),
        gender: formData.get('gender'),
        position: formData.get('position'),
        department: formData.get('department'),
        joining_date: formData.get('joiningDate')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/biodata/${biodataId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Biodata updated successfully');
            biodataEditModal.classList.remove('show');
            biodataEditForm.reset();
            loadAllBiodata();
        } else {
            biodataEditErrorMessage.textContent = result.message || 'An error occurred.';
            biodataEditErrorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Error:', error);
        biodataEditErrorMessage.textContent = 'An error occurred. Please try again.';
        biodataEditErrorMessage.classList.add('show');
    }
});

// ==================== PAYROLL FUNCTIONS ====================

// Load employees for salary dropdown
async function loadEmployeesForSalary() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        const result = await response.json();
        
        const select = document.getElementById('salaryEmployeeId');
        select.innerHTML = '<option value="">Select Employee</option>';
        
        if (result.success && result.employees && result.employees.length > 0) {
            result.employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                // Show full name if available, otherwise show username
                const displayName = emp.full_name ? `${emp.full_name} (${emp.username})` : emp.username;
                option.textContent = displayName;
                select.appendChild(option);
            });
        }
        
        // Set default year to current year
        const currentYear = new Date().getFullYear();
        const yearInput = document.getElementById('salaryYear');
        if (yearInput && !yearInput.value) {
            yearInput.value = currentYear;
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Load all salaries
async function loadAllSalaries() {
    try {
        const response = await fetch(`${API_BASE_URL}/salaries`);
        const result = await response.json();
        
        const tbody = document.getElementById('salariesTableBody');
        tbody.innerHTML = '';
        
        if (result.success && result.salaries && result.salaries.length > 0) {
            document.getElementById('totalSalariesCount').textContent = result.salaries.length;
            
            result.salaries.forEach(salary => {
                const row = document.createElement('tr');
                const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                                  'July', 'August', 'September', 'October', 'November', 'December'];
                
                row.innerHTML = `
                    <td>${salary.username || 'N/A'}</td>
                    <td>${monthNames[salary.month]} ${salary.year}</td>
                    <td>$${parseFloat(salary.basic_salary).toFixed(2)}</td>
                    <td>$${parseFloat(salary.allowances).toFixed(2)}</td>
                    <td>$${parseFloat(salary.deductions).toFixed(2)}</td>
                    <td><strong>$${parseFloat(salary.net_salary).toFixed(2)}</strong></td>
                    <td>
                        <button class="btn btn-small btn-danger" onclick="deleteSalary(${salary.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr class="no-data"><td colspan="7">No salary records found</td></tr>';
            document.getElementById('totalSalariesCount').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading salaries:', error);
    }
}

// Add salary form submission
document.getElementById('addSalaryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        employee_id: document.getElementById('salaryEmployeeId').value,
        basic_salary: document.getElementById('basicSalary').value,
        allowances: document.getElementById('allowances').value || 0,
        deductions: document.getElementById('deductions').value || 0,
        month: document.getElementById('salaryMonth').value,
        year: document.getElementById('salaryYear').value
    };
    
    console.log('Submitting salary data:', data);
    
    // Validate required fields
    if (!data.employee_id || !data.basic_salary || !data.month || !data.year) {
        alert('Please fill in all required fields (Employee, Basic Salary, Month, Year)');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/salaries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Salary record added successfully');
            document.getElementById('addSalaryForm').reset();
            loadAllSalaries();
        } else {
            alert(result.message || 'Error adding salary record');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
});

// Delete salary
async function deleteSalary(id) {
    if (!confirm('Are you sure you want to delete this salary record?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/salaries/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Salary record deleted successfully');
            loadAllSalaries();
        } else {
            alert(result.message || 'Error deleting salary record');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

// ==================== HOLIDAYS FUNCTIONS ====================

// Load all holidays
async function loadAllHolidays() {
    try {
        const response = await fetch(`${API_BASE_URL}/holidays`);
        const result = await response.json();
        
        const tbody = document.getElementById('holidaysTableBody');
        tbody.innerHTML = '';
        
        if (result.success && result.holidays && result.holidays.length > 0) {
            document.getElementById('totalHolidaysCount').textContent = result.holidays.length;
            
            result.holidays.forEach(holiday => {
                const row = document.createElement('tr');
                const date = new Date(holiday.holiday_date);
                
                row.innerHTML = `
                    <td>${holiday.holiday_name}</td>
                    <td>${date.toLocaleDateString()}</td>
                    <td>${holiday.year}</td>
                    <td>${holiday.description || 'N/A'}</td>
                    <td>
                        <button class="btn btn-small btn-danger" onclick="deleteHoliday(${holiday.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr class="no-data"><td colspan="5">No holidays found</td></tr>';
            document.getElementById('totalHolidaysCount').textContent = '0';
        }
        
        // Set default year to current year
        const currentYear = new Date().getFullYear();
        const yearInput = document.getElementById('holidayYear');
        if (yearInput && !yearInput.value) {
            yearInput.value = currentYear;
        }
    } catch (error) {
        console.error('Error loading holidays:', error);
    }
}

// Add holiday form submission
document.getElementById('addHolidayForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const holidayDate = document.getElementById('holidayDate').value;
    const year = document.getElementById('holidayYear').value || new Date(holidayDate).getFullYear();
    
    const data = {
        holiday_name: document.getElementById('holidayName').value,
        holiday_date: holidayDate,
        year: year,
        description: document.getElementById('holidayDescription').value
    };
    
    console.log('Submitting holiday data:', data);
    
    // Validate required fields
    if (!data.holiday_name || !data.holiday_date || !data.year) {
        alert('Please fill in all required fields (Holiday Name, Date, Year)');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/holidays`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Holiday added successfully');
            document.getElementById('addHolidayForm').reset();
            loadAllHolidays();
        } else {
            alert(result.message || 'Error adding holiday');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
});

// Delete holiday
async function deleteHoliday(id) {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/holidays/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Holiday deleted successfully');
            loadAllHolidays();
        } else {
            alert(result.message || 'Error deleting holiday');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

// ==================== GRIEVANCES FUNCTIONS ====================

let currentGrievanceId = null;

// Load all grievances
async function loadAllGrievances() {
    try {
        const response = await fetch(`${API_BASE_URL}/grievances`);
        const result = await response.json();
        
        const tbody = document.getElementById('grievancesTableBody');
        tbody.innerHTML = '';
        
        if (result.success && result.grievances && result.grievances.length > 0) {
            document.getElementById('totalGrievancesCount').textContent = result.grievances.length;
            
            const pending = result.grievances.filter(g => g.status === 'pending').length;
            const resolved = result.grievances.filter(g => g.status === 'resolved').length;
            
            document.getElementById('pendingGrievancesCount').textContent = pending;
            document.getElementById('resolvedGrievancesCount').textContent = resolved;
            
            result.grievances.forEach(grievance => {
                const row = document.createElement('tr');
                const date = new Date(grievance.created_at);
                
                row.innerHTML = `
                    <td>${grievance.username || 'N/A'}</td>
                    <td>${grievance.subject}</td>
                    <td>${date.toLocaleDateString()}</td>
                    <td><span class="status-badge status-${grievance.status}">${grievance.status}</span></td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="viewGrievance(${grievance.id})">View/Respond</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr class="no-data"><td colspan="5">No grievances found</td></tr>';
            document.getElementById('totalGrievancesCount').textContent = '0';
            document.getElementById('pendingGrievancesCount').textContent = '0';
            document.getElementById('resolvedGrievancesCount').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading grievances:', error);
    }
}

// View grievance details
async function viewGrievance(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/grievances`);
        const result = await response.json();
        
        const grievance = result.grievances.find(g => g.id === id);
        if (!grievance) return;
        
        currentGrievanceId = id;
        const details = document.getElementById('grievanceDetails');
        const date = new Date(grievance.created_at);
        const respDate = grievance.updated_at ? new Date(grievance.updated_at).toLocaleDateString() : 'N/A';
        
        details.innerHTML = `
            <div class="detail-item"><strong>Employee:</strong> ${grievance.username}</div>
            <div class="detail-item"><strong>Subject:</strong> ${grievance.subject}</div>
            <div class="detail-item"><strong>Submission Date:</strong> ${date.toLocaleDateString()}</div>
            <div class="detail-item"><strong>Status:</strong> <span class="status-badge status-${grievance.status}">${grievance.status}</span></div>
            <div class="detail-item"><strong>Description:</strong><br>${grievance.description}</div>
            <div class="detail-item"><strong>Admin Response:</strong><br>${grievance.admin_response || 'No response yet'}</div>
            <div class="detail-item"><strong>Response Date:</strong> ${respDate}</div>
        `;
        
        document.getElementById('grievanceStatus').value = grievance.status;
        document.getElementById('grievanceResponse').value = grievance.admin_response || '';
        
        document.getElementById('grievanceDetailModal').classList.add('show');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Close grievance modal
document.getElementById('closeGrievanceModal')?.addEventListener('click', () => {
    document.getElementById('grievanceDetailModal').classList.remove('show');
    currentGrievanceId = null;
});

// Respond to grievance
document.getElementById('respondGrievanceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        status: document.getElementById('grievanceStatus').value,
        admin_response: document.getElementById('grievanceResponse').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/grievances/${currentGrievanceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Response submitted successfully');
            document.getElementById('grievanceDetailModal').classList.remove('show');
            currentGrievanceId = null;
            loadAllGrievances();
        } else {
            alert(result.message || 'Error submitting response');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
});

// ==================== RESIGNATIONS FUNCTIONS ====================

let currentResignationId = null;

// Load all resignations
async function loadAllResignations() {
    try {
        const response = await fetch(`${API_BASE_URL}/resignations`);
        const result = await response.json();
        
        const tbody = document.getElementById('resignationsTableBody');
        tbody.innerHTML = '';
        
        if (result.success && result.resignations && result.resignations.length > 0) {
            document.getElementById('totalResignationsCount').textContent = result.resignations.length;
            
            const pending = result.resignations.filter(r => r.status === 'pending').length;
            document.getElementById('pendingResignationsCount').textContent = pending;
            
            result.resignations.forEach(resignation => {
                const row = document.createElement('tr');
                const subDate = new Date(resignation.created_at);
                const lwdDate = new Date(resignation.last_working_day);
                
                row.innerHTML = `
                    <td>${resignation.username || 'N/A'}</td>
                    <td>${subDate.toLocaleDateString()}</td>
                    <td>${lwdDate.toLocaleDateString()}</td>
                    <td><span class="status-badge status-${resignation.status}">${resignation.status}</span></td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="viewResignation(${resignation.id})">View/Process</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr class="no-data"><td colspan="5">No resignations found</td></tr>';
            document.getElementById('totalResignationsCount').textContent = '0';
            document.getElementById('pendingResignationsCount').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading resignations:', error);
    }
}

// View resignation details
async function viewResignation(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/resignations`);
        const result = await response.json();
        
        const resignation = result.resignations.find(r => r.id === id);
        if (!resignation) return;
        
        currentResignationId = id;
        const details = document.getElementById('resignationDetails');
        const subDate = new Date(resignation.created_at);
        const lwdDate = new Date(resignation.last_working_day);
        const actionDate = resignation.updated_at ? new Date(resignation.updated_at).toLocaleDateString() : 'N/A';
        
        details.innerHTML = `
            <div class="detail-item"><strong>Employee:</strong> ${resignation.username}</div>
            <div class="detail-item"><strong>Submission Date:</strong> ${subDate.toLocaleDateString()}</div>
            <div class="detail-item"><strong>Last Working Day:</strong> ${lwdDate.toLocaleDateString()}</div>
            <div class="detail-item"><strong>Status:</strong> <span class="status-badge status-${resignation.status}">${resignation.status}</span></div>
            <div class="detail-item"><strong>Reason:</strong><br>${resignation.reason}</div>
            <div class="detail-item"><strong>Admin Notes:</strong><br>${resignation.admin_notes || 'No notes yet'}</div>
            <div class="detail-item"><strong>Action Date:</strong> ${actionDate}</div>
        `;
        
        document.getElementById('resignationStatus').value = resignation.status;
        document.getElementById('resignationNotes').value = resignation.admin_notes || '';
        
        document.getElementById('resignationDetailModal').classList.add('show');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Close resignation modal
document.getElementById('closeResignationModal')?.addEventListener('click', () => {
    document.getElementById('resignationDetailModal').classList.remove('show');
    currentResignationId = null;
});

// Process resignation
document.getElementById('respondResignationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        status: document.getElementById('resignationStatus').value,
        admin_notes: document.getElementById('resignationNotes').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/resignations/${currentResignationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Decision submitted successfully');
            document.getElementById('resignationDetailModal').classList.remove('show');
            currentResignationId = null;
            loadAllResignations();
        } else {
            alert(result.message || 'Error submitting decision');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
});

// ==================== ADD EMPLOYEE FUNCTION ====================

// Load all employees
async function loadAllEmployees() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        const result = await response.json();
        
        const tbody = document.getElementById('employeesTableBody');
        tbody.innerHTML = '';
        
        if (result.success && result.employees && result.employees.length > 0) {
            document.getElementById('totalEmployeesCount').textContent = result.employees.length;
            
            result.employees.forEach(emp => {
                const row = document.createElement('tr');
                
                // Safely create cells
                const cells = [
                    emp.username,
                    emp.full_name || '<em>Not provided</em>',
                    emp.email || '<em>Not provided</em>',
                    emp.position || '<em>Not provided</em>',
                    emp.department || '<em>Not provided</em>',
                    formatDate(emp.created_at)
                ];
                
                cells.forEach(content => {
                    const cell = document.createElement('td');
                    cell.innerHTML = content;
                    row.appendChild(cell);
                });
                
                // Create action buttons safely
                const actionCell = document.createElement('td');
                const editBtn = document.createElement('button');
                editBtn.className = 'btn btn-sm';
                editBtn.textContent = 'Edit';
                editBtn.onclick = () => editEmployee(emp.id, emp.username);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-sm btn-danger';
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => deleteEmployee(emp.id, emp.username);
                
                actionCell.appendChild(editBtn);
                actionCell.appendChild(document.createTextNode(' '));
                actionCell.appendChild(deleteBtn);
                row.appendChild(actionCell);
                
                tbody.appendChild(row);
            });
        } else {
            document.getElementById('totalEmployeesCount').textContent = '0';
            tbody.innerHTML = '<tr class="no-data"><td colspan="7">No employees found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Edit employee
function editEmployee(id, username) {
    document.getElementById('editEmployeeId').value = id;
    document.getElementById('editEmployeeUsername').value = username;
    document.getElementById('editEmployeePassword').value = '';
    document.getElementById('editEmployeeErrorMessage').classList.remove('show');
    document.getElementById('editEmployeeModal').classList.add('show');
}

// Close edit employee modal
document.getElementById('closeEditEmployeeModal')?.addEventListener('click', () => {
    document.getElementById('editEmployeeModal').classList.remove('show');
});

// Update employee form submission
document.getElementById('editEmployeeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const errorMsg = document.getElementById('editEmployeeErrorMessage');
    errorMsg.classList.remove('show');
    
    const id = document.getElementById('editEmployeeId').value;
    const data = {
        username: document.getElementById('editEmployeeUsername').value.trim(),
        password: document.getElementById('editEmployeePassword').value.trim()
    };
    
    if (!data.username) {
        errorMsg.textContent = 'Username is required';
        errorMsg.classList.add('show');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Employee updated successfully');
            document.getElementById('editEmployeeModal').classList.remove('show');
            loadAllEmployees();
            loadEmployeesForSalary();
        } else {
            errorMsg.textContent = result.message || 'Error updating employee';
            errorMsg.classList.add('show');
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.textContent = 'An error occurred';
        errorMsg.classList.add('show');
    }
});

// Delete employee
async function deleteEmployee(id, username) {
    if (!confirm(`Are you sure you want to delete employee "${username}"? This will also delete all their related data (biodata, leaves, salaries, etc.)`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Employee deleted successfully');
            loadAllEmployees();
            loadEmployeesForSalary();
        } else {
            alert(result.message || 'Error deleting employee');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

// Add employee form submission
document.getElementById('addEmployeeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const successMsg = document.getElementById('addEmployeeSuccessMessage');
    const errorMsg = document.getElementById('addEmployeeErrorMessage');
    successMsg.classList.remove('show');
    errorMsg.classList.remove('show');
    
    const data = {
        username: document.getElementById('newUsername').value.trim(),
        password: document.getElementById('newPassword').value.trim()
    };
    
    console.log('Submitting employee data:', { username: data.username, password: '***' });
    
    // Validate required fields
    if (!data.username || !data.password) {
        errorMsg.textContent = 'Username and password are required';
        errorMsg.classList.add('show');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/add-employee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            successMsg.textContent = result.message;
            successMsg.classList.add('show');
            document.getElementById('addEmployeeForm').reset();
            
            // Reload employee lists
            loadAllEmployees();
            loadEmployeesForSalary();
        } else {
            errorMsg.textContent = result.message || 'Error adding employee';
            errorMsg.classList.add('show');
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.textContent = 'An error occurred';
        errorMsg.classList.add('show');
    }
});

// Make functions globally accessible
window.deleteSalary = deleteSalary;
window.deleteHoliday = deleteHoliday;
window.viewGrievance = viewGrievance;
window.viewResignation = viewResignation;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;

// Initial load
loadAllLeaveApplications();
