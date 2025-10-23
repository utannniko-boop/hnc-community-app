/* =================== グローバル状態 =================== */
// 失敗時に必ず表示できる最小データ（保険）
const DATA_FALLBACK = {
  cancers: [
    { id:"oral", name:"口腔がん（舌・口底など）", aliases:["口腔癌","舌がん","舌癌","歯肉がん","口底がん","oral cancer","C00","C01","C02","C03","C04","C05","C06"], icd:"C00-C06",
      topics:[{title:"術後の発音・嚥下リハ",desc:"STと進めるホームエクササイズ"}],
      links:[{title:"がん情報サービス（頭頸部）",url:"https://ganjoho.jp/public/cancer/head_neck/"}]
    },
    { id:"oropharynx", name:"中咽頭がん", aliases:["中咽頭癌","HPV関連がん","oropharyngeal cancer","C10"], icd:"C10" },
    { id:"hypopharynx", name:"下咽頭がん", aliases:["下咽頭癌","hypopharyngeal cancer","C13"], icd:"C13" },
    { id:"nasopharynx", name:"上咽頭がん", aliases:["上咽頭癌","NPC","nasopharyngeal carcinoma","C11"], icd:"C11" },
    { id:"larynx", name:"喉頭がん", aliases:["喉頭癌","laryngeal cancer","C32"], icd:"C32",
      topics:[{title:"発声代替",desc:"電気式人工喉頭・食道発声・シャント"}]
    },
    { id:"nasal", name:"鼻腔がん", aliases:["鼻腔癌","副鼻腔がん","鼻副鼻腔がん","nasal cancer","paranasal sinus cancer","C30","C31"], icd:"C30-C31" },
    { id:"salivary", name:"唾液腺がん", aliases:["唾液腺癌","耳下腺がん","耳下腺癌","顎下腺がん","舌下腺がん","salivary gland cancer","parotid","C07","C08"], icd:"C07-C08" }
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
  // ハッシュで #community に来たら確実に初期化
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
  // コミュニティを開いた/表示されたら空でないように
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

  sel.addEventListener('change', (e) => {
    const id = e.target.value;
    if(!id) return;
    renderCommunityContent(id);
  });
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

function renderCommunityContent(cancerId){
  const wrap = document.getElementById('community-content');
  if(!wrap) return;
  const arr = Array.isArray(DATA?.cancers) ? DATA.cancers : [];
  const cancer = arr.find(c => c.id === cancerId);
  if(!cancer){
    wrap.innerHTML = '<p class="meta">該当のがん種が見つかりませんでした。</p>';
    return;
  }

  const aliases = (cancer.aliases||[]).join('・');
  const topics = (cancer.topics||[]).map(t => `
    <li><strong>${t.title}</strong><div class="meta">${t.desc||''}</div></li>
  `).join('') || '<li>トピックは準備中です。</li>';

  const links = (cancer.links||[]).map(l => `
    <li><a href="${l.url}" target="_blank" rel="noopener">${l.title||l.url}</a></li>
  `).join('') || '<li>関連リンクは準備中です。</li>';

  wrap.innerHTML = `
    <div class="card">
      <h3>${cancer.name} <span class="badge">${cancer.icd||''}</span></h3>
      ${aliases ? `<div class="meta">別名：${aliases}</div>` : ''}
    </div>
    <div class="card"><h3>話題・トピック</h3><ul class="list small">${topics}</ul></div>
    <div class="card"><h3>関連リンク</h3><ul class="list small">${links}</ul></div>
  `;

  // 連動（任意）
  try { filterTreatments(cancerId); } catch(e){}
  try { filterLife(cancerId); } catch(e){}
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
