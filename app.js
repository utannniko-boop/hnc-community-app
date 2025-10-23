console.log('init');

// ===== ClinicalTrials.gov integration =====
const CANCER_QUERY = {
  oral: 'oral cancer OR tongue cancer OR mouth floor cancer',
  oropharynx: 'oropharyngeal cancer OR HPV positive oropharynx',
  hypopharynx: 'hypopharyngeal cancer',
  nasopharynx: 'nasopharyngeal carcinoma',
  larynx: 'laryngeal cancer',
  sinonasal: 'sinonasal cancer OR maxillary sinus cancer',
  salivary: 'salivary gland cancer OR parotid cancer'
};

async function loadTrials(cancerId){
  const expr = encodeURIComponent(CANCER_QUERY[cancerId] || 'head and neck cancer');
  const fields = ['NCTId','BriefTitle','OverallStatus','LastUpdateSubmitDate'];
  const url = `https://clinicaltrials.gov/api/query/study_fields?expr=${expr}&fields=${fields.join(',')}&min_rnk=1&max_rnk=20&fmt=json`;
  const box = document.getElementById('trials');
  if(!box) return;
  box.innerHTML = '<p>読み込み中…</p>';
  try{
    const res = await fetch(url);
    const json = await res.json();
    const rows = (json?.StudyFieldsResponse?.StudyFields || []);
    if(!rows.length){ box.innerHTML = '<p>該当する治験情報が見つかりませんでした。</p>'; return; }
    box.innerHTML = '<ul class="list">'+ rows.map(r => {
      const id = r.NCTId?.[0] || '';
      const title = (r.BriefTitle?.[0] || '(無題)');
      const status = (r.OverallStatus?.[0] || '');
      const last = (r.LastUpdateSubmitDate?.[0] || '');
      return `<li><strong>${escapeHtml(title)}</strong>
        <div class="meta">NCT: ${id}／${escapeHtml(status)}／更新: ${escapeHtml(last)}</div>
        <a href="https://clinicaltrials.gov/study/${id}" target="_blank" rel="noopener">詳細</a></li>`;
    }).join('') + '</ul>';
  }catch(e){
    box.innerHTML = '<p>取得に失敗しました。</p>';
  }
}

// ===== Supabase anonymous posts with moderation =====
let supa = null;
function supaReady(){ return (window.supabase && window.__SUPABASE_URL && window.__SUPABASE_ANON_KEY); }
async function initSupabase(){
  if(!supaReady()) return null;
  if(supa) return supa;
  supa = window.supabase.createClient(window.__SUPABASE_URL, window.__SUPABASE_ANON_KEY);
  return supa;
}

async function listPosts(cancerId){
  const out = document.getElementById('post-list');
  if(!out) return;
  out.innerHTML = '<li>読み込み中…</li>';
  if(!supaReady()){ out.innerHTML = '<li>（Supabase未設定です）</li>'; return; }
  const sb = await initSupabase();
  const { data, error } = await sb.from('posts')
    .select('id, nickname, body, created_at')
    .eq('cancer_id', cancerId)
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(50);
  if(error){ out.innerHTML = `<li>読み込みエラー: ${escapeHtml(error.message)}</li>`; return; }
  out.innerHTML = (data||[]).map(p => {
    const when = new Date(p.created_at).toLocaleString();
    return `<li><strong>${escapeHtml(p.nickname || '匿名')}</strong>
      <div class="meta">${escapeHtml(when)}</div>
      <p style="margin:.5rem 0 0">${escapeHtml(p.body)}</p>
      <button class="tab-btn" data-report="${p.id}">通報</button></li>`;
  }).join('') || '<li>まだ投稿がありません。</li>';
}

async function createPost(cancerId, nickname, body){
  if(!supaReady()) { alert('Supabase未設定です。supabase-client.js を編集してください。'); return; }
  if(!body || body.trim().length === 0){ alert('本文を入力してください。'); return; }
  if(body.length > 500){ alert('500字以内で入力してください。'); return; }
  const sb = await initSupabase();
  const { error } = await sb.from('posts').insert({ cancer_id: cancerId, nickname: nickname || null, body });
  if(error){ alert('投稿に失敗しました: '+ error.message); return; }
  await listPosts(cancerId);
  document.getElementById('post-text').value = '';
  document.getElementById('post-nick').value = '';
}

async function reportPost(id){
  if(!supaReady()) return;
  const sb = await initSupabase();
  const { error } = await sb.from('reports').insert({ post_id: id, reason: 'user_report' });
  if(error){ alert('通報に失敗しました: '+error.message); return; }
  alert('通報しました。モデレーション待ちです。');
}

// Wire UI (assuming a select exists)
function wirePostUI(cancerId){
  const form = document.getElementById('post-form');
  if(form){
    form.onsubmit = async (e) => {
      e.preventDefault();
      await createPost(cancerId, (document.getElementById('post-nick')||{}).value || '', (document.getElementById('post-text')||{}).value || '');
    };
  }
  const list = document.getElementById('post-list');
  if(list){
    list.onclick = async (e) => {
      const btn = e.target.closest('button[data-report]'); if(!btn) return;
      await reportPost(btn.dataset.report);
    };
  }
  listPosts(cancerId);
}

// If selectCancer exists, patch to call our functions; else add a minimal one
if (typeof selectCancer === 'function') {
  const _orig = selectCancer;
  selectCancer = function(id){
    _orig(id);
    try { loadTrials(id); wirePostUI(id); } catch(e){}
  }
} else {
  async function selectCancer(id){
    try { loadTrials(id); wirePostUI(id); } catch(e){}
  }
}



// ================= Moderator Admin =================
async function isAuthed(){
  if(!supaReady()) return false;
  const sb = await initSupabase();
  const { data: { user } } = await sb.auth.getUser();
  return !!user;
}

async function showAdminUI(){
  if(!supaReady()){ document.getElementById('reports').innerHTML = '<p>Supabase未設定です。</p>'; return; }
  const sb = await initSupabase();
  const { data: { user } } = await sb.auth.getUser();
  const $login = document.getElementById('admin-login');
  const $user = document.getElementById('admin-user');
  const $email = document.getElementById('admin-email-label');
  if(user){
    $login.style.display = 'none';
    $user.style.display = 'flex';
    $email.textContent = user.email || 'モデレーター';
    await loadReports();
  }else{
    $login.style.display = 'block';
    $user.style.display = 'none';
    document.getElementById('reports').innerHTML = '<p>ログインしてください。</p>';
  }
}

async function loadReports(){
  const out = document.getElementById('reports');
  out.innerHTML = '<p>読み込み中…</p>';
  const sb = await initSupabase();
  // First, attempt to select from 'mod_reports' view
  let { data, error } = await sb.from('mod_reports').select('*').order('report_created', { ascending:false }).limit(100);
  if(error){
    out.innerHTML = `<p>読み込みエラー: ${escapeHtml(error.message)}</p>`;
    return;
  }
  out.innerHTML = (data||[]).map(r => {
    const when = new Date(r.report_created).toLocaleString();
    const state = r.post_hidden ? '非表示' : '表示中';
    return `<li class="report-item" style="list-style:none;border:1px solid var(--line);border-radius:12px;padding:12px;margin:8px 0;background:#fafafa">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
        <div>
          <strong>投稿ID: ${r.post_id}</strong> ／ <span class="badge">${escapeHtml(state)}</span>
          <div class="meta">通報: ${escapeHtml(when)} ／ cancer_id: ${escapeHtml(r.cancer_id||'')}</div>
          <div class="meta">投稿者: ${escapeHtml(r.nickname||'匿名')}</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${r.post_hidden ?
            `<button class="tab-btn" data-unhide="${r.post_id}">再表示</button>` :
            `<button class="tab-btn" data-hide="${r.post_id}">非表示</button>`
          }
          <button class="tab-btn" data-delreport="${r.report_id}">通報を削除</button>
        </div>
      </div>
      <p style="margin:.5rem 0 0">${escapeHtml(r.body||'')}</p>
    </li>`;
  }).join('') || '<p>通報はありません。</p>';
}

async function hidePost(postId, hidden){
  const sb = await initSupabase();
  // posts update permitted only for moderators via policy
  const { error } = await sb.from('posts').update({ hidden }).eq('id', postId);
  if(error){ alert('更新に失敗しました: '+error.message); return; }
  await loadReports();
}

async function deleteReport(reportId){
  const sb = await initSupabase();
  const { error } = await sb.from('reports').delete().eq('id', reportId);
  if(error){ alert('削除に失敗しました: '+error.message); return; }
  await loadReports();
}

// Admin tab wiring
document.addEventListener('click', async (e) => {
  const hideBtn = e.target.closest('button[data-hide]');
  if(hideBtn){ await hidePost(hideBtn.dataset.hide, true); return; }
  const unhideBtn = e.target.closest('button[data-unhide]');
  if(unhideBtn){ await hidePost(unhideBtn.dataset.unhide, false); return; }
  const delBtn = e.target.closest('button[data-delreport]');
  if(delBtn){ await deleteReport(delBtn.dataset.delreport); return; }
});

const $adminLogin = document.getElementById('admin-login');
if($adminLogin){
  $adminLogin.onsubmit = async (e) => {
    e.preventDefault();
    if(!supaReady()){ alert('Supabase未設定です。'); return; }
    const sb = await initSupabase();
    const email = (document.getElementById('admin-email')||{}).value || '';
    const password = (document.getElementById('admin-password')||{}).value || '';
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if(error){ alert('ログイン失敗: '+error.message); return; }
    await showAdminUI();
  };
}
const $adminLogout = document.getElementById('admin-logout');
if($adminLogout){
  $adminLogout.onclick = async () => {
    if(!supaReady()) return;
    const sb = await initSupabase();
    await sb.auth.signOut();
    await showAdminUI();
  };
}

// When Admin tab is shown, refresh UI
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button.tab-btn[data-tab="admin"]');
  if(btn){ setTimeout(showAdminUI, 50); }
});

