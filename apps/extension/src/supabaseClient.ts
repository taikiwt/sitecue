import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const customStorageAdapter = {
	getItem: async (key: string) => {
		// Chrome拡張機能の環境かチェック
		if (
			typeof chrome !== "undefined" &&
			chrome.storage &&
			chrome.storage.local
		) {
			const result = await chrome.storage.local.get(key);
			return (result[key] as string) || null;
		}
		// 普通のブラウザ環境なら localStorage を使用
		if (typeof localStorage !== "undefined") {
			return localStorage.getItem(key);
		}
		return null;
	},
	setItem: async (key: string, value: string) => {
		if (
			typeof chrome !== "undefined" &&
			chrome.storage &&
			chrome.storage.local
		) {
			await chrome.storage.local.set({ [key]: value });
			return;
		}
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(key, value);
		}
	},
	removeItem: async (key: string) => {
		if (
			typeof chrome !== "undefined" &&
			chrome.storage &&
			chrome.storage.local
		) {
			await chrome.storage.local.remove(key);
			return;
		}
		if (typeof localStorage !== "undefined") {
			localStorage.removeItem(key);
		}
	},
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: customStorageAdapter,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
	},
});

// ゲストモード用ローカルストレージアダプター
// biome-ignore lint/suspicious/noExplicitAny: guest storage returns raw array of records
async function getLocalStorage(key: string): Promise<any[]> {
	if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
		const res = await chrome.storage.local.get(key);
		// biome-ignore lint/suspicious/noExplicitAny: extension storage return type mapping
		return (res[key] as any[]) || [];
	}
	if (typeof localStorage !== "undefined") {
		const res = localStorage.getItem(key);
		return res ? JSON.parse(res) : [];
	}
	return [];
}

// biome-ignore lint/suspicious/noExplicitAny: guest storage accepts raw array of records
async function setLocalStorage(key: string, data: any[]): Promise<void> {
	if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
		await chrome.storage.local.set({ [key]: data });
		return;
	}
	if (typeof localStorage !== "undefined") {
		localStorage.setItem(key, JSON.stringify(data));
	}
}

export const localClient = {
	from: (table: string) => {
		const key =
			table === "sitecue_notes"
				? "sitecue_guest_notes"
				: "sitecue_guest_domain_settings";

		// 🛡️ 宣言型クエリビルダーコンテキストの生成
		const builder = {
			_filters: [] as Array<{
				type: "eq" | "not" | "in";
				col: string;
				// biome-ignore lint/suspicious/noExplicitAny: internal filter array
				val: any;
			}>,
			_limitNum: null as number | null,

			select: function (_fields?: string) {
				return this;
			},
			or: function (_expr: string) {
				return this;
			},
			// biome-ignore lint/suspicious/noExplicitAny: mock args
			order: function (_col: string, _opts?: any) {
				return this;
			},
			limit: function (num: number) {
				this._limitNum = num;
				return this;
			},
			// biome-ignore lint/suspicious/noExplicitAny: mock args
			in: function (col: string, vals: any[]) {
				this._filters.push({ type: "in", col, val: vals });
				return this;
			},
			// biome-ignore lint/suspicious/noExplicitAny: mock args
			eq: function (col: string, val: any) {
				this._filters.push({ type: "eq", col, val });
				return this;
			},
			// biome-ignore lint/suspicious/noExplicitAny: mock args
			not: function (col: string, op: string, val: any) {
				if (op === "eq") {
					this._filters.push({ type: "not", col, val });
				}
				return this;
			},
			maybeSingle: function () {
				return this; // thenで単一オブジェクトとして処理するためのマーカー（ダミー）
			},
			single: function () {
				return this; // select().single() チェーンの互換性維持
			},

			// 🚀 非同期メソッドチェーンの核心：評価確定（await時）の遅延フェッチ＆消し込み
			// biome-ignore lint/suspicious/noThenProperty: mimicking Thenable (Promise)
			// biome-ignore lint/suspicious/noExplicitAny: then handler types
			then: function (onfulfilled: any) {
				const promise = getLocalStorage(key).then(async (rawData) => {
					let filteredData = [...rawData];

					// 1. 蓄積された全フィルター条件をアトミックに一括実行 (.eq().eq().not() の完全貫通)
					for (const filter of this._filters) {
						if (filter.type === "eq") {
							filteredData = filteredData.filter(
								// biome-ignore lint/suspicious/noExplicitAny: dynamic key mapping
								(item: any) => item[filter.col] === filter.val,
							);
						} else if (filter.type === "not") {
							filteredData = filteredData.filter(
								// biome-ignore lint/suspicious/noExplicitAny: dynamic key mapping
								(item: any) => item[filter.col] !== filter.val,
							);
						} else if (filter.type === "in") {
							filteredData = filteredData.filter(
								// biome-ignore lint/suspicious/noExplicitAny: dynamic key mapping
								(item: any) =>
									Array.isArray(filter.val) &&
									filter.val.includes(item[filter.col]),
							);
						}
					}

					// 2. リミット制限の適用
					if (this._limitNum !== null) {
						filteredData = filteredData.slice(0, this._limitNum);
					}

					// DAL層の single() / maybeSingle() 期待値へのアダプターマッピング
					// 判定ロジック：チェーンの末尾または判定用途に単一取得の期待がある場合
					const hasSingleExpectation = this._filters.some(
						(f) => f.type === "eq" && (f.col === "id" || f.col === "domain"),
					);

					// 期待されるレスポンス型 ({ data, error }) の組み立て
					if (hasSingleExpectation && filteredData.length === 0) {
						return { data: null, error: null };
					}
					if (hasSingleExpectation) {
						return { data: filteredData[0], error: null };
					}
					return { data: filteredData, error: null };
				});

				return promise.then(onfulfilled);
			},

			// ✍️ データのインサートチェーン（作成仕様）
			// biome-ignore lint/suspicious/noExplicitAny: insert payloads
			insert: (insertData: any) => {
				const p = getLocalStorage(key).then(async (data) => {
					const normalized = Array.isArray(insertData)
						? insertData
						: [insertData];
					const inserted = normalized.map((item) => ({
						...item,
						id: item.id || crypto.randomUUID(),
						created_at: item.created_at || new Date().toISOString(),
						updated_at: new Date().toISOString(),
					}));
					const nextData = [...data, ...inserted];
					await setLocalStorage(key, nextData);
					return {
						data: Array.isArray(insertData) ? inserted : inserted[0],
						error: null,
					};
				});

				return {
					select: () => ({
						single: () => p,
					}),
					// biome-ignore lint/suspicious/noThenProperty: mimicking Thenable (Promise)
					// biome-ignore lint/suspicious/noExplicitAny: then handler types
					then: (onfulfilled: any) => p.then(onfulfilled),
				};
			},

			// 📝 データのアップデートチェーン
			// biome-ignore lint/suspicious/noExplicitAny: update payload
			update: (updateData: any) => ({
				// biome-ignore lint/suspicious/noExplicitAny: query args
				eq: (col: string, val: any) => {
					const p = getLocalStorage(key).then(async (data) => {
						// biome-ignore lint/suspicious/noExplicitAny: database record typing
						let updatedItem: any = null;
						// biome-ignore lint/suspicious/noExplicitAny: database record typing
						const nextData = data.map((item: any) => {
							if (item[col] === val) {
								updatedItem = {
									...item,
									...updateData,
									updated_at: new Date().toISOString(),
								};
								return updatedItem;
							}
							return item;
						});
						await setLocalStorage(key, nextData);
						return { data: updatedItem, error: null };
					});

					return {
						select: () => ({
							single: () => p,
						}),
						// biome-ignore lint/suspicious/noThenProperty: mimicking Thenable (Promise)
						// biome-ignore lint/suspicious/noExplicitAny: then handler types
						then: (onfulfilled: any) => p.then(onfulfilled),
					};
				},
			}),

			// 🗑️ データのデリートチェーン
			delete: () => ({
				// biome-ignore lint/suspicious/noExplicitAny: query args
				eq: (col: string, val: any) => {
					const subDelete = {
						// biome-ignore lint/suspicious/noExplicitAny: query args
						eq: (col2: string, val2: any) => {
							const p = getLocalStorage(key).then(async (data) => {
								const nextData = data.filter(
									// biome-ignore lint/suspicious/noExplicitAny: database record typing
									(item: any) => !(item[col] === val && item[col2] === val2),
								);
								await setLocalStorage(key, nextData);
								return { error: null };
							});
							return {
								// biome-ignore lint/suspicious/noThenProperty: mimicking Thenable (Promise)
								// biome-ignore lint/suspicious/noExplicitAny: then handler types
								then: (onfulfilled: any) => p.then(onfulfilled),
							};
						},
						// biome-ignore lint/suspicious/noThenProperty: mimicking Thenable (Promise)
						// biome-ignore lint/suspicious/noExplicitAny: then handler types
						then: (onfulfilled: any) => {
							const p = getLocalStorage(key).then(async (data) => {
								// biome-ignore lint/suspicious/noExplicitAny: database record typing
								const nextData = data.filter((item: any) => item[col] !== val);
								await setLocalStorage(key, nextData);
								return { error: null };
							});
							return p.then(onfulfilled);
						},
					};
					return subDelete;
				},
			}),
		};

		return builder;
	},
};
