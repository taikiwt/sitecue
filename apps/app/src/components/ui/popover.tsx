"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
	return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
	return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />;
}

function PopoverContent({
	className,
	align = "center",
	sideOffset = 4,
	...props
}: PopoverPrimitive.Popup.Props & {
	className?: string;
	align?: "start" | "center" | "end";
	sideOffset?: number;
}) {
	return (
		<PopoverPortal>
			<PopoverPrimitive.Positioner align={align} sideOffset={sideOffset}>
				<PopoverPrimitive.Popup
					data-slot="popover-content"
					className={cn(
						"z-50 w-72 rounded-xl border bg-white p-4 text-neutral-900 shadow-xl outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
						className,
					)}
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPortal>
	);
}

function PopoverArrow({ className, ...props }: PopoverPrimitive.Arrow.Props) {
	return (
		<PopoverPrimitive.Arrow
			data-slot="popover-arrow"
			className={cn("fill-white stroke-neutral-200", className)}
			{...props}
		/>
	);
}

export { Popover, PopoverTrigger, PopoverContent, PopoverArrow };
