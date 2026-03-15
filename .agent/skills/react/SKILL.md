---
name: React & UI Rules
description: 楽観的UI、ソート描画、UX等に関するReactのリファレンスとルール
---

# React & UI Implementation Rules

## Optimistic UI (楽観的UI)

- **楽観的UI更新のフリーズ防止**: API通信を伴うUI操作（並び替え等）は、ロールバックの無限ループを防ぐため、通信中は必ずステート（`isSorting` 等）でUIをロック（`disabled`）すること。

## Sorting & Rendering

- **UIソートとデータソートの分離禁止**: 手動で並び替えられるリストの描画時、`.sort()` に他のカテゴリ等の強制ソート条件を混入させないこと（手動ソート順が反映されなくなるため）。

## UX & Styling

- **ツールチップのUX**: ネイティブの `title` 属性を使用する要素に `cursor-help` を付与しないこと。カーソル変化がツールチップの文字化け（？）と誤認されるため。
