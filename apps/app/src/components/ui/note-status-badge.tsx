import {
	AlertTriangle,
	Check,
	CheckCircle2,
	Info,
	Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NoteStatusBadgeProps = {
	type: "info" | "alert" | "idea" | string;
	isResolved: boolean;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	className?: string;
};

export function NoteStatusBadge({
	type,
	isResolved,
	onClick,
	className,
}: NoteStatusBadgeProps) {
	const getStyles = () => {
		switch (type) {
			case "alert":
				return "bg-note-alert/10 text-note-alert";
			case "idea":
				return "bg-note-idea/10 text-note-idea";
			default:
				return "bg-note-info/10 text-note-info";
		}
	};

	const getIcon = () => {
		if (isResolved)
			return <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />;
		switch (type) {
			case "alert":
				return <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />;
			case "idea":
				return <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />;
			default:
				return <Info className="w-3.5 h-3.5" aria-hidden="true" />;
		}
	};

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"group relative z-10 pointer-events-auto flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all hover:opacity-80 active:scale-95 cursor-pointer overflow-hidden",
				getStyles(),
				className,
			)}
		>
			{/* ホバー時に滑らかに出現するCheckアイコン */}
			<div className="flex items-center overflow-hidden transition-all duration-300 w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 group-hover:mr-1">
				<Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
			</div>
			<div className="flex items-center gap-1.5 shrink-0">
				{getIcon()}
				<span>{type}</span>
			</div>
		</button>
	);
}
