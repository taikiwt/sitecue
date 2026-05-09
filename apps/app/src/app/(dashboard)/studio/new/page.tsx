import { Suspense } from "react";
import { requireUser } from "@/utils/supabase/server";
import DraftEditor from "../../_components/DraftEditor";
import { StudioEditorSkeleton } from "../_components/StudioSkeletons";

async function NewDraftLoader({
	templateId,
	currentPath,
}: {
	templateId?: string;
	currentPath: string;
}) {
	const { supabase } = await requireUser(currentPath);

	let template = null;
	if (templateId) {
		const { data } = await supabase
			.from("sitecue_templates")
			.select("*")
			.eq("id", templateId)
			.single();
		template = data;
	}

	return <DraftEditor template={template} />;
}

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

	// 最速で認証ガードのみ通過させる
	await requireUser(currentPath);

	return (
		<Suspense fallback={<StudioEditorSkeleton hasDraftId={false} />}>
			<NewDraftLoader templateId={templateId} currentPath={currentPath} />
		</Suspense>
	);
}
