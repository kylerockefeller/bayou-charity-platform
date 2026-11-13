import { createClient } from '@bayou/supabase';
import { buildExampleDays, emptyDay } from './example-days';
import { chicagoToday, dayKind, forecastWindow } from './dates';
import type { BiteLevel, FishingDay, FishingMetric, FishingSection, FishingSource, MemberDayPhoto } from './types';
import { BITE_LEVELS } from './types';

export type ForecastResult =
  | { status: 'example'; days: FishingDay[]; photos: MemberDayPhoto[]; notice: string }
  | { status: 'live'; days: FishingDay[]; photos: MemberDayPhoto[] }
  | { status: 'error'; message: string };

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

  const { data, error } = await db
    .from('fishing_days')
    .select('date, kind, bite, bite_note, summary, metrics, sections, sources, example, shareable')
    .gte('date', dates[0])
    .lte('date', dates[dates.length - 1])
    .eq('shareable', true)
    .order('date', { ascending: true });

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

function isMissingTable(error: { code?: string; message: string }): boolean {
  const message = error.message.toLowerCase();
  return error.code === '42P01'
    || error.code === 'PGRST205'
    || (message.includes('fishing_days') && (message.includes('does not exist') || message.includes('schema cache') || message.includes('could not find')));
}
