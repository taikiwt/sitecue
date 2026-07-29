import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SWRBoundary } from "./swr-boundary";

describe("SWRBoundary - 200ms Encapsulated Timer & 0ms Bypass", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	it("bypasses fallback immediately (0ms) when data exists on initial render", () => {
		render(
			<SWRBoundary
				data={{ name: "Test" }}
				isLoading={false}
				fallback={<div>Skeleton</div>}
			>
				{(data) => <div>Data: {data.name}</div>}
			</SWRBoundary>,
		);

		expect(screen.getByText("Data: Test")).toBeInTheDocument();
		expect(screen.queryByText("Skeleton")).not.toBeInTheDocument();
	});

	it("holds skeleton for 200ms when transitioning from loading to ready to prevent flicker", () => {
		const { rerender } = render(
			<SWRBoundary
				data={undefined}
				isLoading={true}
				fallback={<div>Skeleton</div>}
			>
				{(data: { name: string }) => <div>Data: {data.name}</div>}
			</SWRBoundary>,
		);

		expect(screen.getByText("Skeleton")).toBeInTheDocument();

		rerender(
			<SWRBoundary
				data={{ name: "Arrived" }}
				isLoading={false}
				fallback={<div>Skeleton</div>}
			>
				{(data: { name: string }) => <div>Data: {data.name}</div>}
			</SWRBoundary>,
		);

		expect(screen.getByText("Skeleton")).toBeInTheDocument();

		act(() => {
			vi.advanceTimersByTime(200);
		});

		expect(screen.getByText("Data: Arrived")).toBeInTheDocument();
		vi.useRealTimers();
	});

	it("bypasses skeleton immediately when isDataReady returns true", () => {
		const partialData = { id: "1", content: "Hello World" };

		render(
			<SWRBoundary
				data={partialData}
				isLoading={false}
				isDataReady={(d) => d.content !== undefined}
				fallback={<div data-testid="skeleton">Loading...</div>}
			>
				{(data) => <div data-testid="content">{data.content}</div>}
			</SWRBoundary>,
		);

		expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
		expect(screen.getByTestId("content")).toHaveTextContent("Hello World");
	});

	it("renders skeleton when isDataReady returns false even if data is defined", () => {
		const incompleteData = { id: "1", content: undefined };

		render(
			<SWRBoundary
				data={incompleteData}
				isLoading={true}
				isDataReady={(d) => d.content !== undefined}
				fallback={<div data-testid="skeleton">Loading...</div>}
			>
				{(data) => <div data-testid="content">{data.content}</div>}
			</SWRBoundary>,
		);

		expect(screen.getByTestId("skeleton")).toBeInTheDocument();
		expect(screen.queryByTestId("content")).not.toBeInTheDocument();
	});
});
