/* =========================================================
   HNC Community PWA - app.js v36（タブクリック堅牢化）
   - [data-tab] のみにバインド
   - hashchange で確実に switchTab()
   - 不正引数ガード
   - 生活の工夫：分類/検索/フィルタ
   ========================================================= */

const DATA_FALLBACK = {
  cancers: [
    { id:"oral", name:"口腔がん（舌・口底など）", aliases:["口腔癌","舌がん","舌癌","歯肉がん","口底がん","oral cancer","C00","C01","C02","C03","C04","C05","C06"], icd:"C00-C06",
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
    // 手術系
    {id:"trismus",title:"開口障害（口が開きにくい）",category:"運動・拘縮",body:"指タテ・スティックで開口訓練。痛みは“気持ちよい伸張”まで。温罨法併用可。",cancerIds:["oral","oropharynx","nasal","salivary"]},
    {id:"stoma-care",title:"気管孔（ストーマ）の日常管理",category:"呼吸・ストーマ",body:"HMEで加湿。入浴時はカバー。痰は加湿と水分で湿性化。出血や異臭は相談。",cancerIds:["larynx"]},
    {id:"speech-aids",title:"構音の工夫（舌・口底切除後）",category:"嚥下・発声",body:"ゆっくり・短文・相手の理解確認。必要に応じて音声合成。",cancerIds:["oral"]},
    // 放射線系
    {id:"oral-care-rt",title:"放射線治療中の口腔ケア",category:"口腔ケア",body:"やわらかめ歯ブラシ＋フッ化物含嗽。無アルコール洗口液。義歯は短時間使用。",cancerIds:["oral","oropharynx","nasopharynx","larynx","nasal","salivary"]},
    {id:"mucositis-care",title:"口内炎（粘膜炎）の痛み対策",category:"口腔ケア",body:"冷飲食・氷片。辛味・酸味・熱いものを回避。鎮痛や局所麻酔含嗽は医師に相談。",cancerIds:["oral","oropharynx","nasopharynx"]},
    {id:"skin-rt",title:"放射線皮膚炎のスキンケア",category:"皮膚ケア",body:"低刺激保湿を毎日。摩擦・日光・熱刺激を避ける。びらん部は指示薬を使用。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]},
    {id:"xerostomia",title:"口腔乾燥（唾液減少）の工夫",category:"口腔ケア",body:"人工唾液・無糖ガム・氷片。寝室の加湿。高濃度フッ化物でう蝕予防。",cancerIds:["oral","oropharynx","nasopharynx","larynx","salivary"]},
    // 抗がん剤系
    {id:"nausea",title:"吐き気・悪心対策",category:"栄養・食事",body:"少量高頻回・冷たく匂い弱めの食事。処方制吐剤を適切に。脱水に注意。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]},
    {id:"taste",title:"味覚低下と嗅覚の活用",category:"栄養・食事",body:"温度と香りで補強（だし・ハーブ）。金属味にはプラ製スプーンや冷食。",cancerIds:["oral","oropharynx","nasopharynx","larynx","nasal","salivary"]},
    {id:"fatigue",title:"がん関連疲労（CRF）",category:"全身",body:"短時間の有酸素＋レジスタンス運動を週数回。睡眠衛生。昼寝は20–30分。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"]},
    // 共通・その他
    {id:"dysphagia-st",title:"嚥下リハの始め方",category:"嚥下・発声",body:"ST評価→顎・舌・頸の可動域、嚥下体操、増粘。少量ゆっくり複数回飲下。",cancerIds:["oropharynx","hypopharynx","larynx","oral"]},
    {id:"food-mod",title:"食形態の調整（むせ予防）",category:"栄養・食事",body:"とろみ付与・まとまる食材（卵・豆腐）から。二相性は工夫。軽度頸部屈曲。",cancerIds:["oropharynx","hypopharynx","larynx","oral"]},
    {id:"pain",title:"痛みの段階的コントロール",category:"痛み",body:"アセトアミノフェン→NSAIDs→オピオイド。便秘対策並走。神経障害痛は補助薬。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"]},
    {id:"lymphedema",title:"顔面・頸部リンパ浮腫セルフケア",category:"むくみ",body:"スキンケア→軽擦→頸部誘導。圧迫は指導下で。感染兆候は受診。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary"]},
    {id:"dental",title:"歯科フォロー（顎骨壊死予防）",category:"歯科",body:"放射線前後の専門歯科。抜歯はリスク評価。ビスホス/デノスマブ中は要相談。",cancerIds:["oral","oropharynx","nasopharynx","larynx","salivary","nasal"]},
    {id:"nutrition",title:"体重減少を抑える栄養",category:"栄養・食事",body:"少量高カロリーを回数で。補助飲料・油脂追加・間食。摂れない時はNSTへ。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]},
    {id:"peg-ng",title:"経腸栄養（NG/PEG）の整備",category:"栄養・食事",body:"皮膚と固定テープの清潔、フラッシュで詰まり防止。嚥下は休ませつつリハ。",cancerIds:["oropharynx","hypopharynx","nasopharynx","larynx"]},
    {id:"mental",title:"不安・抑うつセルフヘルプ",category:"こころ",body:"呼吸法・マインドフルネス・ピアサポート。強い持続症状は専門外来へ。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"]},
    {id:"work",title:"仕事・学業への復帰",category:"社会・制度",body:"就労配慮指示書で段階的復職。声・嚥下の配慮を具体的に共有。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"]},
    {id:"financial",title:"公的支援・費用助成",category:"社会・制度",body:"高額療養費・傷病手当金・障害者手帳・医療費控除。相談支援センターへ。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"]},
    {id:"caregiver",title:"家族・介護者の負担軽減",category:"家族",body:"役割分担と“休む日”。訪問看護・レスパイト・情報共有ノート。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"]},
    {id:"sun",title:"皮膚移植部の紫外線対策",category:"皮膚ケア",body:"SPF30+・帽子・スカーフ。色素沈着・瘢痕肥厚の悪化予防。",cancerIds:["oral","nasal","salivary","larynx"]},
    {id:"shoulder",title:"副神経障害の肩痛・挙上制限",category:"運動・拘縮",body:"肩甲帯安定化と可動域。作業療法の代償動作を学ぶ。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","salivary"]},
    {id:"oral-bleeding",title:"口腔出血・潰瘍のセルフケア",category:"口腔ケア",body:"氷で冷却・清潔ガーゼで優しく圧迫。止血困難は受診。抗凝固薬は自己中止しない。",cancerIds:["oral","oropharynx","salivary"]}
  ],
  histologies: []
};

let DATA = { cancers: [], treatments: [], life: [], histologies: [] };

/* ========== 起動 ========== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else { boot(); }

async function boot(){
  await loadData();

  initTabs();
  initHome();
  initHistology();
  initGlobalSearch();
  initCommunity();
  initTreatments();
  initLife();
  renderBookmarks();

  // ハッシュで切替（保険）
  window.addEventListener('hashchange', () => {
    const h = (location.hash||'').replace('#','');
    if (h) switchTab(h);
  });

  // 初回
  const first = (location.hash||'').replace('#','') || 'home';
  switchTab(first);
}

/* ========== データ読み込み ========== */
async function loadData(){
  let ok=false;
  try{
    const res = await fetch('./resources.json?v=3', { cache: 'no-store' });
    if(res.ok){
      const json = await res.json();
      if (json && Array.isArray(json.cancers) && json.cancers.length){
        DATA = { ...json };
        if (!Array.isArray(DATA.histologies)) DATA.histologies = [];
        ok = true;
      }
    }
  }catch(e){ console.warn('[loadData] fetch error', e); }
  if(!ok){
    console.warn('[loadData] using FALLBACK data');
    DATA = { ...DATA_FALLBACK };
  }
}

/* ========== タブ切替（堅牢化） ========== */
function initTabs(){
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const tab = e.currentTarget.dataset.tab;
      if (!tab) return;
      switchTab(tab);
      try { location.hash = '#' + tab; } catch(_) {}
    });
  });
}

function switchTab(tab){
  if (!tab) return;
  document.querySelectorAll('.tab').forEach(s=>s.classList.remove('active'));
  const target = document.getElementById(tab);
  if (target) target.classList.add('active');
  if (tab === 'community') ensureCommunityReady();
}

/* ========== ホーム（部位検索） ========== */
function initHome(){
  const list=document.getElementById('cancer-list');
  const input=document.getElementById('cancer-search');
  if(!list||!input) return;

  const norm=(s)=>(s||'').toString().toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'').replace(/癌/g,'がん').replace(/ガン/g,'がん');

  function render(q=''){
    const f=norm(q); list.innerHTML='';
    const arr=Array.isArray(DATA.cancers)?DATA.cancers:[];
    const items=arr.filter(c=>{
      if(!f) return true;
      const fields=[c.name,...(c.aliases||[]),c.icd||''].map(norm).join('|');
      return fields.includes(f);
    });
    if(!items.length){ list.innerHTML='<li>該当なし。別表記でもお試しください。</li>'; return; }
    items.forEach(c=>{
      const li=document.createElement('li');
      li.innerHTML=`
        <strong>${c.name}</strong> <span class="badge">${c.icd||''}</span>
        <div class="meta">${(c.aliases||[]).join('・')}</div>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
          <a href="#" data-jump="community" data-cancer="${c.id}">コミュニティ</a>
          <a href="#" data-jump="treatments" data-cancer="${c.id}">治療情報</a>
          <a href="#" data-jump="life" data-cancer="${c.id}">生活の工夫</a>
        </div>`;
      list.appendChild(li);
    });
  }
  input.addEventListener('input',e=>render(e.target.value));
  input.addEventListener('compositionend',e=>render(e.target.value));
  list.addEventListener('click',e=>{
    const a=e.target.closest('a[data-jump]'); if(!a) return; e.preventDefault();
    const tab=a.dataset.jump, id=a.dataset.cancer;
    switchTab(tab);
    try { location.hash = '#' + tab; } catch(_) {}
    if(tab==='community') selectCancer(id);
    if(tab==='treatments') filterTreatments(id);
    if(tab==='life') renderLifeList(id, {cat: currentLifeCat(), q: document.getElementById('life-search')?.value||''});
  });
  render('');
}

/* ========== ホーム（組織型）簡易 ========== */
function initHistology(){
  const list=document.getElementById('histo-list');
  const input=document.getElementById('histo-search');
  if(!list||!input) return;
  const arr=Array.isArray(DATA.histologies)?DATA.histologies:[];
  const norm=(s)=>(s||'').toString().toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'').replace(/癌/g,'がん').replace(/ガン/g,'がん');
  function render(q=''){
    const f=norm(q); list.innerHTML='';
    if(!arr.length){ list.innerHTML='<li>組織型データがありません。</li>'; return; }
    const items=arr.filter(h=>{
      if(!f) return true;
      const fields=[h.name,...(h.aliases||[])].map(norm).join('|');
      return fields.includes(f);
    });
    if(!items.length){ list.innerHTML='<li>該当なし。</li>'; return; }
    items.forEach(h=>{
      const li=document.createElement('li');
      li.innerHTML=`<strong>${h.name}</strong><div class="meta">${(h.aliases||[]).join('・')}</div>`;
      list.appendChild(li);
    });
  }
  input.addEventListener('input',e=>render(e.target.value));
  input.addEventListener('compositionend',e=>render(e.target.value));
  render('');
}

/* ========== 統合検索（簡易） ========== */
function initGlobalSearch(){
  const input=document.getElementById('global-search');
  const list=document.getElementById('global-results');
  if(!input||!list) return;
  const norm=(s)=>(s||'').toString().toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'').replace(/癌/g,'がん').replace(/ガン/g,'がん');
  function search(q){
    const f=norm(q);
    const sites=(DATA.cancers||[]).filter(c=>[c.name,...(c.aliases||[]),c.icd||''].map(norm).join('|').includes(f));
    const histos=(DATA.histologies||[]).filter(h=>[h.name,...(h.aliases||[])].map(norm).join('|').includes(f));
    return {sites,histos};
  }
  function render(q=''){
    list.innerHTML=''; if(!q) return;
    const {sites,histos}=search(q);
    if(!sites.length && !histos.length){ list.innerHTML='<li class="meta">候補が見つかりませんでした。</li>'; return; }
    sites.forEach(c=>{
      const li=document.createElement('li');
      li.innerHTML=`<strong>部位：</strong>${c.name}
      <div class="meta">${(c.aliases||[]).join('・')}</div>
      <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
        <a href="#" data-act="community" data-cancer="${c.id}">コミュニティへ</a>
        <a href="#" data-act="life" data-cancer="${c.id}">生活の工夫</a>
      </div>`;
      list.appendChild(li);
    });
    histos.forEach(h=>{
      const li=document.createElement('li');
      li.innerHTML=`<strong>組織型：</strong>${h.name}<div class="meta">${(h.aliases||[]).join('・')}</div>`;
      list.appendChild(li);
    });
  }
  input.addEventListener('input',e=>render(e.target.value));
  input.addEventListener('compositionend',e=>render(e.target.value));
  list.addEventListener('click',e=>{
    const a=e.target.closest('a[data-act]'); if(!a) return; e.preventDefault();
    const act=a.dataset.act, id=a.dataset.cancer||null;
    if(act==='community' && id){ switchTab('community'); try{location.hash='#community';}catch(_){};
      selectCancer(id); }
    if(act==='life'){ switchTab('life'); try{location.hash='#life';}catch(_){};
      renderLifeList(id,{cat:currentLifeCat(), q:document.getElementById('life-search')?.value||''}); }
  });
}

/* ========== コミュニティ ========== */
function initCommunity(){
  const sel=document.getElementById('community-select');
  if(!sel) return;
  if (sel.options && sel.options.length > 1) return;

  const arr=Array.isArray(DATA.cancers)?DATA.cancers:[];
  sel.innerHTML='';
  sel.insertAdjacentHTML('beforeend','<option value="" disabled selected>がんの種類を選んでください</option>');
  arr.forEach(c=>sel.insertAdjacentHTML('beforeend',`<option value="${c.id}">${c.name}</option>`));
  if(!sel.__hnc_bound__){
    sel.addEventListener('change',e=>{
      const id=e.target.value; if(!id) return;
      renderCommunityContent(id);
    });
    sel.__hnc_bound__=true;
  }
}
function ensureCommunityReady(){ initCommunity(); }
function selectCancer(id){
  const sel=document.getElementById('community-select'); if(!sel) return;
  sel.value=id; sel.dispatchEvent(new Event('change'));
}
function renderCommunityContent(cancerId){
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
  const histoCtx = window.HISTO_CONTEXT || null;

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
    ${renderKnowledgeCardsHTML({ cancerId, histologyId: histoCtx })}
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
    await loadTrials(cancerId, { histologyId: histoCtx });
    window.HISTO_CONTEXT = null;
  } catch(e) {}
  try { loadPosts(cancerId); } catch(e){} // 有効化していなければ無視
}

/* ========== 治療リンク ========== */
function initTreatments(){ renderTreatmentsList(); }
function renderTreatmentsList(filterId){
  const ul=document.getElementById('treatment-links'); if(!ul) return; ul.innerHTML='';
  const arr=Array.isArray(DATA.treatments)?DATA.treatments:[];
  const items=arr.filter(t=>!filterId?true:(Array.isArray(t.cancerIds)?t.cancerIds.includes(filterId):true));
  if(!items.length){ ul.innerHTML='<li>該当なし。</li>'; return; }
  items.forEach(t=>{
    const li=document.createElement('li');
    li.innerHTML=`<a href="${t.url}" target="_blank" rel="noopener">${t.title}</a> <span class="meta">— ${t.source||''}</span>`;
    ul.appendChild(li);
  });
}
function filterTreatments(id){ renderTreatmentsList(id); }

/* ========== 生活の工夫（分類/検索/フィルタ） ========== */
const LIFE_CATS = { surgery:'手術', radiation:'放射線治療', chemo:'抗がん剤治療', other:'その他の治療' };

function classifyLifeItem(item){
  const text = `${item.title||''} ${item.category||''} ${item.body||''}`.toLowerCase();
  if (/(術後|縫合|創部|ストーマ|気管孔|瘻|移植|皮弁|開口|構音|嚥下訓練|副神経|肩|瘢痕)/.test(text)) return 'surgery';
  if (/(放射線|照射|粘膜炎|口内炎|唾液|口腔乾燥|皮膚炎|線維化|甲状腺|線量)/.test(text)) return 'radiation';
  if (/(化学療法|抗がん剤|悪心|吐き気|味覚|末梢神経障害|白血球|貧血)/.test(text)) return 'chemo';
  return 'other';
}
const norm = (s)=>(s||'').toString().toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'');

function currentLifeCat(){
  const wrap=document.getElementById('life-filters'); if(!wrap) return 'all';
  const on=wrap.querySelector('button[aria-pressed="true"][data-life-cat]');
  return on ? (on.dataset.lifeCat||'all') : 'all';
}

function initLife(){
  const filters=document.getElementById('life-filters');
  const host=document.getElementById('life-host');
  if(!filters||!host) return;

  if(!filters.__bound__){
    filters.addEventListener('click', e=>{
      const btn=e.target.closest('button[data-life-cat]'); if(!btn) return;
      filters.querySelectorAll('button[data-life-cat]').forEach(b=>b.setAttribute('aria-pressed','false'));
      btn.setAttribute('aria-pressed','true');
      renderLifeList(null, {cat: btn.dataset.lifeCat});
    });
    const search=document.getElementById('life-search');
    if(search){
      const on=()=>renderLifeList(null,{q:search.value});
      search.addEventListener('input',on);
      search.addEventListener('compositionend',on);
    }
    filters.__bound__=true;
  }
  renderLifeList(); // 初回描画
}

function renderLifeList(filterCancerId=null, opt={}){
  const host=document.getElementById('life-host'); if(!host) return;
  const cat = opt.cat || currentLifeCat();
  const q   = norm(opt.q || document.getElementById('life-search')?.value || '');
  const base = Array.isArray(DATA.life) && DATA.life.length ? DATA.life : DATA_FALLBACK.life;
  const enriched = base.map(x => ({...x, tx: x.tx || classifyLifeItem(x)}));
  let items = enriched.slice();
  if (filterCancerId) items = items.filter(x => Array.isArray(x.cancerIds) ? x.cancerIds.includes(filterCancerId) : true);
  if (cat && cat!=='all') items = items.filter(x => (x.tx||'other') === cat);
  if (q) items = items.filter(x => norm(`${x.title} ${x.category} ${x.body}`).includes(q));

  const groups = [
    {key:'surgery',   title:`${LIFE_CATS.surgery}`},
    {key:'radiation', title:`${LIFE_CATS.radiation}`},
    {key:'chemo',     title:`${LIFE_CATS.chemo}`},
    {key:'other',     title:`${LIFE_CATS.other}`}
  ];
  const showGroups = (cat==='all') ? groups.map(g=>g.key) : [cat];
  const byCat = {}; showGroups.forEach(k=>byCat[k]=[]);
  items.forEach(it=>{ const k=(it.tx||'other'); if(byCat[k]) byCat[k].push(it); });

  const html = showGroups.map(key=>{
    const list = byCat[key]||[];
    if(!list.length) return '';
    return `
      <div class="card">
        <h3>${LIFE_CATS[key]}（${list.length}）</h3>
        <ul class="list">
          ${list.map(x=>`
            <li>
              <strong>${escapeHtml(x.title||'')}</strong>
              ${x.category?`<span class="badge">${escapeHtml(x.category)}</span>`:''}
              <div>${escapeHtml(x.body||'')}</div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }).join('');

  host.innerHTML = html || `<div class="card"><div class="meta">該当する項目がありません。</div></div>`;
}
function filterLife(cancerId){
  renderLifeList(cancerId, {cat: currentLifeCat(), q: document.getElementById('life-search')?.value||''});
}

/* ========== ブックマーク（ダミー） ========== */
function renderBookmarks(){
  const ul=document.getElementById('bookmarks'); if(!ul) return;
  ul.innerHTML='<li class="meta">ブックマークは準備中です。</li>';
}

/* ========== ユーティリティ ========== */
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
/* ========== 知識ベース（ガイドライン・PDQ・NCI・NICE・ESMO ほか） ========== */
/** サイト別のベースURL（今後追加しやすいように集約） */
const KB = {
  ncc_ganjoho_headneck: "https://ganjoho.jp/public/cancer/head_neck/",
  nci_pdq_headneck_patient: "https://www.cancer.gov/types/head-and-neck/patient",
  nci_pdq_headneck_hcp: "https://www.cancer.gov/types/head-and-neck/hp",
  cruk_search: (q) => `https://www.cancerresearchuk.org/about-cancer/search?search=${encodeURIComponent(q)}`,
  nice_search: (q) => `https://www.nice.org.uk/search?q=${encodeURIComponent(q)}`,
  esmo_search: (q) => `https://www.esmo.org/search?query=${encodeURIComponent(q)}`,
  asco_cancer_net_search: (q) => `https://www.cancer.net/search?search=${encodeURIComponent(q)}`,
  pubmed: (q) => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`,
  pubmed_latest_3y_rct: (q) =>
    `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}&filter=datesearch.y_3&filter=pubt.clinicaltrial&sort=date`,
  ctgov_search: (q) => `https://clinicaltrials.gov/search?cond=${encodeURIComponent(q)}`,
  accr_foundation: "https://accrf.org/", // Adenoid Cystic Carcinoma
  rce: "https://www.rarecancerseurope.org/", // Rare Cancers Europe
};

/** 部位ID/組織型ID -> 英語クエリ（PubMed/CT.gov/NICE/ESMO 検索語に使う） */
function guessEnglishQuery({ cancerId=null, histologyId=null }) {
  const SITE_EN = {
    oral: "oral cavity cancer",
    oropharynx: "oropharyngeal cancer",
    hypopharynx: "hypopharyngeal cancer",
    nasopharynx: "nasopharyngeal carcinoma",
    larynx: "laryngeal cancer",
    nasal: "paranasal sinus cancer",
    salivary: "salivary gland cancer",
  };
  const HISTO_EN = {
    "adenoid-cystic": "adenoid cystic carcinoma",
    "mucoepidermoid": "mucoepidermoid carcinoma",
    "mucosal-melanoma": "mucosal melanoma",
    "lymphoma": "head and neck lymphoma",
    "sarcoma": "head and neck sarcoma",
  };
  // できるだけ具体（組織型＋部位）→ 片方 → fallback
  if (histologyId && cancerId) {
    return `${HISTO_EN[histologyId] || histologyId} ${SITE_EN[cancerId] || cancerId}`;
  }
  return HISTO_EN[histologyId] || SITE_EN[cancerId] || "head and neck cancer";
}

/** がん種/組織型に応じた推奨リンクを返す */
function buildKnowledgeLinks({ cancerId=null, histologyId=null }) {
  const q = guessEnglishQuery({ cancerId, histologyId });

  const common = [
    { title:"がん情報サービス（頭頸部）", url: KB.ncc_ganjoho_headneck, badge:"日本/患者向け" },
    { title:"NCI PDQ（患者向け）", url: KB.nci_pdq_headneck_patient, badge:"英語/患者向け" },
    { title:"NCI PDQ（医療者向け）", url: KB.nci_pdq_headneck_hcp, badge:"英語/医療者向け" },
    { title:"NICE（英国ガイドライン）検索", url: KB.nice_search(q), badge:"英語/医療者向け" },
    { title:"ESMO（学会ガイドライン）検索", url: KB.esmo_search(q), badge:"英語/医療者向け" },
    { title:"Cancer Research UK（患者向け）検索", url: KB.cruk_search(q), badge:"英語/患者向け" },
    { title:"ASCO Cancer.Net（患者向け）検索", url: KB.asco_cancer_net_search(q), badge:"英語/患者向け" },
  ];

  // 組織型特有の推奨（必要に応じて拡張）
  const extra = [];
  if (histologyId === "adenoid-cystic") {
    extra.push({ title:"Adenoid Cystic Carcinoma Research Foundation", url: KB.accr_foundation, badge:"英語/希少がん" });
  }
  if (histologyId || cancerId === "salivary") {
    extra.push({ title:"Rare Cancers Europe", url: KB.rce, badge:"英語/希少がん" });
  }

  return [...extra, ...common];
}

/** 「最新研究クイック検索」リンクセットを返す（PubMed/CT.gov を自動整備） */
function buildLatestResearchLinks({ cancerId=null, histologyId=null }) {
  const q = guessEnglishQuery({ cancerId, histologyId });
  return [
    { title:"PubMed（直近3年・臨床試験/RCT）", url: KB.pubmed_latest_3y_rct(q) },
    { title:"PubMed（総合）", url: KB.pubmed(q) },
    { title:"ClinicalTrials.gov（該当領域の治験）", url: KB.ctgov_search(q) },
  ];
}

/** 上記をカードとして描画する HTML を返す */
function renderKnowledgeCardsHTML({ cancerId=null, histologyId=null }) {
  const links = buildKnowledgeLinks({ cancerId, histologyId });
  const research = buildLatestResearchLinks({ cancerId, histologyId });

  const linksHTML = links.map(l =>
    `<li><a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.title)}</a> ${l.badge?`<span class="badge">${escapeHtml(l.badge)}</span>`:''}</li>`
  ).join('');

  const researchHTML = research.map(l =>
    `<li><a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.title)}</a></li>`
  ).join('');

  return `
    <div class="card">
      <h3>根拠とガイドライン</h3>
      <ul class="list small">
        ${linksHTML || '<li class="meta">該当リンクは準備中です。</li>'}
      </ul>
      <p class="meta">※ 一部サイトは医療者向け・英語です。患者向けページ（PDQ/Cancer.Net/CRUK 等）も併記しています。</p>
    </div>
    <div class="card">
      <h3>最新研究を探す（自動クエリ）</h3>
      <ul class="list small">
        ${researchHTML}
      </ul>
    </div>
  `;
}
/* ====== 知識ベース：信頼できる一次情報リンク & 最新研究クイック検索 ====== */
const KB = {
  ncc_ganjoho_headneck: "https://ganjoho.jp/public/cancer/head_neck/",
  nci_pdq_headneck_patient: "https://www.cancer.gov/types/head-and-neck/patient",
  nci_pdq_headneck_hcp: "https://www.cancer.gov/types/head-and-neck/hp",
  cruk_search: (q) => `https://www.cancerresearchuk.org/about-cancer/search?search=${encodeURIComponent(q)}`,
  nice_search: (q) => `https://www.nice.org.uk/search?q=${encodeURIComponent(q)}`,
  esmo_search: (q) => `https://www.esmo.org/search?query=${encodeURIComponent(q)}`,
  asco_cancer_net_search: (q) => `https://www.cancer.net/search?search=${encodeURIComponent(q)}`,
  pubmed: (q) => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`,
  pubmed_latest_3y_rct: (q) =>
    `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}&filter=datesearch.y_3&filter=pubt.clinicaltrial&sort=date`,
  ctgov_search: (q) => `https://clinicaltrials.gov/search?cond=${encodeURIComponent(q)}`,
  accr_foundation: "https://accrf.org/",
  rce: "https://www.rarecancerseurope.org/",
};

function guessEnglishQuery({ cancerId=null, histologyId=null }) {
  const SITE_EN = {
    oral: "oral cavity cancer",
    oropharynx: "oropharyngeal cancer",
    hypopharynx: "hypopharyngeal cancer",
    nasopharynx: "nasopharyngeal carcinoma",
    larynx: "laryngeal cancer",
    nasal: "paranasal sinus cancer",
    salivary: "salivary gland cancer",
  };
  const HISTO_EN = {
    "adenoid-cystic": "adenoid cystic carcinoma",
    "mucoepidermoid": "mucoepidermoid carcinoma",
    "mucosal-melanoma": "mucosal melanoma",
    "lymphoma": "head and neck lymphoma",
    "sarcoma": "head and neck sarcoma",
  };
  if (histologyId && cancerId) {
    return `${HISTO_EN[histologyId] || histologyId} ${SITE_EN[cancerId] || cancerId}`;
  }
  return HISTO_EN[histologyId] || SITE_EN[cancerId] || "head and neck cancer";
}

function buildKnowledgeLinks({ cancerId=null, histologyId=null }) {
  const q = guessEnglishQuery({ cancerId, histologyId });

  const common = [
    { title:"がん情報サービス（頭頸部）", url: KB.ncc_ganjoho_headneck, badge:"日本/患者向け" },
    { title:"NCI PDQ（患者向け）", url: KB.nci_pdq_headneck_patient, badge:"英語/患者向け" },
    { title:"NCI PDQ（医療者向け）", url: KB.nci_pdq_headneck_hcp, badge:"英語/医療者向け" },
    { title:"NICE（英国ガイドライン）検索", url: KB.nice_search(q), badge:"英語/医療者向け" },
    { title:"ESMO（学会ガイドライン）検索", url: KB.esmo_search(q), badge:"英語/医療者向け" },
    { title:"Cancer Research UK（患者向け）検索", url: KB.cruk_search(q), badge:"英語/患者向け" },
    { title:"ASCO Cancer.Net（患者向け）検索", url: KB.asco_cancer_net_search(q), badge:"英語/患者向け" },
  ];

  const extra = [];
  if (histologyId === "adenoid-cystic") {
    extra.push({ title:"Adenoid Cystic Carcinoma Research Foundation", url: KB.accr_foundation, badge:"英語/希少がん" });
  }
  if (histologyId || cancerId === "salivary") {
    extra.push({ title:"Rare Cancers Europe", url: KB.rce, badge:"英語/希少がん" });
  }
  return [...extra, ...common];
}

function buildLatestResearchLinks({ cancerId=null, histologyId=null }) {
  const q = guessEnglishQuery({ cancerId, histologyId });
  return [
    { title:"PubMed（直近3年・臨床試験/RCT）", url: KB.pubmed_latest_3y_rct(q) },
    { title:"PubMed（総合）", url: KB.pubmed(q) },
    { title:"ClinicalTrials.gov（該当領域の治験）", url: KB.ctgov_search(q) },
  ];
}

function renderKnowledgeCardsHTML({ cancerId=null, histologyId=null }) {
  const eh = (typeof escapeHtml === 'function')
    ? escapeHtml
    : (s)=>String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const links = buildKnowledgeLinks({ cancerId, histologyId });
  const research = buildLatestResearchLinks({ cancerId, histologyId });

  const linksHTML = links.map(l =>
    `<li><a href="${l.url}" target="_blank" rel="noopener">${eh(l.title)}</a> ${l.badge?`<span class="badge">${eh(l.badge)}</span>`:''}</li>`
  ).join('');

  const researchHTML = research.map(l =>
    `<li><a href="${l.url}" target="_blank" rel="noopener">${eh(l.title)}</a></li>`
  ).join('');

  return `
    <div class="card">
      <h3>根拠とガイドライン</h3>
      <ul class="list small">
        ${linksHTML || '<li class="meta">該当リンクは準備中です。</li>'}
      </ul>
      <p class="meta">※ 一部サイトは医療者向け・英語です。患者向けページ（PDQ/Cancer.Net/CRUK 等）も併記しています。</p>
    </div>
    <div class="card">
      <h3>最新研究を探す（自動クエリ）</h3>
      <ul class="list small">
        ${researchHTML}
      </ul>
    </div>
  `;
}
