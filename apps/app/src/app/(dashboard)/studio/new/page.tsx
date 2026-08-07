import { requireUser } from "@/utils/supabase/server";
import DraftEditor from "../../_components/DraftEditor";

export default async function FocusModePage({
	searchParams,
}: {
	searchParams: Promise<{ template_id?: string }>;
}) {
	const resolvedParams = await searchParams;
	const templateId = resolvedParams.template_id;

	await requireUser("/studio/new");

	return <DraftEditor templateId={templateId} />;
}
