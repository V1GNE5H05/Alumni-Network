// Dark Mode Implementation
const DarkMode = {
    init() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
        }
        this.createToggleButton();
    },
    
    toggle() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
    },
    
    createToggleButton() {
        if (document.getElementById('darkModeToggle')) return;
        
        const btn = document.createElement('button');
        btn.id = 'darkModeToggle';
        btn.className = 'dark-mode-toggle';
        btn.innerHTML = '🌙';
        btn.onclick = () => {
            this.toggle();
            btn.innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
        };
        
        if (document.body.classList.contains('dark-mode')) {
            btn.innerHTML = '☀️';
        }
        
        document.body.appendChild(btn);
    }
};

// Initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
    DarkMode.init();
});

document.getElementById('postJobForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('postJobMsg');
  msg.textContent = '';
  msg.style.color = '#222';

  // Gather inputs
  const jobTitle = form.jobTitle.value.trim();
  const company = form.company.value.trim();
  const companyWebsite = form.companyWebsite.value.trim();
  const experienceFrom = form.experienceFrom.value;
  const experienceTo = form.experienceTo.value;
  const location = form.location.value.split(',').map(s => s.trim()).filter(Boolean);
  const contactEmail = form.contactEmail.value.trim();
  const jobArea = form.jobArea.value.trim();
  const skills = form.skills.value.split(',').map(s => s.trim()).filter(Boolean);
  const salary = form.salary.value.trim();
  const applicationDeadline = form.applicationDeadline.value;
  const jobDescription = form.jobDescription.value.trim();

  // Client validation
  if (!jobTitle || !company || !contactEmail || !jobDescription) {
    msg.textContent = "Please fill all required fields.";
    msg.style.color = "#e22";
    return;
  }
  if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(contactEmail)) {
    msg.textContent = "Invalid email address.";
    msg.style.color = "#e22";
    return;
  }
  if (experienceFrom && experienceTo && parseInt(experienceTo) < parseInt(experienceFrom)) {
    msg.textContent = "Experience To must be greater than or equal to From.";
    msg.style.color = "#e22";
    return;
  }
  
  // Validate application deadline is not in the past
  if (applicationDeadline) {
    const selectedDate = new Date(applicationDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    if (selectedDate < today) {
      msg.textContent = "Application deadline cannot be in the past.";
      msg.style.color = "#e22";
      return;
    }
  }
  
  // Location is now optional
  // if (!location.length) {
  //   msg.textContent = "Please enter at least one location.";
  //   msg.style.color = "#e22";
  //   return;
  // }

  // Submit
  msg.textContent = "Posting...";
  msg.style.color = "#444";
  try {
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
  const res = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle, company, companyWebsite, experienceFrom, experienceTo,
        location, contactEmail, jobArea, skills, salary,
        applicationDeadline, jobDescription
      })
    });
    if (res.ok) {
      msg.textContent = "Job posted successfully! Redirecting...";
      msg.style.color = "#38a243";
      setTimeout(() => window.location.href = 'job-sidebar.html', 1200);
    } else {
      const out = await res.json();
      msg.textContent = out.message || "Error posting job.";
      msg.style.color = "#e22";
    }
  } catch (e) {
    msg.textContent = "Network error. Please try again.";
    msg.style.color = "#e22";
  }
});