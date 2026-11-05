import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
	modules: ["@wxt-dev/module-react"],

	// ZIP生成時の不要ファイル除外設定を追加
	zip: {
		exclude: ["*_dev_*.png"],
	},

	// Tailwind v4 用の Vite プラグイン設定
	vite: () => ({
		plugins: [tailwindcss()],
	}),

	// 開発サーバー用
	dev: {
		server: {
			port: 3001,
		},
	},

	// ブラウザを自動起動させない設定
	webExt: {
		disabled: true,
	},

	// manifest.json の完全な代わり
	manifest: ({ command }) => ({
		default_locale: "en",
		name: command === "serve" ? "[DEV] sitecue" : "__MSG_extName__",
		// version: "1.2.0", // package.jsonの記載が反映されるので不要
		description: "__MSG_extDescription__",
		action: {
			default_title: "__MSG_actionTitle__",
		},
		// 動的アイコン切り替え（開発時は _dev_ アイコンを使用）
		icons:
			command === "serve"
				? {
						"16": "sitecue_icon_dev_16.png",
						"32": "sitecue_icon_dev_32.png",
						"48": "sitecue_icon_dev_48.png",
						"128": "sitecue_icon_dev_128.png",
					}
				: {
						"16": "sitecue_icon16.png",
						"32": "sitecue_icon32.png",
						"48": "sitecue_icon48.png",
						"128": "sitecue_icon128.png",
					},
		permissions: ["sidePanel", "activeTab", "storage", "tabs", "identity"],
		optional_host_permissions: [],
		// 開発時のみローカル API 通信を許可
		host_permissions:
			command === "serve"
				? ["http://localhost:8787/*", "http://127.0.0.1:54321/*"]
				: [],
		commands: {
			_execute_action: {
				suggested_key: {
					default: "Ctrl+Shift+E",
					mac: "Command+Shift+E",
				},
			},
		},
	}),
});
