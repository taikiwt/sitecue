"use client";

import {
	Check,
	ChevronDown,
	ChevronUp,
	Crown,
	ExternalLink,
	Lock,
	Sparkles,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

interface PaywallModalProps {
	isOpen: boolean;
	onClose: () => void;
	plan?: "free" | "pro";
	limitType?: "ai" | "notes" | "drafts" | "menu";
}

export default function PaywallModal({
	isOpen,
	onClose,
	plan = "free",
	limitType = "ai",
}: PaywallModalProps) {
	const { t } = useTranslation();
	const [userId, setUserId] = useState<string | null>(null);
	const [userEmail, setUserEmail] = useState<string | null>(null);
	const [isPolarTrustOpen, setIsPolarTrustOpen] = useState(false);

	useEffect(() => {
		if (isOpen) {
			const supabase = createClient();
			supabase.auth.getUser().then(({ data: { user } }) => {
				if (user) {
					setUserId(user.id);
					setUserEmail(user.email ?? null);
				}
			});
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const monthlyBaseUrl =
		process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL_MONTHLY || "#";
	const yearlyBaseUrl =
		process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL_YEARLY || "#";

	const getCheckoutUrl = (baseUrl: string) => {
		if (!userId || baseUrl === "#") return baseUrl;
		const separator = baseUrl.includes("?") ? "&" : "?";
		const params = new URLSearchParams();
		params.set("reference_id", userId);
		if (userEmail) {
			params.set("customer_email", userEmail);
		}
		return `${baseUrl}${separator}${params.toString()}`;
	};

	const handleCheckout = (url: string) => {
		if (url && url !== "#") {
			window.open(url, "_blank", "noopener,noreferrer");
			onClose();
		}
	};

	const modalTitle =
		limitType === "menu"
			? t("paywall.titleMenu")
			: limitType === "notes"
				? t("paywall.titleNotes")
				: limitType === "drafts"
					? t("paywall.titleDrafts")
					: plan === "free"
						? t("paywall.titleAiFree")
						: t("paywall.titleAiLimit");

	const modalDescription =
		limitType === "menu" ? (
			t("paywall.descMenu")
		) : limitType === "notes" ? (
			<>
				{t("paywall.descNotesLine1")}
				<br />
				{t("paywall.descNotesLine2")}
			</>
		) : limitType === "drafts" ? (
			<>
				{t("paywall.descDraftsLine1")}
				<br />
				{t("paywall.descDraftsLine2")}
			</>
		) : plan === "free" ? (
			<>
				{t("paywall.descAiFreeLine1")}
				<br />
				{t("paywall.descAiFreeLine2")}
			</>
		) : (
			t("paywall.descAiLimit")
		);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
				<div className="relative p-8 text-center text-neutral-900 overflow-y-auto flex-1">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onClose}
						aria-label={t("common.close")}
						className="absolute top-4 right-4 text-neutral-400 p-0 rounded-full size-8"
					>
						<X size={20} aria-hidden="true" />
					</Button>

					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
						<Crown size={32} aria-hidden="true" />
					</div>

					<h2 className="text-2xl font-bold mb-2 tracking-tight">
						{modalTitle}
					</h2>
					<p className="text-neutral-500 mb-6 leading-relaxed text-sm">
						{modalDescription}
					</p>

					{plan === "free" && (
						<div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 mb-6 text-left">
							<p className="text-xs font-bold text-neutral-900 mb-2.5">
								{t("paywall.everythingInPro")}
							</p>
							<ul className="space-y-2 text-xs text-neutral-600">
								<li className="flex items-center gap-2">
									<Check
										className="size-3.5 text-amber-500 shrink-0"
										aria-hidden="true"
									/>
									<span>
										<strong className="text-neutral-900 font-semibold">
											{t("paywall.featureNotesBold")}
										</strong>{" "}
										{t("paywall.featureNotesSuffix")}
									</span>
								</li>
								<li className="flex items-center gap-2">
									<Check
										className="size-3.5 text-amber-500 shrink-0"
										aria-hidden="true"
									/>
									<span>
										<strong className="text-neutral-900 font-semibold">
											{t("paywall.featureDraftsBold")}
										</strong>{" "}
										{t("paywall.featureDraftsSuffix")}
									</span>
								</li>
								<li className="flex items-center gap-2">
									<Check
										className="size-3.5 text-amber-500 shrink-0"
										aria-hidden="true"
									/>
									<span>
										<strong className="text-neutral-900 font-semibold">
											{t("paywall.featureCharsBold")}
										</strong>{" "}
										{t("paywall.featureCharsSuffix")}
									</span>
								</li>
								<li className="flex items-center gap-2">
									<Check
										className="size-3.5 text-amber-500 shrink-0"
										aria-hidden="true"
									/>
									<span>
										<strong className="text-neutral-900 font-semibold">
											{t("paywall.featureAiBold")}
										</strong>{" "}
										{t("paywall.featureAiSuffix")}
									</span>
								</li>
							</ul>
						</div>
					)}

					{plan === "free" && (
						<div className="space-y-2.5 mb-3">
							<Button
								type="button"
								variant="default"
								className="w-full rounded-full py-5 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm hover-safe:opacity-90"
								onClick={() => handleCheckout(getCheckoutUrl(monthlyBaseUrl))}
							>
								<span>{t("paywall.monthlyPlan")}</span>
								<ExternalLink
									className="size-3.5 text-white/70 ml-0.5"
									aria-hidden="true"
								/>
							</Button>
							<Button
								type="button"
								variant="outline"
								className="w-full rounded-full py-5 text-sm font-semibold flex items-center justify-center gap-2 border-action/30 hover-safe:bg-action/5 cursor-pointer"
								onClick={() => handleCheckout(getCheckoutUrl(yearlyBaseUrl))}
							>
								<Sparkles
									className="size-4 text-amber-500"
									aria-hidden="true"
								/>
								<span>{t("paywall.yearlyPlan")}</span>
								<ExternalLink
									className="size-3.5 text-neutral-400 ml-0.5"
									aria-hidden="true"
								/>
							</Button>
						</div>
					)}

					{plan === "free" && (
						<div className="mb-4">
							<button
								type="button"
								onClick={() => setIsPolarTrustOpen(!isPolarTrustOpen)}
								aria-expanded={isPolarTrustOpen}
								aria-controls="polar-trust-details"
								className="text-[11px] text-neutral-400 hover-safe:text-neutral-600 flex items-center justify-center gap-1.5 cursor-pointer py-1 mx-auto transition-colors"
							>
								<Lock className="size-3 text-neutral-400" aria-hidden="true" />
								<span>{t("paywall.secureCheckout")}</span>
								{isPolarTrustOpen ? (
									<ChevronUp
										className="size-3 text-neutral-400"
										aria-hidden="true"
									/>
								) : (
									<ChevronDown
										className="size-3 text-neutral-400"
										aria-hidden="true"
									/>
								)}
							</button>

							{isPolarTrustOpen && (
								<div
									id="polar-trust-details"
									className="bg-neutral-50 border border-neutral-100 rounded-xl p-3 mt-1.5 text-left text-[11px] text-neutral-500 leading-normal animate-in fade-in duration-150"
								>
									<ul className="space-y-1.5 list-disc list-inside">
										<li>{t("paywall.trustItem1")}</li>
										<li>{t("paywall.trustItem2")}</li>
										<li>{t("paywall.trustItem3")}</li>
									</ul>
								</div>
							)}
						</div>
					)}

					<Button
						type="button"
						variant="ghost"
						onClick={onClose}
						className="w-full rounded-full py-2 text-xs text-neutral-400 hover-safe:text-neutral-600 cursor-pointer"
					>
						{plan === "free" ? t("paywall.maybeLater") : t("paywall.gotIt")}
					</Button>
				</div>

				<div className="bg-neutral-50 px-8 py-3.5 text-center border-t border-neutral-100 shrink-0">
					<p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">
						{t("paywall.footerTagline")}
					</p>
				</div>
			</div>
		</div>
	);
}
