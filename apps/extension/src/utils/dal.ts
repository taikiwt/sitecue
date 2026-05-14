import {
	type CreateNoteInput,
	type Note,
	resolveNotePayload,
} from "@sitecue/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function createNoteEntity(
	supabase: SupabaseClient,
	userId: string,
	input: CreateNoteInput,
): Promise<Note> {
	const payload = resolveNotePayload(input);

	// 対象スコープにおける最大の sort_order を取得
	const { data: existingNotes, error: fetchError } = await supabase
		.from("sitecue_notes")
		.select("sort_order")
		.eq("user_id", userId)
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

	if (error) {
		throw error;
	}

	return data as Note;
}
