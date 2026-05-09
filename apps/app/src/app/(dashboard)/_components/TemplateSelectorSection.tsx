import { PenSquare, Plus } from "lucide-react";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { requireUser } from "@/utils/supabase/server";

export async function TemplateSelectorSection() {
	const { supabase } = await requireUser("/");
	const { data: templates } = await supabase
		.from("sitecue_templates")
		.select("*")
		.order("created_at", { ascending: true });

	return (
		<>
			<div className="mb-6 md:mb-8 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<PenSquare className="w-5 h-5 text-neutral-400" aria-hidden="true" />
					<h2 className="text-xl text-action font-light tracking-tight">
						Start a Draft
					</h2>
				</div>
				<Link
					href="/templates"
					className="text-xs font-medium text-neutral-400 hover:text-action transition-colors"
				>
					Manage Templates
				</Link>
			</div>
			<div className="grid gap-6 sm:grid-cols-3">
				<Link
					href="/studio/new"
					className="group relative flex flex-col items-start rounded-xl border-2 border-dashed border-base-border bg-transparent p-5 cursor-pointer launchpad-transition launchpad-card-start"
				>
					<div className="flex items-center gap-2 mb-1">
						<Plus
							className="w-4 h-4 text-action draft-icon"
							aria-hidden="true"
						/>
						<h3 className="text-base text-action group-hover:text-action-hover transition-colors">
							Blank Canvas
						</h3>
					</div>
					<p className="text-xs text-neutral-500 line-clamp-2">
						Free-form notes not limited to any specific template.
					</p>
				</Link>

				{templates?.map((template) => (
					<Link
						key={template.id}
						href={`/studio/new?template_id=${template.id}`}
						className="group relative flex flex-col items-start rounded-xl border border-base-border bg-base-surface p-5 cursor-pointer launchpad-transition launchpad-card-start"
					>
						<h3 className="mb-1 text-base text-action group-hover:text-action-hover transition-colors">
							{template.name}
						</h3>
						{template.max_length && (
							<p className="text-[10px] text-neutral-400 font-mono mb-1">
								Max: {template.max_length}
							</p>
						)}
						<p className="text-xs text-neutral-500 line-clamp-2">
							Use this template for your workflow.
						</p>
					</Link>
				))}
			</div>
		</>
	);
}
