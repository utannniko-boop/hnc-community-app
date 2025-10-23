/* =========================================================
   HNC Community PWA - app.js（全置換／分類自動補完つき）
   - 生活の工夫：手術/抗がん剤/放射線/その他 に分類＋検索
   - resources.json の life が未分類でもキーワードで自動分類（tx補完）
   - タブ切替時にも最新の絞り込みを再描画
   ========================================================= */

/* =================== 設定 =================== */
const LIFE_GROUPS = {
  surgery:   { label: '手術', key: 'surgery' },
  chemo:     { label: '抗がん剤治療', key: 'chemo' },
  radiation: { label: '放射線治療', key: 'radiation' },
  other:     { label: 'その他の治療', key: 'other' }
};

/* 自動分類用キーワード（NFKC/小文字/空白除去後で照合） */
const KW = {
  surgery: [
    '手術','術後','切除','摘出','再建','皮弁','移植','縫合','開口','顎','顎運動','肩','副神経','気管孔','ストーマ','瘢痕','瘢痕部','創部'
  ],
  radiation: [
    '放射線','照射','rt','radiation','放射線皮膚炎','粘膜炎','口内炎','唾液','口腔乾燥','線維化','頸部線維化','味覚','嗅覚','匂い訓練'
  ],
  chemo: [
    '抗がん剤','化学療法','化学放射線','化放','cisplatin','シスプラチン','パクリタキセル','ドセタキセル','nab-paclitaxel',
    '悪心','嘔吐','制吐','骨髄抑制','好中球','白血球','末梢神経','しびれ','脱毛'
  ],
  other: [
    '痛み','鎮痛','疲労','栄養','経腸','peg','ng','リンパ浮腫','在宅','復職','就労','公的支援','家族','介護','メンタル','マインドフルネス','睡眠'
  ]
};

/* =================== データ（FALLBACK） =================== */
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
    // 手術
    { id:"speech-aids", title:"構音の工夫（舌・口底切除後）", category:"嚥下・発声", body:"簡潔な語彙・ゆっくり・相手の理解確認。キーボード/スマホ音声合成も併用。", cancerIds:["oral"], tx:"surgery" },
    { id:"trismus", title:"開口障害（口が開きにくい）", category:"運動・拘縮", body:"術後は早期から開口訓練（指タテ・スティック）。“心地よい伸張”程度で継続。温罨法も可。", cancerIds:["oral","oropharynx","nasal","salivary"], tx:"surgery" },
    { id:"shoulder", title:"副神経障害の肩痛・挙上制限", category:"運動・拘縮", body:"肩甲帯安定化訓練・可動域維持。作業療法で代償動作。", cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","salivary"], tx:"surgery" },
    { id:"stoma-care", title:"気管孔（ストーマ）の日常管理", category:"呼吸・ストーマ", body:"HMEで加湿・痰の湿性化。シャワー時はカバー。出血・異臭は早期相談。", cancerIds:["larynx"], tx:"surgery" },
    // 抗がん剤
    { id:"nausea", title:"悪心・嘔吐の対策", category:"栄養・食事", body:"少量高頻度・においの少ない冷食。処方制吐薬は前投与指示どおりに。", cancerIds:["*"], tx:"chemo" },
    { id:"taste-metal", title:"金属味・味覚変化", category:"栄養・食事", body:"プラ製スプーン・冷食・香りの活用（だし・ハーブ）。口腔ケア徹底。", cancerIds:["*"], tx:"chemo" },
    { id:"infection", title:"好中球減少時の感染対策", category:"感染予防", body:"手指衛生・人混み回避・発熱時は早期連絡。口内ケアで粘膜炎リスク低減。", cancerIds:["*"], tx:"chemo" },
    // 放射線
    { id:"oral-care-rt", title:"放射線治療中の口腔ケア基本", category:"口腔ケア", body:"やわらかめ歯ブラシ・フッ化物含嗽・無アルコール洗口液。粘膜炎時は圧を最小に。", cancerIds:["oral","oropharynx","nasopharynx","larynx","nasal","salivary"], tx:"radiation" },
    { id:"xerostomia", title:"口腔乾燥（唾液減少）", category:"口腔ケア", body:"人工唾液・無糖ガム・加湿。う蝕予防に高濃度フッ化物。", cancerIds:["oral","oropharynx","nasopharynx","larynx","salivary"], tx:"radiation" },
    { id:"skin-rt", title:"放射線皮膚炎のスキンケア", category:"皮膚ケア", body:"低刺激保湿・摩擦と紫外線回避。びらん時は指示薬。民間療法は避ける。", cancerIds:["*"], tx:"radiation" },
    // その他
    { id:"lymphedema", title:"顔面・頸部リンパ浮腫セルフケア", category:"むくみ", body:"スキンケア→軽擦→頸部誘導。圧迫は医療者の指導下で。感染兆候は受診。", cancerIds:["*"], tx:"other" },
    { id:"pain", title:"痛みの段階的コントロール", category:"痛み", body:"アセトアミノフェン→NSAIDs→オピオイド＋便秘対策。神経障害性痛は補助薬も。", cancerIds:["*"], tx:"other" },
    { id:"work", title:"仕事・学業への復帰準備", category:"社会・制度", body:"就労配慮指示書・段階的復職・在宅併用の交渉。制限は具体的に伝える。", cancerIds:["*"], tx:"other" },
  ],
  histologies: [
    { id:"adenoid-cystic", name:"腺様嚢胞癌（Adenoid cystic carcinoma）",
      aliases:["腺様嚢胞癌","腺様のう胞がん","adenoid cystic carcinoma","Adenoid-cystic carcinoma","ACC"],
      siteIds:["salivary","nasal","oral"]
    },
    { id:"mucoepidermoid", name:"粘表皮癌（Mucoepidermoid carcinoma）",
      aliases:["粘表皮癌","粘表皮がん","mucoepidermoid carcinoma","MEC"],
      siteIds:["salivary","nasal","oral","oropharynx"]
    },
    { id:"mucosal-melanoma", name:"悪性黒色腫（粘膜）",
      aliases:["悪性黒色腫","メラノーマ","melanoma","mucosal melanoma","mucosal malignant melanoma"],
      siteIds:["nasal","oral","oropharynx"]
    },
    { id:"lymphoma", name:"リンパ腫",
      aliases:["リンパ腫","悪性リンパ腫","lymphoma"],
      siteIds:["oropharynx","nasopharynx"]
    },
    { id:"sarcoma", name:"肉腫",
      aliases:["肉腫","sarcoma","横紋筋肉腫","骨肉腫","線維肉腫"],
      siteIds:["oral","nasal","oropharynx"]
    }
  ]
};

let DATA = { cancers: [], treatments: [], life: [], histologies: [] };
window.HISTO_CONTEXT = null;

/* =================== 起動 =================== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

async function boot(){
  await loadData();
  initAll();
  window.addEventListener('hashchange', () => {
    if (location.hash === '#community') ensureCommunityReady();
    if (location.hash === '#life') renderLifeList(); // タブ直遷移でも更新
  });
}

/* =================== データ読み込み =================== */
async function loadData(){
  let ok = false;
  try{
    const res = await fetch('./resources.json?v=3', { cache: 'no-store' });
    if(res.ok){
      const json = await res.json();
      if (json && Array.isArray(json.cancers) && json.cancers.length){
        DATA = { ...json };
        if (!Array.isArray(DATA.histologies)) {
          DATA.histologies = DATA_FALLBACK.histologies;
        }
        if (!Array.isArray(DATA.life) || DATA.life.length === 0) {
          DATA.life = DATA_FALLBACK.life;
        }
        // ここで life の tx を自動補完
        DATA.life = normalizeLifeItems(DATA.life);
        ok = true;
      }
    }
  }catch(e){
    console.warn('[loadData] fetch error', e);
  }
  if(!ok){
    console.warn('[loadData] using FALLBACK data');
    DATA = { ...DATA_FALLBACK, life: normalizeLifeItems(DATA_FALLBACK.life) };
  }
}

/* ===== 自動分類（tx補完） ===== */
function normalizeLifeItems(list){
  const norm = (s)=>String(s||'').toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'');
  function guessTx(item){
    const text = norm(`${item.title} ${item.category||''} ${item.body||''}`);
    const hit = (set)=> set.some(k => text.includes(norm(k)));
    if (hit(KW.surgery))   return 'surgery';
    if (hit(KW.radiation)) return 'radiation';
    if (hit(KW.chemo))     return 'chemo';
    if (hit(KW.other))     return 'other';
    // 口腔ケア系は放射線に寄せることが多い
    if (norm(item.category||'').includes('口腔')) return 'radiation';
    return 'other';
  }
  return (list||[]).map(x => {
    const tx = x.tx || guessTx(x);
    const cancerIds = Array.isArray(x.cancerIds) ? x.cancerIds : ['*'];
    return { ...x, tx, cancerIds };
  });
}

/* =================== 初期化まとめ =================== */
function initAll(){
  try { initTabs(); } catch(e){ console.warn('initTabs err', e); }
  try { initHome(); } catch(e){ console.warn('initHome err', e); }
  try { initHistology(); } catch(e){ console.warn('initHistology err', e); }
  try { initGlobalSearch(); } catch(e){ console.warn('initGlobalSearch err', e); }
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
  if (tab === 'life') renderLifeList(); // ここで必ず更新
}

/* =================== ホーム（部位検索） =================== */
function initHome(){
  const list = document.getElementById('cancer-list');
  const input = document.getElementById('cancer-search');
  if(!list || !input) return;

  const norm = (s) => (s || '')
    .toString().toLowerCase().normalize('NFKC')
    .replace(/[ \u3000]/g, '').replace(/癌腫/g, 'がんしゅ')
    .replace(/癌/g, 'がん').replace(/ガン/g, 'がん');

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
    .toString().toLowerCase().normalize('NFKC')
    .replace(/[ \u3000]/g, '').replace(/癌腫/g, 'がんしゅ')
    .replace(/癌/g, 'がん').replace(/ガン/g, 'がん');

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

/* =================== 統合検索：global-search =================== */
function initGlobalSearch(){
  const input = document.getElementById('global-search');
  const list = document.getElementById('global-results');
  if (!input || !list) return;

  const norm = (s) => (s || '')
    .toString().toLowerCase().normalize('NFKC')
    .replace(/[ \u3000]/g, '').replace(/癌腫/g, 'がんしゅ')
    .replace(/癌/g, 'がん').replace(/ガン/g, 'がん');

  function search(q){
    const f = norm(q);
    const sites = (DATA.cancers||[]).filter(c => [c.name, ...(c.aliases||[]), c.icd||''].map(norm).join('||').includes(f));
    const histos = (DATA.histologies||[]).filter(h => [h.name, ...(h.aliases||[])].map(norm).join('||').includes(f));
    return { sites, histos };
  }

  function render(q=''){
    list.innerHTML = '';
    if (!q) return;

    const { sites, histos } = search(q);
    if (!sites.length && !histos.length){
      list.innerHTML = '<li class="meta">候補が見つかりませんでした。</li>';
      return;
    }

    sites.forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>部位：</strong>${c.name}
        <div class="meta">${(c.aliases||[]).join('・')}</div>
        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
          <a href="#" data-act="community" data-cancer="${c.id}">コミュニティへ</a>
          <a href="#" data-act="trials" data-cancer="${c.id}">治験を探す</a>
        </div>
      `;
      list.appendChild(li);
    });

    histos.forEach(h => {
      const li = document.createElement('li');
      const sitesBtns = (h.siteIds||[]).map(id => {
        const s = (DATA.cancers||[]).find(x=>x.id===id);
        return s ? `<a href="#" data-act="trials" data-cancer="${s.id}" data-histology="${h.id}">${s.name}で治験</a>` : '';
      }).join(' ');
      li.innerHTML = `
        <strong>組織型：</strong>${h.name}
        <div class="meta">${(h.aliases||[]).join('・')}</div>
        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
          ${sitesBtns || `<a href="#" data-act="trials" data-histology="${h.id}">治験を探す</a>`}
        </div>
      `;
      list.appendChild(li);
    });
  }

  input.addEventListener('input', e => render(e.target.value));
  input.addEventListener('compositionend', e => render(e.target.value));
  list.addEventListener('click', e => {
    const a = e.target.closest('a[data-act]'); if(!a) return;
    e.preventDefault();
    const act = a.dataset.act;
    const cancerId = a.dataset.cancer || null;
    const histologyId = a.dataset.histology || null;

    if (act === 'community' && cancerId){
      switchTab('community');
      selectCancer(cancerId);
      return;
    }
    if (act === 'trials'){
      switchTab('community');
      if (cancerId) selectCancer(cancerId);
      window.HISTO_CONTEXT = histologyId || null;
    }
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
      if (topic?.url) { window.open(topic.url, '_blank', 'noopener'); return; }
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

  try { loadPosts(cancerId); } catch(e){} // 投稿機能が無くてもOK
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

/* =================== 生活の工夫（分類＋検索） =================== */
function initLife(){
  const wrap = document.getElementById('life-filters');
  if (wrap && !wrap.__bound__) {
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-life-cat]');
      if (!btn) return;
      wrap.querySelectorAll('button[data-life-cat]').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      const cat = btn.dataset.lifeCat || 'all';
      renderLifeList(null, { cat });
    });
    const search = document.getElementById('life-search');
    if (search) {
      const on = () => renderLifeList(null, { q: search.value });
      search.addEventListener('input', on);
      search.addEventListener('compositionend', on);
    }
    wrap.__bound__ = true;
  }
  renderLifeList(); // 初回描画
}

function renderLifeList(filterCancerId = null, opt = {}){
  const host = document.getElementById('life-host');
  if (!host) return;

  const q = (opt.q || '').toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'');
  const cat = opt.cat || (document.querySelector('#life-filters button[aria-pressed="true"]')?.dataset.lifeCat || 'all');

  let items = (Array.isArray(DATA?.life) ? DATA.life : []).slice();

  // 部位フィルタ
  if (filterCancerId) {
    items = items.filter(x => {
      const ids = Array.isArray(x.cancerIds) ? x.cancerIds : [];
      return ids.includes('*') || ids.includes(filterCancerId);
    });
  }

  // 治療カテゴリ
  if (cat && cat !== 'all') {
    items = items.filter(x => (x.tx || 'other') === cat);
  }

  // 検索
  if (q) {
    const norm = (s)=> String(s||'').toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'');
    items = items.filter(x =>
      norm(x.title).includes(q) ||
      norm(x.body).includes(q) ||
      norm(x.category||'').includes(q)
    );
  }

  // グルーピング
  const groups = { surgery: [], chemo: [], radiation: [], other: [] };
  items.forEach(x => { (groups[x.tx || 'other'] || groups.other).push(x); });

  const sec = (key, list) => {
    if (!list.length) return '';
    const g = LIFE_GROUPS[key];
    return `
      <div class="card">
        <h3>${g.label}</h3>
        <ul class="list small">
          ${list.map(x => `
            <li>
              <strong>${escapeHtml(x.title)}</strong>
              <div class="meta">${escapeHtml(x.category||'')}</div>
              <div>${escapeHtml(x.body||'')}</div>
            </li>
          `).join('')}
        </ul>
      </div>`;
  };

  const html = (cat === 'all')
    ? [sec('surgery', groups.surgery), sec('chemo', groups.chemo), sec('radiation', groups.radiation), sec('other', groups.other)].join('')
    : sec(cat, groups[cat]);

  host.innerHTML = html || `<div class="meta">該当する項目が見つかりませんでした。キーワードやカテゴリを変えてお試しください。</div>`;
}
function filterLife(id){
  const search = document.getElementById('life-search');
  const q = search ? search.value : '';
  const cat = (document.querySelector('#life-filters button[aria-pressed="true"]')?.dataset.lifeCat) || 'all';
  renderLifeList(id, { q, cat });
}

/* ========== ClinicalTrials.gov 連携（簡略：既存のまま） ========== */
const EN_SYNONYMS = {
  oral: ['oral cavity cancer','tongue cancer','floor of mouth cancer','buccal mucosa cancer','gingival cancer'],
  oropharynx: ['oropharyngeal cancer','tonsil cancer','base of tongue cancer'],
  hypopharynx: ['hypopharyngeal cancer','pyriform sinus','postcricoid'],
  nasopharynx: ['nasopharyngeal carcinoma','NPC'],
  larynx: ['laryngeal cancer','glottic','supraglottic','subglottic'],
  nasal: ['nasal cavity cancer','paranasal sinus cancer','maxillary sinus cancer','ethmoid sinus cancer'],
  salivary: ['salivary gland cancer','parotid gland cancer','submandibular gland cancer','sublingual gland cancer'],

  'adenoid-cystic': ['adenoid cystic carcinoma','ACC'],
  'mucoepidermoid': ['mucoepidermoid carcinoma','MEC'],
  'mucosal-melanoma': ['mucosal melanoma','malignant melanoma of mucosa'],
  lymphoma: ['head and neck lymphoma','extranodal lymphoma'],
  sarcoma: ['head and neck sarcoma','rhabdomyosarcoma','fibrosarcoma','osteosarcoma']
};

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

const BROADEN_SITE_EXPR = {
  salivary: '"salivary+gland+carcinoma"+OR+"salivary+gland+cancer"+OR+parotid+OR+submandibular+OR+sublingual'
};
const BROADEN_HISTO_EXPR = {
  'adenoid-cystic'  : '"adenoid+cystic+carcinoma"+AND+("salivary+gland"+OR+parotid+OR+submandibular+OR+sublingual)',
  'mucoepidermoid'  : '"mucoepidermoid+carcinoma"+AND+("salivary+gland"+OR+parotid+OR+submandibular+OR+sublingual)',
  'mucosal-melanoma': '"mucosal+melanoma"+AND+("head+and+neck"+OR+oral+OR+nasal+OR+oropharynx)'
};

function buildTrialsExprList({ cancerId=null, histologyId=null } = {}){
  const CQ = window.TRIAL_QUERY || {};
  const HQ = window.TRIAL_QUERY_HISTO || {};
  const exprs = new Set();

  if (histologyId && HQ[histologyId]) exprs.add(HQ[histologyId]);
  if (cancerId && CQ[cancerId])       exprs.add(CQ[cancerId]);

  const syns = [];
  if (histologyId && EN_SYNONYMS[histologyId]) syns.push(...EN_SYNONYMS[histologyId]);
  if (cancerId   && EN_SYNONYMS[cancerId])     syns.push(...EN_SYNONYMS[cancerId]);
  if (syns.length){
    const orExpr = syns
      .map(s => `"${encodeURIComponent(String(s).replace(/\s+/g,'+'))}"`)
      .join('+OR+');
    exprs.add(orExpr);
  }

  if (histologyId && BROADEN_HISTO_EXPR[histologyId]) exprs.add(BROADEN_HISTO_EXPR[histologyId]);
  if (cancerId && BROADEN_SITE_EXPR[cancerId])        exprs.add(BROADEN_SITE_EXPR[cancerId]);

  exprs.add(CQ._default || '"Head+and+Neck+Cancer"');

  return Array.from(exprs);
}

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

  const seen = new Set();
  const uniq = [];
  for (const t of all){
    if (!t.id || seen.has(t.id)) continue;
    seen.add(t.id);
    uniq.push(t);
  }

  const score = (t) => {
    let s = 0;
    if (/Recruiting|Enrolling|Not\s+yet\s+recruiting/i.test(t.status||'')) s += 50;
    if ((t.interventionTypes||[]).some(x => /Drug|Biological|Device|Combination Product/i.test(x))) s += 20;
    if ((t.interventions||[]).length) s += 10;
    if ((t.countries||[]).some(c => /Japan/i.test(c))) s += 15;
    if (/Phase\s*(2|3|4)/i.test(t.phase||'')) s += 10;
    const d = Date.parse(t.updated||t.start||'') || 0;
    s += Math.min(20, Math.floor((d - 1700000000000)/(1000*60*60*24*30)));
    return s;
  };
  uniq.sort((a,b) => score(b) - score(a));

  return uniq.slice(0, 24);
}

window.TRIAL_FILTERS = {
  recruitingOnly: true,
  drugOnly: true,
  japanFirst: true,
  phaseMin: '2'
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
        <option value="Any" ${window.TRIAL_FILTERS.phaseMin==='Any'?'selected':''}>指定なし</option>
        <option value="1" ${window.TRIAL_FILTERS.phaseMin==='1'?'selected':''}>Phase 1+</option>
        <option value="2" ${window.TRIAL_FILTERS.phaseMin==='2'?'selected':''}>Phase 2+</option>
        <option value="3" ${window.TRIAL_FILTERS.phaseMin==='3'?'selected':''}>Phase 3+</option>
        <option value="4" ${window.TRIAL_FILTERS.phaseMin==='4'?'selected':''}>Phase 4</option>
      </select>
    </label>
  `;
  box.appendChild(c);

  const $ = (sel)=>c.querySelector(sel);
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

let __TRIALS_CACHE = [];

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

/* =================== ブックマーク（ダミー） =================== */
function renderBookmarks(){
  const ul = document.getElementById('bookmarks');
  if(!ul) return;
  ul.innerHTML = '<li class="meta">ブックマークは準備中です。</li>';
}

/* =================== ユーティリティ =================== */
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ======= 保険：コミュニティ選択肢のフォース・ポピュレート ======= */
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
