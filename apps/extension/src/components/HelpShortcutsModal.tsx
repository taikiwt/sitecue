import { Keyboard, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface HelpShortcutsModalProps {
	onClose: () => void;
}

export default function HelpShortcutsModal({
	onClose,
}: HelpShortcutsModalProps) {
	const { t } = useTranslation();

	const shortcuts = [
		{ keys: "Ctrl / ⌘ + Shift + E", desc: t("help.shortcutTogglePanel") },
		{ keys: "Ctrl / ⌘ + Enter", desc: t("help.shortcutSave") },
		{ keys: "Esc", desc: t("help.shortcutEsc") },
		{ keys: "Tab / Shift + Tab", desc: t("help.shortcutIndent") },
		{ keys: "- / 1. + Enter", desc: t("help.shortcutList") },
		{ keys: "Paste URL on selection", desc: t("help.shortcutPasteUrl") },
	];

	return (
		<>
			<button
				type="button"
				className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity duration-200 cursor-default"
				onClick={onClose}
				aria-label={t("help.closeOverlayAria")}
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="help-shortcuts-title"
				className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-sm max-h-[85vh] overflow-y-auto bg-base-surface border border-base-border/70 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200 font-sans text-action"
			>
				<div className="flex items-center justify-between pb-2.5 mb-3 border-b border-base-border/60">
					<h2 id="help-shortcuts-title" className="text-sm font-bold">
						{t("help.title")}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-action transition-colors"
						title={t("help.close")}
					>
						<X className="w-3.5 h-3.5" aria-hidden="true" />
					</button>
				</div>

				<div className="space-y-4 text-xs">
					<section className="space-y-2">
						<div className="flex items-center gap-1.5 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
							<Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
							<span>{t("help.usageSection")}</span>
						</div>
						<ul className="space-y-2 bg-base-bg border border-base-border/60 rounded-xl p-3 leading-relaxed">
							<li>
								<span className="font-bold">{t("help.scopeTitle")}: </span>
								<span className="text-muted-foreground">
									{t("help.scopeDesc")}
								</span>
							</li>
							<li>
								<span className="font-bold">{t("help.lockTitle")}: </span>
								<span className="text-muted-foreground">
									{t("help.lockDesc")}
								</span>
							</li>
							<li>
								<span className="font-bold">{t("help.quickTitle")}: </span>
								<span className="text-muted-foreground">
									{t("help.quickDesc")}
								</span>
							</li>
						</ul>
					</section>

					<section className="space-y-2">
						<div className="flex items-center gap-1.5 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
							<Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
							<span>{t("help.shortcutsSection")}</span>
						</div>
						<div className="bg-base-bg border border-base-border/60 rounded-xl divide-y divide-base-border/50">
							{shortcuts.map((item) => (
								<div
									key={item.keys}
									className="flex items-center justify-between gap-2 px-3 py-2"
								>
									<span className="text-muted-foreground">{item.desc}</span>
									<kbd className="px-2 py-0.5 text-[10px] font-mono bg-base-surface border border-base-border rounded-full shrink-0 text-action">
										{item.keys}
									</kbd>
								</div>
							))}
						</div>
					</section>
				</div>
			</div>
		</>
	);
}
