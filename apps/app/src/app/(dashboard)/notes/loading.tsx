import { MiddlePaneListSkeleton } from "./_components/NotesSkeletons";
import { ResponsiveNotesLayout } from "./_components/ResponsiveNotesLayout";

export default function NotesLoading() {
	return (
		<ResponsiveNotesLayout
			middleNode={
				<div className="flex flex-col h-full bg-base-bg md:border-r md:border-base-border md:w-96">
					{/* 1〜3段目の外殻ヘッダー構造を維持 */}
					<div className="flex-shrink-0 p-4 space-y-3 border-b border-base-border bg-base-bg">
						<div className="flex justify-start w-full items-center h-11">
							<div className="grid grid-cols-4 gap-1 w-full bg-base-surface rounded-full p-1 h-10">
								<div className="bg-action rounded-full h-full" />
								<div className="rounded-full h-full" />
								<div className="rounded-full h-full" />
								<div className="rounded-full h-full" />
							</div>
						</div>
						<div className="h-9 w-full bg-base-surface/50 rounded-full animate-pulse" />
						<div className="h-10 w-full bg-base-surface/50 rounded-full animate-pulse" />
					</div>
					{/* リスト領域のみスケルトン */}
					<MiddlePaneListSkeleton />
				</div>
			}
			rightNode={null}
			selectedDraftId={null}
			selectedNoteId={null}
		/>
	);
}
