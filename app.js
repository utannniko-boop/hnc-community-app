/* =========================================================
   HNC Community PWA - app.js（全置換版）
========================================================= */

/* ---------------- FALLBACK データ ---------------- */
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
    {id:"oral-care-rt",title:"放射線治療中の口腔ケア基本",category:"口腔ケア",body:"やわらかめ歯ブラシ＋フッ化物含嗽。無アルコール洗口液。粘膜炎が強い時はブラッシング圧を最小に。義歯は痛点を避けて短時間使用。",cancerIds:["oral","oropharynx","nasopharynx","larynx","nasal","salivary"], treatmentType:"radiation"},
    {id:"mucositis-care",title:"口内炎（粘膜炎）の痛み対策",category:"口腔ケア",body:"冷たい飲食・氷片で鎮痛補助。辛い・酸っぱい・熱いものは回避。医師に局所麻酔含嗽や鎮痛剤を相談。",cancerIds:["oral","oropharynx","nasopharynx"], treatmentType:"radiation"},
    {id:"xerostomia",title:"口腔乾燥（唾液減少）の工夫",category:"口腔ケア",body:"人工唾液スプレー・無糖ガム・氷片。寝室の加湿、カフェイン控えめ。う蝕予防に高濃度フッ化物ペーストを。",cancerIds:["oral","oropharynx","nasopharynx","larynx","salivary"], treatmentType:"radiation"},
    {id:"dysphagia-st",title:"嚥下リハの始め方",category:"嚥下・発声",body:"STに評価依頼。舌・顎・頸部のROM訓練、嚥下体操、増粘で誤嚥予防。",cancerIds:["oropharynx","hypopharynx","larynx","oral"], treatmentType:"surgery"},
    {id:"food-mod",title:"食形態の調整",category:"栄養・食事",body:"とろみ付与、まとまりやすい食材から開始。二相性（汁＋具）は工夫。姿勢は軽度頸部屈曲。",cancerIds:["oropharynx","hypopharynx","larynx","oral"], treatmentType:"surgery"},
    {id:"voice-prosthesis",title:"発声の選択肢（喉頭摘出後）",category:"嚥下・発声",body:"電気式人工喉頭・食道発声・シャント。衛生と交換時期は指導に従う。",cancerIds:["larynx"], treatmentType:"surgery"},
    {id:"trismus",title:"開口障害への対応",category:"運動・拘縮",body:"放射線後/術後は早期から開口訓練。温罨法併用も可。",cancerIds:["oral","oropharynx","nasal","salivary"], treatmentType:"surgery"},
    {id:"neck-fibrosis",title:"頸部線維化対策",category:"運動・拘縮",body:"肩甲帯・頸部ストレッチ、ROMを毎日短時間×複数回。",cancerIds:["oropharynx","hypopharynx","nasopharynx","larynx"], treatmentType:"radiation"},
    {id:"lymphedema",title:"顔面・頸部リンパ浮腫",category:"むくみ",body:"スキンケア→軽擦→頸部誘導。感染兆候は受診。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary"], treatmentType:"radiation"},
    {id:"skin-rt",title:"放射線皮膚炎ケア",category:"皮膚ケア",body:"低刺激保湿、摩擦・日光・熱刺激を回避。びらんは指示薬を使用。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"], treatmentType:"radiation"},
    {id:"dental",title:"歯科フォロー（顎骨壊死予防）",category:"歯科",body:"放射線前後は専門歯科。抜歯はリスク評価。骨吸収薬中は要相談。",cancerIds:["oral","oropharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"surgery"},
    {id:"nutrition",title:"体重減少を抑えるコツ",category:"栄養・食事",body:"少量高カロリー×回数。補助飲料・間食・油脂追加。早めにNSTへ。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"], treatmentType:"chemotherapy"},
    {id:"peg-ng",title:"経腸栄養（NG/PEG）",category:"栄養・食事",body:"休嚥下しつつリハ。清潔管理と詰まり防止のフラッシュを習慣に。",cancerIds:["oropharynx","hypopharynx","nasopharynx","larynx"], treatmentType:"chemotherapy"},
    {id:"pain",title:"痛みの段階的コントロール",category:"痛み",body:"アセト→NSAIDs→オピオイド。便秘対策は併行。神経障害性痛は補助薬。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"chemotherapy"},
    {id:"fatigue",title:"がん関連疲労（CRF）",category:"全身",body:"短時間の有酸素＋レジ運動を週数回。睡眠衛生・昼寝20–30分。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"chemotherapy"},
    {id:"mental",title:"不安・抑うつのセルフヘルプ",category:"こころ",body:"呼吸法・マインドフル・ピアサポート。強ければ専門外来へ。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"chemotherapy"},
    {id:"work",title:"仕事・学業への復帰",category:"社会・制度",body:"就労配慮指示書・段階的復帰・在宅併用。制限は具体的に伝える。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"other"},
    {id:"financial",title:"公的支援・費用助成",category:"社会・制度",body:"高額療養費・傷病手当金・障害者手帳・医療費控除。相談支援を活用。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"other"},
    {id:"caregiver",title:"家族・介護者の負担軽減",category:"家族",body:"役割分担と“休む日”。訪問看護・地域包括・情報共有ノート。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"other"},
    {id:"stoma-care",title:"気管孔（ストーマ）管理",category:"呼吸・ストーマ",body:"加湿（HME）・痰湿性化・シャワーカバー・吸引衛生。異常は相談。",cancerIds:["larynx"], treatmentType:"surgery"},
    {id:"shoulder",title:"副神経障害と肩",category:"運動・拘縮",body:"肩甲帯安定化訓練とROM維持。作業療法の代償動作。",cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","salivary"], treatmentType:"surgery"},
    {id:"smell",title:"嗅覚低下の匂い訓練",category:"感覚",body:"定型4香りを1日2回、数カ月。安全に配慮。",cancerIds:["nasal","nasopharynx","oral","oropharynx"], treatmentType:"other"},
    {id:"sun",title:"移植部・瘢痕の紫外線対策",category:"皮膚ケア",body:"SPF30+・帽子・スカーフ。色素沈着・肥厚の悪化予防。",cancerIds:["oral","nasal","salivary","larynx"], treatmentType:"other"},
    {id:"speech-aids",title:"構音の工夫（舌・口底切除後）",category:"嚥下・発声",body:"ゆっくり・簡潔・理解確認。音声合成を併用。",cancerIds:["oral"], treatmentType:"surgery"},
    {id:"oral-bleeding",title:"口腔の出血・潰瘍",category:"口腔ケア",body:"氷で冷却・清潔ガーゼ圧迫。止血困難/広範は受診。抗凝固薬は独断中止しない。",cancerIds:["oral","oropharynx","salivary"], treatmentType:"surgery"}
  ],
  histologies: [
    { id:"adenoid-cystic",  name:"腺様嚢胞癌（Adenoid cystic carcinoma）", aliases:["腺様嚢胞癌","腺様のう胞がん","ACC","adenoid cystic carcinoma","Adenoid-cystic carcinoma"], siteIds:["salivary","nasal","oral"] },
    { id:"mucoepidermoid", name:"粘表皮癌（Mucoepidermoid carcinoma）", aliases:["粘表皮癌","粘表皮がん","MEC","mucoepidermoid carcinoma"], siteIds:["salivary","nasal","oral","oropharynx"] },
    { id:"mucosal-melanoma",name:"悪性黒色腫（粘膜）", aliases:["悪性黒色腫","メラノーマ","melanoma","mucosal melanoma","mucosal malignant melanoma"], siteIds:["nasal","oral","oropharynx"] },
    { id:"lymphoma",       name:"リンパ腫", aliases:["リンパ腫","悪性リンパ腫","lymphoma"], siteIds:["oropharynx","nasopharynx"] },
    { id:"sarcoma",        name:"肉腫", aliases:["肉腫","横紋筋肉腫","骨肉腫","線維肉腫","sarcoma"], siteIds:["oral","nasal","oropharynx"] }
  ]
};
const LIFE_EXTRA = [
  // —— 手術系（surgery）——
  {id:"scar-care", title:"瘢痕ケアと拘縮予防", category:"皮膚ケア", body:"創部が落ち着いた後は、保湿と軽いマッサージを継続。日中はUV対策、就寝時は摩擦を避ける衣類を。過度な圧迫は避け、気になる盛り上がりは形成外科へ相談。", cancerIds:["oral","larynx","nasal","salivary"], treatmentType:"surgery"},
  {id:"jaw-rehab", title:"下顎再建後の咀嚼練習", category:"嚥下・発声", body:"軟飯→やわらかいタンパク質→繊維質の順に段階。左右差があれば滑舌・咀嚼を鏡で確認しながらゆっくり練習。疼痛が強い日は休む。", cancerIds:["oral"], treatmentType:"surgery"},

  // —— 放射線（radiation）——
  {id:"taste", title:"味覚低下への対策", category:"栄養・食事", body:"酸味や香りで変化をつける（レモン・ハーブ・出汁）。金属味が強い時は木/樹脂スプーン。味が分かる時間帯に主食を。", cancerIds:["oral","oropharynx","nasopharynx","larynx","salivary"], treatmentType:"radiation"},
  {id:"thyroid", title:"甲状腺機能のセルフチェック", category:"全身", body:"放射線後にだるさ・寒がり・むくみが続く場合は甲状腺機能を主治医に相談。体調メモを残し、採血タイミングを逃さない。", cancerIds:["nasopharynx","larynx","oropharynx","hypopharynx"], treatmentType:"radiation"},

  // —— 抗がん剤（chemotherapy）——
  {id:"nausea", title:"吐き気・食欲不振のセルフケア", category:"栄養・食事", body:"少量頻回・常温。においの弱い食品（おかゆ、うどん、クラッカー）。水分は電解質飲料やゼリーで補給。制吐薬は指示どおりに前倒し使用。", cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"chemotherapy"},
  {id:"neuropathy", title:"しびれ（末梢神経障害）への工夫", category:"全身", body:"冷えを避ける手袋・靴下。細かい作業は道具を工夫（太いグリップ）。転倒防止に段差・滑り止め確認。症状は強くなる前に申告。", cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx"], treatmentType:"chemotherapy"},
  {id:"hearing", title:"聴力低下・耳鳴りへの気づき", category:"感覚", body:"シスプラチン使用歴がある場合、会話の聞き取りにくさ・高音の聞こえづらさ・耳鳴りに注意。症状があれば早めに聴力検査を相談。", cancerIds:["oral","oropharynx","nasopharynx","larynx"], treatmentType:"chemotherapy"},

  // —— その他（other）——
  {id:"oral-candida", title:"口腔カンジダ予防", category:"口腔ケア", body:"入れ歯・マウスピースの清掃と乾燥保管。うがい薬の使い過ぎに注意。白苔や痛みが続く場合は口腔外科/歯科で評価。", cancerIds:["oral","oropharynx","salivary","nasopharynx"], treatmentType:"other"},
  {id:"return-to-work-plan", title:"復職計画の立て方（実例）", category:"社会・制度", body:"例：週3・4時間×2週間→週4・6時間×2週間→通常勤務。配慮事項（声量制限・電話少なめ・在宅併用）を文書化し、人事と共有。", cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","salivary","nasal"], treatmentType:"other"},
  {id:"apps", title:"便利アプリ・ツール", category:"生活", body:"発声支援アプリ、嚥下食レシピ集、服薬リマインダー、痛みスコア記録アプリを活用。家族と共有できるメモを1本化。", cancerIds:["oral","larynx","oropharynx","hypopharynx"], treatmentType:"other"}
];
// loadData() 内の DATA.life 整形の直後あたりに追記（存在すればマージ）
if (Array.isArray(DATA.life)) {
  const byId = new Map(DATA.life.map(x => [x.id, x]));
  (LIFE_EXTRA || []).forEach(x => byId.set(x.id, { ...(byId.get(x.id)||{}), ...x }));
  DATA.life = Array.from(byId.values());
}
/* ---------------- グローバル状態 ---------------- */
let DATA = { cancers: [], treatments: [], life: [], histologies: [] };
let CURRENT_CANCER_ID = null;
let __TRIALS_CACHE = [];
window.HISTO_CONTEXT = null;

const LIFE_CATEGORY_DEFS = [
  { id:'surgery', label:'手術' },
  { id:'radiation', label:'放射線治療' },
  { id:'chemotherapy', label:'抗がん剤治療' },
  { id:'other', label:'その他の治療' }
];

/* ---------------- 起動 ---------------- */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
async function boot(){
  await loadData();
  initAll();
  window.addEventListener('hashchange', () => {
    if (location.hash === '#community') ensureCommunityReady();
  });
}

/* ---------------- データ読込 ---------------- */
async function loadData(){
  let ok = false;
  try{
    const res = await fetch('./resources.json?v=3', { cache:'no-store' });
    if (res.ok){
      const json = await res.json();
      if (json && Array.isArray(json.cancers) && json.cancers.length){
        DATA = { ...json };
        if (!Array.isArray(DATA.histologies)) DATA.histologies = DATA_FALLBACK.histologies;
        if (Array.isArray(DATA.life)){
          DATA.life = DATA.life.map(item => {
            const fb = DATA_FALLBACK.life.find(x => x.id === item.id);
            return fb ? ({ ...fb, ...item }) : item;
          });
        }
        ok = true;
      }
    }
  }catch(e){ console.warn('[loadData] fetch error', e); }
  if (!ok){
    console.warn('[loadData] using FALLBACK data');
    DATA = { ...DATA_FALLBACK };
  }
}

/* ---------------- 初期化まとめ ---------------- */
function initAll(){
  try{ initTabs(); }catch(e){}
  try{ initHome(); }catch(e){}
  try{ initHistology(); }catch(e){}
  try{ initGlobalSearch(); }catch(e){}
  try{ initCommunity(); }catch(e){}
  try{ initTreatments(); }catch(e){}
  try{ initLife(); }catch(e){}
  try{ renderBookmarks(); }catch(e){}
  ensureCommunityReady();
}

/* ---------------- タブ切替 ---------------- */
function initTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const tab = e.currentTarget.dataset.tab;
      switchTab(tab);
    });
  });
}
function switchTab(tab){
  document.querySelectorAll('.tab').forEach(s=>s.classList.remove('active'));
  const target = document.getElementById(tab);
  if (target) target.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b=>b.classList.add('active'));
  if (tab === 'community') ensureCommunityReady();
}

/* ---------------- ホーム（部位） ---------------- */
function initHome(){
  const list = document.getElementById('cancer-list');
  const input = document.getElementById('cancer-search');
  if(!list || !input) return;
  const norm = (s)=>(s||'').toString().toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'').replace(/癌/g,'がん').replace(/ガン/g,'がん');
  function render(filterText=''){
    const f = norm(filterText);
    list.innerHTML = '';
    const arr = Array.isArray(DATA?.cancers) ? DATA.cancers : [];
    if (!arr.length){ list.innerHTML = '<li>データ未読込（FALLBACK動作中か確認）</li>'; return; }
    const items = arr.filter(c=>{
      if (!f) return true;
      const fields = [c.name, ...(c.aliases||[]), c.icd||''].map(norm).join('||');
      return fields.includes(f);
    });
    if (!items.length){ list.innerHTML = '<li>見つかりません（別表記で検索）</li>'; return; }
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
  }
  input.addEventListener('input', e=>render(e.target.value));
  input.addEventListener('compositionend', e=>render(e.target.value));
  render('');
  list.addEventListener('click', e=>{
    const a = e.target.closest('a[data-jump]'); if(!a) return;
    e.preventDefault();
    const tab = a.dataset.jump;
    const id = a.dataset.cancer;
    switchTab(tab);
    if (tab==='community') selectCancer(id);
    if (tab==='treatments') filterTreatments(id);
    if (tab==='life') filterLife(id);
  });
}

/* ---------------- ホーム（組織型） ---------------- */
function initHistology(){
  const list = document.getElementById('histo-list');
  const input = document.getElementById('histo-search');
  if(!list || !input) return;
  const norm = (s)=>(s||'').toString().toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'').replace(/癌/g,'がん').replace(/ガン/g,'がん');
  function render(filterText=''){
    const f = norm(filterText);
    list.innerHTML = '';
    const arr = Array.isArray(DATA?.histologies) ? DATA.histologies : DATA_FALLBACK.histologies || [];
    if (!arr.length){ list.innerHTML = '<li>組織型データがありません。</li>'; return; }
    const items = arr.filter(h=>{
      if (!f) return true;
      const fields = [h.name, ...(h.aliases||[])].map(norm).join('||');
      return fields.includes(f);
    });
    if (!items.length){ list.innerHTML = '<li>該当なし（別表記で）</li>'; return; }
    items.forEach(h=>{
      const siteButtons = (h.siteIds||[]).map(id=>{
        const site = (DATA.cancers||[]).find(c=>c.id===id) || (DATA_FALLBACK.cancers||[]).find(c=>c.id===id);
        return site ? `<button class="tab-btn linklike" data-jump="community" data-cancer="${site.id}" data-histology="${h.id}">${site.name}</button>` : '';
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
  input.addEventListener('input', e=>render(e.target.value));
  input.addEventListener('compositionend', e=>render(e.target.value));
  render('');
  list.addEventListener('click', e=>{
    const b = e.target.closest('button[data-jump][data-cancer]'); if(!b) return;
    e.preventDefault();
    window.HISTO_CONTEXT = b.dataset.histology || null;
    switchTab(b.dataset.jump);
    selectCancer(b.dataset.cancer);
  });
}

/* ---------------- グローバル検索 ---------------- */
function initGlobalSearch(){
  const input = document.getElementById('global-search');
  const list  = document.getElementById('global-results');
  if(!input || !list) return;
  const norm = (s)=>(s||'').toString().toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'').replace(/癌/g,'がん').replace(/ガン/g,'がん');
  function search(q){
    const f = norm(q);
    const sites  = (DATA.cancers||[]).filter(c => [c.name, ...(c.aliases||[]), c.icd||''].map(norm).join('||').includes(f));
    const histos = (DATA.histologies||[]).filter(h => [h.name, ...(h.aliases||[])].map(norm).join('||').includes(f));
    return { sites, histos };
  }
  function render(q=''){
    list.innerHTML = '';
    if (!q) return;
    const { sites, histos } = search(q);
    if (!sites.length && !histos.length){
      list.innerHTML = '<li class="meta">候補が見つかりません。</li>';
      return;
    }
    sites.forEach(c=>{
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>部位：</strong>${c.name}
        <div class="meta">${(c.aliases||[]).join('・')}</div>
        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
          <a href="#" data-act="community" data-cancer="${c.id}">コミュニティへ</a>
          <a href="#" data-act="trials" data-cancer="${c.id}">治験を探す</a>
        </div>`;
      list.appendChild(li);
    });
    histos.forEach(h=>{
      const li = document.createElement('li');
      const sitesBtns = (h.siteIds||[]).map(id=>{
        const s = (DATA.cancers||[]).find(x=>x.id===id);
        return s ? `<a href="#" data-act="trials" data-cancer="${s.id}" data-histology="${h.id}">${s.name}で治験</a>` : '';
      }).join(' ');
      li.innerHTML = `
        <strong>組織型：</strong>${h.name}
        <div class="meta">${(h.aliases||[]).join('・')}</div>
        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
          ${sitesBtns || `<a href="#" data-act="trials" data-histology="${h.id}">治験を探す</a>`}
        </div>`;
      list.appendChild(li);
    });
  }
  input.addEventListener('input', e=>render(e.target.value));
  input.addEventListener('compositionend', e=>render(e.target.value));
  list.addEventListener('click', e=>{
    const a = e.target.closest('a[data-act]'); if(!a) return;
    e.preventDefault();
    const act = a.dataset.act;
    const cancerId = a.dataset.cancer || null;
    const histologyId = a.dataset.histology || null;
    if (act==='community' && cancerId){ switchTab('community'); selectCancer(cancerId); return; }
    if (act==='trials'){ switchTab('community'); if(cancerId) selectCancer(cancerId); window.HISTO_CONTEXT = histologyId || null; }
  });
}

/* ---------------- コミュニティ ---------------- */
function initCommunity(){
  const sel  = document.getElementById('community-select');
  if(!sel) return;
  if (sel.options && sel.options.length > 1) return;
  const arrC = Array.isArray(DATA?.cancers) ? DATA.cancers : [];
  const arrH = Array.isArray(DATA?.histologies) ? DATA.histologies : [];
  sel.innerHTML = '';
  sel.insertAdjacentHTML('beforeend', `<option value="" disabled selected>種類を選んでください</option>`);
  arrC.forEach(c => sel.insertAdjacentHTML('beforeend', `<option value="c:${c.id}">${c.name}</option>`));
  arrH.forEach(h => sel.insertAdjacentHTML('beforeend', `<option value="h:${h.id}">組織型: ${h.name}</option>`));
  if (!sel.__hnc_bound__){
    sel.addEventListener('change', (e)=>{
      const val = e.target.value; if(!val) return;
      const [type,id] = val.split(':');
      if (type==='c'){ renderCommunityContent(id); }
      else if (type==='h'){
        const histo = (DATA.histologies||[]).find(x=>x.id===id);
        const primarySite = histo?.siteIds?.[0];
        if (primarySite){ window.HISTO_CONTEXT = id; renderCommunityContent(primarySite); }
      }
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
  const sel = document.getElementById('community-select'); if(!sel) return;
  sel.value = 'c:'+id;
  sel.dispatchEvent(new Event('change'));
}
async function renderCommunityContent(cancerId){
  const wrap = document.getElementById('community-content'); if(!wrap) return;
  const arr = Array.isArray(DATA?.cancers) ? DATA.cancers : [];
  const cancer = arr.find(c=>c.id===cancerId);
  if(!cancer){ wrap.innerHTML = '<p class="meta">該当のがん種が見つかりませんでした。</p>'; return; }
  const topicsHTML = (cancer.topics||[]).map((t,i)=>`
    <li class="topic-item" data-index="${i}">
      <button class="topic-toggle" type="button">
        <strong>${t.title}</strong> ${t.url ? '<span class="meta">（外部リンク）</span>' : ''}
      </button>
      <div class="topic-body" style="display:none;margin-top:6px;">
        ${t.desc ? `<div class="meta">${t.desc}</div>` : ''}
        ${t.url ? `<div style="margin-top:6px;"><a class="linklike" href="${t.url}" target="_blank" rel="noopener">リンクを開く</a></div>` : ''}
      </div>
    </li>`).join('') || '<li>トピックは準備中です。</li>';
  const linksHTML = (cancer.links||[]).map(l=>`<li><a href="${l.url}" target="_blank" rel="noopener">${l.title||l.url}</a></li>`).join('') || '<li>関連リンクは準備中です。</li>';
  const aliases = (cancer.aliases||[]).join('・');
  wrap.innerHTML = `
    <div class="card"><h3>${cancer.name} <span class="badge">${cancer.icd||''}</span></h3>${aliases?`<div class="meta">別名：${aliases}</div>`:''}</div>
    <div class="card"><h3>話題・トピック</h3><ul id="community-topics" class="list small">${topicsHTML}</ul></div>
    <div class="card"><h3>関連リンク</h3><ul class="list small">${linksHTML}</ul></div>
  `;
  const topicsList = document.getElementById('community-topics');
  if (topicsList){
    topicsList.addEventListener('click', (e)=>{
      const btn = e.target.closest('.topic-toggle'); if(!btn) return;
      const li = btn.closest('.topic-item');
      const body = li.querySelector('.topic-body'); if(!body) return;
      const visible = body.style.display !== 'none';
      body.style.display = visible ? 'none' : 'block';
    });
  }
  try{ filterTreatments(cancerId); }catch(e){}
  try{ filterLife(cancerId); }catch(e){}
  try{
    const histo = window.HISTO_CONTEXT || null;
    await loadTrials(cancerId, { histologyId:histo });
    window.HISTO_CONTEXT = null;
  }catch(e){ console.warn('trials', e); }
  try{ loadPosts(cancerId); }catch(e){}
}

/* ---------------- 治療情報リンク ---------------- */
function initTreatments(){ renderTreatmentsList(); }
function renderTreatmentsList(filterId){
  const ul = document.getElementById('treatment-links'); if(!ul) return;
  ul.innerHTML = '';
  const arr = Array.isArray(DATA?.treatments) ? DATA.treatments : [];
  const items = arr.filter(t => !filterId ? true : (Array.isArray(t.cancerIds) ? t.cancerIds.includes(filterId) : true));
  if (!items.length){ ul.innerHTML = '<li>該当のリンクは見つかりませんでした。</li>'; return; }
  items.forEach(t=>{
    const li = document.createElement('li');
    li.innerHTML = `<a href="${t.url}" target="_blank" rel="noopener">${t.title}</a> <span class="meta">— ${t.source||''}</span>`;
    ul.appendChild(li);
  });
}
function filterTreatments(id){ renderTreatmentsList(id); }

/* ---------------- 生活の工夫 ---------------- */
function initLife(){
  renderLifeControls();
  renderLifeList();
}
function renderLifeControls(){
  const lifeSection = document.getElementById('life'); if(!lifeSection) return;
  if (document.getElementById('life-cat-controls')) return;
  const controls = document.createElement('div');
  controls.id = 'life-cat-controls';
  controls.className = 'meta';
  controls.style.margin = '8px 0';
  LIFE_CATEGORY_DEFS.forEach(cat=>{
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'tab-btn'; btn.dataset.lifeCat = cat.id; btn.textContent = cat.label;
    controls.appendChild(btn);
  });
  lifeSection.insertBefore(controls, lifeSection.querySelector('.card'));
  controls.addEventListener('click', (e)=>{
    const b = e.target.closest('button[data-life-cat]'); if(!b) return;
    controls.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    renderLifeList(null, b.dataset.lifeCat);
  });
}
function renderLifeList(filterId, catId){
  const ul = document.getElementById('life-tips'); if(!ul) return;
  ul.innerHTML = '';
  const arr = Array.isArray(DATA?.life) ? DATA.life : [];
  let items = arr.filter(x => !filterId ? true : (Array.isArray(x.cancerIds) ? x.cancerIds.includes(filterId) : true));
  if (catId) items = items.filter(x => x.treatmentType === catId);
  if (!items.length){ ul.innerHTML = '<li>該当のヒントは見つかりませんでした。</li>'; return; }
  items.forEach(x=>{
    const li = document.createElement('li');
    li.innerHTML = `<strong>${x.title}</strong><div class="meta">${x.category||''}</div><div>${x.body||''}</div>`;
    ul.appendChild(li);
  });
}
function filterLife(id){
  const activeBtn = document.querySelector('#life-cat-controls button.active');
  const cat = activeBtn ? activeBtn.dataset.lifeCat : null;
  renderLifeList(id, cat);
}

/* ---------------- ブックマーク（ダミー） ---------------- */
function renderBookmarks(){
  const ul = document.getElementById('bookmarks');
  if(!ul) return;
  ul.innerHTML = '<li class="meta">ブックマークは準備中です。</li>';
}

/* ---------------- ClinicalTrials.gov 連携 ---------------- */
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

if (!window.TRIAL_QUERY){
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
if (!window.TRIAL_QUERY_HISTO){
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
    const orExpr = syns.map(s => `"${encodeURIComponent(String(s).replace(/\s+/g,'+'))}"`).join('+OR+');
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
    'LocationCountry','LocationCity','LocationState','StartDate','PrimaryCompletionDate','LastUpdatePostDate'
  ].join(',');
  const maxPerQuery = 12;
  const all = [];
  for (const expr of exprList){
    const url = `https://clinicaltrials.gov/api/query/study_fields?expr=${expr}&fields=${fields}&min_rnk=1&max_rnk=${maxPerQuery}&fmt=json`;
    let json;
    try{
      const res = await fetch(url, { cache:'no-store' });
      if (!res.ok) throw new Error(`trials fetch failed: ${res.status}`);
      json = await res.json();
    }catch(e){
      throw e; // CORS/503 は上位でフォールバック描画
    }
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
  // ユニーク化
  const seen = new Set(); const uniq = [];
  for (const t of all){ if (!t.id || seen.has(t.id)) continue; seen.add(t.id); uniq.push(t); }
  // 簡易スコア
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

window.TRIAL_FILTERS = { recruitingOnly:true, drugOnly:true, japanFirst:true, phaseMin:'2' };

// ==== 置換：renderTrialsFallback（信頼サイトの深掘りリンクつき） ====
function renderTrialsFallback(box, { cancerId=null, histologyId=null } = {}){
  const cancers = Array.isArray(DATA.cancers) ? DATA.cancers : [];
  const histos  = Array.isArray(DATA.histologies) ? DATA.histologies : [];
  const cancer  = cancers.find(c => c.id === cancerId) || null;
  const histo   = histos.find(h => h.id === histologyId) || null;

  // 部位の日本語ラベル（検索補助）
  const SITE_JP_LABELS = {
    oral:'口腔がん', oropharynx:'中咽頭がん', hypopharynx:'下咽頭がん',
    nasopharynx:'上咽頭がん', larynx:'喉頭がん', nasal:'鼻・副鼻腔がん',
    salivary:'唾液腺がん'
  };
  // Googleの site: を部位配下に寄せるための“ディレクトリ候補”
  // （厳密な下層URLはサイト側の構造変更で変わり得るため、public/cancer配下で部位名キーワードも併記して狙い撃ち）
  const SITE_HINT_WORD = {
    oral:'口腔', oropharynx:'中咽頭', hypopharynx:'下咽頭',
    nasopharynx:'上咽頭', larynx:'喉頭', nasal:'鼻 副鼻腔',
    salivary:'唾液腺'
  };

  // 検索語（狭い/広い）
  const narrowJP = (histo?.aliases?.[0]) || histo?.name || cancer?.name || '頭頸部がん';
  // 英語は ClinicalTrials.gov / PubMed 用
  const SITE_EN_LABELS = {
    oral:'oral cavity cancer', oropharynx:'oropharyngeal cancer', hypopharynx:'hypopharyngeal cancer',
    nasopharynx:'nasopharyngeal carcinoma', larynx:'laryngeal cancer', nasal:'nasal cavity or paranasal sinus cancer',
    salivary:'salivary gland cancer'
  };
  let narrowEN = 'head and neck cancer';
  if (histo){
    narrowEN =
      (histo.aliases||[]).find(a => /[a-z]/i.test(a)) ||
      (histo.name.match(/\((.+?)\)/)?.[1]) ||
      narrowEN;
  } else if (cancer){
    narrowEN = SITE_EN_LABELS[cancer.id] || narrowEN;
  }
  let broadJP = '頭頸部がん';
  let broadEN = 'head and neck cancer';
  if (histologyId === 'adenoid-cystic' || histologyId === 'mucoepidermoid' || cancerId === 'salivary') {
    broadJP = '唾液腺がん'; broadEN = 'salivary gland cancer';
  }

  // ====== 信頼できる情報（国内） deep search ======
  const qNarrowJP  = encodeURIComponent(narrowJP);
  const qSiteJP    = SITE_JP_LABELS[cancerId] || '';
  const hintWord   = SITE_HINT_WORD[cancerId] || '';

  // がん情報サービス：総合ページ＋サイト内検索＋部位配下に寄せた site: 検索（Google）
  const ganjohoBase   = 'https://ganjoho.jp';
  const ganjohoHeadHN = `${ganjohoBase}/public/cancer/head_neck/`;                 // 頭頸部総合
  const ganjohoWord   = `${ganjohoBase}/word/index.html?searchKeyword=${qNarrowJP}`; // サイト内用語検索
  // 「public/cancer」配下に限定し、部位ヒント語も同居させて“腺様嚢胞癌 × 唾液腺”等を狙い撃ち
  const ganjohoDeepQ  = encodeURIComponent(`site:ganjoho.jp/public/cancer ${narrowJP} ${hintWord}`); 
  const ganjohoDeep   = `https://www.google.com/search?q=${ganjohoDeepQ}`;

  // メディカルノート：通常検索＋ site: 限定
  const medBaseSearch = `https://medicalnote.jp/search?q=${qNarrowJP}`;
  const medDeepQ      = encodeURIComponent(`site:medicalnote.jp ${narrowJP} ${hintWord}`);
  const medDeep       = `https://www.google.com/search?q=${medDeepQ}`;

  // ====== 研究・治験 検索リンク（補助） ======
  const qJPa = encodeURIComponent(`${narrowJP} 治験`);
  const qENa = encodeURIComponent(`${narrowEN} clinical trial`);
  const qJPb = encodeURIComponent(`${broadJP} 治験`);
  const qENb = encodeURIComponent(`${broadEN} clinical trial`);

  const trustedLinksHTML = `
    <div class="card">
      <h3>信頼できる情報（国内）</h3>
      <ul class="list small">
        <li><a target="_blank" rel="noopener" href="${ganjohoHeadHN}">がん情報サービス：頭頸部（総合）</a></li>
        <li><a target="_blank" rel="noopener" href="${ganjohoWord}">がん情報サービス内 検索：「${escapeHtml(narrowJP)}」</a></li>
        <li><a target="_blank" rel="noopener" href="${ganjohoDeep}">がん情報サービス（部位配下に寄せた深掘り検索）：「${escapeHtml(narrowJP)}」×「${escapeHtml(hintWord)}」</a></li>
        <li><a target="_blank" rel="noopener" href="${medBaseSearch}">メディカルノート内 検索：「${escapeHtml(narrowJP)}」</a></li>
        <li><a target="_blank" rel="noopener" href="${medDeep}">メディカルノート（深掘り site: 検索）：「${escapeHtml(narrowJP)}」×「${escapeHtml(hintWord)}」</a></li>
      </ul>
      <p class="meta">※部位配下に絞った <code>site:</code> 検索も併用し、該当ページに“最短で”当たれるようにしています。</p>
    </div>
  `;

  const searchLinksHTML = `
    <div class="card">
      <h3>自動検索リンク（補助）</h3>
      <p class="meta">API取得に失敗/0件のため、狭い・広い両方の候補も提示します。</p>
      <ul class="list small">
        <li><strong>狭い：</strong>
          <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qJPa}">Google（日本語）</a> ／
          <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qENa}">Google（英語）</a> ／
          <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${qENa}">CT.gov 内検索</a>
        </li>
        <li><strong>広い：</strong>
          <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qJPb}">Google（日本語）</a> ／
          <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qENb}">Google（英語）</a> ／
          <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${qENb}">CT.gov 内検索</a>
        </li>
      </ul>
    </div>
  `;

  box.innerHTML = trustedLinksHTML + searchLinksHTML;
}
function passFilters(t){
  const F = window.TRIAL_FILTERS;
  if (F.recruitingOnly && !/Recruiting|Enrolling|Not\s+yet\s+recruiting/i.test(t.status||'')) return false;
  if (F.drugOnly && !((t.interventionTypes||[]).some(x => /Drug|Biological|Device|Combination Product/i.test(x)))) return false;
  const phNum = (t.phase||'').match(/(\d)/)?.[1] || null;
  if (F.phaseMin !== 'Any' && phNum && Number(phNum) < Number(F.phaseMin)) return false;
  return true;
}
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
        const drugBadge = (t.interventionTypes||[]).some(x => /Drug|Biological/i.test(x)) ? `<span class="badge">Drug</span>` : '';
        const jpBadge = (t.countries||[]).some(c => /Japan/i.test(c)) ? `<span class="badge">JP</span>` : '';
        const ph = t.phase ? `／ <span class="badge">${escapeHtml(t.phase)}</span>` : '';
        return `
        <li>
          <a href="https://clinicaltrials.gov/study/${t.id}" target="_blank" rel="noopener">
            <strong>${escapeHtml(t.title || t.id)}</strong>
          </a>
          <div class="meta">
            ID: ${t.id} ／ 状況: ${escapeHtml(t.status||'')} ${ph} ／ 更新: ${escapeHtml(t.updated||'')} ${drugBadge} ${jpBadge}
          </div>
          ${t.sponsor ? `<div class="meta">主担当機関: ${escapeHtml(t.sponsor)}</div>` : ''}
          ${t.interventions && t.interventions.length ? `<div class="meta">介入: <strong>${t.interventions.map(escapeHtml).join(' / ')}</strong></div>` : ''}
          ${t.cond ? `<div class="meta">対象: ${escapeHtml(t.cond)}</div>` : ''}
        </li>`;
      }).join('')}
    </ul>
  `;
}
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
async function loadTrials(cancerId, { histologyId=null } = {}){
  const box = document.getElementById('trials');
  if (!box) return;
  box.innerHTML = '';
  renderTrialsControls(box);
  const host = document.createElement('div');
  host.id = 'trials-list-host';
  box.appendChild(host);
  host.innerHTML = '<div class="meta">読み込み中…</div>';
  try {
    const trials = await fetchTrials({ cancerId, histologyId });
    __TRIALS_CACHE = trials.slice();
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

/* ---------------- ユーティリティ ---------------- */
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ---------------- 投稿（ダミー） ---------------- */
function loadPosts(/* cancerId */){ /* 実装する場合はここに */ }
