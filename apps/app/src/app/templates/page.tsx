import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { Template } from "../../../../../types/app";
import { TemplateManager } from "./_components/TemplateManager";

export default async function TemplatesPage({
	searchParams,
}: {
	searchParams: Promise<{ id?: string }>;
}) {
	const resolvedParams = await searchParams;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/login?next=/templates");
	}

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
