// Admin Login and Signup Functionality
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const signupModal = document.getElementById('signupModal');
const signupToggle = document.getElementById('signupToggle');
const closeModal = document.getElementById('closeModal');
const errorMessage = document.getElementById('errorMessage');
const signupErrorMessage = document.getElementById('signupErrorMessage');

// Show signup modal
signupToggle.addEventListener('click', (e) => {
    e.preventDefault();
    signupModal.classList.add('show');
});

// Close modal
closeModal.addEventListener('click', () => {
    signupModal.classList.remove('show');
    signupForm.reset();
    signupErrorMessage.classList.remove('show');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === signupModal) {
        signupModal.classList.remove('show');
        signupForm.reset();
        signupErrorMessage.classList.remove('show');
    }
});

// Login Form Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.classList.remove('show');
    
    const formData = new FormData(loginForm);
    const data = {
        username: formData.get('username'),
        password: formData.get('password'),
        user_type: 'admin'
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store user data in session
            sessionStorage.setItem('user', JSON.stringify(result.user));
            // Redirect to admin dashboard
            window.location.href = 'admin-dashboard.html';
        } else {
            errorMessage.textContent = result.message || 'Login failed. Please check your credentials.';
            errorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'An error occurred. Please try again.';
        errorMessage.classList.add('show');
    }
});

// Signup Form Submit
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupErrorMessage.classList.remove('show');
    
    const formData = new FormData(signupForm);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        signupErrorMessage.textContent = 'Passwords do not match.';
        signupErrorMessage.classList.add('show');
        return;
    }
    
    const data = {
        username: formData.get('username'),
        password: password,
        user_type: 'admin'
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Signup successful! Please login with your credentials.');
            signupModal.classList.remove('show');
            signupForm.reset();
        } else {
            signupErrorMessage.textContent = result.message || 'Signup failed. Please try again.';
            signupErrorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Signup error:', error);
        signupErrorMessage.textContent = 'An error occurred. Please try again.';
        signupErrorMessage.classList.add('show');
    }
});
