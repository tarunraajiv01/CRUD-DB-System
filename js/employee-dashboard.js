// Employee Dashboard Functionality
const API_BASE_URL = 'http://localhost:3000/api';

// Check authentication
const user = JSON.parse(sessionStorage.getItem('user'));
if (!user || user.user_type !== 'employee') {
    window.location.href = 'employee-login.html';
}

// DOM Elements
const usernameEl = document.getElementById('username');
const pageTitleEl = document.getElementById('pageTitle');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

// Leave elements
const leaveTab = document.getElementById('leaveTab');
const addLeaveBtn = document.getElementById('addLeaveBtn');
const leaveModal = document.getElementById('leaveModal');
const closeLeaveModal = document.getElementById('closeLeaveModal');
const leaveForm = document.getElementById('leaveForm');
const leaveTableBody = document.getElementById('leaveTableBody');
const leaveModalTitle = document.getElementById('leaveModalTitle');
const leaveErrorMessage = document.getElementById('leaveErrorMessage');

// Biodata elements
const biodataTab = document.getElementById('biodataTab');
const addBiodataBtn = document.getElementById('addBiodataBtn');
const biodataModal = document.getElementById('biodataModal');
const closeBiodataModal = document.getElementById('closeBiodataModal');
const biodataForm = document.getElementById('biodataForm');
const biodataTableBody = document.getElementById('biodataTableBody');
const biodataModalTitle = document.getElementById('biodataModalTitle');
const biodataErrorMessage = document.getElementById('biodataErrorMessage');

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
            pageTitleEl.textContent = 'Leave Management';
            loadLeaveApplications();
        } else if (tabName === 'biodata') {
            pageTitleEl.textContent = 'My Biodata';
            loadBiodata();
        } else if (tabName === 'salary') {
            pageTitleEl.textContent = 'My Salary';
            loadSalaryRecords();
        } else if (tabName === 'holidays') {
            pageTitleEl.textContent = 'Holiday Calendar';
            loadHolidays();
        } else if (tabName === 'grievances') {
            pageTitleEl.textContent = 'My Grievances';
            loadGrievances();
        } else if (tabName === 'resignation') {
            pageTitleEl.textContent = 'Resignation';
            loadResignation();
        }
    });
});

// Logout
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('user');
    window.location.href = 'employee-login.html';
});

// ==================== Leave Management ====================

// Open leave modal for adding
addLeaveBtn.addEventListener('click', () => {
    leaveModalTitle.textContent = 'Apply for Leave';
    leaveForm.reset();
    document.getElementById('leaveId').value = '';
    leaveModal.classList.add('show');
});

// Close leave modal
closeLeaveModal.addEventListener('click', () => {
    leaveModal.classList.remove('show');
    leaveForm.reset();
    leaveErrorMessage.classList.remove('show');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === leaveModal) {
        leaveModal.classList.remove('show');
        leaveForm.reset();
        leaveErrorMessage.classList.remove('show');
    }
    if (e.target === biodataModal) {
        biodataModal.classList.remove('show');
        biodataForm.reset();
        biodataErrorMessage.classList.remove('show');
    }
});

// Submit leave form
leaveForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    leaveErrorMessage.classList.remove('show');
    
    const formData = new FormData(leaveForm);
    const leaveId = formData.get('leaveId');
    
    const data = {
        employee_id: user.id,
        leave_type: formData.get('leaveType'),
        start_date: formData.get('startDate'),
        end_date: formData.get('endDate'),
        reason: formData.get('reason')
    };
    
    if (leaveId) {
        data.id = leaveId;
    }
    
    try {
        const url = leaveId ? `${API_BASE_URL}/leave/${leaveId}` : `${API_BASE_URL}/leave`;
        const method = leaveId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            leaveModal.classList.remove('show');
            leaveForm.reset();
            loadLeaveApplications();
        } else {
            leaveErrorMessage.textContent = result.message || 'An error occurred.';
            leaveErrorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Error:', error);
        leaveErrorMessage.textContent = 'An error occurred. Please try again.';
        leaveErrorMessage.classList.add('show');
    }
});

// Load leave applications
async function loadLeaveApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/leave?employee_id=${user.id}`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            leaveTableBody.innerHTML = result.data.map(leave => `
                <tr>
                    <td>${leave.leave_type}</td>
                    <td>${formatDate(leave.start_date)}</td>
                    <td>${formatDate(leave.end_date)}</td>
                    <td>${leave.reason}</td>
                    <td><span class="status-badge ${leave.status}">${leave.status}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon-only btn-edit" onclick="editLeave(${leave.id})" title="Edit">
                                ✏️
                            </button>
                            <button class="btn-icon-only btn-delete" onclick="deleteLeave(${leave.id})" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            leaveTableBody.innerHTML = '<tr class="no-data"><td colspan="6">No leave applications found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading leave applications:', error);
        leaveTableBody.innerHTML = '<tr class="no-data"><td colspan="6">Error loading data</td></tr>';
    }
}

// Edit leave
window.editLeave = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/leave?id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            const leave = result.data;
            leaveModalTitle.textContent = 'Edit Leave Application';
            document.getElementById('leaveId').value = leave.id;
            document.getElementById('leaveType').value = leave.leave_type;
            document.getElementById('startDate').value = formatDateForInput(leave.start_date);
            document.getElementById('endDate').value = formatDateForInput(leave.end_date);
            document.getElementById('reason').value = leave.reason;
            leaveModal.classList.add('show');
        }
    } catch (error) {
        console.error('Error loading leave:', error);
        alert('Error loading leave application');
    }
};

// Delete leave
window.deleteLeave = async (id) => {
    if (!confirm('Are you sure you want to delete this leave application?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/leave/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadLeaveApplications();
        } else {
            alert(result.message || 'Error deleting leave application');
        }
    } catch (error) {
        console.error('Error deleting leave:', error);
        alert('Error deleting leave application');
    }
};

// ==================== Biodata Management ====================

// Open biodata modal for adding
addBiodataBtn.addEventListener('click', () => {
    biodataModalTitle.textContent = 'Add Biodata';
    biodataForm.reset();
    document.getElementById('biodataId').value = '';
    biodataModal.classList.add('show');
});

// Close biodata modal
closeBiodataModal.addEventListener('click', () => {
    biodataModal.classList.remove('show');
    biodataForm.reset();
    biodataErrorMessage.classList.remove('show');
});

// Submit biodata form
biodataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    biodataErrorMessage.classList.remove('show');
    
    const formData = new FormData(biodataForm);
    const biodataId = formData.get('biodataId');
    
    const data = {
        employee_id: user.id,
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
    
    if (biodataId) {
        data.id = biodataId;
    }
    
    try {
        const url = biodataId ? `${API_BASE_URL}/biodata/${biodataId}` : `${API_BASE_URL}/biodata`;
        const method = biodataId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            biodataModal.classList.remove('show');
            biodataForm.reset();
            loadBiodata();
        } else {
            biodataErrorMessage.textContent = result.message || 'An error occurred.';
            biodataErrorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Error:', error);
        biodataErrorMessage.textContent = 'An error occurred. Please try again.';
        biodataErrorMessage.classList.add('show');
    }
});

// Load biodata
async function loadBiodata() {
    try {
        const response = await fetch(`${API_BASE_URL}/biodata?employee_id=${user.id}`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            biodataTableBody.innerHTML = result.data.map(bio => `
                <tr>
                    <td>${bio.full_name}</td>
                    <td>${bio.email}</td>
                    <td>${bio.phone}</td>
                    <td>${bio.position}</td>
                    <td>${bio.department}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon-only btn-edit" onclick="editBiodata(${bio.id})" title="Edit">
                                ✏️
                            </button>
                            <button class="btn-icon-only btn-delete" onclick="deleteBiodata(${bio.id})" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            biodataTableBody.innerHTML = '<tr class="no-data"><td colspan="6">No biodata found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading biodata:', error);
        biodataTableBody.innerHTML = '<tr class="no-data"><td colspan="6">Error loading data</td></tr>';
    }
}

// Edit biodata
window.editBiodata = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/biodata?id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            const bio = result.data;
            biodataModalTitle.textContent = 'Edit Biodata';
            document.getElementById('biodataId').value = bio.id;
            document.getElementById('fullName').value = bio.full_name;
            document.getElementById('email').value = bio.email;
            document.getElementById('phone').value = bio.phone;
            document.getElementById('address').value = bio.address;
            document.getElementById('dateOfBirth').value = formatDateForInput(bio.date_of_birth);
            document.getElementById('gender').value = bio.gender;
            document.getElementById('position').value = bio.position;
            document.getElementById('department').value = bio.department;
            document.getElementById('joiningDate').value = formatDateForInput(bio.joining_date);
            biodataModal.classList.add('show');
        }
    } catch (error) {
        console.error('Error loading biodata:', error);
        alert('Error loading biodata');
    }
};

// Delete biodata
window.deleteBiodata = async (id) => {
    if (!confirm('Are you sure you want to delete this biodata?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/biodata/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadBiodata();
        } else {
            alert(result.message || 'Error deleting biodata');
        }
    } catch (error) {
        console.error('Error deleting biodata:', error);
        alert('Error deleting biodata');
    }
};

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

// ==================== SALARY FUNCTIONS ====================

// Load salary records
async function loadSalaryRecords() {
    try {
        const response = await fetch(`${API_BASE_URL}/salaries/employee/${user.id}`);
        const result = await response.json();
        
        const tbody = document.getElementById('salaryTableBody');
        tbody.innerHTML = '';
        
        if (result.success && result.salaries && result.salaries.length > 0) {
            document.getElementById('salaryRecordsCount').textContent = result.salaries.length;
            
            const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            
            result.salaries.forEach(salary => {
                const row = document.createElement('tr');
                const payDate = new Date(salary.payment_date);
                
                row.innerHTML = `
                    <td>${monthNames[salary.month]}</td>
                    <td>${salary.year}</td>
                    <td>$${parseFloat(salary.basic_salary).toFixed(2)}</td>
                    <td>$${parseFloat(salary.allowances).toFixed(2)}</td>
                    <td>$${parseFloat(salary.deductions).toFixed(2)}</td>
                    <td><strong>$${parseFloat(salary.net_salary).toFixed(2)}</strong></td>
                    <td>${payDate.toLocaleDateString()}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr class="no-data"><td colspan="7">No salary records found</td></tr>';
            document.getElementById('salaryRecordsCount').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading salary records:', error);
    }
}

// ==================== HOLIDAYS FUNCTIONS ====================

// Load holidays
async function loadHolidays() {
    try {
        const currentYear = new Date().getFullYear();
        const response = await fetch(`${API_BASE_URL}/holidays/year/${currentYear}`);
        const result = await response.json();
        
        const tbody = document.getElementById('holidaysTableBody');
        tbody.innerHTML = '';
        
        if (result.success && result.holidays && result.holidays.length > 0) {
            document.getElementById('holidaysCount').textContent = result.holidays.length;
            
            result.holidays.forEach(holiday => {
                const row = document.createElement('tr');
                const date = new Date(holiday.holiday_date);
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const day = dayNames[date.getDay()];
                
                row.innerHTML = `
                    <td>${holiday.holiday_name}</td>
                    <td>${date.toLocaleDateString()}</td>
                    <td>${day}</td>
                    <td>${holiday.description || 'N/A'}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr class="no-data"><td colspan="4">No holidays found</td></tr>';
            document.getElementById('holidaysCount').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading holidays:', error);
    }
}

// ==================== GRIEVANCES FUNCTIONS ====================

// Add grievance button
document.getElementById('addGrievanceBtn')?.addEventListener('click', () => {
    document.getElementById('grievanceModalTitle').textContent = 'Submit Grievance';
    document.getElementById('grievanceForm').reset();
    document.getElementById('grievanceErrorMessage').classList.remove('show');
    document.getElementById('grievanceViewMode').style.display = 'none';
    document.getElementById('grievanceForm').style.display = 'block';
    document.getElementById('grievanceModal').classList.add('show');
});

// Close grievance modal
document.getElementById('closeGrievanceModal')?.addEventListener('click', () => {
    document.getElementById('grievanceModal').classList.remove('show');
});

// Load grievances
async function loadGrievances() {
    try {
        const response = await fetch(`${API_BASE_URL}/grievances/employee/${user.id}`);
        const result = await response.json();
        
        const tbody = document.getElementById('grievancesTableBody');
        tbody.innerHTML = '';
        
        if (result.success && result.grievances && result.grievances.length > 0) {
            document.getElementById('myGrievancesCount').textContent = result.grievances.length;
            
            const pending = result.grievances.filter(g => g.status === 'pending').length;
            document.getElementById('pendingGrievancesCount').textContent = pending;
            
            result.grievances.forEach(grievance => {
                const row = document.createElement('tr');
                const date = new Date(grievance.created_at);
                
                row.innerHTML = `
                    <td>${grievance.subject}</td>
                    <td>${date.toLocaleDateString()}</td>
                    <td><span class="status-badge status-${grievance.status}">${grievance.status}</span></td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="viewGrievanceDetails(${grievance.id})">View Details</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr class="no-data"><td colspan="4">No grievances found</td></tr>';
            document.getElementById('myGrievancesCount').textContent = '0';
            document.getElementById('pendingGrievancesCount').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading grievances:', error);
    }
}

// View grievance details
async function viewGrievanceDetails(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/grievances/employee/${user.id}`);
        const result = await response.json();
        
        const grievance = result.grievances.find(g => g.id === id);
        if (!grievance) return;
        
        const date = new Date(grievance.created_at);
        const respDate = grievance.updated_at ? new Date(grievance.updated_at).toLocaleDateString() : 'N/A';
        
        const detailsHtml = `
            <div class="detail-item"><strong>Subject:</strong> ${grievance.subject}</div>
            <div class="detail-item"><strong>Submission Date:</strong> ${date.toLocaleDateString()}</div>
            <div class="detail-item"><strong>Status:</strong> <span class="status-badge status-${grievance.status}">${grievance.status}</span></div>
            <div class="detail-item"><strong>Description:</strong><br>${grievance.description}</div>
            <div class="detail-item"><strong>Admin Response:</strong><br>${grievance.admin_response || 'No response yet'}</div>
            <div class="detail-item"><strong>Response Date:</strong> ${respDate}</div>
        `;
        
        document.getElementById('grievanceDetailsView').innerHTML = detailsHtml;
        document.getElementById('grievanceModalTitle').textContent = 'Grievance Details';
        document.getElementById('grievanceForm').style.display = 'none';
        document.getElementById('grievanceViewMode').style.display = 'block';
        document.getElementById('grievanceModal').classList.add('show');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Close grievance view
document.getElementById('closeGrievanceView')?.addEventListener('click', () => {
    document.getElementById('grievanceModal').classList.remove('show');
});

// Submit grievance form
document.getElementById('grievanceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const errorMsg = document.getElementById('grievanceErrorMessage');
    errorMsg.classList.remove('show');
    
    const data = {
        employee_id: user.id,
        subject: document.getElementById('grievanceSubject').value.trim(),
        description: document.getElementById('grievanceDescription').value.trim()
    };
    
    console.log('Submitting grievance:', data);
    
    // Validate required fields
    if (!data.subject || !data.description) {
        errorMsg.textContent = 'Subject and description are required';
        errorMsg.classList.add('show');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/grievances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Grievance submitted successfully');
            document.getElementById('grievanceModal').classList.remove('show');
            document.getElementById('grievanceForm').reset();
            loadGrievances();
        } else {
            errorMsg.textContent = result.message || 'Error submitting grievance';
            errorMsg.classList.add('show');
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.textContent = 'An error occurred';
        errorMsg.classList.add('show');
    }
});

// ==================== RESIGNATION FUNCTIONS ====================

// Submit resignation button
document.getElementById('submitResignationBtn')?.addEventListener('click', () => {
    document.getElementById('resignationForm').reset();
    document.getElementById('resignationErrorMessage').classList.remove('show');
    
    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = formatDateForInput(tomorrow);
    document.getElementById('lastWorkingDay').min = minDate;
    
    document.getElementById('resignationModal').classList.add('show');
});

// Close resignation modal
document.getElementById('closeResignationModal')?.addEventListener('click', () => {
    document.getElementById('resignationModal').classList.remove('show');
});

// Load resignation
async function loadResignation() {
    try {
        const response = await fetch(`${API_BASE_URL}/resignations/employee/${user.id}`);
        const result = await response.json();
        
        const tbody = document.getElementById('resignationTableBody');
        tbody.innerHTML = '';
        
        if (result.success && result.resignations && result.resignations.length > 0) {
            const resignation = result.resignations[0]; // Get the latest one
            const status = resignation.status.charAt(0).toUpperCase() + resignation.status.slice(1);
            document.getElementById('resignationStatusText').textContent = status;
            
            const subDate = new Date(resignation.created_at);
            const lwdDate = new Date(resignation.last_working_day);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subDate.toLocaleDateString()}</td>
                <td>${lwdDate.toLocaleDateString()}</td>
                <td><span class="status-badge status-${resignation.status}">${resignation.status}</span></td>
                <td>${resignation.admin_notes || 'N/A'}</td>
            `;
            tbody.appendChild(row);
            
            // Disable submit button if already has pending resignation
            if (resignation.status === 'pending') {
                document.getElementById('submitResignationBtn').disabled = true;
                document.getElementById('submitResignationBtn').textContent = 'Resignation Pending';
            } else {
                document.getElementById('submitResignationBtn').disabled = false;
                document.getElementById('submitResignationBtn').textContent = 'Submit Resignation';
            }
        } else {
            tbody.innerHTML = '<tr class="no-data"><td colspan="4">No resignation submitted</td></tr>';
            document.getElementById('resignationStatusText').textContent = 'No Active Resignation';
            document.getElementById('submitResignationBtn').disabled = false;
            document.getElementById('submitResignationBtn').textContent = 'Submit Resignation';
        }
    } catch (error) {
        console.error('Error loading resignation:', error);
    }
}

// Submit resignation form
document.getElementById('resignationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const errorMsg = document.getElementById('resignationErrorMessage');
    errorMsg.classList.remove('show');
    
    const data = {
        employee_id: user.id,
        reason: document.getElementById('resignationReason').value.trim(),
        last_working_day: document.getElementById('lastWorkingDay').value
    };
    
    console.log('Submitting resignation:', data);
    
    // Validate required fields
    if (!data.reason || !data.last_working_day) {
        errorMsg.textContent = 'Reason and last working day are required';
        errorMsg.classList.add('show');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/resignations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Resignation submitted successfully');
            document.getElementById('resignationModal').classList.remove('show');
            document.getElementById('resignationForm').reset();
            loadResignation();
        } else {
            errorMsg.textContent = result.message || 'Error submitting resignation';
            errorMsg.classList.add('show');
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.textContent = 'An error occurred';
        errorMsg.classList.add('show');
    }
});

// Make function globally accessible
window.viewGrievanceDetails = viewGrievanceDetails;

// Initial load
loadLeaveApplications();
