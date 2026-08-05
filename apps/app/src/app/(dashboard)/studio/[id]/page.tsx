import { requireUser } from "@/utils/supabase/server";
import DraftEditor from "../../_components/DraftEditor";

interface DraftPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function DraftEditPage({ params }: DraftPageProps) {
	const { id } = await params;
	const currentPath = `/studio/${id}`;

	// 最速で認証ガードのみ通過させ、UIシェルを 0ms で即時返却
	await requireUser(currentPath);

	return <DraftEditor draftId={id} />;
}
