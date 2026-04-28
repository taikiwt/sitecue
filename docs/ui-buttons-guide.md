# Button Components & Micro-interactions Guide

このドキュメントは、sitecueにおけるボタン系コンポーネントの設計思想、種類、および実装時のルールをまとめたリファレンスです。

## 1. 共通設計思想：Touch-Safe & 引き算の美学

sitecueでは、視覚的ノイズを極力減らし、ユーザーの操作（ホバー・クリック）に対してのみ直感的で心地よいフィードバックを提供します。

**📱 Touch-Safe Architecture (スマホでのホバー張り付き防止)**
スマホなどのタッチデバイスにおいて、タップ後に背景色やアイコンが張り付く（Sticky Hover）現象を防ぐため、アプリ全体のアクティブ要素には標準の `hover:` ではなく、**必ず専用のカスタムバリアント（`hover-safe:` 等）を使用**します。

- `hover-safe:`: PC（マウス操作）時のみホバーエフェクトを発火させる。
- `group-hover-safe:` / `group-card-hover-safe:`: 親要素のホバーに連動させる（PC専用）。
- `pointer-fine:`: PC専用のスタイル（スマホでは隠すなど）を定義する。

---

## 2. ベースコンポーネント：`<Button>`

すべてのボタンの基礎となるコンポーネントです。shadcn/uiの設計を踏襲しつつ、内部のホバースタイルはすべて `hover-safe:` で保護されています。生の `<button>` タグは原則使用せず、必ずこのコンポーネントを使用してください。

### Usage
```tsx
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

<Button variant="default" size="sm" onClick={handleClick}>
  <Plus className="size-4" aria-hidden="true" />
  Add Note
</Button>
```

- **Variants:** `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`
- **Sizes:** `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`

---

## 3. アニメーション共通ボタン (Micro-interactions)

複雑な状態変化や説明を伴うアクションには、ベースの `<Button>` をラップした専用のコンポーネントを使用します。

### 3.1. `<HoverRevealButton>` (スライドイン型)
通常はアイコンのみを表示し、ホバー時に横からテキストが滑らかにスライド出現するボタンです。アクションの意味を補足したい重要な操作（Edit, Delete等）に使用します。

- **仕様:**
  - `href` プロパティを渡すと自動的に `<CustomLink>` としてレンダリングされます。
  - 親要素の背景を透けさせるため、内部で `hover-safe:bg-transparent` が適用されています。

**Usage:**
```tsx
import { HoverRevealButton } from "@/components/ui/hover-reveal-button";
import { Pencil } from "lucide-react";

// ボタンとして使用
<HoverRevealButton
  type="button"
  onClick={handleEdit}
  icon={<Pencil className="size-4" aria-hidden="true" />}
  text="Edit"
  // 呼び出し側で背景色を指定する場合は、必ず hover-safe: と ! (Important) で優先度を合わせる
  className="bg-action hover-safe:bg-action! text-action-text hover-safe:text-action-text!"
/>

// リンクとして使用
<HoverRevealButton
  href="/notes/123"
  icon={<ExternalLink className="size-4" aria-hidden="true" />}
  text="Open Note"
/>
```

### 3.2. `<HoverSwapButton>` (スワップ＆サクセス型)
ホバー時にアイコンが入れ替わり（スライド＆フェード）、クリック時にさらに別のアイコン（Success等）へ遷移するボタンです。ワンアクションで完結する操作（Copy, Check等）に使用します。

- **仕様:**
  - CSSの優先度競合を防ぐため、クリック後のSuccess状態はJS（ステート）で制御されています。
  - `disableSuccessState={true}` を渡すと、クリック時のアニメーションを無効化できます。

**Usage:**
```tsx
import { HoverSwapButton } from "@/components/ui/hover-swap-button";
import { Copy, Check, CopyCheck } from "lucide-react";

<HoverSwapButton
  onClick={handleCopy}
  defaultIcon={<Copy className="size-4 text-gray-500" aria-hidden="true" />}
  hoverIcon={<CopyCheck className="size-4 text-action" aria-hidden="true" />}
  successIcon={<Check className="size-4 text-success" aria-hidden="true" />}
  stayDuration={2000} // Successアイコンの表示時間(ms)
/>
```

### 3.3. `<AnimatedIconButton>` (バウンス＆トグル型)
ホバーで微拡大し、クリックで微縮小（バウンス）するトグル用ボタンです。Active状態になると、塗りつぶしアイコンなどにフェード遷移します。Pin（固定）やFavorite（お気に入り）等の状態を持つ機能に使用します。

**Usage:**
```tsx
import { AnimatedIconButton } from "@/components/ui/animated-icon-button";
import { Star } from "lucide-react";

<AnimatedIconButton
  onClick={() => setIsFavorite(!isFavorite)}
  isActive={isFavorite}
  icon={<Star className="size-4 text-gray-400" aria-hidden="true" />}
  activeIcon={<Star className="size-4 text-yellow-500 fill-current" aria-hidden="true" />}
/>
```

---

## 4. 実装時の絶対ルール (Checklist)

新しいボタンを実装、または既存のUIを修正する際は以下を確認してください。

1. **✅ アイコンのアクセシビリティ:**
   Lucide React 等の装飾用SVGアイコンには、必ず `aria-hidden="true"` を付与すること（スクリーンリーダーへのノイズ排除）。
   *例: `<Search className="size-4" aria-hidden="true" />`*
2. **✅ 呼び出し側のカスタムバリアント:**
   アニメーションボタンに対して外側からホバー時の色（`bg-xxx` 等）を指定・上書きする場合は、必ず `hover-safe:` を使用し、必要に応じて末尾に `!` を付けて競合を防ぐこと。
3. **✅ 隙間(Gap)の無効化への配慮:**
   `<Button>` コンポーネントはデフォルトで `gap-1.5` などの隙間を持ちます。`<HoverRevealButton>` などの内部でアイコンのセンタリングが崩れる場合は、コンポーネント内で `gap-0` と `px-4` 等の余白調整を行ってレイアウトを保護すること。
4. **✅ CSS Specificity (優先度) 競合の回避:**
   状態遷移（Active, Successなど）とホバー（hover-safe）が組み合わさるコンポーネントを新規作成する場合、`!` でCSSをねじ伏せるのではなく、可能な限りReactのステート（三項演算子）を用いて適用するクラス文字列自体を出し分けること。