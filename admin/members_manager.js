// ============================================
// MEMBERS & PROUDABLE ALUMNI MANAGEMENT
// ============================================

const MembersManager = {
    members: [],
    proudAlumni: [],

    // Initialize members section
    async init() {
        await this.loadMembers();
        this.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners() {
        // More menu toggle
        const moreMenu = document.getElementById('moreMenu');
        const moreSubmenu = document.getElementById('moreSubmenu');
        
        if (moreMenu) {
            moreMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                moreMenu.classList.toggle('open');
                moreSubmenu.classList.toggle('open');
            });
        }

        // Members submenu click
        document.getElementById('membersSubmenu')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMembersSection();
        });

        // Proudable Alumni submenu click
        document.getElementById('proudAlumniSubmenu')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showProudAlumniSection();
        });

        // Add member button
        document.getElementById('addMemberBtn')?.addEventListener('click', () => {
            this.openMemberModal();
        });

        // Add proudable alumni button
        document.getElementById('addProudAlumniBtn')?.addEventListener('click', () => {
            this.openProudAlumniModal();
        });
    },

    // Show members section
    showMembersSection() {
        // Hide all sections
        document.getElementById('statisticsSection').style.display = 'none';
        document.getElementById('alumniTableSection').style.display = 'none';
        document.getElementById('postsSection').style.display = 'none';
        document.getElementById('eventsSection').style.display = 'none';
        document.getElementById('fundSection').style.display = 'none';
        document.getElementById('proudAlumniSection').style.display = 'none';
        document.getElementById('membersSection').style.display = 'block';

        // Update active menu
        document.querySelectorAll('.menu-items, .submenu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById('moreMenu').classList.add('active');
        document.getElementById('membersSubmenu').classList.add('active');

        this.loadMembers();
    },

    // Show proudable alumni section
    showProudAlumniSection() {
        // Hide all sections
        document.getElementById('statisticsSection').style.display = 'none';
        document.getElementById('alumniTableSection').style.display = 'none';
        document.getElementById('postsSection').style.display = 'none';
        document.getElementById('eventsSection').style.display = 'none';
        document.getElementById('fundSection').style.display = 'none';
        document.getElementById('membersSection').style.display = 'none';
        document.getElementById('proudAlumniSection').style.display = 'block';

        // Update active menu
        document.querySelectorAll('.menu-items, .submenu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById('moreMenu').classList.add('active');
        document.getElementById('proudAlumniSubmenu').classList.add('active');

        this.loadProudAlumni();
    },

    // Load members from API
    async loadMembers() {
        try {
            const response = await fetch(`${API_URL}/api/members`);
            if (!response.ok) throw new Error('Failed to load members');
            
            this.members = await response.json();
            this.renderMembers();
        } catch (error) {
            console.error('Error loading members:', error);
            document.getElementById('membersGrid').innerHTML = `
                <p style="grid-column:1/-1;text-align:center;color:red;">
                    Error loading members: ${error.message}
                </p>
            `;
        }
    },

    // Render members grid
    renderMembers() {
        const grid = document.getElementById('membersGrid');
        
        if (this.members.length === 0) {
            grid.innerHTML = `
                <p style="grid-column:1/-1;text-align:center;color:var(--text-muted);">
                    No members added yet. Click "Add Member" to get started.
                </p>
            `;
            return;
        }

        grid.innerHTML = this.members.map(member => `
            <div class="member-card">
                <div class="member-photo">
                    <img src="${member.photo || '../images/user.png'}" alt="${member.name}">
                </div>
                <div class="member-info">
                    <div class="member-role">${member.role}</div>
                    <h3 class="member-name">${member.name}</h3>
                    <div class="member-designation">${member.designation}</div>
                    ${member.experience ? `<p class="member-experience">${member.experience}</p>` : ''}
                </div>
                <div class="member-actions">
                    <button onclick="MembersManager.editMember('${member._id}')" class="edit-btn">✏️ Edit</button>
                    <button onclick="MembersManager.deleteMember('${member._id}')" class="delete-btn">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    },

    // Load proudable alumni from API
    async loadProudAlumni() {
        try {
            const response = await fetch(`${API_URL}/api/proudable-alumni`);
            if (!response.ok) throw new Error('Failed to load proudable alumni');
            
            this.proudAlumni = await response.json();
            this.renderProudAlumni();
        } catch (error) {
            console.error('Error loading proudable alumni:', error);
            document.getElementById('proudAlumniGrid').innerHTML = `
                <p style="grid-column:1/-1;text-align:center;color:red;">
                    Error loading proudable alumni: ${error.message}
                </p>
            `;
        }
    },

    // Render proudable alumni grid
    renderProudAlumni() {
        const grid = document.getElementById('proudAlumniGrid');
        
        if (this.proudAlumni.length === 0) {
            grid.innerHTML = `
                <p style="grid-column:1/-1;text-align:center;color:var(--text-muted);">
                    No proudable alumni added yet. Click "Add Proudable Alumni" to get started.
                </p>
            `;
            return;
        }

        grid.innerHTML = this.proudAlumni.map(alumni => `
            <div class="proud-alumni-card">
                <div class="proud-alumni-photo">
                    <img src="${alumni.photo || '../images/user.png'}" alt="${alumni.name}">
                </div>
                <div class="proud-alumni-info">
                    <h3 class="proud-alumni-name">${alumni.name}</h3>
                    ${alumni.experience ? `<p class="proud-alumni-experience">${alumni.experience}</p>` : ''}
                    <div class="proud-alumni-achievements">
                        <strong>🏆 Achievements:</strong>
                        <p>${alumni.achievements}</p>
                    </div>
                </div>
                <div class="proud-alumni-actions">
                    <button onclick="MembersManager.editProudAlumni('${alumni._id}')" class="edit-btn">✏️ Edit</button>
                    <button onclick="MembersManager.deleteProudAlumni('${alumni._id}')" class="delete-btn">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    },

    // Open member modal
    openMemberModal(memberId = null) {
        const modal = document.getElementById('memberModal');
        const form = document.getElementById('memberForm');
        const title = document.getElementById('memberModalTitle');
        
        form.reset();
        document.getElementById('memberId').value = '';
        document.getElementById('memberResult').textContent = '';
        
        if (memberId) {
            const member = this.members.find(m => m._id === memberId);
            if (member) {
                title.textContent = 'Edit Faculty Member';
                document.getElementById('memberId').value = member._id;
                document.getElementById('memberRole').value = member.role;
                document.getElementById('memberName').value = member.name;
                document.getElementById('memberDesignation').value = member.designation;
                document.getElementById('memberExperience').value = member.experience || '';
                document.getElementById('memberPhoto').value = member.photo || '';
            }
        } else {
            title.textContent = 'Add Faculty Member';
        }
        
        modal.style.display = 'flex';
    },

    // Open proudable alumni modal
    openProudAlumniModal(alumniId = null) {
        const modal = document.getElementById('proudAlumniModal');
        const form = document.getElementById('proudAlumniForm');
        const title = document.getElementById('proudAlumniModalTitle');
        
        form.reset();
        document.getElementById('proudAlumniId').value = '';
        document.getElementById('proudAlumniResult').textContent = '';
        
        if (alumniId) {
            const alumni = this.proudAlumni.find(a => a._id === alumniId);
            if (alumni) {
                title.textContent = 'Edit Proudable Alumni';
                document.getElementById('proudAlumniId').value = alumni._id;
                document.getElementById('proudAlumniName').value = alumni.name;
                document.getElementById('proudAlumniExperience').value = alumni.experience || '';
                document.getElementById('proudAlumniAchievements').value = alumni.achievements;
                document.getElementById('proudAlumniPhoto').value = alumni.photo || '';
            }
        } else {
            title.textContent = 'Add Proudable Alumni';
        }
        
        modal.style.display = 'flex';
    },

    // Edit member
    editMember(memberId) {
        this.openMemberModal(memberId);
    },

    // Edit proudable alumni
    editProudAlumni(alumniId) {
        this.openProudAlumniModal(alumniId);
    },

    // Delete member
    async deleteMember(memberId) {
        if (!confirm('Are you sure you want to delete this member?')) return;
        
        try {
            const response = await fetch(`${API_URL}/api/members/${memberId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete member');
            
            await this.loadMembers();
            alert('Member deleted successfully!');
        } catch (error) {
            console.error('Error deleting member:', error);
            alert('Error deleting member: ' + error.message);
        }
    },

    // Delete proudable alumni
    async deleteProudAlumni(alumniId) {
        if (!confirm('Are you sure you want to delete this proudable alumni?')) return;
        
        try {
            const response = await fetch(`${API_URL}/api/proudable-alumni/${alumniId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete proudable alumni');
            
            await this.loadProudAlumni();
            alert('Proudable alumni deleted successfully!');
        } catch (error) {
            console.error('Error deleting proudable alumni:', error);
            alert('Error deleting proudable alumni: ' + error.message);
        }
    }
};

// Save member function
async function saveMember(event) {
    event.preventDefault();
    
    const memberId = document.getElementById('memberId').value;
    const memberData = {
        role: document.getElementById('memberRole').value,
        name: document.getElementById('memberName').value,
        designation: document.getElementById('memberDesignation').value,
        experience: document.getElementById('memberExperience').value,
        photo: document.getElementById('memberPhoto').value
    };
    
    const resultDiv = document.getElementById('memberResult');
    resultDiv.textContent = 'Saving...';
    resultDiv.style.color = '#1651a7';
    
    try {
        const url = memberId 
            ? `${API_URL}/api/members/${memberId}`
            : `${API_URL}/api/members`;
        
        const response = await fetch(url, {
            method: memberId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberData)
        });
        
        if (!response.ok) throw new Error('Failed to save member');
        
        resultDiv.textContent = '✓ Member saved successfully!';
        resultDiv.style.color = 'green';
        
        setTimeout(() => {
            closeMemberModal();
            MembersManager.loadMembers();
        }, 1000);
    } catch (error) {
        console.error('Error saving member:', error);
        resultDiv.textContent = 'Error: ' + error.message;
        resultDiv.style.color = 'red';
    }
}

// Save proudable alumni function
async function saveProudAlumni(event) {
    event.preventDefault();
    
    const alumniId = document.getElementById('proudAlumniId').value;
    const alumniData = {
        name: document.getElementById('proudAlumniName').value,
        experience: document.getElementById('proudAlumniExperience').value,
        achievements: document.getElementById('proudAlumniAchievements').value,
        photo: document.getElementById('proudAlumniPhoto').value
    };
    
    const resultDiv = document.getElementById('proudAlumniResult');
    resultDiv.textContent = 'Saving...';
    resultDiv.style.color = '#1651a7';
    
    try {
        const url = alumniId 
            ? `${API_URL}/api/proudable-alumni/${alumniId}`
            : `${API_URL}/api/proudable-alumni`;
        
        const response = await fetch(url, {
            method: alumniId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alumniData)
        });
        
        if (!response.ok) throw new Error('Failed to save proudable alumni');
        
        resultDiv.textContent = '✓ Proudable alumni saved successfully!';
        resultDiv.style.color = 'green';
        
        setTimeout(() => {
            closeProudAlumniModal();
            MembersManager.loadProudAlumni();
        }, 1000);
    } catch (error) {
        console.error('Error saving proudable alumni:', error);
        resultDiv.textContent = 'Error: ' + error.message;
        resultDiv.style.color = 'red';
    }
}

// Close modals
function closeMemberModal() {
    document.getElementById('memberModal').style.display = 'none';
    document.getElementById('memberForm').reset();
}

function closeProudAlumniModal() {
    document.getElementById('proudAlumniModal').style.display = 'none';
    document.getElementById('proudAlumniForm').reset();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    MembersManager.init();
});
