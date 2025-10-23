/* app.js v35 — 安定・生活の工夫表示＋タブ切替 */
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('[data-tab]');
  const tabSections = document.querySelectorAll('.tab');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabSections.forEach(sec => sec.classList.remove('active'));
      document.getElementById(tab).classList.add('active');
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 生活の工夫
  const lifeData = {
    surgery: [
      "術後の嚥下・発声リハビリは専門医療機関で早期に開始することが重要です。",
      "首周囲のリンパ郭清後は、肩の可動域訓練を継続しましょう。",
      "創部の保湿と清潔保持で瘢痕拘縮を予防します。"
    ],
    chemo: [
      "抗がん剤による吐き気には制吐剤の適切な使用を。",
      "口内炎対策にはうがい・保湿・刺激物の回避を徹底。",
      "脱毛時は帽子・ウィッグ・スカーフを早めに準備。"
    ],
    radiation: [
      "口腔・咽頭の乾燥には人工唾液・保湿スプレーが有効。",
      "皮膚の赤みは擦らず保湿中心に。冷却は避けましょう。",
      "味覚変化は徐々に改善します。薄味から再挑戦を。"
    ],
    other: [
      "睡眠・栄養・適度な運動が免疫維持に寄与します。",
      "家族や患者会との交流が心の支えになります。",
      "復職時は主治医と勤務条件の調整を。"
    ]
  };

  const lifeButtons = document.querySelectorAll('.life-btn');
  const lifeContent = document.getElementById('life-content');
  function showLife(category){
    lifeButtons.forEach(b=>b.classList.toggle('active',b.dataset.life===category));
    const tips = lifeData[category]||[];
    lifeContent.innerHTML = tips.map(t=>`<li>${t}</li>`).join('')||"<p>該当する情報がありません。</p>";
  }
  lifeButtons.forEach(btn=>{
    btn.addEventListener('click',()=>showLife(btn.dataset.life));
  });
  showLife('surgery');

  // 治療情報
  const treatmentLinks = [
    ["国立がん研究センター がん情報サービス","https://ganjoho.jp"],
    ["NCI PDQ（英語）","https://www.cancer.gov/publications/pdq"],
    ["NICE（英国）","https://www.nice.org.uk/guidance/conditions-and-diseases/cancer"],
    ["ESMO（欧州）","https://www.esmo.org/guidelines"],
    ["ASCO（米国）","https://www.asco.org/"]
  ];
  const list = document.getElementById('treatment-links');
  list.innerHTML = treatmentLinks.map(([t,u])=>`<li><a href="${u}" target="_blank">${t}</a></li>`).join('');

  // コミュニティ選択
  const cancers = ["喉頭がん","中咽頭がん","上咽頭がん","下咽頭がん","口腔がん","舌がん","唾液腺がん"];
  const sel = document.getElementById('community-select');
  sel.innerHTML = `<option value="">選択してください</option>` + cancers.map(c=>`<option>${c}</option>`).join('');
  const cc = document.getElementById('community-content');
  sel.addEventListener('change',()=>{
    const c = sel.value;
    if(!c){ cc.innerHTML=""; return; }
    cc.innerHTML = `<p><strong>${c}</strong>に関するトピックを準備中です。</p>`;
  });

  // 検索デモ
  document.getElementById('global-search').addEventListener('input',(e)=>{
    const q=e.target.value.trim();
    const res=document.getElementById('global-results');
    if(!q){res.innerHTML="";return;}
    res.innerHTML=`<li>「${q}」に関連する情報を表示します（デモ）。</li>`;
  });
});
