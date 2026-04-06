create table "public"."sitecue_drafts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null default auth.uid(),
    "title" text,
    "content" text,
    "target_platform" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

alter table "public"."sitecue_drafts" enable row level security;

CREATE UNIQUE INDEX sitecue_drafts_pkey ON public.sitecue_drafts USING btree (id);

alter table "public"."sitecue_drafts" add constraint "sitecue_drafts_pkey" PRIMARY KEY using index "sitecue_drafts_pkey";

alter table "public"."sitecue_drafts" add constraint "sitecue_drafts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table "public"."sitecue_drafts" add constraint "sitecue_drafts_platform_check" CHECK (target_platform IN ('x', 'zenn', 'generic'));

create policy "Users can perform all actions on their own drafts"
on "public"."sitecue_drafts"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));
