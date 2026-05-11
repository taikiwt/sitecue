import type { HTMLAttributes } from "react";

export function Skeleton({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`bg-base-border/50 animate-pulse rounded ${className}`}
			{...props}
		/>
	);
}
