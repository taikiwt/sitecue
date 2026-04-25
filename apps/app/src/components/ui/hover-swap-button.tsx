import type * as React from "react";
import { Button } from "@/components/ui/button";

export interface HoverSwapButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	defaultIcon: React.ReactNode;
	hoverIcon: React.ReactNode;
}

export function HoverSwapButton({
	defaultIcon,
	hoverIcon,
	className,
	type = "button",
	...props
}: HoverSwapButtonProps) {
	return (
		<Button
			type={type}
			variant="ghost"
			size="icon"
			className={`group relative flex items-center justify-center overflow-hidden ${className || ""}`}
			{...props}
		>
			<span className="absolute transition-all duration-300 ease-in-out opacity-100 group-hover:-translate-y-full group-hover:opacity-0">
				{defaultIcon}
			</span>
			<span className="absolute translate-y-full transition-all duration-300 ease-in-out opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
				{hoverIcon}
			</span>
		</Button>
	);
}
