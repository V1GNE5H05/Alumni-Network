// ============= AUTHENTICATION CHECK =============
if (typeof AuthCheck !== 'undefined') {
    if (!AuthCheck.requireAuth()) {
        // Will redirect if not authenticated
    } else {
        AuthCheck.preventBackButton();
    }
}

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
        // Button is already in HTML, just set up the click handler
        const btn = document.getElementById('darkModeToggle');
        if (btn) {
            btn.onclick = () => {
                this.toggle();
                btn.innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
            };
            
            if (document.body.classList.contains('dark-mode')) {
                btn.innerHTML = '☀️';
            }
        }
    }
};

// Initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
    DarkMode.init();
});

let eventsData = [];
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
const EVENTS_API_BASE = `${API_BASE_URL}/api/events`;

console.log('🌐 Events API Base URL:', EVENTS_API_BASE);

const eventsGrid = document.getElementById('eventsGrid');
const viewEventModal = document.getElementById('viewEventModal');
const viewModalTitle = document.getElementById('viewModalTitle');
const viewModalMeta = document.getElementById('viewModalMeta');
const viewModalDesc = document.getElementById('viewModalDesc');
const addEventBtn = document.getElementById('addEventBtn');
const addEventModal = document.getElementById('addEventModal');
const addEventForm = document.getElementById('addEventForm');


async function renderEvents() {
    eventsGrid.innerHTML = '<div style="padding:16px;color:#888;">Loading events...</div>';
    try {
        console.log('📡 Fetching events from:', EVENTS_API_BASE);
        const res = await fetch(EVENTS_API_BASE);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('✅ Events data received:', data);
        eventsData = Array.isArray(data) ? data : [];
        
        // Get current user ID
        const currentUserId = sessionStorage.getItem('loggedInUser');
        
        eventsGrid.innerHTML = '';
        eventsData.forEach(event => {
            const card = document.createElement('div');
            card.classList.add('event-card');
            
            // Check if user is registered
            const isRegistered = event.participants && event.participants.some(
                p => p.alumniId === currentUserId
            );
            
            const participantCountHTML = event.allowParticipation 
                ? `<div class="participant-count">👥 ${event.participantCount || 0} registered</div>` 
                : '';
            
            const participationButtonHTML = event.allowParticipation 
                ? (isRegistered 
                    ? `<button class="cancel-btn" data-event-id="${event._id}">Cancel Registration</button>`
                    : `<button class="register-btn" data-event-id="${event._id}">Register Now</button>`)
                : '';
            
            card.innerHTML = `
                <div class="event-poster">
                    <img src="${event.posterUrl}" alt="${event.title} Poster">
                    ${event.allowParticipation ? '<div class="registration-badge">Open for Registration</div>' : ''}
                </div>
                <div class="event-details">
                    <h2>${event.title}</h2>
                    <div class="event-meta">
                        <p><i class="fas fa-calendar-alt"></i> ${event.date}</p>
                        <p><i class="fas fa-clock"></i> ${event.time}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    </div>
                    ${participantCountHTML}
                    <p class="event-description">${event.description}</p>
                    <div style="display:flex;gap:10px;margin-top:10px;">
                        <button class="details-btn">View Details</button>
                        ${participationButtonHTML}
                    </div>
                </div>
            `;
            
            const detailsBtn = card.querySelector('.details-btn');
            detailsBtn.addEventListener('click', () => openModal('viewEventModal', event));
            
            // Add event listeners for participation buttons
            const registerBtn = card.querySelector('.register-btn');
            if (registerBtn) {
                registerBtn.addEventListener('click', () => registerForEvent(event._id));
            }
            
            const cancelBtn = card.querySelector('.cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => cancelEventRegistration(event._id));
            }
            
            eventsGrid.appendChild(card);
        });
        if (eventsData.length === 0) {
            eventsGrid.innerHTML = '<div style="padding:16px;color:#888;">No events found.</div>';
        }
    } catch (e) {
        console.error('❌ Error loading events:', e);
        eventsGrid.innerHTML = `<div style="padding:16px;color:#b3261e;">
            Error loading events: ${e.message}<br>
            <small>Check console for details. Make sure the server is running.</small>
        </div>`;
    }
}

function openModal(modalId, event = null) {
    const modal = document.getElementById(modalId);
    if (event && modalId === 'viewEventModal') {
        viewModalTitle.textContent = event.title;
        viewModalMeta.innerHTML = `
            <p><i class="fas fa-calendar-alt"></i> ${event.date}</p>
            <p><i class="fas fa-clock"></i> ${event.time}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
        `;
        
        // Build description content with participation button if applicable
        let descriptionHTML = `<p>${event.description}</p>`;
        
        // Add participation button if event allows participation
        if (event.allowParticipation === true || event.allowParticipation === 'true') {
            const currentUserId = sessionStorage.getItem('loggedInUser');
            const isRegistered = event.participants && event.participants.some(
                p => p.alumniId === currentUserId
            );
            
            const participantInfo = event.participantCount 
                ? `<p style="margin:15px 0;color:#1976d2;font-weight:500;">👥 ${event.participantCount} alumni registered</p>`
                : '';
            
            const participationBtn = isRegistered
                ? `<button onclick="cancelEventRegistrationFromModal('${event._id}')" style="width:100%;padding:12px;margin-top:15px;background:linear-gradient(135deg,#fc8181,#f56565);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:500;font-size:1rem;">Cancel Registration</button>`
                : `<button onclick="registerForEventFromModal('${event._id}')" style="width:100%;padding:12px;margin-top:15px;background:linear-gradient(135deg,#48bb78,#38a169);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:500;font-size:1rem;">Register for Event</button>`;
            
            viewModalDesc.innerHTML = descriptionHTML + participantInfo + participationBtn;
        } else {
            viewModalDesc.innerHTML = descriptionHTML;
        }
    }
    modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

addEventBtn.addEventListener('click', () => {
    openModal('addEventModal');
});

addEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newEvent = {
        title: addEventForm.eventTitle.value,
        date: addEventForm.eventDate.value,
        time: addEventForm.eventTime.value,
        location: addEventForm.eventLocation.value,
        posterUrl: addEventForm.eventPoster.value || "https://placehold.co/600x400/999999/FFFFFF?text=New+Event",
        description: addEventForm.eventDescription.value
    };
    try {
        const res = await fetch(EVENTS_API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEvent)
        });
        const data = await res.json();
        if (res.ok && data.success) {
            await renderEvents();
            closeModal('addEventModal');
            addEventForm.reset();
        } else {
            alert(data.message || 'Error posting event');
        }
    } catch (err) {
        alert('Network error: ' + err.message);
    }
});

window.onclick = function(event) {
    if (event.target === viewEventModal) {
        closeModal('viewEventModal');
    }
    if (event.target === addEventModal) {
        closeModal('addEventModal');
    }
}

// Get current alumni data from sessionStorage and database
async function getCurrentAlumniData() {
    // Check if data is cached in localStorage
    const cachedData = localStorage.getItem('alumni_data');
    if (cachedData) {
        return JSON.parse(cachedData);
    }
    
    // Get userid from sessionStorage
    const userid = sessionStorage.getItem('loggedInUser');
    if (!userid) {
        // Default fallback if not logged in
        return {
            alumniId: 'GUEST' + Date.now(),
            alumniName: 'Guest User',
            alumniEmail: 'guest@example.com'
        };
    }
    
    // Fetch alumni data from student collection
    try {
        const response = await fetch(`${API_BASE_URL}/api/alumni/profile/${userid}`);
        const data = await response.json();
        
        if (data && data.alumni_id) {
            const alumniData = {
                alumniId: data.alumni_id,
                alumniName: data.name || data.username || userid,
                alumniEmail: data.email || ''
            };
            // Cache it in localStorage for future use
            localStorage.setItem('alumni_data', JSON.stringify(alumniData));
            return alumniData;
        }
    } catch (error) {
        console.error('Error fetching alumni data:', error);
    }
    
    // Fallback if fetch fails
    return {
        alumniId: userid,
        alumniName: userid,
        alumniEmail: ''
    };
}

// Register for event
async function registerForEvent(eventId) {
    const userid = sessionStorage.getItem('loggedInUser');
    
    if (!userid) {
        alert('Please login to register for events');
        return;
    }
    
    if (!confirm('Do you want to register for this event?')) {
        return;
    }
    
    try {
        const res = await fetch(`${EVENTS_API_BASE}/${eventId}/participate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                alumniId: userid
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            alert('✅ Successfully registered for the event!');
            renderEvents(); // Refresh the events
        } else {
            alert('❌ ' + data.message);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// Register for event from modal
async function registerForEventFromModal(eventId) {
    const userid = sessionStorage.getItem('loggedInUser');
    
    if (!userid) {
        alert('Please login to register for events');
        return;
    }
    
    if (!confirm('Do you want to register for this event?')) {
        return;
    }
    
    try {
        const res = await fetch(`${EVENTS_API_BASE}/${eventId}/participate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                alumniId: userid
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            alert('✅ Successfully registered for the event!');
            closeModal('viewEventModal');
            renderEvents(); // Refresh the events
        } else {
            alert('❌ ' + data.message);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// Cancel event registration from modal
async function cancelEventRegistrationFromModal(eventId) {
    const userid = sessionStorage.getItem('loggedInUser');
    
    if (!userid) {
        alert('Please login first');
        return;
    }
    
    if (!confirm('Are you sure you want to cancel your registration?')) {
        return;
    }
    
    try {
        const res = await fetch(`${EVENTS_API_BASE}/${eventId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                alumniId: userid
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            alert('✅ Registration cancelled successfully!');
            closeModal('viewEventModal');
            renderEvents(); // Refresh the events
        } else {
            alert('❌ ' + data.message);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// Cancel event registration
async function cancelEventRegistration(eventId) {
    const userid = sessionStorage.getItem('loggedInUser');
    
    if (!userid) {
        alert('Please login first');
        return;
    }
    
    if (!confirm('Are you sure you want to cancel your registration?')) {
        return;
    }
    
    try {
        const res = await fetch(`${EVENTS_API_BASE}/${eventId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                alumniId: userid
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            alert('✅ Registration cancelled successfully!');
            renderEvents(); // Refresh the events
        } else {
            alert('❌ ' + data.message);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    renderEvents();
});
// Make functions globally accessible for onclick handlers
window.registerForEventFromModal = registerForEventFromModal;
window.cancelEventRegistrationFromModal = cancelEventRegistrationFromModal;
