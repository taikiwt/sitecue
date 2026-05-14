import type { SupabaseClient } from "@supabase/supabase-js";
import type { Note, NoteMetadata } from "../types/app";
import { type CreateNoteInput, resolveNotePayload } from "../utils/notes";
import { extractTags } from "../utils/tags";
import { normalizeUrl } from "../utils/url";

/**
 * ノート一覧のメタデータを取得する (Slim Fetching)
 */
export async function fetchNoteMetadatas(
	supabase: SupabaseClient,
	userId: string,
): Promise<NoteMetadata[]> {
	const { data, error } = await supabase
		.from("sitecue_notes")
		.select(
			"id, user_id, url_pattern, scope, note_type, is_pinned, is_resolved, is_favorite, is_expanded, sort_order, created_at, updated_at, draft_id, tags",
		)
		.eq("user_id", userId)
		.order("is_pinned", { ascending: false })
		.order("sort_order", { ascending: true })
		.order("created_at", { ascending: false });

	if (error) throw error;
	return (data as NoteMetadata[]) || [];
}

/**
 * ノートを作成する
 */
export async function createNoteEntity(
	supabase: SupabaseClient,
	userId: string,
	input: CreateNoteInput,
): Promise<Note> {
	const payload = resolveNotePayload(input);

	const { data: existingNotes, error: fetchError } = await supabase
		.from("sitecue_notes")
		.select("sort_order")
		.eq("user_id", userId)
		.eq("scope", payload.scope)
		.order("sort_order", { ascending: false })
		.limit(1);

	if (fetchError) throw fetchError;

	const maxSortOrder =
		existingNotes && existingNotes.length > 0
			? existingNotes[0].sort_order
			: -1;
	const newSortOrder = maxSortOrder + 1.0;

	const insertData = {
		user_id: userId,
		url_pattern: payload.url_pattern,
		content: payload.content,
		scope: payload.scope,
		note_type: payload.note_type,
		tags: payload.tags,
		sort_order: newSortOrder,
		is_expanded: false,
		is_favorite: false,
		is_pinned: false,
		is_resolved: false,
	};

	const { data, error } = await supabase
		.from("sitecue_notes")
		.insert(insertData)
		.select()
		.single();

	if (error) throw error;
	return data as Note;
}

/**
 * ノートを更新する
 */
export async function updateNoteEntity(
	supabase: SupabaseClient,
	id: string,
	updates: {
		content?: string;
		note_type?: Note["note_type"];
		scope?: Note["scope"];
		currentUrl?: string;
		is_resolved?: boolean;
		is_pinned?: boolean;
		is_favorite?: boolean;
		is_expanded?: boolean;
	},
): Promise<Note> {
	const updatePayload: Record<string, unknown> = {};

	if (updates.content !== undefined) {
		const trimmed = updates.content.trim();
		updatePayload.content = trimmed;
		updatePayload.tags = extractTags(trimmed);
	}

	if (updates.note_type !== undefined) {
		updatePayload.note_type = updates.note_type;
	}

	if (updates.scope !== undefined) {
		updatePayload.scope = updates.scope;
		if (updates.scope === "inbox" || updates.scope === "draft") {
			updatePayload.url_pattern = updates.scope;
		} else if (updates.currentUrl) {
			updatePayload.url_pattern = normalizeUrl(
				updates.currentUrl,
				updates.scope,
			);
		}
	}

	if (updates.is_resolved !== undefined)
		updatePayload.is_resolved = updates.is_resolved;
	if (updates.is_pinned !== undefined)
		updatePayload.is_pinned = updates.is_pinned;
	if (updates.is_favorite !== undefined)
		updatePayload.is_favorite = updates.is_favorite;
	if (updates.is_expanded !== undefined)
		updatePayload.is_expanded = updates.is_expanded;

	const { data, error } = await supabase
		.from("sitecue_notes")
		.update(updatePayload)
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	return data as Note;
}

/**
 * ノート本文をまとめて取得する (Hydration用)
 */
export async function fetchNoteContents(
	supabase: SupabaseClient,
	ids: string[],
): Promise<{ id: string; content: string }[]> {
	if (ids.length === 0) return [];
	const { data, error } = await supabase
		.from("sitecue_notes")
		.select("id, content")
		.in("id", ids);

	if (error) throw error;
	return data || [];
}

/**
 * バッジ表示用の未解決ノートカウントを取得する
 */
export async function getMatchingNoteCount(
	supabase: SupabaseClient,
	domain: string,
	exact: string,
): Promise<number> {
	const { count, error } = await supabase
		.rpc(
			"get_matching_notes",
			{ p_domain: domain, p_exact: exact },
			{ count: "exact", head: true },
		)
		.eq("is_resolved", false);

	if (error) throw error;
	return count || 0;
}
