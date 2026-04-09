create table "public"."sitecue_pinned_sites" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null default auth.uid(),
    "title" text not null,
    "url" text not null,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."sitecue_pinned_sites" enable row level security;

CREATE UNIQUE INDEX sitecue_pinned_sites_pkey ON public.sitecue_pinned_sites USING btree (id);

alter table "public"."sitecue_pinned_sites" add constraint "sitecue_pinned_sites_pkey" PRIMARY KEY using index "sitecue_pinned_sites_pkey";

alter table "public"."sitecue_pinned_sites" add constraint "sitecue_pinned_sites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

create policy "Users can view their own pinned sites"
on "public"."sitecue_pinned_sites"
for select
to authenticated
using ((auth.uid() = user_id));

create policy "Users can insert their own pinned sites"
on "public"."sitecue_pinned_sites"
for insert
to authenticated
with check ((auth.uid() = user_id));

create policy "Users can delete their own pinned sites"
on "public"."sitecue_pinned_sites"
for delete
to authenticated
using ((auth.uid() = user_id));
