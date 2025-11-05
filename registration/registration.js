/**
 * Alumni Registration System
 * Step-by-step conversational interface
 */

const API_URL = window.API_BASE_URL || 'http://localhost:5000';

// Registration state
const registrationData = {
    degree: '',
    department: '',
    batch: '',
    name: '',
    admissionNumber: '',
    email: '',
    phone: '',
    password: ''
};

let currentStep = 0;

// Steps configuration
const steps = [
    {
        id: 'welcome',
        botMessage: 'Hello, Alumni!!',
        action: () => nextStep()
    },
    {
        id: 'degree',
        botMessage: 'To start, please select your Degree from the options below.',
        type: 'select',
        options: ['B.E', 'M.E', 'B.Tech', 'M.Tech', 'MBA', 'MCA'],
        field: 'degree'
    },
    {
        id: 'department',
        botMessage: 'Thank you for selecting {degree}. Now, please choose your Department.',
        type: 'select',
        options: [
            'Computer Science and Engineering',
            'Electronics and Communication Engineering',
            'Electrical and Electronics Engineering',
            'Mechanical Engineering',
            'Civil Engineering',
            'Information Technology',
            'Automobile Engineering',
            'Biomedical Engineering'
        ],
        field: 'department'
    },
    {
        id: 'batch',
        botMessage: 'Noted: {department}. Now please select your Batch (Graduation Year range).',
        type: 'select',
        options: generateBatchOptions(),
        field: 'batch'
    },
    {
        id: 'name',
        botMessage: '✨ Now, kindly enter your Name (Eg: Sankara Narayanan). Try searching: Sankar or Narayananan. We recommend to try with your first name or last name.',
        type: 'input',
        placeholder: 'Enter your full name',
        field: 'name'
    },
    {
        id: 'admissionNumber',
        botMessage: 'Great! Now please enter your Admission Number.',
        type: 'input',
        placeholder: 'Enter your admission number',
        field: 'admissionNumber',
        verify: true // This step needs backend verification
    },
    {
        id: 'email',
        botMessage: '✅ Verified! Now let\'s complete your profile. Please enter your Email address.',
        type: 'input',
        inputType: 'email',
        placeholder: 'Enter your email',
        field: 'email'
    },
    {
        id: 'phone',
        botMessage: 'Perfect! Now enter your Phone number.',
        type: 'input',
        inputType: 'tel',
        placeholder: 'Enter your phone number',
        field: 'phone'
    },
    {
        id: 'password',
        botMessage: 'Almost done! Create a Password for your account.',
        type: 'input',
        inputType: 'password',
        placeholder: 'Enter password (min 6 characters)',
        field: 'password'
    },
    {
        id: 'confirmPassword',
        botMessage: 'Finally, Confirm your Password.',
        type: 'input',
        inputType: 'password',
        placeholder: 'Confirm your password',
        field: 'confirmPassword',
        complete: true
    }
];

// Generate batch options (last 10 years)
function generateBatchOptions() {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let i = 0; i < 10; i++) {
        const endYear = currentYear - i;
        const startYear = endYear - 4;
        options.push(`${startYear}-${endYear}`);
    }
    return options;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    startRegistration();
});

function startRegistration() {
    currentStep = 0;
    showStep(currentStep);
}

function showStep(stepIndex) {
    const step = steps[stepIndex];
    
    // Add bot message
    let message = step.botMessage;
    // Replace placeholders
    Object.keys(registrationData).forEach(key => {
        message = message.replace(`{${key}}`, registrationData[key]);
    });
    
    addBotMessage(message);
    
    // Show appropriate input
    setTimeout(() => {
        if (step.type === 'select') {
            showSelectInput(step);
        } else if (step.type === 'input') {
            showTextInput(step);
        } else {
            // Welcome step, just move to next
            if (step.action) {
                setTimeout(step.action, 1000);
            }
        }
    }, 500);
}

function addBotMessage(text) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.innerHTML = `
        <div class="avatar bot">AI</div>
        <div class="message-content">${text}</div>
    `;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

function addUserMessage(text) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        <div class="message-content">${text}</div>
        <div class="avatar user">👤</div>
    `;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

function showSelectInput(step) {
    const inputContainer = document.getElementById('inputContainer');
    
    const selectHTML = `
        <div class="input-group">
            <select id="stepInput" class="step-select">
                <option value="">Select ${step.field}</option>
                ${step.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
            <button class="send-btn" onclick="handleSubmit()">▶</button>
        </div>
    `;
    
    inputContainer.innerHTML = selectHTML;
    document.getElementById('stepInput').focus();
}

function showTextInput(step) {
    const inputContainer = document.getElementById('inputContainer');
    const inputType = step.inputType || 'text';
    
    const inputHTML = `
        <div class="input-group">
            <input 
                type="${inputType}" 
                id="stepInput" 
                placeholder="${step.placeholder}" 
                class="step-input"
            />
            <button class="send-btn" onclick="handleSubmit()">▶</button>
        </div>
    `;
    
    inputContainer.innerHTML = inputHTML;
    
    // Allow Enter key to submit
    document.getElementById('stepInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    });
    
    document.getElementById('stepInput').focus();
}

async function handleSubmit() {
    const input = document.getElementById('stepInput');
    const value = input.value.trim();
    
    if (!value) {
        alert('Please provide a value!');
        return;
    }
    
    const step = steps[currentStep];
    
    // Validate based on step
    if (step.field === 'email' && !isValidEmail(value)) {
        alert('❌ Please enter a valid email address!');
        return;
    }
    
    if (step.field === 'phone' && !isValidPhone(value)) {
        alert('❌ Please enter a valid 10-digit phone number!');
        return;
    }
    
    if (step.field === 'password') {
        const passwordError = validatePassword(value);
        if (passwordError) {
            alert(passwordError);
            return;
        }
    }
    
    if (step.field === 'name' && value.length < 2) {
        alert('❌ Name must be at least 2 characters long!');
        return;
    }
    
    if (step.field === 'admissionNumber' && value.length < 3) {
        alert('❌ Please enter a valid admission number!');
        return;
    }
    
    if (step.field === 'confirmPassword' && value !== registrationData.password) {
        alert('❌ Passwords do not match!');
        return;
    }
    
    // Sanitize input before saving (prevent XSS)
    const sanitizedValue = sanitizeInput(value);
    
    // Save data
    registrationData[step.field] = sanitizedValue;
    
    // Show user response (display original for password fields, sanitized for others)
    const displayValue = step.inputType === 'password' ? '••••••••' : sanitizedValue;
    addUserMessage(displayValue);
    
    // Clear input
    document.getElementById('inputContainer').innerHTML = '';
    
    // Handle verification step
    if (step.verify) {
        await verifyStudent();
        return;
    }
    
    // Handle completion
    if (step.complete) {
        await completeRegistration();
        return;
    }
    
    // Move to next step
    nextStep();
}

async function verifyStudent() {
    addBotMessage('🔍 Verifying your details<span class="loading"></span>');
    
    try {
        const response = await fetch(`${API_URL}/api/verify-student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                degree: registrationData.degree,
                department: registrationData.department,
                batch: registrationData.batch,
                name: registrationData.name,
                admissionNumber: registrationData.admissionNumber
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            addBotMessage('✅ Student verified! You are in our records.');
            setTimeout(nextStep, 1500);
        } else {
            addBotMessage('❌ Student not found in our database. Please check your details or contact admin.');
            document.getElementById('inputContainer').innerHTML = `
                <button class="option-btn" onclick="location.reload()">Try Again</button>
                <button class="option-btn" onclick="location.href='../login/login_page.html'">Back to Login</button>
            `;
        }
    } catch (error) {
        console.error('Verification error:', error);
        addBotMessage('❌ Error verifying student. Please try again later.');
    }
}

async function completeRegistration() {
    addBotMessage('📝 Creating your account<span class="loading"></span>');
    
    try {
        const response = await fetch(`${API_URL}/api/register-alumni`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            addBotMessage('🎉 Registration successful! Redirecting to login page...');
            setTimeout(() => {
                window.location.href = '../login/login_page.html';
            }, 2000);
        } else {
            addBotMessage('❌ Registration failed: ' + data.message);
            document.getElementById('inputContainer').innerHTML = `
                <button class="option-btn" onclick="location.reload()">Try Again</button>
            `;
        }
    } catch (error) {
        console.error('Registration error:', error);
        addBotMessage('❌ Error completing registration. Please try again later.');
    }
}

function nextStep() {
    currentStep++;
    if (currentStep < steps.length) {
        showStep(currentStep);
    }
}

function scrollToBottom() {
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function refreshPage() {
    if (confirm('Are you sure you want to start over?')) {
        location.reload();
    }
}

// Validation helpers
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[0-9]{10}$/.test(phone.replace(/\s/g, ''));
}

function validatePassword(password) {
    if (password.length < 8) {
        return '❌ Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
        return '❌ Password must contain at least one uppercase letter (A-Z).';
    }
    if (!/[a-z]/.test(password)) {
        return '❌ Password must contain at least one lowercase letter (a-z).';
    }
    if (!/[0-9]/.test(password)) {
        return '❌ Password must contain at least one number (0-9).';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return '❌ Password must contain at least one special character (!@#$%^&* etc).';
    }
    return null; // No error
}

function sanitizeInput(input) {
    if (!input) return input;
    return String(input)
        .replace(/[<>]/g, '') // Remove < and > to prevent XSS
        .trim();
}
