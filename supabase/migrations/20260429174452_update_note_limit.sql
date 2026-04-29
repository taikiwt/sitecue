-- Update check_note_limit function to increase limit to 500
CREATE OR REPLACE FUNCTION "public"."check_note_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  user_plan text;
  note_count int;
begin
  -- Get user plan from sitecue_profiles
  select plan into user_plan
  from public.sitecue_profiles
  where id = auth.uid();

  -- Only apply limit to free users
  if user_plan = 'free' then
    -- Count total notes for the user
    select count(*) into note_count
    from public.sitecue_notes
    where user_id = auth.uid();

    -- Check if count exceeds 500 (increased from 200)
    if note_count >= 500 then
      raise exception 'Note storage limit reached (500 notes). Please upgrade your account to save unlimited notes.';
    end if;
  end if;

  return new;
end;
$$;
