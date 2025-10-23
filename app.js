/* =========================================================
   HNC Community PWA - app.js (全置換用・改善版)
   - TRIAL_QUERY の重複定義を解消
   - topics クリックで開閉／URLあれば外部リンク
   - resources.json 未読でもFALLBACKで動作
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
    { id:"salivary",    name:"唾液腺がん", aliases:["唾液腺癌","耳下腺がん","耳下腺癌","顎下腺がん","舌下腺がん","salivary gland cancer","parotid","C07","C08"], icd:"C07-C08" }
  ],
  treatments: [
    {title:"がん情報サービス（頭頸部）", url:"https://ganjoho.jp/public/cancer/head_neck/", source:"国立がん研究センター",
     cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]}
  ],
  life: [
    {id:"oral-care",title:"放射線治療中の口腔ケア",category:"口腔ケア",body:"軟らかい歯ブラシ・フッ化物含嗽・無アルコールの洗口液。",cancerIds:["oral","oropharynx","nasopharynx","larynx","nasal","salivary"]}
  ]
};

let DATA = { cancers: [], treatments: [], life: [] };

/* =================== 起動 =================== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

async function boot(){
  await loadData();         // データ取得（失敗時は FALLBACK）
  initAll();                // 各UI初期化
  window.addEventListener('hashchange', () => {
    if (location.hash === '#community') ensureCommunityReady();
  });
}

/* =================== データ読み込み =================== */
async function loadData(){
  let ok = false;
  try{
    const res = await fetch('./resources.json', { cache: 'no-store' });
    if(res.ok){
      const json = await res.json();
      if (json && Array.isArray(json.cancers) && json.cancers.length){
        DATA = json;
        ok = true;
      }
    }
  }catch(e){
    console.warn('[loadData] fetch error', e);
  }
  if(!ok){
    console.warn('[loadData] using FALLBACK data');
    DATA = DATA_FALLBACK;
  }
}

/* =================== 初期化まとめ =================== */
function initAll(){
  try { initTabs(); } catch(e){ console.warn('initTabs err', e); }
  try { initHome(); } catch(e){ console.warn('initHome err', e); }
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

/* =================== ホーム（検索） =================== */
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
    .replace(/癌腫/g, 'がんしゅ') // 先に長い語
    .replace(/癌/g, 'がん')       // 癌 → がん
    .replace(/ガン/g, 'がん');    // カタカナ → ひらがな

  function render(filterText=''){
    const f = norm(filterText);
    list.innerHTML = '';

    const arr = Array.isArray(DATA?.cancers) ? DATA.cancers : [];
    if (arr.length === 0) {
      list.innerHTML = '<li>データが読み込めていません。FALLBACKに切り替わっていない場合はキャッシュを確認してください。</li>';
      return;
    }

    const items = arr.filter(c => {
      if (!f) return true; // 未入力なら全件
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

  // リスト内リンクで各タブへジャンプ
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

/* =================== コミュニティ（種類別） =================== */
function initCommunity(){
  const sel = document.getElementById('community-select');
  const wrap = document.getElementById('community-content');
  if(!sel || !wrap) return;

  // すでに埋まっていれば何もしない
  if (sel.options && sel.options.length > 1) return;

  const arr = Array.isArray(DATA?.cancers) ? DATA.cancers : [];
  sel.innerHTML = '';
  sel.insertAdjacentHTML('beforeend', `<option value="" disabled selected>がんの種類を選んでください</option>`);
  arr.forEach(c => {
    sel.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.name}</option>`);
  });

  // change は重複で増えないように1回だけ
  if (!sel.__hnc_bound__) {
    sel.addEventListener('change', (e) => {
      const id = e.target.value;
      if(!id) return;
      renderCommunityContent(id);
    });
    sel.__hnc_bound__ = true;
  }
}

// コミュニティを開いたタイミングで空なら初期化
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

function renderCommunityContent(cancerId){
  const wrap = document.getElementById('community-content');
  if(!wrap) return;

  const arr = Array.isArray(DATA?.cancers) ? DATA.cancers : [];
  const cancer = arr.find(c => c.id === cancerId);
  if(!cancer){
    wrap.innerHTML = '<p class="meta">該当のがん種が見つかりませんでした。</p>';
    return;
  }

  // topics の1件ごとに、クリックで詳細を開閉（urlがあれば新規タブで開く）
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

  // ---- クリック挙動を付与（イベント委譲）----
  const topicsList = document.getElementById('community-topics');
  if (topicsList) {
    topicsList.addEventListener('click', (e) => {
      const btn = e.target.closest('.topic-toggle');
      if (!btn) return;

      // url がある場合は外部リンク優先（新規タブ）
      const li = btn.closest('.topic-item');
      const idx = Number(li?.dataset.index ?? -1);
      const topic = (cancer.topics || [])[idx];

      if (topic?.url) {
        window.open(topic.url, '_blank', 'noopener');
        return;
      }

      // url がなければ開閉
      const body = li.querySelector('.topic-body');
      if (!body) return;
      const visible = body.style.display !== 'none';
      body.style.display = visible ? 'none' : 'block';
    });
  }

  // 連動描画
  try { filterTreatments(cancerId); } catch(e){}
  try { filterLife(cancerId); } catch(e){}
  try { loadTrials(cancerId); } catch(e){}
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

/* =================== ClinicalTrials.gov 連携（※ここだけに統一） =================== */
const TRIAL_QUERY = {
  oral: 'oral+OR+"tongue+cancer"+OR+"floor+of+mouth"',
  oropharynx: 'oropharyngeal+OR+"base+of+tongue"+OR+tonsil',
  hypopharynx: 'hypopharyngeal+OR+postcricoid+OR+"pyriform+sinus"',
  nasopharynx: 'nasopharyngeal+OR+NPC',
  larynx: 'laryngeal+OR+glottic+OR+supraglottic+OR+subglottic',
  nasal: '"nasal+cavity"+OR+"paranasal+sinus"+OR+"maxillary+sinus"',
  salivary: '"salivary+gland"+OR+parotid+OR+submandibular+OR+sublingual',
  _default: '"Head+and+Neck+Cancer"'
};
async function fetchTrialsByCancerId(cancerId){
  const expr = TRIAL_QUERY[cancerId] || TRIAL_QUERY._default;
  const url = `https://clinicaltrials.gov/api/query/study_fields?expr=${expr}&fields=NCTId,BriefTitle,Condition,OverallStatus,LocationCountry,LastUpdatePostDate&min_rnk=1&max_rnk=10&fmt=json`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`trials fetch failed: ${res.status}`);
  const json = await res.json();
  const rows = json?.StudyFieldsResponse?.StudyFields || [];
  return rows.map(r => ({
    id: r.NCTId?.[0],
    title: r.BriefTitle?.[0],
    cond: (r.Condition||[]).join(', '),
    status: r.OverallStatus?.[0],
    country: (r.LocationCountry||[]).join(', '),
    updated: r.LastUpdatePostDate?.[0]
  }));
}
async function loadTrials(cancerId){
  const box = document.getElementById('trials');
  if (!box) return;
  box.innerHTML = '<div class="meta">読み込み中…</div>';
  try {
    const trials = await fetchTrialsByCancerId(cancerId);
    if (!trials.length){
      box.innerHTML = '<div class="meta">該当する治験が見つかりませんでした。</div>';
      return;
    }
    box.innerHTML = `
      <ul class="list small">
        ${trials.map(t => `
          <li>
            <a href="https://clinicaltrials.gov/study/${t.id}" target="_blank" rel="noopener"><strong>${escapeHtml(t.title || t.id)}</strong></a>
            <div class="meta">ID: ${t.id} ／ 状況: ${escapeHtml(t.status||'')} ／ 更新: ${escapeHtml(t.updated||'')}</div>
            ${t.cond ? `<div class="meta">対象: ${escapeHtml(t.cond)}</div>` : ''}
          </li>
        `).join('')}
      </ul>`;
  } catch (e){
    console.error('trials error', e);
    box.innerHTML = '<div class="meta">治験情報の取得に失敗しました（時間をおいて再試行してください）。</div>';
  }
}

/* ========== ユーティリティ ========== */
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
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

    // すでに埋まっていれば何もしない
    if (sel.options && sel.options.length > 1) return true;

    // プレースホルダー＋候補追加
    sel.innerHTML = '';
    sel.insertAdjacentHTML('beforeend', `<option value="" disabled selected>がんの種類を選んでください</option>`);
    getCancers().forEach(c => {
      sel.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.name}</option>`);
    });

    // change が未設定なら簡易の描画フックを付ける（既存の renderCommunityContent があれば優先）
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

  // DOM読み込み後に複数回リトライ（他初期化より遅れても埋める）
  document.addEventListener('DOMContentLoaded', () => {
    [0, 200, 600, 1200].forEach(ms => setTimeout(populateOnce, ms));
  });

  // タブをコミュニティに切り替えたタイミングでも試行
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn[data-tab="community"]');
    if (btn) setTimeout(populateOnce, 0);
  });

  // ハッシュで #community に来た時も試行（直接リンク対策）
  window.addEventListener('hashchange', () => {
    if (location.hash === '#community') setTimeout(populateOnce, 0);
  });
})();
