import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { NotesContainer } from "./_components/NotesContainer";
import type { SearchParams } from "./types";

export default async function Dashboard(_props: {
	searchParams: Promise<SearchParams>;
}) {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/login");
	}

	return (
		<Suspense fallback={null}>
			<NotesContainer />
		</Suspense>
	);
}
