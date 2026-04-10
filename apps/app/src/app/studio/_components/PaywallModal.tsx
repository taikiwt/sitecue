"use client";

import { Crown, X } from "lucide-react";

interface PaywallModalProps {
	isOpen: boolean;
	onClose: () => void;
	limit: number;
}

export default function PaywallModal({
	isOpen,
	onClose,
	limit,
}: PaywallModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
				<div className="relative p-8 text-center text-neutral-900">
					<button
						type="button"
						onClick={onClose}
						aria-label="Close modal"
						className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
					>
						<X size={20} />
					</button>

					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
						<Crown size={32} />
					</div>

					<h2 className="text-2xl font-bold mb-2 tracking-tight">
						Monthly Generation Limit
					</h2>
					<p className="text-neutral-500 mb-8 leading-relaxed">
						You've used all {limit} generations for this period.
						<br />
						Upgrade to Pro to enjoy 100+ generations and supercharge your
						writing process.
					</p>

					<div className="flex flex-col gap-3">
						<button
							type="button"
							className="w-full rounded-2xl bg-neutral-900 py-4 text-sm font-bold text-white transition-all hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
						>
							Upgrade to Pro
						</button>
						<button
							type="button"
							onClick={onClose}
							className="w-full rounded-2xl bg-white border border-neutral-200 py-4 text-sm font-bold text-neutral-600 transition-all hover:bg-neutral-50 cursor-pointer"
						>
							Maybe Later
						</button>
					</div>
				</div>

				<div className="bg-neutral-50 px-8 py-4 text-center">
					<p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">
						Stay creative with SiteCue
					</p>
				</div>
			</div>
		</div>
	);
}
