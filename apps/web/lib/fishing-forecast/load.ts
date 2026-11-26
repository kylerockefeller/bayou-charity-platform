import { createClient } from '@bayou/supabase';
import { buildExampleDays, emptyDay } from './example-days';
import { chicagoToday, dayKind, forecastWindow } from './dates';
import type { BiteLevel, FishingConditions, FishingDay, FishingMetric, FishingSection, FishingSource, MemberDayPhoto } from './types';
import { BITE_LEVELS } from './types';

export type ForecastResult =
  | { status: 'example'; days: FishingDay[]; photos: MemberDayPhoto[]; notice: string }
  | { status: 'live'; days: FishingDay[]; photos: MemberDayPhoto[] }
  | { status: 'error'; message: string };

const DAY_COLUMNS = 'date, kind, bite, bite_note, summary, metrics, sections, sources, example, shareable';
const CONDITION_COLUMNS = 'wind_speed_mph, wind_gust_mph, wind_dir_deg, water_temp_f, air_temp_f, tide_high_ft, tide_high_time, tide_low_ft, tide_low_time, tide_range_ft, water_level_ft';

type DayRow = {
  date: string;
  kind: string;
  bite: string;
  bite_note: string | null;
  summary: string | null;
  metrics: unknown;
  sections: unknown;
  sources: unknown;
  example: boolean | null;
  shareable: boolean | null;
  wind_speed_mph?: number | null;
  wind_gust_mph?: number | null;
  wind_dir_deg?: number | null;
  water_temp_f?: number | null;
  air_temp_f?: number | null;
  tide_high_ft?: number | null;
  tide_high_time?: string | null;
  tide_low_ft?: number | null;
  tide_low_time?: string | null;
  tide_range_ft?: number | null;
  water_level_ft?: number | null;
};

type MemberClient = ReturnType<typeof createClient>;

export async function loadForecast(supabase: MemberClient): Promise<ForecastResult> {
  const today = chicagoToday();
  const dates = forecastWindow(today);
  const photos = await loadPhotos(supabase, dates[0], dates[dates.length - 1]);

  const db = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        gte: (column: string, value: string) => {
          lte: (column: string, value: string) => {
            eq: (column: string, value: boolean) => {
              order: (column: string, options: { ascending: boolean }) => Promise<{
                data: DayRow[] | null;
                error: { code?: string; message: string } | null;
              }>;
            };
          };
        };
      };
    };
  };

  const selectDays = (columns: string) => db
    .from('fishing_days')
    .select(columns)
    .gte('date', dates[0])
    .lte('date', dates[dates.length - 1])
    .eq('shareable', true)
    .order('date', { ascending: true });

  let { data, error } = await selectDays(`${DAY_COLUMNS}, ${CONDITION_COLUMNS}`);
  if (error && isMissingConditionColumn(error)) {
    ({ data, error } = await selectDays(DAY_COLUMNS));
  }

  if (error) {
    if (isMissingTable(error)) {
      return {
        status: 'example',
        days: buildExampleDays(today),
        photos,
        notice: 'Example data. The fishing_days table is not in this project yet, so these cards are not a live forecast.',
      };
    }
    return { status: 'error', message: 'Could not load the fishing forecast.' };
  }

  const live = (data ?? []).filter((row) => row.shareable !== false && row.example !== true).map((row) => toDay(row, today));
  if (live.length === 0) {
    return {
      status: 'example',
      days: buildExampleDays(today),
      photos,
      notice: 'Example data. Ripp has not posted a shareable report for this window yet. These cards are not a live forecast.',
    };
  }

  const byDate = new Map(live.map((day) => [day.date, day]));
  return {
    status: 'live',
    days: dates.map((date) => byDate.get(date) ?? emptyDay(date, today)),
    photos,
  };
}

async function loadPhotos(supabase: MemberClient, start: string, end: string): Promise<MemberDayPhoto[]> {
  const { data, error } = await supabase
    .from('pins')
    .select('id, photo_url, caption, species, catch_date, profiles(display_name)')
    .eq('flagged', false)
    .not('photo_url', 'is', null)
    .gte('catch_date', start)
    .lte('catch_date', end);

  if (error || !data) return [];

  return data.flatMap((row) => {
    if (!row.photo_url || !row.catch_date) return [];
    const profile = row.profiles as { display_name: string | null } | { display_name: string | null }[] | null;
    const displayName = Array.isArray(profile) ? profile[0]?.display_name ?? null : profile?.display_name ?? null;
    return [{
      id: row.id,
      photoUrl: row.photo_url,
      caption: row.caption,
      species: row.species,
      displayName,
      catchDate: row.catch_date,
    }];
  });
}

function toDay(row: DayRow, today: string): FishingDay {
  const bite = BITE_LEVELS.includes(row.bite as BiteLevel) ? row.bite as BiteLevel : null;
  return {
    date: row.date,
    kind: dayKind(row.date, today),
    bite,
    biteNote: row.bite_note ?? '',
    summary: row.summary ?? '',
    metrics: asMetrics(row.metrics),
    sections: asSections(row.sections),
    sources: asSources(row.sources),
    conditions: asConditions(row),
    example: false,
    missing: false,
  };
}

function asMetrics(value: unknown): FishingMetric[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    if (typeof row.type !== 'string' || typeof row.label !== 'string' || typeof row.value !== 'string') return [];
    return [{
      type: row.type,
      label: row.label,
      value: row.value,
      unit: typeof row.unit === 'string' ? row.unit : undefined,
      note: typeof row.note === 'string' ? row.note : undefined,
    }];
  });
}

function asSections(value: unknown): FishingSection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    if (typeof row.type !== 'string' || typeof row.title !== 'string' || typeof row.body !== 'string') return [];
    return [{ type: row.type, title: row.title, body: row.body }];
  });
}

function asSources(value: unknown): FishingSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    if (typeof row.type !== 'string' || typeof row.label !== 'string' || typeof row.url !== 'string' || typeof row.date !== 'string') return [];
    if (!/^https?:\/\//.test(row.url)) return [];
    return [{ type: row.type, label: row.label, url: row.url, date: row.date }];
  });
}

function asConditions(row: DayRow): FishingConditions {
  return {
    windSpeedMph: asNumber(row.wind_speed_mph),
    windGustMph: asNumber(row.wind_gust_mph),
    windDirDeg: asNumber(row.wind_dir_deg),
    waterTempF: asNumber(row.water_temp_f),
    airTempF: asNumber(row.air_temp_f),
    tideHighFt: asNumber(row.tide_high_ft),
    tideHighTime: asTime(row.tide_high_time),
    tideLowFt: asNumber(row.tide_low_ft),
    tideLowTime: asTime(row.tide_low_time),
    tideRangeFt: asNumber(row.tide_range_ft),
    waterLevelFt: asNumber(row.water_level_ft),
  };
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function asTime(value: unknown): string | null {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : null;
}

function isMissingConditionColumn(error: { code?: string; message: string }): boolean {
  const message = error.message.toLowerCase();
  return error.code === '42703'
    || error.code === 'PGRST204'
    || message.includes('wind_speed_mph')
    || message.includes('water_temp_f')
    || message.includes('tide_high_ft');
}

function isMissingTable(error: { code?: string; message: string }): boolean {
  const message = error.message.toLowerCase();
  return error.code === '42P01'
    || error.code === 'PGRST205'
    || (message.includes('fishing_days') && (message.includes('does not exist') || message.includes('schema cache') || message.includes('could not find')));
}
