import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // モノレポ環境で複数のReactが読み込まれるのを強制的に防ぐ（ベストプラクティスとして保持）
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // 探索範囲をsrc以下に限定する設定はパフォーマス向上のため保持
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
