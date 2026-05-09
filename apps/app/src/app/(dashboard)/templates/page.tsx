import { Suspense } from "react";
import { requireUser } from "@/utils/supabase/server";
import type { Template } from "../../../../../../types/app";
import { TemplateManager } from "./_components/TemplateManager";
import { TemplatesPageSkeleton } from "./_components/TemplatesSkeletons";

async function TemplatesLoader({
	selectedId,
	currentPath,
}: {
	selectedId: string | null;
	currentPath: string;
}) {
	const { supabase } = await requireUser(currentPath);
	const { data: templates } = await supabase
		.from("sitecue_templates")
		.select("*")
		.order("created_at", { ascending: true });

	return (
		<TemplateManager
			initialTemplates={(templates as Template[]) || []}
			selectedId={selectedId}
		/>
	);
}

export default async function TemplatesPage({
	searchParams,
}: {
	searchParams: Promise<{ id?: string }>;
}) {
	const resolvedParams = await searchParams;
	const selectedId = resolvedParams.id || null;
	const currentPath = selectedId ? `/templates?id=${selectedId}` : "/templates";

	// 最速で認証ガードのみ通過させる
	await requireUser(currentPath);

	return (
		<Suspense fallback={<TemplatesPageSkeleton />}>
			<TemplatesLoader selectedId={selectedId} currentPath={currentPath} />
		</Suspense>
	);
}
