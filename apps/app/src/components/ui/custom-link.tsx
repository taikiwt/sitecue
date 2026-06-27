"use client";

import type { VariantProps } from "class-variance-authority";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/useEditorStore";
import { buttonVariants } from "./button";

type CustomLinkProps = React.ComponentProps<typeof Link> &
	VariantProps<typeof buttonVariants>;

export const CustomLink = React.forwardRef<HTMLAnchorElement, CustomLinkProps>(
	({ onClick, href, variant, size, radius, className, ...props }, ref) => {
		const isDirty = useEditorStore((state) => state.isDirty);

		const handleClick = (
			e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
		) => {
			if (isDirty) {
				const confirmLeave = window.confirm(
					"You have unsaved changes. Are you sure you want to leave?",
				);
				if (!confirmLeave) {
					e.preventDefault();
					return;
				}
			}
			if (onClick) {
				onClick(e);
			}
		};

		// variant や size や radius が指定されている場合は buttonVariants を適用し、そうでなければピュアな Link として振る舞う
		const combinedClassName =
			variant || size || radius
				? cn(buttonVariants({ variant, size, radius, className }))
				: className;

		return (
			<Link
				href={href}
				{...props}
				onClick={handleClick}
				ref={ref}
				className={combinedClassName}
			/>
		);
	},
);

CustomLink.displayName = "CustomLink";
