// ---- データ入れ物（初期値）----
let DATA = { cancers: [], treatments: [], life: [] };

// ---- resources.json を読む（失敗時はメッセージ表示）----
async function loadData(){
  const list = document.getElementById('cancer-list');
  try{
    // 重要：相対パス './resources.json' ＋ キャッシュ無効化
    const res = await fetch('./resources.json', { cache: 'no-store' });
    if(!res.ok) throw new Error(`resources.json not found (${res.status})`);
    DATA = await res.json();
  }catch(err){
    console.error('Failed to load resources.json', err);
    if(list){
      list.innerHTML = '<li>データが読み込めませんでした。<br>① resources.json がリポジトリ直下にあるか<br>② ファイル名の大文字小文字<br>③ 強制再読み込み（Ctrl/Cmd+Shift+R）を実施 を確認してください。</li>';
    }
  }

  // 読み込み後に各UI初期化（存在する関数だけ呼びます）
  try { initHome(); } catch(e){}
  try { initCommunity(); } catch(e){}
  try { initTreatments(); } catch(e){}
  try { initLife(); } catch(e){}
  try { renderBookmarks(); } catch(e){}
}

// ---- ページ読み込み時にデータ読込スタート ----
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadData);
} else {
  loadData();
}
function initHome(){
  const list = document.getElementById('cancer-list');
  const input = document.getElementById('cancer-search');
  
// 全角/半角・空白・表記ゆれを吸収する正規化
const norm = (s) => (s || '')
  .toString()
  .toLowerCase()
  .normalize('NFKC')       // 全角→半角、濁点結合などを正規化
  .replace(/[ \u3000]/g, '') // 半角/全角スペース除去
  // ---- 表記ゆれ吸収（重要）----
  .replace(/癌腫/g, 'がんしゅ')   // 先に長い語を
  .replace(/癌/g, 'がん')         // 癌 → がん
  .replace(/ガン/g, 'がん');      // カタカナ → ひらがな
  

  function render(filterText=''){
    const f = norm(filterText);
    list.innerHTML = '';
    const items = DATA.cancers.filter(c => {
      if (!f) return true; // 未入力なら全件表示
      const fields = [
        c.name,
        ...(c.aliases || []),
        c.icd || ''
      ].map(norm).join('||');
      return fields.includes(f);
    });
    if (items.length === 0) {
      list.innerHTML = '<li>該当が見つかりませんでした。別の表記でもお試しください（例：喉頭がん／喉頭癌／C32）。</li>';
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

  // IME変換中でも確定のたびに反映されるように
  input.addEventListener('input', e => render(e.target.value));
  input.addEventListener('compositionend', e => render(e.target.value));

  // 初期表示（全件）
  render('');

  // リスト内リンクで各タブへジャンプ
  list.addEventListener('click', e => {
    const a = e.target.closest('a[data-jump]'); if(!a) return;
    e.preventDefault();
    const tab = a.dataset.jump; const id = a.dataset.cancer;
    document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
    if (tab === 'community') selectCancer(id);
    if (tab === 'treatments') filterTreatments(id);
    if (tab === 'life') filterLife(id);
  });
}
// ---- Tab switching ----
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tab = e.target.dataset.tab;
    document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
  });
});

// ---- コミュニティタブ初期化処理 ----
function initCommunity() {
  const container = document.getElementById('community');
  const list = document.getElementById('community-list');
  if (!container || !list) return;

  // がん一覧を生成
  list.innerHTML = DATA.cancers.map(c => `
    <li>
      <strong>${c.name}</strong>
      <div style="margin-top:6px;">
        <a href="#" data-jump="treatments" data-cancer="${c.id}">治療情報を見る</a>　
        <a href="#" data-jump="life" data-cancer="${c.id}">生活の工夫を見る</a>
      </div>
    </li>
  `).join('');

  // クリック時にタブ切り替え
  list.addEventListener('click', e => {
    const a = e.target.closest('a[data-jump]');
    if (!a) return;
    e.preventDefault();
    const tab = a.dataset.jump;
    const id = a.dataset.cancer;
    document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
    if (tab === 'treatments') filterTreatments(id);
    if (tab === 'life') filterLife(id);
  });
}
// =================== Community Tab (種類別) ===================
// ドロップダウンに候補を流し込み、選択に応じて内容を表示します。

function selectCancer(id){
  // Home → 「コミュニティ」へジャンプする時にも使われます
  const sel = document.getElementById('community-select');
  if(!sel) return;
  sel.value = id;
  // changeイベントを発火して描画
  sel.dispatchEvent(new Event('change'));
}

function renderCommunityContent(cancerId){
  const wrap = document.getElementById('community-content');
  if(!wrap) return;

  // データ未読込のガード
  if(!window.DATA || !Array.isArray(DATA.cancers) || DATA.cancers.length===0){
    wrap.innerHTML = '<p class="meta">データが読み込めていません。resources.json を確認してください。</p>';
    return;
  }

  const cancer = DATA.cancers.find(c => c.id === cancerId);
  if(!cancer){
    wrap.innerHTML = '<p class="meta">該当のがん種が見つかりませんでした。</p>';
    return;
  }

  // 画面生成
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

  // もし治験や生活の工夫タブに連動させたい場合はここで呼べます
  // 例: filterTreatments(cancerId); filterLife(cancerId);
}

function initCommunity(){
  const sel = document.getElementById('community-select');
  const wrap = document.getElementById('community-content');
  if(!sel || !wrap) return; // HTML側のidが違うと動きません

  // 初期化（プレースホルダー＋候補追加）
  const hasData = window.DATA && Array.isArray(DATA.cancers) && DATA.cancers.length>0;
  if(!hasData){
    // データ未読み込み時でも一応メッセージ
    wrap.innerHTML = '<p class="meta">データ読込中…（更新で反映されます）</p>';
    return;
  }

  // 既存の選択肢を一旦クリア
  sel.innerHTML = '';
  sel.insertAdjacentHTML('beforeend', `<option value="" disabled selected>がんの種類を選んでください</option>`);
  DATA.cancers.forEach(c => {
    sel.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.name}</option>`);
  });

  // 選択時の描画
  sel.addEventListener('change', (e) => {
    const id = e.target.value;
    if(!id) return;
    renderCommunityContent(id);
  });

  // もし Home から selectCancer(id) で来た場合、上で change を発火します
}

// 既存の loadData() の中から呼ばれている想定：
// try { initCommunity(); } catch(e){}
/* ===== 強制初期化（コミュニティ・ドロップダウンが空の時用） ===== */
(function forceInitCommunity(){
  document.addEventListener('DOMContentLoaded', async () => {
    // 1) resources.json を未読なら読み込む（キャッシュ無効）
    if (!window.DATA || !Array.isArray(window.DATA.cancers) || window.DATA.cancers.length === 0) {
      try {
        const res = await fetch('./resources.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('resources.json not found: ' + res.status);
        window.DATA = await res.json();
      } catch (e) {
        console.error('[forceInitCommunity] 資源読込失敗', e);
      }
    }

    // 2) セレクトと描画先を取得
    const sel  = document.getElementById('community-select');
    const wrap = document.getElementById('community-content');
    if (!sel || !wrap) {
      console.warn('[forceInitCommunity] 必要な要素が見つかりません (community-select / community-content)');
      return;
    }

    // 3) がん種を流し込む
    sel.innerHTML = '';
    sel.insertAdjacentHTML('beforeend', `<option value="" disabled selected>がんの種類を選んでください</option>`);
    if (Array.isArray(window.DATA?.cancers)) {
      sel.insertAdjacentHTML(
        'beforeend',
        window.DATA.cancers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
      );
    } else {
      wrap.innerHTML = '<p class="meta">データが読み込めていません。resources.json の配置とスペルを確認してください。</p>';
    }

    // 4) 選択時に内容を表示（renderCommunityContent があれば利用）
    sel.addEventListener('change', (e) => {
      const id = e.target.value;
      if (!id) return;
      if (typeof renderCommunityContent === 'function') {
        renderCommunityContent(id);
      } else {
        // 代替描画：最低限の内容
        const c = (window.DATA.cancers || []).find(x => x.id === id);
        if (!c) return;
        const aliases = (c.aliases || []).join('・');
        const topics  = (c.topics  || []).map(t => `<li><strong>${t.title}</strong><div class="meta">${t.desc||''}</div></li>`).join('') || '<li>トピック準備中</li>';
        const links   = (c.links   || []).map(l => `<li><a href="${l.url}" target="_blank" rel="noopener">${l.title||l.url}</a></li>`).join('') || '<li>リンク準備中</li>';
        wrap.innerHTML = `
          <div class="card">
            <h3>${c.name} <span class="badge">${c.icd||''}</span></h3>
            ${aliases ? `<div class="meta">別名：${aliases}</div>` : ''}
          </div>
          <div class="card"><h3>話題・トピック</h3><ul class="list small">${topics}</ul></div>
          <div class="card"><h3>関連リンク</h3><ul class="list small">${links}</ul></div>
        `;
      }
    });
  });
})();
