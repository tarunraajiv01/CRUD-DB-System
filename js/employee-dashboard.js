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

// Initial load
loadLeaveApplications();
