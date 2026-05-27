import { ArrowUpRight, Globe } from "lucide-react";
import { CustomLink as Link } from "@/components/ui/custom-link";

export interface DomainNote {
	id: string;
	content: string;
}

interface DomainDashboardCardProps {
	domain: string;
	recentNotes: DomainNote[];
	totalCount: number;
}

const DOMAIN_THEMES: Record<string, { color: string }> = {
	"github.com": { color: "#181717" },
	"notion.so": { color: "#000000" },
	"google.com": { color: "#4285F4" },
	"twitter.com": { color: "#1DA1F2" },
	"x.com": { color: "#000000" },
	"zenn.dev": { color: "#3EA8FF" },
};
const DEFAULT_THEME = { color: "#e5e7eb" };

export function DomainDashboardCard({
	domain,
	recentNotes,
	totalCount,
}: DomainDashboardCardProps) {
	const theme = DOMAIN_THEMES[domain] || DEFAULT_THEME;
	const isLocalhost =
		domain.includes("127.0.0.1") || domain.includes("localhost");

	return (
		<div className="relative group overflow-hidden rounded-xl border border-base-border p-5 transition-all duration-300 hover-safe:shadow-md hover-safe:border-neutral-400">
			{/* カード全体の透明リンク（SSOTパラメータ） */}
			<Link
				href={`/notes?domain=${domain}&view=domain`}
				className="absolute inset-0 z-0 outline-none"
				aria-label={`Open workspace for ${domain}`}
			/>

			{/* インラインスタイルによる極細かつシャープな髪の毛アクセント線 */}
			{/* <div */}
			{/* 	className="absolute left-0 top-0 bottom-0 w-[2px]" */}
			{/* 	style={{ backgroundColor: theme.color }} */}
			{/* /> */}

			<div className="relative z-10 flex flex-col gap-3 pointer-events-none">
				<div className="flex justify-between items-start">
					<div className="flex items-center gap-2.5">
						{isLocalhost ? (
							<Globe
								className="w-4 h-4 text-neutral-400 shrink-0"
								aria-hidden="true"
							/>
						) : (
							// biome-ignore lint/performance/noImgElement: Dynamic external favicon URLs cannot be optimized using Next.js Image component
							<img
								src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
								className="w-4 h-4 rounded-sm shrink-0"
								alt=""
							/>
						)}
						<h3 className="font-bold text-sm text-action truncate max-w-[120px] sm:max-w-[140px] md:max-w-[160px]">
							{domain}
						</h3>
						<span className="text-[10px] text-neutral-400 font-mono">
							{totalCount}
						</span>
					</div>
					{/* 外部リンク（前面レイヤー配置、イベント発火許可） */}
					<a
						href={`https://${domain}`}
						target="_blank"
						rel="noopener noreferrer"
						className="relative z-20 pointer-events-auto p-1 rounded-md text-neutral-400 hover-safe:bg-base-bg hover-safe:text-action transition-colors"
						aria-label={`Visit ${domain} directly`}
					>
						<ArrowUpRight className="w-3.5 h-3.5" />
					</a>
				</div>

				{/* インラインプレビューリスト */}
				<div className="flex flex-col gap-1 border-t border-base-border/50 pt-3">
					{recentNotes.length === 0 ? (
						<div className="text-xs text-neutral-400 italic">
							No notes captured
						</div>
					) : (
						recentNotes.map((note) => (
							<div
								key={note.id}
								className="text-xs font-normal text-neutral-400 leading-tight truncate font-sans"
							>
								{note.content
									? note.content.substring(0, 45).replace(/[#*`-]/g, "")
									: "Untitled note"}
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
