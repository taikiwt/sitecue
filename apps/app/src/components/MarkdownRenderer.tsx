"use client";

import { ExternalLink, WrapText } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { InlineCopyButton } from "@/components/ui/inline-copy-button";
import { cn } from "@/lib/utils";
import "highlight.js/styles/github.css";

// Make sure to add highlight.js theme in globals.css or here
// import "highlight.js/styles/github-dark.css";

// Helper to extract text from React nodes (recursively)
const extractText = (node: React.ReactNode): string => {
	if (typeof node === "string" || typeof node === "number") {
		return String(node);
	}
	if (Array.isArray(node)) {
		return node.map(extractText).join("");
	}
	if (React.isValidElement(node)) {
		return extractText((node.props as { children?: React.ReactNode }).children);
	}
	return "";
};

const ensureAbsoluteUrl = (url: string | undefined): string | undefined => {
	if (!url) return url;
	if (
		url.startsWith("http://") ||
		url.startsWith("https://") ||
		url.startsWith("mailto:") ||
		url.startsWith("tel:") ||
		url.startsWith("/") ||
		url.startsWith("#")
	) {
		return url;
	}
	return `https://${url}`;
};

interface CodeBlockNodeProps {
	children: React.ReactNode;
	className?: string;
	codeString: string;
}

function CodeBlockNode({
	children,
	className,
	codeString,
}: CodeBlockNodeProps) {
	const { t } = useTranslation();
	const [isWrapped, setIsWrapped] = useState(false);

	return (
		<div className="relative group my-4 not-prose min-w-0 w-full max-w-full">
			<div className="absolute top-2 right-2 z-[1] flex items-center gap-1 opacity-100 pointer-fine:opacity-0 group-hover-safe:opacity-100 transition-opacity duration-200">
				<button
					type="button"
					onClick={() => setIsWrapped(!isWrapped)}
					className="p-1.5 rounded-md bg-base-surface/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-base-border dark:border-neutral-700 text-gray-500 hover:text-action dark:hover:text-neutral-100 transition-colors cursor-pointer flex items-center justify-center"
					title={isWrapped ? t("common.disableWrap") : t("common.wrapText")}
				>
					<WrapText className="w-3.5 h-3.5" aria-hidden="true" />
				</button>
				<InlineCopyButton
					text={codeString}
					className="bg-base-surface/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-base-border dark:border-neutral-700 text-gray-500 hover:text-action dark:hover:text-neutral-100"
				/>
			</div>
			{/* codeblock */}
			<pre
				className={cn(
					"overflow-x-auto rounded-xl bg-base-bg dark:bg-neutral-900 border border-base-border dark:border-neutral-800 p-4 text-xs md:text-sm font-mono leading-relaxed transition-all duration-200 w-full max-w-full min-w-0",
					isWrapped && "whitespace-pre-wrap break-all",
				)}
			>
				<code className={className}>{children}</code>
			</pre>
		</div>
	);
}

function preserveBlankLines(markdown: string): string {
	if (!markdown) return markdown;
	const normalized = markdown.replace(/\r\n/g, "\n");
	// フェンスドコードブロック（``` または ~~~）を分割して保護
	const parts = normalized.split(/(^```[\s\S]*?^```|^~~~[\s\S]*?^~~~)/gm);
	return parts
		.map((part, index) => {
			// キャプチャグループ（奇数インデックス）はコードブロックなのでそのまま返す
			if (index % 2 === 1) return part;
			return part.replace(/\n{3,}/g, (match) => {
				const extraBlankLines = match.length - 2;
				return `\n\n${Array(extraBlankLines).fill("\u00A0").join("\n\n")}\n\n`;
			});
		})
		.join("");
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightReactNode(
	node: React.ReactNode,
	regex: RegExp,
	activeMatchIndex: number,
	matchCounter: { current: number },
	keyPrefix = "hl",
): React.ReactNode {
	if (typeof node === "string") {
		if (!node) return node;
		regex.lastIndex = 0;
		const parts = node.split(regex);
		if (parts.length === 1) return node;

		const nodes: React.ReactNode[] = [];
		let partOffset = 0;
		for (let i = 0; i < parts.length; i += 1) {
			const part = parts[i];
			if (!part) continue;
			if (i % 2 === 1) {
				const currentIndex = matchCounter.current;
				matchCounter.current += 1;
				const isActive = currentIndex === activeMatchIndex;
				nodes.push(
					<mark
						key={`${keyPrefix}-m-${currentIndex}`}
						data-search-match="true"
						data-search-active={isActive ? "true" : undefined}
						className={
							isActive
								? "bg-note-idea text-white rounded-xs px-0.5"
								: "bg-note-idea/25 text-inherit rounded-xs px-0.5"
						}
					>
						{part}
					</mark>,
				);
			} else {
				nodes.push(
					<React.Fragment key={`${keyPrefix}-t-${partOffset}`}>
						{part}
					</React.Fragment>,
				);
			}
			partOffset += part.length;
		}
		return nodes;
	}

	if (typeof node === "number") {
		return highlightReactNode(
			String(node),
			regex,
			activeMatchIndex,
			matchCounter,
			keyPrefix,
		);
	}

	if (Array.isArray(node)) {
		return node.map((child, idx) => {
			const childKey =
				React.isValidElement(child) && child.key !== null
					? String(child.key)
					: `${keyPrefix}-${idx}`;
			return highlightReactNode(
				child,
				regex,
				activeMatchIndex,
				matchCounter,
				childKey,
			);
		});
	}

	if (React.isValidElement(node)) {
		if (node.type === "mark") return node;
		const props = node.props as { children?: React.ReactNode };
		if (props.children === undefined || props.children === null) {
			return node;
		}
		return React.cloneElement(
			node,
			undefined,
			highlightReactNode(
				props.children,
				regex,
				activeMatchIndex,
				matchCounter,
				`${keyPrefix}-c`,
			),
		);
	}

	return node;
}

interface MarkdownRendererProps {
	content: string;
	className?: string;
	searchQuery?: string;
	activeMatchIndex?: number;
	onMatchCountChange?: (count: number) => void;
}

export default function MarkdownRenderer({
	content,
	className = "",
	searchQuery = "",
	activeMatchIndex = 0,
	onMatchCountChange,
}: MarkdownRendererProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const processedContent = preserveBlankLines(content);
	const trimmedQuery = searchQuery.trim();
	const hasSearch = trimmedQuery.length > 0;
	const searchRegex = hasSearch
		? new RegExp(`(${escapeRegExp(trimmedQuery)})`, "gi")
		: null;
	const matchCounter = { current: 0 };

	const withHighlight = (children: React.ReactNode): React.ReactNode => {
		if (!searchRegex) return children;
		return highlightReactNode(
			children,
			searchRegex,
			activeMatchIndex,
			matchCounter,
		);
	};

	const renderedMarkdown = (
		<ReactMarkdown
			remarkPlugins={[remarkGfm, remarkBreaks]}
			rehypePlugins={[rehypeHighlight]}
			components={{
				p: ({ children }) => <p>{withHighlight(children)}</p>,
				li: ({ children }) => <li>{withHighlight(children)}</li>,
				h1: ({ children }) => <h1>{withHighlight(children)}</h1>,
				h2: ({ children }) => <h2>{withHighlight(children)}</h2>,
				h3: ({ children }) => <h3>{withHighlight(children)}</h3>,
				h4: ({ children }) => <h4>{withHighlight(children)}</h4>,
				h5: ({ children }) => <h5>{withHighlight(children)}</h5>,
				h6: ({ children }) => <h6>{withHighlight(children)}</h6>,
				blockquote: ({ children }) => (
					<blockquote>{withHighlight(children)}</blockquote>
				),
				td: ({ children }) => <td>{withHighlight(children)}</td>,
				th: ({ children }) => <th>{withHighlight(children)}</th>,
				// Link Styling - Force external new tab
				a: ({ href, children }) => {
					const safeHref = ensureAbsoluteUrl(href);
					return (
						<a
							href={safeHref}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 text-action font-medium underline underline-offset-4 hover:text-action-hover transition-colors"
						>
							{children}
							<ExternalLink className="w-3 h-3" aria-hidden="true" />
						</a>
					);
				},
				// Code Styling
				code(props) {
					const { children, className, node: _node, ...rest } = props;
					const match = /language-(\w+)/.exec(className || "");
					const isBlock = match || String(children).includes("\n");

					if (!isBlock) {
						return (
							<code
								{...rest}
								className="px-1.5 py-0.5 bg-base-surface dark:bg-neutral-800 text-action dark:text-neutral-100 rounded font-mono text-[0.85em] before:content-none after:content-none"
							>
								{children}
							</code>
						);
					}

					// Block Code
					const rawText = extractText(children);
					const codeString = rawText.replace(/\n$/, "");

					return (
						<CodeBlockNode className={className} codeString={codeString}>
							{withHighlight(children)}
						</CodeBlockNode>
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
								className="w-4 h-4 rounded border-base-border text-action focus:ring-action mr-2"
							/>
						);
					}
					return <input {...props} />;
				},
			}}
		>
			{processedContent}
		</ReactMarkdown>
	);

	useEffect(() => {
		if (!trimmedQuery || !content) {
			onMatchCountChange?.(0);
			return;
		}
		const matches = containerRef.current?.querySelectorAll(
			'[data-search-match="true"]',
		);
		onMatchCountChange?.(matches?.length ?? 0);
	}, [trimmedQuery, content, onMatchCountChange]);

	useEffect(() => {
		if (!trimmedQuery) return;
		const matches = containerRef.current?.querySelectorAll(
			'[data-search-match="true"]',
		);
		const target = matches?.[activeMatchIndex];
		if (target && typeof target.scrollIntoView === "function") {
			target.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, [trimmedQuery, activeMatchIndex]);

	return (
		<div
			ref={containerRef}
			className={cn(
				"prose prose-sm md:prose-base dark:prose-invert max-w-none wrap-break-word",
				className,
			)}
		>
			{renderedMarkdown}
		</div>
	);
}
