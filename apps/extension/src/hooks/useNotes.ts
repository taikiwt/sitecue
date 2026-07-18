import type { Note, ViewScope as NoteScope } from "@sitecue/shared";
import {
	createNoteEntity,
	deleteNoteEntity,
	fetchExtensionNoteContents,
	fetchExtensionNoteMetadatas,
	getScopeUrls,
	resolveNotePayload,
	updateNoteEntity,
} from "@sitecue/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { localClient, supabase } from "../supabaseClient";
import type { AuthStatus } from "./useAuth";

export type NoteType = Note["note_type"];
export type { Note, NoteScope };

export function useNotes(
	authStatus: AuthStatus,
	currentFullUrl: string,
	setTotalNoteCount: React.Dispatch<React.SetStateAction<number>>,
	_viewScope: "exact" | "domain" | "inbox",
) {
	const [notes, setNotes] = useState<Note[]>([]);
	const [loading, setLoading] = useState(false);
	const [processingNoteIds, setProcessingNoteIds] = useState<Set<string>>(
		new Set(),
	);

	const session =
		authStatus.mode === "authenticated" ? authStatus.session : null;
	const client = authStatus.mode === "guest" ? localClient : supabase;

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
		if (!currentFullUrl || authStatus.mode === "loading") return;
		try {
			const scopeUrls = getScopeUrls(currentFullUrl);
			const data = await fetchExtensionNoteContents(
				client as unknown as typeof supabase,
				scopeUrls,
			);

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
	}, [currentFullUrl, authStatus.mode, client]);

	const fetchNotes = useCallback(async () => {
		if (!currentFullUrl || authStatus.mode === "loading") return;

		prevUrlRef.current = currentFullUrl;

		// 初回のフェッチ時のみローディングUIを発動する（それ以降のURL変更時は裏側で静かにフェッチする）
		// ゲストモード時は通信オーバーヘッドがないため、loadingスピナーを完全にバイパス
		if (authStatus.mode !== "guest" && !hasInitialFetchRef.current) {
			setLoading(true);
		}

		try {
			const scopeUrls = getScopeUrls(currentFullUrl);
			const data = await fetchExtensionNoteMetadatas(
				client as unknown as typeof supabase,
				scopeUrls,
			);

			// 既存 of content（入力中のテキスト等）をマージして保護する
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
			// フェッチ完了後、初回フラグを true にして以降 of setLoading(true) をブロックする
			hasInitialFetchRef.current = true;
			setLoading(false);
		}
	}, [currentFullUrl, authStatus.mode, hydrateContent, client]);

	useEffect(() => {
		fetchNotes();
	}, [fetchNotes]);

	const addNote = async (
		content: string,
		selectedScope: NoteScope,
		selectedType: NoteType,
	) => {
		if (authStatus.mode === "loading" || !content.trim()) return false;

		// ゲストモード時の50件制限
		if (
			authStatus.mode === "guest" &&
			notes.filter((n) => n.scope !== "inbox").length >= 50
		) {
			toast.error(
				"Note storage limit reached (Max 50 notes). Please sign in for unlimited cloud sync.",
			);
			return false;
		}

		const currentUserId =
			authStatus.mode === "guest" ? "guest-user" : session?.user?.id;
		if (!currentUserId) return false;

		const resolved = resolveNotePayload({
			content,
			note_type: selectedType,
			scope: selectedScope,
			currentUrl: currentFullUrl,
		});

		// 💡 【ワープ現象の完全封殺】昇順ソートに対応し、仮ノートも最初から「最上部（最小値 - 1.0）」に差し込む
		const newSortOrder =
			notes.length > 0
				? Math.min(...notes.map((n) => n.sort_order || 0)) - 1.0
				: 0.0;

		const tempId = crypto.randomUUID();
		const tempNote = {
			id: tempId,
			user_id: currentUserId,
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

		// 楽観的に仮ノートを即時マウント（ガタつかず最上部に綺麗に固定されます）
		setNotes((prev) => [...prev, tempNote].sort(sortNotesConsistent));

		try {
			let data: Note;
			if (authStatus.mode === "guest") {
				// 💡 【ゲストモードDALクラッシュ回避】localClient のメソッドチェーン崩壊を防ぐため、DALをバイパス
				const guestClient = client as unknown as typeof localClient;
				if (typeof guestClient.from === "function") {
					try {
						await (guestClient
							.from("sitecue_notes")
							.insert(tempNote) as unknown as Promise<unknown>);
					} catch (e) {
						console.warn("localClient insertion fell back", e);
					}
				}
				data = tempNote; // 確定データとして tempNote をそのまま昇格
			} else {
				// ログインモード時は従来通り完璧なSupabase共通DALを安全に実行
				data = await createNoteEntity(
					client as unknown as typeof supabase,
					currentUserId,
					{
						content,
						note_type: selectedType,
						scope: selectedScope,
						currentUrl: currentFullUrl,
					},
				);
			}

			// 確定データで上書き
			setNotes((prev) =>
				prev.map((n) => (n.id === tempId ? data : n)).sort(sortNotesConsistent),
			);

			if (selectedScope !== "inbox") {
				setTotalNoteCount((prev) => prev + 1);
			}
			chrome.runtime.sendMessage({ type: "REFRESH_BADGE" });

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
			let data: Note;
			if (authStatus.mode === "guest") {
				const existingNote = notes.find((n) => n.id === id);
				if (!existingNote) return false;

				const resolved = resolveNotePayload({
					content: editContent,
					note_type: editType,
					scope: editScope ?? existingNote.scope,
					currentUrl: currentFullUrl,
				});

				const updatedNote = {
					...existingNote,
					content: editContent,
					note_type: editType,
					scope: editScope ?? existingNote.scope,
					url_pattern: resolved.url_pattern,
					tags: resolved.tags,
					updated_at: new Date().toISOString(),
				} as Note;

				const guestClient = client as unknown as typeof localClient;
				if (typeof guestClient.from === "function") {
					try {
						await (guestClient
							.from("sitecue_notes")
							.update(updatedNote)
							.eq("id", id) as unknown as Promise<unknown>);
					} catch (e) {
						console.warn("localClient update fell back", e);
					}
				}
				data = updatedNote;
			} else {
				data = await updateNoteEntity(
					client as unknown as typeof supabase,
					id,
					{
						content: editContent,
						note_type: editType,
						scope: editScope,
						currentUrl: currentFullUrl,
					},
				);
			}

			setNotes((prevNotes) => prevNotes.map((n) => (n.id === id ? data : n)));
			chrome.runtime.sendMessage({ type: "REFRESH_BADGE" });
			return true;
		} catch (error: unknown) {
			console.error("Failed to update note", error);

			let errorMsg = "Failed to update note";
			if (typeof error === "object" && error !== null && "message" in error) {
				const msg = String((error as { message: unknown }).message);
				if (
					msg.includes("sitecue_notes_content_len_check") ||
					msg.includes("length") ||
					msg.includes("limit")
				) {
					errorMsg =
						"Failed to save: Content exceeds the 10,000 character limit.";
				}
			}
			toast.error(errorMsg);
			return false;
		}
	};

	const deleteNote = async (id: string) => {
		if (!window.confirm("このメモを削除しますか？")) return false;

		const noteToDelete = notes.find((n) => n.id === id);

		try {
			await deleteNoteEntity(client as unknown as typeof supabase, id);

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
			if (authStatus.mode === "guest") {
				const guestClient = client as unknown as typeof localClient;
				if (typeof guestClient.from === "function") {
					try {
						await (guestClient
							.from("sitecue_notes")
							.update({ is_resolved: nextStatus })
							.eq("id", id) as unknown as Promise<unknown>);
					} catch (e) {
						console.warn("localClient toggleResolved fell back", e);
					}
				}
			} else {
				await updateNoteEntity(client as unknown as typeof supabase, id, {
					is_resolved: nextStatus,
				});
			}

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

		// 楽観的UI更新
		setNotes((prevNotes) =>
			prevNotes.map((n) =>
				n.id === note.id ? { ...n, is_favorite: nextStatus } : n,
			),
		);

		try {
			if (authStatus.mode === "guest") {
				const guestClient = client as unknown as typeof localClient;
				if (typeof guestClient.from === "function") {
					try {
						await (guestClient
							.from("sitecue_notes")
							.update({ is_favorite: nextStatus })
							.eq("id", note.id) as unknown as Promise<unknown>);
					} catch (e) {
						console.warn("localClient toggleFavorite fell back", e);
					}
				}
			} else {
				await updateNoteEntity(client as unknown as typeof supabase, note.id, {
					is_favorite: nextStatus,
				});
			}
			return true;
		} catch (error) {
			console.error("Failed to toggle favorite status", error);
			// ロールバック
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
			if (authStatus.mode === "guest") {
				const guestClient = client as unknown as typeof localClient;
				if (typeof guestClient.from === "function") {
					try {
						await (guestClient
							.from("sitecue_notes")
							.update({ is_pinned: nextStatus })
							.eq("id", note.id) as unknown as Promise<unknown>);
					} catch (e) {
						console.warn("localClient togglePinned fell back", e);
					}
				}
			} else {
				await updateNoteEntity(client as unknown as typeof supabase, note.id, {
					is_pinned: nextStatus,
				});
			}

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

	const updateNoteOrder = async (id: string, newOrder: number) => {
		if (processingNoteIds.has(id)) return false;

		setProcessingNoteIds((prev) => {
			const next = new Set(prev);
			next.add(id);
			return next;
		});

		setNotes((prevNotes) => {
			const newNotes = prevNotes.map((n) =>
				n.id === id ? { ...n, sort_order: newOrder } : n,
			);
			return newNotes.sort(sortNotesConsistent);
		});

		try {
			if (authStatus.mode === "guest") {
				const guestClient = client as unknown as typeof localClient;
				if (typeof guestClient.from === "function") {
					try {
						await (guestClient
							.from("sitecue_notes")
							.update({ sort_order: newOrder })
							.eq("id", id) as unknown as Promise<unknown>);
					} catch (e) {
						console.warn("localClient updateNoteOrder fell back", e);
					}
				}
			} else {
				await updateNoteEntity(client as unknown as typeof supabase, id, {
					sort_order: newOrder,
				});
			}
			return true;
		} catch (error) {
			console.error("Failed to update note order", error);
			toast.error("Failed to reorder notes");
			fetchNotes(); // ロールバック
			return false;
		} finally {
			setProcessingNoteIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		}
	};

	const toggleNoteExpansion = async (id: string, currentValue: boolean) => {
		const nextValue = !currentValue;
		setNotes((prevNotes) =>
			prevNotes.map((n) =>
				n.id === id ? { ...n, is_expanded: nextValue } : n,
			),
		);
		try {
			if (authStatus.mode === "guest") {
				const guestClient = client as unknown as typeof localClient;
				if (typeof guestClient.from === "function") {
					try {
						await (guestClient
							.from("sitecue_notes")
							.update({ is_expanded: nextValue })
							.eq("id", id) as unknown as Promise<unknown>);
					} catch (e) {
						console.warn("localClient toggleNoteExpansion fell back", e);
					}
				}
			} else {
				await updateNoteEntity(client as unknown as typeof supabase, id, {
					is_expanded: nextValue,
				});
			}
			return true;
		} catch (error) {
			console.error("Failed to toggle expansion", error);
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
