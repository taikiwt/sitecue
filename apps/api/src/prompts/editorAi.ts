export const buildReviewPrompt = (
	content: string,
) => `Review the following draft and provide 1 to 3 constructive notes.
Draft content:
"""
${content}
"""`;

export const buildHintPrompt = (textContext: string) => `
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
