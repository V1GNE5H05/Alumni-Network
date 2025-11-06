
const identifier = sessionStorage.getItem('loggedInUser');
const API_URL = window.API_BASE_URL || 'http://localhost:5000';

// ============= AUTHENTICATION CHECK =============
// Check authentication on page load
if (!AuthCheck.requireAuth()) {
    // Will redirect if not authenticated
} else {
    // Initialize auth protection
    AuthCheck.init();
}

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
    // Check if toggle already exists
    if (document.getElementById('darkModeToggle')) return;
    
    const btn = document.createElement('button');
    btn.id = 'darkModeToggle';
    btn.className = 'dark-mode-toggle';
    btn.textContent = '🌙';
    btn.title = 'Toggle Dark Mode (Ctrl+D)';
    btn.onclick = () => this.toggle();
    
    document.body.appendChild(btn);
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

// Initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
  DarkMode.init();
  console.log('Dark mode initialized. Press Ctrl+D to toggle!');
});

// Fetch and display profile
fetch(`${API_URL}/profile/${identifier}`)
	.then(res => {
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}
		return res.json();
	})
	.then(data => {
		// Backend returns { success: true, alumni: {...} }
		const profile = data.alumni || data;
		
		// Display profile information: mail, name, batch
		document.getElementById("mail").innerHTML = profile.email || profile.contact || "Email not set";
		document.getElementById("name").innerHTML = profile.name || "Name not set";
		document.getElementById("batch").innerHTML = profile.batch || "Batch not set";
	})
	.catch(error => {
		console.error('Error fetching profile:', error);
		// Display error or default values
		document.getElementById("mail").innerHTML = "Error loading profile";
		document.getElementById("name").innerHTML = "";
		document.getElementById("batch").innerHTML = "";
	});

// Fetch and display posts
fetch(`${API_URL}/posts`)
	.then(res => res.json())
	.then(posts => {
		let postsHtml = '';
		// Reverse posts array to display last posted first (stack order)
		posts.slice().reverse().forEach((post, idx) => {
			postsHtml += `<div class="post" data-idx="${idx}">
				<label style="font-weight:bold;">${post.author || 'Unknown'}</label><br><br>
				<label style="color:gray;">${post.time || ''}</label><br>
				${post.imageUrl ? `<img src="${post.imageUrl.startsWith('http') ? post.imageUrl : API_URL + post.imageUrl}" alt="user post" style="width: 100%; max-width: 600px; height: auto; margin: 15px auto; display: block; border-radius: 8px;">` : `<img src="images/alternate.png" alt="alternate" style="width: 100%; max-width: 500px; height: auto; display: block; margin: 15px auto;">`}
				<p>${post.content || ''}</p>
			</div>`;
		});
		document.getElementById("post").innerHTML = postsHtml;
	});

// Fetch and display events
fetch(`${API_URL}/events`)
	.then(res => res.json())
	.then(events => {
		let eventsHtml = '';
		events.forEach(event => {
			eventsHtml += `<div class="event-details">
				<label class="event-label">${event.title || ''} 🔗 <a href="${event.link || '#'}" target="_blank">click here</a></label>
			</div>`;
		});
		document.querySelector('.event-lister').innerHTML += eventsHtml;
	});