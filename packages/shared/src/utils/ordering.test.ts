import { describe, expect, it } from "vitest";
import { calculateOrderForDirection } from "./ordering";

describe("Ordering Utilities: calculateOrderForDirection", () => {
	it("正常な少数オーダーの隙間に正しく中間値が算出されること", () => {
		const items = [
			{ id: "A", sort_order: 1.0, created_at: "2026-01-01T00:00:00.000Z" },
			{ id: "B", sort_order: 2.0, created_at: "2026-01-02T00:00:00.000Z" },
			{ id: "C", sort_order: 3.0, created_at: "2026-01-03T00:00:00.000Z" },
		];
		// Bを上に移動 -> 先頭アイテムAを追い越すため A(1.0) - 1.0 = 0
		expect(calculateOrderForDirection(items, "B", "up")).toBe(0);
		// Bを下に移動 -> 末尾アイテムCを追い越すため C(3.0) + 1.0 = 4.0
		expect(calculateOrderForDirection(items, "B", "down")).toBe(4.0);
	});

	it("sort_orderがすべて同値(0)の競合地帯からの脱出時、極小オフセットによる防壁防護で境界線をすり抜けること", () => {
		const items = [
			{ id: "A", sort_order: 0, created_at: "2026-01-01T00:00:00.000Z" },
			{ id: "B", sort_order: 0, created_at: "2026-01-02T00:00:00.000Z" },
			{ id: "C", sort_order: 0, created_at: "2026-01-03T00:00:00.000Z" },
			{ id: "D", sort_order: 0, created_at: "2026-01-04T00:00:00.000Z" },
		];
		// Cを上に動かすと、Bのsort_order(0)から極小オフセット(0.0001)が減算され、-0.0001になることを証明
		expect(calculateOrderForDirection(items, "C", "up")).toBe(-0.0001);
		// Bを下に動かすと、Cのsort_order(0)から極小オフセット(0.0001)が加算され、0.0001になることを証明
		expect(calculateOrderForDirection(items, "B", "down")).toBe(0.0001);
	});

	it("【重要】すでに移動済みのマイナス値が存在する混迷状態でも、移動先での衝突を起こさずにオフセットブレイク値を返すこと", () => {
		const items = [
			{ id: "A", sort_order: -1.0, created_at: "2026-01-01T00:00:00.000Z" },
			{ id: "B", sort_order: 0, created_at: "2026-01-02T00:00:00.000Z" },
			{ id: "C", sort_order: 0, created_at: "2026-01-03T00:00:00.000Z" },
		];
		// Cを上に動かした際、B(0)との衝突を検知して 0 - 0.0001 = -0.0001 となり、A(-1.0)と衝突せず安全に割り込めることを実証
		expect(calculateOrderForDirection(items, "C", "up")).toBe(-0.0001);
	});

	it("移動不可な境界操作時はnullを返すこと", () => {
		const items = [
			{ id: "A", sort_order: 0, created_at: "2026-01-01T00:00:00.000Z" },
			{ id: "B", sort_order: 1, created_at: "2026-01-02T00:00:00.000Z" },
		];
		expect(calculateOrderForDirection(items, "A", "up")).toBeNull();
		expect(calculateOrderForDirection(items, "B", "down")).toBeNull();
	});
});
