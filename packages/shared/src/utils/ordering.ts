export interface SortableItem {
	id: string;
	sort_order?: number;
}

/**
 * 上下ボタンによる順序移動のための、安全な Fractional Indexing オーダーを算出する純粋関数。
 * 移動先での同値衝突を防ぐため、隙間がない場合はリスト全体の最小値・最大値を基準に確実なブレイクを行う。
 * @param items 現在のソート済み配列（画面上の並び順通りであること）
 * @param targetId 移動させたいアイテムのID
 * @param direction 移動方向 ("up" または "down")
 * @returns 新たに割り当てるべき sort_order の少数値（移動不可な場合は null）
 */
export function calculateOrderForDirection<T extends SortableItem>(
	items: T[],
	targetId: string,
	direction: "up" | "down",
): number | null {
	const currentIndex = items.findIndex((item) => item.id === targetId);
	if (currentIndex === -1) return null;

	const currentOrder = items[currentIndex].sort_order ?? 0;

	// リスト全体の存在するオーダーの最小値と最大値を抽出（安全な外側境界の確保）
	const allOrders = items.map((item) => item.sort_order ?? 0);
	const minOrder = Math.min(...allOrders);
	const maxOrder = Math.max(...allOrders);

	if (direction === "up") {
		// すでに先頭の場合は移動不可
		if (currentIndex === 0) return null;

		const targetAbove = items[currentIndex - 1];
		const targetAboveOrder = targetAbove.sort_order ?? 0;
		const targetTwoAbove = items[currentIndex - 2];

		// Case 1: 追い越す相手が先頭アイテムだった場合
		if (!targetTwoAbove) {
			// 既存のどの値とも衝突しないよう、全体の最小値からさらに押し下げる
			return minOrder - 1.0;
		}

		// Case 2: 追い越す相手とその上のアイテムとの間に十分な「隙間」があるかを判定
		const twoAboveOrder = targetTwoAbove.sort_order ?? 0;

		// 隙間がない、あるいは移動元が既に上のアイテムと同値衝突している場合は、
		// 局所計算を捨てて全体の最小値を更新するセーフティを発動
		if (targetAboveOrder <= twoAboveOrder || currentOrder <= targetAboveOrder) {
			return minOrder - 1.0;
		}

		// 隙間が存在する場合は、純粋な中間値を算出して安全に割り込む
		return (targetAboveOrder + twoAboveOrder) / 2.0;
	} else {
		// すでに末尾の場合は移動不可
		if (currentIndex === items.length - 1) return null;

		const targetBelow = items[currentIndex + 1];
		const targetBelowOrder = targetBelow.sort_order ?? 0;
		const targetTwoBelow = items[currentIndex + 2];

		// Case 1: 追い越す相手が末尾アイテムだった場合
		if (!targetTwoBelow) {
			// 既存のどの値とも衝突しないよう、全体の最大値からさらに押し上げる
			return maxOrder + 1.0;
		}

		// Case 2: 追い越す相手とその下のアイテムとの間に十分な「隙間」があるかを判定
		const twoBelowOrder = targetTwoBelow.sort_order ?? 0;

		// 隙間がない、あるいは移動元が既に下のアイテムと同値衝突している場合は、
		// 全体の最大値を更新させて確実なごぼう抜きを保証する
		if (targetBelowOrder >= twoBelowOrder || currentOrder >= targetBelowOrder) {
			return maxOrder + 1.0;
		}

		// 隙間が存在する場合は、純粋な中間値を算出
		return (targetBelowOrder + twoBelowOrder) / 2.0;
	}
}
