import { Suspense } from "react";
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

	return (
		<Suspense fallback={null}>
			<DraftEditor template={template} />
		</Suspense>
	);
}
