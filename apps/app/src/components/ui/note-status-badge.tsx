import { AlertTriangle, Check, Info, Lightbulb, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type NoteType = "info" | "alert" | "idea";

interface NoteStatusBadgeProps {
	type: NoteType | string;
	isResolved: boolean;
	onClick?: (e: React.MouseEvent) => void;
	className?: string;
}

const badgeConfig = {
	info: {
		icon: Info,
		bgClass: "bg-note-info/10",
		textClass: "text-note-info",
		label: "Info",
	},
	alert: {
		icon: AlertTriangle,
		bgClass: "bg-note-alert/10",
		textClass: "text-note-alert",
		label: "Alert",
	},
	idea: {
		icon: Lightbulb,
		bgClass: "bg-note-idea/10",
		textClass: "text-note-idea",
		label: "Idea",
	},
};

export function NoteStatusBadge({
	type,
	isResolved,
	onClick,
	className,
}: NoteStatusBadgeProps) {
	const {
		icon: BaseIcon,
		bgClass,
		textClass,
		label,
	} = badgeConfig[type as NoteType] ?? badgeConfig.info;

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"group/badge relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase transition-colors overflow-hidden cursor-pointer pointer-events-auto",
				bgClass,
				textClass,
				className,
			)}
			title={isResolved ? "Mark as unresolved" : "Mark as resolved"}
		>
			<div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0 overflow-hidden">
				{!isResolved ? (
					<>
						<BaseIcon
							className="absolute inset-0 w-full h-full transition-all duration-300 group-hover/badge:-translate-y-full group-hover/badge:opacity-0"
							aria-hidden="true"
						/>
						<Check
							className="absolute inset-0 w-full h-full translate-y-full opacity-0 transition-all duration-300 group-hover/badge:translate-y-0 group-hover/badge:opacity-100"
							aria-hidden="true"
						/>
					</>
				) : (
					<>
						<Check
							className="absolute inset-0 w-full h-full text-emerald-500 transition-all duration-300 group-hover/badge:-translate-y-full group-hover/badge:opacity-0"
							aria-hidden="true"
						/>
						<RotateCcw
							className="absolute inset-0 w-full h-full translate-y-full opacity-0 transition-all duration-300 group-hover/badge:translate-y-0 group-hover/badge:opacity-100"
							aria-hidden="true"
						/>
					</>
				)}
			</div>
			<span>{label}</span>
		</button>
	);
}
