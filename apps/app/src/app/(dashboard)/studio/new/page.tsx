import { requireUser } from "@/utils/supabase/server";
import DraftEditor from "../../_components/DraftEditor";

export default async function FocusModePage({
	searchParams,
}: {
	searchParams: Promise<{ template_id?: string }>;
}) {
	const resolvedParams = await searchParams;
	const templateId = resolvedParams.template_id;
	const currentPath = templateId
		? `/studio/new?template_id=${templateId}`
		: "/studio/new";

	await requireUser(currentPath);

	return <DraftEditor templateId={templateId} />;
}
