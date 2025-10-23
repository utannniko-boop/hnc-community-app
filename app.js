/* app.js v37 — 組織型(ACC/MEC等)対応 + 日本語→英語クエリ拡張 + 安定タブ */

document.addEventListener('DOMContentLoaded', () => {
  /* ====== タブ切替 ====== */
  const tabs = document.querySelectorAll('[data-tab]');
  const sections = document.querySelectorAll('.tab');
  function activateTab(tabId){
    sections.forEach(s => s.classList.toggle('active', s.id === tabId));
    tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    history.replaceState(null,'', '#'+tabId);
  }
  tabs.forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab)));
  if (!location.hash) activateTab('home'); else activateTab(location.hash.replace('#',''));

  /* ====== 日本語→英語クエリ辞書（部位・組織型 共通） ====== */
  const JP2EN = {
    // 部位
    '口腔がん':'oral cavity cancer','口腔癌':'oral cavity cancer','舌がん':'tongue cancer','舌癌':'tongue cancer',
    '口底がん':'floor of mouth cancer','歯肉がん':'gingival cancer','頬粘膜がん':'buccal mucosa cancer','硬口蓋がん':'hard palate cancer',
    '中咽頭がん':'oropharyngeal cancer','扁桃':'tonsil cancer','舌根がん':'base of tongue cancer','軟口蓋がん':'soft palate cancer',
    '下咽頭がん':'hypopharyngeal cancer','梨状陥凹':'pyriform sinus','輪状後部':'postcricoid',
    '上咽頭がん':'nasopharyngeal carcinoma','上咽頭癌':'nasopharyngeal carcinoma','NPC':'nasopharyngeal carcinoma',
    '喉頭がん':'laryngeal cancer','喉頭癌':'laryngeal cancer','声門がん':'glottic cancer','声門上がん':'supraglottic cancer','声門下がん':'subglottic cancer',
    '鼻腔がん':'nasal cavity cancer','副鼻腔がん':'paranasal sinus cancer','上顎洞がん':'maxillary sinus cancer','篩骨洞がん':'ethmoid sinus cancer','前頭洞がん':'frontal sinus cancer','蝶形骨洞がん':'sphenoid sinus cancer',
    '唾液腺がん':'salivary gland cancer','耳下腺がん':'parotid gland cancer','顎下腺がん':'submandibular gland cancer','舌下腺がん':'sublingual gland cancer',
    // 組織型
    '腺様嚢胞癌':'adenoid cystic carcinoma','腺様のう胞がん':'adenoid cystic carcinoma','ACC':'adenoid cystic carcinoma',
    '粘表皮癌':'mucoepidermoid carcinoma','MEC':'mucoepidermoid carcinoma',
    '粘膜悪性黒色腫':'mucosal melanoma','悪性黒色腫（粘膜）':'mucosal melanoma','粘膜メラノーマ':'mucosal melanoma',
    'リンパ腫':'lymphoma','悪性リンパ腫':'lymphoma',
    '肉腫':'sarcoma','横紋筋肉腫':'rhabdomyosarcoma','線維肉腫':'fibrosarcoma','骨肉腫':'osteosarcoma'
  };
  const norm = s => (s||'').toString().toLowerCase().normalize('NFKC').replace(/[ \u3000]/g,'');

  /* ====== カタログ：部位（CANCERS） ====== */
  const CANCERS = [
    { id:'oral',        name:'口腔がん（舌・口底など）', en:'oral cavity cancer', syn:['tongue cancer','floor of mouth','gingival','buccal mucosa','hard palate'], icd:'C00-C06' },
    { id:'oropharynx',  name:'中咽頭がん',               en:'oropharyngeal cancer', syn:['tonsil cancer','base of tongue','soft palate'], icd:'C10' },
    { id:'hypopharynx', name:'下咽頭がん',               en:'hypopharyngeal cancer', syn:['pyriform sinus','postcricoid'], icd:'C13' },
    { id:'nasopharynx', name:'上咽頭がん',               en:'nasopharyngeal carcinoma', syn:['NPC'], icd:'C11' },
    { id:'larynx',      name:'喉頭がん',                 en:'laryngeal cancer', syn:['glottic','supraglottic','subglottic'], icd:'C32' },
    { id:'nasal',       name:'鼻・副鼻腔がん',           en:'nasal cavity or paranasal sinus cancer', syn:['maxillary sinus','ethmoid sinus','frontal sinus','sphenoid sinus'], icd:'C30-C31' },
    { id:'salivary',    name:'唾液腺がん',               en:'salivary gland cancer', syn:['parotid gland cancer','submandibular gland cancer','sublingual gland cancer'], icd:'C07-C08' }
  ];
  const cancerMap = Object.fromEntries(CANCERS.map(c=>[c.id,c]));

  /* ====== カタログ：組織型（HISTOS） ====== */
  const HISTOS = [
    { id:'adenoid-cystic',  name:'腺様嚢胞癌（ACC）',              en:'adenoid cystic carcinoma', syn:['ACC','adenoid-cystic carcinoma'], siteIds:['salivary','nasal','oral'] },
    { id:'mucoepidermoid',  name:'粘表皮癌（MEC）',                en:'mucoepidermoid carcinoma', syn:['MEC'], siteIds:['salivary','nasal','oral','oropharynx'] },
    { id:'mucosal-melanoma',name:'悪性黒色腫（粘膜）',             en:'mucosal melanoma', syn:['mucosal malignant melanoma'], siteIds:['nasal','oral','oropharynx'] },
    { id:'lymphoma',        name:'リンパ腫',                        en:'lymphoma', syn:['extranodal lymphoma','head and neck lymphoma'], siteIds:['oropharynx','nasopharynx'] },
    { id:'sarcoma',         name:'肉腫',                            en:'sarcoma', syn:['rhabdomyosarcoma','fibrosarcoma','osteosarcoma'], siteIds:['oral','nasal','oropharynx'] }
  ];
  const histoMap = Object.fromEntries(HISTOS.map(h=>[h.id,h]));

  /* ====== コミュニティ：セレクタ ====== */
  const selSite = document.getElementById('community-select');
  const selHisto = document.getElementById('histology-select');
  const content = document.getElementById('community-content');
  const evidenceUL = document.getElementById('evidence-links');
  const researchUL = document.getElementById('research-links');
  const trialsHost = document.getElementById('trials-list-host');
  const trialsControls = document.getElementById('trials-controls');

  selSite.innerHTML = `<option value="">（部位を選択）</option>` + CANCERS.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  selHisto.innerHTML = `<option value="">（組織型を選択：任意）</option>` + HISTOS.map(h=>`<option value="${h.id}">${h.name}</option>`).join('');

  let currentCancer = null;
  let currentHisto = null;

  selSite.addEventListener('change', async () => {
    currentCancer = cancerMap[selSite.value] || null;
    // 部位を選んだら、組織型セレクタをその部位に関連する候補に絞り込む
    const options = ['<option value="">（組織型を選択：任意）</option>']
      .concat(HISTOS.filter(h => !currentCancer ? true : (h.siteIds||[]).includes(currentCancer.id))
      .map(h=>`<option value="${h.id}">${h.name}</option>`));
    selHisto.innerHTML = options.join('');
    currentHisto = null;
    selHisto.value = '';

    renderCommunityHeader();
    renderEvidenceLinks();
    renderResearchLinks();
    await loadTrials();
  });

  selHisto.addEventListener('change', async () => {
    currentHisto = histoMap[selHisto.value] || null;
    renderCommunityHeader();
    renderEvidenceLinks();
    renderResearchLinks();
    await loadTrials();
  });

  function renderCommunityHeader(){
    if(!currentCancer && !currentHisto){
      content.innerHTML = '<p class="meta">部位を選択（＋必要に応じて組織型）してください。</p>'; return;
    }
    const title = [
      currentCancer ? currentCancer.name : null,
      currentHisto ? ` × ${currentHisto.name}` : null
    ].filter(Boolean).join('');
    const en = [
      currentCancer ? currentCancer.en : null,
      currentHisto ? currentHisto.en : null
    ].filter(Boolean).join(' + ');
    const syn = [
      ...(currentCancer?.syn||[]),
      ...(currentHisto?.syn||[])
    ];
    const icd = currentCancer?.icd ? `<span class="badge">${currentCancer.icd}</span>` : '';
    content.innerHTML = `
      <div class="card">
        <h3>${title || '選択中なし'} ${icd}</h3>
        ${en ? `<div class="meta">英語表記：${en}</div>` : ''}
        ${syn.length ? `<div class="meta">同義語：${syn.join(', ')}</div>` : ''}
      </div>
    `;
  }

  /* ====== 根拠とガイドライン（部位＋組織型で自動リンク） ====== */
  function qEnc(str){ return encodeURIComponent(str||''); }
  function currentENLabel(){
    // 優先：組織型 > 部位
    if (currentHisto) return currentHisto.en;
    if (currentCancer) return currentCancer.en;
    return 'head and neck cancer';
    }
  function renderEvidenceLinks(){
    evidenceUL.innerHTML = '';
    const base = currentENLabel();
    const items = [
      ['国がん（がん情報サービス）', `https://ganjoho.jp/public/search/index.html?SearchText=${qEnc(base)}`],
      ['NCI PDQ：患者向け',          `https://www.cancer.gov/search/results?swKeyword=${qEnc(base)}&filter=patient`],
      ['NCI PDQ：医療者向け',        `https://www.cancer.gov/search/results?swKeyword=${qEnc(base)}&filter=health-professional`],
      ['NICE（UK）',                  `https://www.nice.org.uk/search?q=${qEnc(base)}`],
      ['ESMO ガイドライン',          `https://www.esmo.org/guidelines?q=${qEnc(base)}`],
      ['CRUK（Cancer Research UK）',  `https://www.cancerresearchuk.org/about-cancer/search?q=${qEnc(base)}`],
      ['ASCO',                        `https://www.asco.org/search?query=${qEnc(base)}`],
    ];
    evidenceUL.innerHTML = items.map(([t,u])=>`<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('');
  }

  /* ====== 最新研究リンク（PubMed / CT.gov：部位＋組織型で強化） ====== */
  function renderResearchLinks(){
    researchUL.innerHTML = '';
    const terms = buildExprTerms(); // URLエンコード済みの OR 連結
    // PubMed は「直近3年」＋ RCT / Clinical Trial の絞り込み
    const pmBase = `(${terms.pmBase})`;
    const pmRCT   = `https://pubmed.ncbi.nlm.nih.gov/?term=${pmBase}&filter=datesearch.y_3&filter=pubt.randomizedcontrolledtrial`;
    const pmTrial = `https://pubmed.ncbi.nlm.nih.gov/?term=${pmBase}&filter=datesearch.y_3&filter=pubt.clinicaltrial`;
    const ctSearch = `https://clinicaltrials.gov/search?cond=${terms.ctBase}`;
    researchUL.innerHTML = [
      `<li><strong>PubMed（直近3年・RCT）</strong>：<a href="${pmRCT}" target="_blank" rel="noopener">開く</a></li>`,
      `<li><strong>PubMed（直近3年・臨床試験）</strong>：<a href="${pmTrial}" target="_blank" rel="noopener">開く</a></li>`,
      `<li><strong>ClinicalTrials.gov（検索一覧）</strong>：<a href="${ctSearch}" target="_blank" rel="noopener">開く</a></li>`
    ].join('');
  }

  /* ====== ClinicalTrials.gov — 取得・表示 ====== */
  const TRIAL_FILTERS = { recruitingOnly:true, drugOnly:true, japanFirst:true, phaseMin:'2' };
  function ensureTrialControls(){
    if (!trialsControls) return;
    trialsControls.innerHTML = `
      <label><input type="checkbox" id="flt-recruit" ${TRIAL_FILTERS.recruitingOnly?'checked':''}/> 募集中のみ</label>
      <label style="margin-left:12px;"><input type="checkbox" id="flt-drug" ${TRIAL_FILTERS.drugOnly?'checked':''}/> 薬剤など介入あり</label>
      <label style="margin-left:12px;"><input type="checkbox" id="flt-jp" ${TRIAL_FILTERS.japanFirst?'checked':''}/> 日本を優先</label>
      <label style="margin-left:12px;">Phase最小:
        <select id="flt-phase">
          <option value="Any">指定なし</option>
          <option value="1">Phase 1+</option>
          <option value="2" selected>Phase 2+</option>
          <option value="3">Phase 3+</option>
          <option value="4">Phase 4</option>
        </select>
      </label>
    `;
    trialsControls.querySelector('#flt-recruit').addEventListener('change',e=>{TRIAL_FILTERS.recruitingOnly=e.target.checked; rerenderTrials();});
    trialsControls.querySelector('#flt-drug').addEventListener('change',e=>{TRIAL_FILTERS.drugOnly=e.target.checked; rerenderTrials();});
    trialsControls.querySelector('#flt-jp').addEventListener('change',e=>{TRIAL_FILTERS.japanFirst=e.target.checked; rerenderTrials();});
    trialsControls.querySelector('#flt-phase').addEventListener('change',e=>{TRIAL_FILTERS.phaseMin=e.target.value; rerenderTrials();});
  }
  let trialsCache = [];
  function passFilters(t){
    if (TRIAL_FILTERS.recruitingOnly && !/Recruiting|Enrolling|Not\s+yet\s+recruiting/i.test(t.status||'')) return false;
    if (TRIAL_FILTERS.drugOnly && !((t.interventionTypes||[]).some(x => /Drug|Biological|Device|Combination Product/i.test(x)))) return false;
    const phNum = (t.phase||'').match(/(\d)/)?.[1] || null;
    if (TRIAL_FILTERS.phaseMin !== 'Any' && phNum && Number(phNum) < Number(TRIAL_FILTERS.phaseMin)) return false;
    return true;
  }
  function rerenderTrials(){
    const host = trialsHost;
    if (!host) return;
    const filtered = trialsCache.filter(passFilters);
    const ordered = TRIAL_FILTERS.japanFirst
      ? filtered.slice().sort((a,b)=>{
          const aj=(a.countries||[]).some(c=>/Japan/i.test(c))?1:0;
          const bj=(b.countries||[]).some(c=>/Japan/i.test(c))?1:0;
          if (bj!==aj) return bj-aj;
          const da=Date.parse(a.updated||a.start||'')||0;
          const db=Date.parse(b.updated||b.start||'')||0;
          return db-da;
        })
      : filtered;
    if (!ordered.length){
      host.innerHTML = `<div class="meta">現在の条件では表示できる治験がありません。</div>`;
      return;
    }
    host.innerHTML = `
      <ul class="list small">
        ${ordered.map(t=>{
          const drug = (t.interventionTypes||[]).some(x=>/Drug|Biological/i.test(x))?'<span class="badge">Drug</span>':'';
          const jp   = (t.countries||[]).some(c=>/Japan/i.test(c))?'<span class="badge">JP</span>':'';
          const ph   = t.phase ? `／ <span class="badge">${esc(t.phase)}</span>` : '';
          return `
          <li>
            <a href="https://clinicaltrials.gov/study/${t.id}" target="_blank" rel="noopener"><strong>${esc(t.title||t.id)}</strong></a>
            <div class="meta">ID: ${t.id} ／ 状況: ${esc(t.status||'')} ${ph} ／ 更新: ${esc(t.updated||'')} ${drug} ${jp}</div>
            ${t.sponsor ? `<div class="meta">主担当機関: ${esc(t.sponsor)}</div>`:''}
            ${t.interventions?.length ? `<div class="meta">介入: <strong>${t.interventions.map(esc).join(' / ')}</strong></div>`:''}
            ${t.cond ? `<div class="meta">対象: ${esc(t.cond)}</div>`:''}
          </li>`;
        }).join('')}
      </ul>
    `;
  }

  function buildExprTerms(){
    // PubMed / CT.gov 共用：部位＋組織型の英語キーワードを OR で束ねる
    const parts = [];
    if (currentCancer) { parts.push(currentCancer.en, ...(currentCancer.syn||[])); }
    if (currentHisto)  { parts.push(currentHisto.en,  ...(currentHisto.syn||[])); }
    if (!parts.length) parts.push('head and neck cancer');
    // URLエンコード＋引用で囲んで OR
    const encoded = parts
      .filter(Boolean)
      .map(s => `"${encodeURIComponent(String(s).replace(/\s+/g,'+'))}"`)
      .join('+OR+');
    return {
      pmBase: encoded, // そのまま PubMed に渡す
      ctBase: encoded  // そのまま CT.gov 検索に渡す
    };
  }

  async function loadTrials(){
    ensureTrialControls();
    trialsHost.innerHTML = '<div class="meta">読み込み中…</div>';
    const terms = buildExprTerms().ctBase;
    const fields = [
      'NCTId','BriefTitle','Condition','OverallStatus','StudyType','Phase',
      'InterventionType','InterventionName','LeadSponsorName',
      'LocationCountry','LocationCity','LocationState','StartDate','PrimaryCompletionDate','LastUpdatePostDate'
    ].join(',');
    const url = `https://clinicaltrials.gov/api/query/study_fields?expr=${terms}&fields=${fields}&min_rnk=1&max_rnk=60&fmt=json`;
    try{
      const res = await fetch(url, { cache:'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const rows = json?.StudyFieldsResponse?.StudyFields || [];
      const all = rows.map(r=>({
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
      }));
      const seen=new Set();
      trialsCache = all.filter(t=>t.id && !seen.has(t.id) && seen.add(t.id));
      rerenderTrials();
    }catch(e){
      trialsCache = [];
      const base = currentENLabel();
      trialsHost.innerHTML = `
        <div class="meta">API取得に失敗しました。以下の検索リンクをご利用ください。</div>
        <ul class="list small">
          <li><a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${qEnc(base)}">ClinicalTrials.gov 内検索</a></li>
          <li><a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qEnc(base+' clinical trial')}">Google（英語）</a></li>
          <li><a target="_blank" rel="noopener" href="https://www.google.com/search?q=${qEnc((currentCancer?.name||'頭頸部がん')+' 治験')}">Google（日本語）</a></li>
        </ul>
      `;
    }
  }

  /* ====== 治療情報の固定リンク ====== */
  const treat = document.getElementById('treatment-links');
  const baseLinks = [
    ['国立がん研究センター がん情報サービス','https://ganjoho.jp'],
    ['NCI PDQ（患者向け）','https://www.cancer.gov/publications/pdq'],
    ['NCI PDQ（医療者向け）','https://www.cancer.gov/publications/pdq?Audience=HealthProfessional'],
    ['NICE（UK）','https://www.nice.org.uk/guidance/conditions-and-diseases/cancer'],
    ['ESMO（欧州腫瘍学会）','https://www.esmo.org/guidelines'],
    ['CRUK（Cancer Research UK）','https://www.cancerresearchuk.org/about-cancer'],
    ['ASCO（米国臨床腫瘍学会）','https://www.asco.org/']
  ];
  treat.innerHTML = baseLinks.map(([t,u])=>`<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('');

  /* ====== 生活の工夫 ====== */
  const lifeData = {
    surgery: [
      "術後の嚥下・発声リハビリは専門医療機関で早期開始。",
      "頸部郭清後は肩関節の可動域訓練を継続。",
      "創部は保湿・清潔を保ち瘢痕拘縮を予防。テーピングは医療者指示で。",
      "開口障害は毎日少量×複数回の穏やかな開口訓練を。"
    ],
    chemo: [
      "吐き気には制吐剤の計画的内服。水分・電解質を意識。",
      "口内炎対策：無アルコール洗口・保湿・辛味/酸味/熱の回避。",
      "しびれ（末梢神経障害）は冷え対策と作業量配分、悪化時は主治医へ。"
    ],
    radiation: [
      "口腔乾燥：人工唾液・無糖ガム・加湿。高濃度フッ化物でう蝕予防。",
      "皮膚炎：低刺激保湿、擦らない、日光/熱刺激回避。びらん時は指示薬。",
      "味覚変化：温度・香り・食感で補う（出汁・ハーブ・冷食・プラ製スプーン）。"
    ],
    other: [
      "がん関連疲労：短時間の有酸素＋レジスタンス運動、睡眠衛生の徹底。",
      "復職・就学：主治医の就労配慮指示書、段階的復帰と在宅併用の検討。",
      "家族のケア：役割分担、レスパイト、情報共有ノートを1冊に。"
    ]
  };
  const lifeButtons = document.querySelectorAll('.life-btn');
  const lifeContent = document.getElementById('life-content');
  function showLife(cat){
    lifeButtons.forEach(b=>b.classList.toggle('active', b.dataset.life===cat));
    const tips = lifeData[cat] || [];
    lifeContent.innerHTML = tips.length ? `<ul class="list">${tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="meta">準備中です。</p>';
  }
  lifeButtons.forEach(b=>b.addEventListener('click',()=>showLife(b.dataset.life)));
  showLife('surgery'); // 既定表示

  /* ====== ホーム：統合検索（日本語→英語変換＆直接ジャンプ） ====== */
  const gInput = document.getElementById('global-search');
  const gRes = document.getElementById('global-results');
  gInput.addEventListener('input',(e)=>{
    const qRaw = e.target.value.trim();
    if(!qRaw){ gRes.innerHTML=''; return; }
    const q = norm(qRaw);

    // 1) 部位ヒット
    const siteHits = CANCERS.filter(c => [c.name,c.en,...(c.syn||[])]
      .join(' ').toLowerCase().includes(q));
    // 2) 組織型ヒット
    const histoHits = HISTOS.filter(h => [h.name,h.en,...(h.syn||[])]
      .join(' ').toLowerCase().includes(q));
    // 3) 日本語→英語辞書ヒット（補助）
    const dictEN = Object.entries(JP2EN).find(([jp]) => norm(jp) === q)?.[1];

    const rows = [];
    siteHits.forEach(c => {
      rows.push(`<li><strong>部位：</strong>${esc(c.name)} ／ <a href="#community" data-goto-site="${c.id}">コミュニティへ</a></li>`);
    });
    histoHits.forEach(h => {
      rows.push(`<li><strong>組織型：</strong>${esc(h.name)} ／ <a href="#community" data-goto-histo="${h.id}">この組織型で治験/論文</a></li>`);
    });
    if (dictEN){
      const pm = `https://pubmed.ncbi.nlm.nih.gov/?term="${encodeURIComponent(dictEN.replace(/\s+/g,'+'))}"&filter=datesearch.y_3&filter=pubt.clinicaltrial`;
      const ct = `https://clinicaltrials.gov/search?cond="${encodeURIComponent(dictEN.replace(/\s+/g,'+'))}"`;
      rows.push(`<li class="meta">日本語→英語：<strong>${esc(dictEN)}</strong> ／ <a href="${pm}" target="_blank" rel="noopener">PubMed</a> ／ <a href="${ct}" target="_blank" rel="noopener">CT.gov</a></li>`);
    }
    gRes.innerHTML = rows.length ? rows.join('') : `<li class="meta">候補が見つかりません。</li>`;
  });

  // 検索結果からのジャンプ
  document.addEventListener('click',(e)=>{
    const a1=e.target.closest('a[data-goto-site]'); 
    const a2=e.target.closest('a[data-goto-histo]');
    if (!a1 && !a2) return;
    e.preventDefault();
    activateTab('community');
    if (a1){
      selSite.value=a1.dataset.gotoSite; selSite.dispatchEvent(new Event('change'));
    } else if (a2){
      selHisto.value=a2.dataset.gotoHisto; selHisto.dispatchEvent(new Event('change'));
    }
  });

  /* ====== util ====== */
  function esc(s){ return String(s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m])); }
});
