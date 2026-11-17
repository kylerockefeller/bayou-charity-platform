-- NOT APPLIED. Draft only. Do not run this against the live Supabase project
-- until Kyle reviews it. This file is not in supabase/migrations.
--
-- Adds a nullable crop to pins. Null means the current centered cover crop.
-- photo_crop_x / photo_crop_y are focal percentages (0–100).
-- photo_crop_zoom is a scale and must be at least 1.
--
-- This does not add an UPDATE policy, so existing pin policies stay as they are.
-- A trigger blocks crop changes unless the caller is an admin or the service
-- role. The app saves through a server action that checks profiles.role first,
-- then writes with the service role.

alter table public.pins
  add column if not exists photo_crop_x double precision,
  add column if not exists photo_crop_y double precision,
  add column if not exists photo_crop_zoom double precision;

alter table public.pins
  drop constraint if exists pins_photo_crop_x_range,
  drop constraint if exists pins_photo_crop_y_range,
  drop constraint if exists pins_photo_crop_zoom_min;

alter table public.pins
  add constraint pins_photo_crop_x_range check (photo_crop_x is null or (photo_crop_x >= 0 and photo_crop_x <= 100)),
  add constraint pins_photo_crop_y_range check (photo_crop_y is null or (photo_crop_y >= 0 and photo_crop_y <= 100)),
  add constraint pins_photo_crop_zoom_min check (photo_crop_zoom is null or photo_crop_zoom >= 1);

create or replace function public.pins_crop_admin_only()
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
      raise exception 'Only an admin can change a pin photo crop';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists pins_crop_admin_only on public.pins;
create trigger pins_crop_admin_only
  before update on public.pins
  for each row execute function public.pins_crop_admin_only();
