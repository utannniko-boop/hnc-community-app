/* =========================================================
   HNC Community Hub - app.js (TDZ/再定義対策版)
   ポイント:
   1) 最上部でグローバル名前空間 HNC を固定
   2) HNC.DATA を即初期化（var で TDZ 無し）
   3) 以後は const/let の再定義をしない
   4) DOMContentLoaded 後に boot()
========================================================= */

/* 1) 名前空間の固定（再読込でも上書きしない） */
window.HNC = window.HNC || {};

/* 2) DATA を最初に初期化（TDZ回避のため var + 直接代入） */
var DATA = {
  cancers: [],
  histologies: [],
  treatments: [],
  life: []
};

/* 3) 他のグローバル状態 */
let __TRIALS_CACHE = [];
let CURRENT_CANCER_ID = null;
let HISTO_CONTEXT = null;

/* ---------- Fallback データ（resources.json が無い/読めない時に使用） ---------- */
const DATA_FALLBACK = {
  cancers: [
    { id:"oral",        name:"口腔がん（舌・口底など）", aliases:["口腔癌","舌がん","舌癌","歯肉がん","口底がん","oral cancer","C00","C01","C02","C03","C04","C05","C06"], icd:"C00-C06",
      topics:[{title:"術後の発音・嚥下リハの基本",desc:"STと進めるホームエクササイズ"}],
      links:[{title:"がん情報サービス（頭頸部）",url:"https://ganjoho.jp/public/cancer/head_neck/"}]
    },
    { id:"oropharynx",  name:"中咽頭がん", aliases:["中咽頭癌","HPV関連がん","oropharyngeal cancer","C10"], icd:"C10" },
    { id:"hypopharynx", name:"下咽頭がん", aliases:["下咽頭癌","hypopharyngeal cancer","C13"], icd:"C13" },
    { id:"nasopharynx", name:"上咽頭がん", aliases:["上咽頭癌","NPC","nasopharyngeal carcinoma","C11"], icd:"C11" },
    { id:"larynx",      name:"喉頭がん", aliases:["喉頭癌","laryngeal cancer","C32"], icd:"C32",
      topics:[{title:"喉頭摘出後の発声代替",desc:"電気式人工喉頭・食道発声・シャント"}]
    },
    { id:"nasal",       name:"鼻腔・副鼻腔がん", aliases:["鼻腔癌","副鼻腔がん","nasal cancer","paranasal sinus cancer","C30","C31"], icd:"C30-C31" },
    { id:"salivary",    name:"唾液腺がん", aliases:["唾液腺癌","耳下腺がん","耳下腺癌","顎下腺がん","舌下腺がん","parotid","salivary gland cancer","parotid cancer","C07","C08"], icd:"C07-C08" }
  ],
  histologies: [
    { id:"adenoid-cystic",  name:"腺様嚢胞癌（Adenoid cystic carcinoma）", aliases:["腺様嚢胞癌","腺様のう胞がん","ACC","adenoid cystic carcinoma"], siteIds:["salivary","nasal","oral"] },
    { id:"mucoepidermoid", name:"粘表皮癌（Mucoepidermoid carcinoma）", aliases:["粘表皮癌","粘表皮がん","MEC","mucoepidermoid carcinoma"], siteIds:["salivary","nasal","oral","oropharynx"] },
    { id:"mucosal-melanoma",name:"悪性黒色腫（粘膜）", aliases:["悪性黒色腫","メラノーマ","melanoma","mucosal melanoma"], siteIds:["nasal","oral","oropharynx"] },
    { id:"lymphoma",       name:"リンパ腫", aliases:["リンパ腫","悪性リンパ腫","lymphoma"], siteIds:["oropharynx","nasopharynx"] },
    { id:"sarcoma",        name:"肉腫", aliases:["肉腫","横紋筋肉腫","線維肉腫","sarcoma"], siteIds:["oral","nasal","oropharynx"] }
  ],
  treatments: [
    {title:"がん情報サービス（頭頸部）", url:"https://ganjoho.jp/public/cancer/head_neck/", source:"国立がん研究センター",
     cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]},
    {title:"NCI PDQ（患者向け）: Head and Neck", url:"https://www.cancer.gov/types/head-and-neck/patient", source:"NCI"},
    {title:"ESMO ガイドライン（Head and Neck）", url:"https://www.esmo.org/guidelines/head-and-neck-cancers", source:"ESMO"},
    {title:"ASCO ガイドライン（Head and Neck）", url:"https://www.asco.org/guidelines", source:"ASCO（検索）"}
  ],
  life: []
};

/* 生活の工夫 追加パック（厚盛り） */
const LIFE_EXTRA = [
  // 放射線
  {id:"oral-care-rt",title:"放射線治療中の口腔ケア基本",category:"口腔ケア",body:"やわらかめ歯ブラシ＋フッ化物含嗽。無アルコール洗口液。粘膜炎が強い時は圧を最小に。義歯は短時間使用。",cancerIds:["oral","oropharynx","nasopharynx","larynx","nasal","salivary"], treatmentType:"radiation"},
  {id:"mucositis-care",title:"口内炎（粘膜炎）の痛み対策",category:"口腔ケア",body:"冷たい飲食・氷片で鎮痛補助。辛い/酸っぱい/熱い物は回避。局所麻酔含嗽や鎮痛剤は医師に相談。",cancerIds:["oral","oropharynx","nasopharynx"], treatmentType:"radiation"},
  {id:"xerostomia",title:"口腔乾燥の工夫",category:"口腔ケア",body:"人工唾液スプレー・無糖ガム・氷片。寝室加湿、カフェイン控えめ。う蝕予防に高濃度フッ化物。",cancerIds:["oral","oropharynx","nasopharynx","larynx","salivary"], treatmentType:"radiation"},
  {id:"skin-rt",title:"放射線皮膚炎のスキンケア",category:"皮膚ケア",body:"低刺激保湿を毎日。摩擦・日光・熱刺激は避ける。びらん時は指示薬。独自療法は避ける。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"], treatmentType:"radiation"},
  {id:"neck-fibrosis",title:"頸部線維化のこわばり対策",category:"運動・拘縮",body:"肩甲帯・頸部ストレッチを短時間×複数回。重い荷物・長時間同姿勢を控える。",cancerIds:["oropharynx","hypopharynx","nasopharynx","larynx"], treatmentType:"radiation"},
  {id:"taste",title:"味覚障害への工夫",category:"食事・味覚",body:"冷たい料理・酸味/香味を上手に。亜鉛不足評価（主治医）。口腔ケアの徹底、清涼感のある飲料でリフレッシュ。",cancerIds:["oral","oropharynx","nasopharynx","larynx","nasal","salivary"], treatmentType:"radiation"},
  // 手術
  {id:"dysphagia-st",title:"嚥下リハの始め方（術後）",category:"嚥下",body:"ST評価→顎・舌・頸部の可動域訓練、嚥下体操、増粘で誤嚥予防。少量・ゆっくり・複数回飲下。",cancerIds:["oropharynx","hypopharynx","larynx","oral"], treatmentType:"surgery"},
  {id:"iddsi",title:"段階別食形態（IDDSI相当）",category:"嚥下",body:"レベル0〜7の実例：0（薄い液体）→2（とろみ）→4（ピュレ）→5（刻み軟菜）→6（やわらか固形）→7（通常）。むせ/残留に応じて段階調整。",cancerIds:["oral","oropharynx","hypopharynx","larynx"], treatmentType:"surgery"},
  {id:"food-mod",title:"食形態の調整と姿勢",category:"嚥下",body:"まとまりやすい食材（卵/豆腐）から。二相性（汁＋具）は工夫。軽度頸部屈曲で誤嚥減。",cancerIds:["oropharynx","hypopharynx","larynx","oral"], treatmentType:"surgery"},
  {id:"voice-prosthesis",title:"人工喉頭・食道/シャント発声",category:"発声",body:"機種例：電子式（軽量・扱いやすい）/空気式。練習は無声→単音→単語→朗読。衛生管理・バルブ交換は指導に沿う。",cancerIds:["larynx"], treatmentType:"surgery"},
  {id:"trismus",title:"開口障害（予防・対策）",category:"運動・拘縮",body:"早期から開口訓練（指タテ/スティック/専用器具）。“気持ちよい伸張”で継続。温罨法併用可。",cancerIds:["oral","oropharynx","nasal","salivary"], treatmentType:"surgery"},
  {id:"stoma-care",title:"気管孔（ストーマ）の管理",category:"呼吸・ストーマ",body:"加湿（HME）と痰の湿性化。入浴時カバー。器具の衛生保持。出血/異臭は早期相談。",cancerIds:["larynx"], treatmentType:"surgery"},
  {id:"shoulder",title:"副神経障害の肩の痛み/挙上制限",category:"運動・拘縮",body:"肩甲帯安定化訓練と可動域維持。OTで代償動作を学ぶ。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","salivary"], treatmentType:"surgery"},
  {id:"fnp",title:"耳下腺術後の顔面神経麻痺",category:"神経",body:"表情筋リハ（対称性・ゆっくり）。テーピング/保湿で角膜保護。神経回復は月単位で評価。",cancerIds:["salivary"], treatmentType:"surgery"},
  {id:"speech-aids",title:"構音の工夫（舌・口底切除後）",category:"発声",body:"簡潔な語彙・ゆっくり話す・相手の理解確認。キーボード/スマホ音声合成の併用。",cancerIds:["oral"], treatmentType:"surgery"},
  // 抗がん剤・全身
  {id:"nutrition",title:"体重減少を抑える栄養",category:"栄養",body:"少量高カロリーを回数で。補助飲料・油脂追加・間食。摂れない時は早めにNSTへ。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"], treatmentType:"chemotherapy"},
  {id:"peg-ng",title:"経腸栄養（NG/PEG）",category:"栄養",body:"皮膚/固定の清潔、詰まり防止の定期フラッシュ。嚥下リハと併行して経口へ段階的回復。",cancerIds:["oropharynx","hypopharynx","nasopharynx","larynx"], treatmentType:"chemotherapy"},
  {id:"pain",title:"痛みの段階的コントロール",category:"痛み",body:"アセトアミノフェン→NSAIDs→オピオイド。便秘対策を併行。神経障害性痛は補助薬。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"chemotherapy"},
  {id:"fatigue",title:"がん関連疲労（CRF）",category:"全身",body:"短時間の有酸素＋レジスタンスを週数回。睡眠衛生・昼寝20–30分。甲状腺機能/貧血評価。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"chemotherapy"},
  {id:"mental",title:"不安・抑うつへのセルフヘルプ",category:"こころ",body:"呼吸法・マインドフルネス・ピアサポート。持続症状はサイコオンコロジー外来へ。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"chemotherapy"},
  // その他
  {id:"dental",title:"歯科フォロー（顎骨壊死予防）",category:"歯科",body:"放射線前後は専門歯科で洗浄/う蝕対策。抜歯はリスク評価。骨代謝薬使用中は要相談。",cancerIds:["oral","oropharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"other"},
  {id:"lymphedema",title:"顔・頸のリンパ浮腫：セルフドレナージ",category:"むくみ",body:"スキンケア→軽擦→頸部誘導。圧迫は指導の下で。発赤/熱感など感染兆候は受診。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary"], treatmentType:"other"},
  {id:"smell",title:"嗅覚低下の匂い訓練",category:"感覚",body:"4種類の香り（バラ等）を1日2回、数カ月継続。安全の範囲で継続。",cancerIds:["nasal","nasopharynx","oral","oropharynx"], treatmentType:"other"},
  {id:"sun",title:"移植部・瘢痕部の紫外線対策",category:"皮膚ケア",body:"SPF30+・帽子・スカーフ。色素沈着/瘢痕肥厚の悪化を防ぐ。",cancerIds:["oral","nasal","salivary","larynx"], treatmentType:"other"},
  {id:"work",title:"仕事・学業への復帰準備",category:"社会・制度",body:"就労配慮指示書の活用、段階的復職/在宅併用の交渉。声・嚥下の制限は具体的に。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"other"},
  {id:"financial",title:"公的支援・費用助成",category:"社会・制度",body:"高額療養費・傷病手当金・障害者手帳・医療費控除。がん相談支援センターを活用。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"other"}
];

/* ---------- 公式リンクの優先マップ（部位/組織型） ---------- */
// 部位 → 国がんページ
const GANJOHO_SITE = {
  oral:       "https://ganjoho.jp/public/cancer/head_neck/",
  oropharynx: "https://ganjoho.jp/public/cancer/head_neck/",
  hypopharynx:"https://ganjoho.jp/public/cancer/head_neck/",
  nasopharynx:"https://ganjoho.jp/public/cancer/head_neck/",
  larynx:     "https://ganjoho.jp/public/cancer/head_neck/",
  nasal:      "https://ganjoho.jp/public/cancer/head_neck/",
  salivary:   "https://ganjoho.jp/public/cancer/salivary_gland/index.html"
};
// 組織型 → 国がん「専用」ページ（ユーザー要望：ACC は専用URLへ）
const GANJOHO_DIRECT = {
  "adenoid-cystic": "https://ganjoho.jp/public/cancer/adenoid_cystic_cancer/index.html"
};
// Medical Note 検索（サイト内検索に飛ばす）
const MEDICALNOTE_SEARCH = (jp) => `https://medicalnote.jp/search?keyword=${encodeURIComponent(jp)}`;
const GANJOHO_SEARCH = (jp) => `https://ganjoho.jp/public/search/index.html?searchText=${encodeURIComponent(jp)}`;

/* ---------- ClinicalTrials クエリ式（狭い/広い/シノニム） ---------- */
const TRIAL_QUERY_SITE = {
  oral:        'oral+OR+"tongue+cancer"+OR+"floor+of+mouth"',
  oropharynx:  'oropharyngeal+OR+"base+of+tongue"+OR+tonsil',
  hypopharynx: 'hypopharyngeal+OR+postcricoid+OR+"pyriform+sinus"',
  nasopharynx: 'nasopharyngeal+OR+NPC',
  larynx:      'laryngeal+OR+glottic+OR+supraglottic+OR+subglottic',
  nasal:       '"nasal+cavity"+OR+"paranasal+sinus"+OR+"maxillary+sinus"',
  salivary:    '"salivary+gland"+OR+parotid+OR+submandibular+OR+sublingual',
  _default:    '"Head+and+Neck+Cancer"'
};
const TRIAL_QUERY_HISTO = {
  "adenoid-cystic"  : '"adenoid+cystic+carcinoma"',
  "mucoepidermoid"  : '"mucoepidermoid+carcinoma"',
  "mucosal-melanoma": '"mucosal+melanoma"+OR+"malignant+melanoma+of+mucosa"',
  lymphoma          : '"head+and+neck"+lymphoma',
  sarcoma           : '"head+and+neck"+sarcoma'
};
const EN_SYNONYMS = {
  oral:['oral cavity cancer','tongue cancer','floor of mouth cancer','buccal mucosa cancer','gingival cancer'],
  oropharynx:['oropharyngeal cancer','tonsil cancer','base of tongue cancer'],
  hypopharynx:['hypopharyngeal cancer','pyriform sinus','postcricoid'],
  nasopharynx:['nasopharyngeal carcinoma','NPC'],
  larynx:['laryngeal cancer','glottic','supraglottic','subglottic'],
  nasal:['nasal cavity cancer','paranasal sinus cancer','maxillary sinus cancer','ethmoid sinus cancer'],
  salivary:['salivary gland cancer','parotid gland cancer','submandibular gland cancer','sublingual gland cancer'],
  "adenoid-cystic":['adenoid cystic carcinoma','ACC'],
  "mucoepidermoid":['mucoepidermoid carcinoma','MEC'],
  "mucosal-melanoma":['mucosal melanoma'],
  lymphoma:['head and neck lymphoma','extranodal lymphoma'],
  sarcoma:['head and neck sarcoma','rhabdomyosarcoma','fibrosarcoma']
};

/* =========================================================
   起動（DOMContentLoaded 後に boot）
========================================================= */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

async function boot(){
  await loadData();
  initTabs();
  initHome();
  initHistology();
  initGlobalSearch();
  initTreatments();
  initLife();
  initCommunity();
}

/* =========================================================
   データ読込み（resources.json → fallback）
========================================================= */
async function loadData(){
  let ok = false;
  try {
    const res = await fetch("./resources.json?v=3", { cache:"no-store" });
    if (res.ok) {
      const j = await res.json();
      if (Array.isArray(j.cancers) && j.cancers.length) {
        DATA = j;                    // ここで上書き（var DATA なのでTDZなし）
        ok = true;
      }
    }
  } catch(e){ /* noop */ }
  if (!ok) {
    DATA = structuredClone(DATA_FALLBACK);
  }
  // life 拡張（重複排除）
  const byId = new Map();
  (Array.isArray(DATA.life)?DATA.life:[]).forEach(x=>byId.set(x.id,x));
  LIFE_EXTRA.forEach(x=>byId.set(x.id,x));
  DATA.life = Array.from(byId.values());
  if (!Array.isArray(DATA.histologies) || !DATA.histologies.length){
    DATA.histologies = DATA_FALLBACK.histologies;
  }
}

/* =========================================================
   タブ切替
========================================================= */
function initTabs(){
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      const tab = e.currentTarget.dataset.tab;
      switchTab(tab);
    });
  });
}
function switchTab(tab){
  document.querySelectorAll(".tab").forEach(s=>s.classList.remove("active"));
  document.getElementById(tab)?.classList.add("active");
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b=>b.classList.add("active"));
  if (tab === "community") ensureCommunityReady();
}

/* =========================================================
   ホーム：部位検索
========================================================= */
function initHome(){
  const list=document.getElementById("cancer-list");
  const input=document.getElementById("cancer-search");
  if(!list||!input) return;
  const norm = (s)=>(s||"").toString().toLowerCase().normalize("NFKC").replace(/[ \u3000]/g,"").replace(/癌/g,"がん").replace(/ガン/g,"がん");
  function render(q=""){
    const f=norm(q); list.innerHTML="";
    const arr=DATA.cancers||[];
    const items = arr.filter(c=>{
      if(!f) return true;
      const fields=[c.name,(c.aliases||[]).join("|"),c.icd||""].map(norm).join("|");
      return fields.includes(f);
    });
    if (!items.length){ list.innerHTML = `<li class="meta">該当が見つかりません。別表記（例：喉頭がん/喉頭癌/C32）でもお試しください。</li>`; return; }
    items.forEach(c=>{
      const li=document.createElement("li");
      li.innerHTML = `
        <strong>${c.name}</strong> <span class="badge">${c.icd||""}</span>
        <div class="meta">${(c.aliases||[]).join("・")}</div>
        <div class="chiprow" style="margin-top:8px">
          <a href="#" data-jump="community" data-cancer="${c.id}">コミュニティ</a>
          <a href="#" data-jump="treatments" data-cancer="${c.id}">治療情報</a>
          <a href="#" data-jump="life" data-cancer="${c.id}">生活の工夫</a>
        </div>`;
      list.appendChild(li);
    });
  }
  input.addEventListener("input",e=>render(e.target.value));
  input.addEventListener("compositionend",e=>render(e.target.value));
  list.addEventListener("click",(e)=>{
    const a=e.target.closest("a[data-jump]"); if(!a) return;
    e.preventDefault();
    const tab=a.dataset.jump; const id=a.dataset.cancer;
    switchTab(tab);
    if (tab==="community") selectCancer(id);
    if (tab==="treatments") filterTreatments(id);
    if (tab==="life") filterLife(id);
  });
  render("");
}

/* =========================================================
   ホーム：組織型検索
========================================================= */
function initHistology(){
  const list=document.getElementById("histo-list");
  const input=document.getElementById("histo-search");
  if(!list||!input) return;
  const norm = (s)=>(s||"").toString().toLowerCase().normalize("NFKC").replace(/[ \u3000]/g,"").replace(/癌/g,"がん").replace(/ガン/g,"がん");
  function render(q=""){
    const f=norm(q); list.innerHTML="";
    const arr=DATA.histologies||[];
    const items = arr.filter(h=>{
      if(!f) return true;
      const fields=[h.name,(h.aliases||[]).join("|")].map(norm).join("|");
      return fields.includes(f);
    });
    if(!items.length){ list.innerHTML = `<li class="meta">該当の組織型が見つかりません。</li>`; return; }
    items.forEach(h=>{
      const siteButtons = (h.siteIds||[]).map(id=>{
        const s=(DATA.cancers||[]).find(x=>x.id===id);
        return s? `<button class="linklike" data-jump="community" data-cancer="${s.id}" data-histology="${h.id}">${s.name}</button>`:"";
      }).join(" ");
      const li=document.createElement("li");
      li.innerHTML = `
        <strong>${h.name}</strong>
        <div class="meta">${(h.aliases||[]).join("・")}</div>
        ${siteButtons? `<div class="chiprow" style="margin-top:6px">${siteButtons}</div>`:""}
      `;
      list.appendChild(li);
    });
  }
  input.addEventListener("input",e=>render(e.target.value));
  input.addEventListener("compositionend",e=>render(e.target.value));
  list.addEventListener("click",(e)=>{
    const b=e.target.closest("button[data-jump][data-cancer]"); if(!b) return;
    e.preventDefault();
    HISTO_CONTEXT = b.dataset.histology || null;
    switchTab("community");
    selectCancer(b.dataset.cancer);
  });
  render("");
}

/* =========================================================
   グローバル検索（部位/組織型まとめ）
========================================================= */
function initGlobalSearch(){
  const input=document.getElementById("global-search");
  const list=document.getElementById("global-results");
  if(!input||!list) return;
  const norm=(s)=>(s||"").toString().toLowerCase().normalize("NFKC").replace(/[ \u3000]/g,"").replace(/癌/g,"がん").replace(/ガン/g,"がん");
  function search(q){
    const f=norm(q);
    const sites=(DATA.cancers||[]).filter(c=>[c.name,(c.aliases||[]).join("|"),c.icd||""].map(norm).join("|").includes(f));
    const histos=(DATA.histologies||[]).filter(h=>[h.name,(h.aliases||[]).join("|")].map(norm).join("|").includes(f));
    return {sites,histos};
  }
  function render(q=""){
    list.innerHTML = ""; if(!q) return;
    const {sites,histos}=search(q);
    if(!sites.length && !histos.length){ list.innerHTML = `<li class="meta">候補が見つかりませんでした。</li>`; return; }
    sites.forEach(c=>{
      const li=document.createElement("li");
      li.innerHTML = `
        <strong>部位：</strong>${c.name}
        <div class="meta">${(c.aliases||[]).join("・")}</div>
        <div class="chiprow" style="margin-top:6px">
          <a href="#" data-act="community" data-cancer="${c.id}">コミュニティへ</a>
          <a href="#" data-act="trials" data-cancer="${c.id}">治験を探す</a>
        </div>`;
      list.appendChild(li);
    });
    histos.forEach(h=>{
      const siteBtns=(h.siteIds||[]).map(id=>{
        const s=(DATA.cancers||[]).find(x=>x.id===id);
        return s? `<a href="#" data-act="trials" data-cancer="${s.id}" data-histology="${h.id}">${s.name}で治験</a>`:"";
      }).join(" ");
      const li=document.createElement("li");
      li.innerHTML = `
        <strong>組織型：</strong>${h.name}
        <div class="meta">${(h.aliases||[]).join("・")}</div>
        <div class="chiprow" style="margin-top:6px">${siteBtns || `<a href="#" data-act="trials" data-histology="${h.id}">治験を探す</a>`}</div>`;
      list.appendChild(li);
    });
  }
  input.addEventListener("input",e=>render(e.target.value));
  input.addEventListener("compositionend",e=>render(e.target.value));
  list.addEventListener("click",(e)=>{
    const a=e.target.closest("a[data-act]"); if(!a) return;
    e.preventDefault();
    const act=a.dataset.act, cancerId=a.dataset.cancer||null, histo=a.dataset.histology||null;
    if (act==="community" && cancerId){ switchTab("community"); selectCancer(cancerId); return; }
    if (act==="trials"){ switchTab("community"); if(cancerId) selectCancer(cancerId); HISTO_CONTEXT = histo; }
  });
}

/* =========================================================
   コミュニティ（選択→描画）
========================================================= */
function initCommunity(){
  const sel=document.getElementById("community-select"); if(!sel) return;
  sel.innerHTML = `<option value="" disabled selected>種類を選んでください</option>`;
  (DATA.cancers||[]).forEach(c=> sel.insertAdjacentHTML("beforeend", `<option value="c:${c.id}">${c.name}</option>`));
  (DATA.histologies||[]).forEach(h=> sel.insertAdjacentHTML("beforeend", `<option value="h:${h.id}">組織型: ${h.name}</option>`));
  if (!sel.__bind) {
    sel.addEventListener("change",(e)=>{
      const val=e.target.value; if(!val) return;
      const [t,id]=val.split(":");
      if (t==="c"){ renderCommunityContent(id); }
      if (t==="h"){
        const histo=(DATA.histologies||[]).find(x=>x.id===id);
        const site=histo?.siteIds?.[0];
        if (site){ HISTO_CONTEXT=id; renderCommunityContent(site); }
      }
    });
    sel.__bind = true;
  }
}
function ensureCommunityReady(){ initCommunity(); }
function selectCancer(id){
  const sel=document.getElementById("community-select"); if(!sel) return;
  sel.value = `c:${id}`;
  sel.dispatchEvent(new Event("change"));
}

async function renderCommunityContent(cancerId){
  CURRENT_CANCER_ID = cancerId;
  const wrap=document.getElementById("community-content"); if(!wrap) return;
  const c=(DATA.cancers||[]).find(x=>x.id===cancerId);
  if(!c){ wrap.innerHTML = `<div class="card"><p class="meta">該当のがん種が見つかりません。</p></div>`; return; }

  const topicsHTML = (c.topics||[]).map((t,i)=>`
    <li class="topic-item" data-index="${i}">
      <button class="linklike topic-toggle" type="button"><strong>${t.title}</strong>${t.url?'<span class="meta">（外部）</span>':''}</button>
      <div class="topic-body" style="display:none;margin-top:6px;">${t.desc?`<div class="meta">${t.desc}</div>`:""}${t.url?`<div style="margin-top:6px"><a target="_blank" rel="noopener" href="${t.url}">リンクを開く</a></div>`:""}</div>
    </li>
  `).join("") || "<li>トピックは準備中です。</li>";

  const linksHTML = (c.links||[]).map(l=>`
    <li><a target="_blank" rel="noopener" href="${l.url}">${l.title||l.url}</a></li>
  `).join("") || "<li>関連リンクは準備中です。</li>";

  wrap.innerHTML = `
    <div class="col-12">
      <div class="card">
        <h3>${c.name} <span class="badge">${c.icd||""}</span></h3>
        ${(c.aliases?.length)? `<div class="meta">別名：${c.aliases.join("・")}</div>`:""}
      </div>
    </div>
    <div class="col-6">
      <div class="card">
        <h3>話題・トピック</h3>
        <ul id="community-topics" class="list small">${topicsHTML}</ul>
      </div>
    </div>
    <div class="col-6">
      <div class="card">
        <h3>関連リンク</h3>
        <ul class="list small">${linksHTML}</ul>
      </div>
    </div>
  `;

  // トピック展開トグル
  const topicsList=document.getElementById("community-topics");
  if (topicsList) {
    topicsList.addEventListener("click",(e)=>{
      const btn=e.target.closest(".topic-toggle"); if(!btn) return;
      const li=btn.closest(".topic-item"); const body=li?.querySelector(".topic-body");
      if(!body) return; const show = body.style.display === "none";
      body.style.display = show? "block":"none";
    });
  }

  // 連動：治療リンク/生活Tips/治験
  filterTreatments(cancerId);
  filterLife(cancerId);
  try { await loadTrials(cancerId, { histologyId: HISTO_CONTEXT }); } catch(e){ /* fallback 内で処理 */ }
  HISTO_CONTEXT = null;
}

/* =========================================================
   治療リンク
========================================================= */
function initTreatments(){ renderTreatmentsList(); }
function renderTreatmentsList(filterId){
  const ul=document.getElementById("treatment-links"); if(!ul) return;
  ul.innerHTML="";
  const arr=DATA.treatments||[];
  const items=arr.filter(t=>!filterId ? true : (Array.isArray(t.cancerIds)? t.cancerIds.includes(filterId):true));
  if(!items.length){ ul.innerHTML = `<li>該当のリンクがありません。</li>`; return; }
  items.forEach(t=>{
    const li=document.createElement("li");
    li.innerHTML = `<a target="_blank" rel="noopener" href="${t.url}">${t.title}</a> <span class="meta">— ${t.source||""}</span>`;
    ul.appendChild(li);
  });
}
function filterTreatments(id){ renderTreatmentsList(id); }

/* =========================================================
   生活の工夫
========================================================= */
function initLife(){
  // カテゴリボタン
  const lifeSec=document.getElementById("life");
  if (lifeSec && !document.getElementById("life-cat-controls")){
    const ctrl=document.createElement("div");
    ctrl.id="life-cat-controls";
    ctrl.innerHTML = `
      <button data-life-cat="surgery" class="active">手術</button>
      <button data-life-cat="radiation">放射線治療</button>
      <button data-life-cat="chemotherapy">抗がん剤治療</button>
      <button data-life-cat="other">その他の治療</button>
    `;
    lifeSec.querySelector(".card").prepend(ctrl);
    ctrl.addEventListener("click",(e)=>{
      const b=e.target.closest("button[data-life-cat]"); if(!b) return;
      ctrl.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      renderLifeList(CURRENT_CANCER_ID, b.dataset.lifeCat);
    });
  }
  renderLifeList(null, "surgery");
}
function renderLifeList(filterId, catId){
  const ul=document.getElementById("life-tips"); if(!ul) return;
  ul.innerHTML="";
  let items=(DATA.life||[]).slice();
  if (filterId) items = items.filter(x=> Array.isArray(x.cancerIds)? x.cancerIds.includes(filterId):true);
  if (catId)   items = items.filter(x=> x.treatmentType === catId);
  if(!items.length){ ul.innerHTML = `<li>該当のヒントは見つかりませんでした。</li>`; return; }
  items.forEach(x=>{
    const li=document.createElement("li");
    li.innerHTML = `<strong>${x.title}</strong> <span class="badge">${x.category||""}</span><div class="meta" style="margin-top:4px">${x.body||""}</div>`;
    ul.appendChild(li);
  });
}
function filterLife(id){
  const active=document.querySelector("#life-cat-controls button.active");
  const cat=active ? active.dataset.lifeCat : "surgery";
  renderLifeList(id, cat);
}

/* =========================================================
   ClinicalTrials（失敗時は公的リンク優先→検索リンク）
========================================================= */
const TRIAL_FILTERS = { recruitingOnly:true, drugOnly:true, japanFirst:true, phaseMin:"2" };

function renderTrialsControls(box){
  const c=document.createElement("div"); c.className="meta"; c.style.margin="8px 0 12px";
  c.innerHTML = `
    <label style="margin-right:12px"><input type="checkbox" id="flt-recruit" checked> 募集中のみ</label>
    <label style="margin-right:12px"><input type="checkbox" id="flt-drug" checked> 薬剤など介入あり</label>
    <label style="margin-right:12px"><input type="checkbox" id="flt-jp" checked> 日本を優先</label>
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
  c.querySelector("#flt-recruit").addEventListener("change",e=>{TRIAL_FILTERS.recruitingOnly=e.target.checked; rerenderTrialsList();});
  c.querySelector("#flt-drug").addEventListener("change",e=>{TRIAL_FILTERS.drugOnly=e.target.checked; rerenderTrialsList();});
  c.querySelector("#flt-jp").addEventListener("change",e=>{TRIAL_FILTERS.japanFirst=e.target.checked; rerenderTrialsList();});
  c.querySelector("#flt-phase").addEventListener("change",e=>{TRIAL_FILTERS.phaseMin=e.target.value; rerenderTrialsList();});
}
function passFilters(t){
  if (TRIAL_FILTERS.recruitingOnly && !/(Recruiting|Enrolling|Not\s+yet\s+recruiting)/i.test(t.status||"")) return false;
  if (TRIAL_FILTERS.drugOnly && !((t.interventionTypes||[]).some(x=>/(Drug|Biological|Device|Combination Product)/i.test(x)))) return false;
  const ph=(t.phase||"").match(/(\d)/)?.[1]; if (TRIAL_FILTERS.phaseMin!=="Any" && ph && Number(ph)<Number(TRIAL_FILTERS.phaseMin)) return false;
  return true;
}
function rerenderTrialsList(){
  const host=document.getElementById("trials-list-host"); if(!host) return;
  renderTrialsList(host, __TRIALS_CACHE);
}
function renderTrialsList(host,trials){
  const filtered=trials.filter(passFilters);
  const ordered = TRIAL_FILTERS.japanFirst
    ? filtered.slice().sort((a,b)=>{
        const aj=(a.countries||[]).some(c=>/Japan/i.test(c))?1:0;
        const bj=(b.countries||[]).some(c=>/Japan/i.test(c))?1:0;
        if (bj!==aj) return bj-aj;
        const da=Date.parse(a.updated||a.start||0), db=Date.parse(b.updated||b.start||0);
        return db-da;
      })
    : filtered;
  if(!ordered.length){ host.innerHTML=`<div class="meta">現在の条件では表示できる治験がありません。</div>`; return; }
  host.innerHTML = `
    <ul class="list small">
      ${ordered.map(t=>{
        const drugBadge=(t.interventionTypes||[]).some(x=>/(Drug|Biological)/i.test(x))?`<span class="badge">Drug</span>`:"";
        const jpBadge=(t.countries||[]).some(c=>/Japan/i.test(c))?`<span class="badge">JP</span>`:"";
        const ph=t.phase?`／ <span class="badge">${escapeHtml(t.phase)}</span>`:"";
        return `
          <li>
            <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/study/${t.id}"><strong>${escapeHtml(t.title||t.id)}</strong></a>
            <div class="meta">ID: ${t.id} ／ 状況: ${escapeHtml(t.status||"")} ${ph} ／ 更新: ${escapeHtml(t.updated||"")} ${drugBadge} ${jpBadge}</div>
            ${t.sponsor?`<div class="meta">主担当機関: ${escapeHtml(t.sponsor)}</div>`:""}
            ${(t.interventions&&t.interventions.length)?`<div class="meta">介入: <strong>${t.interventions.map(escapeHtml).join(" / ")}</strong></div>`:""}
            ${t.cond?`<div class="meta">対象: ${escapeHtml(t.cond)}</div>`:""}
          </li>`;
      }).join("")}
    </ul>`;
}
function buildTrialsExprList({ cancerId=null, histologyId=null } = {}){
  const set=new Set();
  if (histologyId && TRIAL_QUERY_HISTO[histologyId]) set.add(TRIAL_QUERY_HISTO[histologyId]);
  if (cancerId && TRIAL_QUERY_SITE[cancerId]) set.add(TRIAL_QUERY_SITE[cancerId]);
  // シノニムから OR 句を追加
  const syns=[];
  if (histologyId && EN_SYNONYMS[histologyId]) syns.push(...EN_SYNONYMS[histologyId]);
  if (cancerId && EN_SYNONYMS[cancerId]) syns.push(...EN_SYNONYMS[cancerId]);
  if (syns.length) set.add(syns.map(s=>`"${encodeURIComponent(String(s).replace(/\s+/g,"+"))}"`).join("+OR+"));
  set.add(TRIAL_QUERY_SITE._default);
  return Array.from(set);
}
async function fetchTrials(params={}){
  const exprs=buildTrialsExprList(params);
  const fields=[
    "NCTId","BriefTitle","Condition","OverallStatus","StudyType","Phase",
    "InterventionType","InterventionName","LeadSponsorName","LocationCountry",
    "LocationCity","LocationState","StartDate","PrimaryCompletionDate","LastUpdatePostDate"
  ].join(",");
  const out=[];
  for (const expr of exprs){
    const url=`https://clinicaltrials.gov/api/query/study_fields?expr=${expr}&fields=${fields}&min_rnk=1&max_rnk=12&fmt=json`;
    const res=await fetch(url,{cache:"no-store"});
    if(!res.ok) throw new Error(`trials fetch failed: ${res.status}`);
    const json=await res.json();
    const rows=json?.StudyFieldsResponse?.StudyFields||[];
    rows.forEach(r=>{
      out.push({
        id:r.NCTId?.[0], title:r.BriefTitle?.[0], cond:(r.Condition||[]).join(", "),
        status:r.OverallStatus?.[0], studyType:r.StudyType?.[0], phase:r.Phase?.[0],
        interventions:(r.InterventionName||[]).filter(Boolean),
        interventionTypes:(r.InterventionType||[]).filter(Boolean),
        sponsor:r.LeadSponsorName?.[0]||"",
        countries:(r.LocationCountry||[]).filter(Boolean),
        city:r.LocationCity?.[0]||"", state:r.LocationState?.[0]||"",
        start:r.StartDate?.[0]||"", primaryComplete:r.PrimaryCompletionDate?.[0]||"",
        updated:r.LastUpdatePostDate?.[0]||""
      });
    });
  }
  // unique by NCT
  const seen=new Set(), uniq=[];
  out.forEach(t=>{ if(t.id && !seen.has(t.id)){ seen.add(t.id); uniq.push(t); } });
  // rough score
  const score=(t)=>{
    let s=0;
    if (/(Recruiting|Enrolling|Not\s+yet\s+recruiting)/i.test(t.status||"")) s+=50;
    if ((t.interventionTypes||[]).some(x=>/(Drug|Biological|Device|Combination Product)/i.test(x))) s+=20;
    if ((t.interventions||[]).length) s+=10;
    if ((t.countries||[]).some(c=>/Japan/i.test(c))) s+=15;
    if (/Phase\s*(2|3|4)/i.test(t.phase||"")) s+=10;
    const d=Date.parse(t.updated||t.start||0)||0; s+=Math.min(20, Math.floor((d-1700000000000)/(1000*60*60*24*30)));
    return s;
  };
  uniq.sort((a,b)=>score(b)-score(a));
  return uniq.slice(0,24);
}
function renderTrialsFallback(box,{cancerId=null,histologyId=null}={}){
  const c=(DATA.cancers||[]).find(x=>x.id===cancerId);
  const h=(DATA.histologies||[]).find(x=>x.id===histologyId);

  // 1) 国がん「専用ページ」があれば最優先
  const direct = h && GANJOHO_DIRECT[h.id];
  // 2) 国がん「部位ページ」
  const site = (c && GANJOHO_SITE[c.id]) || "https://ganjoho.jp/public/cancer/head_neck/";
  // 3) 国がんサイト内検索（組織型 or 部位）
  const jpKey = h ? (h.aliases?.[0] || h.name) : (c?.name || "頭頸部がん");
  const ganSearch = GANJOHO_SEARCH(jpKey);
  // 4) メディカルノート検索
  const medSearch = MEDICALNOTE_SEARCH(jpKey);
  // 5) Google（日本語/英語）
  const narrowEN = h ? ( (h.aliases||[]).find(a=>/[a-z]/i.test(a)) || (h.name.match(/\((.+?)\)/)?.[1]) || "head and neck cancer" )
                     : "head and neck cancer";
  const qJP = encodeURIComponent(`${jpKey} 治験`);
  const qEN = encodeURIComponent(`${narrowEN} clinical trial`);

  box.insertAdjacentHTML("beforeend", `
    <div class="card" style="margin-top:12px">
      <h3>信頼できる一次情報・公的入口</h3>
      <ul class="list small">
        ${direct? `<li><a target="_blank" rel="noopener" href="${direct}">国がん：${h.name}（専用ページ）</a></li>`:""}
        <li><a target="_blank" rel="noopener" href="${site}">国がん：部位ページ</a></li>
        <li><a target="_blank" rel="noopener" href="${ganSearch}">国がんサイト内検索：「${escapeHtml(jpKey)}」</a></li>
        <li><a target="_blank" rel="noopener" href="${medSearch}">メディカルノート検索：「${escapeHtml(jpKey)}」</a></li>
      </ul>
    </div>
    <div class="card" style="margin-top:12px">
      <h3>補助検索（狭いクエリ）</h3>
      <ul class="list small">
        <li><a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qJP}">Google（日本語）：「${escapeHtml(jpKey)} 治験」</a></li>
        <li><a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qEN}">Google（英語）：「${escapeHtml(narrowEN)} clinical trial」</a></li>
        <li><a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${qEN}">ClinicalTrials.gov 内検索</a></li>
      </ul>
    </div>
  `);
}
async function loadTrials(cancerId,{histologyId=null}={}){
  const box=document.getElementById("trials"); if(!box) return;
  box.innerHTML = `<h3>最新の治験・研究（自動）</h3><p class="meta">ClinicalTrials.gov から取得を試みます。CORSや0件時は信頼先リンクを提示します。</p>`;
  renderTrialsControls(box);
  const host=document.createElement("div"); host.id="trials-list-host"; host.innerHTML=`<div class="meta">読み込み中…</div>`;
  box.appendChild(host);
  try {
    const trials = await fetchTrials({ cancerId, histologyId });
    __TRIALS_CACHE = trials.slice();
    if(!trials.length){ renderTrialsFallback(box,{cancerId,histologyId}); return; }
    renderTrialsList(host, trials);
  } catch(e){
    // CORS/503 など失敗時
    host.innerHTML = `<div class="meta">API取得に失敗しました（CORS/一時的障害など）。以下の信頼先リンクをご利用ください。</div>`;
    renderTrialsFallback(box,{cancerId,histologyId});
  }
}

/* =========================================================
   ユーティリティ
========================================================= */
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }
