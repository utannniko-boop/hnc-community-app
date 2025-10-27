// app.js v36 — CORS対応(ClinicalTrials.govはAllOrigins経由)、コミュニティに組織型も統合、生活の工夫を4分類で厚く

/* =================== フォールバックデータ =================== */
const DATA_FALLBACK = {
  cancers: [
    { id:"oral",        name:"口腔がん（舌・口底など）", icd:"C00-C06",
      aliases:["口腔がん","口腔癌","舌がん","舌癌","口底がん","歯肉がん","oral cancer","C00","C01","C02","C03","C04","C05","C06"],
      topics:[{title:"術後の発音・嚥下リハ",desc:"STと進めるホームエクササイズ"}],
      links:[{title:"がん情報サービス（頭頸部）",url:"https://ganjoho.jp/public/cancer/head_neck/"}]
    },
    { id:"oropharynx",  name:"中咽頭がん", icd:"C10",
      aliases:["中咽頭がん","中咽頭癌","HPV関連がん","oropharyngeal cancer","C10"]
    },
    { id:"hypopharynx", name:"下咽頭がん", icd:"C13",
      aliases:["下咽頭がん","下咽頭癌","hypopharyngeal cancer","C13"]
    },
    { id:"nasopharynx", name:"上咽頭がん", icd:"C11",
      aliases:["上咽頭がん","上咽頭癌","nasopharyngeal carcinoma","NPC","C11"]
    },
    { id:"larynx",      name:"喉頭がん", icd:"C32",
      aliases:["喉頭がん","喉頭癌","laryngeal cancer","glottic","C32"],
      topics:[{title:"発声代替",desc:"電気式人工喉頭・食道発声・シャント"}]
    },
    { id:"nasal",       name:"鼻腔／副鼻腔がん", icd:"C30-C31",
      aliases:["鼻腔がん","副鼻腔がん","上顎洞がん","nasal cavity cancer","paranasal sinus","C30","C31"]
    },
    { id:"salivary",    name:"唾液腺がん", icd:"C07-C08",
      aliases:["唾液腺がん","耳下腺がん","顎下腺","舌下腺","salivary gland cancer","parotid","C07","C08"]
    }
  ],
  treatments: [
    {title:"がん情報サービス（頭頸部）", url:"https://ganjoho.jp/public/cancer/head_neck/", source:"国立がん研究センター",
     cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]},
    {title:"NCI PDQ（患者向け・英）", url:"https://www.cancer.gov/types/head-and-neck", source:"NCI/NIH",
     cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]},
    {title:"NICE ガイドライン（英）", url:"https://www.nice.org.uk/search?q=head+and+neck+cancer", source:"NICE",
     cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]},
    {title:"ESMO Guidelines（英）", url:"https://www.esmo.org/guidelines", source:"ESMO",
     cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]},
    {title:"ASCO（英）", url:"https://www.asco.org/guidelines", source:"ASCO",
     cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]}
  ],
  life: [
    // 手術
    {id:"speech-aids", category:"surgery", title:"構音の工夫（舌・口底切除後）", body:"簡潔な語彙・ゆっくり話す・相手の理解を確認。キーボード/スマホ音声合成も併用。", cancerIds:["oral"]},
    {id:"stoma-care", category:"surgery", title:"気管孔（ストーマ）の日常管理", body:"加湿（HME）・痰の湿性化・シャワーカバー。吸引器具の衛生管理。", cancerIds:["larynx"]},
    {id:"shoulder", category:"surgery", title:"副神経障害の肩のリハ", body:"肩甲帯安定化訓練と可動域維持。作業療法の代償動作指導。", cancerIds:["salivary","oral","oropharynx","hypopharynx"]},
    {id:"trismus", category:"surgery", title:"開口障害対策", body:"術後早期から開口訓練（指タテ・スティック）。“気持ちよい伸張”範囲で。", cancerIds:["oral","oropharynx","nasal","salivary"]},

    // 放射線
    {id:"oral-care-rt", category:"radiation", title:"放射線中の口腔ケア", body:"やわらかめ歯ブラシ＋フッ化物含嗽。無アルコール洗口液。粘膜炎時は圧最小で。", cancerIds:["oral","oropharynx","nasopharynx","larynx","nasal","salivary"]},
    {id:"mucositis-care", category:"radiation", title:"口内炎（粘膜炎）の痛み対策", body:"冷飲食・氷。辛味/酸味/熱い物は回避。局所麻酔含嗽や鎮痛内服を相談。", cancerIds:["oral","oropharynx","nasopharynx"]},
    {id:"xerostomia", category:"radiation", title:"口腔乾燥（唾液減少）", body:"人工唾液スプレー・無糖ガム・寝室の加湿。高濃度フッ化物でう蝕予防。", cancerIds:["oral","oropharynx","nasopharynx","larynx","salivary"]},
    {id:"skin-rt", category:"radiation", title:"放射線皮膚炎のスキンケア", body:"低刺激保湿・摩擦/日光/熱刺激を回避。びらんは指示薬を使用。", cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]},

    // 抗がん剤
    {id:"antiem", category:"chemo", title:"悪心・嘔吐対策", body:"制吐薬の事前内服。少量頻回食、においの強い料理を避ける。水分は冷たい方が入りやすいことも。", cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]},
    {id:"oral-care-chemo", category:"chemo", title:"化学療法中の口腔ケア", body:"うがい・清掃をやさしく頻回に。出血時は受診。", cancerIds:["oral","oropharynx","nasopharynx","salivary"]},
    {id:"nutrition-chemo", category:"chemo", title:"体重減少の予防", body:"少量高カロリーを回数で。栄養補助飲料・油脂追加・間食。摂れない時は早めにNSTへ。", cancerIds:["*"]},

    // その他（共通）
    {id:"dysphagia-st", category:"other", title:"嚥下リハの始め方", body:"STに評価依頼。顎・舌・頸部ROM、嚥下体操、増粘で誤嚥予防。", cancerIds:["oral","oropharynx","hypopharynx","larynx"]},
    {id:"food-mod", category:"other", title:"食形態の調整", body:"とろみ・まとまりやすい食材（卵/豆腐）。二相性は工夫。頸部軽度屈曲で姿勢調整。", cancerIds:["oral","oropharynx","hypopharynx","larynx"]},
    {id:"pain", category:"other", title:"痛みの段階的コントロール", body:"アセトアミノフェン→NSAIDs→オピオイド＋便秘対策。神経障害性痛は補助薬検討。", cancerIds:["*"]},
    {id:"fatigue", category:"other", title:"がん関連疲労（CRF）", body:"短時間の有酸素＋レジスタンス運動を週数回。睡眠衛生。内科的要因（甲状腺/貧血）も確認。", cancerIds:["*"]},
  ],
  histologies: [
    { id:"adenoid-cystic", name:"腺様嚢胞癌（Adenoid cystic carcinoma）", aliases:["腺様嚢胞癌","ACC","adenoid cystic carcinoma","Adenoid-cystic carcinoma"], siteIds:["salivary","nasal","oral"] },
    { id:"mucoepidermoid", name:"粘表皮癌（Mucoepidermoid carcinoma）", aliases:["粘表皮癌","MEC","mucoepidermoid carcinoma"], siteIds:["salivary","nasal","oral","oropharynx"] },
    { id:"mucosal-melanoma", name:"悪性黒色腫（粘膜）", aliases:["悪性黒色腫","mucosal melanoma","mucosal malignant melanoma"], siteIds:["nasal","oral","oropharynx"] },
    { id:"lymphoma", name:"リンパ腫", aliases:["リンパ腫","lymphoma"], siteIds:["oropharynx","nasopharynx"] },
    { id:"sarcoma", name:"肉腫", aliases:["肉腫","sarcoma","横紋筋肉腫","骨肉腫","線維肉腫"], siteIds:["oral","nasal","oropharynx"] }
  ]
};

/* =================== 状態 =================== */
let DATA = { cancers: [], treatments: [], life: [], histologies: [] };
let CURRENT_CANCER_ID = null;     // 部位ID
let CURRENT_HISTO_ID  = null;     // 組織型ID
let __TRIALS_CACHE = [];

/* =================== 起動 =================== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

async function boot(){
  await loadData();
  initTabRouting();
  initHome();
  initHistologyHome();
  initGlobalSearch();
  initCommunity();
  initTreatments();
  initLife();
  renderBookmarks();
  ensureCommunityPopulated();
}

/* =================== データ読み込み =================== */
async function loadData(){
  let ok = false;
  try{
    const res = await fetch('./resources.json?v=3', { cache:'no-store' });
    if(res.ok){
      const json = await res.json();
      if (json && Array.isArray(json.cancers) && json.cancers.length){
        DATA = { ...json };
        if (!Array.isArray(DATA.histologies)) DATA.histologies = DATA_FALLBACK.histologies;
        if (!Array.isArray(DATA.life)) DATA.life = DATA_FALLBACK.life;
        ok = true;
      }
    }
  }catch(e){ console.warn('[loadData] fetch error', e); }
  if(!ok){ DATA = { ...DATA_FALLBACK }; }
}

/* =================== タブ切替 =================== */
function initTabRouting(){
  const applyTab = (tab) => {
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    document.getElementById(tab)?.classList.add('active');
    document.querySelectorAll('.tab-btn,[data-tab]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));
    if (tab === 'community' && (CURRENT_CANCER_ID || CURRENT_HISTO_ID)) prepareTrialsBox();
  };
  const switchTab = (tab) => {
    if (!tab) return;
    applyTab(tab);
    const want = '#'+tab;
    if (location.hash !== want) history.replaceState(null, '', want);
  };
  // ボタン
  document.body.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-tab]'); if(!btn) return;
    e.preventDefault();
    switchTab(btn.dataset.tab);
  });
  // ハッシュ
  window.addEventListener('hashchange', ()=>{
    const tab = (location.hash||'#home').slice(1);
    applyTab(tab);
  });
  // 初回
  applyTab((location.hash||'#home').slice(1));
}

/* =================== ホーム（部位） =================== */
function initHome(){
  const list = document.getElementById('cancer-list');
  const input = document.getElementById('cancer-search');
  if(!list || !input) return;

  const norm = s => String(s||'').toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'').replace(/癌/g,'がん');
  const render = (q='')=>{
    const f = norm(q); list.innerHTML = '';
    const arr = DATA.cancers || [];
    const items = arr.filter(c => !f || [c.name,...(c.aliases||[]),c.icd||''].map(norm).join('|').includes(f));
    if (!items.length){ list.innerHTML = '<li>該当なし</li>'; return; }
    items.forEach(c=>{
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${c.name}</strong> <span class="badge">${c.icd||''}</span>
        <div class="meta">${(c.aliases||[]).join('・')}</div>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
          <a href="#" data-jump="community" data-cancer="${c.id}">コミュニティ</a>
          <a href="#" data-jump="treatments" data-cancer="${c.id}">治療情報</a>
          <a href="#" data-jump="life" data-cancer="${c.id}">生活の工夫</a>
        </div>`;
      list.appendChild(li);
    });
  };
  input.addEventListener('input', e=>render(e.target.value));
  input.addEventListener('compositionend', e=>render(e.target.value));
  list.addEventListener('click', e=>{
    const a=e.target.closest('a[data-jump]'); if(!a) return; e.preventDefault();
    const tab=a.dataset.jump, id=a.dataset.cancer;
    history.replaceState(null,'','#'+tab);
    document.querySelector(`[data-tab="${tab}"]`)?.click();
    if (tab==='community') selectCommunity({ cancerId:id });
    if (tab==='treatments') filterTreatments(id);
    if (tab==='life') filterLife(id);
  });
  render('');
}

/* =================== ホーム（組織型） =================== */
function initHistologyHome(){
  const list = document.getElementById('histo-list');
  const input = document.getElementById('histo-search');
  if(!list || !input) return;
  const norm = s => String(s||'').toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'').replace(/癌/g,'がん');
  const render = (q='')=>{
    const f = norm(q); list.innerHTML = '';
    const arr = DATA.histologies || [];
    const items = arr.filter(h => !f || [h.name,...(h.aliases||[])].map(norm).join('|').includes(f));
    if (!items.length){ list.innerHTML='<li>該当なし</li>'; return; }
    items.forEach(h=>{
      const siteBtns = (h.siteIds||[]).map(id=>{
        const site = (DATA.cancers||[]).find(c=>c.id===id);
        return site ? `<button class="tab-btn" data-to="community" data-cancer="${site.id}" data-histology="${h.id}">${site.name}</button>` : '';
      }).join(' ');
      const li=document.createElement('li');
      li.innerHTML = `
        <strong>${h.name}</strong>
        <div class="meta">${(h.aliases||[]).join('・')}</div>
        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">${siteBtns}</div>`;
      list.appendChild(li);
    });
  };
  input.addEventListener('input', e=>render(e.target.value));
  input.addEventListener('compositionend', e=>render(e.target.value));
  list.addEventListener('click', e=>{
    const b=e.target.closest('button[data-to="community"]'); if(!b) return; e.preventDefault();
    document.querySelector('[data-tab="community"]')?.click();
    selectCommunity({ cancerId:b.dataset.cancer, histologyId:b.dataset.histology });
  });
  render('');
}

/* =================== 統合検索 =================== */
function initGlobalSearch(){
  const input = document.getElementById('global-search');
  const list  = document.getElementById('global-results');
  if(!input||!list) return;

  const norm = s => String(s||'').toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'').replace(/癌/g,'がん');
  const search = (q)=>{
    const f = norm(q);
    const sites = (DATA.cancers||[]).filter(c => [c.name,...(c.aliases||[]),c.icd||''].map(norm).join('|').includes(f));
    const histos= (DATA.histologies||[]).filter(h => [h.name,...(h.aliases||[])].map(norm).join('|').includes(f));
    return {sites,histos};
  };
  const render = (q='')=>{
    list.innerHTML=''; if(!q) return;
    const {sites,histos}=search(q);
    if(!sites.length && !histos.length){ list.innerHTML='<li class="meta">候補が見つかりませんでした。</li>'; return; }
    sites.forEach(c=>{
      const li=document.createElement('li');
      li.innerHTML=`
        <strong>部位：</strong>${c.name}
        <div class="meta">${(c.aliases||[]).join('・')}</div>
        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
          <a href="#" data-act="community" data-cancer="${c.id}">コミュニティ</a>
          <a href="#" data-act="trials" data-cancer="${c.id}">治験を探す</a>
        </div>`;
      list.appendChild(li);
    });
    histos.forEach(h=>{
      const li=document.createElement('li');
      const btns=(h.siteIds||[]).map(id=>{
        const s=(DATA.cancers||[]).find(x=>x.id===id);
        return s?`<a href="#" data-act="trials" data-cancer="${s.id}" data-histology="${h.id}">${s.name}で治験</a>`:'';
      }).join(' ');
      li.innerHTML=`
        <strong>組織型：</strong>${h.name}
        <div class="meta">${(h.aliases||[]).join('・')}</div>
        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">${btns||`<a href="#" data-act="trials" data-histology="${h.id}">治験を探す</a>`}</div>`;
      list.appendChild(li);
    });
  };
  input.addEventListener('input', e=>render(e.target.value));
  input.addEventListener('compositionend', e=>render(e.target.value));
  list.addEventListener('click', e=>{
    const a=e.target.closest('a[data-act]'); if(!a) return; e.preventDefault();
    const act=a.dataset.act, cancerId=a.dataset.cancer||null, histologyId=a.dataset.histology||null;
    document.querySelector('[data-tab="community"]')?.click();
    if (act==='community' && cancerId){ selectCommunity({ cancerId }); return; }
    if (act==='trials'){ selectCommunity({ cancerId, histologyId }); }
  });
}

/* =================== コミュニティ（部位/組織型を同じセレクトに） =================== */
function initCommunity(){
  const sel = document.getElementById('community-select');
  if(!sel) return;
  populateCommunitySelect();

  if (!sel.__bound__) {
    sel.addEventListener('change', (e)=>{
      const v = e.target.value; if(!v) return;
      const [kind,id] = v.split(':'); // kind = 'site' or 'histo'
      if (kind==='site')  selectCommunity({ cancerId:id, histologyId:null });
      if (kind==='histo') selectCommunity({ cancerId:null, histologyId:id });
    });
    sel.__bound__ = true;
  }
}

function populateCommunitySelect(){
  const sel = document.getElementById('community-select'); if(!sel) return;
  const sites = DATA.cancers || []; const histos = DATA.histologies || [];
  sel.innerHTML='';
  sel.insertAdjacentHTML('beforeend','<option value="" disabled selected>がんの種類（部位/組織型）を選んでください</option>');
  // 部位
  sel.insertAdjacentHTML('beforeend','<optgroup label="部位（Site）">');
  sites.forEach(c=>{
    sel.insertAdjacentHTML('beforeend', `<option value="site:${c.id}">${c.name}</option>`);
  });
  sel.insertAdjacentHTML('beforeend','</optgroup>');
  // 組織型
  sel.insertAdjacentHTML('beforeend','<optgroup label="組織型（Histology）">');
  histos.forEach(h=>{
    sel.insertAdjacentHTML('beforeend', `<option value="histo:${h.id}">${h.name}</option>`);
  });
  sel.insertAdjacentHTML('beforeend','</optgroup>');
}

function ensureCommunityPopulated(){
  const sel = document.getElementById('community-select');
  if (sel && (!sel.options || sel.options.length < 3)) populateCommunitySelect();
}

function selectCommunity({ cancerId=null, histologyId=null } = {}){
  CURRENT_CANCER_ID = cancerId || null;
  CURRENT_HISTO_ID  = histologyId || null;

  // セレクト反映
  const sel = document.getElementById('community-select');
  if (sel){
    const v = cancerId ? `site:${cancerId}` : (histologyId ? `histo:${histologyId}` : '');
    if (v) sel.value = v;
  }
  renderCommunityContent();
}

function renderCommunityContent(){
  const wrap = document.getElementById('community-content'); if(!wrap) return;

  // 解決：表示テキスト
  let titleHTML = '';
  let topicsHTML = '<li>トピックは準備中です。</li>';
  let linksHTML  = '<li>関連リンクは準備中です。</li>';
  let badge = '';

  if (CURRENT_CANCER_ID){
    const c = (DATA.cancers||[]).find(x=>x.id===CURRENT_CANCER_ID);
    if (c){
      titleHTML = `${c.name} <span class="badge">${c.icd||''}</span>`;
      badge = c.icd||'';
      if (c.topics && c.topics.length){
        topicsHTML = c.topics.map(t=>`
          <li><strong>${t.title}</strong>${t.desc?`<div class="meta">${t.desc}</div>`:''}</li>
        `).join('');
      }
      if (c.links && c.links.length){
        linksHTML = c.links.map(l=>`<li><a href="${l.url}" target="_blank" rel="noopener">${l.title||l.url}</a></li>`).join('');
      }
    }
  } else if (CURRENT_HISTO_ID){
    const h = (DATA.histologies||[]).find(x=>x.id===CURRENT_HISTO_ID);
    if (h){
      titleHTML = `${h.name}`;
      topicsHTML = `
        <li class="meta">該当部位：${(h.siteIds||[]).map(id=>(DATA.cancers||[]).find(c=>c.id===id)?.name||id).join('・')}</li>
      `;
      const pub = buildPubmedLinks({ histologyId: CURRENT_HISTO_ID });
      linksHTML = pub.map(a=>`<li><a href="${a.url}" target="_blank" rel="noopener">${a.title}</a></li>`).join('');
    }
  }

  // ルート描画
  wrap.innerHTML = `
    <div class="card">
      <h3>${titleHTML || '選択してください'}</h3>
      ${CURRENT_HISTO_ID ? `<div class="meta">組織型を選択中</div>` : CURRENT_CANCER_ID ? `<div class="meta">部位を選択中</div>`:''}
    </div>
    <div class="card">
      <h3>話題・トピック</h3>
      <ul class="list small">${topicsHTML}</ul>
    </div>
    <div class="card">
      <h3>根拠とガイドライン</h3>
      <ul class="list small">
        ${buildGuidelineLinks({ cancerId: CURRENT_CANCER_ID, histologyId: CURRENT_HISTO_ID }).map(x=>`<li><a href="${x.url}" target="_blank" rel="noopener">${x.title}</a> <span class="meta">— ${x.source}</span></li>`).join('')}
      </ul>
    </div>
    <div class="card">
      <h3>関連リンク</h3>
      <ul class="list small">${linksHTML}</ul>
    </div>
  `;

  // 治験を読み込み
  prepareTrialsBox();
  loadTrials({ cancerId: CURRENT_CANCER_ID, histologyId: CURRENT_HISTO_ID }).catch(()=>{});
}

/* =================== 治療リンク =================== */
function initTreatments(){ renderTreatmentsList(); }
function renderTreatmentsList(filterId){
  const ul = document.getElementById('treatment-links'); if(!ul) return;
  ul.innerHTML = '';
  const arr = DATA.treatments || [];
  const items = arr.filter(t => !filterId ? true : (Array.isArray(t.cancerIds) ? t.cancerIds.includes(filterId) : true));
  if (!items.length){ ul.innerHTML='<li>該当リンクなし</li>'; return; }
  items.forEach(t=>{
    const li=document.createElement('li');
    li.innerHTML = `<a href="${t.url}" target="_blank" rel="noopener">${t.title}</a> <span class="meta">— ${t.source||''}</span>`;
    ul.appendChild(li);
  });
}
function filterTreatments(id){ renderTreatmentsList(id); }

/* =================== 生活の工夫（4分類タブ） =================== */
// ここだけ全置換してください
function initLife(){
  const tabsRoot = document.querySelector('.life-tabs');
  const content  = document.getElementById('life-content');
  if (!tabsRoot || !content) return;

  // イベント委任で確実に拾う
  tabsRoot.addEventListener('click', (e)=>{
    const btn = e.target.closest('.life-tab-btn'); 
    if (!btn) return;
    // active切替
    tabsRoot.querySelectorAll('.life-tab-btn').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    // 描画
    renderLifeList(btn.dataset.life);
  });

  // 初期選択（最初のボタン）
  const first = tabsRoot.querySelector('.life-tab-btn');
  if (first) { 
    first.classList.add('active');
    renderLifeList(first.dataset.life);
  }

  // メインタブが life になった時に再描画（SPで戻ってきた時など）
  window.addEventListener('hashchange', ()=>{
    const tab = (location.hash || '#').slice(1);
    if (tab === 'life') {
      const current = tabsRoot.querySelector('.life-tab-btn.active') || tabsRoot.querySelector('.life-tab-btn');
      if (current) renderLifeList(current.dataset.life);
    }
  });
}
function renderLifeList(cat, filterCancerId=null){
  const box = document.getElementById('life-content'); if(!box) return;
  const arr = DATA.life || [];
  const items = arr.filter(x => (x.category===cat) && (!filterCancerId || (x.cancerIds||[]).includes(filterCancerId) || (x.cancerIds||[]).includes('*')));
  if (!items.length){ box.innerHTML = `<div class="meta">この分類のヒントは準備中です。</div>`; return; }
  box.innerHTML = `
    <ul class="list">
      ${items.map(x=>`
        <li>
          <strong>${x.title}</strong>
          ${x.category?`<div class="meta">${labelLifeCat(x.category)}</div>`:''}
          <div>${x.body||''}</div>
        </li>
      `).join('')}
    </ul>
  `;
}
function filterLife(cancerId){
  // 生活タブへ移動して、現在のサブタブを再描画（部位で絞り込み）
  const active = document.querySelector('.life-tab-btn.active') || document.querySelector('.life-tab-btn[data-life="surgery"]');
  if (active){ renderLifeList(active.dataset.life, cancerId); }
}
function labelLifeCat(c){
  return ({surgery:'手術', radiation:'放射線治療', chemo:'抗がん剤治療', other:'その他'})[c] || c;
}

/* =================== ブックマーク（ダミー） =================== */
function renderBookmarks(){
  const ul=document.getElementById('bookmarks'); if(!ul) return;
  ul.innerHTML='<li class="meta">ブックマークは準備中です。</li>';
}

/* =================== ClinicalTrials.gov（CORS対応：AllOrigins経由） =================== */
const EN_SYNONYMS = {
  oral:['oral cavity cancer','tongue cancer','floor of mouth cancer','buccal mucosa cancer','gingival cancer'],
  oropharynx:['oropharyngeal cancer','tonsil cancer','base of tongue cancer'],
  hypopharynx:['hypopharyngeal cancer','pyriform sinus','postcricoid'],
  nasopharynx:['nasopharyngeal carcinoma','NPC'],
  larynx:['laryngeal cancer','glottic','supraglottic','subglottic'],
  nasal:['nasal cavity cancer','paranasal sinus cancer','maxillary sinus cancer','ethmoid sinus cancer'],
  salivary:['salivary gland cancer','parotid gland cancer','submandibular gland cancer','sublingual gland cancer'],
  'adenoid-cystic':['adenoid cystic carcinoma','ACC'],
  'mucoepidermoid':['mucoepidermoid carcinoma','MEC'],
  'mucosal-melanoma':['mucosal melanoma','malignant melanoma of mucosa'],
  lymphoma:['head and neck lymphoma'],
  sarcoma:['head and neck sarcoma','rhabdomyosarcoma','fibrosarcoma','osteosarcoma']
};

const TRIAL_QUERY_SITE = {
  oral: 'oral+OR+"tongue+cancer"+OR+"floor+of+mouth"',
  oropharynx: 'oropharyngeal+OR+"base+of+tongue"+OR+tonsil',
  hypopharynx: 'hypopharyngeal+OR+postcricoid+OR+"pyriform+sinus"',
  nasopharynx: 'nasopharyngeal+OR+NPC',
  larynx: 'laryngeal+OR+glottic+OR+supraglottic+OR+subglottic',
  nasal: '"nasal+cavity"+OR+"paranasal+sinus"+OR+"maxillary+sinus"',
  salivary: '"salivary+gland"+OR+parotid+OR+submandibular+OR+sublingual',
  _default: '"Head+and+Neck+Cancer"'
};
const TRIAL_QUERY_HISTO = {
  'adenoid-cystic':'"adenoid+cystic+carcinoma"',
  'mucoepidermoid':'"mucoepidermoid+carcinoma"',
  'mucosal-melanoma':'"mucosal+melanoma"+OR+"malignant+melanoma+of+mucosa"',
  'lymphoma':'"head+and+neck"+lymphoma',
  'sarcoma':'"head+and+neck"+sarcoma'
};

function buildTrialsExprList({ cancerId=null, histologyId=null } = {}){
  const exprs = new Set();
  if (histologyId && TRIAL_QUERY_HISTO[histologyId]) exprs.add(TRIAL_QUERY_HISTO[histologyId]);
  if (cancerId    && TRIAL_QUERY_SITE[cancerId])      exprs.add(TRIAL_QUERY_SITE[cancerId]);
  // 同義語
  const syns=[];
  if (histologyId && EN_SYNONYMS[histologyId]) syns.push(...EN_SYNONYMS[histologyId]);
  if (cancerId    && EN_SYNONYMS[cancerId])    syns.push(...EN_SYNONYMS[cancerId]);
  if (syns.length){
    exprs.add(syns.map(s=>`"${encodeURIComponent(String(s).replace(/\s+/g,'+'))}"`).join('+OR+'));
  }
  exprs.add(TRIAL_QUERY_SITE._default);
  return Array.from(exprs);
}

function prepareTrialsBox(){
  const box = document.getElementById('trials'); if(!box) return;
  box.innerHTML = '';
  const ctrl = document.createElement('div');
  ctrl.className='meta'; ctrl.style.margin='8px 0 12px';
  ctrl.innerHTML = `
    <label style="margin-right:12px;"><input type="checkbox" id="flt-recruit" checked/> 募集中のみ</label>
    <label style="margin-right:12px;"><input type="checkbox" id="flt-drug" checked/> 薬剤など介入あり</label>
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
  const host = document.createElement('div'); host.id='trials-list-host'; host.innerHTML='<div class="meta">読み込み中…</div>';
  box.appendChild(ctrl); box.appendChild(host);

  ctrl.addEventListener('change', ()=> rerenderTrialsList());
}

async function loadTrials({ cancerId=null, histologyId=null } = {}){
  const host = document.getElementById('trials-list-host'); if(!host) return;
  host.innerHTML = '<div class="meta">読み込み中…</div>';

  try{
    const trials = await fetchTrialsAllOrigins({ cancerId, histologyId });
    __TRIALS_CACHE = trials.slice();
    if (!trials.length){ renderTrialsFallback({ cancerId, histologyId }); return; }
    renderTrialsList(trials);
  }catch(e){
    console.warn('trials error', e);
    renderTrialsFallback({ cancerId, histologyId });
  }
}

async function fetchTrialsAllOrigins({ cancerId=null, histologyId=null } = {}){
  const exprList = buildTrialsExprList({ cancerId, histologyId });
  const fields = [
    'NCTId','BriefTitle','Condition','OverallStatus','StudyType','Phase',
    'InterventionType','InterventionName','LeadSponsorName',
    'LocationCountry','LocationCity','LocationState','StartDate','PrimaryCompletionDate',
    'LastUpdatePostDate'
  ].join(',');
  const maxPerQuery = 12;
  const proxy = 'https://api.allorigins.win/get?url=';

  const all = [];
  for (const expr of exprList){
    const api = `https://clinicaltrials.gov/api/query/study_fields?expr=${expr}&fields=${fields}&min_rnk=1&max_rnk=${maxPerQuery}&fmt=json`;
    const url = proxy + encodeURIComponent(api);
    const res = await fetch(url, { cache:'no-store' });
    if (!res.ok) continue;
    const outer = await res.json(); // { contents: string }
    const json = JSON.parse(outer.contents || '{}');
    const rows = json?.StudyFieldsResponse?.StudyFields || [];
    rows.forEach(r=>{
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
  // uniq by NCT
  const seen=new Set(); const uniq=[];
  for (const t of all){ if(!t.id || seen.has(t.id)) continue; seen.add(t.id); uniq.push(t); }

  // score
  const score = (t)=>{
    let s=0;
    if (/Recruiting|Enrolling|Not\s+yet\s+recruiting/i.test(t.status||'')) s+=50;
    if ((t.interventionTypes||[]).some(x=>/Drug|Biological|Device|Combination Product/i.test(x))) s+=20;
    if ((t.interventions||[]).length) s+=10;
    if ((t.countries||[]).some(c=>/Japan/i.test(c))) s+=15;
    if (/Phase\s*(2|3|4)/i.test(t.phase||'')) s+=10;
    const d=Date.parse(t.updated||t.start||'')||0;
    s+=Math.min(20, Math.max(0, Math.floor((d - 1700000000000)/(1000*60*60*24*30))));
    return s;
  };
  uniq.sort((a,b)=>score(b)-score(a));
  return uniq.slice(0,24);
}

function rerenderTrialsList(){
  const host = document.getElementById('trials-list-host'); if(!host) return;
  renderTrialsList(__TRIALS_CACHE);
}

function trialsPassFilters(t){
  const recruit = document.getElementById('flt-recruit')?.checked;
  const drug    = document.getElementById('flt-drug')?.checked;
  const phaseMin= document.getElementById('flt-phase')?.value || 'Any';

  if (recruit && !/Recruiting|Enrolling|Not\s+yet\s+recruiting/i.test(t.status||'')) return false;
  if (drug && !((t.interventionTypes||[]).some(x=>/Drug|Biological|Device|Combination Product/i.test(x)))) return false;
  const phNum=(t.phase||'').match(/(\d)/)?.[1] || null;
  if (phaseMin!=='Any' && phNum && Number(phNum)<Number(phaseMin)) return false;
  return true;
}

function renderTrialsList(trials){
  const host = document.getElementById('trials-list-host'); if(!host) return;
  const filtered = trials.filter(trialsPassFilters);
  if (!filtered.length){ host.innerHTML='<div class="meta">現在の条件では表示できる治験がありません。</div>'; return; }
  host.innerHTML = `
    <ul class="list small">
      ${filtered.map(t=>{
        const drugBadge=(t.interventionTypes||[]).some(x=>/Drug|Biological/i.test(x))?`<span class="badge">Drug</span>`:'';
        const jpBadge=(t.countries||[]).some(c=>/Japan/i.test(c))?`<span class="badge">JP</span>`:'';
        const ph=t.phase?`／ <span class="badge">${escapeHtml(t.phase)}</span>`:'';
        return `
          <li>
            <a href="https://clinicaltrials.gov/study/${t.id}" target="_blank" rel="noopener"><strong>${escapeHtml(t.title||t.id)}</strong></a>
            <div class="meta">ID: ${t.id} ／ 状況: ${escapeHtml(t.status||'')} ${ph} ／ 更新: ${escapeHtml(t.updated||'')} ${drugBadge} ${jpBadge}</div>
            ${t.sponsor?`<div class="meta">主担当機関: ${escapeHtml(t.sponsor)}</div>`:''}
            ${t.interventions && t.interventions.length?`<div class="meta">介入: <strong>${t.interventions.map(escapeHtml).join(' / ')}</strong></div>`:''}
            ${t.cond?`<div class="meta">対象: ${escapeHtml(t.cond)}</div>`:''}
          </li>`;
      }).join('')}
    </ul>
  `;
}

function renderTrialsFallback({ cancerId=null, histologyId=null } = {}){
  const box = document.getElementById('trials'); if(!box) return;
  const host = document.getElementById('trials-list-host');
  if (host) host.innerHTML = '<div class="meta">API取得に失敗しました。</div>';

  const cancer = (DATA.cancers||[]).find(c=>c.id===cancerId);
  const histo  = (DATA.histologies||[]).find(h=>h.id===histologyId);

  const SITE_EN_LABELS = {
    oral:'oral cavity cancer', oropharynx:'oropharyngeal cancer', hypopharynx:'hypopharyngeal cancer',
    nasopharynx:'nasopharyngeal carcinoma', larynx:'laryngeal cancer', nasal:'nasal cavity or paranasal sinus cancer',
    salivary:'salivary gland cancer'
  };

  const narrowJP = histo?.aliases?.[0] || histo?.name || cancer?.name || '頭頸部がん';
  let narrowEN = 'head and neck cancer';
  if (histo)  narrowEN = (histo.aliases||[]).find(a=>/[a-z]/i.test(a)) || (histo.name.match(/\((.+?)\)/)?.[1]) || narrowEN;
  else if(cancer) narrowEN = SITE_EN_LABELS[cancer.id] || narrowEN;

  let broadJP='頭頸部がん', broadEN='head and neck cancer';
  if (histologyId==='adenoid-cystic'||histologyId==='mucoepidermoid'||cancerId==='salivary'){ broadJP='唾液腺がん'; broadEN='salivary gland cancer'; }

  const qJPa=encodeURIComponent(`${narrowJP} 治験`);
  const qENa=encodeURIComponent(`${narrowEN} clinical trial`);
  const qJPb=encodeURIComponent(`${broadJP} 治験`);
  const qENb=encodeURIComponent(`${broadEN} clinical trial`);

  box.insertAdjacentHTML('beforeend', `
    <div class="card">
      <h3>自動検索リンク（補助）</h3>
      <ul class="list small">
        <li><strong>狭い：</strong> <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qJPa}">Google（日本語）</a> ／ <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qENa}">Google（英語）</a> ／ <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${qENa}">CT.gov</a></li>
        <li><strong>広い：</strong> <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qJPb}">Google（日本語）</a> ／ <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qENb}">Google（英語）</a> ／ <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${qENb}">CT.gov</a></li>
      </ul>
    </div>
  `);
}

/* =================== ガイドライン＆PubMedリンク自動生成 =================== */
function buildGuidelineLinks({ cancerId=null, histologyId=null } = {}){
  const base = [
    {title:'がん情報サービス（頭頸部）', url:'https://ganjoho.jp/public/cancer/head_neck/', source:'国立がん研究センター'},
    {title:'NCI PDQ（患者向け）', url:'https://www.cancer.gov/types/head-and-neck/patient', source:'NCI/NIH'},
    {title:'NCI PDQ（医療者向け）', url:'https://www.cancer.gov/types/head-and-neck/hp', source:'NCI/NIH'},
    {title:'NICE ガイドライン検索', url:'https://www.nice.org.uk/search?q=head+and+neck+cancer', source:'NICE'},
    {title:'ESMO Guidelines', url:'https://www.esmo.org/guidelines', source:'ESMO'},
    {title:'ASCO Guidelines', url:'https://www.asco.org/guidelines', source:'ASCO'},
    {title:'CRUK（患者向け・英）', url:'https://www.cancerresearchuk.org/about-cancer/head-neck-cancers', source:'Cancer Research UK'}
  ];
  // PubMed（直近3年の臨床試験/RCT）
  const now = new Date();
  const fromY = now.getFullYear()-3;
  const term = (()=> {
    if (histologyId){
      const h = (DATA.histologies||[]).find(x=>x.id===histologyId);
      const en = (h?.aliases||[]).find(a=>/[a-z]/i.test(a)) || (h?.name||'');
      return encodeURIComponent(`${en} AND (clinical trial[pt] OR randomized controlled trial[pt]) AND ${fromY}:${now.getFullYear()}[dp]`);
    }
    if (cancerId){
      const m = {oral:'oral cavity cancer',oropharynx:'oropharyngeal cancer',hypopharynx:'hypopharyngeal cancer',nasopharynx:'nasopharyngeal carcinoma',larynx:'laryngeal cancer',nasal:'paranasal sinus cancer',salivary:'salivary gland cancer'};
      return encodeURIComponent(`${m[cancerId]||'head and neck cancer'} AND (clinical trial[pt] OR randomized controlled trial[pt]) AND ${fromY}:${now.getFullYear()}[dp]`);
    }
    return encodeURIComponent(`head and neck cancer AND (clinical trial[pt] OR randomized controlled trial[pt]) AND ${fromY}:${now.getFullYear()}[dp]`);
  })();
  base.push({title:'PubMed（直近3年の臨床試験/RCT 検索）', url:`https://pubmed.ncbi.nlm.nih.gov/?term=${term}`, source:'NIH/NLM'});
  // ClinicalTrials.gov（検索ページ）
  const ctTerm = encodeURIComponent((()=>{
    if (histologyId){
      const h = (DATA.histologies||[]).find(x=>x.id===histologyId);
      const en = (h?.aliases||[]).find(a=>/[a-z]/i.test(a)) || (h?.name||'');
      return en.replace(/\s+/g,'+');
    }
    if (cancerId){
      const m = {oral:'oral cavity cancer',oropharynx:'oropharyngeal cancer',hypopharynx:'hypopharyngeal cancer',nasopharynx:'nasopharyngeal carcinoma',larynx:'laryngeal cancer',nasal:'paranasal sinus cancer',salivary:'salivary gland cancer'};
      return (m[cancerId]||'head and neck cancer').replace(/\s+/g,'+');
    }
    return 'Head+and+Neck+Cancer';
  })());
  base.push({title:'ClinicalTrials.gov（検索）', url:`https://clinicaltrials.gov/search?cond=${ctTerm}`, source:'CT.gov'});
  return base;
}

function buildPubmedLinks({ histologyId=null } = {}){
  const now = new Date(), fromY = now.getFullYear()-3;
  const h = (DATA.histologies||[]).find(x=>x.id===histologyId);
  const en = (h?.aliases||[]).find(a=>/[a-z]/i.test(a)) || (h?.name||'');
  const term = encodeURIComponent(`${en} AND (clinical trial[pt] OR randomized controlled trial[pt]) AND ${fromY}:${now.getFullYear()}[dp]`);
  return [
    { title:'PubMed：最近3年の臨床試験/RCT', url:`https://pubmed.ncbi.nlm.nih.gov/?term=${term}` }
  ];
}

/* =================== ユーティリティ =================== */
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
