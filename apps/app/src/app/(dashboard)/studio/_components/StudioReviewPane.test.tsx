import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import StudioReviewPane from "./StudioReviewPane";

describe("StudioReviewPane - AI Review", () => {
	it("should call onGenerateReview when AI Review button is clicked", async () => {
		const user = userEvent.setup();
		const mockGenerate = vi.fn().mockResolvedValue(undefined);

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		render(
			<QueryClientProvider client={queryClient}>
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
					onGenerateReview={mockGenerate}
					isGeneratingReview={false}
				/>
			</QueryClientProvider>,
		);

		const aiButton = screen.getByRole("button", { name: /AI Review/i });
		await user.click(aiButton);

		expect(mockGenerate).toHaveBeenCalledTimes(1);
	});
});
