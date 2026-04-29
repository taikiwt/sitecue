"use client";
/* ... logic remains same, just fixing the botched edit ... */
import { Crown, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface PaywallModalProps {
	isOpen: boolean;
	onClose: () => void;
	plan?: "free" | "pro";
	limitType?: "ai" | "notes" | "drafts";
}

export default function PaywallModal({
	isOpen,
	onClose,
	plan = "free",
	limitType = "ai",
}: PaywallModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
				<div className="relative p-8 text-center text-neutral-900">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onClose}
						aria-label="Close modal"
						className="absolute top-4 right-4 text-neutral-400"
					>
						<X size={20} aria-hidden="true" />
					</Button>

					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
						<Crown size={32} aria-hidden="true" />
					</div>

					<h2 className="text-2xl font-bold mb-2 tracking-tight">
						{limitType === "notes"
							? "Storage Limit Reached"
							: limitType === "drafts"
								? "Draft Limit Reached"
								: plan === "free"
									? "Monthly Generation Limit"
									: "Usage Limit Reached"}
					</h2>
					<p className="text-neutral-500 mb-8 leading-relaxed">
						{limitType === "notes" ? (
							<>
								{"You've reached the maximum number of notes."}
								<br />
								{"Upgrade your account to save unlimited notes."}
							</>
						) : limitType === "drafts" ? (
							<>
								{"Draft storage limit reached (50/50)."}
								<br />
								{"Upgrade your account to create unlimited drafts."}
							</>
						) : plan === "free" ? (
							<>
								{"You've used all your AI generations."}
								<br />
								{
									"Upgrade your account to enjoy extended generations and supercharge your writing process."
								}
							</>
						) : (
							<>
								{"You've reached the monthly limit for your current plan."}
								<br />
								{
									"Please wait for the next billing cycle to continue using AI features."
								}
							</>
						)}
					</p>

					{plan === "free" && (
						<Button
							type="button"
							variant="default"
							className="w-full rounded-2xl py-6 text-sm font-bold"
							onClick={() => {
								toast("Coming soon", { icon: "🚀" });
								onClose();
							}}
						>
							Upgrade Account
						</Button>
					)}
					<Button
						type="button"
						variant={plan === "free" ? "outline" : "default"}
						onClick={onClose}
						className="w-full rounded-2xl py-6 text-sm font-bold text-neutral-600"
					>
						{plan === "free" ? "Maybe Later" : "Got it"}
					</Button>
				</div>

				<div className="bg-neutral-50 px-8 py-4 text-center">
					<p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">
						Stay creative with sitecue
					</p>
				</div>
			</div>
		</div>
	);
}
