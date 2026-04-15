import { notFound } from "next/navigation";
import type { Draft } from "../../../../../../types/app.ts";
import { createClient } from "../../../utils/supabase/server";
import DraftEditor from "../../_components/DraftEditor";

interface DraftPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function DraftEditPage({ params }: DraftPageProps) {
	const { id } = await params;
	const supabase = await createClient();

	const { data: draft, error } = await supabase
		.from("sitecue_drafts")
		.select("*, sitecue_templates(*)")
		.eq("id", id)
		.single();

	if (error || !draft) {
		notFound();
	}

	// 型の整合性を合わせる（supabaseのRowからDraft型へ）
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
