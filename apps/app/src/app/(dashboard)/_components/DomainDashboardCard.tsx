import type { DashboardDomainActivity } from "@sitecue/shared";
import { FileText, FolderOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { DomainFavicon } from "./DomainFavicon"; //

const getFallbackPathname = (urlStr: string) => {
	try {
		const safeUrl = urlStr.startsWith("http") ? urlStr : `https://${urlStr}`;
		return new URL(safeUrl).pathname;
	} catch {
		return urlStr;
	}
};

interface Props {
	data: DashboardDomainActivity;
}

export function DomainDashboardCard({ data }: Props) {
	return (
		<div className="border border-base-border rounded-xl p-5 flex flex-col gap-4">
			{/* ドメインヘッダー: Gridによる完全保護 */}
			<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center w-full pb-3 border-b border-base-border/50 ">
				<div className="flex items-center min-w-0 gap-2">
					<a
						href={`https://${data.domain}`}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 text-base-text hover-safe:text-action hover-safe:underline min-w-0"
					>
						<DomainFavicon domain={data.domain} />

						<span
							className="truncate block font-medium text-2xl"
							title={data.domain}
						>
							{data.domain}
						</span>
					</a>
					<span className="text-[10px] text-neutral-400 font-mono shrink-0">
						{data.total_count} notes
					</span>
				</div>
				<div className="shrink-0">
					<Link
						href={`/notes?domain=${data.domain}&view=domain`}
						className={buttonVariants({ variant: "outline", size: "lg" })}
					>
						Open
					</Link>
				</div>
			</div>

			{/* ドメイン直下 (scope = 'domain') の最新ノートスニペット (クリッカブル、親コンテキスト保持) */}
			{data.domain_notes.length > 0 && (
				<div className="flex flex-col gap-1.5">
					{data.domain_notes.map((note) => (
						<Link
							key={note.id}
							href={`/notes?domain=${data.domain}&view=domain&noteId=${note.id}`}
							className="text-xs font-normal text-neutral-600 hover-safe:text-action leading-tight truncate font-sans transition-colors block"
						>
							<FileText
								className="w-2.5 h-2.5 text-neutral-400 shrink-0 inline-block mr-1"
								aria-hidden="true"
							/>
							{note.content
								? note.content.substring(0, 45).replace(/[#*`-]/g, "")
								: "Untitled note"}
						</Link>
					))}
				</div>
			)}

			{/* 子階層：個別ページ */}
			{data.top_pages.length > 0 && (
				<div className="flex flex-col gap-3 pl-2 border-l border-base-border/50 mt-1">
					{data.top_pages.map((page) => {
						const safeUrl = page.page_url.startsWith("http")
							? page.page_url
							: `https://${page.page_url}`;
						return (
							<div key={page.page_url} className="flex flex-col gap-1.5">
								<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-center">
									<div className="grid min-w-0">
										<a
											href={safeUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs hover-safe:underline truncate flex items-center gap-1 hover-safe:text-action transition-colors min-w-0"
											title={page.page_url}
										>
											<DomainFavicon
												domain={data.domain}
												sizeClassName="w-3 h-3"
											/>

											<span className="text-base text-base-content line-clamp-1 truncate block min-w-0">
												{page.page_title || getFallbackPathname(page.page_url)}
											</span>
										</a>
									</div>
									<Link
										href={`/notes?domain=${data.domain}&view=exact&exact=${encodeURIComponent(page.page_url)}`}
										className="shrink-0 text-[10px] text-neutral-400 hover-safe:text-action font-medium flex items-center gap-0.5 transition-colors ml-2"
									>
										<FolderOpen className="w-3 h-3" aria-hidden="true" />
										<span>{page.page_count} notes</span>
									</Link>
								</div>
								{/* ページ個別ノートスニペット (クリッカブル、親コンテキスト保持) */}
								{page.page_notes.length > 0 && (
									<div className="flex flex-col gap-1 pl-5">
										{page.page_notes.map((note) => (
											<Link
												key={note.id}
												href={`/notes?domain=${data.domain}&view=exact&exact=${encodeURIComponent(page.page_url)}&noteId=${note.id}`}
												className="text-[11px] font-normal text-neutral-600 hover-safe:text-action leading-tight truncate font-sans transition-colors block"
											>
												<FileText
													className="w-3 h-3 text-neutral-400 shrink-0 inline-block mr-1"
													aria-hidden="true"
												/>
												{note.content
													? note.content.substring(0, 40).replace(/[#*`-]/g, "")
													: "Untitled note"}
											</Link>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
