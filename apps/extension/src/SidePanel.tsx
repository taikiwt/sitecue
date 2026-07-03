import { getScopeUrls } from "@sitecue/shared";
import type { Session } from "@supabase/supabase-js";
import { Loader2, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import FilterBar from "./components/FilterBar";
import Header from "./components/Header";
import LoginScreen from "./components/LoginScreen";
import NoteInput from "./components/NoteInput";
import NoteList from "./components/NoteList";
import QuickLinks from "./components/QuickLinks";
import { useAuth } from "./hooks/useAuth";
import { useCurrentTab } from "./hooks/useCurrentTab";
import type { NoteScope, NoteType } from "./hooks/useNotes";
import { useNotes } from "./hooks/useNotes";
import { useUserStats } from "./hooks/useUserStats";

const MAX_FREE_NOTES = 500;

export default function SidePanel() {
  const {
    session,
    authLoading,
    authError,
    sessionLoading,
    handleLogout,
    handleSocialLogin,
  } = useAuth();

  if (sessionLoading) {
    return (
      <div className="w-full h-screen bg-base-surface flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <LoginScreen
        authError={authError}
        authLoading={authLoading}
        handleSocialLogin={handleSocialLogin}
      />
    );
  }

  return <NotesUI session={session} onLogout={handleLogout} />;
}

function NotesUI({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const { currentFullUrl, url, title } = useCurrentTab();
  const { userPlan, totalNoteCount, setTotalNoteCount, userStatsLoading } =
    useUserStats(session);

  // 🔍 フィルタリング用ステート
  const [filterType, setFilterType] = useState<
    "all" | "info" | "alert" | "idea"
  >("all");
  const [showResolved, setShowResolved] = useState(false);
  const [viewScope, setViewScope] = useState<"exact" | "domain" | "inbox">(
    "exact",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [isInputModeOpen, setIsInputModeOpen] = useState(false);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    notes,
    loading,
    addNote: originalAddNote,
    updateNote,
    deleteNote,
    toggleResolved,
    toggleFavorite,
    togglePinned,
    updateNoteOrder,
    toggleNoteExpansion,
  } = useNotes(session, currentFullUrl, setTotalNoteCount, viewScope);

  // スクロールバック付きのラッパー関数
  const handleAddNote = async (
    content: string,
    scope: NoteScope,
    type: NoteType,
  ) => {
    const success = await originalAddNote(content, scope, type);
    if (success) {
      // 新規ノート追加時、背後のノートリストを最上部へ自動でスクロールバック
      setTimeout(() => {
        if (listContainerRef.current) {
          listContainerRef.current.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }
      }, 100);
    }
    return success;
  };

  // 🔍 フィルタリングロジックの集約 (SSOT)
  const scopeUrls = currentFullUrl
    ? getScopeUrls(currentFullUrl)
    : { domain: "", exact: "" };

  const filteredNotesForTags = notes.filter((n) => {
    // 1. スコープ（タブ）フィルターの適用
    // 原則: 「現在お気に入りである」か「現在のURL/スコープに一致する」かのいずれかが必要
    const isCurrentScope =
      (viewScope === "inbox" && n.scope === "inbox") ||
      (viewScope === "domain" &&
        n.scope === "domain" &&
        n.url_pattern === scopeUrls.domain) ||
      (viewScope === "exact" &&
        n.scope === "exact" &&
        n.url_pattern === scopeUrls.exact);

    // 🚨 お気に入りを解除した瞬間、isCurrentScopeがfalseならリストから除外される
    if (!n.is_favorite && !isCurrentScope) {
      return false;
    }

    // 他のタブの「お気に入り」は表示するが、現在のタブの「お気に入りではないノート」も表示する
    // ただし、現在選択中のタブ(viewScope)とノートのscopeが不一致なものは落とす（InboxタブにDomainノートを出さない等）
    if (viewScope === "inbox" && n.scope !== "inbox") return false;
    if (viewScope !== "inbox" && n.scope === "inbox") return false;
    if (viewScope !== "inbox" && !n.is_favorite && n.scope !== viewScope)
      return false;

    // 2. Note Type フィルター
    if (filterType !== "all" && (n.note_type || "info") !== filterType) {
      return false;
    }

    // 3. 解決済みフィルター
    if (!showResolved && n.is_resolved) {
      return false;
    }

    // 4. 検索クエリフィルター
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesContent = n.content?.toLowerCase().includes(searchLower);
      const matchesTags = n.tags?.some((tag) =>
        tag.toLowerCase().includes(searchLower),
      );
      const matchesUrl = n.url_pattern?.toLowerCase().includes(searchLower);

      if (!matchesContent && !matchesTags && !matchesUrl) {
        return false;
      }
    }

    return true;
  });

  const availableTags = Array.from(
    new Set(
      filteredNotesForTags.flatMap(
        (n) => (n as { tags?: string[] }).tags || [],
      ),
    ),
  ).sort();

  const finalFilteredNotes = filteredNotesForTags.filter((n) => {
    const noteTags = (n as { tags?: string[] }).tags || [];
    if (selectedTag && !noteTags.includes(selectedTag)) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full h-screen bg-base-surface grid grid-rows-[auto_auto_auto_auto_1fr] relative font-sans">
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            fontSize: "12px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "#262626", // action
            color: "#ffffff", // action-text
          },
        }}
      />
      <Header
        url={url}
        title={title}
        domain={currentFullUrl ? getScopeUrls(currentFullUrl).domain : ""}
        session={session}
        onLogout={onLogout}
      />

      <QuickLinks
        currentDomain={
          currentFullUrl ? getScopeUrls(currentFullUrl).domain : null
        }
      />

      <FilterBar
        filterType={filterType}
        setFilterType={setFilterType}
        showResolved={showResolved}
        setShowResolved={setShowResolved}
        viewScope={viewScope}
        setViewScope={setViewScope}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredNotes={finalFilteredNotes} // コピー対象はタグ絞り込み後の最終リスト
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        availableTags={availableTags}
      />

      <div className="grid grid-cols-3 items-center px-4 py-1.5 bg-base-surface shrink-0 border-b border-base-border shadow-xs">
        {/* 左カラム（将来の拡張アクションボタン用スペース） */}
        <div className="flex justify-start" />

        {/* 中央カラム（「＋」ボタンを物理的中心に完全ロック） */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setIsInputModeOpen(true);
              setTimeout(() => textareaRef.current?.focus(), 50);
            }}
            className="cursor-pointer w-9 h-9 rounded-full bg-action text-action-text shadow-md hover:bg-action-hover transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center border border-action-hover/10"
            title="Create new note"
          >
            <Plus aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        {/* 右カラム（将来の拡張アクションボタン用スペース） */}
        <div className="flex justify-end" />
      </div>

      <div ref={listContainerRef} className="overflow-y-auto p-4 relative">
        <NoteList
          notes={finalFilteredNotes}
          loading={loading}
          currentFullUrl={currentFullUrl}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onToggleResolved={toggleResolved}
          onToggleFavorite={toggleFavorite}
          onTogglePinned={togglePinned}
          onUpdateNoteOrder={updateNoteOrder}
          onToggleExpansion={toggleNoteExpansion}
        />
      </div>

      {isInputModeOpen && (
        <>
          {/* 背景の遮断レイヤー（領域外クリックで閉じる） */}
          <button
            type="button"
            className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity duration-200 cursor-default"
            onClick={() => setIsInputModeOpen(false)}
            aria-label="Close input overlay"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-sm z-50 animate-in fade-in zoom-in-95 duration-200">
            {userStatsLoading ? (
              <div className="p-4 bg-base-surface border border-base-border/50 rounded-2xl shadow-2xl flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <NoteInput
                userPlan={userPlan}
                totalNoteCount={totalNoteCount}
                maxFreeNotes={MAX_FREE_NOTES}
                onAddNote={handleAddNote}
                onClose={() => setIsInputModeOpen(false)}
                textareaRef={textareaRef}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
