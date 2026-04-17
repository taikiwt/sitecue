import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { NotesContainer } from "./_components/NotesContainer";
import type { SearchParams } from "./types";

export default async function Dashboard(props: {
	searchParams: Promise<SearchParams>;
}) {
	const searchParams = await props.searchParams;

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/login");
	}

	// パラメータが何もない場合は Inbox へリダイレクト
	if (
		!searchParams.view &&
		!searchParams.domain &&
		!searchParams.exact &&
		!searchParams.noteId &&
		!searchParams.draftId
	) {
		redirect("/notes?domain=inbox");
	}

	return (
		<Suspense fallback={null}>
			<NotesContainer />
		</Suspense>
	);
}
