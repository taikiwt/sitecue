import { Search, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface SearchInputBaseProps {
	value: string;
	onChange: (value: string) => void;
	onClear: () => void;
	onSubmit?: () => void;
	placeholder?: string;
	className?: string;
}

export const SearchInputBase = React.forwardRef<
	HTMLInputElement,
	SearchInputBaseProps
>(({ value, onChange, onClear, onSubmit, placeholder, className }, ref) => {
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && onSubmit) {
			e.preventDefault();
			onSubmit();
		}
	};

	return (
		<div className={cn("relative flex items-center w-full group", className)}>
			<button
				type="button"
				onClick={onSubmit}
				className="absolute left-3 flex items-center justify-center cursor-pointer text-muted-foreground group-focus-within:text-action transition-colors"
				aria-label="Search"
			>
				<Search className="w-4 h-4" aria-hidden="true" />
			</button>
			<input
				ref={ref}
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder || "Search..."}
				className="w-full pl-9 pr-8 py-2 text-sm bg-base-bg border border-transparent focus:border-base-border focus:ring-2 focus:ring-base-border rounded-lg transition-all outline-none"
			/>
			{value && (
				<button
					type="button"
					onClick={onClear}
					className="absolute right-2 p-1 text-muted-foreground hover:text-action cursor-pointer transition-colors"
					aria-label="Clear search"
				>
					<X className="w-3.5 h-3.5" aria-hidden="true" />
				</button>
			)}
		</div>
	);
});
SearchInputBase.displayName = "SearchInputBase";
