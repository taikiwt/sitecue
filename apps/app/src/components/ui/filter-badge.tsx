import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterBadgeProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	isActive?: boolean;
	icon?: React.ReactNode;
};

export function FilterBadge({
	isActive,
	icon,
	children,
	className,
	...props
}: FilterBadgeProps) {
	return (
		<button
			type="button"
			className={cn(
				"group relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer overflow-hidden",
				isActive
					? "bg-action text-action-text shadow-sm"
					: "text-gray-500 hover:text-action hover:bg-base-surface",
				className,
			)}
			{...props}
		>
			<div
				className={cn(
					"flex items-center transition-all duration-200",
					"w-0 opacity-0 -ml-1 group-hover:w-3 group-hover:opacity-100 group-hover:mr-1",
					isActive && "w-3 opacity-100 mr-1",
				)}
			>
				<Check className="w-3 h-3" aria-hidden="true" />
			</div>
			{icon && <div className="flex-shrink-0">{icon}</div>}
			{children && <span>{children}</span>}
		</button>
	);
}
