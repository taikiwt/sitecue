import {
	ArrowRightLeft,
	Check,
	ChevronDown,
	ChevronRight,
	Copy,
	CircleX,
	ExternalLink,
	FileText,
	Link as LinkIcon,
	Loader2,
	Lock,
	Pencil,
	Plus,
	Send,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useAutoIndent } from "../hooks/useAutoIndent";
import { useQuickLinks } from "../hooks/useQuickLinks";
import { Button } from "./ui/button";

interface QuickPanelProps {
	currentDomain: string | null;
	onAddNote: (
		content: string,
		scope: "exact" | "domain" | "inbox",
		type: "info" | "alert" | "idea",
	) => Promise<boolean>;
	onAppendDiary: (content: string) => Promise<boolean>;
}

export default function QuickPanel({
	currentDomain,
	onAddNote,
	onAppendDiary,
}: QuickPanelProps) {
	const { links, loading, addLink, updateLink, deleteLink } =
		useQuickLinks(currentDomain);
	const [activeSection, setActiveSection] = useState<"none" | "note" | "links">(
		"none",
	);
	const [noteText, setNoteText] = useState("");
	const [copied, setCopied] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const textRef = useRef("");
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const isStorageLoadedRef = useRef(false); // 🚨 起動時データ復元未完了状態の強制上書き保存ロック（防壁）

	// 既存のQuickLinks用ステート
	const [isAdding, setIsAdding] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: Match existing useQuickLinks type definition
	const [editingLink, setEditingLink] = useState<any | null>(null);
	const [formUrl, setFormUrl] = useState("");
	const [formLabel, setFormLabel] = useState("");
	const [formType, setFormType] = useState<"related" | "env">("related");
	const [linkSubmitting, setLinkSubmitting] = useState(false);

	const handleAutoIndent = useAutoIndent();

	// 🛡️ ストレージへの強制書き込み安全装置（Flush）
	const flushTextStorage = useCallback(() => {
		// 🚨 防壁ロジック：ストレージからの非同期getが一度も完了していない初期化揺らぎ状態での書き込みを100%鉄壁ガード！
		if (!isStorageLoadedRef.current) return;

		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}
		if (typeof chrome !== "undefined" && chrome.storage?.local) {
			chrome.storage.local.set({ quick_note_text: textRef.current });
		}
	}, []);

	// 🛡️ ストレージからの自動復元時、State と Ref の双方に即時同期し、ロックを解除
	useEffect(() => {
		if (typeof chrome !== "undefined" && chrome.storage?.local) {
			chrome.storage.local.get("quick_note_text", (result) => {
				const val = (result as Record<string, unknown>).quick_note_text;
				if (typeof val === "string") {
					setNoteText(val);
					textRef.current = val; // 同期
				}
				isStorageLoadedRef.current = true; // 🚨 復元が正常完了したため、ここで初めて書き込みロックを解除！
			});
		}
	}, []);

	// 🛡️ 入力時：State と Ref を「完全同時（同期的）」に即時更新し、デバウンスを設定
	const handleTextChange = (val: string) => {
		// 🚨 まだ復元が完了していない起動時の一瞬の入力はガード（通常ありえないが安全弁として）
		if (!isStorageLoadedRef.current) return;

		setNoteText(val);
		textRef.current = val; // 🚨 ここで 0ms 同期更新！useEffectでの遅延更新は全面廃止

		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}
		debounceTimerRef.current = setTimeout(() => {
			if (typeof chrome !== "undefined" && chrome.storage?.local) {
				chrome.storage.local.set({ quick_note_text: val });
			}
			debounceTimerRef.current = null;
		}, 300);
	};

	// 🛡️ 多層防壁：アンマウントクリーンアップおよび急なプロセス切断（pagehide）への安全弁バインド
	useEffect(() => {
		const handlePageHide = () => {
			flushTextStorage();
		};
		window.addEventListener("pagehide", handlePageHide);

		return () => {
			window.removeEventListener("pagehide", handlePageHide);
			flushTextStorage();
		};
	}, [flushTextStorage]);

	const handleClearText = () => {
		handleTextChange("");
	};

	const toggleSection = (section: "note" | "links") => {
		setActiveSection((prev) => (prev === section ? "none" : section));
	};

	const handleCopy = async () => {
		if (!noteText) return;
		await navigator.clipboard.writeText(noteText);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleSaveAsNote = async () => {
		if (!noteText.trim() || submitting) return;
		setSubmitting(true);
		await onAddNote(noteText.trim(), "inbox", "info");
		setSubmitting(false);
	};

	const handleSaveToDiary = async () => {
		if (!noteText.trim() || submitting) return;
		setSubmitting(true);
		await onAppendDiary(noteText.trim());
		setSubmitting(false);
	};

	const handleLinkClick = (
		e: React.MouseEvent,
		// biome-ignore lint/suspicious/noExplicitAny: Match existing hook type
		link: any,
	) => {
		if (link.type === "env" && typeof chrome !== "undefined" && chrome.tabs) {
			e.preventDefault();
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const currentTab = tabs[0];
				if (currentTab?.id && currentTab.url) {
					try {
						const currentUrlObj = new URL(currentTab.url);
						const targetOrigin = new URL(link.target_url).origin;
						const newUrl =
							targetOrigin +
							currentUrlObj.pathname +
							currentUrlObj.search +
							currentUrlObj.hash;
						chrome.tabs.update(currentTab.id, { url: newUrl });
					} catch {
						window.open(link.target_url, "_blank");
					}
				}
			});
		}
	};

	// 🔗 Quick Links の「ファビコン vs 数字バッジ」の完全な排他仕様ロジック（!isOpen を排除して常時固定化）
	const showFavicons = links.length > 0 && links.length < 5;
	const showNumberBadge = links.length >= 5;

	return (
		// 最外殻は flex-col の構造とし、全体の高さが間伸びしない防壁とする
		<div
			className={`border-b border-base-border bg-base-bg w-full font-sans flex flex-col min-h-0 ${!currentDomain ? "hidden" : ""}`}
		>
			{/* 【完全不動: shrink-0】 2連独立文字タブヘッダーアラインメント */}
			<div className="flex items-center justify-between p-3 py-2 text-xs font-semibold select-none border-b border-base-border/10 shrink-0">
				{/* 左タブトリガー: Quick Note */}
				<button
					type="button"
					onClick={() => toggleSection("note")}
					className={`cursor-pointer flex items-center gap-1 transition-colors ${activeSection === "note" ? "text-action" : "text-muted-foreground hover:text-action"}`}
				>
					<FileText className="w-3.5 h-3.5" />
					<span>Quick Note</span>
					{activeSection === "note" ? (
						<ChevronDown className="w-3.5 h-3.5" />
					) : (
						<ChevronRight className="w-3.5 h-3.5" />
					)}
				</button>

				{/* 右タブトリガー: Quick Links (!isOpen ガードを解除し、ファビコンを常時維持) */}
				<button
					type="button"
					onClick={() => toggleSection("links")}
					className={`cursor-pointer flex items-center gap-2 transition-colors ${activeSection === "links" ? "text-action" : "text-muted-foreground hover:text-action"}`}
				>
					<div className="flex items-center gap-1">
						<LinkIcon className="w-3.5 h-3.5" />
						<span>Quick Links</span>
						{showNumberBadge && (
							<span className="bg-base-surface text-muted-foreground px-1.5 rounded-full text-[10px] border border-base-border font-mono ml-1">
								{links.length}
							</span>
						)}
					</div>
					<div className="flex items-center gap-1">
						{showFavicons &&
							links
								.filter((l) => l.type === "related")
								.slice(0, 4)
								.map((link) => (
									<img
										key={link.id}
										src={`https://www.google.com/s2/favicons?domain=${new URL(link.target_url).hostname}`}
										alt=""
										className="w-3 h-3 rounded-sm shrink-0"
									/>
								))}
						{activeSection === "links" ? (
							<ChevronDown className="w-3.5 h-3.5" />
						) : (
							<ChevronRight className="w-3.5 h-3.5" />
						)}
					</div>
				</button>
			</div>

			{/* --- Quick Note 展開体 --- */}
			{activeSection === "note" && (
				<div className="px-3 py-2.5 flex flex-col gap-2.5 animate-fadeIn bg-base-bg shrink-0">
					{/* 【完全不動: shrink-0】 コックピット操作バー */}
					<div className="flex justify-between items-center gap-2 shrink-0 border-b border-base-border/30 pb-2">
						<div className="flex items-center gap-1">
							<Button
								disabled={!noteText}
								icon={<CircleX className="size-4" />}
								size="sm"
								variant="ghost"
								onClick={handleClearText}
								title="Clear text"
								className="w-7 h-7 p-0 rounded-full"
							/>
							<Button
								disabled={!noteText}
								icon={
									copied ? (
										<Check className="size-4 text-success" />
									) : (
										<Copy className="size-4" />
									)
								}
								size="sm"
								variant="ghost"
								onClick={handleCopy}
								title="Copy text"
								className="w-7 h-7 p-0 rounded-full"
							/>
						</div>

						{/* 右側: 紙飛行機アイコンを内包した等高カプセルボタン群 */}
						<div className="flex items-center gap-1.5">
							<Button
								disabled={!noteText.trim() || submitting}
								icon={
									submitting ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									) : (
										<Send className="w-3.5 h-3.5" />
									)
								}
								onClick={handleSaveAsNote}
								size="xs"
								variant="outline"
								title="Save as Inbox Note"
								className="text-muted-foreground hover:text-action"
							>
								Note
							</Button>
							<Button
								disabled={!noteText.trim() || submitting}
								icon={
									submitting ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									) : (
										<Send className="w-3.5 h-3.5" />
									)
								}
								onClick={handleSaveToDiary}
								size="xs"
								variant="outline"
								title="Append to Today's Diary"
								className="text-muted-foreground hover:text-action"
							>
								Diary
							</Button>
						</div>
					</div>

					{/* 【中央隔離スクロール領域】 最大高 30vh ガードのインナースクロール壁 */}
					<div className="w-full pt-1 max-h-[30vh] overflow-y-auto scrollbar-none">
						<TextareaAutosize
							onChange={(e) => handleTextChange(e.target.value)}
							onBlur={flushTextStorage}
							value={noteText}
							placeholder="Temporary text scratchpad... (Cross-site session persistent)"
							className="w-full resize-none border-none p-0 text-sm bg-base-bg text-neutral-900 focus:outline-none focus:ring-0 placeholder:text-neutral-400 font-['Hack'] font-mono leading-[1.6] scrollbar-none"
							minRows={3}
							onKeyDown={(e) => {
								if (e.nativeEvent.isComposing) return;
								handleAutoIndent(e);
							}}
						/>
					</div>
				</div>
			)}

			{/* --- Quick Links 展開体 (入力画面のカプセル型アラインへの格上げ刷新) --- */}
			{activeSection === "links" && (
				<div className="pb-3 px-3 animate-fadeIn bg-base-bg overflow-y-auto max-h-[40vh] scrollbar-none shrink-0">
					<div className="space-y-1">
						{loading ? (
							<div className="flex justify-center py-2">
								<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
							</div>
						) : links.length === 0 ? (
							!isAdding && (
								<div className="text-center text-muted-foreground text-xs py-2 italic">
									No links added yet.
								</div>
							)
						) : (
							links.map((link) => {
								const isIncoming = link.domain !== currentDomain;
								return (
									<div
										key={link.id}
										className="group flex items-center justify-between p-1 hover:bg-base-bg rounded-xl transition-colors text-sm"
									>
										<a
											href={link.target_url}
											target={link.type === "related" ? "_blank" : undefined}
											rel={
												link.type === "related"
													? "noopener noreferrer"
													: undefined
											}
											onClick={(e) => handleLinkClick(e, link)}
											className="flex items-center gap-2 flex-1 min-w-0"
											title={link.target_url}
										>
											{link.type === "related" ? (
												<img
													src={`https://www.google.com/s2/favicons?domain=${new URL(link.target_url).hostname}`}
													alt=""
													className="w-4 h-4 rounded-sm shrink-0"
												/>
											) : (
												<ArrowRightLeft className="w-4 h-4 text-action shrink-0" />
											)}
											<span className="truncate text-action">{link.label}</span>
											{link.type === "related" && (
												<ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
											)}
											{link.type === "env" && (
												<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-1 shrink-0 border border-base-border px-1.5 rounded-full bg-base-surface">
													ENV
													{isIncoming && <Lock className="w-3 h-3" />}
												</span>
											)}
										</a>
										{!isIncoming && (
											<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													type="button"
													onClick={() => {
														setEditingLink(link);
														setFormUrl(link.target_url);
														setFormLabel(link.label);
														setFormType(link.type);
														setIsAdding(true);
													}}
													className="cursor-pointer p-1 text-muted-foreground hover:text-action hover:bg-base-surface rounded-full transition-colors"
												>
													<Pencil className="w-3.5 h-3.5" />
												</button>
												<button
													type="button"
													onClick={() => deleteLink(link.id)}
													className="cursor-pointer p-1 text-muted-foreground hover:text-note-alert hover:bg-note-alert/10 rounded-full transition-colors"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										)}
									</div>
								);
							})
						)}

						{/* 🎨 Add Link フォーム全体のデザインを丸みのある現在の設定に完全アライン */}
						{isAdding ? (
							<form
								onSubmit={async (e) => {
									e.preventDefault();
									if (!formUrl.trim() || !formLabel.trim()) return;
									setLinkSubmitting(true);
									if (editingLink) {
										await updateLink(editingLink.id, {
											label: formLabel,
											target_url: formUrl,
											type: formType,
										});
									} else {
										await addLink({
											label: formLabel,
											target_url: formUrl,
											type: formType,
										});
									}
									setIsAdding(false);
									setEditingLink(null);
									setFormUrl("");
									setFormLabel("");
									setLinkSubmitting(false);
								}}
								className="mt-2 text-xs border border-base-border rounded-2xl p-3 bg-base-bg flex flex-col gap-2.5 shadow-2xs"
							>
								<input
									// biome-ignore lint/a11y/noAutofocus: intentional UX
									autoFocus
									type="text"
									required
									placeholder="URL"
									value={formUrl}
									onChange={(e) => setFormUrl(e.target.value)}
									className="w-full p-2 px-3.5 border border-base-border rounded-full bg-base-surface text-action text-xs focus:outline-none focus:ring-1 focus:ring-action/30 placeholder:text-neutral-400"
								/>
								<input
									type="text"
									required
									placeholder="Label"
									value={formLabel}
									onChange={(e) => setFormLabel(e.target.value)}
									className="w-full p-2 px-3.5 border border-base-border rounded-full bg-base-surface text-action text-xs focus:outline-none focus:ring-1 focus:ring-action/30 placeholder:text-neutral-400"
								/>
								<div className="flex gap-3 px-1 text-muted-foreground">
									<label className="flex items-center gap-1.5 cursor-pointer select-none">
										<input
											type="radio"
											checked={formType === "related"}
											onChange={() => setFormType("related")}
											className="accent-action"
										/>
										<span>Related</span>
									</label>
									<label className="flex items-center gap-1.5 cursor-pointer select-none">
										<input
											type="radio"
											checked={formType === "env"}
											onChange={() => setFormType("env")}
											className="accent-action"
										/>
										<span>Env Switch</span>
									</label>
								</div>
								<div className="flex justify-end gap-1.5 pt-1.5 border-t border-base-border/30">
									<Button
										icon={<X className="w-3.5 h-3.5" />}
										size="xs"
										variant="ghost"
										onClick={() => {
											setIsAdding(false);
											setEditingLink(null);
										}}
									>
										Cancel
									</Button>
									<Button
										disabled={linkSubmitting}
										icon={
											linkSubmitting ? (
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
											) : (
												<Check className="w-3.5 h-3.5" />
											)
										}
										size="xs"
										variant="default"
										type="submit"
									>
										{editingLink ? "Update" : "Add"}
									</Button>
								</div>
							</form>
						) : (
							<button
								type="button"
								onClick={() => {
									setEditingLink(null);
									setFormUrl("");
									setFormLabel("");
									setFormType("related");
									setIsAdding(true);
								}}
								className="cursor-pointer w-full text-left p-2 px-3 text-xs text-muted-foreground hover:text-action hover:bg-base-bg rounded-full flex items-center gap-1 transition-colors border border-dashed border-base-border/40 mt-1"
							>
								<Plus className="w-3.5 h-3.5" />
								<span>Add Link</span>
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
