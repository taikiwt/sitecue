import type { Note, ViewScope as NoteScope } from "@sitecue/shared";
import {
	calculateOrderForDirection,
	createNoteEntity,
	extractTags,
	getScopeUrls,
	resolveNotePayload,
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
	const prevUrlRef = useRef<string>(currentFullUrl);

	const hydrateContent = useCallback(async () => {
		if (!currentFullUrl || !session) return;
		try {
			const scopeUrls = getScopeUrls(currentFullUrl);
			const { data, error } = await supabase
				.from("sitecue_notes")
				.select("id, content")
				.or(
					`and(url_pattern.eq."${scopeUrls.domain}",scope.eq.domain),and(url_pattern.eq."${scopeUrls.exact}",scope.eq.exact),scope.eq.inbox,is_favorite.eq.true`,
				);

			if (error) throw error;
			if (data) {
				setNotes((prevNotes) =>
					prevNotes.map((note) => {
						const hydrated = (data as { id: string; content: string }[]).find(
							(d) => d.id === note.id,
						);
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

		setLoading(true);
		try {
			const scopeUrls = getScopeUrls(currentFullUrl);

			const { data, error } = await supabase
				.from("sitecue_notes")
				.select(
					"id, user_id, url_pattern, scope, note_type, sort_order, created_at, is_expanded, is_favorite, is_pinned, is_resolved, tags",
				)
				.or(
					`and(url_pattern.eq."${scopeUrls.domain}",scope.eq.domain),and(url_pattern.eq."${scopeUrls.exact}",scope.eq.exact),scope.eq.inbox,is_favorite.eq.true`,
				)
				.order("sort_order", { ascending: true })
				.order("created_at", { ascending: true });

			if (error) throw error;
			setNotes((data as Note[]) || []);
			// Fetch full content in background
			hydrateContent();
		} catch (error) {
			console.error("Failed to fetch notes", error);
		} finally {
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
			const currentNote = notes.find((n) => n.id === id);
			let targetUrlPattern: string | undefined;
			const updatePayload: {
				content: string;
				note_type: NoteType;
				scope?: NoteScope;
				url_pattern?: string;
				tags?: string[];
			} = {
				content: editContent,
				note_type: editType,
				tags: extractTags(editContent),
			};

			if (editScope && editScope !== currentNote?.scope) {
				updatePayload.scope = editScope;
				const scopeUrls = getScopeUrls(currentFullUrl);
				targetUrlPattern =
					editScope === "domain"
						? scopeUrls.domain
						: editScope === "exact"
							? scopeUrls.exact
							: "inbox";
				updatePayload.url_pattern = targetUrlPattern;
			}

			const { error } = await supabase
				.from("sitecue_notes")
				.update(updatePayload)
				.eq("id", id);

			if (error) throw error;

			setNotes((prevNotes) =>
				prevNotes.map((n) => (n.id === id ? { ...n, ...updatePayload } : n)),
			);
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

		// ★修正点: 削除前に、対象のメモがinboxかどうかを特定しておく
		const noteToDelete = notes.find((n) => n.id === id);

		try {
			const { error } = await supabase
				.from("sitecue_notes")
				.delete()
				.eq("id", id);

			if (error) throw error;

			setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));

			// ★修正点: inboxのメモを削除した時は、バッジカウントを減らさない
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
			const { error } = await supabase
				.from("sitecue_notes")
				.update({ is_resolved: nextStatus })
				.eq("id", id);

			if (error) throw error;

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
			const { error } = await supabase
				.from("sitecue_notes")
				.update({ is_favorite: nextStatus })
				.eq("id", note.id);

			if (error) throw error;
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
			const { error } = await supabase
				.from("sitecue_notes")
				.update({ is_pinned: nextStatus })
				.eq("id", note.id);

			if (error) throw error;

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

	const updateNoteOrder = async (id: string, direction: "up" | "down") => {
		const targetNote = notes.find((n) => n.id === id);
		if (!targetNote) return false;

		// NoteList.tsx の表示グループ（Favorites / Page / Pinned）に準拠してソート対象を抽出
		const filtered = notes.filter((n) => {
			if (targetNote.is_favorite) return n.is_favorite;
			return !n.is_favorite && n.is_pinned === targetNote.is_pinned;
		});

		const group = [...filtered].sort(
			(a, b) =>
				(a.sort_order || 0) - (b.sort_order || 0) ||
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
		);

		// 純粋関数により最適なオーダー値を一意に取得
		const newSortOrder = calculateOrderForDirection(group, id, direction);
		if (newSortOrder === null) return false;

		// Optimistic UI Update
		setNotes((prevNotes) => {
			const newNotes = prevNotes.map((n) =>
				n.id === id ? { ...n, sort_order: newSortOrder } : n,
			);
			newNotes.sort(
				(a, b) =>
					(a.sort_order || 0) - (b.sort_order || 0) ||
					new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
			);
			return newNotes;
		});

		try {
			const { error } = await supabase
				.from("sitecue_notes")
				.update({ sort_order: newSortOrder })
				.eq("id", id);
			if (error) throw error;
			return true;
		} catch (error) {
			console.error("Failed to update note order", error);
			toast.error("Failed to reorder notes");
			fetchNotes(); // エラー時は確実なロールバック
			return false;
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
			const { error } = await supabase
				.from("sitecue_notes")
				.update({ is_expanded: nextValue })
				.eq("id", id);
			if (error) throw error;
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
