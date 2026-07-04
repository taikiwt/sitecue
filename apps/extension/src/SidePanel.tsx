import { getScopeUrls } from "@sitecue/shared";
import type { Session } from "@supabase/supabase-js";
import { Check, Copy, Loader2, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
	} = useNotes(session, currentFullUrl, setTotalNoteCount, viewScope);

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
				selectedTag={selectedTag}
				setSelectedTag={setSelectedTag}
				availableTags={availableTags}
			/>

			{/* 🚀 等幅3カラム中央集権型アクションバー (グレー背景を白背景 bg-base-bg へ融和) */}
			<div className="grid grid-cols-3 items-center px-4 py-2 bg-base-bg shrink-0 border-b border-base-border/40 shadow-xs">
				{/* 左カラム：拡張用スペース */}
				<div className="flex justify-start" />

				{/* 中央カラム：「＋」ボタンを物理的中心に完全ロック */}
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
						className={`cursor-pointer flex items-center justify-center rounded-full transition-colors shrink-0 size-7 ${
							isCopied
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
