// ── State ──────────────────────────────────────────────────────────────────
const state = {
  labels: [],
  examples: [],
  selectedLabel: null,
  classified: 0,
};

// ── Color palette for labels ────────────────────────────────────────────────
const LABEL_COLORS = [
  { bg: 'rgba(200,245,100,0.12)', border: '#c8f564', text: '#c8f564' },
  { bg: 'rgba(107,181,255,0.12)', border: '#6bb5ff', text: '#6bb5ff' },
  { bg: 'rgba(185,143,255,0.12)', border: '#b98fff', text: '#b98fff' },
  { bg: 'rgba(255,179,71,0.12)',  border: '#ffb347', text: '#ffb347' },
  { bg: 'rgba(79,209,197,0.12)',  border: '#4fd1c5', text: '#4fd1c5' },
  { bg: 'rgba(255,107,107,0.12)', border: '#ff6b6b', text: '#ff6b6b' },
  { bg: 'rgba(255,215,100,0.12)', border: '#ffd764', text: '#ffd764' },
];

function colorFor(label) {
  const idx = state.labels.indexOf(label);
  return LABEL_COLORS[Math.max(0, idx) % LABEL_COLORS.length];
}

// ── Tab switching ───────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.id === 'panel-' + name);
  });
}

// ── Label management ────────────────────────────────────────────────────────
function addLabel() {
  const inp = document.getElementById('label-input');
  const val = inp.value.trim();
  if (!val || state.labels.includes(val)) { inp.value = ''; return; }
  state.labels.push(val);
  inp.value = '';
  renderAll();
}

function removeLabel(label) {
  state.labels = state.labels.filter(l => l !== label);
  state.examples = state.examples.filter(e => e.label !== label);
  if (state.selectedLabel === label) state.selectedLabel = null;
  renderAll();
}

function selectLabel(label) {
  state.selectedLabel = label;
  renderAssignPills();
}

// ── Example management ──────────────────────────────────────────────────────
function addExample() {
  const text = document.getElementById('train-text').value.trim();
  if (!text) { showToast('Please enter some training text.', 'warn'); return; }
  if (!state.selectedLabel) { showToast('Please select a label to assign.', 'warn'); return; }
  state.examples.push({ id: Date.now() + Math.random(), text, label: state.selectedLabel });
  document.getElementById('train-text').value = '';
  renderAll();
  showToast(`Added example for "${state.selectedLabel}"`, 'ok');
}

function removeExample(id) {
  state.examples = state.examples.filter(e => e.id !== id);
  renderAll();
}

function clearAll() {
  if (!confirm('Clear all labels and examples?')) return;
  state.labels = [];
  state.examples = [];
  state.selectedLabel = null;
  renderAll();
}

// ── Render helpers ──────────────────────────────────────────────────────────
function renderAll() {
  renderLabelPills();
  renderAssignPills();
  renderExamples();
  updateStats();
}

function renderLabelPills() {
  const container = document.getElementById('label-pills');
  container.innerHTML = state.labels.map(l => {
    const c = colorFor(l);
    return `<span class="label-pill" style="background:${c.bg};border-color:${c.border};color:${c.text};">
      ${escHtml(l)}
      <span class="pill-x" onclick="removeLabel('${escJs(l)}')" title="Remove label">✕</span>
    </span>`;
  }).join('') || `<span style="font-size:13px;color:var(--text3);">No labels yet</span>`;
}

function renderAssignPills() {
  const container = document.getElementById('assign-pills');
  if (!state.labels.length) {
    container.innerHTML = `<span style="font-size:13px;color:var(--text3);">Add labels first</span>`;
    return;
  }
  container.innerHTML = state.labels.map(l => {
    const c = colorFor(l);
    const sel = state.selectedLabel === l;
    return `<span class="label-pill" onclick="selectLabel('${escJs(l)}')"
      style="background:${sel ? c.bg : 'transparent'};border-color:${sel ? c.border : 'var(--border-hi)'};color:${sel ? c.text : 'var(--text2)'};">
      ${escHtml(l)}
    </span>`;
  }).join('');
}

function renderExamples() {
  const container = document.getElementById('examples-list');
  if (!state.examples.length) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⬡</div>
      <p>No training examples yet.<br>Add some in the Train tab.</p>
    </div>`;
    return;
  }
  container.innerHTML = state.examples.map(e => {
    const c = colorFor(e.label);
    return `<div class="example-card">
      <div class="example-top">
        <span class="example-badge" style="background:${c.bg};color:${c.text};">${escHtml(e.label)}</span>
        <button class="example-remove" onclick="removeExample(${e.id})" title="Remove">✕</button>
      </div>
      <p class="example-text">${escHtml(e.text.substring(0, 160))}${e.text.length > 160 ? '…' : ''}</p>
    </div>`;
  }).join('');
}

function updateStats() {
  document.getElementById('h-examples').textContent = state.examples.length;
  document.getElementById('h-labels').textContent = state.labels.length;
  document.getElementById('ex-badge').textContent = state.examples.length;
}

// ── Rule-based classifier (NO API needed) ───────────────────────────────────
const KEYWORD_MAP = {
  'Legal': [
    'contract','agreement','clause','liability','arbitration','jurisdiction',
    'defendant','plaintiff','lawsuit','litigation','attorney','counsel',
    'hereby','whereas','notwithstanding','indemnify','indemnification',
    'licensee','licensor','sublicense','termination','governing law',
    'binding','enforceable','waiver','breach','remedy','statute','legal'
  ],
  'Finance': [
    'revenue','profit','loss','ebitda','margin','earnings','income',
    'dividend','shares','equity','debt','cash flow','balance sheet',
    'fiscal','quarterly','annual report','budget','expense','cost',
    'investment','roi','return','capital','funding','valuation','ipo',
    'stock','bonds','financial','billion','million','dollar','$','%'
  ],
  'HR': [
    'employee','staff','leave','vacation','holiday','payroll','salary',
    'performance review','appraisal','hiring','recruitment','onboarding',
    'termination','resignation','benefits','compensation','overtime',
    'workplace','policy','handbook','conduct','training','manager',
    'department','headcount','workforce','human resources','hr','remote work'
  ],
  'Technical': [
    'api','server','database','deployment','code','software','hardware',
    'network','firewall','encryption','authentication','authorization',
    'bug','error','debug','pipeline','ci/cd','docker','kubernetes',
    'repository','git','branch','merge','pull request','integration',
    'algorithm','function','variable','class','object','framework',
    'backend','frontend','cloud','aws','azure','linux','technical'
  ],
};

function computeScores(text) {
  const lower = text.toLowerCase();
  const scores = {};

  // Get all labels from training examples + built-in keyword map
  const allLabels = [...new Set([...state.labels])];

  allLabels.forEach(label => {
    let score = 0;

    // 1. Keyword matching from built-in map
    const keywords = KEYWORD_MAP[label] || [];
    keywords.forEach(kw => {
      const regex = new RegExp('\\b' + kw.replace(/\$/g, '\\$') + '\\b', 'gi');
      const matches = (lower.match(regex) || []).length;
      score += matches * 2;
    });

    // 2. TF similarity with training examples of this label
    const labelExamples = state.examples.filter(e => e.label === label);
    labelExamples.forEach(ex => {
      const exWords = new Set(ex.text.toLowerCase().split(/\W+/).filter(w => w.length > 3));
      const docWords = lower.split(/\W+/).filter(w => w.length > 3);
      let overlap = 0;
      docWords.forEach(w => { if (exWords.has(w)) overlap++; });
      score += overlap * 3;
    });

    scores[label] = Math.max(score, 0);
  });

  // Normalize to sum = 1
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total === 0) {
    allLabels.forEach(l => { scores[l] = 1 / allLabels.length; });
  } else {
    allLabels.forEach(l => { scores[l] = scores[l] / total; });
  }

  return scores;
}

function generateReasoning(label, text, scores) {
  const confidence = Math.round(scores[label] * 100);
  const reasons = {
    'Legal': 'The document contains legal terminology such as contract clauses, arbitration, or liability terms.',
    'Finance': 'The document discusses financial metrics, revenue figures, or monetary performance data.',
    'HR': 'The document relates to employee policies, leave entitlements, or workplace procedures.',
    'Technical': 'The document covers technical topics such as APIs, deployments, or software systems.',
  };

  const topWords = Object.keys(KEYWORD_MAP[label] || {});
  const found = topWords.filter(kw => text.toLowerCase().includes(kw)).slice(0, 3);
  const keywordNote = found.length > 0 ? ` Key terms found: "${found.join('", "')}"` : '';

  return (reasons[label] || `The document best matches the "${label}" category based on content similarity.`) + keywordNote;
}

// ── Classify — fully offline, no API ───────────────────────────────────────
function classifyDoc() {
  const text = document.getElementById('classify-text').value.trim();
  if (!text) { showToast('Paste a document to classify.', 'warn'); return; }
  if (!state.labels.length) { showToast('Add labels first.', 'warn'); return; }
  if (!state.examples.length) { showToast('Load sample dataset first.', 'warn'); return; }

  const btn = document.getElementById('classify-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Classifying…';

  // Simulate processing delay for UX
  setTimeout(() => {
    const scores = computeScores(text);

    // Find best label
    const label = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const confidence = scores[label];
    const reasoning = generateReasoning(label, text, scores);

    state.classified++;
    renderClassifyResult({ label, confidence, scores, reasoning });
    showToast('Classified successfully', 'ok');

    btn.disabled = false;
    btn.innerHTML = 'Classify document →';
  }, 600);
}

function renderClassifyResult(result) {
  const c = colorFor(result.label);
  const pct = Math.round((result.confidence || 0) * 100);

  const scoresHtml = state.labels.map(l => {
    const sc = result.scores?.[l] ?? 0;
    const p = Math.round(sc * 100);
    const lc = colorFor(l);
    return `<div class="score-row">
      <div class="score-meta">
        <span>${escHtml(l)}</span>
        <span class="score-pct">${p}%</span>
      </div>
      <div class="score-bar">
        <div class="score-fill" style="width:${p}%;background:${lc.border};"></div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('classify-result').innerHTML = `
    <div>
      <p style="font-size:12px;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.75rem;font-weight:500;">Result</p>
      <div class="result-label-row">
        <span class="result-label-badge" style="background:${c.bg};color:${c.text};">${escHtml(result.label)}</span>
        <span class="result-confidence">${pct}% confidence</span>
      </div>
      <p class="result-reasoning">${escHtml(result.reasoning)}</p>
      <p class="scores-title">Label scores</p>
      ${scoresHtml}
    </div>`;
}

// ── Sample data ─────────────────────────────────────────────────────────────
function loadDefaults() {
  const dataset = [
    {
      label: 'Legal',
      examples: [
        'This Agreement is entered into as of the Effective Date by and between the parties identified herein. Each party agrees to be bound by the terms and conditions set forth.',
        'The defendant hereby waives any and all rights to a jury trial and consents to binding arbitration governed by the rules of the American Arbitration Association.',
        'Notwithstanding the foregoing, the indemnifying party shall have no obligation to indemnify for losses arising out of its own gross negligence or willful misconduct.',
      ],
    },
    {
      label: 'Finance',
      examples: [
        'Q3 revenue reached $4.2 million, up 18% year-over-year. Gross margin improved to 68% driven by SaaS subscription growth and reduction in cost of goods sold.',
        'The company reports net income of $1.1 billion for the fiscal year, with EBITDA margins expanding 200 basis points to 34% compared to the prior period.',
        'Cash flow from operations totaled $320 million. The board approved a dividend increase of 8% and authorized a share buyback of $500 million over 18 months.',
      ],
    },
    {
      label: 'HR',
      examples: [
        'All full-time employees are entitled to 20 days of paid annual leave per calendar year. Leave must be approved in advance by the direct line manager.',
        'Performance reviews are conducted bi-annually. Managers must provide structured written feedback and agree on SMART goals with each direct report.',
        'The company is an equal opportunity employer and does not discriminate on the basis of race, gender, age, disability, religion, or any other protected characteristic.',
      ],
    },
    {
      label: 'Technical',
      examples: [
        'The API rate limit is 1000 requests per minute per key. Requests exceeding this threshold receive a 429 response and must implement exponential backoff.',
        'Database migrations are handled via Alembic. Run alembic upgrade head to apply all pending migrations. Ensure a backup exists before running in production.',
        'The CI pipeline runs unit tests, integration tests, and static analysis on every pull request. Coverage must remain above 80% or the build will fail.',
      ],
    },
  ];

  dataset.forEach(({ label, examples }) => {
    if (!state.labels.includes(label)) state.labels.push(label);
    examples.forEach(text => {
      state.examples.push({ id: Date.now() + Math.random(), text, label });
    });
  });

  renderAll();
  showToast('Sample dataset loaded — 4 labels, 12 examples', 'ok');
}

// ── Toast notifications ──────────────────────────────────────────────────────
function showToast(msg, type = 'ok') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed;bottom:2rem;right:2rem;z-index:9999;
      padding:12px 20px;border-radius:12px;font-size:14px;
      font-family:'Outfit',sans-serif;border:1px solid;
      transition:opacity 0.3s;max-width:340px;
    `;
    document.body.appendChild(toast);
  }
  const colors = {
    ok:   { bg: 'rgba(200,245,100,0.1)', border: '#c8f564', color: '#c8f564' },
    warn: { bg: 'rgba(255,179,71,0.1)',  border: '#ffb347', color: '#ffb347' },
    err:  { bg: 'rgba(255,107,107,0.1)', border: '#ff6b6b', color: '#ff6b6b' },
  };
  const col = colors[type] || colors.ok;
  toast.style.background = col.bg;
  toast.style.borderColor = col.border;
  toast.style.color = col.color;
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2800);
}

// ── Utils ────────────────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escJs(s) {
  return String(s).replace(/'/g,"\\'");
}

// ── Init ─────────────────────────────────────────────────────────────────────
renderAll();
