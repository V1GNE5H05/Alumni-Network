// Members Display Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    loadMembers();
});

async function loadMembers() {
    const grid = document.getElementById('membersGrid');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/members`);
        
        if (!response.ok) {
            throw new Error('Failed to load members');
        }
        
        const members = await response.json();
        
        if (members.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h2>No Faculty Members Yet</h2>
                    <p>Faculty member information will be displayed here soon.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = members.map(member => `
            <div class="member-card">
                <div class="member-photo">
                    <img src="${member.photo || '../images/user.png'}" 
                         alt="${member.name}"
                         onerror="this.src='../images/user.png'">
                </div>
                <div class="member-role">${member.role}</div>
                <h2 class="member-name">${member.name}</h2>
                <div class="member-designation">${member.designation}</div>
                ${member.experience ? `
                    <div class="member-experience">
                        ${member.experience}
                    </div>
                ` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading members:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h2>Error Loading Members</h2>
                <p>${error.message}</p>
                <button onclick="loadMembers()" style="margin-top:20px;padding:10px 20px;background:#1651a7;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}
