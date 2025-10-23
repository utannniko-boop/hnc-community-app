function initHome(){
  const list = document.getElementById('cancer-list');
  const input = document.getElementById('cancer-search');

  // 全角・半角／小文字化／スペース除去の正規化
  const norm = (s) => (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFKC')       // 例：がん/ｶﾞﾝ/ガン の表記ゆれ吸収
    .replace(/\s+/g, '');    // 余分な空白を除去

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
