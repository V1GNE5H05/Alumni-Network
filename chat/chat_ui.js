// Chat UI JavaScript
const API_BASE = 'http://localhost:5000';
let currentUser = null;
let selectedContact = null;
let allContacts = [];
let conversations = {};
let messageRefreshInterval = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Get logged in user from session
    currentUser = sessionStorage.getItem('loggedInUser');
    
    if (!currentUser) {
        alert('Please login first');
        window.location.href = '../login/login_page.html';
        return;
    }
    
    // Debug: Log current user
    console.log('Current user:', currentUser);
    
    // Load contacts and conversations
    loadContacts();
    
    // Set up event listeners
    setupEventListeners();
});

// Load all contacts (alumni)
async function loadContacts() {
    try {
        const response = await fetch(`${API_BASE}/api/chat/contacts?username=${encodeURIComponent(currentUser)}`);
        const contacts = await response.json();
        allContacts = contacts;
        
        // Load conversations to get last messages
        await loadConversations();
        
        // Display contacts
        displayContacts(contacts);
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

// Load conversations for the current user
async function loadConversations() {
    try {
        const response = await fetch(`${API_BASE}/api/chat/conversations/${encodeURIComponent(currentUser)}`);
        const convs = await response.json();
        
        // Store conversations in a map for quick lookup
        conversations = {};
        convs.forEach(conv => {
            // Find the other participant
            const otherUser = conv.participants.find(p => p !== currentUser);
            conversations[otherUser] = conv;
        });
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

// Display contacts in left sidebar
function displayContacts(contacts) {
    const leftBar = document.querySelector('.left_bar');
    
    // Clear existing conversation list (except header and search)
    const existingLists = leftBar.querySelectorAll('.conversation-list');
    existingLists.forEach(el => el.remove());
    
    if (contacts.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.padding = '20px';
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.color = '#718096';
        emptyDiv.textContent = 'No contacts available';
        leftBar.appendChild(emptyDiv);
        return;
    }
    
    contacts.forEach(contact => {
        const conversationDiv = document.createElement('div');
        conversationDiv.className = 'conversation-list';
        conversationDiv.dataset.alumniId = contact.alumni_id;
        
        // Check if there's a conversation with this contact
        const conv = conversations[contact.alumni_id];
        
        conversationDiv.innerHTML = `
            <div class="conversation-content" style="flex: 1;">
                <div class="conversation-name">${contact.name || contact.alumni_id}</div>
                ${conv ? `
                    <div class="conversation-preview">${conv.lastMessage || 'No messages yet'}</div>
                ` : `
                    <div class="conversation-preview" style="color: #a0aec0; font-style: italic;">Start a conversation</div>
                `}
            </div>
            ${conv ? `
                <div class="conversation-time">${formatTime(conv.lastMessageTime)}</div>
            ` : ''}
        `;
        
        conversationDiv.addEventListener('click', () => selectContact(contact));
        leftBar.appendChild(conversationDiv);
    });
}

// Format timestamp to readable format
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// Format timestamp for message display
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// Select a contact to chat with
async function selectContact(contact) {
    selectedContact = contact;
    
    // Update UI - highlight selected contact
    document.querySelectorAll('.conversation-list').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector(`[data-alumni-id="${contact.alumni_id}"]`).classList.add('active');
    
    // Update profile section
    document.querySelector('.profile-name').textContent = contact.name || contact.alumni_id;
    
    // Load messages
    await loadMessages();
    
    // Mark messages as read
    markAsRead(contact.alumni_id);
    
    // Start auto-refresh for this conversation
    startMessageRefresh();
}

// Load messages between current user and selected contact
async function loadMessages() {
    if (!selectedContact) return;
    
    try {
        const url = `${API_BASE}/api/chat/messages/${encodeURIComponent(currentUser)}/${encodeURIComponent(selectedContact.alumni_id)}`;
        console.log('Loading messages from:', url);
        console.log('Current user:', currentUser);
        console.log('Selected contact alumni_id:', selectedContact.alumni_id);
        
        const response = await fetch(url);
        const messages = await response.json();
        
        console.log('Loaded messages:', messages);
        displayMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}


// Display messages in chat container
function displayMessages(messages) {
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.innerHTML = '';
    
    console.log('displayMessages called with:', messages);
    console.log('Current user for comparison:', currentUser);
    
    if (!messages || messages.length === 0) {
        console.log('No messages to display');
        const emptyDiv = document.createElement('div');
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.padding = '40px 20px';
        emptyDiv.style.color = '#a0aec0';
        emptyDiv.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px;">💬</div>
            <div>No messages yet. Start the conversation!</div>
        `;
        chatContainer.appendChild(emptyDiv);
        return;
    }
    
    console.log('Processing', messages.length, 'messages');
    
    messages.forEach((msg, index) => {
        console.log(`Message ${index}:`, msg);
        console.log(`  Sender: "${msg.sender}" (type: ${typeof msg.sender})`);
        console.log(`  Current user: "${currentUser}" (type: ${typeof currentUser})`);
        console.log(`  Are they equal? ${msg.sender === currentUser}`);
        
        const messageDiv = document.createElement('div');
        const isSent = msg.sender === currentUser;
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        
        console.log(`  Message ${index} classified as: ${isSent ? 'SENT' : 'RECEIVED'}`);
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div>${escapeHtml(msg.message)}</div>
                <div class="message-time">${formatMessageTime(msg.timestamp)}</div>
            </div>
        `;
        
        chatContainer.appendChild(messageDiv);
        console.log(`  Message ${index} added to DOM`);
    });
    
    console.log('Total messages in chat container:', chatContainer.children.length);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send a message
async function sendMessage() {
    const textBar = document.querySelector('.text-bar');
    const message = textBar.value.trim();
    
    if (!message || !selectedContact) {
        return;
    }
    
    try {
        const payload = {
            sender: currentUser,
            receiver: selectedContact.alumni_id,
            message: message
        };
        
        console.log('Sending message:', payload);
        
        const response = await fetch(`${API_BASE}/api/chat/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('Send message response:', data);
        
        if (data.success) {
            // Clear input
            textBar.value = '';
            
            // Reload messages
            await loadMessages();
            
            // Update conversation list
            await loadConversations();
            displayContacts(allContacts);
            
            // Re-highlight selected contact
            document.querySelector(`[data-alumni-id="${selectedContact.alumni_id}"]`).classList.add('active');
        } else {
            alert('Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message. Please try again.');
    }
}

// Mark messages as read
async function markAsRead(sender) {
    try {
        await fetch(`${API_BASE}/api/chat/read/${encodeURIComponent(sender)}/${encodeURIComponent(currentUser)}`, {
            method: 'PUT'
        });
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

// Start auto-refresh for messages
function startMessageRefresh() {
    // Clear existing interval
    if (messageRefreshInterval) {
        clearInterval(messageRefreshInterval);
    }
    
    // Refresh every 5 seconds
    messageRefreshInterval = setInterval(async () => {
        if (selectedContact) {
            const chatContainer = document.querySelector('.chat-container');
            const scrolledToBottom = chatContainer.scrollHeight - chatContainer.scrollTop === chatContainer.clientHeight;
            
            await loadMessages();
            
            // Only auto-scroll if user was already at bottom
            if (scrolledToBottom) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }
    }, 5000);
}

// Search contacts
function searchContacts(query) {
    const filteredContacts = allContacts.filter(contact => {
        const name = (contact.name || '').toLowerCase();
        const alumniId = (contact.alumni_id || '').toLowerCase();
        const department = (contact.department || '').toLowerCase();
        const searchTerm = query.toLowerCase();
        
        return name.includes(searchTerm) || 
               alumniId.includes(searchTerm) || 
               department.includes(searchTerm);
    });
    
    displayContacts(filteredContacts);
    
    // Re-highlight selected contact if still in filtered list
    if (selectedContact) {
        const selectedElement = document.querySelector(`[data-alumni-id="${selectedContact.alumni_id}"]`);
        if (selectedElement) {
            selectedElement.classList.add('active');
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Send button click
    const sendButton = document.querySelector('.send-button');
    sendButton.addEventListener('click', sendMessage);
    
    // Enter key in text input
    const textBar = document.querySelector('.text-bar');
    textBar.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Search functionality
    const searchBar = document.querySelector('.search-bar');
    searchBar.addEventListener('input', function(e) {
        searchContacts(e.target.value);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (messageRefreshInterval) {
        clearInterval(messageRefreshInterval);
    }
});
