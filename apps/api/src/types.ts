import type { User } from "@supabase/supabase-js";

export type Bindings = {
	SUPABASE_URL: string;
	SUPABASE_ANON_KEY: string;
	GEMINI_API_KEY: string;
	GEMINI_MODEL_NAME?: string;
};

export type Variables = {
	user: User;
};
