# Button / HoverRevealButton コンポーネント ガイドライン

sitecue の UI における視覚的ノイズを最小限に抑えつつ、直感的なフィードバックと堅牢なルーティングを提供するためのボタン実装ガイドラインです。

## 1. Button コンポーネント
すべてのボタンの基礎となるコンポーネントです。App Basecamp（Webアプリ側）では、生の `<button>` タグの使用は原則禁止されており、必ずこのコンポーネントを使用します。

* **特徴**: `variant`（`default`, `outline`, `ghost`, `link` 等）と `size` を指定することで、プロジェクトのセマンティックカラーに準拠したボタンを安全に呼び出せます。

**使用例:**
````tsx
import { Button } from "@/components/ui/button";

// 通常のアクションボタン
<Button variant="default" onClick={handleSave}>
  Save
</Button>

// 目立たせないサブアクション（背景透明）
<Button variant="ghost" onClick={handleCancel}>
  Cancel
</Button>
````

## 2. HoverRevealButton コンポーネント（スライドイン型）
通常時はアイコンのみを表示して画面のノイズを減らし、ホバー時にのみアクションを説明するテキストが横から滑らかに展開するコンポーネントです。

* **特徴と組み込み機能**:
  * **賢いルーティング（自動切り替え）**: `href` プロパティを渡すだけで、自動的に `<Button>` から未保存ガード付きの `<CustomLink>` に切り替わります。Next.jsのルーティングを安全に処理しつつ、見た目は完全にボタンとして機能します。
  * **アクセシビリティの自動最適化**: 渡された `icon`（SVG等）に対して、コンポーネント内部で自動的に `aria-hidden="true"` を付与します。呼び出し側で記述する必要はありません。
  * **滑らかなアニメーション**: CSS Grid を用いた幅の自動計算により、文字数に関わらずカクつきのないスムーズな展開を実現しています。

**使用例（クリックで処理を実行するボタンとして）:**
````tsx
import { HoverRevealButton } from "@/components/ui/hover-reveal-button";
import { Trash2 } from "lucide-react";

// aria-hidden="true" は自動付与されるため記述不要です
<HoverRevealButton
  icon={<Trash2 />}
  text="Delete Note"
  onClick={handleDelete}
  className="text-note-alert hover:text-note-alert/80" // 警告色の指定
/>
````

**使用例（別ページへ遷移するリンクとして）:**
````tsx
import { HoverRevealButton } from "@/components/ui/hover-reveal-button";
import { Pencil } from "lucide-react";

<HoverRevealButton
  href={`/studio/${draft.id}`} // hrefを渡すと自動的にCustomLinkになる
  icon={<Pencil />}
  text="Edit in Studio"
  className="bg-action text-action-text hover:bg-action-hover"
/>
````

## 💡 実装上の重要な掟（Must Do）

* **未保存ガードのすり抜け防止**
  ボタンの見た目で画面遷移を行う際、`onClick={() => router.push('/...')}` のように `useRouter` を直接使ってはいけません（未保存警告ダイアログをすり抜けてしまうため）。遷移が必要な場合は、必ず `HoverRevealButton` に `href` を渡すか、`<CustomLink>` に `buttonVariants` を当てて実装してください。
* **標準ボタンでのアイコン利用時**
  `HoverRevealButton` ではなく、通常の `<Button>` コンポーネントの中に直接アイコン（`lucide-react` 等）を配置する場合は自動付与が行われないため、引き続き手動で `<Pencil aria-hidden="true" />` のように指定し、スクリーンリーダーの読み上げノイズを防いでください。
