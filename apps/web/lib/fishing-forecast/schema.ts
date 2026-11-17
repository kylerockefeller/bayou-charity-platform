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
  url: z.string().url().max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

export const fishingDayIngestSchema = z.object({
  schema_version: z.literal(FORECAST_SCHEMA_VERSION),
  // Must be the literal true. A false value is rejected, not stored.
  shareable: z.literal(true),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(['observed', 'forecast']),
  bite: z.enum(['poor', 'fair', 'good', 'hot']),
  bite_note: z.string().trim().max(280),
  summary: z.string().trim().min(1).max(2000),
  metrics: z.array(metricSchema).max(24),
  sections: z.array(sectionSchema).max(12),
  sources: z.array(sourceSchema).max(12),
}).strict();

export type FishingDayIngest = z.infer<typeof fishingDayIngestSchema>;

export function privateContentReason(value: unknown): string | null {
  return scan(value);
}

function scan(value: unknown): string | null {
  if (typeof value === 'string') {
    if (COORDINATE_PAIR.test(value) || PRIVATE_MARKER.test(value)) {
      return 'A text field includes a coordinate or a private-spot marker. Remove it before ingest.';
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = scan(item);
      if (hit) return hit;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (BLOCKED_KEYS.has(key.toLowerCase())) {
        return `Field "${key}" is not shareable. Named spots and coordinates are not accepted.`;
      }
      const hit = scan(child);
      if (hit) return hit;
    }
  }
  return null;
}
