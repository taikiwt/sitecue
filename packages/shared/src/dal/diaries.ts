import type { SupabaseClient } from "@supabase/supabase-js";
import type { Diary, Draft, Note } from "../types/app";

export async function appendDiaryLog(
	supabase: SupabaseClient,
	userId: string,
	dateStr: string, // YYYY-MM-DD
	text: string,
	topics?: string[],
): Promise<Diary> {
	const trimmedText = text.trim();
	if (!trimmedText) throw new Error("Content cannot be empty");
	if (topics && topics.length > 10)
		throw new Error("Maximum 10 topics allowed");
	if (topics?.some((t) => t.length > 50))
		throw new Error("Topic length cannot exceed 50 characters");

	// クライアントのローカル時刻に基づく[HH:MM]タイムスタンプを算出
	const now = new Date();
	const timestamp = `[${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}]\n`;

	const { data: existing, error: fetchError } = await supabase
		.from("sitecue_diaries")
		.select("content, topics")
		.eq("user_id", userId)
		.eq("date", dateStr)
		.maybeSingle();

	if (fetchError) throw fetchError;

	let newContent = "";
	let finalTopics = existing?.topics || [];
	if (topics) {
		finalTopics = Array.from(new Set([...finalTopics, ...topics])).slice(0, 10);
	}

	if (existing?.content) {
		// 結合仕様: 既存の末尾に改行2つを挟み、今回のタイムスタンプ＋本文をアトミック結合
		newContent = `${existing.content}\n\n${timestamp}${trimmedText}`;
	} else {
		newContent = `${timestamp}${trimmedText}`;
	}

	const { data, error } = await supabase
		.from("sitecue_diaries")
		.upsert({
			user_id: userId,
			date: dateStr,
			content: newContent,
			topics: finalTopics,
			updated_at: new Date().toISOString(),
		})
		.select()
		.single();

	if (error) throw error;
	return data as Diary;
}

export async function fetchDiariesList(
	supabase: SupabaseClient,
	userId: string,
): Promise<Diary[]> {
	const { data, error } = await supabase
		.from("sitecue_diaries")
		.select("*")
		.eq("user_id", userId)
		.order("date", { ascending: false });
	if (error) throw error;
	return data as Diary[];
}

export async function fetchNotesByDate(
	supabase: SupabaseClient,
	userId: string,
	dateStr: string,
): Promise<Note[]> {
	const { data, error } = await supabase.rpc("get_notes_by_date", {
		p_user_id: userId,
		p_date: dateStr,
	});
	if (error) throw error;
	return (data as Note[]) || [];
}
export async function fetchDraftsByDate(
	supabase: SupabaseClient,
	userId: string,
	dateStr: string,
): Promise<Draft[]> {
	const { data, error } = await supabase.rpc("get_drafts_by_date", {
		p_user_id: userId,
		p_date: dateStr,
	});
	if (error) throw error;
	return (data as Draft[]) || [];
}

export async function updateDiaryContent(
	supabase: SupabaseClient,
	userId: string,
	dateStr: string,
	fullContent: string,
): Promise<Diary> {
	const { data, error } = await supabase
		.from("sitecue_diaries")
		.upsert({
			user_id: userId,
			date: dateStr,
			content: fullContent,
			updated_at: new Date().toISOString(),
		})
		.select()
		.single();

	if (error) throw error;
	return data as Diary;
}

export async function fetchDiaryByDate(
	supabase: SupabaseClient,
	userId: string,
	dateStr: string,
): Promise<Diary | null> {
	const { data, error } = await supabase
		.from("sitecue_diaries")
		.select("*")
		.eq("user_id", userId)
		.eq("date", dateStr)
		.maybeSingle();

	if (error) throw error;
	return data as Diary | null;
}

