import { Check } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

export interface HoverSwapButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	defaultIcon: React.ReactNode;
	hoverIcon: React.ReactNode;
	successIcon?: React.ReactNode;
	stayDuration?: number;
	disableSuccessState?: boolean; // Success状態を無効化するフラグ
}

export function HoverSwapButton({
	defaultIcon,
	hoverIcon,
	successIcon = <Check className="w-4 h-4 text-success" />,
	className,
	type = "button",
	stayDuration = 1500,
	disableSuccessState = false, // デフォルトは false（チェックマークが出る）
	onClick,
	...props
}: HoverSwapButtonProps) {
	const [isSuccess, setIsSuccess] = React.useState(false);
	const timerRef = React.useRef<NodeJS.Timeout | null>(null);

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		// 無効化されていない場合のみアニメーションを走らせる
		if (!disableSuccessState) {
			setIsSuccess(true);

			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}

			timerRef.current = setTimeout(() => {
				setIsSuccess(false);
			}, stayDuration);
		}

		// 親から渡されたonClick（メニューを開く処理など）は常に実行する
		if (onClick) {
			onClick(e);
		}
	};

	React.useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	return (
		<Button
			type={type}
			variant="ghost"
			size="icon"
			className={`group relative flex items-center justify-center overflow-hidden ${className || ""}`}
			data-success={isSuccess}
			onClick={handleClick}
			{...props}
		>
			{/* 1. 上側（デフォルト）のアイコン */}
			<span className="absolute transition-all duration-300 ease-in-out opacity-100 group-hover:-translate-y-full group-hover:opacity-0 group-data-[success=true]:-translate-y-full group-data-[success=true]:opacity-0">
				{defaultIcon}
			</span>

			{/* 2. 下側（ホバー時）のアイコン */}
			<span className="absolute transition-all duration-300 ease-in-out opacity-0 translate-y-full group-hover:translate-y-0 group-hover:opacity-100 group-data-[success=true]:-translate-y-full group-data-[success=true]:opacity-0">
				{hoverIcon}
			</span>

			{/* 3. クリック時（完了時）のアイコン */}
			<span className="absolute transition-all duration-300 ease-in-out opacity-0 translate-y-full group-data-[success=true]:translate-y-0 group-data-[success=true]:opacity-100">
				{successIcon}
			</span>
		</Button>
	);
}
