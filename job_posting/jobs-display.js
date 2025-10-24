// Enhanced jobs-display.js with internship support
// Dynamic filters and view switching between jobs and internships

let currentView = 'jobs'; // Track current view

document.addEventListener('DOMContentLoaded', () => {
  setupDropdownToggles();
  setupViewSwitching();
  Promise.all([initCompanies(), initJobAreas(), initSkills(), initLocations()]).then(() => {
    loadFromUrl();
  });
});

function setupViewSwitching() {
  // Handle sidebar item clicks for view switching
  document.querySelectorAll('.sidebar-item[data-type]').forEach(item => {
    item.addEventListener('click', function() {
      const type = this.getAttribute('data-type');
      if (type) {
        switchView(type);
        
        // Update active state
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });
}

function switchView(type) {
  currentView = type;
  const p = new URLSearchParams(window.location.search);
  p.set('view', type);
  const newUrl = `${window.location.pathname}?${p.toString()}`;
  history.pushState({}, '', newUrl);
  
  // Reload filters and content for the new view
  Promise.all([initCompanies(), initJobAreas(), initSkills(), initLocations()]).then(() => {
    loadFromUrl();
  });
}

function setupDropdownToggles() {
  document.querySelectorAll('.sidebar-dropdown').forEach((item) => {
    item.addEventListener('click', function () {
      this.classList.toggle('open');
      const next = this.nextElementSibling;
      if (next && next.classList.contains('sidebar-dropdown-list')) {
        next.classList.toggle('show');
      }
    });
  });
}

function getFiltersFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const view = p.get('view') || 'jobs';
  currentView = view;
  
  return {
    view: view,
    company: p.get('company') || '',
    jobArea: p.get('jobArea') || '',
    skill: p.get('skill') || '',
    location: p.get('location') || ''
  };
}

function setFilterParam(key, value) {
// Add a function to clear all filters
function clearAllFilters() {
  const p = new URLSearchParams();
  p.set('view', currentView);
  const newUrl = `${window.location.pathname}?${p.toString()}`;
  history.pushState({}, '', newUrl);
  syncSidebarActiveStates();
  loadFromUrl();
}

// Attach Show All button event
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('showAllJobsBtn');
  if (btn) btn.addEventListener('click', clearAllFilters);
});
  const p = new URLSearchParams(window.location.search);
  if (value) p.set(key, value);
  else p.delete(key);
  
  // Maintain current view
  p.set('view', currentView);
  
  const newUrl = `${window.location.pathname}?${p.toString()}`;
  history.pushState({}, '', newUrl);
  syncSidebarActiveStates();
  loadFromUrl();
}

function syncSidebarActiveStates() {
  const f = getFiltersFromUrl();
  markActiveItems('companiesList', f.company);
  markActiveItems('jobAreasList', f.jobArea);
  markActiveItems('skillsList', f.skill);
  markActiveItems('locationsList', f.location);
}

function markActiveItems(listId, value) {
  const list = document.getElementById(listId);
  if (!list) return;
  list.querySelectorAll('.sidebar-subitem').forEach((n) => n.classList.remove('active'));
  const selector = value ? `.sidebar-subitem[data-value="${cssEscapeAttr(value)}"]` : `.sidebar-subitem[data-value=""]`;
  const match = list.querySelector(selector);
  if (match) match.classList.add('active');
}

function cssEscapeAttr(val) {
  return String(val).replace(/"/g, '\\"');
}

// Initialize filter lists based on current view
async function initCompanies() {
  const endpoint = currentView === 'internships'
    ? 'http://localhost:5000/api/internships/companies'
    : 'http://localhost:5000/api/companies';
  await buildFilterList({
    endpoint: endpoint,
    containerId: 'companiesList',
    param: 'company',
    allLabel: 'All Companies',
  });
}

async function initJobAreas() {
  const endpoint = currentView === 'internships'
    ? 'http://localhost:5000/api/internships/job-areas'
    : 'http://localhost:5000/api/job-areas';
  await buildFilterList({
    endpoint: endpoint,
    containerId: 'jobAreasList',
    param: 'jobArea',
    allLabel: 'All Job Areas',
  });
}

async function initSkills() {
  const endpoint = currentView === 'internships'
    ? 'http://localhost:5000/api/internships/skills'
    : 'http://localhost:5000/api/skills';
  await buildFilterList({
    endpoint: endpoint,
    containerId: 'skillsList',
    param: 'skill',
    allLabel: 'All Skills',
  });
}

async function initLocations() {
  const endpoint = currentView === 'internships'
    ? 'http://localhost:5000/api/internships/locations'
    : 'http://localhost:5000/api/locations';
  await buildFilterList({
    endpoint: endpoint,
    containerId: 'locationsList',
    param: 'location',
    allLabel: 'All Locations',
  });
}

async function buildFilterList({ endpoint, containerId, param, allLabel }) {
  const list = document.getElementById(containerId);
  if (!list) return;
  const current = getFiltersFromUrl()[param] || '';

  list.innerHTML = `<div class="sidebar-subitem" style="color:#888;">Loading...</div>`;
  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load');
    const values = await res.json();

    const items = values.map((name) => {
      const active = current && name.trim().toLowerCase() === current.trim().toLowerCase();
      return `<div class="sidebar-subitem${active ? ' active' : ''}" data-value="${escAttr(name)}">${esc(name)}</div>`;
    });
    const allActive = !current;
    list.innerHTML =
      `<div class="sidebar-subitem${allActive ? ' active' : ''}" data-value="">${allLabel}</div>` +
      items.join('');

    // Click handlers
    list.querySelectorAll('.sidebar-subitem').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = el.getAttribute('data-value') || '';
        setFilterParam(param, value);
        // After setting filter, load correct view
        if (currentView === 'internships') {
          loadInternships(getFiltersFromUrl());
        } else {
          loadJobs(getFiltersFromUrl());
        }
      });
    });
  } catch (_e) {
    list.innerHTML = `<div class="sidebar-subitem" style="color:#e22;">Failed to load</div>`;
  }
}

function loadFromUrl() {
  const f = getFiltersFromUrl();
  
  // Update sidebar active states
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  const activeItem = document.querySelector(`.sidebar-item[data-type="${f.view}"]`) || 
                     document.querySelector('.sidebar-item');
  if (activeItem) activeItem.classList.add('active');
  
  if (f.view === 'internships') {
    loadInternships(f);
  } else {
    loadJobs(f);
  }
}

async function loadJobs(filters) {
  const panel = document.getElementById('jobsListPanel');
  if (!panel) return;
  panel.innerHTML = 'Loading jobs...';

  try {
  const url = new URL('http://localhost:5000/api/jobs');
    if (filters.company) url.searchParams.set('company', filters.company);
    if (filters.jobArea) url.searchParams.set('jobArea', filters.jobArea);
    if (filters.skill) url.searchParams.set('skill', filters.skill);
    if (filters.location) url.searchParams.set('location', filters.location);

  const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load jobs');
    const jobs = await res.json();

    if (!Array.isArray(jobs) || jobs.length === 0) {
      panel.innerHTML = "<div style='color:#888;margin-top:10px;'>No jobs available.</div>";
      return;
    }

    panel.innerHTML = jobs.map(renderJobCard).join('');
    bindJobFilters(panel);
  } catch (_e) {
    panel.innerHTML = "<div style='color:#e22;margin-top:10px;'>Failed to load jobs.</div>";
  }
}

async function loadInternships(filters) {
  const panel = document.getElementById('jobsListPanel');
  if (!panel) return;
  panel.innerHTML = 'Loading internships...';

  try {
    const url = new URL('http://localhost:5000/api/internships');
    if (filters.company) url.searchParams.set('company', filters.company);
    if (filters.jobArea) url.searchParams.set('jobArea', filters.jobArea);
    if (filters.skill) url.searchParams.set('skill', filters.skill);
    if (filters.location) url.searchParams.set('location', filters.location);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load internships');
    const internships = await res.json();

    if (!Array.isArray(internships) || internships.length === 0) {
      panel.innerHTML = "<div style='color:#888;margin-top:10px;'>No internships available.</div>";
      return;
    }

    panel.innerHTML = internships.map(renderInternshipCard).join('');
    bindJobFilters(panel);
  } catch (_e) {
    panel.innerHTML = "<div style='color:#e22;margin-top:10px;'>Failed to load internships.</div>";
  }
}

function bindJobFilters(panel) {
  // Bind click handlers inside cards to set filters
  panel.querySelectorAll('.job-company-filter').forEach((el) => {
    el.addEventListener('click', () => setFilterParam('company', el.dataset.company || ''));
  });
  panel.querySelectorAll('.job-area-filter').forEach((el) => {
    el.addEventListener('click', () => setFilterParam('jobArea', el.dataset.jobarea || ''));
  });
  panel.querySelectorAll('.job-skill-filter').forEach((el) => {
    el.addEventListener('click', () => setFilterParam('skill', el.dataset.skill || ''));
  });
  panel.querySelectorAll('.job-location-filter').forEach((el) => {
    el.addEventListener('click', () => setFilterParam('location', el.dataset.location || ''));
  });
}

function renderJobCard(job) {
  const title = esc(job.jobTitle || '');
  const company = String(job.company || '').trim();
  const companyEsc = esc(company);
  const companyWebsite = job.companyWebsite ? String(job.companyWebsite).trim() : '';
  const jobAreaRaw = String(job.jobArea || '').trim();
  const jobAreaEsc = esc(jobAreaRaw);

  const skillsArr = Array.isArray(job.skills) ? job.skills.filter(Boolean) : [];
  const locArr = Array.isArray(job.location) ? job.location.filter(Boolean) : [];

  const exp = formatExperience(job.experienceFrom, job.experienceTo);
  const posted = timeAgo(job.postedDate, job._id);

  const skillsHtml = skillsArr.length
    ? skillsArr.map(s => `<span class="job-skill-filter" data-skill="${escAttr(s)}">${esc(s)}</span>`).join(', ')
    : '—';

  const locationsHtml = locArr.length
    ? locArr.map(l => `<span class="job-location-filter" data-location="${escAttr(l)}">${esc(l)}</span>`).join(', ')
    : '—';

  return `
    <div class="job-list-card job-card-compact">
      <div class="job-card-header">
        <div class="job-card-title">${title}</div>
        <div class="job-age">${posted}</div>
      </div>

      <div class="job-row">
        <span class="job-label">COMPANY:</span>
        <span class="job-value">
          <span class="job-company-filter" data-company="${escAttr(company)}">${companyEsc}</span>
          ${companyWebsite ? `&nbsp;&nbsp;<a href="${escAttr(companyWebsite)}" target="_blank" class="job-link">Website</a>` : ''}
        </span>
      </div>

      <div class="job-row">
        <span class="job-label">LOCATION:</span>
        <span class="job-value">${locationsHtml}</span>
      </div>

      <div class="job-row">
        <span class="job-label">JOB AREA:</span>
        <span class="job-value">
          ${jobAreaRaw ? `<span class="job-area-filter" data-jobarea="${escAttr(jobAreaRaw)}">${jobAreaEsc}</span>` : '—'}
        </span>
      </div>

      <div class="job-row">
        <span class="job-label">SKILLS:</span>
        <span class="job-value">${skillsHtml}</span>
      </div>

      <div class="job-row">
        <span class="job-label">EXPERIENCE:</span>
        <span class="job-value">${exp}</span>
      </div>

      <div class="job-card-source"></div>
    </div>
  `;
}

function renderInternshipCard(internship) {
  const title = esc(internship.title || '');
  const company = String(internship.company || '').trim();
  const companyEsc = esc(company);
  const companyWebsite = internship.companyWebsite ? String(internship.companyWebsite).trim() : '';
  const jobAreaRaw = String(internship.jobArea || '').trim();
  const jobAreaEsc = esc(jobAreaRaw);

  const skillsArr = Array.isArray(internship.skills) ? internship.skills.filter(Boolean) : [];
  const locArr = Array.isArray(internship.location) ? internship.location.filter(Boolean) : [];

  const duration = internship.duration ? esc(internship.duration) : '—';
  const stipend = internship.stipend ? esc(internship.stipend) : '—';
  const posted = timeAgo(internship.postedDate, internship._id);

  const skillsHtml = skillsArr.length
    ? skillsArr.map(s => `<span class="job-skill-filter" data-skill="${escAttr(s)}">${esc(s)}</span>`).join(', ')
    : '—';

  const locationsHtml = locArr.length
    ? locArr.map(l => `<span class="job-location-filter" data-location="${escAttr(l)}">${esc(l)}</span>`).join(', ')
    : '—';

  return `
    <div class="job-list-card job-card-compact">
      <div class="job-card-header">
        <div class="job-card-title">${title}</div>
        <div class="job-age">${posted}</div>
      </div>

      <div class="job-row">
        <span class="job-label">COMPANY:</span>
        <span class="job-value">
          <span class="job-company-filter" data-company="${escAttr(company)}">${companyEsc}</span>
          ${companyWebsite ? `&nbsp;&nbsp;<a href="${escAttr(companyWebsite)}" target="_blank" class="job-link">Website</a>` : ''}
        </span>
      </div>

      <div class="job-row">
        <span class="job-label">LOCATION:</span>
        <span class="job-value">${locationsHtml}</span>
      </div>

      <div class="job-row">
        <span class="job-label">JOB AREA:</span>
        <span class="job-value">
          ${jobAreaRaw ? `<span class="job-area-filter" data-jobarea="${escAttr(jobAreaRaw)}">${jobAreaEsc}</span>` : '—'}
        </span>
      </div>

      <div class="job-row">
        <span class="job-label">SKILLS:</span>
        <span class="job-value">${skillsHtml}</span>
      </div>

      <div class="job-row">
        <span class="job-label">DURATION:</span>
        <span class="job-value">${duration}</span>
      </div>

      <div class="job-row">
        <span class="job-label">STIPEND:</span>
        <span class="job-value">${stipend}</span>
      </div>

      <div class="job-card-source"></div>
    </div>
  `;
}

function formatExperience(from, to) {
  const hasFrom = from !== undefined && from !== null && String(from) !== '';
  const hasTo = to !== undefined && to !== null && String(to) !== '';
  if (hasFrom && hasTo) return `${Number(from)} - ${Number(to)} Years`;
  if (hasFrom && !hasTo) return `${Number(from)}+ Years`;
  if (!hasFrom && hasTo) return `Up to ${Number(to)} Years`;
  return '—';
}

function timeAgo(postedDate, id) {
  let ms = null;
  if (postedDate) {
    const d = new Date(postedDate);
    if (!isNaN(d)) ms = d.getTime();
  }
  if (!ms && typeof id === 'string' && id.length >= 8) {
    const ts = parseInt(id.substring(0, 8), 16);
    if (!isNaN(ts)) ms = ts * 1000;
  }
  if (!ms) return '';
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function escAttr(s) {
  return esc(s).replace(/"/g, '&quot;');
}