// ── Firebase (variabili globali da CDN) ───────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAvnY2G5WDj7BqFbpkl7cg5X_aDLYzRLNg",
  authDomain: "paypos-95078.firebaseapp.com",
  databaseURL: "https://paypos-95078-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "paypos-95078",
  storageBucket: "paypos-95078.firebasestorage.app",
  messagingSenderId: "188159550927",
  appId: "1:188159550927:web:aa41ba1513af67f0e39eba"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Helpers compatibili con la sintassi usata nel codice
const ref          = (dbInst, path) => dbInst.ref(path);
const push         = (refObj, data) => refObj.push(data);
const runTransaction = (refObj, fn) => refObj.transaction(fn);

// ── Email (via Netlify Function) ───────────────────────────
async function sendConfirmationEmail(leadData) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    if (res.ok) {
      console.log('Email di conferma inviata ✓');
    } else {
      console.warn('Send email error:', res.status, await res.text());
    }
  } catch (err) {
    console.warn('Send email failed:', err.message);
  }
}

// ── Visit counter ──────────────────────────────────────────
(async () => {
  try {
    const visitsRef = ref(db, 'stats/visits');
    const result = await runTransaction(visitsRef, (current) => (current || 0) + 1);
    const count = result.snapshot.val() || 0;
    const el = document.getElementById('visits-count');
    if (el) el.textContent = count.toLocaleString('it-IT');
  } catch (e) {
    console.warn('Visit counter error:', e.message);
  }
})();

// ── State ──────────────────────────────────────────────────
let state = {
  posType: null,       // 'stampante' | 'base'
  posQty: { stampante: 1, base: 1 },
  planId: null,
  planName: null,
  customerType: 'individual'
};

// ── POS selection ──────────────────────────────────────────
function selectPOS(type) {
  state.posType = type;
  document.querySelectorAll('.pos-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('card-' + type).classList.add('selected');
  // show qty only for selected
  ['stampante','base'].forEach(t => {
    document.getElementById('qty-' + t).style.display = 'none';
    document.getElementById('qlabel-' + t).style.display = 'none';
  });
  document.getElementById('qty-' + type).style.display = 'flex';
  document.getElementById('qlabel-' + type).style.display = 'block';
  updateSummary();
}

function changeQty(type, delta, e) {
  e.stopPropagation();
  state.posQty[type] = Math.max(1, state.posQty[type] + delta);
  document.getElementById('val-' + type).textContent = state.posQty[type];
  updateSummary();
}

// ── Plan type toggle ────────────────────────────────────────
function switchType(type) {
  state.customerType = type;
  state.planId = null; state.planName = null;
  document.getElementById('btn-individual').classList.toggle('active', type === 'individual');
  document.getElementById('btn-business').classList.toggle('active', type === 'business');
  document.getElementById('plans-individual').style.display = type === 'individual' ? 'grid' : 'none';
  document.getElementById('plans-business').style.display = type === 'business' ? 'grid' : 'none';
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  updateSummary();
}

// ── Plan selection ──────────────────────────────────────────
function selectPlan(id, name, type) {
  // Se non è stato ancora scelto un POS, mostra prima il modal di scelta POS
  if (!state.posType) {
    openPosPickerModal(id, name, type);
    return;
  }
  state.planId = id; state.planName = name; state.customerType = type;
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('plan-' + id).classList.add('selected');
  updateSummary();
  // Open customer data modal
  openClienteModal(name, type);
}

// ── Modal POS Picker (mostrato quando si sceglie piano senza POS) ────────────
let _pendingPlan = null; // { id, name, type }

function openPosPickerModal(planId, planName, planType) {
  _pendingPlan = { id: planId, name: planName, type: planType };
  // Reset selezione interna
  ['stampante','base'].forEach(t => document.getElementById('pp-card-' + t).classList.remove('selected'));
  document.getElementById('pos-picker-confirm-btn').classList.remove('ready');
  document.getElementById('pos-picker-plan-name').textContent = planName;
  document.getElementById('modal-pos-picker').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePosPickerModal() {
  document.getElementById('modal-pos-picker').classList.remove('active');
  document.body.style.overflow = '';
  _pendingPlan = null;
}

function selectPosInPicker(type) {
  ['stampante','base'].forEach(t => document.getElementById('pp-card-' + t).classList.remove('selected'));
  document.getElementById('pp-card-' + type).classList.add('selected');
  _pendingPlan._posType = type;
  document.getElementById('pos-picker-confirm-btn').classList.add('ready');
}

function confirmPosAndProceed() {
  if (!_pendingPlan || !_pendingPlan._posType) return;
  const posType = _pendingPlan._posType;
  // Chiudi il picker
  document.getElementById('modal-pos-picker').classList.remove('active');
  // Seleziona il POS nel sistema (come se l'utente avesse cliccato sulla card)
  selectPOS(posType);
  // Evidenzia anche la card POS nella pagina
  document.getElementById('card-' + posType).classList.add('selected');
  // Ora procedi con la selezione piano
  const { id, name, type } = _pendingPlan;
  _pendingPlan = null;
  state.planId = id; state.planName = name; state.customerType = type;
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('plan-' + id).classList.add('selected');
  updateSummary();
  openClienteModal(name, type);
}

// ── Modal cliente ─────────────────────────────────────────────
function openClienteModal(planName, type) {
  const typeLabels = { individual: 'Privati & Startup', business: 'Aziende' };
  const posLabels = { stampante: '📠 POS con Stampante', base: '📱 POS Base' };
  const badge = document.getElementById('modal-plan-badge');
  if (badge) {
    const posInfo = state.posType ? (' • ' + posLabels[state.posType]) : '';
    badge.innerHTML = '📋 Piano <strong>' + planName + '</strong>' + posInfo;
  }
  document.getElementById('modal-cliente').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeClienteModal() {
  document.getElementById('modal-cliente').classList.remove('active');
  document.body.style.overflow = '';
}

// ── Modal costi ────────────────────────────────────────────────
function openCostsModal() {
  document.getElementById('modal-costi').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCostsModal() {
  document.getElementById('modal-costi').classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('modal-cliente').addEventListener('click', function(e) {
    if (e.target === this) closeClienteModal();
  });
  document.getElementById('modal-costi').addEventListener('click', function(e) {
    if (e.target === this) closeCostsModal();
  });
  document.getElementById('modal-pos-picker').addEventListener('click', function(e) {
    if (e.target === this) closePosPickerModal();
  });
  // Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeClienteModal(); closeCostsModal(); closePosPickerModal(); }
  });
});

// ── Summary & CTA state ─────────────────────────────────────
function updateSummary() {
  const posLabels = { stampante: 'POS con Stampante', base: 'POS Base' };
  const typeLabels = { individual: 'Privati & Startup', business: 'Aziende' };
  const ready = state.posType && state.planId;

  const sb = document.getElementById('summary-box');
  const lf = document.getElementById('lead-form');
  const sub = document.getElementById('cta-sub');

  if (ready) {
    sb.classList.add('visible');
    lf.classList.add('visible');
    sub.style.display = 'none';
    document.getElementById('sum-pos').textContent = posLabels[state.posType];
    document.getElementById('sum-qty').textContent = state.posQty[state.posType] + ' unità';
    document.getElementById('sum-plan').textContent = state.planName;
    document.getElementById('sum-type').textContent = typeLabels[state.customerType];
  } else {
    sb.classList.remove('visible');
    lf.classList.remove('visible');
    sub.style.display = 'block';
    let hint = 'Seleziona ';
    if (!state.posType && !state.planId) hint += 'un <strong>POS</strong> e un <strong>Piano</strong>';
    else if (!state.posType) hint += 'un <strong>POS</strong>';
    else hint += 'un <strong>Piano</strong>';
    hint += ' qui sopra per procedere.';
    sub.innerHTML = hint;
  }

  // scroll hint — gentle nudge (only scroll to plans when POS selected but no plan yet)
  if (state.posType && !state.planId) {
    document.getElementById('plans-' + state.customerType).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Modal Form submit ─────────────────────────────────────────
async function handleModalSubmit() {
  const nome = document.getElementById('m-nome').value.trim();
  const cognome = document.getElementById('m-cognome').value.trim();
  const email = document.getElementById('m-email').value.trim();
  const destinatario = document.getElementById('m-destinatario').value.trim();
  const via = document.getElementById('m-via').value.trim();
  const citta = document.getElementById('m-citta').value.trim();
  const cap = document.getElementById('m-cap').value.trim();
  const provincia = document.getElementById('m-provincia').value.trim().toUpperCase();
  const errEl = document.getElementById('modal-error');

  if (!nome || !cognome || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || !destinatario || !via || !citta || !cap || !provincia) {
    errEl.style.display = 'block';
    return;
  }
  const modalPrivacyCheck = document.getElementById('modal-privacy-check');
  if (modalPrivacyCheck && !modalPrivacyCheck.checked) {
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  const btn = document.getElementById('modal-go-btn');
  btn.disabled = true;
  btn.textContent = 'Registrazione in corso...';

  const posLabels = { stampante: 'POS con Stampante', base: 'POS Base' };
  const typeLabels = { individual: 'Privati & Startup', business: 'Aziende' };

  const leadData = {
    nome,
    cognome,
    email,
    destinatario_spedizione: destinatario,
    via_spedizione: via,
    citta_spedizione: citta,
    cap_spedizione: cap,
    provincia_spedizione: provincia,
    indirizzo_completo: `${via}, ${cap} ${citta} (${provincia})`,
    pos_tipo: posLabels[state.posType] || '—',
    pos_quantita: state.posQty[state.posType] || 1,
    piano: state.planName,
    tipo_cliente: typeLabels[state.customerType],
    timestamp: new Date().toISOString(),
    source: 'facebook-lead'
  };

  try {
    const savePromise = push(ref(db, 'leads'), leadData);
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
    await Promise.race([savePromise, timeout]);
    console.log('Lead salvato su Realtime Database ✓');
  } catch (err) {
    console.warn('Firebase save failed (si procede comunque):', err.message);
  }

  // Invia email di conferma
  await sendConfirmationEmail(leadData);

  closeClienteModal();
  setTimeout(() => {
    window.location.href = 'https://business.wamo.io/register?partner=paypos';
  }, 300);
}

// ── Form submit (legacy - CTA section) ─────────────────────────────────────────
async function handleSubmit() {
  const nome = document.getElementById('inp-nome').value.trim();
  const cognome = document.getElementById('inp-cognome').value.trim();
  const email = document.getElementById('inp-email').value.trim();
  const destinatario = document.getElementById('inp-destinatario').value.trim();
  const via = document.getElementById('inp-via').value.trim();
  const citta = document.getElementById('inp-citta').value.trim();
  const cap = document.getElementById('inp-cap').value.trim();
  const provincia = document.getElementById('inp-provincia').value.trim().toUpperCase();
  const errEl = document.getElementById('form-error');

  if (!nome || !cognome || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || !destinatario || !via || !citta || !cap || !provincia) {
    errEl.style.display = 'block';
    return;
  }
  const privacyCheck = document.getElementById('privacy-check');
  if (privacyCheck && !privacyCheck.checked) {
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  const btn = document.getElementById('go-btn');
  btn.disabled = true;
  btn.textContent = 'Registrazione in corso...';

  const posLabels = { stampante: 'POS con Stampante', base: 'POS Base' };
  const typeLabels = { individual: 'Privati & Startup', business: 'Aziende' };

  const leadData = {
    nome,
    cognome,
    email,
    destinatario_spedizione: destinatario,
    via_spedizione: via,
    citta_spedizione: citta,
    cap_spedizione: cap,
    provincia_spedizione: provincia,
    indirizzo_completo: `${via}, ${cap} ${citta} (${provincia})`,
    pos_tipo: posLabels[state.posType],
    pos_quantita: state.posQty[state.posType],
    piano: state.planName,
    tipo_cliente: typeLabels[state.customerType],
    timestamp: new Date().toISOString(),
    source: 'facebook-lead'
  };

  // Save to Firebase Realtime Database (con timeout per non bloccare)
  try {
    const savePromise = push(ref(db, 'leads'), leadData);
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
    await Promise.race([savePromise, timeout]);
    console.log('Lead salvato su Realtime Database ✓');
  } catch (err) {
    console.warn('Firebase save failed (si procede comunque):', err.message);
    // non blocchiamo il redirect
  }

  // Invia email di conferma
  await sendConfirmationEmail(leadData);

  // Show success
  document.getElementById('lead-form').style.display = 'none';
  document.getElementById('summary-box').style.display = 'none';
  document.getElementById('success-msg').style.display = 'block';

  // Redirect after 1.5s
  setTimeout(() => {
    window.location.href = 'https://business.wamo.io/register?partner=paypos';
  }, 1500);
}

// ── Expose to global scope (module script needs this for onclick attributes) ──
window.selectPOS          = selectPOS;
window.changeQty          = changeQty;
window.switchType         = switchType;
window.selectPlan         = selectPlan;
window.handleSubmit       = handleSubmit;
window.handleModalSubmit  = handleModalSubmit;
window.openClienteModal   = openClienteModal;
window.closeClienteModal  = closeClienteModal;
window.openCostsModal     = openCostsModal;
window.closeCostsModal    = closeCostsModal;
window.openPosPickerModal = openPosPickerModal;
window.closePosPickerModal = closePosPickerModal;
window.selectPosInPicker  = selectPosInPicker;
window.confirmPosAndProceed = confirmPosAndProceed;

  // Cookie banner
  function closeCookieBanner() {
    document.getElementById('cookie-banner').classList.add('hidden');
    try { localStorage.setItem('ppCookieBanner', '1'); } catch(e) {}
  }
  (function() {
    try { if (localStorage.getItem('ppCookieBanner')) document.getElementById('cookie-banner').classList.add('hidden'); } catch(e) {}
  })();
window.closeCookieBanner = closeCookieBanner;
