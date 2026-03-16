import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom", // ブラウザ環境をシミュレート
    globals: true, // import { describe, it, expect } を省略可能にする
    setupFiles: ["./src/setupTests.ts"], // テスト実行前に読み込むファイル
  },
});
