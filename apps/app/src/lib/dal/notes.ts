import {
	type CreateNoteInput,
	type Note,
	resolveNotePayload,
} from "@sitecue/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function createNoteEntity(
	supabase: SupabaseClient,
	input: CreateNoteInput,
): Promise<Note> {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("User not authenticated");
	}

	const payload = resolveNotePayload(input);

	// 対象スコープにおける最大の sort_order を取得して末尾に追加する設計
	const { data: existingNotes, error: fetchError } = await supabase
		.from("sitecue_notes")
		.select("sort_order")
		.eq("user_id", user.id)
		.eq("scope", payload.scope)
		.order("sort_order", { ascending: false })
		.limit(1);

	if (fetchError) {
		throw fetchError;
	}

	const maxSortOrder =
		existingNotes && existingNotes.length > 0
			? existingNotes[0].sort_order
			: -1;
	const newSortOrder = maxSortOrder + 1.0;

	const insertData = {
		user_id: user.id,
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

	if (error) {
		throw error;
	}

	return data as Note;
}

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
		// content が変更された場合はタグを再抽出
		const { extractTags } = await import("@sitecue/shared");
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
			const { normalizeUrl } = await import("@sitecue/shared");
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

	if (error) {
		throw error;
	}

	return data as Note;
}
