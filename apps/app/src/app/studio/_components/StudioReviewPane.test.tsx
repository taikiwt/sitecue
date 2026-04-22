/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import StudioReviewPane from "./StudioReviewPane";

describe("StudioReviewPane - AI Review", () => {
	it("should call onGenerateReview when AI Review button is clicked", async () => {
		const user = userEvent.setup();
		const mockGenerate = vi.fn().mockResolvedValue(undefined);

		render(
			<StudioReviewPane
				reviewNotes={[]}
				isLoadingReview={false}
				onAddNote={vi.fn()}
				onUpdateNote={vi.fn()}
				onDeleteNote={vi.fn()}
				onDeleteAllNotes={vi.fn()}
				onReorderNotes={vi.fn()}
				onInsertToEditor={vi.fn()}
				onWeave={vi.fn()}
				isWeaving={false}
				usageCount={0}
				plan="free"
				onGenerateReview={mockGenerate}
				isGeneratingReview={false}
			/>,
		);

		const aiButton = screen.getByRole("button", { name: /AI Review/i });
		await user.click(aiButton);

		expect(mockGenerate).toHaveBeenCalledTimes(1);
	});
});
