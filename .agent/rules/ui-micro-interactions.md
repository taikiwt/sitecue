---
trigger: always_on
description: アニメーション共通ボタン（HoverRevealButton, HoverSwapButton, AnimatedIconButton）の設計思想と実装ルール
---

# UI Micro-interactions & Animation Rules

## 1. Core Concept (引き算の美学)
- UIのノイズ（常時表示されるテキストや過剰な装飾）を極力排除し、ユーザーの操作（ホバー・クリック）に対してのみ直感的で心地よいフィードバックを提供する。
- アニメーションは原則として **Tailwind CSS (`transition-all`, `duration-200~300`, etc.) によるGPUアクセラレーション** で実装し、JSライブラリ（framer-motion等）は原則使用しない。

## 2. Component Usage
新たにUIコンポーネントを作成・修正する際は、既存の `<Button>` を直接複雑にせず、以下のラッパーコンポーネントを要件に応じて使い分けること。

1. **`HoverRevealButton` (スライドイン型)**
   - 用途: アクションの意味をテキストで補足したい重要な操作（Edit, Delete等）。
   - 挙動: 通常はアイコンのみ。ホバー時に横からテキストがスライド出現する。
2. **`HoverSwapButton` (スワップ型)**
   - 用途: 状態変化を伴うワンアクション操作や代替アクション（Copy ⇔ Checkmark等）。
   - 挙動: ホバー時に縦方向のスライド＆フェードで別のアクションアイコンに入れ替わる。
3. **`AnimatedIconButton` (バウンス＆フィル型)**
   - 用途: ON/OFFのトグル状態を持つ機能（Pin, Favorite等）。
   - 挙動: ホバーで微拡大（`scale-110`）、クリックで微縮小（`scale-95`）。Active時に塗りつぶしアイコンへ遷移。

## 3. Strict Guidelines (Do's & Don'ts)
- **[DO] 隙間(Gap)の無効化:** `Button` コンポーネントをベースにする際、デフォルトの `gap` によってアイコンがセンタリングされない問題を防ぐため、必要に応じて `gap-0` と `px-2` を明示的に渡すこと。
- **[DO] レイアウトシフトの防止:** `HoverRevealButton` など横幅が変動する要素を配置する際は、Flexコンテナ等で隣接要素がガタつかないようレイアウトを保護すること。
- **[DO] アクセシビリティ:** 装飾目的のSVGアイコンには必ず `aria-hidden="true"` を付与すること。
- **[DON'T] 過剰な装飾の禁止:** スライド等のアニメーション自体が十分なフィードバックとなるため、ホバー時の背景色変化などは無効化（`hover:bg-transparent`）し、情報の衝突を防ぐこと。
