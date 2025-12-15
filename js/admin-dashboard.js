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
        }
    });
});

// Logout
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('user');
    window.location.href = 'admin-login.html';
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
            // Update stats
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

// Initial load
loadAllLeaveApplications();
