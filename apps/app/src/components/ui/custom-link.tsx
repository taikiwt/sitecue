"use client";

import Link from "next/link";
import React from "react";
import { useEditorStore } from "@/store/useEditorStore";

type CustomLinkProps = React.ComponentProps<typeof Link>;

export const CustomLink = React.forwardRef<HTMLAnchorElement, CustomLinkProps>(
	({ onClick, href, ...props }, ref) => {
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

		return <Link href={href} {...props} onClick={handleClick} ref={ref} />;
	},
);

CustomLink.displayName = "CustomLink";
