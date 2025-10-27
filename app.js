/* =========================================================
   HNC Community PWA - app.js v37（生活の工夫を大幅強化）
   - 生活の工夫：手術/放射線治療/抗がん剤治療/その他 に分類し直し
   - 各カテゴリに多数の実用項目を追加（重複チェック付き）
   - 既存データ(resources.json)にstageが無い場合でも自動で割当
   - コミュニティ/治験/論文/ガイドライン機能は前版(v36)を維持
   ========================================================= */

/* ========== FALLBACK（要点のみ） ========== */
const DATA_FALLBACK = {
  cancers: [
    { id:"oral",        name:"口腔がん（舌・口底など）", icd:"C00-C06",
      aliases:["口腔癌","舌がん","舌癌","歯肉がん","口底がん","oral cancer","oral cavity cancer","C00","C01","C02","C03","C04","C05","C06"],
      topics:[{title:"術後の発音・嚥下リハ",desc:"STと進めるホームエクササイズ"}],
      links:[{title:"がん情報サービス（頭頸部）",url:"https://ganjoho.jp/public/cancer/head_neck/"}] },
    { id:"oropharynx",  name:"中咽頭がん", icd:"C10", aliases:["中咽頭癌","HPV関連がん","oropharyngeal cancer","C10"] },
    { id:"hypopharynx", name:"下咽頭がん", icd:"C13", aliases:["下咽頭癌","hypopharyngeal cancer","C13"] },
    { id:"nasopharynx", name:"上咽頭がん", icd:"C11", aliases:["上咽頭癌","NPC","nasopharyngeal carcinoma","C11"] },
    { id:"larynx",      name:"喉頭がん",   icd:"C32", aliases:["喉頭癌","laryngeal cancer","C32"],
      topics:[{title:"発声代替",desc:"電気式人工喉頭・食道発声・シャント"}]},
    { id:"nasal",       name:"鼻腔がん",   icd:"C30-C31", aliases:["鼻腔癌","副鼻腔がん","鼻副鼻腔がん","nasal cavity cancer","paranasal sinus cancer","C30","C31"] },
    { id:"salivary",    name:"唾液腺がん", icd:"C07-C08", aliases:["唾液腺癌","耳下腺がん","顎下腺がん","舌下腺がん","parotid","salivary gland cancer","parotid cancer","C07","C08"] }
  ],
  treatments: [
    {title:"がん情報サービス（頭頸部）", url:"https://ganjoho.jp/public/cancer/head_neck/", source:"国立がん研究センター",
     cancerIds:["oral","oropharynx","hypopharynx","nasopharynx","larynx","nasal","salivary"]}
  ],
  life: [
    {id:"oral-care-rt",title:"放射線治療中の口腔ケア基本",category:"口腔ケア",stage:"radiation",
     body:"やわらかめ歯ブラシ＋フッ化物含嗽。無アルコール洗口液。粘膜炎が強い時は圧を最小に。義歯は短時間使用。",
     cancerIds:["oral","oropharynx","nasopharynx","larynx","nasal","salivary"]}
  ],
  histologies: [
    { id:"adenoid-cystic", name:"腺様嚢胞癌（Adenoid cystic carcinoma）", aliases:["腺様嚢胞癌","腺様のう胞がん","adenoid cystic carcinoma","ACC"], siteIds:["salivary","nasal","oral"] },
    { id:"mucoepidermoid", name:"粘表皮癌（Mucoepidermoid carcinoma）", aliases:["粘表皮癌","粘表皮がん","mucoepidermoid carcinoma","MEC"], siteIds:["salivary","nasal","oral","oropharynx"] },
    { id:"mucosal-melanoma", name:"悪性黒色腫（粘膜）", aliases:["悪性黒色腫","メラノーマ","melanoma","mucosal melanoma"], siteIds:["nasal","oral","oropharynx"] },
    { id:"lymphoma", name:"リンパ腫", aliases:["リンパ腫","悪性リンパ腫","lymphoma"], siteIds:["oropharynx","nasopharynx"] },
    { id:"sarcoma", name:"肉腫", aliases:["肉腫","sarcoma","横紋筋肉腫","骨肉腫","線維肉腫"], siteIds:["oral","nasal","oropharynx"] }
  ]
};

let DATA = { cancers: [], treatments: [], life: [], histologies: [] };
let CURRENT_CANCER_ID = null;
let CURRENT_HISTO_ID = null;
let __TRIALS_CACHE = [];

/* ========== 起動 ========== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else { boot(); }

async function boot(){
  await loadData();
  normalizeAndEnrichLife(); // ★ 生活の工夫を強化＆分類
  initTabs();
  initHome();
  initHistology();
  initGlobalSearch();
  initCommunity();
  initTreatments();
  initLife();
  renderBookmarks();
  applyTabFromHash();
  window.addEventListener('hashchange', applyTabFromHash);
}

/* ========== データ読み込み ========== */
async function loadData(){
  let ok = false;
  try{
    const res = await fetch('./resources.json?v=3', { cache: 'no-store' });
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
  if(!ok){ console.warn('[loadData] using FALLBACK data'); DATA = { ...DATA_FALLBACK }; }
}

/* ========== 生活の工夫：分類補正＋大量追補 ========== */
function normalizeAndEnrichLife(){
  if (!Array.isArray(DATA.life)) DATA.life = [];
  const mapStageById = {
    'oral-care-rt':'radiation','mucositis-care':'radiation','xerostomia':'radiation','taste':'radiation',
    'dysphagia-st':'surgery','food-mod':'surgery','voice-prosthesis':'surgery','trismus':'surgery',
    'neck-fibrosis':'radiation','lymphedema':'surgery','skin-rt':'radiation','dental':'radiation',
    'nutrition':'chemo','peg-ng':'chemo','pain':'chemo','fatigue':'chemo',
    'mental':'other','work':'other','financial':'other','caregiver':'other',
    'stoma-care':'surgery','shoulder':'surgery','smell':'radiation','sun':'surgery',
    'speech-aids':'surgery','oral-bleeding':'surgery'
  };
  // 既存項目に stage を自動付与
  DATA.life.forEach(x=>{
    if (!x.stage) { x.stage = mapStageById[x.id] || 'other'; }
  });

  const ensure = (id, item) => {
    const hit = DATA.life.find(x=>x.id===id);
    if (!hit) DATA.life.push(item);
  };

  /* ---- 手術（surgery） ---- */
  ensure('surg-wound-care',{
    id:'surg-wound-care', stage:'surgery', category:'創部ケア',
    title:'創部の清潔と保護', body:'シャワー許可後は優しく洗浄し、水分をしっかり拭き取り保湿。擦らない。発赤・熱感・膿・悪臭は早期受診。',
    cancerIds:['oral','nasal','salivary','larynx','oropharynx']
  });
  ensure('surg-graft-uv',{
    id:'surg-graft-uv', stage:'surgery', category:'皮膚移植/瘢痕',
    title:'移植部・瘢痕の紫外線対策', body:'SPF30+の日焼け止め・帽子・スカーフ。色素沈着や瘢痕肥厚の悪化を防ぐため直射日光を避ける。',
    cancerIds:['oral','nasal','salivary','larynx']
  });
  ensure('surg-shoulder-protocol',{
    id:'surg-shoulder-protocol', stage:'surgery', category:'肩（副神経）',
    title:'肩甲帯の安定化・可動域維持', body:'僧帽筋代償トレ・壁這い運動・セラバンド外旋。痛みは“心地よい”範囲で継続、日常生活でバッグを片側に掛け続けない。',
    cancerIds:['oral','oropharynx','hypopharynx','nasopharynx','salivary']
  });
  ensure('surg-trismus-dev',{
    id:'surg-trismus-dev', stage:'surgery', category:'開口障害',
    title:'開口訓練（器具/ホームエクササイズ）', body:'指タテ・スティック・開口器を1日3–5回、各回30–60秒×数セット。温罨法で前処置。',
    cancerIds:['oral','oropharynx','nasal','salivary']
  });
  ensure('surg-return-eating',{
    id:'surg-return-eating', stage:'surgery', category:'嚥下',
    title:'食事再開の段階付け', body:'ST評価のもと、ゼリー/プリン→きざみの少ない軟食へ。姿勢は軽度頸部屈曲、少量・ゆっくり・複数回飲下。',
    cancerIds:['oral','oropharynx','hypopharynx','larynx']
  });
  ensure('surg-speech-aids',{
    id:'surg-speech-aids', stage:'surgery', category:'発声・構音',
    title:'構音の工夫（舌・口底切除後）', body:'短文/ゆっくり・確認しながら。キーボード入力や音声合成アプリ併用。必要に応じてSTへ。',
    cancerIds:['oral']
  });
  ensure('surg-lymph-self',{
    id:'surg-lymph-self', stage:'surgery', category:'リンパ浮腫',
    title:'顔面・頸部リンパ浮腫セルフケア', body:'スキンケア→軽擦→頸部誘導。弾性着衣は専門家指導下で。感染兆候（発赤・熱感）は受診。',
    cancerIds:['oral','oropharynx','hypopharynx','nasopharynx','larynx','salivary']
  });
  ensure('surg-stoma-daily',{
    id:'surg-stoma-daily', stage:'surgery', category:'ストーマ',
    title:'気管孔（ストーマ）の日常管理', body:'HMEで加湿、痰の湿性化。シャワー時はカバー。吸引器具は清潔に。出血・異臭は早期相談。',
    cancerIds:['larynx']
  });
  ensure('surg-oral-bleeding',{
    id:'surg-oral-bleeding', stage:'surgery', category:'口腔ケア',
    title:'口腔の出血・潰瘍時の対応', body:'氷で冷却・清潔ガーゼで優しく圧迫。止血困難や広範な潰瘍は受診。抗凝固薬は自己中止しない。',
    cancerIds:['oral','oropharynx','salivary']
  });

  /* ---- 放射線治療（radiation） ---- */
  ensure('rt-oral-hygiene',{
    id:'rt-oral-hygiene', stage:'radiation', category:'口腔ケア',
    title:'放射線中の口腔ケア基本', body:'やわらかめ歯ブラシ＋フッ化物含嗽。無アルコール洗口液。粘膜炎が強い時は圧を最小に。義歯は短時間使用。',
    cancerIds:['oral','oropharynx','nasopharynx','larynx','nasal','salivary']
  });
  ensure('rt-mucositis-analgesia',{
    id:'rt-mucositis-analgesia', stage:'radiation', category:'粘膜炎',
    title:'口内炎の痛み対策', body:'冷飲食・氷片・リドカイン含嗽の相談。辛い/酸っぱい/熱い飲食は回避。二次感染の兆候に注意。',
    cancerIds:['oral','oropharynx','nasopharynx']
  });
  ensure('rt-xerostomia-tools',{
    id:'rt-xerostomia-tools', stage:'radiation', category:'唾液減少',
    title:'口腔乾燥の工夫', body:'人工唾液・無糖ガム・氷片、夜間は寝室加湿。高濃度フッ化物でう蝕予防、定期歯科フォロー。',
    cancerIds:['oral','oropharynx','nasopharynx','larynx','salivary']
  });
  ensure('rt-neck-fibrosis',{
    id:'rt-neck-fibrosis', stage:'radiation', category:'線維化/拘縮',
    title:'頸部のこわばり対策', body:'肩甲帯/頸部ストレッチ、ROM訓練を毎日短時間×複数回。重い荷物・長時間同姿勢は控える。',
    cancerIds:['oropharynx','hypopharynx','nasopharynx','larynx']
  });
  ensure('rt-skin-care',{
    id:'rt-skin-care', stage:'radiation', category:'皮膚',
    title:'放射線皮膚炎のケア', body:'低刺激保湿を毎日。摩擦・日光・熱刺激を避ける。びらん時は医師指示薬を使用、独自療法は避ける。',
    cancerIds:['oral','oropharynx','hypopharynx','nasopharynx','larynx','nasal','salivary']
  });
  ensure('rt-taste-smell',{
    id:'rt-taste-smell', stage:'radiation', category:'味覚/嗅覚',
    title:'味覚低下への対応', body:'香り（だし・ハーブ）と温度で風味補強。金属味はプラ製スプーンや冷食で緩和。嗅覚訓練も併用。',
    cancerIds:['oral','oropharynx','nasopharynx','larynx','nasal','salivary']
  });
  ensure('rt-thyroid',{
    id:'rt-thyroid', stage:'radiation', category:'内分泌',
    title:'甲状腺機能のチェック', body:'頸部照射後は数か月〜年単位でTSH/FT4の評価を。倦怠感・寒がり・体重増加が続けば受診。',
    cancerIds:['oropharynx','hypopharynx','larynx','nasopharynx']
  });

  /* ---- 抗がん剤治療（chemo） ---- */
  ensure('chemo-antiemesis',{
    id:'chemo-antiemesis', stage:'chemo', category:'悪心/嘔吐',
    title:'悪心・嘔吐のセルフマネジメント', body:'予防制吐薬を規則正しく。少量頻回・脂っこい/匂い強い食事回避。脱水・体重・尿量をモニタ。',
    cancerIds:['oral','oropharynx','nasopharynx','larynx','nasal','salivary']
  });
  ensure('chemo-nutrition',{
    id:'chemo-nutrition', stage:'chemo', category:'栄養',
    title:'体重減少を抑えるコツ', body:'少量高カロリーを回数で。栄養補助飲料・油脂追加・間食。摂れない時は早めに栄養サポートへ。',
    cancerIds:['oral','oropharynx','hypopharynx','nasopharynx','larynx','nasal','salivary']
  });
  ensure('chemo-peg-ng',{
    id:'chemo-peg-ng', stage:'chemo', category:'経腸栄養',
    title:'NG/PEGの整備と運用', body:'一時的に休嚥下しつつリハ。皮膚・固定テープの清潔、詰まり防止のフラッシュを習慣化。',
    cancerIds:['oropharynx','hypopharynx','nasopharynx','larynx']
  });
  ensure('chemo-neuropathy',{
    id:'chemo-neuropathy', stage:'chemo', category:'末梢神経障害',
    title:'しびれ対策', body:'冷感回避・転倒予防・細かな作業は工夫。症状記録を主治医へ。日常生活動作の安全確保。',
    cancerIds:['oral','oropharynx','nasopharynx','larynx','nasal','salivary']
  });
  ensure('chemo-ototox',{
    id:'chemo-ototox', stage:'chemo', category:'聴力/耳鳴り',
    title:'シスプラチン関連の耳症状', body:'耳鳴り・聴こえづらさは早めに報告。大音量回避。必要に応じて聴力評価。',
    cancerIds:['oropharynx','nasopharynx','larynx']
  });
  ensure('chemo-infection',{
    id:'chemo-infection', stage:'chemo', category:'感染対策',
    title:'好中球減少時の注意', body:'発熱38℃以上は時間外でも連絡。手指衛生・人混み回避・生もの控えめ。口腔/皮膚の清潔。',
    cancerIds:['oral','oropharynx','nasopharynx','larynx','nasal','salivary']
  });
  ensure('chemo-pain',{
    id:'chemo-pain', stage:'chemo', category:'痛み',
    title:'痛みの段階的コントロール', body:'アセトアミノフェン→NSAIDs→オピオイド、便秘対策を併行。神経障害性痛は補助薬も選択肢。',
    cancerIds:['oral','oropharynx','hypopharynx','nasopharynx','larynx','salivary','nasal']
  });
  ensure('chemo-fatigue',{
    id:'chemo-fatigue', stage:'chemo', category:'全身',
    title:'がん関連疲労（CRF）', body:'短時間の有酸素＋レジスタンス運動を週数回。睡眠衛生・昼寝は20–30分。貧血/甲状腺評価も。',
    cancerIds:['oral','oropharynx','hypopharynx','nasopharynx','larynx','salivary','nasal']
  });

  /* ---- その他（other：心理/社会/横断） ---- */
  ensure('other-mental',{
    id:'other-mental', stage:'other', category:'こころ',
    title:'不安・抑うつへのセルフヘルプ', body:'呼吸法・マインドフルネス・ピアサポート。強い持続症状はサイコオンコロジー外来へ。',
    cancerIds:['oral','oropharynx','hypopharynx','nasopharynx','larynx','salivary','nasal']
  });
  ensure('other-work',{
    id:'other-work', stage:'other', category:'社会/就労',
    title:'仕事・学業への復帰準備', body:'主治医の就労配慮指示書を活用。段階的復職（短時間勤務）＋在宅併用。必要な配慮事項を具体化。',
    cancerIds:['oral','oropharynx','hypopharynx','nasopharynx','larynx','salivary','nasal']
  });
  ensure('other-finance',{
    id:'other-finance', stage:'other', category:'制度/費用',
    title:'公的支援・費用の助成', body:'高額療養費・傷病手当金・障害者手帳・医療費控除。地域のがん相談支援センターを活用。',
    cancerIds:['oral','oropharynx','hypopharynx','nasopharynx','larynx','salivary','nasal']
  });
  ensure('other-caregiver',{
    id:'other-caregiver', stage:'other', category:'家族',
    title:'介護者の負担軽減', body:'役割分担と“休む日”を作る。訪問看護・レスパイト・地域包括支援。情報共有ノートを1冊に。',
    cancerIds:['oral','oropharynx','hypopharynx','nasopharynx','larynx','salivary','nasal']
  });
}

/* ========== タブ切替 ========== */
function initTabs(){
  document.querySelectorAll('[data-tab]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const tab = e.currentTarget.dataset.tab;
      if (!tab) return;
      const want = '#'+tab;
      if (location.hash !== want) location.hash = want;
      else applyTab(tab);
    });
  });
}
function applyTabFromHash(){
  const tab = (location.hash || '#home').replace('#','');
  applyTab(tab);
}
function applyTab(tab){
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById(tab)?.classList.add('active');
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));
  if (tab === 'community' && CURRENT_CANCER_ID) {
    prepareGuidelineAndResearch(CURRENT_CANCER_ID, CURRENT_HISTO_ID);
    prepareTrialsBox();
  }
}

/* ========== ホーム（部位検索） ========== */
function initHome(){
  const list = document.getElementById('cancer-list');
  const input = document.getElementById('cancer-search');
  if(!list || !input) return;
  const norm = nrm();
  function render(filterText=''){
    const f = norm(filterText); list.innerHTML = '';
    const arr = Array.isArray(DATA?.cancers) ? DATA.cancers : [];
    if (!arr.length){ list.innerHTML = '<li>データが読み込めていません。</li>'; return; }
    const items = arr.filter(c => [c.name, ...(c.aliases||[]), c.icd||''].map(norm).join('||').includes(f));
    if (!items.length){ list.innerHTML = '<li>該当が見つかりません。</li>'; return; }
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
  input.addEventListener('input', e => render(e.target.value));
  input.addEventListener('compositionend', e => render(e.target.value));
  list.addEventListener('click', e=>{
    const a=e.target.closest('a[data-jump]'); if(!a) return; e.preventDefault();
    const tab=a.dataset.jump, id=a.dataset.cancer; switchToTab(tab);
    if (tab==='community'){ selectCancer(id); }
    if (tab==='treatments'){ filterTreatments(id); }
    if (tab==='life'){ filterLife(id); }
  });
  render('');
}

/* ========== ホーム（組織型検索） ========== */
function initHistology(){
  const list = document.getElementById('histo-list');
  const input = document.getElementById('histo-search');
  if(!list || !input) return;
  const norm = nrm();
  function render(filterText=''){
    const f = norm(filterText); list.innerHTML='';
    const arr = Array.isArray(DATA?.histologies) ? DATA.histologies : (DATA_FALLBACK.histologies||[]);
    if (!arr.length){ list.innerHTML = '<li>組織型データがありません。</li>'; return; }
    const items = arr.filter(h => [h.name, ...(h.aliases||[])].map(norm).join('||').includes(f));
    if (!items.length){ list.innerHTML = '<li>該当する組織型が見つかりません。</li>'; return; }
    items.forEach(h=>{
      const siteButtons = (h.siteIds||[]).map(id=>{
        const site = (DATA.cancers||[]).find(c=>c.id===id) || (DATA_FALLBACK.cancers||[]).find(c=>c.id===id);
        return site ? `<button class="tab-btn linklike" data-jump="community" data-cancer="${site.id}" data-histology="${h.id}">${site.name}</button>` : '';
      }).join(' ');
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${h.name}</strong>
        <div class="meta">${(h.aliases||[]).join('・')}</div>
        ${siteButtons ? `<div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">${siteButtons}</div>` : ''}`;
      list.appendChild(li);
    });
  }
  input.addEventListener('input', e=>render(e.target.value));
  input.addEventListener('compositionend', e=>render(e.target.value));
  list.addEventListener('click', e=>{
    const b=e.target.closest('button[data-jump][data-cancer]'); if(!b) return; e.preventDefault();
    CURRENT_HISTO_ID = b.dataset.histology || null;
    switchToTab('community'); selectCancer(b.dataset.cancer);
  });
  render('');
}

/* ========== 統合検索（global-search） ========== */
function initGlobalSearch(){
  const input = document.getElementById('global-search');
  const list  = document.getElementById('global-results');
  if(!input || !list) return;
  const norm = nrm();

  function matchAll(q){
    const f = norm(q);
    const sites  = (DATA.cancers||[]).filter(c => [c.name, ...(c.aliases||[]), c.icd||''].map(norm).join('||').includes(f));
    const histos = (DATA.histologies||[]).filter(h => [h.name, ...(h.aliases||[])].map(norm).join('||').includes(f));
    return { sites, histos };
  }

  function render(q=''){
    list.innerHTML=''; if(!q) return;
    const { sites, histos } = matchAll(q);
    if(!sites.length && !histos.length){ list.innerHTML='<li class="meta">候補が見つかりませんでした。</li>'; return; }

    sites.forEach(c=>{
      const li=document.createElement('li');
      const { guideline, research } = buildGuidelineAndResearchLinks(c.id, null);
      li.innerHTML=`
        <strong>部位：</strong>${c.name} <span class="badge">${c.icd||''}</span>
        <div class="meta">${(c.aliases||[]).join('・')}</div>
        <div style="margin-top:6px;display:flex;gap:10px;flex-wrap:wrap">
          <a href="#" data-act="community" data-cancer="${c.id}">コミュニティへ</a>
          <a href="#" data-act="trials" data-cancer="${c.id}">治験を探す</a>
          ${guideline.slice(0,2).map(a=>`<a target="_blank" rel="noopener" href="${a.url}">${a.title}</a>`).join('')}
          ${research.slice(0,1).map(a=>`<a target="_blank" rel="noopener" href="${a.url}">${a.title}</a>`).join('')}
        </div>`;
      list.appendChild(li);
    });

    histos.forEach(h=>{
      const sitesBtns = (h.siteIds||[]).map(id=>{
        const s=(DATA.cancers||[]).find(x=>x.id===id);
        return s ? `<a href="#" data-act="trials" data-cancer="${s.id}" data-histology="${h.id}">${s.name}で治験</a>` : '';
      }).join(' ');
      const { guideline, research } = buildGuidelineAndResearchLinks(null, h.id);
      const li=document.createElement('li');
      li.innerHTML=`
        <strong>組織型：</strong>${h.name}
        <div class="meta">${(h.aliases||[]).join('・')}</div>
        <div style="margin-top:6px;display:flex;gap:10px;flex-wrap:wrap">
          ${sitesBtns || `<a href="#" data-act="trials" data-histology="${h.id}">治験を探す</a>`}
          ${guideline.slice(0,2).map(a=>`<a target="_blank" rel="noopener" href="${a.url}">${a.title}</a>`).join('')}
          ${research.slice(0,1).map(a=>`<a target="_blank" rel="noopener" href="${a.url}">${a.title}</a>`).join('')}
        </div>`;
      list.appendChild(li);
    });
  }

  input.addEventListener('input', e=>render(e.target.value));
  input.addEventListener('compositionend', e=>render(e.target.value));
  list.addEventListener('click', e=>{
    const a=e.target.closest('a[data-act]'); if(!a) return; e.preventDefault();
    const act=a.dataset.act, cancerId=a.dataset.cancer||null, histologyId=a.dataset.histology||null;
    if(act==='community' && cancerId){ switchToTab('community'); selectCancer(cancerId); return; }
    if(act==='trials'){ switchToTab('community'); if(cancerId) selectCancer(cancerId); CURRENT_HISTO_ID = histologyId || null; }
  });
}

/* ========== コミュニティ周り（前版と同等） ========== */
function initCommunity(){
  const sel = document.getElementById('community-select');
  const wrap = document.getElementById('community-content');
  if (!sel || !wrap) return;
  sel.innerHTML = '<option value="" disabled selected>がんの種類を選んでください</option>';
  (DATA.cancers||[]).forEach(c => sel.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.name}</option>`));
  if (!sel.__bound__) {
    sel.addEventListener('change', (e)=>{ const id = e.target.value; if(!id) return; renderCommunityContent(id); });
    sel.__bound__ = true;
  }
}
function selectCancer(id){
  const sel = document.getElementById('community-select'); if(!sel) return;
  sel.value = id; sel.dispatchEvent(new Event('change'));
}
async function renderCommunityContent(cancerId){
  CURRENT_CANCER_ID = cancerId;
  const wrap = document.getElementById('community-content'); if(!wrap) return;
  const c = (DATA.cancers||[]).find(x=>x.id===cancerId);
  if (!c){ wrap.innerHTML='<p class="meta">該当のがん種が見つかりませんでした。</p>'; return; }

  const aliases = (c.aliases||[]).join('・');
  const topicsHTML = (c.topics||[]).map((t,i)=>`
    <li class="topic-item" data-index="${i}">
      <button class="topic-toggle" type="button"><strong>${t.title}</strong>${t.url?'<span class="meta">（クリックで外部サイト）</span>':''}</button>
      <div class="topic-body" style="display:none;margin-top:6px;">
        ${t.desc?`<div class="meta">${t.desc}</div>`:''}
        ${t.url?`<div style="margin-top:6px;"><a class="linklike" target="_blank" rel="noopener" href="${t.url}">リンクを開く</a></div>`:''}
      </div>
    </li>`).join('') || '<li>トピックは準備中です。</li>';

  const linksHTML = (c.links||[]).map(l=>`<li><a target="_blank" rel="noopener" href="${l.url}">${l.title||l.url}</a></li>`).join('') || '<li>関連リンクは準備中です。</li>';

  wrap.innerHTML = `
    <div class="card">
      <h3>${c.name} <span class="badge">${c.icd||''}</span></h3>
      ${aliases?`<div class="meta">別名：${aliases}</div>`:''}
    </div>
    <div class="card">
      <h3>話題・トピック</h3>
      <ul id="community-topics" class="list small">${topicsHTML}</ul>
    </div>
    <div class="card">
      <h3>関連リンク</h3>
      <ul class="list small">${linksHTML}</ul>
    </div>`;

  const topicsList = document.getElementById('community-topics');
  if (topicsList){
    topicsList.addEventListener('click', (e)=>{
      const btn = e.target.closest('.topic-toggle'); if(!btn) return;
      const li = btn.closest('.topic-item'); const idx=Number(li?.dataset.index ?? -1);
      const topic=(c.topics||[])[idx];
      if(topic?.url){ window.open(topic.url,'_blank','noopener'); return; }
      const body = li.querySelector('.topic-body'); if(!body) return;
      const vis = body.style.display !== 'none'; body.style.display = vis ? 'none' : 'block';
    }, { once:true });
  }

  prepareGuidelineAndResearch(cancerId, CURRENT_HISTO_ID);
  await loadTrials(cancerId, { histologyId: CURRENT_HISTO_ID });
  CURRENT_HISTO_ID = null;
}

/* ========== ガイドライン & 研究リンク ========== */
const SITE_EN = {
  oral:'oral cavity cancer', oropharynx:'oropharyngeal cancer', hypopharynx:'hypopharyngeal cancer',
  nasopharynx:'nasopharyngeal carcinoma', larynx:'laryngeal cancer',
  nasal:'nasal cavity or paranasal sinus cancer', salivary:'salivary gland cancer'
};
const HISTO_EN = {
  'adenoid-cystic':'adenoid cystic carcinoma',
  'mucoepidermoid':'mucoepidermoid carcinoma',
  'mucosal-melanoma':'mucosal melanoma',
  'lymphoma':'head and neck lymphoma',
  'sarcoma':'head and neck sarcoma'
};
function buildGuidelineAndResearchLinks(cancerId=null, histologyId=null){
  const condEN = histologyId ? (HISTO_EN[histologyId] || 'head and neck cancer')
               : cancerId    ? (SITE_EN[cancerId]   || 'head and neck cancer')
               : 'head and neck cancer';
  const guideline = [
    { title:'がん情報サービス（頭頸部）', url:'https://ganjoho.jp/public/cancer/head_neck/' },
    { title:'NCI PDQ: Head and Neck（患者向け）', url:'https://www.cancer.gov/types/head-and-neck' },
    { title:'NCI PDQ: Head and Neck（医療者向け）', url:'https://www.cancer.gov/publications/pdq' },
    { title:'NICE: head and neck cancer', url:'https://www.nice.org.uk/search?q=head+and+neck+cancer' },
    { title:'ESMO Guidelines', url:'https://www.esmo.org/guidelines' },
    { title:'ASCO Guidelines', url:'https://www.asco.org/guidelines' },
    { title:'Cancer Research UK', url:'https://www.cancerresearchuk.org/about-cancer' }
  ];
  const research = [
    { title:'PubMed: Clinical Trial (last 3y)', url:`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(condEN)}&filter=datesearch.y_3&filter=pubt.clinicaltrial` },
    { title:'PubMed: RCT (last 3y)', url:`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(condEN)}&filter=datesearch.y_3&filter=pubt.randomizedcontrolledtrial` },
    { title:'ClinicalTrials.gov（検索）', url:`https://clinicaltrials.gov/search?cond=${encodeURIComponent(condEN)}` }
  ];
  return { guideline, research, condEN };
}
function prepareGuidelineAndResearch(cancerId=null, histologyId=null){
  const { guideline, research } = buildGuidelineAndResearchLinks(cancerId, histologyId);
  const gUL = document.getElementById('guideline-links');
  const rUL = document.getElementById('research-links');
  if (gUL) gUL.innerHTML = guideline.map(x=>`<li><a target="_blank" rel="noopener" href="${x.url}">${x.title}</a></li>`).join('');
  if (rUL) rUL.innerHTML = research.map(x=>`<li><a target="_blank" rel="noopener" href="${x.url}">${x.title}</a></li>`).join('');
}

/* ========== 治療リンク ========== */
function initTreatments(){ renderTreatmentsList(); }
function renderTreatmentsList(filterId){
  const ul=document.getElementById('treatment-links'); if(!ul) return; ul.innerHTML='';
  const arr = Array.isArray(DATA?.treatments) ? DATA.treatments : [];
  const items = arr.filter(t => !filterId ? true : (Array.isArray(t.cancerIds) ? t.cancerIds.includes(filterId) : true));
  if(!items.length){ ul.innerHTML='<li>該当のリンクは見つかりませんでした。</li>'; return; }
  items.forEach(t=>{
    const li=document.createElement('li');
    li.innerHTML=`<a target="_blank" rel="noopener" href="${t.url}">${t.title}</a> <span class="meta">— ${t.source||''}</span>`;
    ul.appendChild(li);
  });
}
function filterTreatments(id){ renderTreatmentsList(id); }

/* ========== 生活の工夫（表示） ========== */
function initLife(){
  // サブタブ切替
  document.querySelectorAll('.life-tab').forEach(b=>{
    b.addEventListener('click', (e)=>{
      document.querySelectorAll('.life-tab').forEach(x=>x.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const stage = e.currentTarget.dataset.life;
      renderLifeList(null, stage);
    });
  });
  // 既定は「手術」
  renderLifeList(null, 'surgery');
}
function renderLifeList(filterId, stage){
  const ul = document.getElementById('life-tips'); if(!ul) return; ul.innerHTML='';
  const arr = Array.isArray(DATA?.life) ? DATA.life : [];
  const items = arr.filter(x=>{
    const okStage = stage ? (x.stage||'other')===stage : true;
    const okCancer = filterId ? (Array.isArray(x.cancerIds)?x.cancerIds.includes(filterId):true) : true;
    return okStage && okCancer;
  });
  if(!items.length){ ul.innerHTML='<li>該当のヒントは見つかりませんでした。</li>'; return; }
  // 同カテゴリ内で見やすく：category → title の順で並べる
  items.sort((a,b)=> (a.category||'').localeCompare(b.category||'') || (a.title||'').localeCompare(b.title||''));
  items.forEach(x=>{
    const li=document.createElement('li');
    li.innerHTML=`<strong>${x.title}</strong><div class="meta">${x.category||''} ／ 区分:${x.stage||'other'}</div><div>${x.body||''}</div>`;
    ul.appendChild(li);
  });
}
function filterLife(id){
  const actBtn = document.querySelector('.life-tab.active');
  const stage = actBtn ? actBtn.dataset.life : 'surgery';
  renderLifeList(id, stage);
}

/* ========== ブックマーク（ダミー） ========== */
function renderBookmarks(){
  const ul = document.getElementById('bookmarks'); if(!ul) return;
  ul.innerHTML = '<li class="meta">ブックマークは準備中です。</li>';
}

/* ========== ClinicalTrials.gov（前版同等） ========== */
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
  lymphoma:['head and neck lymphoma','extranodal lymphoma'],
  sarcoma:['head and neck sarcoma','rhabdomyosarcoma','fibrosarcoma','osteosarcoma']
};
if (!window.TRIAL_QUERY) {
  window.TRIAL_QUERY = {
    oral:'oral+OR+"tongue+cancer"+OR+"floor+of+mouth"',
    oropharynx:'oropharyngeal+OR+"base+of+tongue"+OR+tonsil',
    hypopharynx:'hypopharyngeal+OR+postcricoid+OR+"pyriform+sinus"',
    nasopharynx:'nasopharyngeal+OR+NPC',
    larynx:'laryngeal+OR+glottic+OR+supraglottic+OR+subglottic',
    nasal:'"nasal+cavity"+OR+"paranasal+sinus"+OR+"maxillary+sinus"',
    salivary:'"salivary+gland"+OR+parotid+OR+submandibular+OR+sublingual',
    _default:'"Head+and+Neck+Cancer"'
  };
}
if (!window.TRIAL_QUERY_HISTO) {
  window.TRIAL_QUERY_HISTO = {
    'adenoid-cystic':'"adenoid+cystic+carcinoma"',
    'mucoepidermoid':'"mucoepidermoid+carcinoma"',
    'mucosal-melanoma':'"mucosal+melanoma"+OR+"malignant+melanoma+of+mucosa"',
    'lymphoma':'"head+and+neck"+lymphoma',
    'sarcoma':'"head+and+neck"+sarcoma'
  };
}
const BROADEN_SITE_EXPR = {
  salivary:'"salivary+gland+carcinoma"+OR+"salivary+gland+cancer"+OR+parotid+OR+submandibular+OR+sublingual'
};
const BROADEN_HISTO_EXPR = {
  'adenoid-cystic':'"adenoid+cystic+carcinoma"+AND+("salivary+gland"+OR+parotid+OR+submandibular+OR+sublingual)',
  'mucoepidermoid':'"mucoepidermoid+carcinoma"+AND+("salivary+gland"+OR+parotid+OR+submandibular+OR+sublingual)',
  'mucosal-melanoma':'"mucosal+melanoma"+AND+("head+and+neck"+OR+oral+OR+nasal+OR+oropharynx)'
};
function buildTrialsExprList({ cancerId=null, histologyId=null } = {}){
  const CQ = window.TRIAL_QUERY || {};
  const HQ = window.TRIAL_QUERY_HISTO || {};
  const exprs = new Set();
  if (histologyId && HQ[histologyId]) exprs.add(HQ[histologyId]);
  if (cancerId && CQ[cancerId]) exprs.add(CQ[cancerId]);
  const syns = [];
  if (histologyId && EN_SYNONYMS[histologyId]) syns.push(...EN_SYNONYMS[histologyId]);
  if (cancerId && EN_SYNONYMS[cancerId]) syns.push(...EN_SYNONYMS[cancerId]);
  if (syns.length){
    const orExpr = syns.map(s=>`"${encodeURIComponent(String(s).replace(/\s+/g,'+'))}"`).join('+OR+');
    exprs.add(orExpr);
  }
  if (histologyId && BROADEN_HISTO_EXPR[histologyId]) exprs.add(BROADEN_HISTO_EXPR[histologyId]);
  if (cancerId && BROADEN_SITE_EXPR[cancerId]) exprs.add(BROADEN_SITE_EXPR[cancerId]);
  exprs.add(CQ._default || '"Head+and+Neck+Cancer"');
  return Array.from(exprs);
}
async function fetchTrials(params = {}){
  const exprList = buildTrialsExprList(params);
  const fields = ['NCTId','BriefTitle','Condition','OverallStatus','StudyType','Phase','InterventionType','InterventionName','LeadSponsorName','LocationCountry','LocationCity','LocationState','StartDate','PrimaryCompletionDate','LastUpdatePostDate'].join(',');
  const maxPerQuery = 12;
  const all = [];
  for (const expr of exprList){
    const url = `https://clinicaltrials.gov/api/query/study_fields?expr=${expr}&fields=${fields}&min_rnk=1&max_rnk=${maxPerQuery}&fmt=json`;
    const res = await fetch(url, { cache:'no-store' });
    if (!res.ok) continue;
    const json = await res.json();
    const rows = json?.StudyFieldsResponse?.StudyFields || [];
    rows.forEach(r=>{
      all.push({
        id:r.NCTId?.[0], title:r.BriefTitle?.[0], cond:(r.Condition||[]).join(', '),
        status:r.OverallStatus?.[0], studyType:r.StudyType?.[0], phase:r.Phase?.[0],
        interventions:(r.InterventionName||[]).filter(Boolean),
        interventionTypes:(r.InterventionType||[]).filter(Boolean),
        sponsor:r.LeadSponsorName?.[0]||'',
        countries:(r.LocationCountry||[]).filter(Boolean),
        city:r.LocationCity?.[0]||'', state:r.LocationState?.[0]||'',
        start:r.StartDate?.[0]||'', primaryComplete:r.PrimaryCompletionDate?.[0]||'',
        updated:r.LastUpdatePostDate?.[0]||''
      });
    });
  }
  const seen=new Set(); const uniq=[]; for(const t of all){ if(!t.id||seen.has(t.id)) continue; seen.add(t.id); uniq.push(t); }
  const score = (t)=>{ let s=0;
    if(/Recruiting|Enrolling|Not\s+yet\s+recruiting/i.test(t.status||'')) s+=50;
    if((t.interventionTypes||[]).some(x=>/Drug|Biological|Device|Combination Product/i.test(x))) s+=20;
    if((t.interventions||[]).length) s+=10;
    if((t.countries||[]).some(c=>/Japan/i.test(c))) s+=15;
    if(/Phase\s*(2|3|4)/i.test(t.phase||'')) s+=10;
    const d = Date.parse(t.updated||t.start||'')||0; s += Math.min(20, Math.floor((d-1700000000000)/(1000*60*60*24*30))); return s; };
  uniq.sort((a,b)=>score(b)-score(a));
  return uniq.slice(0,24);
}
window.TRIAL_FILTERS = { recruitingOnly:true, drugOnly:true, japanFirst:true, phaseMin:'2' };
function renderTrialsControls(box){
  if(!box) return;
  const c=document.createElement('div');
  c.id='trials-controls'; c.className='meta'; c.style.margin='8px 0 12px';
  c.innerHTML=`
    <label style="margin-right:12px;"><input type="checkbox" id="flt-recruit" checked/> 募集中のみ</label>
    <label style="margin-right:12px;"><input type="checkbox" id="flt-drug" checked/> 薬剤など介入あり</label>
    <label style="margin-right:12px;"><input type="checkbox" id="flt-jp" checked/> 日本を優先</label>
    <label>フェーズ最小:
      <select id="flt-phase">
        <option value="Any">指定なし</option>
        <option value="1">Phase 1+</option>
        <option value="2" selected>Phase 2+</option>
        <option value="3">Phase 3+</option>
        <option value="4">Phase 4</option>
      </select>
    </label>`;
  box.appendChild(c);
  const $ = (s)=>c.querySelector(s);
  $('#flt-recruit').addEventListener('change', e=>{ window.TRIAL_FILTERS.recruitingOnly=e.target.checked; rerenderTrialsList(); });
  $('#flt-drug').addEventListener('change', e=>{ window.TRIAL_FILTERS.drugOnly=e.target.checked; rerenderTrialsList(); });
  $('#flt-jp').addEventListener('change', e=>{ window.TRIAL_FILTERS.japanFirst=e.target.checked; rerenderTrialsList(); });
  $('#flt-phase').addEventListener('change', e=>{ window.TRIAL_FILTERS.phaseMin=e.target.value; rerenderTrialsList(); });
}
function passFilters(t){
  const F=window.TRIAL_FILTERS;
  if(F.recruitingOnly && !/Recruiting|Enrolling|Not\s+yet\s+recruiting/i.test(t.status||'')) return false;
  if(F.drugOnly && !((t.interventionTypes||[]).some(x=>/Drug|Biological|Device|Combination Product/i.test(x)))) return false;
  const phNum=(t.phase||'').match(/(\d)/)?.[1]||null;
  if(F.phaseMin!=='Any' && phNum && Number(phNum) < Number(F.phaseMin)) return false;
  return true;
}
function rerenderTrialsList(){
  const box=document.getElementById('trials'); if(!box) return;
  const host=box.querySelector('#trials-list-host'); if(!host) return;
  renderTrialsList(host, __TRIALS_CACHE);
}
function renderTrialsList(host, trials){
  const F=window.TRIAL_FILTERS;
  const filtered = trials.filter(passFilters);
  const ordered = F.japanFirst
    ? filtered.slice().sort((a,b)=>{
        const aj=(a.countries||[]).some(c=>/Japan/i.test(c))?1:0;
        const bj=(b.countries||[]).some(c=>/Japan/i.test(c))?1:0;
        if(bj!==aj) return bj-aj;
        const da=Date.parse(a.updated||a.start||'')||0;
        const db=Date.parse(b.updated||b.start||'')||0;
        return db-da;
      })
    : filtered;
  if(!ordered.length){ host.innerHTML = `<div class="meta">現在の条件では表示できる治験がありません。</div>`; return; }
  host.innerHTML = `
    <ul class="list small">
      ${ordered.map(t=>{
        const drugBadge=(t.interventionTypes||[]).some(x=>/Drug|Biological/i.test(x))?`<span class="badge">Drug</span>`:'';
        const jpBadge=(t.countries||[]).some(c=>/Japan/i.test(c))?`<span class="badge">JP</span>`:'';
        const ph=t.phase?`／ <span class="badge">${escapeHtml(t.phase)}</span>`:'';
        return `
          <li>
            <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/study/${t.id}"><strong>${escapeHtml(t.title||t.id)}</strong></a>
            <div class="meta">ID: ${t.id} ／ 状況: ${escapeHtml(t.status||'')} ${ph} ／ 更新: ${escapeHtml(t.updated||'')} ${drugBadge} ${jpBadge}</div>
            ${t.sponsor?`<div class="meta">主担当機関: ${escapeHtml(t.sponsor)}</div>`:''}
            ${t.interventions && t.interventions.length? `<div class="meta">介入: <strong>${t.interventions.map(escapeHtml).join(' / ')}</strong></div>`:''}
            ${t.cond?`<div class="meta">対象: ${escapeHtml(t.cond)}</div>`:''}
          </li>`;
      }).join('')}
    </ul>`;
}
function renderTrialsFallback(box, { cancerId=null, histologyId=null } = {}){
  const SITE_EN_LABELS = SITE_EN;
  const histo = (DATA.histologies||[]).find(h=>h.id===histologyId);
  const cancer = (DATA.cancers||[]).find(c=>c.id===cancerId);
  const narrowJP = histo?.aliases?.[0] || histo?.name || cancer?.name || '頭頸部がん';
  let narrowEN = 'head and neck cancer';
  if (histo) narrowEN = (histo.aliases||[]).find(a=>/[a-z]/i.test(a)) || (histo.name.match(/\((.+?)\)/)?.[1]) || narrowEN;
  else if (cancer) narrowEN = SITE_EN_LABELS[cancer.id] || narrowEN;
  let broadJP = '頭頸部がん'; let broadEN='head and neck cancer';
  if (histologyId==='adenoid-cystic' || histologyId==='mucoepidermoid' || cancerId==='salivary'){ broadJP='唾液腺がん'; broadEN='salivary gland cancer'; }
  const qJPa=encodeURIComponent(`${narrowJP} 治験`);
  const qENa=encodeURIComponent(`${narrowEN} clinical trial`);
  const qJPb=encodeURIComponent(`${broadJP} 治験`);
  const qENb=encodeURIComponent(`${broadEN} clinical trial`);
  box.innerHTML = `
    <div class="card">
      <h3>自動検索リンク（補助）</h3>
      <p class="meta">API取得に失敗/0件のため、狭い・広い両方の候補を提示します。</p>
      <ul class="list small">
        <li><strong>狭い：</strong> <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qJPa}">Google（日本語）</a> ／ <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qENa}">Google（英語）</a> ／ <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${qENa}">CT.gov 内検索</a></li>
        <li><strong>広い：</strong> <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qJPb}">Google（日本語）</a> ／ <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qENb}">Google（英語）</a> ／ <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${qENb}">CT.gov 内検索</a></li>
      </ul>
    </div>`;
}
async function loadTrials(cancerId, { histologyId=null } = {}){
  const box=document.getElementById('trials'); if(!box) return;
  box.innerHTML=''; renderTrialsControls(box);
  const host=document.createElement('div'); host.id='trials-list-host'; box.appendChild(host);
  host.innerHTML='<div class="meta">読み込み中…</div>';
  try{
    const trials = await fetchTrials({ cancerId, histologyId });
    __TRIALS_CACHE = trials.slice();
    if(!trials.length){ renderTrialsFallback(box, { cancerId, histologyId }); return; }
    renderTrialsList(host, trials);
  }catch(e){ console.error('trials error', e); renderTrialsFallback(box, { cancerId, histologyId }); }
}
function prepareTrialsBox(){
  const box=document.getElementById('trials'); if(!box) return;
  if(!box.querySelector('#trials-controls')) renderTrialsControls(box);
  if(!box.querySelector('#trials-list-host')){ const host=document.createElement('div'); host.id='trials-list-host'; box.appendChild(host); }
}

/* ========== 小物 ========== */
function switchToTab(tab){ const want='#'+tab; if(location.hash!==want) location.hash=want; else applyTab(tab); }
function nrm(){ return (s)=>(s||'').toString().toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'').replace(/癌腫/g,'がんしゅ').replace(/癌/g,'がん').replace(/ガン/g,'がん'); }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
