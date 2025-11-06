// Proudable Alumni Display Page JavaScript

// Dark Mode Implementation
const DarkMode = {
    init() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
        }
        this.createToggleButton();
        this.addKeyboardShortcut();
    },
    
    toggle() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
    },
    
    createToggleButton() {
        // Button is already in HTML, just set up the click handler
        const btn = document.getElementById('darkModeToggle');
        if (btn) {
            btn.setAttribute('aria-label', 'Toggle Dark Mode');
            btn.onclick = () => {
                this.toggle();
                btn.innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
            };
            
            if (document.body.classList.contains('dark-mode')) {
                btn.innerHTML = '☀️';
            }
        }
    },
    
    addKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggle();
                const btn = document.getElementById('darkModeToggle');
                if (btn) {
                    btn.innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    DarkMode.init();
    loadProudableAlumni();
});

async function loadProudableAlumni() {
    const grid = document.getElementById('proudableGrid');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/proudable-alumni`);
        
        if (!response.ok) {
            throw new Error('Failed to load proudable alumni');
        }
        
        const alumni = await response.json();
        
        if (alumni.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🌟</div>
                    <h2>No Proudable Alumni Yet</h2>
                    <p>Distinguished alumni information will be displayed here soon.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = alumni.map(person => `
            <div class="proudable-card">
                <div class="proudable-photo">
                    <img src="${person.photo || '../images/user.png'}" 
                         alt="${person.name}"
                         onerror="this.src='../images/user.png'">
                </div>
                <div class="proudable-content">
                    <div class="proudable-batch">${person.batch || 'Alumni'}</div>
                    <h2 class="proudable-name">${person.name}</h2>
                    <div class="proudable-designation">${person.designation}</div>
                    ${person.company ? `
                        <div class="proudable-company">${person.company}</div>
                    ` : ''}
                    ${person.achievements ? `
                        <div class="proudable-achievements">
                            <h4>🏆 Key Achievements</h4>
                            <p>${person.achievements}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading proudable alumni:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h2>Error Loading Proudable Alumni</h2>
                <p>${error.message}</p>
                <button onclick="loadProudableAlumni()" style="margin-top:20px;padding:10px 20px;background:#1651a7;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}
