"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function addPinnedSite(formData: FormData) {
	const supabase = await createClient();
	const title = formData.get("title") as string;
	const url = formData.get("url") as string;

	if (!title || !url) {
		throw new Error("Title and URL are required");
	}

	const { error } = await supabase
		.from("sitecue_pinned_sites")
		.insert([{ title, url }]);

	if (error) {
		console.error("Error adding pinned site:", error);
		throw new Error("Failed to add pinned site");
	}

	revalidatePath("/");
}

export async function deletePinnedSite(id: string) {
	const supabase = await createClient();

	const { error } = await supabase
		.from("sitecue_pinned_sites")
		.delete()
		.eq("id", id);

	if (error) {
		console.error("Error deleting pinned site:", error);
		throw new Error("Failed to delete pinned site");
	}

	revalidatePath("/");
}
