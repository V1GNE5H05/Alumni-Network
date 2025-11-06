// Global Variables
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
let currentUser = null;
let allAlumni = [];
let currentFilters = { name: '', batch: '', department: '' };
let friendsList = [];
let pendingInvitations = [];
let activeFriend = null;
let currentFriendshipId = null;
let messageInterval = null;

// Authentication check
if (!AuthCheck.requireAuth()) {
    // Will redirect if not authenticated
} else {
    AuthCheck.init();
}

// Dark Mode Management
const DarkMode = {
    THEME_KEY: 'alumni_theme',
    
    init() {
        const saved = localStorage.getItem(this.THEME_KEY) || 'dark';
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
        const current = document.body.getAttribute('data-theme') || 'dark';
        this.apply(current === 'dark' ? 'light' : 'dark');
    },
    
    addToggle() {
        if (document.getElementById('darkModeToggle')) return;
        
        const btn = document.createElement('button');
        btn.id = 'darkModeToggle';
        btn.className = 'dark-mode-toggle';
        btn.textContent = '☀️';
        btn.title = 'Toggle Dark/Light Mode';
        btn.onclick = () => this.toggle();
        
        document.body.appendChild(btn);
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    DarkMode.init();
    
    const userLoaded = await loadCurrentUser();
    if (!userLoaded) return; // Stop if user not loaded
    
    await loadFriends();
    await loadInvitations();
    setupEventListeners();
    startMessagePolling();
});

// Keyboard Shortcut for Dark Mode (Ctrl+D)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        DarkMode.toggle();
    }
});

// Get current user from session
async function loadCurrentUser() {
    const userid = sessionStorage.getItem('loggedInUser');
    if (!userid) {
        alert('Please login first');
        window.location.href = '../login/login_page.html';
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/profile/${userid}`);
        const data = await response.json();
        
        console.log('Profile data:', data);
        
        if (data.success && data.alumni) {
            currentUser = {
                id: data.alumni.alumni_id || data.alumni.userid || userid,
                name: data.alumni.name || userid,
                batch: data.alumni.batch,
                department: data.alumni.department
            };
            console.log('Current user set:', currentUser);
            return true;
        } else {
            alert('User not found. Please login again.');
            window.location.href = '../login/login_page.html';
            return false;
        }
    } catch (error) {
        console.error('Error loading current user:', error);
        alert('Error loading user data. Please login again.');
        window.location.href = '../login/login_page.html';
        return false;
    }
}

// Load friends list
async function loadFriends() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/friends/${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            friendsList = data.friends;
            displayFriendsList();
        }
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

// Display friends in sidebar
function displayFriendsList() {
    const friendsListEl = document.getElementById('friends-list');
    
    if (friendsList.length === 0) {
        friendsListEl.innerHTML = '<p class="empty-state">No friends yet. Start adding friends!</p>';
        return;
    }

    friendsListEl.innerHTML = friendsList.map(friendship => {
        const friend = friendship.senderId === currentUser.id 
            ? { id: friendship.receiverId, name: friendship.receiverName }
            : { id: friendship.senderId, name: friendship.senderName };

        const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        return `
            <div class="friend-item" onclick="openChat('${friendship._id}', '${friend.id}', '${friend.name}')">
                <div class="friend-avatar">${initials}</div>
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-status">Click to chat</div>
                </div>
            </div>
        `;
    }).join('');
}

// Load pending invitations
async function loadInvitations() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/friends/invitations/${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            pendingInvitations = data.invitations;
            updateInvitationBadge();
        }
    } catch (error) {
        console.error('Error loading invitations:', error);
    }
}

// Update invitation badge
function updateInvitationBadge() {
    const badge = document.getElementById('invitations-badge');
    const count = document.getElementById('invitations-count');
    
    if (pendingInvitations.length > 0) {
        badge.style.display = 'block';
        count.textContent = pendingInvitations.length;
    } else {
        badge.style.display = 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('add-friends-btn').addEventListener('click', showAddFriendsView);
    document.getElementById('view-invitations-btn').addEventListener('click', showInvitationsView);
    document.getElementById('close-add-friends').addEventListener('click', showChatView);
    document.getElementById('close-invitations').addEventListener('click', showChatView);
    document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
    document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);
    document.getElementById('send-message-btn').addEventListener('click', sendMessage);
    
    // Enter key to send message
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Show different views
function showChatView() {
    document.getElementById('chat-view').style.display = 'flex';
    document.getElementById('add-friends-view').style.display = 'none';
    document.getElementById('invitations-view').style.display = 'none';
}

async function showAddFriendsView() {
    document.getElementById('chat-view').style.display = 'none';
    document.getElementById('add-friends-view').style.display = 'flex';
    document.getElementById('invitations-view').style.display = 'none';
    
    await loadAllAlumni();
}

function showInvitationsView() {
    document.getElementById('chat-view').style.display = 'none';
    document.getElementById('add-friends-view').style.display = 'none';
    document.getElementById('invitations-view').style.display = 'flex';
    
    displayInvitations();
}

// Load all alumni for adding friends
async function loadAllAlumni() {
    try {
        const response = await fetch(`${API_BASE_URL}/students`);
        const data = await response.json();
        
        console.log('Alumni data received:', data);
        
        if (data.success && data.students) {
            console.log('Current user ID:', currentUser.id);
            console.log('Sample alumni object:', data.students[0]);
            
            // Filter out current user - check multiple possible ID fields
            allAlumni = data.students.filter(s => 
                s.userid !== currentUser.id && 
                s.alumni_id !== currentUser.id &&
                s.username !== currentUser.id
            );
            console.log('Filtered alumni count:', allAlumni.length);
            populateFilters();
            displayAlumni(allAlumni);
        } else if (Array.isArray(data)) {
            // Handle old format (direct array)
            allAlumni = data.filter(s => 
                s.userid !== currentUser.id && 
                s.alumni_id !== currentUser.id &&
                s.username !== currentUser.id
            );
            console.log('Filtered alumni count (old format):', allAlumni.length);
            populateFilters();
            displayAlumni(allAlumni);
        } else {
            console.error('Unexpected data format:', data);
            document.getElementById('alumni-list').innerHTML = 
                '<p class="loading-text">No alumni data available.</p>';
        }
    } catch (error) {
        console.error('Error loading alumni:', error);
        document.getElementById('alumni-list').innerHTML = 
            '<p class="loading-text">Error loading alumni. Please try again.</p>';
    }
}

// Populate filter dropdowns
function populateFilters() {
    const batches = [...new Set(allAlumni.map(a => a.batch))].filter(Boolean).sort();
    const departments = [...new Set(allAlumni.map(a => a.department))].filter(Boolean).sort();

    const batchSelect = document.getElementById('filter-batch');
    const deptSelect = document.getElementById('filter-department');

    batchSelect.innerHTML = '<option value="">All Batches</option>' + 
        batches.map(b => `<option value="${b}">${b}</option>`).join('');
    
    deptSelect.innerHTML = '<option value="">All Departments</option>' + 
        departments.map(d => `<option value="${d}">${d}</option>`).join('');
}

// Apply filters
function applyFilters() {
    currentFilters.name = document.getElementById('filter-name').value.toLowerCase();
    currentFilters.batch = document.getElementById('filter-batch').value;
    currentFilters.department = document.getElementById('filter-department').value;

    let filtered = allAlumni;

    if (currentFilters.name) {
        filtered = filtered.filter(a => 
            a.name?.toLowerCase().includes(currentFilters.name) ||
            a.userid?.toLowerCase().includes(currentFilters.name)
        );
    }

    if (currentFilters.batch) {
        filtered = filtered.filter(a => a.batch === currentFilters.batch);
    }

    if (currentFilters.department) {
        filtered = filtered.filter(a => a.department === currentFilters.department);
    }

    displayAlumni(filtered);
}

// Clear filters
function clearFilters() {
    document.getElementById('filter-name').value = '';
    document.getElementById('filter-batch').value = '';
    document.getElementById('filter-department').value = '';
    currentFilters = { name: '', batch: '', department: '' };
    displayAlumni(allAlumni);
}

// Display alumni list
function displayAlumni(alumni) {
    const alumniListEl = document.getElementById('alumni-list');
    
    if (alumni.length === 0) {
        alumniListEl.innerHTML = '<p class="loading-text">No alumni found matching your filters.</p>';
        return;
    }

    alumniListEl.innerHTML = alumni.map(a => {
        const alumniId = a.alumni_id || a.userid || 'unknown';
        const initials = (a.name || alumniId).split(' ').map(n => n[0]).join('').toUpperCase();
        
        // Check if already friends or invitation pending
        const isFriend = friendsList.some(f => 
            f.senderId === alumniId || f.receiverId === alumniId
        );
        
        const hasPendingInvite = friendsList.some(f => 
            (f.senderId === currentUser.id && f.receiverId === alumniId && f.status === 'pending') ||
            (f.receiverId === currentUser.id && f.senderId === alumniId && f.status === 'pending')
        );

        let buttonHtml = '';
        if (isFriend) {
            buttonHtml = '<button class="btn-invite" disabled>Already Friends</button>';
        } else if (hasPendingInvite) {
            buttonHtml = '<button class="btn-invite" disabled>Invitation Pending</button>';
        } else {
            buttonHtml = `<button class="btn-invite" onclick="sendInvitation('${alumniId}', '${a.name || alumniId}')">
                <i class="fas fa-user-plus"></i> Send Invitation
            </button>`;
        }

        return `
            <div class="alumni-card">
                <div class="alumni-avatar">${initials}</div>
                <div class="alumni-name">${a.name || alumniId}</div>
                <div class="alumni-subheading">${a.batch || 'N/A'} • ${a.department || 'N/A'}</div>
                ${buttonHtml}
            </div>
        `;
    }).join('');
}

// Send friend invitation
async function sendInvitation(receiverId, receiverName) {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/friends/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: currentUser.id,
                senderName: currentUser.name,
                receiverId,
                receiverName
            })
        });

        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            await loadFriends(); // Refresh to update pending status
            applyFilters(); // Refresh the display
        } else {
            alert(data.message || 'Failed to send invitation');
        }
    } catch (error) {
        console.error('Error sending invitation:', error);
        alert('Error sending invitation. Please try again.');
    }
}

// Display invitations
function displayInvitations() {
    const invitationsListEl = document.getElementById('invitations-list');
    
    if (pendingInvitations.length === 0) {
        invitationsListEl.innerHTML = '<p class="loading-text">No pending invitations.</p>';
        return;
    }

    invitationsListEl.innerHTML = pendingInvitations.map(inv => {
        const initials = inv.senderName.split(' ').map(n => n[0]).join('').toUpperCase();
        const timeAgo = formatTimeAgo(new Date(inv.createdAt));

        return `
            <div class="invitation-card">
                <div class="invitation-header">
                    <div class="alumni-avatar">${initials}</div>
                    <div>
                        <div class="alumni-name">${inv.senderName}</div>
                        <div class="alumni-info">${inv.senderId}</div>
                    </div>
                </div>
                <div class="invitation-time">Sent ${timeAgo}</div>
                <div class="invitation-actions">
                    <button class="btn-accept" onclick="acceptInvitation('${inv._id}')">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="btn-reject" onclick="rejectInvitation('${inv._id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Accept invitation
async function acceptInvitation(invitationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/friends/accept/${invitationId}`, {
            method: 'POST'
        });

        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            await loadFriends();
            await loadInvitations();
            showChatView();
        } else {
            alert(data.message || 'Failed to accept invitation');
        }
    } catch (error) {
        console.error('Error accepting invitation:', error);
        alert('Error accepting invitation. Please try again.');
    }
}

// Reject invitation
async function rejectInvitation(invitationId) {
    if (!confirm('Are you sure you want to reject this invitation?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/friends/reject/${invitationId}`, {
            method: 'POST'
        });

        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            await loadInvitations();
        } else {
            alert(data.message || 'Failed to reject invitation');
        }
    } catch (error) {
        console.error('Error rejecting invitation:', error);
        alert('Error rejecting invitation. Please try again.');
    }
}

// Open chat with friend
async function openChat(friendshipId, friendId, friendName) {
    currentFriendshipId = friendshipId;
    activeFriend = { id: friendId, name: friendName };

    // Update UI
    document.getElementById('chat-friend-name').textContent = friendName;
    document.getElementById('chat-friend-status').textContent = 'Online';
    document.getElementById('chat-input-container').style.display = 'flex';

    // Highlight active friend
    document.querySelectorAll('.friend-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Load messages
    await loadMessages();
}

// Load chat messages
async function loadMessages() {
    if (!currentFriendshipId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/friends/messages/${currentFriendshipId}`);
        const data = await response.json();
        
        if (data.success) {
            displayMessages(data.messages);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Display messages
function displayMessages(messages) {
    const messagesEl = document.getElementById('chat-messages');
    
    if (messages.length === 0) {
        messagesEl.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-comments"></i>
                <p>Start your conversation with ${activeFriend.name}</p>
            </div>
        `;
        return;
    }

    messagesEl.innerHTML = messages.map(msg => {
        const isSent = msg.senderId === currentUser.id;
        const time = formatTime(new Date(msg.timestamp));

        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div>${msg.message}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }).join('');

    // Scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Send message
async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message || !currentFriendshipId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/friends/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                friendshipId: currentFriendshipId,
                senderId: currentUser.id,
                senderName: currentUser.name,
                message
            })
        });

        const data = await response.json();
        
        if (data.success) {
            input.value = '';
            await loadMessages();
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message. Please try again.');
    }
}

// Start polling for new messages
function startMessagePolling() {
    messageInterval = setInterval(async () => {
        if (currentFriendshipId) {
            await loadMessages();
        }
        await loadInvitations(); // Also check for new invitations
    }, 3000); // Poll every 3 seconds
}

// Utility: Format time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Utility: Format time ago
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (messageInterval) clearInterval(messageInterval);
});
