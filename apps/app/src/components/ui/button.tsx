import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 duration-200 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover-safe:bg-primary-hover",
				outline: "border-border bg-background hover-safe:bg-muted hover-safe:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover-safe:bg-input/50",
				secondary: "bg-secondary text-secondary-foreground hover-safe:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
				ghost: "hover-safe:bg-muted hover-safe:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover-safe:bg-muted/50",
				destructive: "bg-destructive/10 text-destructive hover-safe:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover-safe:bg-destructive/30 dark:focus-visible:ring-destructive/40",
				link: "text-primary underline-offset-4 hover-safe:underline",
			},
			size: {
				default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				xs: "h-6 gap-1 px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-7 gap-1 px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				icon: "size-8",
				"icon-xs": "size-6 in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-7 in-data-[slot=button-group]:rounded-lg",
				"icon-lg": "size-9",
			},
			radius: {
				full: "rounded-full",
				lg: "rounded-lg", // レガシー救済・互換用
			}
		},
		compoundVariants: [
			// radius: "full" 時のパディング黄金比ルール（左右のパディングを広げて文字を保護）
			{ radius: "full", size: "default", className: "px-4" },
			{ radius: "full", size: "sm", className: "px-3.5" },
			{ radius: "full", size: "xs", className: "px-3" },
			{ radius: "full", size: "lg", className: "px-4.5" },
			// アイコンサイズ時の正円絶対死守ルール（パディングを0にリセットして完全に丸める）
			{ radius: "full", size: "icon", className: "p-0 rounded-full size-8" },
			{ radius: "full", size: "icon-sm", className: "p-0 rounded-full size-7" },
			{ radius: "full", size: "icon-xs", className: "p-0 rounded-full size-6" },
			{ radius: "full", size: "icon-lg", className: "p-0 rounded-full size-9" },
		],
		defaultVariants: {
			variant: "default",
			size: "default",
			radius: "full", // デフォルトをカプセル型へ一元化
		},
	},
);

interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {}

function Button({
	className,
	variant = "default",
	size = "default",
	radius = "full",
	...props
}: ButtonProps) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, radius, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
export type { ButtonProps };
