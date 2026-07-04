export interface SortableItem {
	id: string;
	sort_order?: number;
	created_at: string; // 順序一貫性保証のために必須化
}

/**
 * 上下ボタンによる順序移動のための、安全な Fractional Indexing オーダーを算出する純粋関数。
 */
export function calculateOrderForDirection<T extends SortableItem>(
	items: T[],
	targetId: string,
	direction: "up" | "down",
): number | null {
	const currentIndex = items.findIndex((item) => item.id === targetId);
	if (currentIndex === -1) return null;

	const currentOrder = items[currentIndex].sort_order ?? 0;
	const allOrders = items.map((item) => item.sort_order ?? 0);
	const minOrder = Math.min(...allOrders);
	const maxOrder = Math.max(...allOrders);

	const EPSILON = 1e-9;
	const OFFSET = 0.0001; // コンテキストに応じた極小のオフセット値

	if (direction === "up") {
		if (currentIndex === 0) return null;

		const targetAbove = items[currentIndex - 1];
		const targetAboveOrder = targetAbove.sort_order ?? 0;
		const targetTwoAbove = items[currentIndex - 2];

		if (!targetTwoAbove) {
			// 先頭アイテムを追い越す場合
			return targetAboveOrder - 1.0;
		}

		const twoAboveOrder = targetTwoAbove.sort_order ?? 0;

		// 境界線ブロック自動解消（防壁ロジック）: 同値衝突または中間値計算限界の検知
		if (
			Math.abs(currentOrder - targetAboveOrder) < EPSILON ||
			Math.abs(targetAboveOrder - twoAboveOrder) < EPSILON
		) {
			return targetAboveOrder - OFFSET;
		}

		if (targetAboveOrder <= twoAboveOrder || currentOrder <= targetAboveOrder) {
			return minOrder - 1.0;
		}

		const mid = (targetAboveOrder + twoAboveOrder) / 2.0;
		if (
			Math.abs(mid - targetAboveOrder) < EPSILON ||
			Math.abs(mid - twoAboveOrder) < EPSILON
		) {
			return targetAboveOrder - OFFSET;
		}
		return mid;
	} else {
		if (currentIndex === items.length - 1) return null;

		const targetBelow = items[currentIndex + 1];
		const targetBelowOrder = targetBelow.sort_order ?? 0;
		const targetTwoBelow = items[currentIndex + 2];

		if (!targetTwoBelow) {
			// 末尾アイテムを追い越す場合
			return targetBelowOrder + 1.0;
		}

		const twoBelowOrder = targetTwoBelow.sort_order ?? 0;

		// 境界線ブロック自動解消（防壁ロジック）: 同値衝突または中間値計算限界の検知
		if (
			Math.abs(currentOrder - targetBelowOrder) < EPSILON ||
			Math.abs(targetBelowOrder - twoBelowOrder) < EPSILON
		) {
			return targetBelowOrder + OFFSET;
		}

		if (targetBelowOrder >= twoBelowOrder || currentOrder >= targetBelowOrder) {
			return maxOrder + 1.0;
		}

		const mid = (targetBelowOrder + twoBelowOrder) / 2.0;
		if (
			Math.abs(mid - targetBelowOrder) < EPSILON ||
			Math.abs(mid - twoBelowOrder) < EPSILON
		) {
			return targetBelowOrder + OFFSET;
		}
		return mid;
	}
}
