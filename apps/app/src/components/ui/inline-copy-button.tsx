import { Check, Copy } from "lucide-react";
import { useState } from "react";

export const InlineCopyButton = ({
	text,
	className,
}: {
	text: string;
	className?: string;
}) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			className={`p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer shrink-0 ${className || ""}`}
			title="Copy to clipboard"
			aria-label="Copy to clipboard"
		>
			{copied ? (
				<Check className="w-4 h-4 text-green-500" aria-hidden="true" />
			) : (
				<Copy className="w-4 h-4" aria-hidden="true" />
			)}
		</button>
	);
};
