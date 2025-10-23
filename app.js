// app.js v34 — タブ切替の確実化（[data-tab]限定・ハッシュ連動）

let DATA = {};
let CURRENT_CANCER_ID = null;
let __TRIALS_CACHE = [];

/* ========== タブ切替：初期化 ========== */
function initTabRouting() {
  function applyTab(tab) {
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    document.getElementById(tab)?.classList.add('active');
    document.querySelectorAll('.tab-btn, [data-tab]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));
    if (tab === 'community' && CURRENT_CANCER_ID) prepareTrialsBox();
  }
  function switchTab(tab) {
    if (!tab) return;
    applyTab(tab);
    const wantHash = '#' + tab;
    if (location.hash !== wantHash) {
      // 履歴を汚さない
      history.replaceState(null, '', wantHash);
    }
  }
  // グローバルからも呼べるように
  window.switchTab = switchTab;

  // 初期表示（ハッシュ優先）
  const initial = (location.hash || '#home').replace('#', '');
  switchTab(initial || 'home');

  // クリック委譲：data-tab を持つ要素のみに限定
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]'); // ← .tab-btn ではなく data-tab だけ対象
    if (!t) return;
    const tab = t.getAttribute('data-tab');
    if (!tab) return;
    e.preventDefault();
    switchTab(tab);
  });

  // ハッシュ遷移でも反映
  window.addEventListener('hashchange', () => {
    const tab = (location.hash || '#home').slice(1) || 'home';
    switchTab(tab);
  });
}

/* ========== データ読み込み ========== */
async function loadData() {
  try {
    const res = await fetch('./data.json?v=34', { cache: 'no-store' });
    DATA = await res.json();
  } catch (e) {
    console.warn('[loadData] fallback mode', e);
    DATA = {};
  }
  renderCancerList();
  renderHistoList();
  renderTreatmentLinks();
  renderLifeTips();
}

/* ========== 起動 ========== */
document.addEventListener('DOMContentLoaded', () => {
  initTabRouting();
  loadData();
});

/* ========== 各リスト描画 ========== */
function renderCancerList() {
  const ul = document.getElementById('cancer-list');
  if (!ul) return;
  ul.innerHTML = (DATA.cancers || []).map(c => `
    <li>
      <button type="button" class="linklike"
        onclick="switchTab('community'); renderCommunityContent('${c.id}')">
        ${c.name}
      </button>
    </li>
  `).join('');
}

function renderHistoList() {
  const ul = document.getElementById('histo-list');
  if (!ul) return;
  ul.innerHTML = (DATA.histologies || []).map(h => `
    <li>
      <button type="button" class="linklike"
        onclick="window.HISTO_CONTEXT='${h.id}'; switchTab('community');">
        ${h.name}
      </button>
    </li>
  `).join('');
}

function renderTreatmentLinks() {
  const ul = document.getElementById('treatment-links');
  if (!ul) return;
  ul.innerHTML = (DATA.treatments || []).map(t => `
    <li><a href="${t.url}" target="_blank" rel="noopener">${t.title}</a>
      <span class="meta">${t.source || ''}</span></li>
  `).join('');
}

function renderLifeTips() {
  const ul = document.getElementById('life-tips');
  if (!ul) return;
  ul.innerHTML = (DATA.life || []).map(t => `
    <li><strong>${t.title}</strong><div class="meta">${t.body || ''}</div></li>
  `).join('');
}

/* ========== コミュニティ表示（メイン） ========== */
async function renderCommunityContent(cancerId) {
  const wrap = document.getElementById('community-content');
  if (!wrap) return;
  CURRENT_CANCER_ID = cancerId;

  const cancer = (DATA.cancers || []).find(c => c.id === cancerId);
  if (!cancer) {
    wrap.innerHTML = '<p class="meta">該当データが見つかりません。</p>';
    return;
  }

  const topics = (cancer.topics || []).map((t, i) => `
    <li class="topic-item" data-index="${i}">
      <button class="topic-toggle" type="button"><strong>${t.title}</strong></button>
      <div class="topic-body" style="display:none">${t.desc || ''}</div>
    </li>`).join('') || '<li>トピックなし</li>';

  const links = (cancer.links || []).map(l => `
    <li><a href="${l.url}" target="_blank" rel="noopener">${l.title}</a></li>
  `).join('') || '<li>リンクなし</li>';

  const aliases = (cancer.aliases || []).join('・') || '';
  const histoCtx = window.HISTO_CONTEXT || null;

  wrap.innerHTML = `
    <div class="card">
      <h3>${cancer.name} <span class="badge">${cancer.icd || ''}</span></h3>
      ${aliases ? `<div class="meta">${aliases}</div>` : ''}
    </div>
    <div class="card">
      <h3>話題・トピック</h3>
      <ul id="community-topics" class="list small">${topics}</ul>
    </div>
    <div class="card">
      <h3>関連リンク</h3>
      <ul class="list small">${links}</ul>
    </div>
    ${renderKnowledgeCardsHTML({ cancerId, histologyId: histoCtx })}
    <div class="card">
      <h3>最新の治験・研究</h3>
      <div id="trials"></div>
    </div>
  `;

  const list = document.getElementById('community-topics');
  if (list) {
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('.topic-toggle'); if (!btn) return;
      const body = btn.parentElement.querySelector('.topic-body');
      if (!body) return;
      body.style.display = body.style.display === 'none' ? 'block' : 'none';
    }, { once: true });
  }

  // 右カラム等の連動（必要なら定義）
  try { filterTreatments(cancerId); } catch {}
  try { filterLife(cancerId); } catch {}

  // Trials
  prepareTrialsBox();
  try {
    await loadTrials(cancerId, { histologyId: histoCtx });
    window.HISTO_CONTEXT = null;
  } catch (e) {
    renderTrialsFallback(document.getElementById('trials'), { cancerId, histologyId: histoCtx });
  }
}

/* ========== Trial Box scaffold ========== */
function prepareTrialsBox() {
  const box = document.getElementById('trials');
  if (!box) return null;
  box.innerHTML = `<div id="trials-list-host"><div class="meta">読み込み中…</div></div>`;
  return box.querySelector('#trials-list-host');
}

/* ========== Trials（CT.gov 失敗時フォールバック表示） ========== */
async function loadTrials(cancerId, { histologyId = null } = {}) {
  const box = document.getElementById('trials');
  if (!box) return;
  const host = prepareTrialsBox();
  host.innerHTML = '<div class="meta">読み込み中…</div>';
  try {
    const trials = await fetchTrials({ cancerId, histologyId });
    __TRIALS_CACHE = trials.slice();
    if (!trials.length) {
      renderTrialsFallback(box, { cancerId, histologyId });
      return;
    }
    renderTrialsList(host, trials);
  } catch (e) {
    console.error('trials error', e);
    renderTrialsFallback(box, { cancerId, histologyId });
  }
}

// 実API呼び出しは省略（CORS/JSONP制約のためダミー）
async function fetchTrials() { return []; }
function renderTrialsList(host, trials) {
  host.innerHTML = '<div class="meta">候補を表示できませんでした。</div>';
}

function renderTrialsFallback(box, { cancerId = null, histologyId = null } = {}) {
  const q = guessEnglishQuery({ cancerId, histologyId });
  box.innerHTML = `
    <div class="meta">ClinicalTrials.gov のAPI取得に失敗/0件のため、検索リンクを表示します。</div>
    <ul class="list small">
      <li><a target="_blank" rel="noopener" href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}&filter=datesearch.y_3&filter=pubt.clinicaltrial">PubMed（直近3年の臨床試験）</a></li>
      <li><a target="_blank" rel="noopener" href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}">PubMed 全体検索</a></li>
      <li><a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${encodeURIComponent(q)}">ClinicalTrials.gov</a></li>
    </ul>
  `;
}

/* ========== 根拠リンク（自動生成） ========== */
const KB = {
  ncc: "https://ganjoho.jp/public/cancer/head_neck/",
  nci_patient: "https://www.cancer.gov/types/head-and-neck/patient",
  nci_hcp: "https://www.cancer.gov/types/head-and-neck/hp",
  nice: (q) => `https://www.nice.org.uk/search?q=${encodeURIComponent(q)}`,
  esmo: (q) => `https://www.esmo.org/search?query=${encodeURIComponent(q)}`,
  cruk: (q) => `https://www.cancerresearchuk.org/about-cancer/search?search=${encodeURIComponent(q)}`,
  asco: (q) => `https://www.cancer.net/search?search=${encodeURIComponent(q)}`,
  pubmed: (q) => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`
};

function guessEnglishQuery({ cancerId = null, histologyId = null }) {
  const C = {
    oral: "oral cavity cancer",
    oropharynx: "oropharyngeal cancer",
    hypopharynx: "hypopharyngeal cancer",
    nasopharynx: "nasopharyngeal carcinoma",
    larynx: "laryngeal cancer",
    nasal: "paranasal sinus cancer",
    salivary: "salivary gland cancer"
  };
  const H = {
    "adenoid-cystic": "adenoid cystic carcinoma",
    "mucoepidermoid": "mucoepidermoid carcinoma",
    "mucosal-melanoma": "mucosal melanoma",
    "lymphoma": "head and neck lymphoma",
    "sarcoma": "head and neck sarcoma"
  };
  if (histologyId && cancerId) return `${H[histologyId] || histologyId} ${C[cancerId] || cancerId}`;
  return H[histologyId] || C[cancerId] || "head and neck cancer";
}

function renderKnowledgeCardsHTML({ cancerId = null, histologyId = null }) {
  const q = guessEnglishQuery({ cancerId, histologyId });
  return `
    <div class="card">
      <h3>根拠とガイドライン</h3>
      <ul class="list small">
        <li><a target="_blank" rel="noopener" href="${KB.ncc}">がん情報サービス（頭頸部）</a></li>
        <li><a target="_blank" rel="noopener" href="${KB.nci_patient}">NCI PDQ（患者向け）</a></li>
        <li><a target="_blank" rel="noopener" href="${KB.nci_hcp}">NCI PDQ（医療者向け）</a></li>
        <li><a target="_blank" rel="noopener" href="${KB.nice(q)}">NICE（英国）</a></li>
        <li><a target="_blank" rel="noopener" href="${KB.esmo(q)}">ESMO</a></li>
        <li><a target="_blank" rel="noopener" href="${KB.cruk(q)}">Cancer Research UK</a></li>
        <li><a target="_blank" rel="noopener" href="${KB.asco(q)}">ASCO Cancer.Net</a></li>
      </ul>
    </div>
    <div class="card">
      <h3>最新研究を探す（自動クエリ）</h3>
      <ul class="list small">
        <li><a target="_blank" rel="noopener" href="${KB.pubmed(q)}">PubMed 検索</a></li>
        <li><a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${encodeURIComponent(q)}">ClinicalTrials.gov</a></li>
      </ul>
    </div>
  `;
}

/* ========== プレースホルダ（存在しない場合に備える） ========== */
function filterTreatments() {}
function filterLife() {}
