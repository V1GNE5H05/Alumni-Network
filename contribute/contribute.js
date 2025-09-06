// contribute.js (dual origin: Live Server 5501, API 5000)
const API_BASE = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const fundId = params.get('fundId');
  const providedTitle = params.get('title');

  const els = cacheEls();

  if (!fundId || fundId === 'FUND_ID') {
    showError('Invalid fundId. Go back to funds list.', els);
    disableForm(els.form);
    return;
  }

  if (providedTitle) els.fundTitleEl.textContent = decodeURIComponent(providedTitle);

  els.fundIdInput.value = fundId;
  loadFund(fundId, els);
  loadContributions(fundId, els);

  els.cancelBtn.addEventListener('click', () => history.back());
  els.form.addEventListener('submit', e => submitContribution(e, els));
});

function cacheEls() {
  return {
    fundTitleEl: document.getElementById('fund-title'),
    fundDescEl: document.getElementById('fund-desc'),
    fundStatsEl: document.getElementById('fund-stats'),
    statGoalEl: document.getElementById('stat-goal'),
    statRaisedEl: document.getElementById('stat-raised'),
    statContribEl: document.getElementById('stat-contrib'),
    form: document.getElementById('contribForm'),
    overlay: document.getElementById('overlay'),
    statusEl: document.getElementById('status'),
    fundIdInput: document.getElementById('fundId'),
    tableSection: document.getElementById('contrib-table-section'),
    tbody: document.getElementById('contrib-tbody'),
    submitBtn: document.getElementById('submitBtn'),
    cancelBtn: document.getElementById('cancelBtn')
  };
}

async function loadFund(id, els) {
  els.overlay.style.display = 'flex';
  try {
    const r = await fetch(`${API_BASE}/api/fundraising/${encodeURIComponent(id)}`);
    if (!r.ok) throw new Error('Fund not found');
    const f = await r.json();
    els.fundTitleEl.textContent = f.title;
    els.fundDescEl.textContent = f.description || 'Contribute using the form below.';
    updateStats(f, els);
  } catch (e) {
    showError(e.message, els);
    disableForm(els.form);
  } finally {
    els.overlay.style.display = 'none';
  }
}

function updateStats(f, els){
  els.statGoalEl.textContent = 'Goal: ' + (f.goal ?? 0);
  els.statRaisedEl.textContent = 'Raised: ' + (f.raised ?? 0);
  els.statContribEl.textContent = 'Contributions: ' + (f.contributors ?? 0);
  els.fundStatsEl.classList.remove('hidden');
}

async function loadContributions(id, els){
  try {
    const r = await fetch(`${API_BASE}/api/fundraising/${encodeURIComponent(id)}/contributions`);
    if (!r.ok) throw new Error();
    const list = await r.json();
    renderTable(list, els);
  } catch {
    renderTable([], els);
  }
}

function renderTable(list, els){
  els.tableSection.classList.remove('hidden');
  if (!Array.isArray(list) || list.length === 0) {
    els.tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No contributions yet.</td></tr>';
    return;
  }
  els.tbody.innerHTML = list.map(c => {
    const d = new Date(c.createdAt).toLocaleString(undefined,{dateStyle:'short',timeStyle:'short'});
    const anon = c.anonymous;
    const name = anon ? '(Anonymous)' : escapeHtml(c.firstName) + ' ' + escapeHtml(c.lastName);
    return `<tr>
      <td>${d}</td>
      <td>${Number(c.amount)}</td>
      <td>${name}</td>
      <td>${anon ? '—' : escapeHtml(c.email)}</td>
      <td>${escapeHtml(c.transactionMode)}</td>
      <td>${escapeHtml(c.city)}</td>
      <td>${escapeHtml(c.pincode)}</td>
      <td>${anon ? 'Yes':'No'}</td>
    </tr>`;
  }).join('');
}

async function submitContribution(e, els){
  e.preventDefault();
  clearErrors();
  els.statusEl.textContent = '';
  const data = formDataToObject(new FormData(els.form));
  data.anonymous = els.form.anonymous.checked;

  const errs = validate(data);
  if (Object.keys(errs).length) {
    showErrors(errs);
    els.statusEl.textContent = 'Fix the highlighted fields.';
    els.statusEl.className = 'fail';
    return;
  }

  try {
    toggleSubmitting(true, els);
    els.statusEl.textContent = 'Submitting...';
    const r = await fetch(`${API_BASE}/api/contributions`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const out = await r.json().catch(()=>({message:'Server error'}));
    if (!r.ok) throw new Error(out.message || 'Submission failed');
    els.statusEl.textContent = 'Thank you! Contribution recorded.';
    els.statusEl.className = 'success';

    const fid = data.fundId;
    els.form.reset();
    els.fundIdInput.value = fid;
    await loadFund(fid, els);
    await loadContributions(fid, els);
  } catch(err){
    els.statusEl.textContent = err.message;
    els.statusEl.className = 'fail';
  } finally {
    toggleSubmitting(false, els);
  }
}

function validate(d){
  const e = {};
  if(!d.fundId) e.fundId = 'Missing fund';
  if(!d.amount || Number(d.amount) <= 0) e.amount = 'Enter a positive amount';
  const req = ['transactionMode','firstName','lastName','email','phone','street','locality','city','state','country','pincode'];
  req.forEach(f => { if(!d[f] || !String(d[f]).trim()) e[f] = 'Required'; });
  if(d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) e.email = 'Invalid email';
  if(d.phone && !/^(?:\+?91[- ]?)?[6-9]\d{9}$/.test(d.phone)) e.phone = 'Invalid phone';
  if(d.pincode && !/^[1-9][0-9]{5}$/.test(d.pincode)) e.pincode = 'Invalid pincode';
  if(d.notes && d.notes.length > 500) e.notes = 'Max 500 chars';
  return e;
}

function showErrors(map){
  for(const [field,msg] of Object.entries(map)){
    const el = document.querySelector(`.error-text[data-err="${field}"]`);
    if(el) el.textContent = msg;
    const input = document.getElementById(field);
    if(input) input.classList.add('error-border');
  }
}
function clearErrors(){
  document.querySelectorAll('.error-text').forEach(e=>e.textContent='');
  document.querySelectorAll('.error-border').forEach(i=>i.classList.remove('error-border'));
}

function formDataToObject(fd){
  const obj = {};
  fd.forEach((v,k)=> obj[k] = typeof v === 'string' ? v.trim() : v);
  return obj;
}
function toggleSubmitting(is, els){
  [...els.form.elements].forEach(el => el.disabled = is);
  if(els.submitBtn) els.submitBtn.textContent = is ? 'Submitting...' : 'Contribute';
}
function disableForm(form){ [...form.elements].forEach(el => el.disabled = true); }
function showError(msg, els){
  els.fundTitleEl.textContent = 'Fund Error';
  els.fundDescEl.textContent = msg;
}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}