import type { Note, ViewScope as NoteScope } from "@sitecue/shared";
import {
	calculateOrderForDirection,
	createNoteEntity,
	deleteNoteEntity,
	fetchExtensionNoteContents,
	fetchExtensionNoteMetadatas,
	getScopeUrls,
	resolveNotePayload,
	updateNoteEntity,
} from "@sitecue/shared";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";

export type NoteType = Note["note_type"];
export type { Note, NoteScope };

export function useNotes(
	session: Session | null,
	currentFullUrl: string,
	setTotalNoteCount: React.Dispatch<React.SetStateAction<number>>,
	viewScope: "exact" | "domain" | "inbox",
) {
	const [notes, setNotes] = useState<Note[]>([]);
	const [loading, setLoading] = useState(false);
	const [processingNoteIds, setProcessingNoteIds] = useState<Set<string>>(
		new Set(),
	);

	// ソート条件式の共通化ヘルパー（DB側 order("sort_order").order("created_at") と100%同期）
	const sortNotesConsistent = (a: Note, b: Note) => {
		if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) {
			return (a.sort_order ?? 0) - (b.sort_order ?? 0);
		}
		return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
	};

	const prevUrlRef = useRef<string>(currentFullUrl);

	// 危険な notesRef を排除し、「初回フェッチが完了したか」だけを追跡する安全なフラグを導入
	const hasInitialFetchRef = useRef(false);

	const hydrateContent = useCallback(async () => {
		if (!currentFullUrl || !session) return;
		try {
			const scopeUrls = getScopeUrls(currentFullUrl);
			const data = await fetchExtensionNoteContents(supabase, scopeUrls);

			if (data) {
				setNotes((prevNotes) =>
					prevNotes.map((note) => {
						const hydrated = data.find((d) => d.id === note.id);
						return hydrated ? { ...note, content: hydrated.content } : note;
					}),
				);
			}
		} catch (error) {
			console.error("Failed to hydrate notes", error);
		}
	}, [currentFullUrl, session]);

	const fetchNotes = useCallback(async () => {
		if (!currentFullUrl || !session) return;

		// Inbox閲覧中、かつ「URLのみ」が変化した場合は再フェッチをスキップしてちらつきを防止
		if (viewScope === "inbox" && prevUrlRef.current !== currentFullUrl) {
			prevUrlRef.current = currentFullUrl;
			return;
		}
		prevUrlRef.current = currentFullUrl;

		// 初回のフェッチ時のみローディングUIを発動する（それ以降のURL変更時は裏側で静かにフェッチする）
		if (!hasInitialFetchRef.current) {
			setLoading(true);
		}

		try {
			const scopeUrls = getScopeUrls(currentFullUrl);
			const data = await fetchExtensionNoteMetadatas(supabase, scopeUrls);

			// 既存の content（入力中のテキスト等）をマージして保護する
			setNotes((prevNotes) => {
				return (data || []).map((newNote) => {
					const existing = prevNotes.find((n) => n.id === newNote.id);
					return existing?.content
						? ({ ...newNote, content: existing.content } as Note)
						: (newNote as Note);
				});
			});

			// Fetch full content in background
			hydrateContent();
		} catch (error) {
			console.error("Failed to fetch notes", error);
		} finally {
			// フェッチ完了後、初回フラグを true にして以降の setLoading(true) をブロックする
			hasInitialFetchRef.current = true;
			setLoading(false);
		}
	}, [currentFullUrl, session, hydrateContent, viewScope]);

	useEffect(() => {
		fetchNotes();
	}, [fetchNotes]);

	const addNote = async (
		content: string,
		selectedScope: NoteScope,
		selectedType: NoteType,
	) => {
		if (!session?.user?.id || !content.trim()) return false;

		// 楽観的UI用の一時データ作成のために純粋な解決ロジックを利用
		const resolved = resolveNotePayload({
			content,
			note_type: selectedType,
			scope: selectedScope,
			currentUrl: currentFullUrl,
		});

		const newSortOrder =
			notes.length > 0
				? Math.max(...notes.map((n) => n.sort_order || 0)) + 1
				: 0;

		const tempId = crypto.randomUUID();
		const tempNote = {
			id: tempId,
			user_id: session.user.id,
			url_pattern: resolved.url_pattern,
			content: resolved.content,
			scope: resolved.scope,
			note_type: resolved.note_type,
			sort_order: newSortOrder,
			created_at: new Date().toISOString(),
			is_expanded: false,
			is_favorite: false,
			is_pinned: false,
			is_resolved: false,
			tags: resolved.tags,
		} as Note;

		// UI（ステート）には全スコープ追加する
		setNotes((prev) => [...prev, tempNote]);

		try {
			// 新設したDALを呼び出し
			const data = await createNoteEntity(supabase, session.user.id, {
				content,
				note_type: selectedType,
				scope: selectedScope,
				currentUrl: currentFullUrl,
			});

			// 確定したDBのデータでローカルステートを上書き
			setNotes((prev) => prev.map((n) => (n.id === tempId ? data : n)));

			if (selectedScope === "inbox") {
				toast.success("Saved to Inbox");
			} else {
				setTotalNoteCount((prev) => prev + 1);
				chrome.runtime.sendMessage({ type: "REFRESH_BADGE" });
			}

			return true;
		} catch (error) {
			console.error("Failed to create note", error);
			setNotes((prev) => prev.filter((n) => n.id !== tempId));
			toast.error("Failed to create note");
			return false;
		}
	};

	const updateNote = async (
		id: string,
		editContent: string,
		editType: NoteType,
		editScope?: NoteScope,
	) => {
		if (!editContent.trim()) return false;
		try {
			const data = await updateNoteEntity(supabase, id, {
				content: editContent,
				note_type: editType,
				scope: editScope,
				currentUrl: currentFullUrl,
			});

			setNotes((prevNotes) => prevNotes.map((n) => (n.id === id ? data : n)));
			chrome.runtime.sendMessage({ type: "REFRESH_BADGE" });
			return true;
		} catch (error) {
			console.error("Failed to update note", error);
			toast.error("Failed to update note");
			return false;
		}
	};

	const deleteNote = async (id: string) => {
		if (!window.confirm("このメモを削除しますか？")) return false;

		const noteToDelete = notes.find((n) => n.id === id);

		try {
			await deleteNoteEntity(supabase, id);

			setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));

			if (noteToDelete?.scope !== "inbox") {
				setTotalNoteCount((prev) => Math.max(0, prev - 1));
				chrome.runtime.sendMessage({ type: "REFRESH_BADGE" });
			}

			return true;
		} catch (error) {
			console.error("Failed to delete note", error);
			toast.error("Failed to delete note");
			return false;
		}
	};

	const toggleResolved = async (
		id: string,
		currentStatus: boolean | undefined,
	) => {
		const nextStatus = !currentStatus;
		try {
			await updateNoteEntity(supabase, id, { is_resolved: nextStatus });

			setNotes((prevNotes) =>
				prevNotes.map((n) =>
					n.id === id ? { ...n, is_resolved: nextStatus } : n,
				),
			);
			chrome.runtime.sendMessage({ type: "REFRESH_BADGE" });
			return true;
		} catch (error) {
			console.error("Failed to toggle resolved status", error);
			toast.error("Failed to update status");
			return false;
		}
	};

	const toggleFavorite = async (note: Note) => {
		const nextStatus = !note.is_favorite;

		// ⚡️ 楽観的UI更新 (オプティミスティック更新): DB通信の前にUIステートを即時反映
		setNotes((prevNotes) =>
			prevNotes.map((n) =>
				n.id === note.id ? { ...n, is_favorite: nextStatus } : n,
			),
		);

		try {
			await updateNoteEntity(supabase, note.id, { is_favorite: nextStatus });
			return true;
		} catch (error) {
			console.error("Failed to toggle favorite status", error);

			// 🛡️ エラー時のロールバック: 通信失敗時はサイレントに元のステートへ戻す
			setNotes((prevNotes) =>
				prevNotes.map((n) =>
					n.id === note.id ? { ...n, is_favorite: note.is_favorite } : n,
				),
			);

			toast.error("Failed to update status");
			return false;
		}
	};

	const togglePinned = async (note: Note) => {
		const nextStatus = !note.is_pinned;
		try {
			await updateNoteEntity(supabase, note.id, { is_pinned: nextStatus });

			setNotes((prevNotes) =>
				prevNotes.map((n) =>
					n.id === note.id ? { ...n, is_pinned: nextStatus } : n,
				),
			);
			return true;
		} catch (error) {
			console.error("Failed to toggle pinned status", error);
			toast.error("Failed to update status");
			return false;
		}
	};

	const updateNoteOrder = async (
		id: string,
		direction: "up" | "down",
		currentVisibleNotes: Note[],
	) => {
		// 二重防壁ロック: すでに処理中なら即座にガードブロック
		if (processingNoteIds.has(id)) return false;

		const targetNote = notes.find((n) => n.id === id);
		if (!targetNote) return false;

		// ソフトウェアロック of 有効化
		setProcessingNoteIds((prev) => {
			const next = new Set(prev);
			next.add(id);
			return next;
		});

		// 画面上に実際に見えているノート配列（フィルター適用後）から、同じ表示グループ（Favorite / Pinned / Normal）を抽出
		const filtered = currentVisibleNotes.filter((n) => {
			if (targetNote.is_favorite) return n.is_favorite;
			return !n.is_favorite && n.is_pinned === targetNote.is_pinned;
		});

		// 一貫性あるソート関数を適用
		const group = [...filtered].sort(sortNotesConsistent);

		// 純粋関数により最適なオーダー値を一意に取得（画面外のノートはOFFSETガードですり抜ける）
		const newSortOrder = calculateOrderForDirection(group, id, direction);
		if (newSortOrder === null) {
			setProcessingNoteIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
			return false;
		}

		// 0msレスポンスのインメモリ楽観的UI更新
		setNotes((prevNotes) => {
			const newNotes = prevNotes.map((n) =>
				n.id === id ? { ...n, sort_order: newSortOrder } : n,
			);
			return newNotes.sort(sortNotesConsistent);
		});

		try {
			await updateNoteEntity(supabase, id, { sort_order: newSortOrder });
			return true;
		} catch (error) {
			console.error("Failed to update note order", error);
			toast.error("Failed to reorder notes");
			fetchNotes(); // ロールバック
			return false;
		} finally {
			// ソフトウェアロックの解除
			setProcessingNoteIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		}
	};

	const toggleNoteExpansion = async (id: string, currentValue: boolean) => {
		const nextValue = !currentValue;
		// Optimistic update
		setNotes((prevNotes) =>
			prevNotes.map((n) =>
				n.id === id ? { ...n, is_expanded: nextValue } : n,
			),
		);
		try {
			await updateNoteEntity(supabase, id, { is_expanded: nextValue });
			return true;
		} catch (error) {
			console.error("Failed to toggle expansion", error);
			// Revert on error
			setNotes((prevNotes) =>
				prevNotes.map((n) =>
					n.id === id ? { ...n, is_expanded: currentValue } : n,
				),
			);
			toast.error("Failed to update note");
			return false;
		}
	};

	return {
		notes,
		loading,
		fetchNotes,
		addNote,
		updateNote,
		deleteNote,
		toggleResolved,
		toggleFavorite,
		togglePinned,
		updateNoteOrder,
		toggleNoteExpansion,
	};
}
