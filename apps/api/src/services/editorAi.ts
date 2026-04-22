import {
	GoogleGenerativeAI,
	type ResponseSchema,
	SchemaType,
} from "@google/generative-ai";

export const generateReview = async (apiKey: string, content: string) => {
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

	const prompt = `Review the following draft and provide 1 to 3 constructive notes.
Draft content:
"""
${content}
"""`;

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

export const generateHint = async (apiKey: string, textContext: string) => {
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

	const prompt = `
  You are a professional editor and writing coach.
  The user will provide the end portion of their current draft.
  Your task is to provide a single, short "question" or "suggestion" that stimulates the user's thinking and hints at what to write next.

  [RULES]
  - DO NOT write a continuation or autocomplete the sentence.
  - Provide a thought-provoking question, such as "Do you have a specific example?", "What would a counter-argument be?", or "Why do you feel this way?".
  - Keep it extremely short and concise (under 40 characters).
  - DO NOT include any conversational filler like "Here is a suggestion" or "How about this:". Just output the direct question.
  - **CRITICAL: You MUST respond in the exact same language as the user's provided text.**

  [USER'S DRAFT]
  ${textContext}
  `;

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
