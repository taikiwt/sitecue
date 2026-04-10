


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_note_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  user_plan text;
  note_count int;
begin
  -- Get user plan
  select plan into user_plan
  from public.sitecue_profiles
  where id = auth.uid();

  -- If plan is free, check count
  if user_plan = 'free' then
    select count(*) into note_count
    from public.sitecue_notes
    where user_id = auth.uid();

    if note_count >= 200 then
      raise exception 'Free plan limit reached (200 notes). Please upgrade to Pro.';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."check_note_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.sitecue_profiles (id, plan)
  values (new.id, 'free');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_todo01"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.todo01_profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user_todo01"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."sitecue_domain_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "label" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."sitecue_domain_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sitecue_drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text",
    "content" "text",
    "target_platform" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "sitecue_drafts_platform_check" CHECK (("target_platform" = ANY (ARRAY['x'::"text", 'zenn'::"text", 'generic'::"text"])))
);


ALTER TABLE "public"."sitecue_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sitecue_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "domain" "text" NOT NULL,
    "target_url" "text" NOT NULL,
    "label" "text" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sitecue_links_type_check" CHECK (("type" = ANY (ARRAY['related'::"text", 'env'::"text"])))
);


ALTER TABLE "public"."sitecue_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sitecue_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "url_pattern" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "scope" "text" DEFAULT 'domain'::"text" NOT NULL,
    "note_type" "text" DEFAULT 'info'::"text" NOT NULL,
    "is_resolved" boolean DEFAULT false NOT NULL,
    "is_pinned" boolean DEFAULT false NOT NULL,
    "is_favorite" boolean DEFAULT false NOT NULL,
    "sort_order" double precision DEFAULT 0 NOT NULL,
    "is_expanded" boolean DEFAULT false NOT NULL,
    "draft_id" "uuid",
    CONSTRAINT "sitecue_notes_note_type_check" CHECK (("note_type" = ANY (ARRAY['info'::"text", 'alert'::"text", 'idea'::"text"]))),
    CONSTRAINT "sitecue_notes_scope_check" CHECK (("scope" = ANY (ARRAY['domain'::"text", 'exact'::"text", 'inbox'::"text", 'draft'::"text"])))
);


ALTER TABLE "public"."sitecue_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sitecue_page_contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."sitecue_page_contents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sitecue_pinned_sites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sitecue_pinned_sites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sitecue_profiles" (
    "id" "uuid" NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "ai_usage_count" integer DEFAULT 0 NOT NULL,
    "ai_usage_reset_at" timestamp with time zone DEFAULT ("now"() + '1 mon'::interval),
    CONSTRAINT "sitecue_profiles_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'pro'::"text"])))
);


ALTER TABLE "public"."sitecue_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."todo01_profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."todo01_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."todo01_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "is_complete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."todo01_tasks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."sitecue_domain_settings"
    ADD CONSTRAINT "sitecue_domain_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sitecue_domain_settings"
    ADD CONSTRAINT "sitecue_domain_settings_user_id_domain_key" UNIQUE ("user_id", "domain");



ALTER TABLE ONLY "public"."sitecue_drafts"
    ADD CONSTRAINT "sitecue_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sitecue_links"
    ADD CONSTRAINT "sitecue_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sitecue_notes"
    ADD CONSTRAINT "sitecue_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sitecue_page_contents"
    ADD CONSTRAINT "sitecue_page_contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sitecue_pinned_sites"
    ADD CONSTRAINT "sitecue_pinned_sites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sitecue_profiles"
    ADD CONSTRAINT "sitecue_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."todo01_profiles"
    ADD CONSTRAINT "todo01_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."todo01_tasks"
    ADD CONSTRAINT "todo01_tasks_pkey" PRIMARY KEY ("id");



CREATE INDEX "sitecue_links_domain_idx" ON "public"."sitecue_links" USING "btree" ("domain");



CREATE INDEX "sitecue_links_target_url_idx" ON "public"."sitecue_links" USING "btree" ("target_url");



CREATE INDEX "sitecue_notes_url_idx" ON "public"."sitecue_notes" USING "btree" ("url_pattern");



CREATE INDEX "sitecue_notes_user_idx" ON "public"."sitecue_notes" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "on_note_created_check_limit" BEFORE INSERT ON "public"."sitecue_notes" FOR EACH ROW EXECUTE FUNCTION "public"."check_note_limit"();



ALTER TABLE ONLY "public"."sitecue_domain_settings"
    ADD CONSTRAINT "sitecue_domain_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sitecue_drafts"
    ADD CONSTRAINT "sitecue_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sitecue_links"
    ADD CONSTRAINT "sitecue_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sitecue_notes"
    ADD CONSTRAINT "sitecue_notes_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "public"."sitecue_drafts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sitecue_notes"
    ADD CONSTRAINT "sitecue_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sitecue_page_contents"
    ADD CONSTRAINT "sitecue_page_contents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sitecue_pinned_sites"
    ADD CONSTRAINT "sitecue_pinned_sites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sitecue_profiles"
    ADD CONSTRAINT "sitecue_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."todo01_profiles"
    ADD CONSTRAINT "todo01_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."todo01_tasks"
    ADD CONSTRAINT "todo01_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."todo01_profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Enable update for users based on user_id" ON "public"."sitecue_notes" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own domain settings" ON "public"."sitecue_domain_settings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own notes" ON "public"."sitecue_notes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own page contents" ON "public"."sitecue_page_contents" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own pinned sites" ON "public"."sitecue_pinned_sites" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."todo01_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own domain settings" ON "public"."sitecue_domain_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own notes" ON "public"."sitecue_notes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own page contents" ON "public"."sitecue_page_contents" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own pinned sites" ON "public"."sitecue_pinned_sites" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can perform all actions on their own drafts" ON "public"."sitecue_drafts" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can perform all actions on their own links" ON "public"."sitecue_links" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can perform all operations on own tasks" ON "public"."todo01_tasks" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."todo01_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own domain settings" ON "public"."sitecue_domain_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notes" ON "public"."sitecue_notes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile." ON "public"."sitecue_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."todo01_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own domain settings" ON "public"."sitecue_domain_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notes" ON "public"."sitecue_notes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own page contents" ON "public"."sitecue_page_contents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own pinned sites" ON "public"."sitecue_pinned_sites" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile." ON "public"."sitecue_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."sitecue_domain_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sitecue_drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sitecue_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sitecue_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sitecue_page_contents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sitecue_pinned_sites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sitecue_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."todo01_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."todo01_tasks" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."check_note_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_note_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_note_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_todo01"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_todo01"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_todo01"() TO "service_role";
























GRANT ALL ON TABLE "public"."sitecue_domain_settings" TO "anon";
GRANT ALL ON TABLE "public"."sitecue_domain_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."sitecue_domain_settings" TO "service_role";



GRANT ALL ON TABLE "public"."sitecue_drafts" TO "anon";
GRANT ALL ON TABLE "public"."sitecue_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."sitecue_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."sitecue_links" TO "anon";
GRANT ALL ON TABLE "public"."sitecue_links" TO "authenticated";
GRANT ALL ON TABLE "public"."sitecue_links" TO "service_role";



GRANT ALL ON TABLE "public"."sitecue_notes" TO "anon";
GRANT ALL ON TABLE "public"."sitecue_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."sitecue_notes" TO "service_role";



GRANT ALL ON TABLE "public"."sitecue_page_contents" TO "anon";
GRANT ALL ON TABLE "public"."sitecue_page_contents" TO "authenticated";
GRANT ALL ON TABLE "public"."sitecue_page_contents" TO "service_role";



GRANT ALL ON TABLE "public"."sitecue_pinned_sites" TO "anon";
GRANT ALL ON TABLE "public"."sitecue_pinned_sites" TO "authenticated";
GRANT ALL ON TABLE "public"."sitecue_pinned_sites" TO "service_role";



GRANT ALL ON TABLE "public"."sitecue_profiles" TO "anon";
GRANT ALL ON TABLE "public"."sitecue_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."sitecue_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."todo01_profiles" TO "anon";
GRANT ALL ON TABLE "public"."todo01_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."todo01_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."todo01_tasks" TO "anon";
GRANT ALL ON TABLE "public"."todo01_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."todo01_tasks" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































