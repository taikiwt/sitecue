"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import "highlight.js/styles/github.css";

// Make sure to add highlight.js theme in globals.css or here
// import "highlight.js/styles/github-dark.css"; 

interface MarkdownRendererProps {
	content: string;
	className?: string;
}

export default function MarkdownRenderer({
	content,
	className = "",
}: MarkdownRendererProps) {
	const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

	const handleCopyCode = (code: string, id: string) => {
		navigator.clipboard.writeText(code);
		setCopiedCodeId(id);
		setTimeout(() => setCopiedCodeId(null), 2000);
	};

	return (
		<div
			className={cn(
				"prose prose-sm md:prose-base dark:prose-invert max-w-none break-words",
				className,
			)}
		>
			<ReactMarkdown
				remarkPlugins={[remarkGfm, remarkBreaks]}
				rehypePlugins={[rehypeHighlight]}
				components={{
					// Link Styling - Force external new tab
					a: ({ href, children }) => (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 text-neutral-900 font-medium underline underline-offset-4 hover:text-neutral-500 transition-colors"
						>
							{children}
							<ExternalLink className="w-3 h-3" aria-hidden="true" />
						</a>
					),
					// Code Styling
					code(props) {
						const { children, className, node, ...rest } = props;
						const match = /language-(\w+)/.exec(className || "");
						const isBlock = match || String(children).includes("\n");

						if (!isBlock) {
							return (
								<code
									{...rest}
									className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded font-mono text-[0.85em] before:content-none after:content-none"
								>
									{children}
								</code>
							);
						}

						// Block Code
						const codeString = String(children).replace(/\n$/, "");
						const uniqueId = Math.random().toString(36).substring(2, 9);
						const isCopied = copiedCodeId === uniqueId;

						return (
							<div className="relative group my-4 not-prose">
								<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
									<button
										type="button"
										onClick={() => handleCopyCode(codeString, uniqueId)}
										className="p-1.5 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all cursor-pointer"
										title="Copy code"
									>
										{isCopied ? (
											<Check className="w-3.5 h-3.5 text-green-500" />
										) : (
											<Copy className="w-3.5 h-3.5" />
										)}
									</button>
								</div>
								<pre className="overflow-x-auto rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 text-xs md:text-sm font-mono leading-relaxed">
									<code className={className}>{children}</code>
								</pre>
							</div>
						);
					},
					// Checkbox styling (remark-gfm)
					input: (props) => {
						if (props.type === "checkbox") {
							return (
								<input
									type="checkbox"
									checked={props.checked}
									readOnly
									className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 mr-2"
								/>
							);
						}
						return <input {...props} />;
					},
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
