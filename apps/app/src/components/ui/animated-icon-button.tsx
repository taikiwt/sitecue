import type * as React from "react";
import { Button } from "@/components/ui/button";

export interface AnimatedIconButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	icon: React.ReactNode;
	isActive?: boolean;
	activeIcon?: React.ReactNode;
}

export function AnimatedIconButton({
	icon,
	isActive = false,
	activeIcon,
	className,
	type = "button",
	...props
}: AnimatedIconButtonProps) {
	return (
		<Button
			type={type}
			variant="ghost"
			size="icon"
			className={`relative rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${className || ""}`}
			{...props}
		>
			<div className="relative flex items-center justify-center">
				{/* Default Icon */}
				<span
					className={`transition-opacity duration-200 ${isActive && activeIcon ? "opacity-0" : "opacity-100"}`}
				>
					{icon}
				</span>
				{/* Active Fill Icon Overlay */}
				{activeIcon && (
					<span
						className={`absolute transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`}
					>
						{activeIcon}
					</span>
				)}
			</div>
		</Button>
	);
}
