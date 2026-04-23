import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { buildWeavePrompt } from "../prompts/ai";
import type { Bindings } from "../types";

export async function weaveDocument(
	env: Bindings,
	authHeader: string,
	body: {
		contexts: {
			url: string;
			content: string;
			note_type?: string;
			type?: string;
		}[];
		format: string;
		context_id?: string;
		draft_content?: string;
		template_id?: string;
	},
) {
	const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
		global: {
			headers: { Authorization: authHeader },
		},
	});

	const { contexts, format, context_id, draft_content, template_id } = body;

	if (!Array.isArray(contexts) || typeof format !== "string") {
		throw new Error("Invalid request body");
	}

	let referenceContent = "";
	if (context_id) {
		const { data: pageData, error: pageError } = await supabase
			.from("sitecue_page_contents")
			.select("content")
			.eq("id", context_id)
			.single();

		if (!pageError && pageData) {
			referenceContent = `【現在のページ内容】\n${pageData.content}`;

			await supabase
				.from("sitecue_page_contents")
				.delete()
				.eq("id", context_id);
		}
	}

	if (draft_content) {
		referenceContent += `${referenceContent ? "\n\n" : ""}【現在のドラフト本文】\n${draft_content}`;
	}

	const userNotesList = contexts
		.map((ctx, index) => {
			const kind = ctx.note_type || ctx.type || "unspecified";
			return `[メモ ${index + 1}]\nURL: ${ctx.url}\n種類: [${kind}]\n内容: ${ctx.content}`;
		})
		.join("\n\n");

	// --- テンプレートのWeave Prompt取得 ---
	let customWeavePrompt = "";
	if (template_id) {
		const { data: templateData, error: templateError } = await supabase
			.from("sitecue_templates")
			.select("weave_prompt")
			.eq("id", template_id)
			.single();

		if (!templateError && templateData) {
			// any型エラー回避のため明示的に型をアサーション
			const tData = templateData as { weave_prompt: string | null };
			customWeavePrompt = tData.weave_prompt || "";
		}
	}

	const fullPrompt = buildWeavePrompt(
		format,
		referenceContent,
		userNotesList,
		customWeavePrompt,
	);

	const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
	const modelName = env.GEMINI_MODEL_NAME || "gemini-2.5-flash";
	const model = genAI.getGenerativeModel({ model: modelName });

	const result = await model.generateContent(fullPrompt);
	const response = await result.response;
	const text = response.text();

	return text;
}
