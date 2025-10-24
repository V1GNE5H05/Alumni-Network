// fund_posting.js - Fund management logic for Admin Dashboard (Table View)
// Purpose: Handle fund CRUD operations (Create, Read, Delete) for admin interface
// Compatible with: admin_dashboard.html (table-based layout)

(function() {
    'use strict';

    const API_BASE = 'http://localhost:5000';
    let fundsLoaded = false;

    console.log('[FUND_POSTING] Initializing... API Base:', API_BASE);

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // DOM Elements
        const fundMenu = document.getElementById('fundmenu');
        const reloadBtn = document.getElementById('reloadFundsBtn');
        const fundTableBody = document.getElementById('fundTableBody');
        const addFundBtn = document.getElementById('addFundBtn');
        const fundModal = document.getElementById('fundModal');
        const closeFundModal = document.getElementById('closeFundModal');
        const cancelFundBtn = document.getElementById('cancelFundBtn');
        const fundForm = document.getElementById('fundForm');
        const fundResult = document.getElementById('fundResult');
        const createBtn = document.getElementById('createFundBtn');

        // Check if required elements exist
        if (!fundMenu || !fundTableBody || !addFundBtn || !fundModal || !fundForm) {
            console.error('[FUND_POSTING] Required DOM elements not found!');
            console.error('Missing:', {
                fundMenu: !fundMenu,
                fundTableBody: !fundTableBody,
                addFundBtn: !addFundBtn,
                fundModal: !fundModal,
                fundForm: !fundForm
            });
            return;
        }

        console.log('[FUND_POSTING] All required elements found.');

        // ============ EVENT LISTENERS ============

        // Load funds when "Fund Posting" menu is clicked
        fundMenu.addEventListener('click', () => {
            console.log('[FUND_POSTING] Menu clicked');
            if (!fundsLoaded) {
                loadFunds();
                fundsLoaded = true;
            }
        });

        // Reload button
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                console.log('[FUND_POSTING] Reload button clicked');
                loadFunds();
            });
        }

        // Open modal to add new fund
        if (addFundBtn) {
            addFundBtn.addEventListener('click', () => {
                console.log('[FUND_POSTING] Add fund button clicked');
                resetFundForm();
                openFundModal();
            });
        }

        // Close modal handlers
        if (closeFundModal) {
            closeFundModal.addEventListener('click', closeFundModalFn);
        }
        if (cancelFundBtn) {
            cancelFundBtn.addEventListener('click', closeFundModalFn);
        }
        if (fundModal) {
            fundModal.addEventListener('click', (e) => {
                if (e.target === fundModal) closeFundModalFn();
            });
        }

        // ============ CREATE FUND ============
        fundForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (fundResult) fundResult.textContent = '';

            const titleInput = document.getElementById('fundTitle');
            const goalInput = document.getElementById('fundGoal');
            const descInput = document.getElementById('fundDescription');

            if (!titleInput || !goalInput || !descInput) {
                showFundResult('Form fields not found', 'red');
                return;
            }

            const title = titleInput.value.trim();
            const goalVal = goalInput.value.trim();
            const description = descInput.value.trim();

            // Validation
            if (!title || !goalVal || !description) {
                showFundResult('Please fill all fields', 'red');
                return;
            }

            const goal = Number(goalVal);
            if (!Number.isFinite(goal) || goal <= 0) {
                showFundResult('Goal must be a positive number', 'red');
                return;
            }

            toggleFundSubmitting(true);
            console.log('[CREATE] Creating fund:', { title, goal, description: description.substring(0, 50) + '...' });

            try {
                const res = await fetch(`${API_BASE}/api/fundraising`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ title, description, goal })
                });

                console.log('[CREATE] Response status:', res.status);

                const data = await safeParseJSON(res);

                if (!res.ok) {
                    showFundResult((data && data.message) || `Failed to create fund (${res.status})`, 'red');
                } else {
                    showFundResult('✓ Fund created successfully!', 'green');
                    await loadFunds();
                    setTimeout(closeFundModalFn, 600);
                }
            } catch (err) {
                console.error('[CREATE] Error:', err);
                showFundResult('Network error: ' + err.message, 'red');
            } finally {
                toggleFundSubmitting(false);
            }
        });

        // ============ DELETE FUND ============
        fundTableBody.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action="delete-fund"]');
            if (!btn) return;

            const id = btn.getAttribute('data-id');
            if (!id) {
                alert('No ID found on this row; cannot delete.');
                return;
            }

            if (!confirm('Delete this fund?\n\nThis action cannot be undone.')) return;

            const tr = btn.closest('tr');
            if (tr) tr.classList.add('fund-row-deleting');

            console.log('[DELETE] Deleting fund ID:', id);

            try {
                const res = await fetch(`${API_BASE}/api/fundraising/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                    headers: { 'Accept': 'application/json' }
                });

                console.log('[DELETE] Response status:', res.status);

                if (res.status === 200 || res.status === 204) {
                    console.log('[DELETE] Success!');
                    await loadFunds();
                } else if (res.status === 404) {
                    alert('Fund not found (404). It may have been already deleted.');
                    await loadFunds();
                } else if (res.status === 400) {
                    const txt = await res.text();
                    alert('Invalid ID (400). Details: ' + txt);
                    restoreRow(tr);
                } else if (res.status === 405) {
                    alert('DELETE not allowed (405). Check backend route configuration.');
                    restoreRow(tr);
                } else {
                    const body = await res.text();
                    alert(`Delete failed (${res.status}). ${body}`);
                    restoreRow(tr);
                }
            } catch (err) {
                console.error('[DELETE] Error:', err);
                alert('Network error: ' + err.message);
                restoreRow(tr);
            }
        });

        // ============ LOAD FUNDS ============
        async function loadFunds() {
            fundTableBody.innerHTML = '<tr><td colspan="6" style="padding:20px;text-align:center;color:#666;">Loading funds...</td></tr>';

            console.log('[LOAD] Fetching from:', `${API_BASE}/api/fundraising`);

            try {
                const res = await fetch(`${API_BASE}/api/fundraising`, {
                    headers: { 'Accept': 'application/json' },
                    cache: 'no-store'
                });

                console.log('[LOAD] Response status:', res.status);

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }

                const list = await safeParseJSON(res);
                console.log('[LOAD] Received', list ? list.length : 0, 'funds');

                if (!list) {
                    throw new Error('Invalid response from server');
                }

                renderFundRows(list);
            } catch (err) {
                console.error('[LOAD] Error:', err);
                fundTableBody.innerHTML = `<tr><td colspan="6" style="padding:20px;text-align:center;color:#e22;">
                    <div style="margin-bottom:8px;">⚠ Error loading funds</div>
                    <div style="font-size:0.8rem;color:#666;">${err.message}</div>
                </td></tr>`;
            }
        }

        // ============ RENDER TABLE ROWS ============
        function renderFundRows(list) {
            if (!Array.isArray(list)) {
                fundTableBody.innerHTML = '<tr><td colspan="6" style="padding:20px;text-align:center;color:#e22;">Invalid data format</td></tr>';
                return;
            }

            if (list.length === 0) {
                fundTableBody.innerHTML = `<tr><td colspan="6" style="padding:40px;text-align:center;color:#888;">
                    <div style="font-size:2rem;margin-bottom:10px;">📦</div>
                    <div>No funds available yet.</div>
                    <div style="font-size:0.85rem;margin-top:8px;">Click "Post" to create your first fund.</div>
                </td></tr>`;
                return;
            }

            // Sort by newest first
            list.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.date || 0);
                const dateB = new Date(b.createdAt || b.date || 0);
                return dateB - dateA;
            });

            fundTableBody.innerHTML = list.map(f => fundRowHTML(f)).join('');
            console.log('[RENDER] Rendered', list.length, 'fund rows');
        }

        // ============ CREATE TABLE ROW HTML ============
        function fundRowHTML(f) {
            const id = getId(f);
            
            if (!id) {
                console.warn('[FUND] Missing _id for fund:', f);
            }

            const title = esc(f.title || 'Untitled');
            const desc = f.description || '';
            const descShort = esc(desc.split('\n')[0].slice(0, 120)) + (desc.length > 120 ? '...' : '');
            const goal = Number(f.goal || 0).toLocaleString('en-IN');
            const raised = Number(f.raised || 0).toLocaleString('en-IN');
            const contributors = Number(f.contributors || 0);
            const date = formatDate(f.createdAt || f.date);
            const disableDelete = id ? '' : 'disabled title="No ID"';

            return `<tr data-id="${id}" style="border-bottom:1px solid #e2e8ee;">
                <td style="padding:10px 8px;font-weight:600;max-width:200px;word-break:break-word;">${title}</td>
                <td style="padding:10px 8px;max-width:300px;word-break:break-word;font-size:0.85rem;color:#555;">${descShort}</td>
                <td style="padding:10px 8px;text-align:right;white-space:nowrap;">₹${goal}</td>
                <td style="padding:10px 8px;text-align:right;white-space:nowrap;color:#4caf50;font-weight:600;">₹${raised}</td>
                <td style="padding:10px 8px;white-space:nowrap;">${date}</td>
                <td style="padding:8px;text-align:center;">
                    <button data-action="delete-fund" data-id="${id}" ${disableDelete}
                        style="background:#fff;border:1px solid #d3dbe3;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:16px;line-height:1;transition:all 0.2s;"
                        onmouseover="this.style.background='#fee';this.style.borderColor='#e22'"
                        onmouseout="this.style.background='#fff';this.style.borderColor='#d3dbe3'">🗑</button>
                </td>
            </tr>`;
        }

        // ============ HELPER FUNCTIONS ============

        function getId(f) {
            return f ? (f._id || f.id || '') : '';
        }

        function esc(str) {
            const div = document.createElement('div');
            div.textContent = str || '';
            return div.innerHTML;
        }

        function formatDate(d) {
            if (!d) return '';
            try {
                const date = new Date(d);
                if (isNaN(date.getTime())) return '';
                return date.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch {
                return '';
            }
        }

        function restoreRow(tr) {
            if (tr) {
                tr.classList.remove('fund-row-deleting');
                const btn = tr.querySelector('button[data-action="delete-fund"]');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = '🗑';
                }
            }
        }

        function openFundModal() {
            if (fundModal) {
                fundModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        }

        function closeFundModalFn() {
            if (fundModal) {
                fundModal.style.display = 'none';
                document.body.style.overflow = '';
            }
            resetFundForm();
        }

        function resetFundForm() {
            if (fundForm) fundForm.reset();
            if (fundResult) fundResult.textContent = '';
            toggleFundSubmitting(false);
        }

        function showFundResult(msg, color) {
            if (fundResult) {
                fundResult.textContent = msg;
                fundResult.style.color = color;
            }
        }

        function toggleFundSubmitting(disabled) {
            if (!fundForm) return;
            
            const elements = fundForm.elements;
            for (let i = 0; i < elements.length; i++) {
                elements[i].disabled = disabled;
            }
            
            if (createBtn) {
                createBtn.textContent = disabled ? 'Creating...' : 'Create';
                createBtn.style.opacity = disabled ? '0.6' : '1';
            }
        }

        async function safeParseJSON(res) {
            const text = await res.text();
            try {
                return text ? JSON.parse(text) : null;
            } catch (err) {
                console.error('[PARSE] JSON parse error:', err);
                console.error('[PARSE] Response text:', text.substring(0, 200));
                return null;
            }
        }

        // Expose for debugging
        window.reloadFunds = loadFunds;
        console.log('[FUND_POSTING] Initialization complete. Use window.reloadFunds() to manually refresh.');
    }

})();