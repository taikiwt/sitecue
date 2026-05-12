// Note: 本番環境や完全移行時は supabase gen types の出力結果をここに配置・エクスポートする。
// 今回は共通基盤の確立としてベースの型を準備。
export interface SitecueNoteBase {
  id: string;
  created_at: string;
  user_id: string;
  url_pattern: string;
  content: string | null;
  note_type: string; // DB上はstring扱いになる箇所
  scope: string;     // DB上はstring扱いになる箇所
  sort_order: number;
}
