import { cn } from "@/lib/utils";

type FilterBadgeProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	isActive?: boolean;
};

export function FilterBadge({
	isActive,
	children,
	className,
	...props
}: FilterBadgeProps) {
	return (
		<button
			type="button"
			className={cn(
				"flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer",
				isActive
					? "bg-action text-action-text shadow-sm"
					: "text-gray-500 hover-safe:text-action hover-safe:bg-base-surface",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}
