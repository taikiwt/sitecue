import type { SupabaseClient } from "@supabase/supabase-js";
import type { Draft } from "../types/app";

export async function fetchDraftsList(
	supabase: SupabaseClient,
	userId: string,
): Promise<Draft[]> {
	const { data, error } = await supabase
		.from("sitecue_drafts")
		.select("*")
		.eq("user_id", userId)
		.is("deleted_at", null)
		.order("updated_at", { ascending: false });

	if (error) throw error;
	return (data as Draft[]) || [];
}

export async function fetchDraftById(
	supabase: SupabaseClient,
	id: string,
): Promise<Draft | undefined> {
	const { data, error } = await supabase
		.from("sitecue_drafts")
		.select("*, sitecue_templates(*)")
		.eq("id", id)
		.is("deleted_at", null)
		.maybeSingle();

	if (error) throw error;
	if (!data) return undefined;

	return {
		...data,
		metadata: data.metadata as Draft["metadata"],
		sitecue_templates:
			data.sitecue_templates as unknown as Draft["sitecue_templates"],
	} as Draft;
}

export async function createDraftEntity(
	supabase: SupabaseClient,
	userId: string,
	newDraft: Partial<Draft>,
): Promise<Draft> {
	const { data, error } = await supabase
		.from("sitecue_drafts")
		.insert({
			...newDraft,
			user_id: userId,
		})
		.select()
		.single();

	if (error) throw error;
	return data as Draft;
}

export async function updateDraftEntity(
	supabase: SupabaseClient,
	id: string,
	updates: Partial<Draft>,
): Promise<Draft> {
	const { data, error } = await supabase
		.from("sitecue_drafts")
		.update(updates)
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	return data as Draft;
}

export async function softDeleteDraftEntity(
	supabase: SupabaseClient,
	id: string,
): Promise<Draft> {
	const now = new Date().toISOString();
	const { data, error } = await supabase
		.from("sitecue_drafts")
		.update({
			deleted_at: now,
			updated_at: now,
		})
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	return data as Draft;
}

export async function restoreDraftEntity(
	supabase: SupabaseClient,
	id: string,
): Promise<Draft> {
	const { data, error } = await supabase
		.from("sitecue_drafts")
		.update({
			deleted_at: null,
			updated_at: new Date().toISOString(),
		})
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	return data as Draft;
}

export async function fetchTrashDrafts(
	supabase: SupabaseClient,
	userId: string,
	retentionDays: number,
): Promise<Draft[]> {
	const cutoff = new Date(
		Date.now() - retentionDays * 24 * 60 * 60 * 1000,
	).toISOString();

	const { data, error } = await supabase
		.from("sitecue_drafts")
		.select("*")
		.eq("user_id", userId)
		.not("deleted_at", "is", null)
		.gte("deleted_at", cutoff)
		.order("deleted_at", { ascending: false });

	if (error) throw error;
	return (data as Draft[]) || [];
}

export async function permanentlyDeleteDraftEntity(
	supabase: SupabaseClient,
	id: string,
): Promise<string> {
	const { error } = await supabase.from("sitecue_drafts").delete().eq("id", id);
	if (error) throw error;
	return id;
}

export async function emptyTrashDraftsEntity(
	supabase: SupabaseClient,
	userId: string,
): Promise<void> {
	const { error } = await supabase
		.from("sitecue_drafts")
		.delete()
		.eq("user_id", userId)
		.not("deleted_at", "is", null);

	if (error) throw error;
}
