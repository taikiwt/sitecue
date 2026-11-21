import {
	ArrowRightLeft,
	Check,
	ExternalLink,
	Link as LinkIcon,
	Loader2,
	Lock,
	Pencil,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

export interface QuickLinkItem {
	id: string;
	label: string;
	target_url: string;
	type: "related" | "env";
	domain: string;
}

interface QuickLinksSectionProps {
	currentDomain: string;
	links: QuickLinkItem[];
	loading: boolean;
	onAddLink: (link: {
		label: string;
		target_url: string;
		type: "related" | "env";
	}) => Promise<unknown>;
	onUpdateLink: (
		id: string,
		updates: { label: string; target_url: string; type: "related" | "env" },
	) => Promise<unknown>;
	onDeleteLink: (id: string) => Promise<unknown>;
}

const getHostname = (url: string) => {
	try {
		return new URL(url).hostname;
	} catch {
		return "";
	}
};

export default function QuickLinksSection({
	currentDomain,
	links,
	loading,
	onAddLink,
	onUpdateLink,
	onDeleteLink,
}: QuickLinksSectionProps) {
	const { t } = useTranslation();
	const [isAdding, setIsAdding] = useState(false);
	const [editingLink, setEditingLink] = useState<QuickLinkItem | null>(null);
	const [formUrl, setFormUrl] = useState("");
	const [formLabel, setFormLabel] = useState("");
	const [formType, setFormType] = useState<"related" | "env">("related");
	const [submitting, setSubmitting] = useState(false);

	const handleLinkClick = (e: React.MouseEvent, link: QuickLinkItem) => {
		if (link.type === "env" && typeof chrome !== "undefined" && chrome.tabs) {
			e.preventDefault();
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const currentTab = tabs[0];
				if (currentTab?.id && currentTab.url) {
					try {
						const currentUrlObj = new URL(currentTab.url);
						const targetOrigin = new URL(link.target_url).origin;
						const newUrl = `${targetOrigin}${currentUrlObj.pathname}${currentUrlObj.search}${currentUrlObj.hash}`;
						chrome.tabs.update(currentTab.id, { url: newUrl });
					} catch {
						window.open(link.target_url, "_blank");
					}
				}
			});
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formUrl.trim() || !formLabel.trim()) return;
		setSubmitting(true);
		const payload = { label: formLabel, target_url: formUrl, type: formType };
		if (editingLink) {
			await onUpdateLink(editingLink.id, payload);
		} else {
			await onAddLink(payload);
		}
		setIsAdding(false);
		setEditingLink(null);
		setFormUrl("");
		setFormLabel("");
		setSubmitting(false);
	};

	return (
		<div className="pb-3 space-y-1.5">
			<div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
				<LinkIcon className="w-3.5 h-3.5" aria-hidden="true" />
				<span>{t("quick.tabLinks")}</span>
			</div>
			{loading ? (
				<div className="flex justify-center py-2">
					<Loader2
						aria-hidden="true"
						className="w-4 h-4 animate-spin text-muted-foreground"
					/>
				</div>
			) : links.length === 0 && !isAdding ? (
				<div className="text-center text-muted-foreground text-xs py-1.5 italic">
					{t("quick.noLinks")}
				</div>
			) : (
				links.map((link) => {
					const isIncoming = link.domain !== currentDomain;
					const hostname = getHostname(link.target_url);
					return (
						<div
							key={link.id}
							className="group flex items-center justify-between p-1 hover:bg-base-bg rounded-xl transition-colors text-xs"
						>
							<a
								href={link.target_url}
								target={link.type === "related" ? "_blank" : undefined}
								rel={
									link.type === "related" ? "noopener noreferrer" : undefined
								}
								onClick={(e) => handleLinkClick(e, link)}
								className="flex items-center gap-2 flex-1 min-w-0"
								title={link.target_url}
							>
								{link.type === "related" ? (
									hostname ? (
										<img
											src={`https://www.google.com/s2/favicons?domain=${hostname}`}
											alt=""
											className="w-3.5 h-3.5 rounded-sm shrink-0"
										/>
									) : (
										<LinkIcon
											aria-hidden="true"
											className="w-3.5 h-3.5 text-muted-foreground shrink-0"
										/>
									)
								) : (
									<ArrowRightLeft
										aria-hidden="true"
										className="w-3.5 h-3.5 text-action shrink-0"
									/>
								)}
								<span className="truncate text-action">{link.label}</span>
								{link.type === "related" && (
									<ExternalLink
										aria-hidden="true"
										className="w-3 h-3 text-muted-foreground shrink-0"
									/>
								)}
								{link.type === "env" && (
									<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-1 shrink-0 border border-base-border px-1.5 rounded-full bg-base-surface">
										ENV
										{isIncoming && (
											<Lock aria-hidden="true" className="w-2.5 h-2.5" />
										)}
									</span>
								)}
							</a>
							{!isIncoming && (
								<div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
									<button
										type="button"
										onClick={() => {
											setEditingLink(link);
											setFormUrl(link.target_url);
											setFormLabel(link.label);
											setFormType(link.type);
											setIsAdding(true);
										}}
										className="cursor-pointer p-1 text-muted-foreground hover:text-action hover:bg-base-surface rounded-full transition-colors"
										title={t("quick.update")}
									>
										<Pencil aria-hidden="true" className="w-3 h-3" />
									</button>
									<button
										type="button"
										onClick={() => onDeleteLink(link.id)}
										className="cursor-pointer p-1 text-muted-foreground hover:text-note-alert hover:bg-note-alert/10 rounded-full transition-colors"
										title={t("item.delete")}
									>
										<Trash2 aria-hidden="true" className="w-3 h-3" />
									</button>
								</div>
							)}
						</div>
					);
				})
			)}
			{isAdding ? (
				<form
					onSubmit={handleSubmit}
					className="mt-2 text-xs border border-base-border rounded-2xl p-2.5 bg-base-bg flex flex-col gap-2"
				>
					<input
						type="text"
						required
						placeholder={t("quick.urlPlaceholder")}
						value={formUrl}
						onChange={(e) => setFormUrl(e.target.value)}
						className="w-full p-1.5 px-3 border border-base-border rounded-full bg-base-surface text-action text-xs focus:outline-none focus:ring-1 focus:ring-action/30 placeholder:text-muted-foreground"
					/>
					<input
						type="text"
						required
						placeholder={t("quick.labelPlaceholder")}
						value={formLabel}
						onChange={(e) => setFormLabel(e.target.value)}
						className="w-full p-1.5 px-3 border border-base-border rounded-full bg-base-surface text-action text-xs focus:outline-none focus:ring-1 focus:ring-action/30 placeholder:text-muted-foreground"
					/>
					<div className="flex gap-3 px-1 text-muted-foreground">
						<label className="flex items-center gap-1.5 cursor-pointer select-none">
							<input
								type="radio"
								checked={formType === "related"}
								onChange={() => setFormType("related")}
								className="accent-action"
							/>
							<span>{t("quick.related")}</span>
						</label>
						<label className="flex items-center gap-1.5 cursor-pointer select-none">
							<input
								type="radio"
								checked={formType === "env"}
								onChange={() => setFormType("env")}
								className="accent-action"
							/>
							<span>{t("quick.envSwitch")}</span>
						</label>
					</div>
					<div className="flex justify-end gap-1.5 pt-1 border-t border-base-border/30">
						<Button
							icon={<X aria-hidden="true" className="w-3.5 h-3.5" />}
							size="xs"
							variant="ghost"
							onClick={() => {
								setIsAdding(false);
								setEditingLink(null);
							}}
						>
							{t("quick.cancel")}
						</Button>
						<Button
							disabled={submitting}
							icon={
								submitting ? (
									<Loader2
										aria-hidden="true"
										className="w-3.5 h-3.5 animate-spin"
									/>
								) : (
									<Check aria-hidden="true" className="w-3.5 h-3.5" />
								)
							}
							size="xs"
							variant="default"
							type="submit"
						>
							{editingLink ? t("quick.update") : t("quick.add")}
						</Button>
					</div>
				</form>
			) : (
				<button
					type="button"
					onClick={() => {
						setEditingLink(null);
						setFormUrl("");
						setFormLabel("");
						setFormType("related");
						setIsAdding(true);
					}}
					className="cursor-pointer w-full text-left p-1.5 px-3 text-xs text-muted-foreground hover:text-action hover:bg-base-bg rounded-full flex items-center gap-1 transition-colors border border-dashed border-base-border/40"
				>
					<Plus aria-hidden="true" className="w-3.5 h-3.5" />
					<span>{t("quick.addLink")}</span>
				</button>
			)}
		</div>
	);
}
