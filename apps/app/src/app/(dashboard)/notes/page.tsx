import { Suspense } from "react";
import { requireUser } from "@/utils/supabase/server";
import { NotesContainer } from "./_components/NotesContainer";
import type { SearchParams } from "./types";

export default async function Dashboard(_props: {
	searchParams: Promise<SearchParams>;
}) {
	const resolvedParams = await _props.searchParams;
	const query = new URLSearchParams(
		resolvedParams as Record<string, string>,
	).toString();
	const currentPath = `/notes${query ? `?${query}` : ""}`;

	await requireUser(currentPath);

	return (
		<Suspense fallback={null}>
			<NotesContainer />
		</Suspense>
	);
}
