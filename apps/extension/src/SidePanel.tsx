import {
  appendDiaryLog,
  fetchDiaryByDate,
  getScopeUrls,
} from "@sitecue/shared";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Check,
  Copy,
  Edit2,
  ExternalLink,
  Loader2,
  Plus,
  X,
  Pencil
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import TextareaAutosize from "react-textarea-autosize";
import FilterBar from "./components/FilterBar";
import Header from "./components/Header";
import LoginScreen from "./components/LoginScreen";
import MarkdownRenderer from "./components/MarkdownRenderer";
import NoteInput from "./components/NoteInput";
import NoteList from "./components/NoteList";
import QuickLinks from "./components/QuickLinks";
import type { AuthStatus } from "./hooks/useAuth";
import { useAuth } from "./hooks/useAuth";
import { useAutoIndent } from "./hooks/useAutoIndent";
import { useCurrentTab } from "./hooks/useCurrentTab";
import type { NoteScope, NoteType } from "./hooks/useNotes";
import { useNotes } from "./hooks/useNotes";
import { useUserStats } from "./hooks/useUserStats";

const MAX_FREE_NOTES = 500;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function SidePanel() {
  const {
    session,
    authLoading,
    authError,
    sessionLoading,
    handleLogout,
    handleSocialLogin,
    authStatus,
    handleGuestLogin,
    handleGuestLogout,
  } = useAuth();

  if (sessionLoading && authStatus.mode !== "guest") {
    return (
      <div className="w-full h-screen bg-base-surface flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session && authStatus.mode !== "guest") {
    return (
      <LoginScreen
        authError={authError}
        authLoading={authLoading}
        handleSocialLogin={handleSocialLogin}
        onGuestLogin={handleGuestLogin}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NotesUI
        authStatus={authStatus}
        onLogout={
          authStatus.mode === "guest" ? handleGuestLogout : handleLogout
        }
      />
    </QueryClientProvider>
  );
}

function NotesUI({
  authStatus,
  onLogout,
}: {
  authStatus: AuthStatus;
  onLogout: () => void;
}) {
  const handleAutoIndent = useAutoIndent();
  const session =
    authStatus.mode === "authenticated" ? authStatus.session : null;
  const { currentFullUrl, url, title } = useCurrentTab();
  const {
    userPlan: dbUserPlan,
    totalNoteCount: dbTotalNoteCount,
    setTotalNoteCount,
    userStatsLoading: dbUserStatsLoading,
  } = useUserStats(session);

  const isGuest = authStatus.mode === "guest";
  const userPlan = isGuest ? "guest" : dbUserPlan;
  const userStatsLoading = isGuest ? false : dbUserStatsLoading;

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

  // State
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [selectedDiaryDate, setSelectedDiaryDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [isEditingDiary, setIsEditingDiary] = useState(false);
  const [editDiaryContent, setEditDiaryContent] = useState("");
  const [editDiaryTopics, setEditDiaryTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(
    null,
  );
  const [editingTopicText, setEditingTopicText] = useState("");

  const queryClient = useQueryClient();

  // selectedDiaryDate (形式: "2026-07-08") からクエリパラメータを解決
  const [yearStr, monthStr] = selectedDiaryDate.split("-");
  const basecampArchiveUrl = `https://app.sitecue.app/notes?view=diaries&year=${yearStr}&month=${monthStr}`;

  // Fetch diary logs via fetchDiaryByDate from @sitecue/shared
  const { data: diaryData, isLoading: isDiaryLoading } = useQuery({
    queryKey: [
      "diary",
      selectedDiaryDate,
      authStatus.mode === "authenticated"
        ? authStatus.session?.user.id
        : "guest",
    ],
    queryFn: async () => {
      if (authStatus.mode === "guest") {
        const storedText =
          localStorage.getItem(`diary-${selectedDiaryDate}`) || "";
        const storedTopicsJson = localStorage.getItem(
          `diary-topics-${selectedDiaryDate}`,
        );
        const storedTopics = storedTopicsJson
          ? JSON.parse(storedTopicsJson)
          : [];
        return { content: storedText, topics: storedTopics };
      }
      const supabaseClient = (await import("./supabaseClient")).supabase;
      return fetchDiaryByDate(
        supabaseClient,
        authStatus.session?.user.id ?? "",
        selectedDiaryDate,
      );
    },
    enabled: isDiaryOpen,
  });

  // Append diary mutation via appendDiaryLog from @sitecue/shared
  const appendDiaryMutation = useMutation({
    mutationFn: async (text: string) => {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (authStatus.mode === "guest") {
        const existing = localStorage.getItem(`diary-${todayStr}`) || "";
        const timestamp = `[${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}]`;
        const newContent = existing
          ? `${existing}\n\n${timestamp} ${text}`
          : `${timestamp} ${text}`;
        localStorage.setItem(`diary-${todayStr}`, newContent);
        return { content: newContent };
      }
      const supabaseClient = (await import("./supabaseClient")).supabase;
      return appendDiaryLog(
        supabaseClient,
        authStatus.session?.user.id ?? "",
        todayStr,
        text,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary"] });
    },
  });

  // Update diary content and topics mutation
  const updateDiaryMutation = useMutation({
    mutationFn: async ({
      text,
      topics,
    }: {
      text: string;
      topics: string[];
    }) => {
      if (authStatus.mode === "guest") {
        localStorage.setItem(`diary-${selectedDiaryDate}`, text);
        localStorage.setItem(
          `diary-topics-${selectedDiaryDate}`,
          JSON.stringify(topics),
        );
        return { content: text, topics };
      }
      const supabaseClient = (await import("./supabaseClient")).supabase;
      const { updateDiaryContent } = await import("@sitecue/shared");
      return updateDiaryContent(
        supabaseClient,
        authStatus.session?.user.id ?? "",
        selectedDiaryDate,
        text,
        topics,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary"] });
      setIsEditingDiary(false);
    },
  });

  const handleAppendDiary = async (content: string) => {
    try {
      await appendDiaryMutation.mutateAsync(content);
      return true;
    } catch (_err) {
      return false;
    }
  };

  const handleSaveDiaryEdit = async () => {
    if (updateDiaryMutation.isPending) return;
    try {
      await updateDiaryMutation.mutateAsync({
        text: editDiaryContent,
        topics: editDiaryTopics,
      });
      toast.success("Diary updated");
    } catch {
      toast.error("Failed to update diary");
    }
  };

  const handleStartEdit = () => {
    setEditDiaryContent(diaryData?.content || "");
    setEditDiaryTopics(diaryData?.topics || []);
    setNewTopic("");
    setEditingTopicIndex(null);
    setIsEditingDiary(true);
  };

  const handleAddTopic = () => {
    const val = newTopic.trim();
    if (!val) return;
    if (editDiaryTopics.length >= 10) {
      toast.error("Maximum 10 topics allowed");
      return;
    }
    if (val.length > 50) {
      toast.error("Topic length cannot exceed 50 characters");
      return;
    }
    if (editDiaryTopics.includes(val)) {
      toast.error("Topic already exists");
      return;
    }
    setEditDiaryTopics([...editDiaryTopics, val]);
    setNewTopic("");
  };

  const handleRemoveTopic = (index: number) => {
    setEditDiaryTopics(editDiaryTopics.filter((_, i) => i !== index));
  };

  const handleStartEditTopic = (index: number) => {
    setEditingTopicIndex(index);
    setEditingTopicText(editDiaryTopics[index]);
  };

  const handleSaveTopicEdit = (index: number) => {
    const val = editingTopicText.trim();
    if (!val) {
      handleRemoveTopic(index);
      setEditingTopicIndex(null);
      return;
    }
    if (val.length > 50) {
      toast.error("Topic length cannot exceed 50 characters");
      return;
    }
    const duplicate = editDiaryTopics.some((t, i) => t === val && i !== index);
    if (duplicate) {
      toast.error("Topic already exists");
      return;
    }
    const updated = [...editDiaryTopics];
    updated[index] = val;
    setEditDiaryTopics(updated);
    setEditingTopicIndex(null);
  };

  // 📋 一括コピー用のステートとロジック
  const [isCopied, setIsCopied] = useState(false);
  const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // clipboard write failed silently
    }
  };

  const handleCopyText = async () => {
    const text = finalFilteredNotes.map((n) => n.content ?? "").join("\n\n");
    await copyToClipboard(text);
    setIsCopyMenuOpen(false);
  };

  const handleCopyJson = async () => {
    const json = finalFilteredNotes.map((n) => ({
      type: n.note_type || "info",
      content: n.content,
    }));
    await copyToClipboard(JSON.stringify(json, null, 2));
    setIsCopyMenuOpen(false);
  };

  // Close search and menu when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCopyMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsCopyMenuOpen(false);
      }
    };
    if (isCopyMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCopyMenuOpen]);

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
  } = useNotes(authStatus, currentFullUrl, setTotalNoteCount, viewScope);

  const totalNoteCount = isGuest
    ? notes.filter((n) => n.scope !== "inbox").length
    : dbTotalNoteCount;

  // スクロールバック付きのラッパー関数
  const handleAddNote = async (
    content: string,
    scope: NoteScope,
    type: NoteType,
  ) => {
    const success = await originalAddNote(content, scope, type);
    if (success) {
      // 新規ノート追加時、背後のノートリストを最上部へ自动でスクロールバック
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

  // 変更があるかどうかの厳密な判定
  const isContentUnchanged = editDiaryContent === (diaryData?.content ?? "");
  const isTopicsUnchanged = JSON.stringify(editDiaryTopics) === JSON.stringify(diaryData?.topics ?? []);
  const hasDiaryChanges = !isContentUnchanged || !isTopicsUnchanged;

  // Saveボタンの無効化条件
  const isSaveDisabled = !hasDiaryChanges || updateDiaryMutation.isPending;

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
        authStatus={authStatus}
        onDiaryClick={() => {
          setIsDiaryOpen(true);
          setIsEditingDiary(false);
        }}
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
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        availableTags={availableTags}
      />

      {/* 🚀 等幅3カラム中央集権型アクションバー (グレー背景を白背景 bg-base-bg へ融和) */}
      <div className="grid grid-cols-3 items-center px-4 py-2 bg-base-bg shrink-0 border-b border-base-border/40 shadow-xs">
        {/* 左カラム：拡張用スペース */}
        <div className="flex justify-start" />

        {/* 一角カラム：「＋」ボタンを物理的中心に完全ロック */}
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

        {/* 右カラム：移設された一括コピーボタン (ドロップダウン) */}
        <div className="flex justify-end relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsCopyMenuOpen(!isCopyMenuOpen)}
            className={`cursor-pointer flex items-center justify-center rounded-full transition-colors shrink-0 size-7 ${isCopied
              ? "text-note-info bg-note-info/10"
              : isCopyMenuOpen
                ? "text-action bg-base-border"
                : "text-muted-foreground bg-base-surface hover:text-action hover:bg-base-border"
              }`}
            title={isCopied ? "Copied!" : "Copy options"}
            aria-label={isCopied ? "Copied!" : "Open copy options menu"}
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {isCopyMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-base-surface border border-base-border rounded shadow-md z-40 py-1 min-w-[120px]">
              <button
                type="button"
                onClick={handleCopyText}
                className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-base-bg transition-colors"
              >
                Copy as Text
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-base-bg transition-colors"
              >
                Copy as JSON
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={listContainerRef}
        className="overflow-y-auto px-4 pb-4 pt-0 relative"
      >
        {/* 💡 スティッキー吸着時の上部隙間をゼロにしつつ、初期状態の窮屈さを防ぐ空気感スペーサー */}
        <div className="h-2 shrink-0" aria-hidden="true" />

        {loading && notes.length === 0 ? (
          <div className="w-full h-32 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <NoteList
            notes={finalFilteredNotes}
            loading={loading}
            currentFullUrl={currentFullUrl}
            onUpdate={updateNote}
            onDelete={deleteNote}
            onToggleResolved={toggleResolved}
            onToggleFavorite={toggleFavorite}
            onTogglePinned={togglePinned}
            onUpdateNoteOrder={(id, direction) =>
              updateNoteOrder(id, direction, finalFilteredNotes)
            }
            onToggleExpansion={toggleNoteExpansion}
          />
        )}
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
              <>
                {/* 🚨 ゲスト用 Note Limit 警告アラート（90%にあたる45件以上で露出） */}
                {isGuest && totalNoteCount >= 45 && (
                  <div className="text-[11px] text-note-alert bg-note-alert/10 border border-note-alert/20 p-2.5 rounded-xl mb-2 text-center font-medium shadow-sm animate-in fade-in duration-200">
                    Note storage limit approaching ({totalNoteCount}/50).
                    <br />
                    Please sign in to enjoy unlimited cloud sync.
                  </div>
                )}
                <NoteInput
                  userPlan={userPlan}
                  totalNoteCount={totalNoteCount}
                  maxFreeNotes={isGuest ? 50 : MAX_FREE_NOTES}
                  onAddNote={handleAddNote}
                  onAppendDiary={handleAppendDiary}
                  onClose={() => setIsInputModeOpen(false)}
                  textareaRef={textareaRef}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* 日記ドロワーのUIコンポーネント */}
      <div
        className={`fixed inset-y-0 right-0 w-full bg-base-surface z-50 transform transition-transform duration-300 ease-in-out grid grid-rows-[auto_1fr] font-sans ${isDiaryOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* 1. 視認性を極限まで高めた最上部ヘッダーエリア */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-base-border/40 bg-base-bg shrink-0">
          <div className="flex items-center gap-4">
            {/* 最上部左側の物理的な「×クローズボタン」 */}
            <button
              type="button"
              onClick={() => setIsDiaryOpen(false)}
              className="cursor-pointer size-8 flex items-center justify-center rounded-full bg-base-surface hover:bg-base-border text-muted-foreground hover:text-base-text transition-colors"
              title="Close diary"
              aria-label="Close diary"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
            <h1 className="text-xl font-bold text-base-text tracking-tight leading-none">
              Diary
            </h1>
          </div>

          {/* 右上の明確なカプセルボタン構造モードトグル */}
          <div className="flex items-center gap-2 shrink-0">
            {!isEditingDiary ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="cursor-pointer px-3 py-1.5 rounded-full bg-action text-action-text font-bold text-xs hover:bg-action-hover shadow-xs transition-colors flex items-center gap-1.5"
                title="Edit diary"
              >
                <Pencil aria-hidden="true" className="size-4" />
                <span>Edit</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditingDiary(false)}
                  className="cursor-pointer px-3 py-1.5 rounded-full bg-base-bg text-muted-foreground font-semibold text-xs hover:bg-base-border/40 transition-none"
                  title="Cancel editing"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDiaryEdit}
                  disabled={isSaveDisabled}
                  className="cursor-pointer px-3 py-1.5 rounded-full bg-action text-action-text font-bold text-xs hover:bg-action-hover disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-colors flex items-center gap-1"
                  title="Save diary"
                >
                  {updateDiaryMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  <span>Save</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. スクロールコンテンツエリア（純粋なスクロールの窓として高さを固定・隔離） */}
        <div className="overflow-y-auto h-full w-full">
          {/* 🌟 縦伸び防壁インナーラッパー（これがコンテンツの総量に合わせて下に自動でどこまでも伸長する） */}
          <div className="p-4 flex flex-col min-h-full space-y-5">
            {/* 3日間凝縮日付カプセル ＆ 末尾インライン ...Basecamp カプセルドッキング */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none shrink-0 items-center">
              {Array.from({ length: 3 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDiaryDate(dateStr);
                      setIsEditingDiary(false);
                    }}
                    className={`cursor-pointer px-3.5 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${selectedDiaryDate === dateStr ? "bg-action text-action-text" : "bg-base-bg text-muted-foreground hover:bg-base-border/40"}`}
                  >
                    {i === 0 ? "Today" : dateStr.substring(5)}
                  </button>
                );
              })}
              {/* インラインドッキング端子カプセル */}
              <a
                href={basecampArchiveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap bg-base-bg text-muted-foreground hover:text-action hover:bg-base-border/40 transition-colors flex items-center gap-1 border border-dashed border-base-border/60"
                title="View this month on Basecamp"
              >
                <span>... Basecamp</span>
                <ExternalLink aria-hidden="true" className="w-3 h-3" />
              </a>
            </div>

            {/* トピック編集エリア (編集モード時のみ露出、IMEガード完備) */}
            {isEditingDiary && (
              <div className="flex flex-col gap-3 w-full border border-base-border bg-base-surface/30 p-4 rounded-xl animate-in fade-in duration-150">
                <span className="text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-wider">
                  Key Events of the Day ({editDiaryTopics.length}/10)
                </span>
                <div className="flex flex-col gap-2 w-full">
                  {editDiaryTopics.map((topic, index) => (
                    <div key={topic} className="flex items-center gap-2 w-full">
                      {editingTopicIndex === index ? (
                        <input
                          type="text"
                          value={editingTopicText}
                          onChange={(e) => setEditingTopicText(e.target.value)}
                          onBlur={() => handleSaveTopicEdit(index)}
                          onKeyDown={(e) => {
                            if (e.nativeEvent.isComposing) return; // 🌟 漢字確定のEnter暴発を100%完全遮断
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveTopicEdit(index);
                            }
                            if (e.key === "Escape") setEditingTopicIndex(null);
                          }}
                          className="flex-1 text-xs px-3 py-1.5 rounded-full border border-base-border bg-base-bg text-base-text focus:outline-none focus:ring-1 focus:ring-action"
                          // biome-ignore lint/a11y/noAutofocus: input needs autoFocus when editing topic
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEditTopic(index)}
                          className="flex-1 text-left text-xs px-4 py-1.5 rounded-full border border-base-border bg-base-surface text-base-text hover:bg-base-bg transition-colors truncate"
                        >
                          {topic}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(index)}
                        className="p-1 rounded-full hover:bg-neutral-100 text-muted-foreground hover:text-note-alert transition-colors cursor-pointer"
                        title="Remove topic"
                      >
                        <X aria-hidden="true" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {editDiaryTopics.length < 10 && (
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      type="text"
                      placeholder="Add a key event..."
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return; // 🌟 漢字確定のEnter暴発を100%完全遮断
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTopic();
                        }
                      }}
                      className="flex-1 text-xs px-3 py-1.5 rounded-full border border-base-border bg-base-bg text-base-text focus:outline-none focus:ring-1 focus:ring-action"
                    />
                    <button
                      type="button"
                      onClick={handleAddTopic}
                      disabled={!newTopic.trim()}
                      className="cursor-pointer px-3 py-1.5 rounded-full bg-action text-action-text font-bold text-xs hover:bg-action-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. 可読性を最大化した「ホワイトキャンバス」領域 (表示/編集の双方に白背景を強制) */}
            <div className="bg-white text-neutral-900 rounded-xl p-4 border border-base-border/40 shadow-xs flex-1 flex flex-col min-h-[350px]">
              {/* 閲覧モード時のトピックスタック表示 (ホワイトキャンバス内に統合) */}
              {!isEditingDiary &&
                diaryData?.topics &&
                diaryData.topics.length > 0 && (
                  <div className="flex flex-col gap-2 w-full border-b border-neutral-100 pb-4 mb-4 shrink-0">
                    {diaryData.topics.map((topic: string) => (
                      <div
                        key={topic}
                        className="w-full text-xs font-semibold text-neutral-700 bg-base-bg border border-base-border/40 rounded-xl px-4 py-2 text-left shadow-2xs"
                      >
                        {topic}
                      </div>
                    ))}
                  </div>
                )}

              {isEditingDiary ? (
                <TextareaAutosize
                  value={editDiaryContent}
                  onChange={(e) => setEditDiaryContent(e.target.value)}
                  placeholder="Write down your thoughts for today... (Markdown supported)"
                  className="w-full flex-1 resize-none border-none p-0 text-sm focus:outline-none bg-transparent text-neutral-900 focus:ring-0"
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      if (!isSaveDisabled) handleSaveDiaryEdit();
                    } else {
                      handleAutoIndent(e);
                    }
                  }}
                />
              ) : (
                <div className="prose prose-sm max-w-none text-neutral-900 break-words [overflow-wrap:anywhere] flex-1">
                  {isDiaryLoading ? (
                    <div className="text-xs text-neutral-400 animate-pulse">
                      Loading diary...
                    </div>
                  ) : diaryData?.content ? (
                    <MarkdownRenderer content={diaryData.content} />
                  ) : (
                    <div className="text-xs text-neutral-400 italic">
                      No logs written for this day.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
