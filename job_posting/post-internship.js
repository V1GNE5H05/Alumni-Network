document.getElementById('postInternForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('postInternMsg');
  msg.textContent = '';
  msg.style.color = '#222';

  // Gather inputs
  const title = form.title.value.trim();
  const company = form.company.value.trim();
  const companyWebsite = form.companyWebsite.value.trim();
  const duration = form.duration.value.trim();
  const location = form.location.value.split(',').map(s => s.trim()).filter(Boolean);
  const contactEmail = form.contactEmail.value.trim();
  const jobArea = form.jobArea.value.trim();
  const skills = form.skills.value.split(',').map(s => s.trim()).filter(Boolean);
  const stipend = form.stipend.value.trim();
  const applicationDeadline = form.applicationDeadline.value;
  const description = form.description.value.trim();

  // Client validation
  if (!title || !company || !contactEmail || !description) {
    msg.textContent = "Please fill all required fields.";
    msg.style.color = "#e22";
    return;
  }
  if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(contactEmail)) {
    msg.textContent = "Invalid email address.";
    msg.style.color = "#e22";
    return;
  }
  if (!location.length) {
    msg.textContent = "Please enter at least one location.";
    msg.style.color = "#e22";
    return;
  }

  // Submit
  msg.textContent = "Posting...";
  msg.style.color = "#444";
  try {
  const res = await fetch('http://localhost:5000/api/internships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, company, companyWebsite, duration,
        location, contactEmail, jobArea, skills, stipend,
        applicationDeadline, description
      })
    });
    if (res.ok) {
      msg.textContent = "Internship posted successfully! Redirecting...";
      msg.style.color = "#38a243";
      setTimeout(() => window.location.href = 'job-sidebar.html', 1200);
    } else {
      const out = await res.json();
      msg.textContent = out.message || "Error posting internship.";
      msg.style.color = "#e22";
    }
  } catch (e) {
    msg.textContent = "Network error. Please try again.";
    msg.style.color = "#e22";
  }
});