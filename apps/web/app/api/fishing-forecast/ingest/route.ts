import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import {
  FISHING_INGEST_HEADER,
  FISHING_INGEST_SECRET_ENV,
  fishingDayIngestSchema,
  privateContentReason,
} from '@/lib/fishing-forecast/schema';

export const dynamic = 'force-dynamic';

// Ripp posts one shareable day at a time. The table is created only when Kyle
// applies supabase/proposed/NOT_APPLIED_fishing_forecast.sql. This route does
// not create the table.

export async function POST(request: Request) {
  const expected = process.env[FISHING_INGEST_SECRET_ENV];
  const provided = request.headers.get(FISHING_INGEST_HEADER) ?? '';
  if (!expected) {
    return Response.json({ error: 'Ingest is not configured.' }, { status: 503 });
  }
  if (!secretsMatch(provided, expected)) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: 'Body must be JSON.' }, { status: 400 });
  }

  let leaked: string | null = null;
  try {
    leaked = privateContentReason(json);
  } catch {
    return Response.json({ error: 'Payload is too deeply nested.' }, { status: 422 });
  }
  if (leaked) {
    return Response.json({ error: leaked }, { status: 422 });
  }

  const parsed = fishingDayIngestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: 'Payload does not match fishing forecast schema version 1.' }, { status: 422 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json({ error: 'Ingest storage is not configured.' }, { status: 503 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const day = parsed.data;
  const row: Record<string, unknown> = {
    date: day.date,
    schema_version: day.schema_version,
    shareable: true,
    kind: day.kind,
    bite: day.bite,
    bite_note: day.bite_note,
    summary: day.summary,
    metrics: day.metrics,
    sections: day.sections,
    sources: day.sources,
    example: false,
    updated_at: new Date().toISOString(),
  };
  const conditions: Record<string, unknown> = {
    wind_speed_mph: day.wind_speed_mph,
    wind_gust_mph: day.wind_gust_mph,
    wind_dir_deg: day.wind_dir_deg,
    water_temp_f: day.water_temp_f,
    air_temp_f: day.air_temp_f,
    tide_high_ft: day.tide_high_ft,
    tide_high_time: day.tide_high_time,
    tide_low_ft: day.tide_low_ft,
    tide_low_time: day.tide_low_time,
    tide_range_ft: day.tide_range_ft,
    water_level_ft: day.water_level_ft,
  };
  for (const [column, value] of Object.entries(conditions)) {
    if (value !== undefined) row[column] = value;
  }
  const { error } = await admin.from('fishing_days').upsert(row, { onConflict: 'date' });

  if (error) {
    if (isMissingTable(error)) {
      return Response.json({ error: 'fishing_days is not in this project yet. The proposed migration has not been applied.' }, { status: 503 });
    }
    console.error('[fishing-forecast ingest] upsert failed:', error.message);
    return Response.json({ error: 'Could not store the report.' }, { status: 500 });
  }

  return Response.json({ ok: true, date: day.date, schema_version: day.schema_version });
}

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

function isMissingTable(error: { code?: string; message: string }): boolean {
  const message = error.message.toLowerCase();
  return error.code === '42P01'
    || error.code === 'PGRST205'
    || message.includes('does not exist')
    || message.includes('schema cache')
    || message.includes('could not find');
}
