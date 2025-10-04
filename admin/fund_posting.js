// fund_posting.js  (UPDATED)
// Purpose: Handle Fund creation, listing (card view) and deletion.
// NOTE: Only appearance-neutral / bug-fix updates applied:
//  - Supports both _id and id coming from backend (ID mismatch was a common delete failure reason).
//  - Stricter handling of DELETE responses (no longer silently treating 404 as success).
//  - Added optional full reload after delete (toggle RELOAD_AFTER_DELETE).
//  - Added defensive checks + debug logs.
//  - Added loadFunds() so you can refresh programmatically (previously only once).
//
// If your backend maps _id -> id via a toJSON transform, this file will now still work.
// Keep FUND_API_BASE the same unless your API origin changes.

const FUND_API_BASE = 'http://localhost:5000';
const RELOAD_AFTER_DELETE = true; // set false if you prefer just removing the card without re-fetching list

document.addEventListener('DOMContentLoaded', () => {
  const addFundBtn     = document.getElementById('addFundBtn');
  const fundModal      = document.getElementById('fundModal');
  const closeFundModal = document.getElementById('closeFundModal');
  const cancelFundBtn  = document.getElementById('cancelFundBtn');
  const fundForm       = document.getElementById('fundForm');
  const fundResult     = document.getElementById('fundResult');
  const fundList       = document.getElementById('fundList');
  const createFundBtn  = document.getElementById('createFundBtn');
  const fundMenu       = document.getElementById('fundmenu');

  if (!addFundBtn || !fundModal || !fundForm || !fundList) {
    console.warn('[fund_posting.js] Required DOM nodes missing. Aborting init.');
    return;
  }

  let hasLoadedOnce = false;

  /* ---------------- Modal Open / Close ---------------- */
  addFundBtn.addEventListener('click', () => {
    resetForm();
    openModal();
  });

  closeFundModal?.addEventListener('click', closeModal);
  cancelFundBtn?.addEventListener('click', closeModal);
  fundModal.addEventListener('click', e => {
    if (e.target === fundModal) closeModal();
  });

  /* --------------- Load Once on Menu Click --------------- */
  fundMenu?.addEventListener('click', () => {
    if (!hasLoadedOnce) {
      loadFunds();
      hasLoadedOnce = true;
    }
  }, { once: true });

  /* --------------- CREATE (Submit Form) --------------- */
  fundForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    fundResult.textContent = '';
    fundResult.style.color = '#444';

    const title = document.getElementById('fundTitle').value.trim();
    const goalRaw = document.getElementById('fundGoal').value.trim();
    const description = document.getElementById('fundDescription').value.trim();

    if (!title || !goalRaw || !description) {
      showResult('Please fill all fields.', 'red');
      return;
    }
    const goal = Number(goalRaw);
    if (!Number.isFinite(goal) || goal <= 0) {
      showResult('Goal must be a positive number.', 'red');
      return;
    }

    toggleSubmitting(true);
    try {
  const res = await fetch(FUND_API_BASE + '/api/fundraising', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, goal })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showResult(data.message || 'Failed to create fund.', 'red');
      } else {
        showResult('Fund created successfully!', 'green');
        // Prefer reloading to ensure server canonical ordering & computed fields
        await loadFunds();
        setTimeout(closeModal, 600);
      }
    } catch (err) {
      showResult('Network error: ' + err.message, 'red');
    } finally {
      toggleSubmitting(false);
    }
  });

  /* --------------- DELETE (Event Delegation) --------------- */
  fundList.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.fund-delete-btn');
    if (!delBtn) return;

    const id = delBtn.getAttribute('data-id');
    if (!id) {
      alert('No id on this card. Cannot delete.');
      return;
    }
    // Quick sanity check for typical MongoDB ObjectId (skip if your IDs differ)
    if (id.length !== 24) {
      if (!confirm(`ID "${id}" is not 24 chars. Continue DELETE anyway?`)) return;
    }

    if (!confirm('Delete this fund? This cannot be undone.')) return;

    const card = delBtn.closest('.fund-card');
    if (card) {
      card.style.opacity = '0.55';
      delBtn.disabled = true;
      delBtn.textContent = '...';
    }

    console.log('[DELETE DEBUG] Sending DELETE for id=', id);

    try {
  const res = await fetch(FUND_API_BASE + '/api/fundraising/' + encodeURIComponent(id), {
        method: 'DELETE'
      });

      console.log('[DELETE DEBUG] Status=', res.status);

      if ([200, 204].includes(res.status)) {
        if (RELOAD_AFTER_DELETE) {
          await loadFunds();
        } else {
          removeCardById(id);
        }
      } else if (res.status === 404) {
        alert('Server says fund not found (404). It may have been already deleted or ID mismatch.');
        if (RELOAD_AFTER_DELETE) await loadFunds(); else cardRestore();
      } else if (res.status === 400) {
        const txt = await res.text();
        alert('Bad Request (400). Details: ' + txt);
        cardRestore();
      } else if (res.status === 405) {
        alert('Method Not Allowed (405). Backend DELETE route likely missing.');
        cardRestore();
      } else {
        const body = await res.text();
        alert('Delete failed (status ' + res.status + '). Body: ' + body);
        cardRestore();
      }
    } catch (err) {
      alert('Network error deleting fund: ' + err.message);
      cardRestore();
    }

    function cardRestore() {
      if (card) {
        card.style.opacity = '';
        delBtn.disabled = false;
        delBtn.textContent = '🗑';
      }
    }
  });

  /* --------------- Data Loading Helpers --------------- */
  async function loadFunds() {
    fundList.innerHTML = '<div style="padding:12px;font-size:.8rem;color:#555;">Loading funds...</div>';
    try {
  const res = await fetch(FUND_API_BASE + '/api/fundraising');
      if (!res.ok) throw new Error('Failed to load funds. Status ' + res.status);
      const list = await res.json();
      renderFundList(list);
    } catch (e) {
      console.error('[fund_posting] loadFunds error:', e);
      fundList.innerHTML = '<div style="color:#b3261e;font-size:.85rem;padding:10px;">Error loading funds.</div>';
    }
  }

  function renderFundList(list) {
    if (!Array.isArray(list) || list.length === 0) {
      fundList.innerHTML = '<div style="font-size:.85rem;color:#555;">No funds exist yet.</div>';
      return;
    }
    // Latest first (if createdAt present)
    list.sort((a,b)=> new Date(b.createdAt||b.date||0) - new Date(a.createdAt||a.date||0));
    fundList.innerHTML = list.map(f => fundCardHTML(f)).join('');
  }

  function removeCardById(id) {
    const card = fundList.querySelector('.fund-card[data-id="' + id + '"]');
    if (card) card.remove();
    if (!fundList.querySelector('.fund-card')) {
      fundList.innerHTML = '<div style="font-size:.85rem;color:#555;">No funds exist yet.</div>';
    }
  }

  /* --------------- Card Template --------------- */
  function fundCardHTML(f) {
    const id = buildId(f);
    const title = escapeHtml(f.title);
    const descShort = escapeHtml(
      (f.description || '')
        .split('\n')
        .slice(0, 2)
        .join(' ')
        .slice(0, 160)
    );
    const goal = Number(f.goal || 0).toLocaleString('en-IN');
    const raised = Number(f.raised || 0).toLocaleString('en-IN');
    const dateStr = formatDate(f.date || f.createdAt);

    return `
      <div class="fund-card" data-id="${id}" style="position:relative;border:1px solid #d5dee8;background:#fff;padding:14px 16px 44px 16px;border-radius:10px;margin:0 0 14px;box-shadow:0 2px 10px -4px rgba(0,0,0,.12);transition:.25s;">
        <button class="fund-delete-btn" data-id="${id}" title="Delete"
          style="position:absolute;top:8px;right:8px;background:#fff;border:1px solid #ccc;border-radius:6px;padding:4px 7px;font-size:14px;cursor:pointer;line-height:1;">🗑</button>
        <div style="font-weight:600;font-size:.95rem;margin-bottom:4px;">${title}</div>
        <div style="font-size:.62rem;letter-spacing:.4px;color:#555;margin-bottom:6px;">ID: ${id}${dateStr? ' • '+dateStr:''}</div>
        <div style="font-size:.78rem;line-height:1.15rem;color:#333;margin-bottom:8px;min-height:36px;">${descShort}</div>
        <div style="font-size:.72rem;color:#1a2d3d;font-weight:600;">
          Goal: ₹${goal} &nbsp; | &nbsp; Raised: ₹${raised}
        </div>
      </div>
    `;
  }

  /* --------------- Utility Helpers --------------- */
  function buildId(f){
    return f? (f._id || f.id || '') : '';
  }

  function openModal() {
    fundModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    fundModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function resetForm() {
    fundForm.reset();
    fundResult.textContent = '';
    toggleSubmitting(false);
  }

  function showResult(msg, color) {
    fundResult.textContent = msg;
    fundResult.style.color = color;
  }

  function toggleSubmitting(disabled) {
    [...fundForm.elements].forEach(el => el.disabled = disabled);
    if (createFundBtn) createFundBtn.textContent = disabled ? 'Creating...' : 'Create';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[s]));
  }

  function formatDate(d){
    if(!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric'});
    } catch { return ''; }
  }

  // Expose a manual reload for console debugging
  window.reloadFunds = loadFunds;
});

/*
BACKEND CHECK (Express + Mongoose minimal):
-------------------------------------------
app.delete('/api/fundraising/:id', async (req,res)=>{
  try {
    const { id } = req.params;
    if(!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message:'Invalid id format' });
    }
    const deleted = await Fund.findByIdAndDelete(id);
    if(!deleted) return res.status(404).json({ message:'Fund not found' });
    return res.status(204).send();
  } catch(err){
    console.error('DELETE /api/fundraising/:id error', err);
    res.status(500).json({ message:'Server error deleting fund' });
  }
});

Ensure CORS allows DELETE:
app.use(cors({
  origin:'http://localhost:5500', // or '*'
  methods:['GET','POST','DELETE','OPTIONS'],
  allowedHeaders:['Content-Type','Accept']
}));
*/