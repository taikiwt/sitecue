import { requireUser } from "@/utils/supabase/server";
import type { Template } from "../../../../../../types/app";
import { TemplateManager } from "./_components/TemplateManager";

export default async function TemplatesPage({
	searchParams,
}: {
	searchParams: Promise<{ id?: string }>;
}) {
	const resolvedParams = await searchParams;
	const currentPath = resolvedParams.id
		? `/templates?id=${resolvedParams.id}`
		: "/templates";

	const { supabase } = await requireUser(currentPath);

	const { data: templates } = await supabase
		.from("sitecue_templates")
		.select("*")
		.order("created_at", { ascending: true });

	return (
		<TemplateManager
			initialTemplates={(templates as Template[]) || []}
			selectedId={resolvedParams.id || null}
		/>
	);
}
