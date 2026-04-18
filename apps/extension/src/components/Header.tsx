import type { Session } from "@supabase/supabase-js";
import { CircleOff, LogOut, Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";

interface HeaderProps {
	url: string;
	title: string;
	domain: string; // Used for settings key
	session: Session;
	onLogout: () => void;
}

interface DomainSettings {
	color: string;
	label: string;
}

const COLORS = [
	{ name: "Blue", value: "blue-400", hex: "#60a5fa" }, // Blue
	{ name: "Red", value: "rose-400", hex: "#fb7185" }, // Rose
	{ name: "Yellow", value: "amber-400", hex: "#fbbf24" }, // Amber
	{ name: "Green", value: "emerald-400", hex: "#34d399" }, // Emerald
	{ name: "Purple", value: "violet-400", hex: "#a78bfa" }, // Violet
];

export default function Header({
	url,
	title,
	domain,
	session,
	onLogout,
}: HeaderProps) {
	const [settings, setSettings] = useState<DomainSettings | null>(null);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [editColor, setEditColor] = useState("sky-600");
	const [editLabel, setEditLabel] = useState("");
	const [saving, setSaving] = useState(false);

	const fetchSettings = useCallback(async () => {
		const { data } = await supabase
			.from("sitecue_domain_settings")
			.select("*")
			.eq("domain", domain)
			.maybeSingle();

		if (data) {
			setSettings({ color: data.color ?? "", label: data.label ?? "" });
			setEditColor(data.color || "sky-600");
			setEditLabel(data.label || "");
		} else {
			setSettings(null);
			setEditColor(""); // Default to empty/cleared for new settings

			setEditLabel("");
		}
	}, [domain]);

	useEffect(() => {
		if (!domain || !session) return;
		fetchSettings();
	}, [domain, session, fetchSettings]);

	const handleSave = async () => {
		if (!domain) return;
		setSaving(true);
		try {
			if (editColor === "") {
				// Delete settings if cleared
				const { error } = await supabase
					.from("sitecue_domain_settings")
					.delete()
					.eq("user_id", session.user.id)
					.eq("domain", domain);

				if (error) throw error;
			} else {
				// Upsert settings
				const { error } = await supabase.from("sitecue_domain_settings").upsert(
					{
						user_id: session.user.id,
						domain: domain,
						color: editColor,
						label: editLabel.trim() || null,
					},
					{ onConflict: "user_id, domain" },
				);

				if (error) throw error;
			}

			setIsSettingsOpen(false);
			fetchSettings();
			toast.success("Settings saved");
		} catch (error) {
			console.error("Failed to save domain settings", error);
			toast.error("Failed to save settings");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="p-4 bg-base-surface shadow-sm sticky top-0 z-10">
			<div className="flex justify-between items-center gap-2">
				<div className="flex-1 min-w-0">
					<h1 className="text-lg font-semibold text-action flex items-center gap-2">
						{/* Indicator Dot */}
						{/* Indicator Dot */}
						{settings?.color && (
							<div
								className={`w-2 h-2 shrink-0 rounded-full`}
								style={{
									backgroundColor: COLORS.find(
										(c) => c.value === settings?.color,
									)?.hex,
								}}
							/>
						)}
						<span className="truncate" title={title || "SiteCue"}>
							{title || "SiteCue"}
						</span>
						{settings?.label && (
							<span className="text-[10px] bg-action text-action-text px-1.5 py-0.5 rounded border border-base-border font-mono shrink-0">
								{settings.label}
							</span>
						)}
					</h1>
					<p className="text-xs text-muted-foreground truncate" title={url}>
						{url || "Waiting..."}
					</p>
				</div>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => setIsSettingsOpen(!isSettingsOpen)}
						className={`cursor-pointer p-1.5 rounded-full transition-colors ${isSettingsOpen ? "bg-action text-action-text" : "text-muted-foreground hover:text-action"}`}
					>
						<Settings className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={onLogout}
						className="cursor-pointer p-1.5 text-muted-foreground hover:text-action shrink-0"
					>
						<LogOut className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Settings Popup / Expandable Area */}
			{isSettingsOpen && (
				<div className="mt-3 pt-3 border-t border-base-border animate-in slide-in-from-top-2 fade-in duration-200">
					<div className="space-y-3">
						<div>
							<label
								htmlFor="label-input"
								className="text-xs font-medium text-muted-foreground mb-1.5 block"
							>
								Label
							</label>
							<input
								id="label-input"
								type="text"
								value={editLabel}
								onChange={(e) => setEditLabel(e.target.value.slice(0, 10))}
								placeholder="e.g. PROD, DEV"
								className="w-full text-xs text-action border border-base-border rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-action placeholder-muted-foreground"
							/>
						</div>
						<div>
							<label
								htmlFor="color-button"
								className="text-xs font-medium text-muted-foreground mb-1.5 block"
							>
								Color
							</label>
							<div className="flex gap-2 items-center">
								<button
									id="color-button"
									type="button"
									onClick={() => setEditColor("")}
									className={`cursor-pointer w-4 h-4 rounded-full transition-all flex items-center justify-center border border-transparent text-muted-foreground hover:text-action ${editColor === "" ? "text-action bg-base-bg" : ""}`}
									title="Clear Settings"
								>
									<CircleOff className="w-3.5 h-3.5" />
								</button>
								{COLORS.map((c) => (
									<button
										type="button"
										key={c.value}
										onClick={() => setEditColor(c.value)}
										className={`cursor-pointer w-4 h-4 rounded-full transition-all ${editColor === c.value ? "scale-130 ring-2 ring-offset-1 ring-base-border" : "border-transparent hover:scale-130"}`}
										style={{ backgroundColor: c.hex }}
										title={c.name}
									/>
								))}
							</div>
						</div>
						<div className="flex justify-end gap-2 pt-1">
							<button
								type="button"
								onClick={() => setIsSettingsOpen(false)}
								className="cursor-pointer px-3 py-1 text-xs text-muted-foreground hover:text-action"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={saving}
								className="cursor-pointer px-3 py-1 bg-action text-action-text text-xs rounded hover:bg-action-hover disabled:opacity-50 flex items-center gap-1"
							>
								{saving ? "Saving..." : "Save"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
