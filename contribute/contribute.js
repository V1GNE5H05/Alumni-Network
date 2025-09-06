// contribute.js - Razorpay payment flow that only updates DB AFTER successful payment verification.
const API_BASE = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const fundId = params.get('fundId') || params.get('fund'); // accept both names
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
  els.form.addEventListener('submit', e => beginPaymentFlow(e, els));
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

/* ------------ Load Fund & Contributions ----------- */
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
      <td>${escapeHtml(c.transactionMode || 'online')}</td>
      <td>${escapeHtml(c.city)}</td>
      <td>${escapeHtml(c.pincode)}</td>
      <td>${anon ? 'Yes':'No'}</td>
    </tr>`;
  }).join('');
}

/* ------------ Payment Flow ------------- */
async function beginPaymentFlow(e, els){
  e.preventDefault();
  clearErrors();
  els.statusEl.textContent = '';
  const data = formDataToObject(new FormData(els.form));
  data.anonymous = els.form.anonymous.checked;
  data.fundId = els.fundIdInput.value;

  const errs = validate(data);
  if (Object.keys(errs).length) {
    showErrors(errs);
    els.statusEl.textContent = 'Fix the highlighted fields.';
    els.statusEl.className = 'fail';
    return;
  }

  try {
    toggleSubmitting(true, els);
    els.statusEl.textContent = 'Creating payment order...';

    // Create Razorpay order + stage contribution (pending)
    const orderRes = await fetch(`${API_BASE}/api/payments/razorpay/create-order`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const orderData = await orderRes.json().catch(()=>({}));
    if(!orderRes.ok || !orderData.orderId){
      throw new Error(orderData.message || 'Failed to create order');
    }

    els.statusEl.textContent = 'Opening payment popup...';

    // Launch Razorpay checkout
    const options = {
      key: orderData.keyId,
      amount: orderData.amount * 100,
      currency: orderData.currency || 'INR',
      name: 'Fund Contribution',
      description: orderData.fundTitle,
      order_id: orderData.orderId,
      handler: async function (response){
        els.statusEl.textContent = 'Verifying payment...';
        try {
          const verifyRes = await fetch(`${API_BASE}/api/payments/razorpay/verify`, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const verifyData = await verifyRes.json().catch(()=>({}));
          if(!verifyRes.ok || !verifyData.success){
            throw new Error(verifyData.message || 'Verification failed');
          }
          els.statusEl.textContent = 'Payment successful! Thank you.';
          els.statusEl.className = 'success';
          els.form.reset();
          els.fundIdInput.value = data.fundId;
          await loadFund(data.fundId, els);
          await loadContributions(data.fundId, els);
        } catch(err){
          els.statusEl.textContent = err.message;
          els.statusEl.className = 'fail';
        } finally {
          toggleSubmitting(false, els);
        }
      },
      modal: {
        ondismiss: () => {
          els.statusEl.textContent = 'Payment cancelled.';
          els.statusEl.className = 'fail';
          toggleSubmitting(false, els);
        }
      },
      prefill: {
        name: data.firstName + ' ' + data.lastName,
        email: data.email,
        contact: data.phone
      },
      notes: { fundId: data.fundId, anonymous: data.anonymous ? 'yes':'no' },
      theme: { color:'#1c08f8' }
    };

    if(typeof Razorpay === 'undefined'){
      throw new Error('Razorpay script not loaded');
    }
    const rzp = new Razorpay(options);
    rzp.open();

  } catch(err){
    els.statusEl.textContent = err.message;
    els.statusEl.className = 'fail';
    toggleSubmitting(false, els);
  }
}

/* ------------ Validation & Utils ------------- */
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
  if(els.submitBtn) els.submitBtn.textContent = is ? 'Processing...' : 'Contribute';
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