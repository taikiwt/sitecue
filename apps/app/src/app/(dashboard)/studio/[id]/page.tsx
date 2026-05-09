import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/utils/supabase/server";
import type { Draft } from "../../../../../../../types/app.ts";
import DraftEditor from "../../_components/DraftEditor";
import { StudioEditorSkeleton } from "../_components/StudioSkeletons";

async function DraftEditorLoader({
	id,
	currentPath,
}: {
	id: string;
	currentPath: string;
}) {
	const { supabase } = await requireUser(currentPath);

	const { data: draft, error } = await supabase
		.from("sitecue_drafts")
		.select("*, sitecue_templates(*)")
		.eq("id", id)
		.single();

	if (error || !draft) {
		notFound();
	}

	const formattedDraft: Draft = {
		...draft,
		metadata: draft.metadata as Draft["metadata"],
		sitecue_templates:
			draft.sitecue_templates as unknown as Draft["sitecue_templates"],
	};

	return (
		<DraftEditor
			initialDraft={formattedDraft}
			template={formattedDraft.sitecue_templates}
		/>
	);
}

interface DraftPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function DraftEditPage({ params }: DraftPageProps) {
	const { id } = await params;
	const currentPath = `/studio/${id}`;

	// 最速で認証ガードのみ通過させる
	await requireUser(currentPath);

	return (
		<Suspense fallback={<StudioEditorSkeleton hasDraftId={true} />}>
			<DraftEditorLoader id={id} currentPath={currentPath} />
		</Suspense>
	);
}
