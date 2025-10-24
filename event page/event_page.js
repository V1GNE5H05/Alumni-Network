let eventsData = [
    {
        title: "Annual Alumni Meetup",
        date: "2024-12-15",
        time: "6:00 PM - 9:00 PM",
        location: "University Auditorium",
        description: "Join us for a night of networking, reminiscing, and fun! Catch up with old friends and make new connections."
    },
    {
        title: "Career Development Workshop",
        date: "2024-10-28",
        time: "10:00 AM - 1:00 PM",
        location: "Online (Zoom)",
        description: "Learn from industry experts on how to advance your career and leverage your alumni network for growth."
    },
    {
        title: "Alumni Sports Day",
        date: "2024-09-05",
        time: "9:00 AM - 5:00 PM",
        location: "University Sports Complex",
        description: "A day of friendly competition and fun! Sign up for football, basketball, or just come to cheer."
    },
    {
        title: "Guest Lecture Series: 'Future Tech'",
        date: "2024-11-10",
        time: "7:00 PM - 8:30 PM",
        location: "Science Building, Room 201",
        description: "An exclusive lecture by leading tech innovators. Q&A session and reception to follow."
    }
];

const eventsGrid = document.getElementById('eventsGrid');
const viewEventModal = document.getElementById('viewEventModal');
const viewModalTitle = document.getElementById('viewModalTitle');
const viewModalMeta = document.getElementById('viewModalMeta');
const viewModalDesc = document.getElementById('viewModalDesc');
const addEventBtn = document.getElementById('addEventBtn');
const addEventModal = document.getElementById('addEventModal');
const addEventForm = document.getElementById('addEventForm');


function renderEvents() {
    eventsGrid.innerHTML = '';
    eventsData.forEach(event => {
        const card = document.createElement('div');
        card.classList.add('event-card');
        card.innerHTML = `
            <div class="event-poster">
                <img src="${event.posterUrl}" alt="${event.title} Poster">
            </div>
            <div class="event-details">
                <h2>${event.title}</h2>
                <div class="event-meta">
                    <p><i class="fas fa-calendar-alt"></i> ${event.date}</p>
                    <p><i class="fas fa-clock"></i> ${event.time}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                </div>
                <p class="event-description">${event.description}</p>
                <button class="details-btn">View Details</button>
            </div>
        `;
        const detailsBtn = card.querySelector('.details-btn');
        detailsBtn.addEventListener('click', () => openModal('viewEventModal', event));

        eventsGrid.appendChild(card);
    });
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
        viewModalDesc.textContent = event.description;
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

addEventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newEvent = {
        title: addEventForm.eventTitle.value,
        date: addEventForm.eventDate.value,
        time: addEventForm.eventTime.value,
        location: addEventForm.eventLocation.value,
        posterUrl: addEventForm.eventPoster.value || "https://placehold.co/600x400/999999/FFFFFF?text=New+Event",
        description: addEventForm.eventDescription.value
    };
    eventsData.push(newEvent);
    renderEvents();
    closeModal('addEventModal');
    addEventForm.reset();
});

window.onclick = function(event) {
    if (event.target === viewEventModal) {
        closeModal('viewEventModal');
    }
    if (event.target === addEventModal) {
        closeModal('addEventModal');
    }
}
renderEvents();
