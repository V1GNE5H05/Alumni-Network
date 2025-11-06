/**
 * FUND & EVENTS HANDLER - Complete Implementation
 * Handles all CRUD operations for Funds and Events with all features
 */

// API_URL is already declared in admin_dashboard.js

// ============= FUNDS MANAGEMENT =============
let editingFundId = null;
let allFunds = [];

window.loadFunds = async function() {
  if (typeof LoadingManager !== 'undefined') {
    LoadingManager.show('Loading fundraisers...');
  }
  
  try {
    const res = await fetch(`${API_URL}/api/fundraising`);
    allFunds = await res.json();
    
    if (typeof SearchManager !== 'undefined') {
      SearchManager.currentData.funds = allFunds;
    }
    
    renderFunds(allFunds);
  } catch (err) {
    console.error('Error loading funds:', err);
    alert('Failed to load fundraisers');
  } finally {
    if (typeof LoadingManager !== 'undefined') {
      LoadingManager.hide();
    }
  }
};

function renderFunds(funds) {
  const tbody = document.getElementById('fundTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!funds || funds.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999;">No fundraisers found</td></tr>';
    return;
  }
  
  funds.forEach(fund => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-weight:600;">${escapeHtml(fund.title)}</td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(fund.description?.substring(0, 100) || '')}${fund.description?.length > 100 ? '...' : ''}</td>
      <td style="text-align:right;">₹${Number(fund.goal || 0).toLocaleString('en-IN')}</td>
      <td style="text-align:right;">₹${Number(fund.raised || 0).toLocaleString('en-IN')}</td>
      <td>${formatDate(fund.date || fund.createdAt)}</td>
      <td style="text-align:center;">
        <button onclick="editFund('${fund._id || fund.id}')" class="btn-edit-small">✏️</button>
        <button onclick="deleteFund('${fund._id || fund.id}')" class="btn-delete-small">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

window.editFund = async function(id) {
  const fund = allFunds.find(f => (f._id || f.id) === id);
  if (!fund) {
    alert('Fund not found');
    return;
  }
  
  editingFundId = id;
  document.getElementById('fundTitle').value = fund.title || '';
  document.getElementById('fundGoal').value = fund.goal || '';
  document.getElementById('fundDescription').value = fund.description || '';
  document.querySelector('#fundModal h2').textContent = 'Edit Fundraiser';
  document.getElementById('createFundBtn').textContent = 'Update Fund';
  
  document.getElementById('fundModal').style.display = 'flex';
};

window.deleteFund = async function(id) {
  if (!confirm('⚠️ Are you sure you want to delete this fundraiser? This action cannot be undone.')) {
    return;
  }
  
  if (typeof LoadingManager !== 'undefined') {
    LoadingManager.show('Deleting fundraiser...');
  }
  
  try {
    const res = await fetch(`${API_URL}/api/fundraising/${id}`, {
      method: 'DELETE'
    });
    
    const data = await res.json();
    
    if (data.success) {
      alert('✅ Fundraiser deleted successfully!');
      loadFunds();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Error deleting fundraiser: ' + err.message);
  } finally {
    if (typeof LoadingManager !== 'undefined') {
      LoadingManager.hide();
    }
  }
};

// Fund Form Handlers
document.addEventListener('DOMContentLoaded', () => {
  const fundForm = document.getElementById('fundForm');
  const fundModal = document.getElementById('fundModal');
  const addFundBtn = document.getElementById('addFundBtn');
  const closeFundModal = document.getElementById('closeFundModal');
  const cancelFundBtn = document.getElementById('cancelFundBtn');
  const reloadFundsBtn = document.getElementById('reloadFundsBtn');
  
  if (addFundBtn) {
    addFundBtn.addEventListener('click', () => {
      editingFundId = null;
      fundForm.reset();
      document.querySelector('#fundModal h2').textContent = 'Create Fundraiser';
      document.getElementById('createFundBtn').textContent = 'Create Fund';
      document.getElementById('fundResult').textContent = '';
      fundModal.style.display = 'flex';
    });
  }
  
  if (closeFundModal) {
    closeFundModal.addEventListener('click', () => {
      fundModal.style.display = 'none';
      editingFundId = null;
    });
  }
  
  if (cancelFundBtn) {
    cancelFundBtn.addEventListener('click', () => {
      fundModal.style.display = 'none';
      editingFundId = null;
    });
  }
  
  if (reloadFundsBtn) {
    reloadFundsBtn.addEventListener('click', loadFunds);
  }
  
  if (fundModal) {
    fundModal.addEventListener('click', (e) => {
      if (e.target === fundModal) {
        fundModal.style.display = 'none';
        editingFundId = null;
      }
    });
  }
  
  if (fundForm) {
    fundForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('fundTitle').value.trim();
      const goal = document.getElementById('fundGoal').value;
      const description = document.getElementById('fundDescription').value.trim();
      const resultDiv = document.getElementById('fundResult');
      
      if (!title || !goal || !description) {
        resultDiv.textContent = 'All fields are required';
        resultDiv.style.color = '#e53e3e';
        return;
      }
      
      if (typeof LoadingManager !== 'undefined') {
        LoadingManager.show(editingFundId ? 'Updating fundraiser...' : 'Creating fundraiser...');
      }
      
      try {
        const url = editingFundId 
          ? `${API_URL}/api/fundraising/${editingFundId}`
          : `${API_URL}/api/fundraising`;
        const method = editingFundId ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, goal: Number(goal), description })
        });
        
        const data = await res.json();
        
        if (data.success) {
          resultDiv.textContent = `✅ Fundraiser ${editingFundId ? 'updated' : 'created'} successfully!`;
          resultDiv.style.color = '#48bb78';
          
          setTimeout(() => {
            fundModal.style.display = 'none';
            editingFundId = null;
            loadFunds();
          }, 1500);
        } else {
          resultDiv.textContent = 'Error: ' + data.message;
          resultDiv.style.color = '#e53e3e';
        }
      } catch (err) {
        resultDiv.textContent = 'Error: ' + err.message;
        resultDiv.style.color = '#e53e3e';
      } finally {
        if (typeof LoadingManager !== 'undefined') {
          LoadingManager.hide();
        }
      }
    });
  }
});

// ============= EVENTS MANAGEMENT =============
let editingEventId = null;
let allEvents = [];

window.loadEvents = async function() {
  if (typeof LoadingManager !== 'undefined') {
    LoadingManager.show('Loading events...');
  }
  
  try {
    console.log('📡 Fetching events from:', `${API_URL}/api/events`);
    const res = await fetch(`${API_URL}/api/events`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('✅ Events data received:', data);
    allEvents = Array.isArray(data) ? data : [];
    
    if (typeof SearchManager !== 'undefined') {
      SearchManager.currentData.events = allEvents;
    }
    
    renderEvents(allEvents);
  } catch (err) {
    console.error('❌ Error loading events:', err);
    alert(`Failed to load events: ${err.message}\n\nPlease make sure the server is running.`);
  } finally {
    if (typeof LoadingManager !== 'undefined') {
      LoadingManager.hide();
    }
  }
};

function renderEvents(events) {
  const container = document.getElementById('eventsContent');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!events || events.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">No events found</div>';
    return;
  }
  
  events.forEach(event => {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    const posterUrl = event.posterUrl 
      ? (event.posterUrl.startsWith('http') ? event.posterUrl : `${API_URL}${event.posterUrl}`)
      : 'https://placehold.co/600x400/999999/FFFFFF?text=Event';
    
    card.innerHTML = `
      <img src="${posterUrl}" alt="${escapeHtml(event.title)}" class="event-image" style="width:100%;height:200px;object-fit:cover;">
      <div class="event-card-content">
        <h3 style="margin:0 0 10px;color:var(--text-primary);">${escapeHtml(event.title)}</h3>
        <div style="font-size:14px;color:var(--text-muted);margin-bottom:10px;">
          ${event.date ? `📅 ${formatDate(event.date)}<br>` : ''}
          ${event.time ? `⏰ ${event.time}<br>` : ''}
          ${event.location ? `📍 ${escapeHtml(event.location)}` : ''}
        </div>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.5;margin-bottom:10px;">
          ${escapeHtml(event.description?.substring(0, 150) || '')}${event.description?.length > 150 ? '...' : ''}
        </p>
        ${event.allowParticipation ? `
          <div style="background:linear-gradient(135deg,#e3f2fd,#f3e5f5);padding:10px;border-radius:8px;margin-bottom:10px;">
            <span style="color:#1976d2;font-weight:600;">👥 ${event.participantCount || 0} Alumni Registered</span>
          </div>
        ` : ''}
        <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
          ${event.allowParticipation ? `
            <button onclick="viewParticipants('${event._id}')" class="btn-view-small" style="background:linear-gradient(135deg,#4299e1,#3182ce);color:white;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;">👥 Participants</button>
          ` : ''}
          <button onclick="editEvent('${event._id}')" class="btn-edit-small">✏️ Edit</button>
          <button onclick="deleteEvent('${event._id}')" class="btn-delete-small">🗑️ Delete</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

window.editEvent = async function(id) {
  const event = allEvents.find(e => e._id === id);
  if (!event) {
    alert('Event not found');
    return;
  }
  
  editingEventId = id;
  document.getElementById('eventTitle').value = event.title || '';
  document.getElementById('eventDate').value = event.date?.split('T')[0] || '';
  document.getElementById('eventTime').value = event.time || '';
  document.getElementById('eventLocation').value = event.location || '';
  document.getElementById('eventDescription').value = event.description || '';
  
  // Set the allowParticipation checkbox
  const allowParticipationCheckbox = document.getElementById('allowParticipation');
  if (allowParticipationCheckbox) {
    allowParticipationCheckbox.checked = event.allowParticipation || false;
  }
  
  // Show current poster if exists
  if (event.posterUrl) {
    const preview = document.getElementById('eventImagePreview');
    const img = document.getElementById('eventPreviewImg');
    img.src = event.posterUrl.startsWith('http') ? event.posterUrl : `${API_URL}${event.posterUrl}`;
    preview.style.display = 'block';
  }
  
  document.querySelector('#eventModal h2').textContent = 'Edit Event';
  document.getElementById('createEventBtn').textContent = 'Update Event';
  document.getElementById('eventModal').style.display = 'flex';
};

window.deleteEvent = async function(id) {
  if (!confirm('⚠️ Are you sure you want to delete this event? This action cannot be undone.')) {
    return;
  }
  
  if (typeof LoadingManager !== 'undefined') {
    LoadingManager.show('Deleting event...');
  }
  
  try {
    const res = await fetch(`${API_URL}/api/events/${id}`, {
      method: 'DELETE'
    });
    
    const data = await res.json();
    
    if (data.success) {
      alert('✅ Event deleted successfully!');
      loadEvents();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Error deleting event: ' + err.message);
  } finally {
    if (typeof LoadingManager !== 'undefined') {
      LoadingManager.hide();
    }
  }
};

// Event Form Handlers
document.addEventListener('DOMContentLoaded', () => {
  const eventForm = document.getElementById('eventForm');
  const eventModal = document.getElementById('eventModal');
  const addEventBtn = document.getElementById('addEventBtnAdmin');
  const closeEventModal = document.getElementById('closeEventModal');
  const cancelEventBtn = document.getElementById('cancelEventBtn');
  const reloadEventsBtn = document.getElementById('reloadEventsBtn');
  
  if (addEventBtn) {
    addEventBtn.addEventListener('click', () => {
      editingEventId = null;
      eventForm.reset();
      document.querySelector('#eventModal h2').textContent = 'Add Event';
      document.getElementById('createEventBtn').textContent = 'Create Event';
      document.getElementById('eventResult').textContent = '';
      document.getElementById('eventImagePreview').style.display = 'none';
      eventModal.style.display = 'flex';
    });
  }
  
  if (closeEventModal) {
    closeEventModal.addEventListener('click', () => {
      eventModal.style.display = 'none';
      editingEventId = null;
    });
  }
  
  if (cancelEventBtn) {
    cancelEventBtn.addEventListener('click', () => {
      eventModal.style.display = 'none';
      editingEventId = null;
    });
  }
  
  if (reloadEventsBtn) {
    reloadEventsBtn.addEventListener('click', loadEvents);
  }
  
  if (eventModal) {
    eventModal.addEventListener('click', (e) => {
      if (e.target === eventModal) {
        eventModal.style.display = 'none';
        editingEventId = null;
      }
    });
  }
  
  // Image preview for event poster
  const posterInput = document.getElementById('eventPosterFile');
  if (posterInput) {
    posterInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) {
        document.getElementById('eventImagePreview').style.display = 'none';
        return;
      }
      
      // Validate
      if (typeof FileValidator !== 'undefined') {
        const validation = FileValidator.validateImage(file);
        if (!validation.valid) {
          alert(validation.error);
          posterInput.value = '';
          document.getElementById('eventImagePreview').style.display = 'none';
          return;
        }
      }
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('eventImagePreview');
        const img = document.getElementById('eventPreviewImg');
        img.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }
  
  if (eventForm) {
    eventForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(eventForm);
      const resultDiv = document.getElementById('eventResult');
      
      // Validate required fields
      const title = formData.get('title')?.trim();
      const date = formData.get('date');
      const location = formData.get('location')?.trim();
      const description = formData.get('description')?.trim();
      
      if (!title || !date || !location || !description) {
        resultDiv.textContent = 'All required fields must be filled';
        resultDiv.style.color = '#e53e3e';
        return;
      }

      // Add participation checkbox value - always include it
      const allowParticipationCheckbox = document.getElementById('allowParticipation');
      const allowParticipation = allowParticipationCheckbox ? allowParticipationCheckbox.checked : false;
      
      // Remove from FormData if it exists and add our value
      formData.delete('allowParticipation');
      formData.append('allowParticipation', allowParticipation.toString());
      
      console.log('Sending allowParticipation:', allowParticipation);
      
      if (typeof LoadingManager !== 'undefined') {
        LoadingManager.show(editingEventId ? 'Updating event...' : 'Creating event...');
      }
      
      try {
        const url = editingEventId 
          ? `${API_URL}/api/events/${editingEventId}`
          : `${API_URL}/api/events`;
        const method = editingEventId ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
          method,
          body: formData
        });
        
        const data = await res.json();
        
        if (data.success) {
          resultDiv.textContent = `✅ Event ${editingEventId ? 'updated' : 'created'} successfully!`;
          resultDiv.style.color = '#48bb78';
          
          setTimeout(() => {
            eventModal.style.display = 'none';
            editingEventId = null;
            loadEvents();
          }, 1500);
        } else {
          resultDiv.textContent = 'Error: ' + data.message;
          resultDiv.style.color = '#e53e3e';
        }
      } catch (err) {
        resultDiv.textContent = 'Error: ' + err.message;
        resultDiv.style.color = '#e53e3e';
      } finally {
        if (typeof LoadingManager !== 'undefined') {
          LoadingManager.hide();
        }
      }
    });
  }
});

// ============= POSTS MANAGEMENT =============
document.addEventListener('DOMContentLoaded', () => {
  const postForm = document.getElementById('postForm');
  const postModal = document.getElementById('postModal');
  const addPostBtn = document.getElementById('addNewPostBtn');
  const closePostModal = document.getElementById('closePostModal');
  
  if (addPostBtn) {
    addPostBtn.addEventListener('click', () => {
      editingPostId = null;
      postForm.reset();
      document.getElementById('postModalTitle').textContent = 'Add New Post';
      document.getElementById('postResult').textContent = '';
      document.getElementById('imagePreview').style.display = 'none';
      document.getElementById('currentImage').style.display = 'none';
      postModal.style.display = 'flex';
    });
  }
  
  if (closePostModal) {
    closePostModal.addEventListener('click', () => {
      postModal.style.display = 'none';
      editingPostId = null;
    });
  }
  
  if (postModal) {
    postModal.addEventListener('click', (e) => {
      if (e.target === postModal) {
        postModal.style.display = 'none';
        editingPostId = null;
      }
    });
  }
  
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const description = document.getElementById('description').value.trim();
      const imageFile = document.getElementById('imageFile').files[0];
      const resultDiv = document.getElementById('postResult');
      
      if (!description) {
        resultDiv.textContent = 'Description is required';
        resultDiv.style.color = '#e53e3e';
        return;
      }
      
      // Validate image if provided
      if (imageFile && typeof FileValidator !== 'undefined') {
        const validation = FileValidator.validateImage(imageFile);
        if (!validation.valid) {
          resultDiv.textContent = validation.error;
          resultDiv.style.color = '#e53e3e';
          return;
        }
      }
      
      const formData = new FormData();
      formData.append('author', 'Mepco Schlenk Engineering College');
      formData.append('content', description);
      formData.append('time', new Date().toLocaleString());
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }
      
      if (typeof LoadingManager !== 'undefined') {
        LoadingManager.show(editingPostId ? 'Updating post...' : 'Creating post...');
      }
      
      try {
        const url = editingPostId 
          ? `${API_URL}/posts/${editingPostId}`
          : `${API_URL}/posts`;
        const method = editingPostId ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
          method,
          body: formData
        });
        
        const data = await res.json();
        
        if (data.success) {
          resultDiv.textContent = `✅ Post ${editingPostId ? 'updated' : 'created'} successfully!`;
          resultDiv.style.color = '#48bb78';
          
          setTimeout(() => {
            postModal.style.display = 'none';
            editingPostId = null;
            if (typeof loadPosts === 'function') loadPosts();
          }, 1500);
        } else {
          resultDiv.textContent = 'Error: ' + data.message;
          resultDiv.style.color = '#e53e3e';
        }
      } catch (err) {
        resultDiv.textContent = 'Error: ' + err.message;
        resultDiv.style.color = '#e53e3e';
      } finally {
        if (typeof LoadingManager !== 'undefined') {
          LoadingManager.hide();
        }
      }
    });
  }
});

// ============= MENU NAVIGATION =============
function initMenuNavigation() {
  console.log('🔧 Initializing menu navigation...');
  
  const dashboardMenu = document.getElementById('dashboardMenu');
  const postMenu = document.getElementById('postMenu');
  const alumniMenu = document.getElementById('alumniMenu');
  const fundMenu = document.getElementById('fundmenu');
  const eventMenu = document.getElementById('eventMenu');
  
  console.log('Menu elements found:', {
    dashboardMenu: !!dashboardMenu,
    postMenu: !!postMenu,
    alumniMenu: !!alumniMenu,
    fundMenu: !!fundMenu,
    eventMenu: !!eventMenu
  });
  
  function hideAllSections() {
    const sections = {
      alumniTableSection: document.getElementById('alumniTableSection'),
      postsSection: document.getElementById('postsSection'),
      fundSection: document.getElementById('fundSection'),
      eventsSection: document.getElementById('eventsSection'),
      statisticsSection: document.getElementById('statisticsSection'),
      membersSection: document.getElementById('membersSection'),
      proudAlumniSection: document.getElementById('proudAlumniSection'),
      studentsDbSection: document.getElementById('studentsDbSection')
    };
    
    Object.values(sections).forEach(section => {
      if (section) section.style.display = 'none';
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.menu-items').forEach(item => {
      item.classList.remove('active');
    });
  }
  
  if (dashboardMenu) {
    dashboardMenu.addEventListener('click', () => {
      console.log('📊 Dashboard clicked');
      hideAllSections();
      dashboardMenu.classList.add('active');
      document.getElementById('statisticsSection').style.display = 'flex';
      document.getElementById('alumniTableSection').style.display = '';
    });
  }
  
  if (postMenu) {
    postMenu.addEventListener('click', () => {
      console.log('📝 Posts clicked');
      hideAllSections();
      postMenu.classList.add('active');
      document.getElementById('postsSection').style.display = 'block';
      if (typeof loadPosts === 'function') loadPosts();
    });
  }
  
  if (alumniMenu) {
    alumniMenu.addEventListener('click', () => {
      console.log('👥 Alumni clicked');
      hideAllSections();
      alumniMenu.classList.add('active');
      document.getElementById('statisticsSection').style.display = 'flex';
      document.getElementById('alumniTableSection').style.display = '';
    });
  }
  
  if (fundMenu) {
    fundMenu.addEventListener('click', () => {
      console.log('💰 Fundraising clicked');
      hideAllSections();
      fundMenu.classList.add('active');
      document.getElementById('fundSection').style.display = 'block';
      loadFunds();
    });
  }
  
  if (eventMenu) {
    eventMenu.addEventListener('click', () => {
      console.log('🎉 Events clicked');
      hideAllSections();
      eventMenu.classList.add('active');
      document.getElementById('eventsSection').style.display = 'block';
      loadEvents();
    });
  }
  
  console.log('✅ Menu navigation initialized');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMenuNavigation);
} else {
  initMenuNavigation();
}

// ============= VIEW PARTICIPANTS FUNCTIONALITY =============
window.viewParticipants = async function(eventId) {
  const event = allEvents.find(e => e._id === eventId);
  if (!event) {
    alert('Event not found');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/events/${eventId}/participants`);
    const data = await res.json();
    
    if (!data.success) {
      alert('Error: ' + data.message);
      return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'participantsModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const participants = data.participants || [];
    const participantsList = participants.length > 0
      ? participants.map((p, index) => `
          <div style="background:linear-gradient(135deg,#f7fafc,#edf2f7);padding:15px;border-radius:8px;border-left:4px solid #4299e1;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-weight:600;color:#2d3748;font-size:16px;margin-bottom:5px;">
                  ${index + 1}. ${escapeHtml(p.alumniName || 'Unknown')}
                </div>
                <div style="color:#718096;font-size:14px;">
                  Alumni ID: ${escapeHtml(p.alumniId || 'N/A')}
                </div>
                ${p.registeredAt ? `
                  <div style="color:#718096;font-size:12px;margin-top:5px;">
                    📅 Registered: ${new Date(p.registeredAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')
      : '<p style="text-align:center;color:#718096;padding:40px 0;font-size:16px;">No participants yet 😔</p>';

    modal.innerHTML = `
      <div style="background:white;border-radius:16px;padding:30px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;border-bottom:2px solid #e2e8f0;padding-bottom:15px;">
          <div>
            <h2 style="margin:0;color:#1a202c;font-size:24px;">👥 Event Participants</h2>
            <p style="margin:5px 0 0;color:#718096;font-size:14px;">${escapeHtml(event.title)}</p>
          </div>
          <button onclick="closeParticipantsModal()" style="background:transparent;border:none;font-size:28px;cursor:pointer;color:#a0aec0;line-height:1;padding:0;width:32px;height:32px;">&times;</button>
        </div>
        
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:15px;border-radius:10px;margin-bottom:20px;text-align:center;">
          <div style="color:white;font-size:32px;font-weight:bold;margin-bottom:5px;">
            ${participants.length}
          </div>
          <div style="color:rgba(255,255,255,0.9);font-size:14px;font-weight:500;">
            Total Registrations
          </div>
        </div>
        
        <div style="margin-bottom:20px;">
          <h3 style="margin:0 0 15px;color:#2d3748;font-size:18px;">Registered Alumni</h3>
          ${participantsList}
        </div>
        
        <div style="display:flex;gap:10px;margin-top:20px;">
          <button onclick="exportParticipants('${eventId}')" style="flex:1;padding:12px;background:linear-gradient(135deg,#48bb78,#38a169);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;">
            📥 Export CSV
          </button>
          <button onclick="closeParticipantsModal()" style="flex:1;padding:12px;background:linear-gradient(135deg,#cbd5e0,#a0aec0);color:#2d3748;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;">
            Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeParticipantsModal();
      }
    });

  } catch (err) {
    alert('Error loading participants: ' + err.message);
  }
};

window.closeParticipantsModal = function() {
  const modal = document.getElementById('participantsModal');
  if (modal) {
    modal.remove();
  }
};

window.exportParticipants = async function(eventId) {
  try {
    const res = await fetch(`${API_URL}/api/events/${eventId}/participants`);
    const data = await res.json();
    
    if (!data.success || !data.participants || data.participants.length === 0) {
      alert('No participants to export');
      return;
    }

    const event = allEvents.find(e => e._id === eventId);
    const eventTitle = event?.title || 'Event';
    
    // Create CSV content
    let csv = 'No.,Alumni Name,Alumni ID,Registration Date\n';
    data.participants.forEach((p, index) => {
      const regDate = p.registeredAt 
        ? new Date(p.registeredAt).toLocaleDateString('en-US') 
        : 'N/A';
      csv += `${index + 1},"${p.alumniName || 'Unknown'}","${p.alumniId || 'N/A'}","${regDate}"\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_participants_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('✅ Participants exported successfully!');
  } catch (err) {
    alert('Error exporting participants: ' + err.message);
  }
};

// ============= UTILITY FUNCTIONS =============
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return '';
  }
}