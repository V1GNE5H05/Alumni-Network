/**
 * ADMIN IMPROVEMENTS - ALL 15 FEATURES IMPLEMENTED + BULK IMPORT
 * Features: Delete, Edit, Dynamic Stats, Auth, Validation, Pagination, 
 * Search, UI/UX, Loading, Image Fix, Confirmations, Export, Preview, Dark Mode, Shortcuts, BULK IMPORT
 */

const API_URL = window.API_BASE_URL || 'http://localhost:5000';

// ============= AUTHENTICATION CHECK =============
// Check admin authentication on page load
if (!AuthCheck.requireAdmin()) {
    // Will redirect if not admin
} else {
    // Initialize auth protection
    AuthCheck.init();
}

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
      AuthCheck.logout();
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
  },
  
  validateCSV(file) {
    const allowedTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }
    
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'txt'].includes(extension)) {
      return { valid: false, error: 'Invalid file type. Only CSV and TXT files allowed.' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 10MB.' };
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
  
  // Validation
  if (!studentData.alumni_id || !studentData.name || !studentData.dob || 
      !studentData.department || !studentData.batch || !studentData.contact || !studentData.status) {
    alert('⚠️ Please fill in all required fields!');
    return;
  }
  
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

// ============= BULK IMPORT FUNCTIONALITY =============
let parsedStudentsData = [];
let validStudents = [];
let invalidStudents = [];

window.openStudentslist = function() {
  // Create modal if it doesn't exist
  let modal = document.getElementById('bulkImportModal');
  if (!modal) {
    createBulkImportModal();
  }
  
  // Reset state
  parsedStudentsData = [];
  validStudents = [];
  invalidStudents = [];
  
  // Show modal
  document.getElementById('bulkImportModal').style.display = 'flex';
  
  // Setup file input listener
  const fileInput = document.getElementById('bulkCsvFile');
  fileInput.value = '';
  document.getElementById('selectedFileName').textContent = '';
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('importResults').style.display = 'none';
  
  fileInput.onchange = handleFileSelect;
};

function createBulkImportModal() {
  const modal = document.createElement('div');
  modal.id = 'bulkImportModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <h2>📋 Bulk Import Students</h2>
        <span class="close" onclick="closeBulkImportModal()">&times;</span>
      </div>
      <div class="modal-body">
        <div class="import-instructions" style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0;">📄 CSV File Formats</h3>
          
          <div style="background: #e8f5e9; padding: 10px; margin: 10px 0; border-radius: 5px;">
            <p><strong>✅ Format 1: Simple (Recommended for Student Registration)</strong></p>
            <code style="display: block; padding: 10px; background: white; margin: 10px 0; border-radius: 5px; overflow-x: auto;">Admission Number,Name,Department,Batch</code>
            <p><strong>Example:</strong></p>
            <code style="display: block; padding: 10px; background: white; margin: 10px 0; border-radius: 5px; overflow-x: auto;">ALU2021CSE001,John Doe,Computer Science and Engineering,2021-2025</code>
            <ul style="margin: 5px 0; padding-left: 20px; font-size: 14px;">
              <li>Use this for adding students who will self-register</li>
              <li>Only 4 columns required</li>
              <li>Students complete their profile during registration</li>
            </ul>
          </div>
          
          <div style="background: #fff3e0; padding: 10px; margin: 10px 0; border-radius: 5px;">
            <p><strong>⚙️ Format 2: Full (For Complete Records)</strong></p>
            <code style="display: block; padding: 10px; background: white; margin: 10px 0; border-radius: 5px; overflow-x: auto;">Alumni ID,Name,DOB,Department,Batch,Contact,Status</code>
            <p><strong>Example:</strong></p>
            <code style="display: block; padding: 10px; background: white; margin: 10px 0; border-radius: 5px; overflow-x: auto;">ALU001,John Doe,1995-05-15,Computer Science,2023,john@email.com,Employed</code>
            <ul style="margin: 5px 0; padding-left: 20px; font-size: 14px;">
              <li>Use this for adding complete alumni records</li>
              <li>All 7 columns required</li>
              <li>Date Format: YYYY-MM-DD (e.g., 1995-05-15)</li>
              <li>Status: Employed, Entrepreneur, Higher Studies, Seeking Job</li>
            </ul>
          </div>
          
          <div style="margin-top: 10px;">
            <p><strong>📌 General Notes:</strong></p>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li>First row MUST be the header row</li>
              <li>Duplicate Admission Numbers will be skipped</li>
              <li>Both formats upload to student database for registration verification</li>
            </ul>
          </div>
        </div>
        
        <div class="file-upload-section" style="text-align: center; margin: 30px 0;">
          <label for="bulkCsvFile" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; transition: transform 0.2s;">
            <span style="font-size: 20px; margin-right: 10px;">📁</span>
            Choose CSV/TXT File
          </label>
          <input type="file" id="bulkCsvFile" accept=".csv,.txt." style="display: none;">
          <p id="selectedFileName" style="margin-top: 15px; color: #666; font-style: italic;"></p>
        </div>
        
        <div id="previewSection" style="display: none; margin-top: 30px;">
          <h3 style="color: #667eea;">📊 Preview & Validation</h3>
          <div class="preview-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0;">
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #1976d2;" id="totalRecordsCount">0</div>
              <div style="color: #666; font-size: 14px;">Total Records</div>
            </div>
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #388e3c;" id="validRecordsCount">0</div>
              <div style="color: #666; font-size: 14px;">✓ Valid</div>
            </div>
            <div style="background: #ffebee; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #d32f2f;" id="invalidRecordsCount">0</div>
              <div style="color: #666; font-size: 14px;">✗ Invalid</div>
            </div>
          </div>
          
          <div id="previewTable" style="overflow-x: auto; margin: 20px 0; border: 1px solid #ddd; border-radius: 8px;"></div>
          
          <div id="errorsList" style="display: none; margin-top: 20px; padding: 15px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
            <h4 style="margin-top: 0; color: #e65100;">⚠️ Validation Errors:</h4>
            <ul id="errorsListItems" style="margin: 10px 0; padding-left: 20px;"></ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <button onclick="startBulkImport()" id="startImportBtn" style="padding: 12px 40px; background: #4CAF50; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.3s;">
              ✅ Import <span id="validCount"></span> Valid Students
            </button>
            <button onclick="closeBulkImportModal()" style="padding: 12px 40px; background: #f44336; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-left: 10px;">
              ✖ Cancel
            </button>
          </div>
        </div>
        
        <div id="importProgress" style="display: none; margin-top: 30px;">
          <h3 style="text-align: center; color: #667eea;">⏳ Importing Students...</h3>
          <div style="background: #f0f0f0; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0;">
            <div id="progressFill" style="height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); width: 0%; transition: width 0.3s;"></div>
          </div>
          <p id="progressText" style="text-align: center; color: #666; font-size: 14px;"></p>
        </div>
        
        <div id="importResults" style="display: none; margin-top: 30px;">
          <h3 style="color: #4CAF50; text-align: center;">✅ Import Complete!</h3>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #4CAF50;" id="successCount">0</div>
                <div style="color: #666;">Successfully Imported</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #ff9800;" id="skippedCount">0</div>
                <div style="color: #666;">Skipped (Duplicates)</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #f44336;" id="failedCount">0</div>
                <div style="color: #666;">Failed</div>
              </div>
            </div>
          </div>
          
          <div id="failedList" style="display: none; margin-top: 20px; padding: 15px; background: #ffebee; border-left: 4px solid #f44336; border-radius: 4px;">
            <h4 style="margin-top: 0; color: #c62828;">❌ Failed Records:</h4>
            <ul id="failedListItems" style="margin: 10px 0; padding-left: 20px;"></ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <button onclick="closeBulkImportModal(); loadStudents();" style="padding: 12px 40px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
              🔄 Refresh & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

window.closeBulkImportModal = function() {
  const modal = document.getElementById('bulkImportModal');
  if (modal) modal.style.display = 'none';
  
  // Reset file input
  const fileInput = document.getElementById('bulkCsvFile');
  if (fileInput) fileInput.value = '';
};

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file
  const validation = FileValidator.validateCSV(file);
  if (!validation.valid) {
    alert('❌ ' + validation.error);
    event.target.value = '';
    return;
  }
  
  document.getElementById('selectedFileName').textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
  
  // Read and parse CSV
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    parseCSV(text);
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  LoadingManager.show('Parsing CSV file...');
  
  try {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      alert('❌ CSV file is empty or has no data rows!');
      LoadingManager.hide();
      return;
    }
    
    // Parse header
    const header = lines[0].split(',').map(h => h.trim());
    
    // Support TWO formats:
    // Format 1 (Simple - for student database): Admission Number, Name, Department, Batch
    // Format 2 (Full - for admin management): Alumni ID, Name, DOB, Department, Batch, Contact, Status
    
    const isSimpleFormat = header.length === 4 && 
      header[0].toLowerCase().includes('admission') &&
      header[1].toLowerCase().includes('name');
    
    const isFullFormat = header.length === 7 &&
      header[0].toLowerCase().includes('alumni');
    
    if (!isSimpleFormat && !isFullFormat) {
      alert(`❌ Invalid CSV format!\n\nSupported formats:\n\nFormat 1 (Simple):\nAdmission Number, Name, Department, Batch\n\nFormat 2 (Full):\nAlumni ID, Name, DOB, Department, Batch, Contact, Status\n\nGot:\n${header.join(', ')}`);
      LoadingManager.hide();
      return;
    }
    
    const expectedColumnCount = isSimpleFormat ? 4 : 7;
    
    // Parse data rows
    parsedStudentsData = [];
    validStudents = [];
    invalidStudents = [];
    const existingAlumniIds = new Set(allStudentsData.map(s => s.alumni_id));
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== expectedColumnCount) {
        invalidStudents.push({
          row: i + 1,
          data: values,
          errors: [`Expected ${expectedColumnCount} columns, got ${values.length}`]
        });
        continue;
      }
      
      let student;
      
      if (isSimpleFormat) {
        // Format: Admission Number, Name, Department, Batch
        student = {
          alumni_id: values[0].trim(),
          admissionNumber: values[0].trim(),
          name: values[1].trim(),
          department: values[2].trim(),
          batch: values[3].trim(),
          dob: '',  // Will be filled during registration
          contact: '',  // Will be filled during registration
          status: 'Pending Registration'  // Default status
        };
      } else {
        // Format: Alumni ID, Name, DOB, Department, Batch, Contact, Status
        student = {
          alumni_id: values[0].trim(),
          admissionNumber: values[0].trim(),
          name: values[1].trim(),
          dob: values[2].trim(),
          department: values[3].trim(),
          batch: values[4].trim(),
          contact: values[5].trim(),
          status: values[6].trim()
        };
      }
      
      // Validate student
      const errors = validateStudentData(student, existingAlumniIds);
      
      if (errors.length > 0) {
        invalidStudents.push({
          row: i + 1,
          data: student,
          errors: errors
        });
      } else {
        validStudents.push(student);
        existingAlumniIds.add(student.alumni_id); // Prevent duplicates within the CSV
      }
      
      parsedStudentsData.push(student);
    }
    
    // Show preview
    displayPreview();
    LoadingManager.hide();
    
  } catch (err) {
    alert('❌ Error parsing CSV: ' + err.message);
    LoadingManager.hide();
  }
}

// Helper function to parse CSV line (handles commas within quotes)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result.map(val => val.replace(/^"|"$/g, '').trim());
}

function validateStudentData(student, existingAlumniIds) {
  const errors = [];
  
  // Required fields (basic - always required)
  if (!student.alumni_id) errors.push('Admission Number is required');
  if (!student.name) errors.push('Name is required');
  if (!student.department) errors.push('Department is required');
  if (!student.batch) errors.push('Batch is required');
  
  // Optional fields (for full format only)
  // DOB, Contact, Status can be empty for simple format
  
  // Duplicate check
  if (student.alumni_id && existingAlumniIds.has(student.alumni_id)) {
    errors.push('Admission Number already exists in database');
  }
  
  // Date format validation (only if provided)
  if (student.dob && student.dob.trim() && !isValidDate(student.dob)) {
    errors.push('Invalid date format (use YYYY-MM-DD)');
  }
  
  // Status validation (only if provided)
  if (student.status && student.status.trim()) {
    const validStatuses = ['employed', 'entrepreneur', 'higher studies', 'seeking job', 'pending registration'];
    if (!validStatuses.includes(student.status.toLowerCase())) {
      errors.push('Invalid status (use: Employed, Entrepreneur, Higher Studies, Seeking Job, Pending Registration)');
    }
  }
  
  // Contact validation (only if provided)
  if (student.contact && student.contact.trim() && student.contact.length < 5) {
    errors.push('Contact must be valid');
  }
  
  return errors;
}

function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function displayPreview() {
  document.getElementById('previewSection').style.display = 'block';
  
  // Update stats
  document.getElementById('totalRecordsCount').textContent = parsedStudentsData.length;
  document.getElementById('validRecordsCount').textContent = validStudents.length;
  document.getElementById('invalidRecordsCount').textContent = invalidStudents.length;
  document.getElementById('validCount').textContent = validStudents.length;
  
  // Enable/disable import button
  const importBtn = document.getElementById('startImportBtn');
  if (validStudents.length === 0) {
    importBtn.disabled = true;
    importBtn.style.background = '#ccc';
    importBtn.style.cursor = 'not-allowed';
  } else {
    importBtn.disabled = false;
    importBtn.style.background = '#4CAF50';
    importBtn.style.cursor = 'pointer';
  }
  
  // Display preview table (first 5 valid records)
  const previewTable = document.getElementById('previewTable');
  const previewData = validStudents.slice(0, 5);
  
  let tableHTML = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #667eea; color: white;">
          <th style="padding: 10px; border: 1px solid #ddd;">Alumni ID</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Name</th>
          <th style="padding: 10px; border: 1px solid #ddd;">DOB</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Department</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Batch</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  previewData.forEach((student, index) => {
    const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
    tableHTML += `
      <tr style="background: ${bgColor};">
        <td style="padding: 8px; border: 1px solid #ddd;">${student.alumni_id}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${student.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${student.dob}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${student.department}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${student.batch}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${student.status}</td>
      </tr>
    `;
  });
  
  if (validStudents.length > 5) {
    tableHTML += `
      <tr>
        <td colspan="6" style="padding: 10px; text-align: center; color: #666; font-style: italic; background: #f0f0f0;">
          ... and ${validStudents.length - 5} more valid records
        </td>
      </tr>
    `;
  }
  
  tableHTML += '</tbody></table>';
  previewTable.innerHTML = tableHTML;
  
  // Display errors if any
  if (invalidStudents.length > 0) {
    const errorsList = document.getElementById('errorsList');
    const errorsListItems = document.getElementById('errorsListItems');
    errorsList.style.display = 'block';
    
    let errorsHTML = '';
    invalidStudents.forEach(invalid => {
      const studentInfo = invalid.data.alumni_id || invalid.data.name || 'Unknown';
      errorsHTML += `<li><strong>Row ${invalid.row} (${studentInfo}):</strong> ${invalid.errors.join(', ')}</li>`;
    });
    
    errorsListItems.innerHTML = errorsHTML;
  }
}

window.startBulkImport = async function() {
  if (validStudents.length === 0) {
    alert('❌ No valid students to import!');
    return;
  }
  
  if (!confirm(`⚠️ Are you sure you want to import ${validStudents.length} students?`)) {
    return;
  }
  
  // Hide preview, show progress
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('importProgress').style.display = 'block';
  
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const failedRecords = [];
  
  // STEP 1: Upload to student database (for registration verification)
  document.getElementById('progressText').textContent = 'Uploading to student database...';
  try {
    const bulkResponse = await fetch(`${API_URL}/api/upload-students-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: validStudents })
    });
    
    const bulkData = await bulkResponse.json();
    console.log('Student database upload result:', bulkData);
  } catch (err) {
    console.error('Error uploading to student database:', err);
  }
  
  // STEP 2: Import students to alumni_network one by one (for admin management)
  for (let i = 0; i < validStudents.length; i++) {
    const student = validStudents[i];
    const progress = ((i + 1) / validStudents.length) * 100;
    
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = `Importing ${i + 1} of ${validStudents.length} to admin database...`;
    
    try {
      const res = await fetch(`${API_URL}/student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      
      const data = await res.json();
      
      if (data.success) {
        successCount++;
      } else {
        if (data.message && data.message.includes('already exists')) {
          skippedCount++;
        } else {
          failedCount++;
          failedRecords.push({
            student: student,
            error: data.message || 'Unknown error'
          });
        }
      }
    } catch (err) {
      failedCount++;
      failedRecords.push({
        student: student,
        error: err.message
      });
    }
    
    // Small delay to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Show results
  document.getElementById('importProgress').style.display = 'none';
  document.getElementById('importResults').style.display = 'block';
  
  document.getElementById('successCount').textContent = successCount;
  document.getElementById('skippedCount').textContent = skippedCount;
  document.getElementById('failedCount').textContent = failedCount;
  
  // Show failed records if any
  if (failedRecords.length > 0) {
    const failedList = document.getElementById('failedList');
    const failedListItems = document.getElementById('failedListItems');
    failedList.style.display = 'block';
    
    let failedHTML = '';
    failedRecords.forEach(record => {
      failedHTML += `<li><strong>${record.student.alumni_id} - ${record.student.name}:</strong> ${record.error}</li>`;
    });
    
    failedListItems.innerHTML = failedHTML;
  }
  
  // Show summary alert
  alert(`✅ Import Complete!\n\n✓ Success: ${successCount}\n⚠ Skipped: ${skippedCount}\n✗ Failed: ${failedCount}`);
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
    
    // Handle image URL - check if it's absolute (starts with http) or relative
    let imageHtml = '';
    if (post.imageUrl) {
      const imageSrc = post.imageUrl.startsWith('http') ? post.imageUrl : API_URL + post.imageUrl;
      imageHtml = `<img src="${imageSrc}" alt="Post image" class="post-image" onerror="this.src='../images/alternate.png'">`;
    }
    
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
      ${imageHtml}
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
  
  // Show current image - handle both absolute and relative URLs
  if (post.imageUrl) {
    document.getElementById('currentImage').style.display = 'block';
    const imageSrc = post.imageUrl.startsWith('http') ? post.imageUrl : `${API_URL}${post.imageUrl}`;
    document.getElementById('currentImg').src = imageSrc;
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
        closeBulkImportModal();
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

// ============= STUDENTS DATABASE SECTION (MASTER LIST) =============
let allMasterStudents = [];
let filteredMasterStudents = [];

// Load students from master database
window.loadStudentsFromDb = async function() {
  LoadingManager.show('Loading master student list...');
  try {
    const res = await fetch(`${API_URL}/api/students-database`);
    const data = await res.json();
    
    if (data.success) {
      allMasterStudents = data.students;
      filteredMasterStudents = [...allMasterStudents];
      renderStudentsFromDb(filteredMasterStudents);
      populateStudentBatchFilter();
      console.log(`Loaded ${data.count} students from master database`);
    } else {
      throw new Error(data.message || 'Failed to load students');
    }
  } catch (err) {
    console.error('Error loading master students:', err);
    const table = document.getElementById('studentsDbTable');
    if (table) {
      table.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #ff6b6b;">❌ Failed to load students: ' + err.message + '</td></tr>';
    }
  } finally {
    LoadingManager.hide();
  }
};

// Render master students in table
function renderStudentsFromDb(students) {
  const table = document.getElementById('studentsDbTable');
  if (!table) return;
  
  table.innerHTML = '';
  
  if (students.length === 0) {
    table.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #666;">No students found</td></tr>';
    return;
  }
  
  students.forEach(student => {
    const uploadDate = student.uploadedAt ? new Date(student.uploadedAt).toLocaleDateString() : 'N/A';
    const status = student.status || 'Pending Registration';
    
    const row = `
      <tr>
        <td>${student.admissionNumber || 'N/A'}</td>
        <td>${student.name || 'N/A'}</td>
        <td>${student.department || 'N/A'}</td>
        <td>${student.batch || 'N/A'}</td>
        <td><span style="padding: 4px 12px; border-radius: 12px; background: ${status === 'Registered' ? '#10b981' : '#f59e0b'}; color: white; font-size: 12px; font-weight: 600;">${status}</span></td>
        <td>${uploadDate}</td>
      </tr>`;
    table.innerHTML += row;
  });
}

// Populate batch filter dropdown with unique values from data
function populateStudentBatchFilter() {
  const batches = [...new Set(allMasterStudents.map(s => s.batch))].filter(b => b).sort().reverse();
  const batchFilter = document.getElementById('filterStudentBatch');
  if (batchFilter) {
    // Keep "All Batches" option and add unique batches
    const currentOptions = '<option value="">All Batches</option>';
    const batchOptions = batches.map(batch => `<option value="${batch}">${batch}</option>`).join('');
    batchFilter.innerHTML = currentOptions + batchOptions;
  }
}

// Apply filters to master students
window.filterStudentsDb = function() {
  const deptFilter = document.getElementById('filterStudentDepartment')?.value || '';
  const batchFilter = document.getElementById('filterStudentBatch')?.value || '';
  
  filteredMasterStudents = allMasterStudents.filter(student => {
    const matchesDept = !deptFilter || student.department === deptFilter;
    const matchesBatch = !batchFilter || student.batch === batchFilter;
    return matchesDept && matchesBatch;
  });
  
  renderStudentsFromDb(filteredMasterStudents);
  console.log(`Filtered: Showing ${filteredMasterStudents.length} of ${allMasterStudents.length} students`);
};

// Clear master student filters
window.clearStudentFilters = function() {
  const deptFilter = document.getElementById('filterStudentDepartment');
  const batchFilter = document.getElementById('filterStudentBatch');
  
  if (deptFilter) deptFilter.value = '';
  if (batchFilter) batchFilter.value = '';
  
  filteredMasterStudents = [...allMasterStudents];
  renderStudentsFromDb(filteredMasterStudents);
  console.log(`Filters cleared: Showing all ${allMasterStudents.length} students`);
};

// Menu click handler for Students section
document.addEventListener('DOMContentLoaded', function() {
  const studentsMenu = document.getElementById('studentsMenu');
  if (studentsMenu) {
    studentsMenu.addEventListener('click', function() {
      // Hide all sections
      const sections = ['alumniTableSection', 'studentsDbSection', 'postsSection', 'eventsSection', 'fundSection'];
      sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = 'none';
      });
      
      // Show students database section
      const studentsSection = document.getElementById('studentsDbSection');
      if (studentsSection) {
        studentsSection.style.display = 'block';
        loadStudentsFromDb();
      }
      
      // Update active menu
      document.querySelectorAll('.menu-items').forEach(menu => {
        menu.classList.remove('active');
      });
      studentsMenu.classList.add('active');
    });
  }
});

// ============= ADD SINGLE STUDENT TO STUDENT DATABASE =============
window.openAddSingleStudentModal = function() {
  const modal = document.getElementById('addSingleStudentModal');
  modal.style.display = 'flex';
  document.getElementById('addSingleStudentForm').reset();
  document.getElementById('singleStudentResult').style.display = 'none';
};

window.closeAddSingleStudentModal = function() {
  document.getElementById('addSingleStudentModal').style.display = 'none';
};

// Handle single student form submission
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('addSingleStudentForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const admissionNumber = document.getElementById('singleAdmissionNumber').value.trim();
      const name = document.getElementById('singleName').value.trim();
      const department = document.getElementById('singleDepartment').value;
      const batch = document.getElementById('singleBatch').value;
      
      const resultDiv = document.getElementById('singleStudentResult');
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<p style="color:#666;">⏳ Adding student...</p>';
      
      try {
        const response = await fetch(`${API_URL}/api/add-student-to-database`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admissionNumber,
            name,
            department,
            batch
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          resultDiv.style.background = '#d1fae5';
          resultDiv.style.color = '#065f46';
          resultDiv.innerHTML = `<p style="margin:0;">✅ ${data.message}</p>`;
          form.reset();
          
          // Reload the students table
          setTimeout(() => {
            loadStudentsFromDb();
            closeAddSingleStudentModal();
          }, 1500);
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        resultDiv.style.background = '#fee2e2';
        resultDiv.style.color = '#991b1b';
        resultDiv.innerHTML = `<p style="margin:0;">❌ Error: ${error.message}</p>`;
      }
    });
  }
});

// ============= BULK STUDENT UPLOAD TO STUDENT DATABASE =============
window.openBulkStudentUploadModal = function() {
  const modal = document.getElementById('bulkStudentUploadModal');
  modal.style.display = 'flex';
  document.getElementById('bulkStudentUploadForm').reset();
  document.getElementById('bulkStudentResult').style.display = 'none';
  document.getElementById('bulkStudentPreview').style.display = 'none';
};

window.closeBulkStudentUploadModal = function() {
  document.getElementById('bulkStudentUploadModal').style.display = 'none';
};

// Handle CSV file preview
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('bulkStudentCsvFile');
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(event) {
        const csvText = event.target.result;
        const lines = csvText.trim().split('\n');
        
        if (lines.length === 0) {
          alert('CSV file is empty!');
          return;
        }
        
        // Show preview (first 5 students)
        const previewDiv = document.getElementById('bulkStudentPreview');
        const previewTable = document.getElementById('bulkStudentPreviewTable');
        
        let html = '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
        html += '<thead><tr style="background:#f3f4f6;"><th style="padding:8px;border:1px solid #ddd;">Admission #</th><th style="padding:8px;border:1px solid #ddd;">Name</th><th style="padding:8px;border:1px solid #ddd;">Department</th><th style="padding:8px;border:1px solid #ddd;">Batch</th></tr></thead><tbody>';
        
        const previewLines = lines.slice(0, 5);
        previewLines.forEach(line => {
          const cols = line.split(',').map(col => col.trim());
          if (cols.length >= 4) {
            html += `<tr><td style="padding:8px;border:1px solid #ddd;">${cols[0]}</td><td style="padding:8px;border:1px solid #ddd;">${cols[1]}</td><td style="padding:8px;border:1px solid #ddd;">${cols[2]}</td><td style="padding:8px;border:1px solid #ddd;">${cols[3]}</td></tr>`;
          }
        });
        
        html += '</tbody></table>';
        html += `<p style="margin-top:10px;color:#666;font-size:13px;">Total students in file: ${lines.length}</p>`;
        
        previewTable.innerHTML = html;
        previewDiv.style.display = 'block';
      };
      reader.readAsText(file);
    });
  }
  
  // Handle bulk upload form submission
  const bulkForm = document.getElementById('bulkStudentUploadForm');
  if (bulkForm) {
    bulkForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const fileInput = document.getElementById('bulkStudentCsvFile');
      const file = fileInput.files[0];
      
      if (!file) {
        alert('Please select a CSV file!');
        return;
      }
      
      const resultDiv = document.getElementById('bulkStudentResult');
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<p style="color:#666;margin:0;">⏳ Uploading students...</p>';
      
      const reader = new FileReader();
      reader.onload = async function(event) {
        try {
          const csvText = event.target.result;
          const lines = csvText.trim().split('\n');
          
          const students = lines.map(line => {
            const cols = line.split(',').map(col => col.trim());
            return {
              admissionNumber: cols[0],
              name: cols[1],
              department: cols[2],
              batch: cols[3]
            };
          }).filter(s => s.admissionNumber && s.name && s.department && s.batch);
          
          if (students.length === 0) {
            throw new Error('No valid student data found in CSV');
          }
          
          // Upload to student database
          const response = await fetch(`${API_URL}/api/upload-students-bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students })
          });
          
          const data = await response.json();
          
          if (data.success) {
            resultDiv.style.background = '#d1fae5';
            resultDiv.style.color = '#065f46';
            let html = `<p style="margin:0 0 10px 0;font-weight:600;">✅ ${data.message}</p>`;
            
            if (data.departmentResults) {
              html += '<div style="font-size:13px;">';
              html += '<p style="margin:5px 0;font-weight:600;">Department-wise results:</p>';
              for (const [dept, result] of Object.entries(data.departmentResults)) {
                html += `<p style="margin:3px 0;">• ${dept}: ${result.inserted} inserted`;
                if (result.duplicates) html += ` (${result.duplicates} duplicates skipped)`;
                html += `</p>`;
              }
              html += '</div>';
            }
            
            resultDiv.innerHTML = html;
            
            // Reload the students table
            setTimeout(() => {
              loadStudentsFromDb();
              closeBulkStudentUploadModal();
            }, 2000);
          } else {
            throw new Error(data.message);
          }
        } catch (error) {
          resultDiv.style.background = '#fee2e2';
          resultDiv.style.color = '#991b1b';
          resultDiv.innerHTML = `<p style="margin:0;">❌ Error: ${error.message}</p>`;
        }
      };
      reader.readAsText(file);
    });
  }
});

// ============= REGISTRATION STATISTICS FEATURE =============
// Statistics menu handler
document.addEventListener('DOMContentLoaded', function() {
  const statisticsMenu = document.getElementById('statisticsMenu');
  
  if (statisticsMenu) {
    statisticsMenu.addEventListener('click', function() {
      // Hide all sections
      document.querySelectorAll('#dashboardSection, #alumniTableSection, #postsSection, #eventsSection, #fundsSection, #memberSection, #jobsSection, #studentsDbSection, #registrationStatsSection').forEach(section => {
        section.style.display = 'none';
      });
      
      // Show statistics section
      const statsSection = document.getElementById('registrationStatsSection');
      if (statsSection) {
        statsSection.style.display = 'block';
        refreshStatistics();
      }
      
      // Update active menu
      document.querySelectorAll('.menu-items').forEach(menu => {
        menu.classList.remove('active');
      });
      statisticsMenu.classList.add('active');
    });
  }
});

// Refresh statistics data
async function refreshStatistics() {
  LoadingManager.show('Loading statistics...');
  
  try {
    const response = await fetch(`${API_URL}/api/statistics/registration`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }
    
    const data = await response.json();
    
    // Update summary cards
    document.getElementById('totalStudentsCount').textContent = data.summary.total;
    document.getElementById('totalRegisteredCount').textContent = data.summary.registered;
    document.getElementById('totalNotRegisteredCount').textContent = data.summary.notRegistered;
    
    const rate = data.summary.total > 0 ? ((data.summary.registered / data.summary.total) * 100).toFixed(1) : 0;
    document.getElementById('totalRegistrationRate').textContent = `${rate}%`;
    
    // Update department breakdown table
    const tableBody = document.getElementById('deptStatsTable');
    tableBody.innerHTML = '';
    
    data.departments.forEach((dept, index) => {
      const percentage = dept.total > 0 ? ((dept.registered / dept.total) * 100).toFixed(1) : 0;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${dept.name}</td>
        <td>${dept.total}</td>
        <td style="color:#10b981;font-weight:600;">${dept.registered}</td>
        <td style="color:#ef4444;font-weight:600;">${dept.notRegistered}</td>
        <td>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width:${percentage}%;">${percentage}%</div>
          </div>
        </td>
        <td>
          <button class="expand-btn" onclick="showDepartmentDetails('${dept.name}')">
            View Details
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    
    LoadingManager.hide();
  } catch (error) {
    console.error('Error loading statistics:', error);
    LoadingManager.hide();
    alert('Failed to load statistics. Please try again.');
  }
}

// Show department details
async function showDepartmentDetails(department) {
  LoadingManager.show('Loading department details...');
  
  try {
    const response = await fetch(`${API_URL}/api/statistics/department/${encodeURIComponent(department)}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch department details');
    }
    
    const data = await response.json();
    
    // Populate registered students table
    const registeredTable = document.getElementById('registeredStudentsTable');
    registeredTable.innerHTML = '';
    
    if (data.registered.length === 0) {
      registeredTable.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">No registered students</td></tr>';
    } else {
      data.registered.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${student.name}</td>
          <td>${student.alumniId || 'N/A'}</td>
          <td>${student.email || 'N/A'}</td>
          <td>${student.department}</td>
          <td>${student.batch}</td>
        `;
        registeredTable.appendChild(row);
      });
    }
    
    // Populate not registered students table
    const notRegisteredTable = document.getElementById('notRegisteredStudentsTable');
    notRegisteredTable.innerHTML = '';
    
    if (data.notRegistered.length === 0) {
      notRegisteredTable.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">All students registered!</td></tr>';
    } else {
      data.notRegistered.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${student.name}</td>
          <td>${student.admissionNumber}</td>
          <td>${student.email || 'N/A'}</td>
          <td>${student.department}</td>
          <td>${student.batch}</td>
        `;
        notRegisteredTable.appendChild(row);
      });
    }
    
    // Show details section
    const detailsSection = document.getElementById('statsDetailsSection');
    detailsSection.style.display = 'block';
    
    // Update department title
    const title = detailsSection.querySelector('h3');
    if (title) {
      title.textContent = `Department Details: ${department}`;
    }
    
    LoadingManager.hide();
  } catch (error) {
    console.error('Error loading department details:', error);
    LoadingManager.hide();
    alert('Failed to load department details. Please try again.');
  }
}

// Close details section
function closeDetailsSection() {
  const detailsSection = document.getElementById('statsDetailsSection');
  if (detailsSection) {
    detailsSection.style.display = 'none';
  }
}

// Make functions globally accessible
window.refreshStatistics = refreshStatistics;
window.showDepartmentDetails = showDepartmentDetails;
window.closeDetailsSection = closeDetailsSection;