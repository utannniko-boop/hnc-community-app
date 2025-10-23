/* =================== グローバル状態 =================== */
let DATA = { cancers: [], treatments: [], life: [] };

/* =================== データ読み込み =================== */
async function loadData(){
  try{
    const res = await fetch('./resources.json', { cache: 'no-store' });
    if(!res.ok) throw new Error(`resources.json not found (${res.status})`);
    DATA = await res.json();
  }catch(err){
    console.error('Failed to load resources.json', err);
  }

  // 各UI初期化
  try { initHome(); } catch(e){ console.warn('initHome err', e); }
  try { initCommunity(); } catch(e){ console.warn('initCommunity err', e); }
  try { initTreatments(); } catch(e){ console.warn('initTreatments err', e); }
  try { initLife(); } catch(e){ console.warn('initLife err', e); }
  try { renderBookmarks(); } catch(e){}

  // コミュニティを開いた時に空なら流し込む保険
  ensureCommunityReady();
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
    .normalize('NFKC')          // 全角→半角など
    .replace(/[ \u3000]/g, '')  // 半角/全角スペース除去
    .replace(/癌腫/g, 'がんしゅ') // 先に長い語
    .replace(/癌/g, 'がん')       // 癌 → がん
    .replace(/ガン/g, 'がん');    // カタカナ → ひらがな

  function render(filterText=''){
    const f = norm(filterText);
    list.innerHTML = '';

    if (!Array.isArray(DATA?.cancers) || DATA.cancers.length === 0) {
      list.innerHTML = '<li>データが読み込めていません。resources.json とキャッシュをご確認ください。</li>';
      return;
    }

    const items = DATA.cancers.filter(c => {
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

  if (!Array.isArray(DATA?.cancers) || DATA.cancers.length === 0) {
    // データ未読時は後で ensureCommunityReady が再実行
    return;
  }

  // 初期化：プレースホルダー + 選択肢
  sel.innerHTML = '';
  sel.insertAdjacentHTML('beforeend', `<option value="" disabled selected>がんの種類を選んでください</option>`);
  DATA.cancers.forEach(c => {
    sel.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.name}</option>`);
  });

  sel.addEventListener('change', (e) => {
    const id = e.target.value;
    if(!id) return;
    renderCommunityContent(id);
  });
}

function renderCommunityContent(cancerId){
  const wrap = document.getElementById('community-content');
  if(!wrap) return;
  const cancer = (DATA.cancers||[]).find(c => c.id === cancerId);
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
    <div class="card">
      <h3>話題・トピック</h3>
      <ul class="list small">${topics}</ul>
    </div>
    <div class="card">
      <h3>関連リンク</h3>
      <ul class="list small">${links}</ul>
    </div>
  `;

  // 連動描画（任意）
  try { filterTreatments(cancerId); } catch(e){}
  try { filterLife(cancerId); } catch(e){}
}

function selectCancer(id){
  const sel = document.getElementById('community-select');
  if(!sel) return;
  sel.value = id;
  sel.dispatchEvent(new Event('change'));
}

// コミュニティを開いたタイミングで空なら初期化
function ensureCommunityReady(){
  const sel = document.getElementById('community-select');
  if(!sel) return;
  const need = !sel.options || sel.options.length === 0 || (sel.options.length === 1 && !sel.value);
  if(need && Array.isArray(DATA?.cancers) && DATA.cancers.length>0){
    initCommunity();
  }
}

/* =================== 治療リンク =================== */
function initTreatments(){
  const ul = document.getElementById('treatment-links');
  if(!ul) return;

  // 初期は全件表示
  renderTreatmentsList();
}

function renderTreatmentsList(filterId){
  const ul = document.getElementById('treatment-links');
  if(!ul) return;
  ul.innerHTML = '';

  if(!Array.isArray(DATA?.treatments)) {
    ul.innerHTML = '<li>データが読み込めていません。</li>';
    return;
  }

  const items = DATA.treatments.filter(t => {
    if(!filterId) return true;
    return Array.isArray(t.cancerIds) ? t.cancerIds.includes(filterId) : true;
  });

  if(items.length === 0){
    ul.innerHTML = '<li>該当のリンクは見つかりませんでした。</li>';
    return;
  }

  items.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${t.url}" target="_blank" rel="noopener">${t.title}</a> <span class="meta">— ${t.source||''}</span>`;
    ul.appendChild(li);
  });
}

function filterTreatments(id){
  renderTreatmentsList(id);
}

/* =================== 生活の工夫 =================== */
function initLife(){
  // 初期は全件表示
  renderLifeList();
}

function renderLifeList(filterId){
  const ul = document.getElementById('life-tips');
  if(!ul) return;
  ul.innerHTML = '';

  if(!Array.isArray(DATA?.life)) {
    ul.innerHTML = '<li>データが読み込めていません。</li>';
    return;
  }

  const items = DATA.life.filter(item => {
    if(!filterId) return true;
    return Array.isArray(item.cancerIds) ? item.cancerIds.includes(filterId) : true;
  });

  if(items.length === 0){
    ul.innerHTML = '<li>該当のヒントは見つかりませんでした。</li>';
    return;
  }

  items.forEach(x => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${x.title}</strong><div class="meta">${x.category||''}</div><div>${x.body||''}</div>`;
    ul.appendChild(li);
  });
}

function filterLife(id){
  renderLifeList(id);
}

/* =================== ブックマーク（ダミー） =================== */
function renderBookmarks(){
  const ul = document.getElementById('bookmarks');
  if(!ul) return;
  ul.innerHTML = '<li class="meta">ブックマークは準備中です。</li>';
}

/* =================== タブ切り替え =================== */
function switchTab(tab){
  document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(tab);
  if(target) target.classList.add('active');
  if (tab === 'community') ensureCommunityReady();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tab = e.currentTarget.dataset.tab;
    switchTab(tab);
  });
});

/* =================== 起動 =================== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  loadData();
}
