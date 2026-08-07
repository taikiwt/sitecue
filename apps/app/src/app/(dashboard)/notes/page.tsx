import { requireUser } from "@/utils/supabase/server";
import { NotesContainer } from "./_components/NotesContainer";

export default async function Dashboard() {
	// 重い searchParams の await や URL パラメータ構築によるブロッキングを一切行わず、
	// 最速で認証ガードのみを通過させて UI シェルを 0ms で即時返却
	await requireUser("/notes");

	return <NotesContainer />;
}
