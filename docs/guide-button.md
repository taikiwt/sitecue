# Button関連のコンポーネントについて

## Button / HoverRevealButton コンポーネント ガイドライン

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

### 2. HoverRevealButton コンポーネント（スライドイン型）
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

### 💡 実装上の重要な掟（Must Do）

* **未保存ガードのすり抜け防止**
  ボタンの見た目で画面遷移を行う際、`onClick={() => router.push('/...')}` のように `useRouter` を直接使ってはいけません（未保存警告ダイアログをすり抜けてしまうため）。遷移が必要な場合は、必ず `HoverRevealButton` に `href` を渡すか、`<CustomLink>` に `buttonVariants` を当てて実装してください。
* **標準ボタンでのアイコン利用時**
  `HoverRevealButton` ではなく、通常の `<Button>` コンポーネントの中に直接アイコン（`lucide-react` 等）を配置する場合は自動付与が行われないため、引き続き手動で `<Pencil aria-hidden="true" />` のように指定し、スクリーンリーダーの読み上げノイズを防いでください。




## HoverSwapButton

ホバー時およびクリック時に、アイコンが上下にスライドして入れ替わるインタラクティブなボタンコンポーネントです。ユーザーのアクションに対する視覚的なフィードバック（完了状態の表示など）を直感的に提供します。

### 概要

- **ホバー時**: `defaultIcon` が上にスライドして消え、下から `hoverIcon` が現れます。
- **クリック時**: `hoverIcon` がさらに上にスライドし、下から `successIcon`（デフォルトはチェックマーク）が現れます。一定時間経過後、自動的に元の状態に戻ります。
- **カスタマイズ性**: 完了状態のアニメーションを無効化（`disableSuccessState`）することで、単なるホバー切り替えボタンやメニューのトリガーとしても使用可能です。

### Props (プロパティ)

標準の `React.ButtonHTMLAttributes<HTMLButtonElement>` を継承しているため、`className` や `onClick`、`disabled` などの標準属性もそのまま渡せます。

| プロパティ名 | 型 | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- |
| `defaultIcon` | `React.ReactNode` | **(必須)** | 初期状態で表示されるアイコン。 |
| `hoverIcon` | `React.ReactNode` | **(必須)** | マウスホバー時に表示されるアイコン。 |
| `successIcon` | `React.ReactNode` | `<Check className="w-4 h-4" />` | クリック時（完了状態）に表示されるアイコン。 |
| `stayDuration` | `number` | `1500` | クリック後、完了状態のアイコンが表示され続ける時間（ミリ秒）。 |
| `disableSuccessState` | `boolean` | `false` | `true` にすると、クリック時の完了アニメーション（`successIcon` への切り替え）を無効化します。 |

### 使用例

#### 1. 基本的な使い方（保存、コピー、新規作成など）
クリック後に「完了したこと」をユーザーに伝えたい場合に最適です。

````tsx
import { HoverSwapButton } from "@/components/HoverSwapButton";
import { Copy, CopyCheck } from "lucide-react";

export default function ExampleBasic() {
  const handleCopy = () => {
    navigator.clipboard.writeText("コピーするテキスト");
  };

  return (
    <HoverSwapButton
      defaultIcon={<Copy className="w-4 h-4" />}
      hoverIcon={<CopyCheck className="w-4 h-4" />}
      onClick={handleCopy}
    />
  );
}
````

#### 2. 完了状態を無効化する（メニューのトリガーなど）
ドロップダウンメニューを開くボタンなど、クリック後にチェックマークを出したくない場合は `disableSuccessState` を使用します。

````tsx
import { HoverSwapButton } from "@/components/HoverSwapButton";
import { Menu, MenuOpen } from "lucide-react";

export default function ExampleMenuTrigger() {
  return (
    <HoverSwapButton
      defaultIcon={<Menu className="w-4 h-4" />}
      hoverIcon={<MenuOpen className="w-4 h-4" />}
      disableSuccessState={true}
      onClick={() => console.log("メニューを開く")}
    />
  );
}
````

#### 3. カスタム完了アイコンと表示時間の変更
デフォルトのチェックマーク以外のアイコンを使用し、表示時間を短く（例：1秒）する例です。

````tsx
import { HoverSwapButton } from "@/components/HoverSwapButton";
import { Send, SendHorizontal, Rocket } from "lucide-react";

export default function ExampleCustomSuccess() {
  return (
    <HoverSwapButton
      defaultIcon={<Send className="w-4 h-4" />}
      hoverIcon={<SendHorizontal className="w-4 h-4" />}
      successIcon={<Rocket className="w-4 h-4 text-blue-500" />}
      stayDuration={1000} // 1秒で元のアイコンに戻る
    />
  );
}
````


