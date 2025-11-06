/**
 * ALUMNI PROFILE - ENHANCED WITH DARK MODE
 */

// ============= DARK MODE FUNCTIONALITY =============
const DarkMode = {
  THEME_KEY: 'alumni_theme',
  
  init() {
    const saved = localStorage.getItem(this.THEME_KEY) || 'light';
    this.apply(saved);
    this.addToggle();
  },
  
  apply(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(this.THEME_KEY, theme);
    const icon = theme === 'dark' ? '☀️' : '🌙';
    const btn = document.getElementById('darkModeToggle');
    if (btn) btn.textContent = icon;
  },
  
  toggle() {
    const current = document.body.getAttribute('data-theme') || 'light';
    this.apply(current === 'dark' ? 'light' : 'dark');
  },
  
  addToggle() {
    // Button is already in HTML, just set up the click handler
    const btn = document.getElementById('darkModeToggle');
    if (btn) {
      btn.onclick = () => this.toggle();
    }
  }
};

// ============= KEYBOARD SHORTCUTS =============
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + D: Toggle dark mode
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault();
    DarkMode.toggle();
  }
});

// ============= LOAD PROFILE DATA =============
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
const loggedInUser = sessionStorage.getItem('loggedInUser');
console.log("Fetching profile for:", loggedInUser);

fetch(`${API_BASE_URL}/profile/${loggedInUser}`)
  .then(response => {
    console.log("Profile response status:", response.status);
    return response.json();
  })
  .then(data => {
    console.log("Profile data:", data);
    
    // Handle new API format: {success: true, alumni: {...}}
    const profileData = data.success ? data.alumni : data;
    
    if (!profileData || data.message === 'Profile not found') {
      document.getElementById('alumni_name').textContent = 'Profile not found';
      return;
    }
    
    // Fill profile view
    document.getElementById('alumni_name').textContent = profileData.name || '';
    document.getElementById('alumni_gender').textContent = profileData.gender || '';
    document.getElementById('alumni_dob').textContent = profileData.dob || '';
    document.getElementById('alumni_id').textContent = profileData.alumni_id || '';
    document.getElementById('alumni_batch').textContent = profileData.batch || '';
    document.getElementById('alumni_department').textContent = profileData.department || '';
    document.getElementById('alumni_address').textContent = profileData.address || '';
    document.getElementById('alumni_city').textContent = profileData.city || '';
    document.getElementById('alumni_district').textContent = profileData.district || '';
    document.getElementById('alumni_pincode').textContent = profileData.pincode || '';
    document.getElementById('alumni_phone').textContent = profileData.phone || '';
    document.getElementById('alumni_email').textContent = profileData.email || '';
    document.getElementById('alumni_designation').textContent = profileData.designation || '';
    document.getElementById('alumni_company').textContent = profileData.company || '';

    // Fill edit form fields
    document.getElementById('edit_name').value = profileData.name || '';
    document.getElementById('edit_gender').value = profileData.gender || '';
    document.getElementById('edit_dob').value = profileData.dob || '';
    document.getElementById('edit_id').value = profileData.alumni_id || '';
    document.getElementById('edit_batch').value = profileData.batch || '';
    document.getElementById('edit_department').value = profileData.department || '';
    document.getElementById('edit_address').value = profileData.address || '';
    document.getElementById('edit_city').value = profileData.city || '';
    document.getElementById('edit_district').value = profileData.district || '';
    document.getElementById('edit_pincode').value = profileData.pincode || '';
    document.getElementById('edit_phone').value = profileData.phone || '';
    document.getElementById('edit_email').value = profileData.email || '';
    document.getElementById('edit_designation').value = profileData.designation || '';
    document.getElementById('edit_company').value = profileData.company || '';
  })
  .catch(err => {
    document.getElementById('alumni_name').textContent = 'Error fetching profile';
    console.error('Error fetching alumni profile:', err);
  });

// ============= INITIALIZE DARK MODE =============
document.addEventListener('DOMContentLoaded', () => {
  DarkMode.init();
  console.log('Dark mode initialized. Press Ctrl+D to toggle!');
});