-- NOT APPLIED. Draft only. Do not run this against the live Supabase project
-- until Kyle reviews it. This file is not in supabase/migrations.
--
-- Adds a nullable crop to gallery_submissions. Null means the current
-- centered cover crop. photo_crop_x / photo_crop_y are focal percentages
-- (0–100). photo_crop_zoom is a scale greater than 0 and at most 10.
-- The test project already uses this check. Do not apply this file to production.
--
-- This does not add an UPDATE policy. A trigger blocks crop changes unless
-- the caller is an admin or the service role. The app checks profiles.role
-- first, then writes with the service role. The original file in Storage
-- is not modified.

alter table public.gallery_submissions
  add column if not exists photo_crop_x double precision,
  add column if not exists photo_crop_y double precision,
  add column if not exists photo_crop_zoom double precision;

alter table public.gallery_submissions
  drop constraint if exists gallery_submissions_photo_crop_x_range,
  drop constraint if exists gallery_submissions_photo_crop_y_range,
  drop constraint if exists gallery_submissions_photo_crop_zoom_min;

alter table public.gallery_submissions
  add constraint gallery_submissions_photo_crop_x_range check (photo_crop_x is null or (photo_crop_x >= 0 and photo_crop_x <= 100)),
  add constraint gallery_submissions_photo_crop_y_range check (photo_crop_y is null or (photo_crop_y >= 0 and photo_crop_y <= 100)),
  add constraint gallery_submissions_photo_crop_zoom_min check (photo_crop_zoom is null or (photo_crop_zoom > 0 and photo_crop_zoom <= 10));

create or replace function public.gallery_crop_admin_only()
returns trigger
language plpgsql
as $$
begin
  if new.photo_crop_x is distinct from old.photo_crop_x
     or new.photo_crop_y is distinct from old.photo_crop_y
     or new.photo_crop_zoom is distinct from old.photo_crop_zoom then
    if auth.role() is distinct from 'service_role'
       and not exists (
         select 1 from public.profiles
         where id = auth.uid() and role = 'admin'
       ) then
      raise exception 'Only an admin can change a gallery photo crop';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists gallery_crop_admin_only on public.gallery_submissions;
create trigger gallery_crop_admin_only
  before update on public.gallery_submissions
  for each row execute function public.gallery_crop_admin_only();
