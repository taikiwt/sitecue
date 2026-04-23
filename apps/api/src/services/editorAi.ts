import {
	GoogleGenerativeAI,
	type ResponseSchema,
	SchemaType,
} from "@google/generative-ai";
import { buildHintPrompt, buildReviewPrompt } from "../prompts/editorAi";

export const generateReview = async (
	apiKey: string,
	modelName: string,
	content: string,
) => {
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: modelName });

	const prompt = buildReviewPrompt(content);

	const responseSchema: ResponseSchema = {
		type: SchemaType.ARRAY,
		items: {
			type: SchemaType.OBJECT,
			properties: {
				type: {
					type: SchemaType.STRING,
					format: "enum",
					enum: ["info", "alert", "idea"],
					description:
						"Categorize as 'info' (objective/structural), 'alert' (warnings/flaws), or 'idea' (new perspectives).",
				},
				content: {
					type: SchemaType.STRING,
				},
			},
			required: ["type", "content"],
		},
	};

	const result = await model.generateContent({
		contents: [{ role: "user", parts: [{ text: prompt }] }],
		generationConfig: {
			responseMimeType: "application/json",
			responseSchema: responseSchema,
		},
	});

	const responseText = result.response.text();
	return JSON.parse(responseText) as Array<{
		type: "info" | "alert" | "idea";
		content: string;
	}>;
};

export const generateHint = async (
	apiKey: string,
	modelName: string,
	textContext: string,
) => {
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: modelName });

	const prompt = buildHintPrompt(textContext);

	const responseSchema: ResponseSchema = {
		type: SchemaType.OBJECT,
		properties: {
			hint: {
				type: SchemaType.STRING,
			},
		},
		required: ["hint"],
	};

	const result = await model.generateContent({
		contents: [{ role: "user", parts: [{ text: prompt }] }],
		generationConfig: {
			responseMimeType: "application/json",
			responseSchema: responseSchema,
		},
	});

	const responseText = result.response.text();
	const parsed = JSON.parse(responseText) as { hint: string };
	return parsed.hint;
};
