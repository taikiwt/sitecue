# Archive: Search Debounce Logic (入力による自動検索)

## 概要
このドキュメントは、以前 `apps/app/src/app/notes/_components/SearchInput.tsx` に実装されていた「ユーザーのタイピングに合わせて自動的に検索（URL遷移）を実行する」Debounceロジックのアーカイブです。

インフラ負荷（無料API枠の消費）の削減と、未保存ガード（`isDirty`）との競合を避けるために、現在は「Enterキーによる明示的実行」に置き換えられていますが、将来的に負荷の問題が解決し、よりシームレスなUXを提供したくなった際のリファレンスとして残しています。

## コアロジック (React Hook Pattern)

`useState` でローカルの入力値を保持し、`useEffect` と `setTimeout` を用いて、ユーザーの入力が一定時間（例: 300ms）止まったタイミングで `router.push` を発火させる標準的な実装パターンです。

```tsx
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 1. ローカルの入力状態を保持
  const [localQuery, setLocalQuery] = useState(searchParams.get("q") || "");

  // 2. Debounce（遅延実行）ロジック
  useEffect(() => {
    // ユーザーの入力が止まってから300ms後に実行される
    const timeoutId = setTimeout(() => {
      // 既存のクエリと変わらなければ何もしない（無限ループ防止）
      if (localQuery === searchParams.get("q")) return;

      const newParams = new URLSearchParams(searchParams.toString());
      if (localQuery.trim()) {
        newParams.set("q", localQuery);
        
        // 検索時は既存のコンテキスト（ドメイン絞り込み等）を解除する
        newParams.delete("domain");
        newParams.delete("exact");
      } else {
        newParams.delete("q");
      }
      
      // ルーティングを実行して検索結果を更新
      router.push(`/notes?${newParams.toString()}`);
    }, 300);

    // 次の入力があった場合は、前のタイマーをキャンセルする（クリーンアップ）
    return () => clearTimeout(timeoutId);
  }, [localQuery, searchParams, router]);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <input
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Search notes..."
      />
    </form>
  );
}
```

## 実装時の注意点（Lessons Learned）
このロジックを復活させる場合は、以下の点に注意すること。
1. **未保存ガードとの競合**: `router.push` が裏側で勝手に発火するため、Studio等で未保存状態（`isDirty === true`）の時にどう振る舞うか（遷移をブロックするか、検索窓自体をロックするか）を設計する必要がある。
2. **フォーカス強奪**: URLパラメータが変更されるとServer Componentが再レンダリングされるため、入力中（IME変換中など）にフォーカスが外れるバグが起きやすい。
