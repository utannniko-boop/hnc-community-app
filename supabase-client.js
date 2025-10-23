// supabase-client.js
// 1) ここをあなたのプロジェクト情報に置き換えてください（未設定でも動きます）
const SUPABASE_URL = '';      // 例: https://xxxxxxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = ''; // 例: eyJhbGciOi...

// 2) Supabase JS が読み込まれているか確認（index.htmlでCDNを読み込んでいます）
try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase && window.supabase.createClient) {
    // v2: CDNの createClient は window.supabase.createClient にぶら下がります
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[supabase] client initialized');
  } else {
    // 未設定なら機能を無効化（アプリは継続）
    console.warn('[supabase] 未設定のため投稿機能は無効です。URLとAnonキーを設定してください。');
    window.supabase = null;
  }
} catch (e) {
  console.warn('[supabase] 初期化に失敗（CDN未読込またはキー未設定）', e);
  window.supabase = null;
}
