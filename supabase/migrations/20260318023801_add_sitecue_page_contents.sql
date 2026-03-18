create table if not exists sitecue_page_contents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  url text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table sitecue_page_contents enable row level security;

create policy "Users can insert their own page contents"
on sitecue_page_contents for insert
with check (auth.uid() = user_id);

create policy "Users can view their own page contents"
on sitecue_page_contents for select
using (auth.uid() = user_id);

create policy "Users can delete their own page contents"
on sitecue_page_contents for delete
using (auth.uid() = user_id);
