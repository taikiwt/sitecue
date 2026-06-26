# sitecue カプセル型UIシステム（Button / CustomLink）実装・拡張ガイド 

最終更新日: 2026-06-26

本ドキュメントは、sitecueのApp Basecampにおけるデザインの一貫性を維持し、角丸のマジックナンバー混在を物理的に防ぐために構築された「カプセル型（rounded-full）UIシステム」の仕様、使い方、および手打ちでの拡張手順をまとめた開発者向けガイドです。

## 1. システムの設計思想（Why）

sitecueのUIは「引き算の美学」をベースとしており、不要な装飾を排除したクリーンなデザインを標準としています。しかし、単に一律で `rounded-full` を適用するだけでは、要素の中身（テキストのみ、アイコンのみ、テキスト＋アイコン）の組み合わせによって、以下のような問題が発生します。

* アイコン単体の場合に長円（楕円）に歪んでしまう。
* テキストの左右の余白が詰まり、文字が角丸のカーブに圧迫されて見える。

本システムでは、これらの物理的な衝突を `cva` (Class Variance Authority) のロジック層（複合バリアント: `compoundVariants`）で自動制御し、開発者が意識せずとも常に美しい黄金比長円、および完全な正円が描画されるよう設計されています。

---

## 2. Button コンポーネントの使い方

### 2.1. 基本的なパラメータ（引数）

`Button` コンポーネントは、型安全に管理された以下の3つのコアバリアントプロパティを持ちます。

| プロパティ | 型 / 選択肢 | デフォルト値 | 説明 |
| --- | --- | --- | --- |
| `variant` | `"default" | "outline" | "secondary" | "ghost" | "destructive" | "link"` | `"default"` | ボタンの視覚的スタイル（背景色や文字色） |
| `size` | `"default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"` | `"default"` | ボタンのサイズ（通常サイズ、またはアイコン専用サイズ） |
| `radius` | `"full" | "lg"` | `"full"` | 角丸の形状。原則として `"full"` (カプセル型) を標準とする |

### 2.2. 手打ちでの実装コード例

通常テキストのボタン、およびアイコン専用のボタンは以下のように呼び出します。`className` で直接パディングや角丸を指定する必要はありません。

```tsx
import { Button } from "@/components/ui/button";
import { Save, MoreHorizontal } from "lucide-react";

// 1. 通常のテキストボタン（自動的に左右パディングが px-4 に拡張され、美しい長円になります）
<Button variant="default" size="default">
  Save Note
</Button>

// 2. アイコン＋テキストのボタン（gap-1.5 や px-4 が自動適用されます）
<Button variant="outline" size="sm">
  <Save aria-hidden="true" />
  Save Changes
</Button>

// 3. アイコン専用のボタン（自動的にパディングが 0 にリセットされ、完全な正円 size-8 になります）
<Button variant="ghost" size="icon" aria-label="More options">
  <MoreHorizontal aria-hidden="true" />
</Button>

// 4. 【レガシー互換】どうしても従来の四角い角丸（rounded-lg）にしたい場合
<Button radius="lg">
  Legacy Style Button
</Button>

```

---

## 3. CustomLink コンポーネントの使い方

`CustomLink` は、Next.jsの `Link` をベースに、未保存データの離脱ガード（`isDirty` 状態の監視）をカプセル化したラッパーコンポーネントです。
今回の拡張により、**`Button` と全く同じバリアントプロパティ（`variant`, `size`, `radius`）を直接受け取れる**ようになりました。

### 3.1. 手打ちでの実装コード例

ボタンと全く同じカプセル形状（長円・正円）を、`className` にTailwindクラスをベタ書きすることなく、型安全に実装できます。

```tsx
import { CustomLink } from "@/components/ui/custom-link";
import { Plus, Settings } from "lucide-react";

// 1. ボタンの見た目をしたカプセル型ナビゲーションリンク
<CustomLink href="/studio/new" variant="default" size="default">
  <Plus aria-hidden="true" />
  New Draft
</CustomLink>

// 2. ゴーストスタイルのアイコン正円リンク（設定画面へのスマートな遷移など）
<CustomLink href="/settings" variant="ghost" size="icon" aria-label="Settings">
  <Settings aria-hidden="true" />
</CustomLink>

// 3. スタイルを当てない通常のプレーンなテキストリンクとして使いたい場合
// (variant などを渡さなければ、従来の純粋な Link として動作します)
<CustomLink href="/notes" className="text-sm underline">
  Back to Notes
</CustomLink>

```

---

## 4. 複合バリアント（compoundVariants）による自動制御の仕組み

`apps/app/src/components/ui/button.tsx` の内部では、形状の破綻を防ぐために `compoundVariants` が以下のように定義されています。手動で調整を行う際は、このロジックがすべての形状の正とするSSOT（唯一の情報源）となります。

1. **長円の文字保護ルール:** `radius: "full"` かつ `size: "default"` などのテキストが含まれる通常サイズの場合、左右のパディングを自動的に `px-4` や `px-3.5` に上書き拡張し、文字が角丸のカーブに圧迫されるのを防ぎます。
2. **正円の絶対死守ルール:** `radius: "full"` かつ `size: "icon"` などのアイコン専用サイズが指定された場合、余計なパディングを `p-0` に強制リセットし、縦横等価の `size-8` / `size-7` などで要素の物理寸法を完全に固定することで、綺麗な正円を維持します。

---

## 5. 細かい調整・新しいバリアントの拡張手順

今後、「新しいサイズ」や「新しい角丸形状」を追加したくなった場合は、以下のステップで `button.tsx` を手打ち修正してください。

### ステップ 1: `variants` に新しい選択肢を追加する

`apps/app/src/components/ui/button.tsx` の `buttonVariants` の中にある `variants` オブジェクトを編集します。
例えば、新しく中間的な角丸形状 `"md"`（`rounded-md`）を追加したい場合は、以下のように追記します。

```typescript
// apps/app/src/components/ui/button.tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: { ... },
      size: { ... },
      radius: {
        full: "rounded-full",
        lg: "rounded-lg",
        md: "rounded-md", // 👈 手打ちで新設！
      }
    },
    // ...
  }
);

```

### ステップ 2: `compoundVariants` に黄金比ルールを追記する

新設したバリアントが適用された際、特定のサイズと組み合わさったときにパディングやサイズが最適化されるよう、`compoundVariants` 配列の末尾にオブジェクトを追加します。

```typescript
compoundVariants: [
  // 既存のルール...
  { radius: "full", size: "default", className: "px-4" },

  // 👈 手打ちで新設した radius: "md" の時のパディング黄金比を定義
  { radius: "md", size: "default", className: "px-3" },
  { radius: "md", size: "sm", className: "px-2.5" },
],

```

これだけで、`Button` だけでなく、型がブレンドされている `CustomLink` にも自動的に新しい `radius="md"` の指定が安全に伝播・利用可能になります。

---

## 6. 開発時の禁止事項・注意点（Negative Constraints）

* **個別の角丸ベタ書きの禁止:** 呼び出し側の各ページやペインのコード内で、`className="... rounded-full"` や `className="... rounded-lg"` をインラインで手動ベタ書きしないでください。形状を変更したい場合は、必ず `radius` プロパティ（`radius="full"` や `radius="lg"`）を経由してください。
* **アイコン専用ボタンのパディング上書き禁止:** `size="icon"` などを指定しているボタンに対して、外部から `className="p-2"` などを無理やり付与しないでください。正円のバランスが崩れ、歪んだ楕円形になる原因となります。
* **アクセシビリティ（a11y）の遵守:** ボタン要素を手打ちで調整・新設する際は、必ず `type="button"` または `type="submit"` を明記し、装飾用のSVGアイコンには `aria-hidden="true"` を付与してください。
