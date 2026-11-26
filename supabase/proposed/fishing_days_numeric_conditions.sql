-- Additive columns only. Do not alter or drop existing fishing_days columns.
-- Kyle applies this to the test project separately. Do not apply it to the
-- live Supabase project from this file.
--
-- Times are America/Chicago local HH:MM. water_level_ft is observed level
-- versus MLLW. Null means the text metrics array still carries that detail.

alter table public.fishing_days
  add column if not exists wind_speed_mph numeric,
  add column if not exists wind_gust_mph numeric,
  add column if not exists wind_dir_deg smallint,
  add column if not exists water_temp_f numeric,
  add column if not exists air_temp_f numeric,
  add column if not exists tide_high_ft numeric,
  add column if not exists tide_high_time text,
  add column if not exists tide_low_ft numeric,
  add column if not exists tide_low_time text,
  add column if not exists tide_range_ft numeric,
  add column if not exists water_level_ft numeric;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fishing_days_wind_speed_mph_range') then
    alter table public.fishing_days add constraint fishing_days_wind_speed_mph_range
      check (wind_speed_mph is null or (wind_speed_mph >= 0 and wind_speed_mph <= 150));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fishing_days_wind_gust_mph_range') then
    alter table public.fishing_days add constraint fishing_days_wind_gust_mph_range
      check (wind_gust_mph is null or (wind_gust_mph >= 0 and wind_gust_mph <= 200));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fishing_days_wind_dir_deg_range') then
    alter table public.fishing_days add constraint fishing_days_wind_dir_deg_range
      check (wind_dir_deg is null or (wind_dir_deg >= 0 and wind_dir_deg <= 359));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fishing_days_water_temp_f_range') then
    alter table public.fishing_days add constraint fishing_days_water_temp_f_range
      check (water_temp_f is null or (water_temp_f >= 20 and water_temp_f <= 110));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fishing_days_air_temp_f_range') then
    alter table public.fishing_days add constraint fishing_days_air_temp_f_range
      check (air_temp_f is null or (air_temp_f >= -10 and air_temp_f <= 130));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fishing_days_tide_high_ft_range') then
    alter table public.fishing_days add constraint fishing_days_tide_high_ft_range
      check (tide_high_ft is null or (tide_high_ft >= -10 and tide_high_ft <= 15));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fishing_days_tide_low_ft_range') then
    alter table public.fishing_days add constraint fishing_days_tide_low_ft_range
      check (tide_low_ft is null or (tide_low_ft >= -10 and tide_low_ft <= 15));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fishing_days_tide_range_ft_range') then
    alter table public.fishing_days add constraint fishing_days_tide_range_ft_range
      check (tide_range_ft is null or (tide_range_ft >= 0 and tide_range_ft <= 20));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fishing_days_water_level_ft_range') then
    alter table public.fishing_days add constraint fishing_days_water_level_ft_range
      check (water_level_ft is null or (water_level_ft >= -10 and water_level_ft <= 15));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fishing_days_tide_high_time_format') then
    alter table public.fishing_days add constraint fishing_days_tide_high_time_format
      check (tide_high_time is null or tide_high_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'fishing_days_tide_low_time_format') then
    alter table public.fishing_days add constraint fishing_days_tide_low_time_format
      check (tide_low_time is null or tide_low_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
  end if;
end $$;
