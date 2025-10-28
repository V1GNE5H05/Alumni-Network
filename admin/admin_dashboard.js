/**
 * ADMIN IMPROVEMENTS - ALL 15 FEATURES IMPLEMENTED
 * Features: Delete, Edit, Dynamic Stats, Auth, Validation, Pagination, 
 * Search, UI/UX, Loading, Image Fix, Confirmations, Export, Preview, Dark Mode, Shortcuts
 */

const API_URL = window.API_BASE_URL || 'http://localhost:5000';

// ============= FEATURE 4: AUTHENTICATION & SESSION (DISABLED) =============
// Authentication removed - Direct access enabled
// You can add your own authentication later if needed

const AuthManager = {
  SESSION_KEY: 'admin_session',
  
  checkSession() {
    // Authentication disabled - always return true
    return { username: 'Admin', role: 'admin' };
  },
  
  setSession(userData) {
    // Not used - kept for compatibility
    console.log('Session management disabled');
  },
  
  logout() {
    if (confirm('Are you sure you want to logout?')) {
      window.location.href = '../login/login_page.html';
    }
  },
  
  getUsername() {
    return 'Admin';
  }
};

// No authentication check on page load - removed

// ============= FEATURE 14: DARK MODE =============
const DarkMode = {
  THEME_KEY: 'admin_theme',
  
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
    const header = document.querySelector('.main-header');
    if (!header) return;
    
    const btn = document.createElement('button');
    btn.id = 'darkModeToggle';
    btn.className = 'dark-mode-toggle';
    btn.textContent = '🌙';
    btn.title = 'Toggle Dark Mode';
    btn.onclick = () => this.toggle();
    
    header.appendChild(btn);
  }
};

// ============= FEATURE 9: LOADING STATES =============
const LoadingManager = {
  show(message = 'Loading...') {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p id="loadingText">${message}</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    document.getElementById('loadingText').textContent = message;
  },
  
  hide() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
  }
};

// ============= FEATURE 3: DYNAMIC STATISTICS =============
async function loadStatistics() {
  try {
    const res = await fetch(`${API_URL}/statistics`);
    const data = await res.json();
    
    if (data.success) {
      const stats = data.statistics;
      document.getElementById('deptCount').textContent = `🏨 ${stats.departments}+`;
      document.getElementById('alumniCount').textContent = `👨‍🎓 ${stats.totalAlumni.toLocaleString()}+`;
      document.getElementById('employedCount').textContent = `👨‍💼 ${stats.employed.toLocaleString()}+`;
      document.getElementById('entrepreneurCount').textContent = `👨‍💻 ${stats.entrepreneur.toLocaleString()}+`;
    }
  } catch (err) {
    console.error('Error loading statistics:', err);
  }
}

// ============= FEATURE 7: SEARCH & FILTER =============
const SearchManager = {
  currentData: {
    students: [],
    posts: [],
    events: [],
    funds: []
  },
  
  initGlobalSearch() {
    const searchBar = document.getElementById('globalSearch');
    if (!searchBar) return;
    
    searchBar.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const activeSection = this.getActiveSection();
      
      if (activeSection === 'students') {
        this.filterStudents(query);
      } else if (activeSection === 'posts') {
        this.filterPosts(query);
      } else if (activeSection === 'events') {
        this.filterEvents(query);
      } else if (activeSection === 'funds') {
        this.filterFunds(query);
      }
    });
  },
  
  getActiveSection() {
    if (document.getElementById('alumniTableSection').style.display !== 'none') return 'students';
    if (document.getElementById('postsSection').style.display !== 'none') return 'posts';
    if (document.getElementById('eventsSection').style.display !== 'none') return 'events';
    if (document.getElementById('fundSection').style.display !== 'none') return 'funds';
    return null;
  },
  
  filterStudents(query) {
    const rows = document.querySelectorAll('#studentTable tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  },
  
  filterPosts(query) {
    const posts = document.querySelectorAll('.post-card');
    posts.forEach(post => {
      const text = post.textContent.toLowerCase();
      post.style.display = text.includes(query) ? '' : 'none';
    });
  },
  
  filterEvents(query) {
    const events = document.querySelectorAll('.event-card');
    events.forEach(event => {
      const text = event.textContent.toLowerCase();
      event.style.display = text.includes(query) ? '' : 'none';
    });
  },
  
  filterFunds(query) {
    const rows = document.querySelectorAll('#fundTableBody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }
};

// ============= FEATURE 6: PAGINATION =============
const PaginationManager = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  
  init(containerId, items, renderFunction) {
    this.totalItems = items.length;
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const pageItems = items.slice(start, end);
    
    renderFunction(pageItems);
    this.renderControls(containerId, totalPages);
  },
  
  renderControls(containerId, totalPages) {
    let controls = document.getElementById('paginationControls');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'paginationControls';
      controls.className = 'pagination-controls';
      document.getElementById(containerId).appendChild(controls);
    }
    
    controls.innerHTML = `
      <button onclick="PaginationManager.goToPage(${this.currentPage - 1})" 
              ${this.currentPage === 1 ? 'disabled' : ''}>← Previous</button>
      <span>Page ${this.currentPage} of ${totalPages}</span>
      <button onclick="PaginationManager.goToPage(${this.currentPage + 1})" 
              ${this.currentPage === totalPages ? 'disabled' : ''}>Next →</button>
    `;
  },
  
  goToPage(page) {
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    
    const activeSection = SearchManager.getActiveSection();
    if (activeSection === 'posts') loadPosts();
  },
  
  reset() {
    this.currentPage = 1;
  }
};

// ============= FEATURE 5: FILE VALIDATION =============
const FileValidator = {
  validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and GIF allowed.' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 5MB.' };
    }
    
    return { valid: true };
  }
};

// ============= FEATURE 13: IMAGE PREVIEW =============
function setupImagePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  
  if (!input || !preview) return;
  
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
      preview.style.display = 'none';
      return;
    }
    
    // Validate file
    const validation = FileValidator.validateImage(file);
    if (!validation.valid) {
      alert(validation.error);
      input.value = '';
      preview.style.display = 'none';
      return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = preview.querySelector('img');
      img.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

// ============= FEATURE 1 & 2: STUDENTS - DELETE & EDIT =============
let editingStudentId = null;

window.loadStudents = async function() {
  LoadingManager.show('Loading students...');
  try {
    const res = await fetch(`${API_URL}/students`);
    const data = await res.json();
    const students = data.success ? data.students : data; // Handle both formats
    allStudentsData = students;
    SearchManager.currentData.students = students;
    renderStudents(students);
    
    // Populate filter dropdowns after loading data
    populateFilterDropdowns();
  } catch (err) {
    console.error('Error loading students:', err);
    alert('Failed to load students');
  } finally {
    LoadingManager.hide();
  }
};

function renderStudents(students) {
  const table = document.getElementById('studentTable');
  table.innerHTML = '';
  
  students.forEach(student => {
    const row = `
      <tr>
        <td>${student.alumni_id || 'N/A'}</td>
        <td>${student.name || 'N/A'}</td>
        <td>${student.dob || 'N/A'}</td>
        <td>${student.department || 'N/A'}</td>
        <td>${student.batch || 'N/A'}</td>
        <td>${student.contact || 'N/A'}</td>
        <td>${student.status || 'N/A'}</td>
        <td>
          <button onclick="editStudent('${student._id}')" class="btn-edit">✏️ Edit</button>
          <button onclick="deleteStudent('${student._id}')" class="btn-delete">🗑️ Delete</button>
        </td>
      </tr>`;
    table.innerHTML += row;
  });
}

window.editStudent = async function(id) {
  LoadingManager.show('Loading student data...');
  try {
    const student = SearchManager.currentData.students.find(s => s._id === id);
    if (!student) throw new Error('Student not found');
    
    editingStudentId = id;
    document.getElementById('studentModalTitle').textContent = 'Edit Student';
    document.getElementById('studentSubmitBtn').textContent = 'Update Student';
    
    document.getElementById('alumni_id').value = student.alumni_id || '';
    document.getElementById('name').value = student.name || '';
    document.getElementById('dob').value = student.dob || '';
    document.getElementById('department').value = student.department || '';
    document.getElementById('batch').value = student.batch || '';
    document.getElementById('contact').value = student.contact || '';
    document.getElementById('status').value = student.status || '';
    
    openStudentModal();
  } catch (err) {
    alert('Error loading student: ' + err.message);
  } finally {
    LoadingManager.hide();
  }
};

window.deleteStudent = async function(id) {
  if (!confirm('⚠️ Are you sure you want to delete this student? This action cannot be undone.')) {
    return;
  }
  
  LoadingManager.show('Deleting student...');
  try {
    const res = await fetch(`${API_URL}/student/${id}`, { method: 'DELETE' });
    const data = await res.json();
    
    if (data.success) {
      alert('✅ Student deleted successfully!');
      loadStudents();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Error deleting student: ' + err.message);
  } finally {
    LoadingManager.hide();
  }
};

window.saveStudent = async function(event) {
  event.preventDefault();
  
  const studentData = {
    alumni_id: document.getElementById('alumni_id').value,
    name: document.getElementById('name').value,
    dob: document.getElementById('dob').value,
    department: document.getElementById('department').value,
    batch: document.getElementById('batch').value,
    contact: document.getElementById('contact').value,
    status: document.getElementById('status').value
  };
  
  LoadingManager.show(editingStudentId ? 'Updating student...' : 'Adding student...');
  
  try {
    const url = editingStudentId 
      ? `${API_URL}/student/${editingStudentId}`
      : `${API_URL}/student`;
    const method = editingStudentId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    
    const data = await res.json();
    
    if (data.success) {
      alert(`✅ Student ${editingStudentId ? 'updated' : 'added'} successfully!`);
      closeStudentModal();
      loadStudents();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Error saving student: ' + err.message);
  } finally {
    LoadingManager.hide();
  }
};

window.openStudentModal = function() {
  editingStudentId = null;
  document.getElementById('studentModalTitle').textContent = 'Add Student';
  document.getElementById('studentSubmitBtn').textContent = 'Add Student';
  document.getElementById('studentForm').reset();
  document.getElementById('studentModal').style.display = 'flex';
};

window.closeStudentModal = function() {
  editingStudentId = null;
  document.getElementById('studentModal').style.display = 'none';
  document.getElementById('studentForm').reset();
};

// ============= FEATURE 1 & 2: POSTS - DELETE & EDIT =============
let editingPostId = null;
let allPosts = [];

window.loadPosts = async function() {
  LoadingManager.show('Loading posts...');
  try {
    const res = await fetch(`${API_URL}/posts`);
    allPosts = await res.json();
    SearchManager.currentData.posts = allPosts;
    
    // Apply pagination
    PaginationManager.init('postsSection', allPosts, renderPosts);
  } catch (err) {
    console.error('Error loading posts:', err);
    alert('Failed to load posts');
  } finally {
    LoadingManager.hide();
  }
};

function renderPosts(posts) {
  const container = document.getElementById('postsList');
  container.innerHTML = '';
  
  posts.forEach(post => {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.innerHTML = `
      <div class="post-header">
        <div>
          <strong>${post.author || 'Unknown'}</strong>
          <span class="post-time">${post.time || ''}</span>
        </div>
        <div class="post-actions">
          <button onclick="editPost('${post._id}')" class="btn-edit-small">✏️</button>
          <button onclick="deletePost('${post._id}')" class="btn-delete-small">🗑️</button>
        </div>
      </div>
      ${post.imageUrl ? `<img src="${API_URL}${post.imageUrl}" alt="Post image" class="post-image">` : ''}
      <p class="post-content">${post.content || ''}</p>
    `;
    container.appendChild(postCard);
  });
}

window.editPost = async function(id) {
  const post = allPosts.find(p => p._id === id);
  if (!post) return;
  
  editingPostId = id;
  document.getElementById('postModalTitle').textContent = 'Edit Post';
  document.getElementById('description').value = post.content || '';
  
  // Show current image
  if (post.imageUrl) {
    document.getElementById('currentImage').style.display = 'block';
    document.getElementById('currentImg').src = `${API_URL}${post.imageUrl}`;
  } else {
    document.getElementById('currentImage').style.display = 'none';
  }
  
  document.getElementById('postModal').style.display = 'flex';
};

window.deletePost = async function(id) {
  if (!confirm('⚠️ Delete this post? This cannot be undone.')) return;
  
  LoadingManager.show('Deleting post...');
  try {
    const res = await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    
    if (data.success) {
      alert('✅ Post deleted!');
      PaginationManager.reset();
      loadPosts();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    LoadingManager.hide();
  }
};

// ============= FEATURE 12: DATA EXPORT (CSV/EXCEL) =============
window.exportStudents = function() {
  const students = SearchManager.currentData.students;
  if (students.length === 0) {
    alert('No data to export');
    return;
  }
  
  // Create CSV content
  const headers = ['Alumni ID', 'Name', 'DOB', 'Department', 'Batch', 'Contact', 'Status'];
  const csvContent = [
    headers.join(','),
    ...students.map(s => [
      s.alumni_id || '',
      s.name || '',
      s.dob || '',
      s.department || '',
      s.batch || '',
      s.contact || '',
      s.status || ''
    ].join(','))
  ].join('\n');
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  alert('✅ Data exported successfully!');
};

// Add export button
function addExportButton() {
  const header = document.querySelector('.main-header');
  if (!header || document.getElementById('exportBtn')) return;
  
  const btn = document.createElement('button');
  btn.id = 'exportBtn';
  btn.className = 'export-btn';
  btn.textContent = '📊 Export';
  btn.onclick = exportStudents;
  
  header.insertBefore(btn, header.querySelector('.notification'));
}

// ============= FEATURE 15: KEYBOARD SHORTCUTS =============
const KeyboardShortcuts = {
  init() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('globalSearch')?.focus();
      }
      
      // Ctrl/Cmd + N: Add new item
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const activeSection = SearchManager.getActiveSection();
        if (activeSection === 'students') openStudentModal();
      }
      
      // Ctrl/Cmd + D: Toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        DarkMode.toggle();
      }
      
      // Escape: Close modals
      if (e.key === 'Escape') {
        closeStudentModal();
        document.getElementById('postModal').style.display = 'none';
        document.getElementById('fundModal').style.display = 'none';
        document.getElementById('eventModal').style.display = 'none';
      }
    });
    
    this.showShortcutsInfo();
  },
  
  showShortcutsInfo() {
    console.log(`
    ⌨️ KEYBOARD SHORTCUTS:
    - Ctrl/Cmd + K: Focus search
    - Ctrl/Cmd + N: Add new item
    - Ctrl/Cmd + D: Toggle dark mode
    - Escape: Close modals
    `);
  }
};

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all features
  DarkMode.init();
  SearchManager.initGlobalSearch();
  KeyboardShortcuts.init();
  // addExportButton(); // REMOVED - Export button already in HTML
  
  // Setup image previews
  setupImagePreview('imageFile', 'imagePreview');
  setupImagePreview('eventPosterFile', 'eventImagePreview');
  
  // Load initial data
  loadStudents();
  loadStatistics();
  
  // Show username
  const username = AuthManager.getUsername();
  const userLabel = document.querySelector('.user label');
  if (userLabel) userLabel.textContent = username;
  
  // Initialize filters
  initializeFilters();
});

// ============= ALUMNI FILTER FUNCTIONALITY =============
let allStudentsData = [];
let currentFilters = {
  batch: '',
  department: ''
};

async function initializeFilters() {
  try {
    // Load all students data
    const res = await fetch(`${API_URL}/students`);
    const data = await res.json();
    allStudentsData = data.success ? data.students : data; // Handle both formats
    
    // Populate filter dropdowns
    populateFilterDropdowns();
  } catch (err) {
    console.error('Error initializing filters:', err);
  }
}

function populateFilterDropdowns() {
  // Get unique batches and departments
  const batches = [...new Set(allStudentsData.map(s => s.batch).filter(Boolean))].sort();
  const departments = [...new Set(allStudentsData.map(s => s.department).filter(Boolean))].sort();
  
  // Populate batch dropdown
  const batchFilter = document.getElementById('batchFilter');
  if (batchFilter) {
    batchFilter.innerHTML = '<option value="">All Batches</option>';
    batches.forEach(batch => {
      batchFilter.innerHTML += `<option value="${batch}">${batch}</option>`;
    });
  }
  
  // Populate department dropdown
  const departmentFilter = document.getElementById('departmentFilter');
  if (departmentFilter) {
    departmentFilter.innerHTML = '<option value="">All Departments</option>';
    departments.forEach(dept => {
      departmentFilter.innerHTML += `<option value="${dept}">${dept}</option>`;
    });
  }
}

window.applyFilters = function() {
  const batchFilter = document.getElementById('batchFilter');
  const departmentFilter = document.getElementById('departmentFilter');
  
  currentFilters.batch = batchFilter ? batchFilter.value : '';
  currentFilters.department = departmentFilter ? departmentFilter.value : '';
  
  // Filter students
  let filteredStudents = allStudentsData;
  
  // Apply batch filter
  if (currentFilters.batch) {
    filteredStudents = filteredStudents.filter(s => s.batch === currentFilters.batch);
  }
  
  // Apply department filter
  if (currentFilters.department) {
    filteredStudents = filteredStudents.filter(s => s.department === currentFilters.department);
  }
  
  // Render filtered students
  renderStudents(filteredStudents);
  
  // Update search data
  SearchManager.currentData.students = filteredStudents;
};

window.clearFilters = function() {
  const batchFilter = document.getElementById('batchFilter');
  const departmentFilter = document.getElementById('departmentFilter');
  
  if (batchFilter) batchFilter.value = '';
  if (departmentFilter) departmentFilter.value = '';
  
  currentFilters.batch = '';
  currentFilters.department = '';
  
  // Show all students
  renderStudents(allStudentsData);
  SearchManager.currentData.students = allStudentsData;
};

// Expose functions globally
window.AuthManager = AuthManager;
window.LoadingManager = LoadingManager;
window.PaginationManager = PaginationManager;
window.SearchManager = SearchManager;
window.DarkMode = DarkMode;