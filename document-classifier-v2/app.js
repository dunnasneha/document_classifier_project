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

// ── Classify — calls LOCAL PROXY (/api/classify) not Anthropic directly ─────
async function classifyDoc() {
  const text = document.getElementById('classify-text').value.trim();
  if (!text) { showToast('Paste a document to classify.', 'warn'); return; }
  if (!state.examples.length) { showToast('Add training examples first.', 'warn'); return; }
  if (!state.labels.length) { showToast('Add labels first.', 'warn'); return; }

  const btn = document.getElementById('classify-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Classifying…';
  document.getElementById('classify-result').innerHTML = `
    <div class="result-placeholder">
      <div class="placeholder-icon" style="animation:spin 1.5s linear infinite">⬡</div>
      <p>Analyzing document…</p>
    </div>`;

  const trainingBlock = state.examples
    .map(e => `Label: ${e.label}\nText: ${e.text}`)
    .join('\n\n---\n\n');

  const scoreTemplate = state.labels.map(l => `"${l}": 0.0`).join(', ');

  const prompt = `You are a document classifier. Study the training examples below, then classify the target document.

## Training Examples
${trainingBlock}

## Available Labels
${state.labels.join(', ')}

## Document to Classify
${text}

## Instructions
Respond ONLY with a valid JSON object. No markdown, no explanation outside the JSON.
{
  "label": "<the single best matching label>",
  "confidence": <float 0.0-1.0>,
  "reasoning": "<1-2 sentence explanation>",
  "scores": { ${scoreTemplate} }
}

Scores must sum to 1.0. Confidence must equal the top label's score.`;

  try {
    // Calls the local Express proxy — no CORS issues
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || `HTTP ${res.status}`);
    }

    const raw = data.content?.find(b => b.type === 'text')?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    state.classified++;
    renderClassifyResult(result);
    showToast('Classified successfully', 'ok');
  } catch (err) {
    document.getElementById('classify-result').innerHTML = `
      <div style="padding:1.5rem;text-align:center;">
        <p style="color:var(--red);font-size:14px;margin-bottom:8px;">Classification failed</p>
        <p style="color:var(--text3);font-size:13px;">${escHtml(err.message)}</p>
      </div>`;
    showToast('Error: ' + err.message, 'err');
  }

  btn.disabled = false;
  btn.innerHTML = 'Classify document →';
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
