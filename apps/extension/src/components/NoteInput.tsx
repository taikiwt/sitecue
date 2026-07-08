import { AlertTriangle, Info, Lightbulb, Send, X } from "lucide-react";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { APP_LIMITS } from "../constants/limits";
import { useAutoIndent } from "../hooks/useAutoIndent";
import type { NoteScope, NoteType } from "../hooks/useNotes";

interface NoteInputProps {
  userPlan: "free" | "pro" | "guest";
  totalNoteCount: number;
  maxFreeNotes: number;
  onAddNote: (
    content: string,
    scope: NoteScope,
    type: NoteType,
  ) => Promise<boolean>;
  onAppendDiary: (content: string) => Promise<boolean>;
  onClose: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export default function NoteInput({
  userPlan,
  totalNoteCount,
  maxFreeNotes,
  onAddNote,
  onAppendDiary,
  onClose,
  textareaRef,
}: NoteInputProps) {
  const [selectedScope, setSelectedScope] = useState<NoteScope>("exact");
  const [selectedType, setSelectedType] = useState<NoteType>("info");
  const [newNote, setNewNote] = useState("");
  const [diaryText, setDiaryText] = useState("");
  const handleAutoIndent = useAutoIndent();

  const handleDiarySubmit = async () => {
    const content = diaryText.trim();
    if (!content) return;
    setDiaryText("");
    const success = await onAppendDiary(content);
    if (!success) {
      setDiaryText(content);
    } else {
      onClose();
    }
  };

  const isNearLimit = totalNoteCount >= maxFreeNotes * 0.9;
  const isLimitReached = totalNoteCount >= maxFreeNotes;

  const charCount = newNote.length;
  const isCharNearLimit = charCount >= APP_LIMITS.MAX_NOTE_LENGTH * 0.9;
  const isCharOverLimit = charCount > APP_LIMITS.MAX_NOTE_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newNote.trim();
    if (!content || isCharOverLimit) return;

    // 即座に入力欄をクリアしてUXを向上（オプティミスティック更新）
    setNewNote("");
    // フォーカスを自動維持して連続タイピングフローを保護
    setTimeout(() => textareaRef?.current?.focus(), 10);

    const success = await onAddNote(content, selectedScope, selectedType);
    if (!success) {
      // 失敗時は入力をロールバック
      setNewNote(content);
    }
  };

  return (
    <div className="px-4 py-10 bg-base-surface border border-base-border/60 rounded-2xl shadow-2xl relative transition-all duration-200">
      {/* 右上の閉じるボタン「×」 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-1 right-1 p-1 rounded-full text-muted-foreground border border-base-border hover:text-black hover:bg-base-border transition-colors cursor-pointer"
        title="Close input"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* 1. ノート用フォーム (最初の美しい状態に完全復元) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <label
              className={`flex items-center gap-1.5 cursor-pointer ${selectedScope === "exact" ? "text-action hover:text-action-hover" : "text-neutral-800 hover:text-black"}`}
            >
              <input
                type="radio"
                name="scope"
                checked={selectedScope === "exact"}
                onChange={() => setSelectedScope("exact")}
                className="accent-action focus:ring-action"
              />
              <span>Page</span>
            </label>
            <label
              className={`flex items-center gap-1.5 cursor-pointer ${selectedScope === "domain" ? "text-action hover:text-action-hover" : "text-neutral-800 hover:text-black"}`}
            >
              <input
                type="radio"
                name="scope"
                checked={selectedScope === "domain"}
                onChange={() => setSelectedScope("domain")}
                className="accent-action focus:ring-action"
              />
              <span>Domain</span>
            </label>
            <label
              className={`flex items-center gap-1.5 cursor-pointer ${selectedScope === "inbox" ? "text-action hover:text-action-hover" : "text-neutral-800 hover:text-black"}`}
            >
              <input
                type="radio"
                name="scope"
                checked={selectedScope === "inbox"}
                onChange={() => setSelectedScope("inbox")}
                className="accent-action focus:ring-action"
              />
              <span>Inbox</span>
            </label>
          </div>

          <div className="flex bg-neutral-100 p-0.5 rounded-full">
            <button
              type="button"
              onClick={() => setSelectedType("info")}
              className={`cursor-pointer p-1 rounded-full ${selectedType === "info" ? "bg-note-info/80 text-action-text" : "text-muted-foreground hover:text-note-info"}`}
              title="Info"
            >
              <Info className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("alert")}
              className={`cursor-pointer p-1 rounded-full ${selectedType === "alert" ? "bg-note-alert/80 text-action-text" : "text-muted-foreground hover:text-note-alert"}`}
              title="Alert"
            >
              <AlertTriangle className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("idea")}
              className={`cursor-pointer p-1 rounded-full ${selectedType === "idea" ? "bg-note-idea/80 text-action-text" : "text-muted-foreground hover:text-note-idea"}`}
              title="Idea"
            >
              <Lightbulb className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {(userPlan === "free" || userPlan === "guest") &&
          isNearLimit &&
          !isLimitReached && (
            <div className="flex items-start gap-2 p-2 mb-2 text-xs text-note-alert bg-note-alert/10 border border-note-alert/20 rounded">
              <AlertTriangle
                className="w-4 h-4 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p>
                Approaching limit ({totalNoteCount}/{maxFreeNotes}). Please
                visit
                {userPlan === "guest"
                  ? " Login screen to sign in"
                  : " Basecamp"}{" "}
                to free up space or unlock unlimited notes.
              </p>
            </div>
          )}

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 items-center relative"
        >
          {(userPlan === "free" || userPlan === "guest") && isLimitReached ? (
            <div className="w-full bg-note-idea/10 border border-note-idea/20 rounded-lg p-3 text-sm text-note-idea flex items-start gap-3">
              <AlertTriangle
                className="w-5 h-5 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <div className="font-bold mb-1">Note Limit Reached</div>
                <p className="text-xs opacity-90">
                  You have reached the {maxFreeNotes}-note limit. Please visit
                  {userPlan === "guest"
                    ? " Login screen to sign in"
                    : " Basecamp"}{" "}
                  to free up space or upgrade for unlimited access.
                </p>
              </div>
            </div>
          ) : (
            <>
              <TextareaAutosize
                ref={textareaRef}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={`Add a cue to ${selectedScope === "inbox" ? "Inbox" : selectedScope === "domain" ? "this domain" : "this page"}...`}
                className="flex-1 resize-none border border-base-border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action/20 focus:border-action/20 transition-all max-h-40 pr-10 bg-transparent text-base-text"
                minRows={2}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;

                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  } else {
                    handleAutoIndent(e);
                  }
                }}
              />
              {isCharNearLimit && (
                <div className="absolute right-12 bottom-2 pointer-events-none">
                  <span
                    className={`text-[10px] font-bold ${isCharOverLimit ? "text-note-alert" : "text-note-idea"}`}
                  >
                    {charCount.toLocaleString()} /{" "}
                    {APP_LIMITS.MAX_NOTE_LENGTH.toLocaleString()}
                  </span>
                </div>
              )}
              <button
                disabled={!newNote.trim() || isCharOverLimit}
                type="submit"
                className="cursor-pointer bg-action text-action-text w-9 h-9 rounded-full flex items-center justify-center hover:bg-action-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                title="Add Note"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}
        </form>
      </div>

      {/* 2. マージンを空けて並列配置する Diary専用島コンテナ */}
      <div className="mt-4 border-t border-base-border/40 pt-4 space-y-2">
        <div className="text-[10px] font-bold text-muted-foreground tracking-wider px-1 uppercase">
          Diary
        </div>
        <div className="rounded-xl flex gap-2 items-center relative">
          <TextareaAutosize
            value={diaryText}
            onChange={(e) => setDiaryText(e.target.value)}
            placeholder="Append to today's diary (Ctrl+Enter)..."
            className="flex-1 resize-none border border-base-border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action/20 focus:border-action/20 transition-all max-h-40 bg-transparent text-base-text"
            minRows={1}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleDiarySubmit();
              }
            }}
          />
          <button
            type="button"
            onClick={handleDiarySubmit}
            disabled={!diaryText.trim()}
            className="cursor-pointer bg-action text-action-text w-9 h-9 rounded-full flex items-center justify-center hover:bg-action-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            title="Append to Diary"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
