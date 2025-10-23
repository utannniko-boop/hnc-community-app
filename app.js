/* =========================================================
   HNC Community PWA - app.js（全置換）
   - 部位検索＋組織型検索（histology）
   - 組織型/部位から ClinicalTrials.gov を連動表示
   - 狭い検索に加えて「1段広い分類」の治験も自動統合表示
   - 介入名(薬剤)・主担当機関も表示
   - 失敗/0件時は JP/EN の補助検索リンク（狭い/広い両方）
   - TRIAL_QUERY の重複定義をガード
   - resources.json が無くても FALLBACK で動く（cache-bust付）
   ========================================================= */

/* =================== グローバル状態 =================== */
// 失敗時に必ず表示できる最小データ（保険）
const DATA_FALLBACK = {
  cancers: [
    { id:"oral",        name:"口腔がん（舌・口底など）", aliases:["口腔癌","舌がん","舌癌","歯肉がん","口底がん","oral cancer","C00","C01","C02","C03","C04","C05","C06"], icd:"C00-C06",
      topics:[{title:"術後の発音・嚥下リハ",desc:"STと進めるホームエクササイズ"}],
      links:[{title:"がん情報サービス（頭頸部）",url:"https://ganjoho.jp/public/cancer/head_neck/"}]
    },
    { id:"oropharynx",  name:"中咽頭がん", aliases:["中咽頭癌","HPV関連がん","oropharyngeal cancer","C10"], icd:"C10" },
    { id:"hypopharynx", name:"下咽頭がん", aliases:["下咽頭癌","hypopharyngeal cancer","C13"], icd:"C13" },
    { id:"nasopharynx", name:"上咽頭がん", aliases:["上咽頭癌","NPC","nasopharyngeal carcinoma","C11"], icd:"C11" },
    { id:"larynx",      name:"喉頭がん", aliases:["喉頭癌","laryngeal cancer","C32"], icd:"C32",
      topics:[{title:"発声代替",desc:"電気式人工喉頭・食道発声・シャント"}]
    },
    { id:"nasal",       name:"鼻腔がん", aliases:["鼻腔癌","副鼻腔がん","鼻副鼻腔がん","nasal cancer","paranasal sinus cancer","C30","C31"], icd:"C30-C31" },
    { id:"salivary",    name:"唾液腺がん", aliases:["唾液腺癌","耳下腺がん","耳下腺癌","顎下腺がん","舌下腺がん","parotid","salivary gland cancer","parotid cancer","C07","C08"], icd:"C07-C08" }
  ],
  treatments: [
    {title:"がん情報サービス（頭頸部）", url:"https://ganjoho.jp/public/cancer/head_neck/", source:"国立がん研究センター",
     cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]}
  ],
  life: [
    {id:"oral-care",title:"放射線治療中の口腔ケア",category:"口腔ケア",body:"軟らかい歯ブラシ・フッ化物含嗽・無アルコールの洗口液。",cancerIds:["oral","oropharynx","nasopharynx","larynx","nasal","salivary"]}
  ],
  // ▼ 組織型（histology）FALLBACK
  histologies: [
    {
      id:"adenoid-cystic",
      name:"腺様嚢胞癌（Adenoid cystic carcinoma）",
      aliases:["腺様嚢胞癌","腺様のう胞がん","adenoid cystic carcinoma","Adenoid-cystic carcinoma","ACC"],
      siteIds:["salivary","nasal","oral"]
    },
    {
      id:"mucoepidermoid",
      name:"粘表皮癌（Mucoepidermoid carcinoma）",
      aliases:["粘表皮癌","粘表皮がん","mucoepidermoid carcinoma","MEC"],
      siteIds:["salivary","nasal","oral","oropharynx"]
    },
    {
      id:"mucosal-melanoma",
      name:"悪性黒色腫（粘膜）",
      aliases:["悪性黒色腫","メラノーマ","melanoma","mucosal melanoma","mucosal malignant melanoma"],
      siteIds:["nasal","oral","oropharynx"]
    },
    {
      id:"lymphoma",
      name:"リンパ腫",
      aliases:["リンパ腫","悪性リンパ腫","lymphoma"],
      siteIds:["oropharynx","nasopharynx"]
    },
    {
      id:"sarcoma",
      name:"肉腫",
      aliases:["肉腫","sarcoma","横紋筋肉腫","骨肉腫","線維肉腫"],
      siteIds:["oral","nasal","oropharynx"]
    }
  ]
};

let DATA = { cancers: [], treatments: [], life: [], histologies: [] };

// 組織型→治験の一時文脈（ボタンで渡す）
window.HISTO_CONTEXT = null;

/* =================== 起動 =================== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

async function boot(){
  await loadData();     // データ取得（失敗時は FALLBACK）
  initAll();            // 各UI初期化
  window.addEventListener('hashchange', () => {
    if (location.hash === '#community') ensureCommunityReady();
  });
}

/* =================== データ読み込み =================== */
async function loadData(){
  let ok = false;
  try{
    // cache-bust
    const res = await fetch('./resources.json?v=3', { cache: 'no-store' });
    if(res.ok){
      const json = await res.json();
      if (json && Array.isArray(json.cancers) && json.cancers.length){
        DATA = { ...json };
        if (!Array.isArray(DATA.histologies)) {
          DATA.histologies = DATA_FALLBACK.histologies;
        }
        ok = true;
      }
    }
  }catch(e){
    console.warn('[loadData] fetch error', e);
  }
  if(!ok){
    console.warn('[loadData] using FALLBACK data');
    DATA = { ...DATA_FALLBACK };
  }
}

/* =================== 初期化まとめ =================== */
function initAll(){
  try { initTabs(); } catch(e){ console.warn('initTabs err', e); }
  try { initHome(); } catch(e){ console.warn('initHome err', e); }
  try { initHistology(); } catch(e){ console.warn('initHistology err', e); }
  try { initCommunity(); } catch(e){ console.warn('initCommunity err', e); }
  try { initTreatments(); } catch(e){ console.warn('initTreatments err', e); }
  try { initLife(); } catch(e){ console.warn('initLife err', e); }
  try { renderBookmarks(); } catch(e){}
  ensureCommunityReady();
}

/* =================== タブ切り替え =================== */
function initTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.dataset.tab;
      switchTab(tab);
    });
  });
}
function switchTab(tab){
  document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(tab);
  if(target) target.classList.add('active');
  if (tab === 'community') ensureCommunityReady();
}

/* =================== ホーム（部位検索） =================== */
function initHome(){
  const list = document.getElementById('cancer-list');
  const input = document.getElementById('cancer-search');
  if(!list || !input) return;

  // 表記ゆれ吸収
  const norm = (s) => (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[ \u3000]/g, '')
    .replace(/癌腫/g, 'がんしゅ')
    .replace(/癌/g, 'がん')
    .replace(/ガン/g, 'がん');

  function render(filterText=''){
    const f = norm(filterText);
    list.innerHTML = '';

    const arr = Array.isArray(DATA?.cancers) ? DATA.cancers : [];
    if (arr.length === 0) {
      list.innerHTML = '<li>データが読み込めていません。FALLBACKに切り替わっていない場合はキャッシュを確認してください。</li>';
      return;
    }

    const items = arr.filter(c => {
      if (!f) return true;
      const fields = [c.name, ...(c.aliases||[]), c.icd||''].map(norm).join('||');
      return fields.includes(f);
    });

    if (items.length === 0) {
      list.innerHTML = '<li>該当が見つかりません。別表記（例：喉頭がん/喉頭癌/C32）でも試してください。</li>';
      return;
    }

    items.forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${c.name}</strong> <span class="badge">${c.icd || ''}</span>
        <div class="meta">${(c.aliases || []).join('・')}</div>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
          <a href="#" data-jump="community" data-cancer="${c.id}">コミュニティ</a>
          <a href="#" data-jump="treatments" data-cancer="${c.id}">治療情報</a>
          <a href="#" data-jump="life" data-cancer="${c.id}">生活の工夫</a>
        </div>`;
      list.appendChild(li);
    });
  }

  input.addEventListener('input', e => render(e.target.value));
  input.addEventListener('compositionend', e => render(e.target.value));
  render('');

  list.addEventListener('click', e => {
    const a = e.target.closest('a[data-jump]'); if(!a) return;
    e.preventDefault();
    const tab = a.dataset.jump; const id = a.dataset.cancer;
    switchTab(tab);
    if (tab === 'community') selectCancer(id);
    if (tab === 'treatments') filterTreatments(id);
    if (tab === 'life') filterLife(id);
  });
}

/* =================== ホーム（組織型検索） =================== */
function initHistology(){
  const list = document.getElementById('histo-list');
  const input = document.getElementById('histo-search');
  if(!list || !input) return;

  const norm = (s) => (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[ \u3000]/g, '')
    .replace(/癌腫/g, 'がんしゅ')
    .replace(/癌/g, 'がん')
    .replace(/ガン/g, 'がん');

  function render(filterText=''){
    const f = norm(filterText);
    list.innerHTML = '';

    const arr = Array.isArray(DATA?.histologies) ? DATA.histologies
              : (Array.isArray(DATA_FALLBACK?.histologies) ? DATA_FALLBACK.histologies : []);
    if (arr.length === 0){
      list.innerHTML = '<li>組織型データがありません。</li>';
      return;
    }

    const items = arr.filter(h => {
      if (!f) return true;
      const fields = [h.name, ...(h.aliases||[])].map(norm).join('||');
      return fields.includes(f);
    });

    if (items.length === 0){
      list.innerHTML = '<li>該当する組織型が見つかりません。別表記でもお試しください。</li>';
      return;
    }

    items.forEach(h => {
      const siteButtons = (h.siteIds || []).map(id => {
        const site = (DATA.cancers || []).find(c => c.id === id) || (DATA_FALLBACK.cancers || []).find(c => c.id === id);
        if (!site) return '';
        return `<button class="tab-btn linklike" data-jump="community" data-cancer="${site.id}" data-histology="${h.id}">${site.name}</button>`;
      }).join(' ');

      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${h.name}</strong>
        <div class="meta">${(h.aliases||[]).join('・')}</div>
        ${siteButtons ? `<div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">${siteButtons}</div>` : ''}
      `;
      list.appendChild(li);
    });
  }

  input.addEventListener('input', e => render(e.target.value));
  input.addEventListener('compositionend', e => render(e.target.value));
  render('');

  list.addEventListener('click', e => {
    const b = e.target.closest('button[data-jump][data-cancer]');
    if(!b) return;
    e.preventDefault();
    window.HISTO_CONTEXT = b.dataset.histology || null;
    switchTab(b.dataset.jump);
    selectCancer(b.dataset.cancer);
  });
}

/* =================== コミュニティ（種類別） =================== */
function initCommunity(){
  const sel = document.getElementById('community-select');
  const wrap = document.getElementById('community-content');
  if(!sel || !wrap) return;

  if (sel.options && sel.options.length > 1) return;

  const arr = Array.isArray(DATA?.cancers) ? DATA.cancers : [];
  sel.innerHTML = '';
  sel.insertAdjacentHTML('beforeend', `<option value="" disabled selected>がんの種類を選んでください</option>`);
  arr.forEach(c => {
    sel.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.name}</option>`);
  });

  if (!sel.__hnc_bound__) {
    sel.addEventListener('change', (e) => {
      const id = e.target.value;
      if(!id) return;
      renderCommunityContent(id);
    });
    sel.__hnc_bound__ = true;
  }
}
function ensureCommunityReady(){
  const sel = document.getElementById('community-select');
  if(!sel) return;
  const empty = !sel.options || sel.options.length <= 1;
  if (empty) initCommunity();
}
function selectCancer(id){
  const sel = document.getElementById('community-select');
  if(!sel) return;
  sel.value = id;
  sel.dispatchEvent(new Event('change'));
}

async function renderCommunityContent(cancerId){
  const wrap = document.getElementById('community-content');
  if(!wrap) return;

  const arr = Array.isArray(DATA?.cancers) ? DATA.cancers : [];
  const cancer = arr.find(c => c.id === cancerId);
  if(!cancer){
    wrap.innerHTML = '<p class="meta">該当のがん種が見つかりませんでした。</p>';
    return;
  }

  const topicsHTML = (cancer.topics||[]).map((t, i) => `
    <li class="topic-item" data-index="${i}">
      <button class="topic-toggle" type="button">
        <strong>${t.title}</strong>
        ${t.url ? '<span class="meta">（クリックで外部サイト）</span>' : ''}
      </button>
      <div class="topic-body" style="display:none;margin-top:6px;">
        ${t.desc ? `<div class="meta">${t.desc}</div>` : ''}
        ${t.url ? `<div style="margin-top:6px;"><a class="linklike" href="${t.url}" target="_blank" rel="noopener">リンクを開く</a></div>` : ''}
      </div>
    </li>
  `).join('') || '<li>トピックは準備中です。</li>';

  const linksHTML = (cancer.links||[]).map(l => `
    <li><a href="${l.url}" target="_blank" rel="noopener">${l.title||l.url}</a></li>
  `).join('') || '<li>関連リンクは準備中です。</li>';

  const aliases = (cancer.aliases||[]).join('・');

  wrap.innerHTML = `
    <div class="card">
      <h3>${cancer.name} <span class="badge">${cancer.icd||''}</span></h3>
      ${aliases ? `<div class="meta">別名：${aliases}</div>` : ''}
    </div>
    <div class="card">
      <h3>話題・トピック</h3>
      <ul id="community-topics" class="list small">${topicsHTML}</ul>
    </div>
    <div class="card">
      <h3>関連リンク</h3>
      <ul class="list small">${linksHTML}</ul>
    </div>
  `;

  const topicsList = document.getElementById('community-topics');
  if (topicsList) {
    topicsList.addEventListener('click', (e) => {
      const btn = e.target.closest('.topic-toggle');
      if (!btn) return;
      const li = btn.closest('.topic-item');
      const idx = Number(li?.dataset.index ?? -1);
      const topic = (cancer.topics || [])[idx];
      if (topic?.url) {
        window.open(topic.url, '_blank', 'noopener'); return;
      }
      const body = li.querySelector('.topic-body');
      if (!body) return;
      const visible = body.style.display !== 'none';
      body.style.display = visible ? 'none' : 'block';
    });
  }

  try { filterTreatments(cancerId); } catch(e){}
  try { filterLife(cancerId); } catch(e){}

  try {
    const histo = window.HISTO_CONTEXT || null;
    await loadTrials(cancerId, { histologyId: histo });
    window.HISTO_CONTEXT = null;
  } catch(e) {}

  try { loadPosts(cancerId); } catch(e){}
}

/* =================== 治療リンク =================== */
function initTreatments(){ renderTreatmentsList(); }
function renderTreatmentsList(filterId){
  const ul = document.getElementById('treatment-links');
  if(!ul) return;
  ul.innerHTML = '';

  const arr = Array.isArray(DATA?.treatments) ? DATA.treatments : [];
  const items = arr.filter(t => !filterId ? true : (Array.isArray(t.cancerIds) ? t.cancerIds.includes(filterId) : true));

  if(items.length === 0){ ul.innerHTML = '<li>該当のリンクは見つかりませんでした。</li>'; return; }

  items.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${t.url}" target="_blank" rel="noopener">${t.title}</a> <span class="meta">— ${t.source||''}</span>`;
    ul.appendChild(li);
  });
}
function filterTreatments(id){ renderTreatmentsList(id); }

/* =================== 生活の工夫 =================== */
function initLife(){ renderLifeList(); }
function renderLifeList(filterId){
  const ul = document.getElementById('life-tips');
  if(!ul) return;
  ul.innerHTML = '';

  const arr = Array.isArray(DATA?.life) ? DATA.life : [];
  const items = arr.filter(x => !filterId ? true : (Array.isArray(x.cancerIds) ? x.cancerIds.includes(filterId) : true));

  if(items.length === 0){ ul.innerHTML = '<li>該当のヒントは見つかりませんでした。</li>'; return; }

  items.forEach(x => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${x.title}</strong><div class="meta">${x.category||''}</div><div>${x.body||''}</div>`;
    ul.appendChild(li);
  });
}
function filterLife(id){ renderLifeList(id); }

/* =================== ブックマーク（ダミー） =================== */
function renderBookmarks(){
  const ul = document.getElementById('bookmarks');
  if(!ul) return;
  ul.innerHTML = '<li class="meta">ブックマークは準備中です。</li>';
}
/* ========== ClinicalTrials.gov 連携（高精度・英語同義語拡張・UIフィルタ付き） ========== */

// ---------- 英語シノニム（検索拡張） ----------
const EN_SYNONYMS = {
  // 部位
  oral: [
    'oral cavity cancer','tongue cancer','floor of mouth cancer','buccal mucosa cancer','gingival cancer'
  ],
  oropharynx: [
    'oropharyngeal cancer','tonsil cancer','base of tongue cancer'
  ],
  hypopharynx: [
    'hypopharyngeal cancer','pyriform sinus','postcricoid'
  ],
  nasopharynx: [
    'nasopharyngeal carcinoma','NPC'
  ],
  larynx: [
    'laryngeal cancer','glottic','supraglottic','subglottic'
  ],
  nasal: [
    'nasal cavity cancer','paranasal sinus cancer','maxillary sinus cancer','ethmoid sinus cancer'
  ],
  salivary: [
    'salivary gland cancer','parotid gland cancer','submandibular gland cancer','sublingual gland cancer'
  ],
  // 組織型
  'adenoid-cystic': [
    'adenoid cystic carcinoma','ACC'
  ],
  'mucoepidermoid': [
    'mucoepidermoid carcinoma','MEC'
  ],
  'mucosal-melanoma': [
    'mucosal melanoma','malignant melanoma of mucosa'
  ],
  lymphoma: [
    'head and neck lymphoma','extranodal lymphoma'
  ],
  sarcoma: [
    'head and neck sarcoma','rhabdomyosarcoma','fibrosarcoma','osteosarcoma'
  ]
};

// ---------- 既存の狭い式（後方互換） ----------
if (!window.TRIAL_QUERY) {
  window.TRIAL_QUERY = {
    oral: 'oral+OR+"tongue+cancer"+OR+"floor+of+mouth"',
    oropharynx: 'oropharyngeal+OR+"base+of+tongue"+OR+tonsil',
    hypopharynx: 'hypopharyngeal+OR+postcricoid+OR+"pyriform+sinus"',
    nasopharynx: 'nasopharyngeal+OR+NPC',
    larynx: 'laryngeal+OR+glottic+OR+supraglottic+OR+subglottic',
    nasal: '"nasal+cavity"+OR+"paranasal+sinus"+OR+"maxillary+sinus"',
    salivary: '"salivary+gland"+OR+parotid+OR+submandibular+OR+sublingual',
    _default: '"Head+and+Neck+Cancer"'
  };
}
if (!window.TRIAL_QUERY_HISTO) {
  window.TRIAL_QUERY_HISTO = {
    'adenoid-cystic'  : '"adenoid+cystic+carcinoma"',
    'mucoepidermoid'  : '"mucoepidermoid+carcinoma"',
    'mucosal-melanoma': '"mucosal+melanoma"+OR+"malignant+melanoma+of+mucosa"',
    'lymphoma'        : '"head+and+neck"+lymphoma',
    'sarcoma'         : '"head+and+neck"+sarcoma'
  };
}

// ---------- 広げる式（1段上の抽象カテゴリも拾う） ----------
const BROADEN_SITE_EXPR = {
  salivary: '"salivary+gland+carcinoma"+OR+"salivary+gland+cancer"+OR+parotid+OR+submandibular+OR+sublingual'
};
const BROADEN_HISTO_EXPR = {
  'adenoid-cystic'  : '"adenoid+cystic+carcinoma"+AND+("salivary+gland"+OR+parotid+OR+submandibular+OR+sublingual)',
  'mucoepidermoid'  : '"mucoepidermoid+carcinoma"+AND+("salivary+gland"+OR+parotid+OR+submandibular+OR+sublingual)',
  'mucosal-melanoma': '"mucosal+melanoma"+AND+("head+and+neck"+OR+oral+OR+nasal+OR+oropharynx)'
};

// ---------- クエリ式の候補を作成（狭い → 同義語 → 広い → デフォルト） ----------
function buildTrialsExprList({ cancerId=null, histologyId=null } = {}){
  const CQ = window.TRIAL_QUERY || {};
  const HQ = window.TRIAL_QUERY_HISTO || {};
  const exprs = new Set();

  // 1) 組織型・部位の狭い式
  if (histologyId && HQ[histologyId]) exprs.add(HQ[histologyId]);
  if (cancerId && CQ[cancerId])       exprs.add(CQ[cancerId]);

  // 2) 英語シノニム（同義語）— OR で束ねた式を追加
  const syns = [];
  if (histologyId && EN_SYNONYMS[histologyId]) syns.push(...EN_SYNONYMS[histologyId]);
  if (cancerId   && EN_SYNONYMS[cancerId])     syns.push(...EN_SYNONYMS[cancerId]);
  if (syns.length){
    const orExpr = syns
      .map(s => `"${encodeURIComponent(String(s).replace(/\s+/g,'+'))}"`)
      .join('+OR+');
    exprs.add(orExpr);
  }

  // 3) 一段広い式
  if (histologyId && BROADEN_HISTO_EXPR[histologyId]) exprs.add(BROADEN_HISTO_EXPR[histologyId]);
  if (cancerId && BROADEN_SITE_EXPR[cancerId])        exprs.add(BROADEN_SITE_EXPR[cancerId]);

  // 4) デフォルト
  exprs.add(CQ._default || '"Head+and+Neck+Cancer"');

  return Array.from(exprs);
}

// ---------- StudyFields API（複数式を叩いて統合） ----------
async function fetchTrials(params = {}){
  const exprList = buildTrialsExprList(params);
  const fields = [
    'NCTId','BriefTitle','Condition','OverallStatus','StudyType','Phase',
    'InterventionType','InterventionName','LeadSponsorName',
    'LocationCountry','LocationCity','LocationState','StartDate','PrimaryCompletionDate',
    'LastUpdatePostDate'
  ].join(',');

  const maxPerQuery = 12;
  const all = [];
  for (const expr of exprList){
    const url = `https://clinicaltrials.gov/api/query/study_fields?expr=${expr}&fields=${fields}&min_rnk=1&max_rnk=${maxPerQuery}&fmt=json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`trials fetch failed: ${res.status}`);
    const json = await res.json();
    const rows = json?.StudyFieldsResponse?.StudyFields || [];
    rows.forEach(r => {
      all.push({
        id: r.NCTId?.[0],
        title: r.BriefTitle?.[0],
        cond: (r.Condition||[]).join(', '),
        status: r.OverallStatus?.[0],
        studyType: r.StudyType?.[0],
        phase: r.Phase?.[0],
        interventions: (r.InterventionName||[]).filter(Boolean),
        interventionTypes: (r.InterventionType||[]).filter(Boolean),
        sponsor: r.LeadSponsorName?.[0] || '',
        countries: (r.LocationCountry||[]).filter(Boolean),
        city: r.LocationCity?.[0] || '',
        state: r.LocationState?.[0] || '',
        start: r.StartDate?.[0] || '',
        primaryComplete: r.PrimaryCompletionDate?.[0] || '',
        updated: r.LastUpdatePostDate?.[0] || ''
      });
    });
  }

  // NCT ID でユニーク化
  const seen = new Set();
  const uniq = [];
  for (const t of all){
    if (!t.id || seen.has(t.id)) continue;
    seen.add(t.id);
    uniq.push(t);
  }

  // スコアリング（募集中>英語結果含む>薬剤>日本>Phase 2/3/4>更新が新しい）で並べ替え
  const score = (t) => {
    let s = 0;
    if (/Recruiting|Enrolling|Not\s+yet\s+recruiting/i.test(t.status||'')) s += 50;
    if ((t.interventionTypes||[]).some(x => /Drug|Biological|Device|Combination Product/i.test(x))) s += 20;
    if ((t.interventions||[]).length) s += 10;
    if ((t.countries||[]).some(c => /Japan/i.test(c))) s += 15;           // JP優先
    if (/Phase\s*(2|3|4)/i.test(t.phase||'')) s += 10;
    const d = Date.parse(t.updated||t.start||'') || 0;
    s += Math.min(20, Math.floor((d - 1700000000000)/(1000*60*60*24*30))); // ざっくり新しさボーナス
    return s;
  };
  uniq.sort((a,b) => score(b) - score(a));

  return uniq.slice(0, 24);
}

// ---------- UIフィルタ ----------
window.TRIAL_FILTERS = {
  recruitingOnly: true,
  drugOnly: true,
  japanFirst: true,
  phaseMin: 'Any' // 'Any' | '1' | '2' | '3' | '4'
};

function renderTrialsControls(box){
  if (!box) return;
  const c = document.createElement('div');
  c.id = 'trials-controls';
  c.className = 'meta';
  c.style.margin = '8px 0 12px';
  c.innerHTML = `
    <label style="margin-right:12px;"><input type="checkbox" id="flt-recruit" ${window.TRIAL_FILTERS.recruitingOnly?'checked':''}/> 募集中のみ</label>
    <label style="margin-right:12px;"><input type="checkbox" id="flt-drug" ${window.TRIAL_FILTERS.drugOnly?'checked':''}/> 薬剤など介入あり</label>
    <label style="margin-right:12px;"><input type="checkbox" id="flt-jp" ${window.TRIAL_FILTERS.japanFirst?'checked':''}/> 日本を優先</label>
    <label>フェーズ最小:
      <select id="flt-phase">
        <option value="Any">指定なし</option>
        <option value="1">Phase 1+</option>
        <option value="2" selected>Phase 2+</option>
        <option value="3">Phase 3+</option>
        <option value="4">Phase 4</option>
      </select>
    </label>
  `;
  box.appendChild(c);

  const $ = (id)=>c.querySelector(id);
  $('#flt-recruit').addEventListener('change', e => { window.TRIAL_FILTERS.recruitingOnly = e.target.checked; rerenderTrialsList(); });
  $('#flt-drug').addEventListener('change', e => { window.TRIAL_FILTERS.drugOnly = e.target.checked; rerenderTrialsList(); });
  $('#flt-jp').addEventListener('change', e => { window.TRIAL_FILTERS.japanFirst = e.target.checked; rerenderTrialsList(); });
  $('#flt-phase').addEventListener('change', e => { window.TRIAL_FILTERS.phaseMin = e.target.value; rerenderTrialsList(); });
}

function passFilters(t){
  const F = window.TRIAL_FILTERS;
  if (F.recruitingOnly && !/Recruiting|Enrolling|Not\s+yet\s+recruiting/i.test(t.status||'')) return false;
  if (F.drugOnly && !((t.interventionTypes||[]).some(x => /Drug|Biological|Device|Combination Product/i.test(x)))) return false;
  const phNum = (t.phase||'').match(/(\d)/)?.[1] || null;
  if (F.phaseMin !== 'Any' && phNum && Number(phNum) < Number(F.phaseMin)) return false;
  return true;
}

let __TRIALS_CACHE = []; // 直近取得を保持してUI再描画に使う

function rerenderTrialsList(){
  const box = document.getElementById('trials');
  if (!box) return;
  const listHost = box.querySelector('#trials-list-host');
  if (!listHost) return;
  renderTrialsList(listHost, __TRIALS_CACHE);
}

function renderTrialsList(host, trials){
  const F = window.TRIAL_FILTERS;
  const filtered = trials.filter(passFilters);

  // 日本優先の並べ替え（ONのときだけ）
  const ordered = F.japanFirst
    ? filtered.slice().sort((a,b) => {
        const aj = (a.countries||[]).some(c => /Japan/i.test(c)) ? 1 : 0;
        const bj = (b.countries||[]).some(c => /Japan/i.test(c)) ? 1 : 0;
        if (bj !== aj) return bj - aj;
        const da = Date.parse(a.updated||a.start||'') || 0;
        const db = Date.parse(b.updated||b.start||'') || 0;
        return db - da;
      })
    : filtered;

  if (!ordered.length){
    host.innerHTML = `<div class="meta">現在の条件では表示できる治験がありません。</div>`;
    return;
  }

  host.innerHTML = `
    <ul class="list small">
      ${ordered.map(t => {
        const drugBadge = (t.interventionTypes||[]).some(x => /Drug|Biological/i.test(x))
          ? `<span class="badge">Drug</span>` : '';
        const jpBadge = (t.countries||[]).some(c => /Japan/i.test(c))
          ? `<span class="badge">JP</span>` : '';
        const ph = t.phase ? `／ <span class="badge">${escapeHtml(t.phase)}</span>` : '';
        return `
        <li>
          <a href="https://clinicaltrials.gov/study/${t.id}" target="_blank" rel="noopener">
            <strong>${escapeHtml(t.title || t.id)}</strong>
          </a>
          <div class="meta">
            ID: ${t.id} ／ 状況: ${escapeHtml(t.status||'')} ${ph} ／ 更新: ${escapeHtml(t.updated||'')}
            ${drugBadge} ${jpBadge}
          </div>
          ${t.sponsor ? `<div class="meta">主担当機関: ${escapeHtml(t.sponsor)}</div>` : ''}
          ${t.interventions && t.interventions.length ? `
            <div class="meta">介入: <strong>${t.interventions.map(escapeHtml).join(' / ')}</strong></div>
          ` : ''}
          ${t.cond ? `<div class="meta">対象: ${escapeHtml(t.cond)}</div>` : ''}
        </li>`;
      }).join('')}
    </ul>
  `;
}

// ---------- 失敗/0件時：狭い・広い 両方の検索リンク ----------
function renderTrialsFallback(box, { cancerId=null, histologyId=null } = {}){
  const cancer = (Array.isArray(DATA.cancers) ? DATA.cancers : []).find(c => c.id === cancerId);
  const histo  = (Array.isArray(DATA.histologies) ? DATA.histologies : []).find(h => h.id === histologyId);

  const SITE_EN_LABELS = {
    oral:'oral cavity cancer', oropharynx:'oropharyngeal cancer', hypopharynx:'hypopharyngeal cancer',
    nasopharynx:'nasopharyngeal carcinoma', larynx:'laryngeal cancer', nasal:'nasal cavity or paranasal sinus cancer',
    salivary:'salivary gland cancer'
  };

  const narrowJP = histo?.aliases?.[0] || histo?.name || cancer?.name || '頭頸部がん';
  let narrowEN = 'head and neck cancer';
  if (histo) {
    narrowEN = (histo.aliases||[]).find(a => /[a-z]/i.test(a)) || (histo.name.match(/\((.+?)\)/)?.[1]) || narrowEN;
  } else if (cancer) {
    narrowEN = SITE_EN_LABELS[cancer.id] || narrowEN;
  }

  let broadJP = '頭頸部がん';
  let broadEN = 'head and neck cancer';
  if (histologyId === 'adenoid-cystic' || histologyId === 'mucoepidermoid' || cancerId === 'salivary') {
    broadJP = '唾液腺がん'; broadEN = 'salivary gland cancer';
  }

  const qJPa = encodeURIComponent(`${narrowJP} 治験`);
  const qENa = encodeURIComponent(`${narrowEN} clinical trial`);
  const qJPb = encodeURIComponent(`${broadJP} 治験`);
  const qENb = encodeURIComponent(`${broadEN} clinical trial`);

  box.innerHTML = `
    <div class="card">
      <h3>自動検索リンク（補助）</h3>
      <p class="meta">API取得に失敗/0件のため、狭い・広い両方の候補を提示します。</p>
      <ul class="list small">
        <li><strong>狭い：</strong> <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qJPa}">Google（日本語）</a> ／ <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qENa}">Google（英語）</a> ／ <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${qENa}">CT.gov 内検索</a></li>
        <li><strong>広い：</strong> <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qJPb}">Google（日本語）</a> ／ <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qENb}">Google（英語）</a> ／ <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${qENb}">CT.gov 内検索</a></li>
      </ul>
    </div>
  `;
}

// ---------- 描画本体 ----------
async function loadTrials(cancerId, { histologyId=null } = {}){
  const box = document.getElementById('trials');
  if (!box) return;
  box.innerHTML = '<div class="meta">読み込み中…</div>';

  // コントロールを先に設置
  box.innerHTML = '';
  renderTrialsControls(box);
  const host = document.createElement('div');
  host.id = 'trials-list-host';
  box.appendChild(host);
  host.innerHTML = '<div class="meta">読み込み中…</div>';

  try {
    const trials = await fetchTrials({ cancerId, histologyId });
    __TRIALS_CACHE = trials.slice(); // 保持
    if (!trials.length){
      renderTrialsFallback(box, { cancerId, histologyId });
      return;
    }
    renderTrialsList(host, trials);
  } catch (e){
    console.error('trials error', e);
    renderTrialsFallback(box, { cancerId, histologyId });
  }
}

/* =================== 強制ポピュレーター（保険） =================== */
(function forcePopulateCommunity(){
  const FALLBACK = [
    { id:"oral",        name:"口腔がん（舌・口底など）" },
    { id:"oropharynx",  name:"中咽頭がん" },
    { id:"hypopharynx", name:"下咽頭がん" },
    { id:"nasopharynx", name:"上咽頭がん" },
    { id:"larynx",      name:"喉頭がん" },
    { id:"nasal",       name:"鼻腔がん" },
    { id:"salivary",    name:"唾液腺がん" }
  ];

  function getCancers(){
    const arr = (window.DATA && Array.isArray(DATA.cancers) && DATA.cancers.length)
      ? DATA.cancers
      : FALLBACK;
    return arr;
  }

  function populateOnce(){
    const sel = document.getElementById('community-select');
    if (!sel) return false;
    if (sel.options && sel.options.length > 1) return true;

    sel.innerHTML = '';
    sel.insertAdjacentHTML('beforeend', `<option value="" disabled selected>がんの種類を選んでください</option>`);
    getCancers().forEach(c => {
      sel.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.name}</option>`);
    });

    if (!sel.__hnc_bound_force__) {
      sel.addEventListener('change', (e) => {
        const id = e.target.value;
        if (!id) return;
        if (typeof renderCommunityContent === 'function') {
          renderCommunityContent(id);
        } else {
          const wrap = document.getElementById('community-content');
          if (!wrap) return;
          const all = getCancers();
          const hit = (window.DATA && Array.isArray(DATA.cancers))
            ? DATA.cancers.find(x => x.id === id)
            : all.find(x => x.id === id);
          wrap.innerHTML = hit
            ? `<div class="card"><h3>${hit.name}</h3><p class="meta">詳細は近日追加</p></div>`
            : `<p class="meta">該当が見つかりませんでした。</p>`;
        }
      });
      sel.__hnc_bound_force__ = true;
    }
    return true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    [0, 200, 600, 1200].forEach(ms => setTimeout(populateOnce, ms));
  });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn[data-tab="community"]');
    if (btn) setTimeout(populateOnce, 0);
  });
  window.addEventListener('hashchange', () => {
    if (location.hash === '#community') setTimeout(populateOnce, 0);
  });
})();
