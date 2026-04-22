import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateReview = async (apiKey: string, content: string) => {
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
	const prompt = `
You are an objective and insightful editor. Review the following draft and provide 1 to 3 constructive notes.
Notes must be categorized strictly as one of the following:
- "info": Objective facts, structural advice, or general tips.
- "alert": Warnings, logical flaws, typos, or things to avoid.
- "idea": New perspectives, suggestions for expansion, or creative inspiration.

Draft content:
"""
${content}
"""

Output strictly as a JSON array of objects with "type" and "content" properties.
Example: [{"type": "idea", "content": "Here is an idea..."}]
`;

	const result = await model.generateContent({
		contents: [{ role: "user", parts: [{ text: prompt }] }],
		generationConfig: { responseMimeType: "application/json" },
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
	const prompt = `
You are a writing assistant. Provide a natural continuation, a transition, or a short next-step hint for the following incomplete draft.
The hint should be very concise (under 50 characters) and flow logically from the context.

Context:
"""
${textContext}
"""

Output strictly as a JSON object with a single "hint" property.
Example: {"hint": "However, this approach introduces..."}
`;

	const result = await model.generateContent({
		contents: [{ role: "user", parts: [{ text: prompt }] }],
		generationConfig: { responseMimeType: "application/json" },
	});

	const responseText = result.response.text();
	const parsed = JSON.parse(responseText) as { hint: string };
	return parsed.hint;
};
