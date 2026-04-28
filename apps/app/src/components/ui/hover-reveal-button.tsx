import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { cn } from "@/lib/utils";

type BaseProps = {
	icon: React.ReactNode;
	text: string;
};

// hrefの有無によって、Buttonの属性かAnchor(Link)の属性かをTypeScriptで切り替える
export type HoverRevealButtonProps = BaseProps &
	(
		| (React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: never })
		| (React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })
	);

export function HoverRevealButton({
	icon,
	text,
	className,
	href,
	type = "button",
	...props
}: HoverRevealButtonProps) {
	// アニメーション時間の計算: ベース 250ms + (文字数 × 40ms)、最大 800ms
	const duration = Math.min(250 + text.length * 20, 800);

	// ButtonとLinkで共有するベースのクラス
	const sharedClassName = cn(
		"group flex items-center gap-0 overflow-hidden px-4 hover:bg-transparent dark:hover:bg-transparent",
		className,
	);

	// iconに自動で aria-hidden="true" を付与（重複しても問題なし）
	const iconWithAria = React.isValidElement(icon)
		? React.cloneElement(icon as React.ReactElement<React.AriaAttributes>, {
				"aria-hidden": "true",
			})
		: icon;

	// スライドインするテキスト部分
	const revealText = (
		<span
			// Gridの 0fr -> 1fr トランジションで、中身の自然な幅に合わせて滑らかに展開する
			className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-all ease-out group-hover:delay-100"
			style={{ transitionDuration: `${duration}ms` }}
		>
			<span className="overflow-hidden">
				{/* truncate を削除し、展開中のチラつきを解消 */}
				<span
					className="block max-w-37.5 whitespace-nowrap opacity-0 transition-opacity ease-out group-hover:delay-100 group-hover:opacity-100 pl-2 text-inherit"
					style={{ transitionDuration: `${duration}ms` }}
				>
					{text}
				</span>
			</span>
		</span>
	);

	// hrefが存在する場合は CustomLink をレンダリング
	if (href) {
		return (
			<CustomLink
				href={href}
				className={cn(buttonVariants({ variant: "ghost" }), sharedClassName)}
				{...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
			>
				{iconWithAria}
				{revealText}
			</CustomLink>
		);
	}

	// hrefが存在しない場合は Button をレンダリング
	return (
		<Button
			type={type as "button" | "submit" | "reset"}
			variant="ghost"
			className={sharedClassName}
			{...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
		>
			{iconWithAria}
			{revealText}
		</Button>
	);
}
