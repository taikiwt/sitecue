import type { ReactNode } from "react";
import { CustomLink } from "@/components/ui/custom-link";
import { cn } from "@/lib/utils";

type HoverRevealLinkProps = {
	href: string;
	icon: ReactNode;
	text: string;
	className?: string;
};

export function HoverRevealLink({
	href,
	icon,
	text,
	className,
}: HoverRevealLinkProps) {
	return (
		<CustomLink
			href={href}
			className={cn(
				"group/button flex items-center justify-center h-8 rounded-[min(var(--radius-md),12px)] px-2.5 transition-all duration-200 cursor-pointer shadow-sm overflow-hidden",
				className,
			)}
		>
			<span className="shrink-0 [&_svg]:size-3.5">{icon}</span>
			<span className="max-w-0 opacity-0 group-hover/button:max-w-[150px] group-hover/button:opacity-100 group-hover/button:ml-1.5 overflow-hidden whitespace-nowrap transition-all duration-200 ease-out text-sm font-medium">
				{text}
			</span>
		</CustomLink>
	);
}
