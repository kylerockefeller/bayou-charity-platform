import { z } from 'zod';

export const FORECAST_SCHEMA_VERSION = 1;
export const FISHING_INGEST_HEADER = 'x-fishing-ingest-secret';
export const FISHING_INGEST_SECRET_ENV = 'FISHING_INGEST_SECRET';

// Keys that must never appear. Named almanac spots and coordinates stay off
// this payload. Ripp redacts those before posting.
const BLOCKED_KEYS = new Set([
  'lat',
  'lng',
  'latitude',
  'longitude',
  'spot',
  'spots',
  'lease',
  'waypoint',
  'coordinate',
  'coordinates',
  'gps',
  'location',
  'place',
]);

const COORDINATE_PAIR = /\b-?\d{1,3}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}\b/;
const PRIVATE_MARKER = /\b(lease|waypoint|gps pin|coordinates|latitude|longitude)\b/i;

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isCalendarDate, 'Invalid calendar date');
const chicagoTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const metricSchema = z.object({
  type: z.string().regex(/^[a-z][a-z0-9_]{0,40}$/),
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(120),
  unit: z.string().trim().max(20).optional(),
  note: z.string().trim().max(280).optional(),
}).strict();

const sectionSchema = z.object({
  type: z.string().regex(/^[a-z][a-z0-9_]{0,40}$/),
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(4000),
}).strict();

const sourceSchema = z.object({
  type: z.string().regex(/^[a-z][a-z0-9_]{0,40}$/),
  label: z.string().trim().min(1).max(120),
  url: z.string().max(500).refine(isHttpUrl, 'Source URL must be http or https'),
  date: calendarDate,
}).strict();

export const fishingDayIngestSchema = z.object({
  schema_version: z.literal(FORECAST_SCHEMA_VERSION),
  // Must be the literal true. A false value is rejected, not stored.
  shareable: z.literal(true),
  date: calendarDate,
  kind: z.enum(['observed', 'forecast']),
  bite: z.enum(['poor', 'fair', 'good', 'hot']),
  bite_note: z.string().trim().max(280),
  summary: z.string().trim().min(1).max(2000),
  wind_speed_mph: z.number().min(0).max(150).nullish(),
  wind_gust_mph: z.number().min(0).max(200).nullish(),
  wind_dir_deg: z.number().int().min(0).max(359).nullish(),
  water_temp_f: z.number().min(20).max(110).nullish(),
  air_temp_f: z.number().min(-10).max(130).nullish(),
  tide_high_ft: z.number().min(-10).max(15).nullish(),
  tide_high_time: chicagoTime.nullish(),
  tide_low_ft: z.number().min(-10).max(15).nullish(),
  tide_low_time: chicagoTime.nullish(),
  tide_range_ft: z.number().min(0).max(20).nullish(),
  water_level_ft: z.number().min(-10).max(15).nullish(),
  metrics: z.array(metricSchema).max(24),
  sections: z.array(sectionSchema).max(12),
  sources: z.array(sourceSchema).max(12),
}).strict();

export type FishingDayIngest = z.infer<typeof fishingDayIngestSchema>;

const MAX_PAYLOAD_DEPTH = 8;

export function privateContentReason(value: unknown): string | null {
  return scan(value, 0);
}

export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function scan(value: unknown, depth: number): string | null {
  if (depth > MAX_PAYLOAD_DEPTH) return 'Payload is too deeply nested.';
  if (typeof value === 'string') {
    if (value.includes('\u0000')) return 'Payload contains a null character.';
    if (COORDINATE_PAIR.test(value) || PRIVATE_MARKER.test(value)) {
      return 'A text field includes a coordinate or a private-spot marker. Remove it before ingest.';
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = scan(item, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key.includes('\u0000')) return 'Payload contains a null character.';
      if (BLOCKED_KEYS.has(key.toLowerCase())) {
        return `Field "${key}" is not shareable. Named spots and coordinates are not accepted.`;
      }
      const hit = scan(child, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}
