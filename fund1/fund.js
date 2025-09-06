// fund.js
// If using Live Server on port 5501 and API on 5000:
const API_BASE = 'http://localhost:5000';  // or 'http://127.0.0.1:5000'

document.addEventListener("DOMContentLoaded", initFunds);

async function initFunds() {
  const container = document.getElementById("fund-container");
  container.innerHTML = '<p style="font-size:14px;color:#444;">Loading funds...</p>';

  try {
    const res = await fetch(`${API_BASE}/api/fundraising`);
    if (!res.ok) throw new Error('Failed to fetch funds');
    const events = await res.json();

    if (!Array.isArray(events) || events.length === 0) {
      container.innerHTML = '<p style="font-size:14px;color:#666;">No funds found. Create one via POST /api/fundraising.</p>';
      return;
    }

    container.innerHTML = '';
    events.forEach(event => {
      const card = document.createElement("div");
      card.className = "fund-card";
      // BUILD CORRECT LINK WITH REAL ID
      const contributeHref =
        `../contribute/contribute.html?fundId=${event._id}&title=${encodeURIComponent(event.title)}`;

      card.innerHTML = `
        <h2>${escapeHtml(event.title)}</h2>
        <p>${escapeHtml(event.description || '')}</p>
        <p><strong>Raised:</strong> INR ${Number(event.raised || 0)}</p>
        <a href="${contributeHref}">Contribute</a>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching funds:", err);
    container.innerHTML = '<p style="color:#b3261e;">Error loading funds.</p>';
  }
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}