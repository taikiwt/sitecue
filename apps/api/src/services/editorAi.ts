import {
	GoogleGenerativeAI,
	type ResponseSchema,
	SchemaType,
} from "@google/generative-ai";

export const generateReview = async (apiKey: string, content: string) => {
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

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
	const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

	const prompt = `Provide a natural continuation, a transition, or a short next-step hint for the following incomplete draft. The hint should be very concise (under 50 characters) and flow logically from the context.

Context:
"""
${textContext}
"""`;

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
