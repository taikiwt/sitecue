import type * as React from "react";
import { Button } from "@/components/ui/button";

export interface HoverRevealButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	icon: React.ReactNode;
	text: string;
}

export function HoverRevealButton({
	icon,
	text,
	className,
	type = "button",
	...props
}: HoverRevealButtonProps) {
	return (
		<Button
			type={type}
			variant="ghost"
			className={`group flex items-center gap-0 overflow-hidden px-2 hover:bg-transparent dark:hover:bg-transparent ${className || ""}`}
			{...props}
		>
			{icon}
			<span className="max-w-0 opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:mr-2 group-hover:max-w-[150px] group-hover:opacity-100 whitespace-nowrap text-inherit">
				{text}
			</span>
		</Button>
	);
}
