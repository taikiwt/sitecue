"use client";

import toast from "react-hot-toast";

interface ComingSoonButtonProps {
	className?: string;
	text: string;
}

export function ComingSoonButton({ className, text }: ComingSoonButtonProps) {
	return (
		<button
			type="button"
			onClick={() => toast("Coming soon", { icon: "🚀" })}
			className={className}
		>
			{text}
		</button>
	);
}
