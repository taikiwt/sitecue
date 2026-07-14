import { cva, type VariantProps } from "class-variance-authority";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all outline-none select-none active:translate-y-px cursor-pointer disabled:pointer-events-none disabled:opacity-30 duration-200 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-action text-action-text hover:opacity-90",
				outline:
					"border border-base-border bg-base-bg text-action hover:bg-base-surface",
				ghost: "text-muted-foreground hover:text-action hover:bg-base-surface",
				destructive: "bg-note-alert/10 text-note-alert hover:bg-note-alert/20",
			},
			size: {
				xs: "h-6 gap-1 px-2 text-xs rounded-full [&_svg]:size-3",
				sm: "h-7 gap-1 px-2.5 text-[0.8rem] rounded-full [&_svg]:size-3.5",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "sm",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	icon: React.ReactNode; // 型レベルでのアイコン強制
}

export function Button({
	className,
	variant,
	size,
	icon,
	children,
	...props
}: ButtonProps) {
	return (
		<button
			type="button"
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		>
			{icon}
			{children && <span>{children}</span>}
		</button>
	);
}
