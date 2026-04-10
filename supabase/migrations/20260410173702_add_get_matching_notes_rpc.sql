create or replace function get_matching_notes(p_domain text, p_exact text)
returns setof sitecue_notes
language plpgsql
as $$
begin
  return query
  select * from sitecue_notes
  where (scope = 'domain' and url_pattern = p_domain)
     or (scope = 'exact' and url_pattern = p_exact);
end;
$$;
