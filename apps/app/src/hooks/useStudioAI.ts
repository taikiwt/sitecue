import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import type { Note, Template } from "../../../../types/app";

export function useStudioAI() {
	const supabase = createClient();
	const [isWeaving, setIsWeaving] = useState(false);
	const [isGeneratingReview, setIsGeneratingReview] = useState(false);
	const [isGeneratingHint, setIsGeneratingHint] = useState(false);

	const generateWeave = async (
		content: string,
		reviewNotes: Note[],
		activeTemplate?: Template | null,
	): Promise<{
		newContent?: string;
		planError?: boolean;
		plan?: string;
		error?: Error;
	}> => {
		if (isWeaving) return {};
		setIsWeaving(true);
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) throw new Error("No session");

			const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787";
			const response = await fetch(`${apiUrl}/ai/weave`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.access_token}`,
				},
				body: JSON.stringify({
					contexts: reviewNotes,
					format: "markdown",
					draft_content: content,
					template_id: activeTemplate?.id || null,
				}),
			});

			if (response.status === 403) {
				const errData = await response.json();
				return {
					planError: true,
					plan: errData.plan,
					error: new Error(errData.plan),
				};
			}
			if (!response.ok) {
				const errData = await response.json();
				throw new Error(errData.error || "Failed to weave");
			}

			const data = await response.json();
			return { newContent: data.result };
		} catch (error) {
			const _err = error as Error;
			console.error("Weave failed:", _err);
			toast.error(
				"AIサーバーが混み合っています。少し待ってから再度お試しください。",
			);
			return { error: _err };
		} finally {
			setIsWeaving(false);
		}
	};

	const generateReview = async (
		content: string,
		initialDraftId?: string | null,
	): Promise<{
		newNotes?: Note[];
		planError?: boolean;
		plan?: string;
		error?: Error;
	}> => {
		if (isGeneratingReview) return {};
		setIsGeneratingReview(true);
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) throw new Error("No session");
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787";
			const res = await fetch(`${apiUrl}/ai/review`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.access_token}`,
				},
				body: JSON.stringify({ draft_content: content }),
			});
			if (!res.ok) {
				if (res.status === 403) {
					const errData = await res.json();
					return {
						planError: true,
						plan: errData.plan,
						error: new Error(errData.plan),
					};
				}
				throw new Error("API Error");
			}
			const data = await res.json();

			// biome-ignore lint/suspicious/noExplicitAny: AI API response type
			const newNotes: Note[] = data.reviews.map((r: any) => ({
				id: crypto.randomUUID(),
				content: r.content,
				note_type: r.type,
				draft_id: initialDraftId || null,
				scope: "draft",
				url_pattern: initialDraftId ? `sitecue://draft/${initialDraftId}` : "",
				user_id: session.user.id,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				is_expanded: false,
				is_favorite: false,
				is_pinned: false,
				is_resolved: false,
				sort_order: 0,
			}));

			return { newNotes };
		} catch (error) {
			const _err = error as Error;
			console.error("Failed to generate review:", _err);
			toast.error(
				"AIサーバーが混み合っています。少し待ってから再度お試しください。",
			);
			return { error: _err };
		} finally {
			setIsGeneratingReview(false);
		}
	};

	const generateHint = async (
		contextText: string,
		isExplicit: boolean = false,
	): Promise<string | null> => {
		if (isGeneratingHint) return null;

		setIsGeneratingHint(true);
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) return null;
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787";
			const res = await fetch(`${apiUrl}/ai/hint`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.access_token}`,
				},
				body: JSON.stringify({ text: contextText }),
			});
			if (!res.ok) {
				if (isExplicit) {
					toast.error(
						"AI補完の生成に失敗しました。時間をおいて再試行してください。",
					);
				}
				return null;
			}
			const data = await res.json();
			return data.hint;
		} catch (e) {
			const _err = e as Error;
			console.error("Hint failed:", _err);
			if (isExplicit) {
				toast.error(
					"AI補完の生成に失敗しました。時間をおいて再試行してください。",
				);
			}
			return null;
		} finally {
			setIsGeneratingHint(false);
		}
	};

	return {
		isWeaving,
		isGeneratingReview,
		isGeneratingHint,
		generateWeave,
		generateReview,
		generateHint,
	};
}
