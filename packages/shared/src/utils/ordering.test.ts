import { describe, expect, it } from "vitest";
import { calculateOrderForDirection } from "./ordering";

describe("Ordering Utilities: calculateOrderForDirection", () => {
	it("正常な少数オーダーの隙間に正しく中間値が算出されること", () => {
		const items = [
			{ id: "A", sort_order: 1.0 },
			{ id: "B", sort_order: 2.0 },
			{ id: "C", sort_order: 3.0 },
		];
		// Bを上に移動 ➔ 先頭越えになるため全体の最小値(1.0) - 1.0 = 0
		expect(calculateOrderForDirection(items, "B", "up")).toBe(0);
		// Bを下に移動 ➔ 末尾越えになるため全体の最大値(3.0) + 1.0 = 4.0
		expect(calculateOrderForDirection(items, "B", "down")).toBe(4.0);
	});

	it("sort_orderがすべて同値(0)の競合地帯からの脱出時、既存の誰とも被らない全体境界値が割り当てられること", () => {
		const items = [
			{ id: "A", sort_order: 0 },
			{ id: "B", sort_order: 0 },
			{ id: "C", sort_order: 0 },
			{ id: "D", sort_order: 0 },
		];
		// 隙間がないため、Cを上に動かすと全体の最小値(0)から確実に引き算される
		expect(calculateOrderForDirection(items, "C", "up")).toBe(-1.0);
		// Bを下に動かすと全体の最大値(0)から確実に加算される
		expect(calculateOrderForDirection(items, "B", "down")).toBe(1.0);
	});

	it("【重要】すでに移動済みのマイナス値が存在する混迷状態でも、移動先での値の衝突を起こさずに確実なブレイク値を返すこと", () => {
		// ユーザー操作履歴によって一部のノートだけ先行してマイナス値になっているケース（2回クリックバグの原因モデル）
		const items = [
			{ id: "A", sort_order: -1.0 },
			{ id: "B", sort_order: 0 },
			{ id: "C", sort_order: 0 }, // Bと同値競合中
		];
		// Cを上に動かした際、単に B(0) - 1.0 をすると A(-1.0) と衝突して空振りする。
		// グローバル境界ロジックにより、全体の最小値(-1.0)からさらに引いた -2.0 が返ることを証明する。
		expect(calculateOrderForDirection(items, "C", "up")).toBe(-2.0);
	});

	it("移動不可な境界操作時はnullを返すこと", () => {
		const items = [
			{ id: "A", sort_order: 0 },
			{ id: "B", sort_order: 1 },
		];
		expect(calculateOrderForDirection(items, "A", "up")).toBeNull();
		expect(calculateOrderForDirection(items, "B", "down")).toBeNull();
	});
});
