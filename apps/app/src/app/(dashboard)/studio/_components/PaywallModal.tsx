"use client";

import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaywallModalProps {
	isOpen: boolean;
	onClose: () => void;
	plan: "free" | "pro"; // limit から plan に変更
}

export default function PaywallModal({
	isOpen,
	onClose,
	plan,
}: PaywallModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
				<div className="relative p-8 text-center text-neutral-900">
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						aria-label="Close modal"
						className="absolute top-4 right-4 text-neutral-400"
					>
						<X size={20} />
					</Button>

					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
						<Crown size={32} />
					</div>

					<h2 className="text-2xl font-bold mb-2 tracking-tight">
						{plan === "free" ? "Monthly Generation Limit" : "Pro Limit Reached"}
					</h2>
					<p className="text-neutral-500 mb-8 leading-relaxed">
						{plan === "free" ? (
							<>
								You've used all your Free plan AI generations.
								<br />
								Upgrade to Pro to enjoy 100+ generations and supercharge your
								writing process.
							</>
						) : (
							<>
								You've reached the monthly limit for your Pro plan.
								<br />
								Please wait for the next billing cycle to continue using AI
								features.
							</>
						)}
					</p>

					<div className="flex flex-col gap-3">
						{plan === "free" && (
							<Button
								variant="default"
								className="w-full rounded-2xl py-6 text-sm font-bold"
							>
								Upgrade to Pro
							</Button>
						)}
						<Button
							variant={plan === "free" ? "outline" : "default"}
							onClick={onClose}
							className="w-full rounded-2xl py-6 text-sm font-bold text-neutral-600"
						>
							{plan === "free" ? "Maybe Later" : "Got it"}
						</Button>
					</div>
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
