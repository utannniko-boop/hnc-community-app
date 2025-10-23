/* app.js v38 — ホーム統合検索の実表示・コミュニティ連動 */

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
  activateTab((location.hash || '#home').replace('#',''));

  /* ====== データ（部位 / 組織型） ====== */
  const CANCERS = [
    { id:'oral',        name:'口腔がん（舌・口底など）', en:'oral cavity cancer', syn:['tongue cancer','floor of mouth','gingival','buccal mucosa','hard palate'], icd:'C00-C06' },
    { id:'oropharynx',  name:'中咽頭がん',               en:'oropharyngeal cancer', syn:['tonsil cancer','base of tongue','soft palate'], icd:'C10' },
    { id:'hypopharynx', name:'下咽頭がん',               en:'hypopharyngeal cancer', syn:['pyriform sinus','postcricoid'], icd:'C13' },
    { id:'nasopharynx', name:'上咽頭がん',               en:'nasopharyngeal carcinoma', syn:['NPC'], icd:'C11' },
    { id:'larynx',      name:'喉頭がん',                 en:'laryngeal cancer', syn:['glottic','supraglottic','subglottic'], icd:'C32' },
    { id:'nasal',       name:'鼻・副鼻腔がん',           en:'nasal cavity or paranasal sinus cancer', syn:['maxillary sinus','ethmoid sinus','frontal sinus','sphenoid sinus'], icd:'C30-C31' },
    { id:'salivary',    name:'唾液腺がん',               en:'salivary gland cancer', syn:['parotid gland cancer','submandibular gland cancer','sublingual gland cancer'], icd:'C07-C08' }
  ];
  const HISTOS = [
    { id:'adenoid-cystic',  name:'腺様嚢胞癌（ACC）',      en:'adenoid cystic carcinoma', syn:['ACC','adenoid-cystic carcinoma'], siteIds:['salivary','nasal','oral'] },
    { id:'mucoepidermoid',  name:'粘表皮癌（MEC）',        en:'mucoepidermoid carcinoma', syn:['MEC'], siteIds:['salivary','nasal','oral','oropharynx'] },
    { id:'mucosal-melanoma',name:'悪性黒色腫（粘膜）',     en:'mucosal melanoma', syn:['mucosal malignant melanoma'], siteIds:['nasal','oral','oropharynx'] },
    { id:'lymphoma',        name:'リンパ腫',               en:'lymphoma', syn:['extranodal lymphoma','head and neck lymphoma'], siteIds:['oropharynx','nasopharynx'] },
    { id:'sarcoma',         name:'肉腫',                   en:'sarcoma', syn:['rhabdomyosarcoma','fibrosarcoma','osteosarcoma'], siteIds:['oral','nasal','oropharynx'] }
  ];
  const cancerMap = Object.fromEntries(CANCERS.map(c=>[c.id,c]));
  const histoMap  = Object.fromEntries(HISTOS.map(h=>[h.id,h]));

  /* ====== コミュニティ セレクタ初期化 ====== */
  const selSite = document.getElementById('community-select');
  const selHisto = document.getElementById('histology-select');
  const content = document.getElementById('community-content');
  const evidenceUL = document.getElementById('evidence-links');
  const researchUL = document.getElementById('research-links');
  const trialsHost = document.getElementById('trials-list-host');
  const trialsControls = document.getElementById('trials-controls');

  if (selSite && selHisto){
    selSite.innerHTML = `<option value="">（部位を選択）</option>` + CANCERS.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    selHisto.innerHTML = `<option value="">（組織型を選択：任意）</option>` + HISTOS.map(h=>`<option value="${h.id}">${h.name}</option>`).join('');
  }

  let currentCancer = null;
  let currentHisto = null;

  selSite?.addEventListener('change', async () => {
    currentCancer = cancerMap[selSite.value] || null;
    // 部位を選んだら組織型候補を絞り込む
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

  selHisto?.addEventListener('change', async () => {
    currentHisto = histoMap[selHisto.value] || null;
    renderCommunityHeader();
    renderEvidenceLinks();
    renderResearchLinks();
    await loadTrials();
  });

  function renderCommunityHeader(){
    if(!content) return;
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

  /* ====== 根拠リンク / 研究リンク ====== */
  function qEnc(s){ return encodeURIComponent(s||''); }
  function currentENLabel(){
    if (currentHisto) return currentHisto.en;
    if (currentCancer) return currentCancer.en;
    return 'head and neck cancer';
  }
  function renderEvidenceLinks(){
    if(!evidenceUL) return;
    evidenceUL.innerHTML = '';
    const base = currentENLabel();
    const items = [
      ['国がん（がん情報サービス）', `https://ganjoho.jp/public/search/index.html?SearchText=${qEnc(base)}`],
      ['NCI PDQ：患者向け',          `https://www.cancer.gov/search/results?swKeyword=${qEnc(base)}&filter=patient`],
      ['NCI PDQ：医療者向け',        `https://www.cancer.gov/search/results?swKeyword=${qEnc(base)}&filter=health-professional`],
      ['NICE（UK）',                  `https://www.nice.org.uk/search?q=${qEnc(base)}`],
      ['ESMO ガイドライン',          `https://www.esmo.org/guidelines?q=${qEnc(base)}`],
      ['CRUK（UK）',                  `https://www.cancerresearchuk.org/about-cancer/search?q=${qEnc(base)}`],
      ['ASCO',                        `https://www.asco.org/search?query=${qEnc(base)}`],
    ];
    evidenceUL.innerHTML = items.map(([t,u])=>`<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`).join('');
  }
  function buildExprTerms(){
    const parts = [];
    if (currentCancer) { parts.push(currentCancer.en, ...(currentCancer.syn||[])); }
    if (currentHisto)  { parts.push(currentHisto.en,  ...(currentHisto.syn||[])); }
    if (!parts.length) parts.push('head and neck cancer');
    const encoded = parts
      .filter(Boolean)
      .map(s => `"${encodeURIComponent(String(s).replace(/\s+/g,'+'))}"`)
      .join('+OR+');
    return { pmBase: encoded, ctBase: encoded };
  }
  function renderResearchLinks(){
    if(!researchUL) return;
    researchUL.innerHTML = '';
    const terms = buildExprTerms();
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

  /* ====== ClinicalTrials.gov ====== */
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
    if (!trialsHost) return;
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
      trialsHost.innerHTML = `<div class="meta">現在の条件では表示できる治験がありません。</div>`;
      return;
    }
    trialsHost.innerHTML = `
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
  async function loadTrials(){
    ensureTrialControls();
    if (!trialsHost) return;
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
      const seen=new Set();
      trialsCache = rows.map(r=>({
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
      })).filter(t=>t.id && !seen.has(t.id) && seen.add(t.id));
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
  showLife('surgery');

  /* ====== ホーム：統合検索（実表示） ====== */
  const gInput = document.getElementById('global-search');
  const gRes = document.getElementById('global-results');
  const norm = s => (s||'').toString().toLowerCase().normalize('NFKC');

  gInput?.addEventListener('input',(e)=>{
    const q = norm(e.target.value.trim());
    gRes.innerHTML = '';
    if(!q) return;

    // 部位ヒット
    const siteHits = CANCERS.filter(c => [c.name,c.en,...(c.syn||[]),c.icd||''].join(' ').toLowerCase().includes(q));
    // 組織型ヒット
    const histoHits = HISTOS.filter(h => [h.name,h.en,...(h.syn||[])].join(' ').toLowerCase().includes(q));

    const rows = [];
    siteHits.forEach(c => {
      rows.push(`
        <li>
          <strong>部位：</strong>${esc(c.name)} <span class="badge">${c.icd}</span>
          <div class="meta">${esc(c.en)} / 同義語: ${esc((c.syn||[]).join(', '))}</div>
          <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
            <a href="#community" data-goto-site="${c.id}">コミュニティへ</a>
            <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${encodeURIComponent(`"${c.en.replace(/\s+/g,'+')}"`)}">CT.gov</a>
            <a target="_blank" rel="noopener" href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(`"${c.en.replace(/\s+/g,'+')}"`)}&filter=datesearch.y_3&filter=pubt.clinicaltrial">PubMed</a>
          </div>
        </li>`);
    });
    histoHits.forEach(h => {
      // サイト別ボタン
      const siteBtns = (h.siteIds||[]).map(id=>{
        const s = cancerMap[id];
        return s ? `<a href="#community" data-goto-site="${s.id}" data-goto-histo="${h.id}">${esc(s.name)}で表示</a>` : '';
      }).join(' ');
      rows.push(`
        <li>
          <strong>組織型：</strong>${esc(h.name)}
          <div class="meta">${esc(h.en)} / 同義語: ${esc((h.syn||[]).join(', '))}</div>
          <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
            ${siteBtns || `<a href="#community" data-goto-histo="${h.id}">コミュニティへ</a>`}
            <a target="_blank" rel="noopener" href="https://clinicaltrials.gov/search?cond=${encodeURIComponent(`"${h.en.replace(/\s+/g,'+')}"`)}">CT.gov</a>
            <a target="_blank" rel="noopener" href="https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(`"${h.en.replace(/\s+/g,'+')}"`)}&filter=datesearch.y_3&filter=pubt.clinicaltrial">PubMed</a>
          </div>
        </li>`);
    });

    gRes.innerHTML = rows.length ? rows.join('') : `<li class="meta">候補が見つかりません。</li>`;
  });

  // 検索結果からコミュニティへ連動
  document.addEventListener('click',(e)=>{
    const a = e.target.closest('a[data-goto-site], a[data-goto-histo]');
    if (!a) return;
    e.preventDefault();
    activateTab('community');
    const site = a.getAttribute('data-goto-site');
    const hist = a.getAttribute('data-goto-histo');
    if (site && selSite){ selSite.value = site; selSite.dispatchEvent(new Event('change')); }
    if (hist && selHisto){ selHisto.value = hist; selHisto.dispatchEvent(new Event('change')); }
  });

  /* ====== util ====== */
  function esc(s){ return String(s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m])); }
});
