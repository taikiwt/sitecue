import { createClient } from "@/utils/supabase/server";
import DraftEditor from "../../_components/DraftEditor";

export default async function FocusModePage({
	searchParams,
}: {
	searchParams: Promise<{ template_id?: string }>;
}) {
	const resolvedParams = await searchParams;
	let template = null;

	if (resolvedParams.template_id) {
		const supabase = await createClient();
		const { data } = await supabase
			.from("sitecue_templates")
			.select("*")
			.eq("id", resolvedParams.template_id)
			.single();
		template = data;
	}

	return <DraftEditor template={template} />;
}
