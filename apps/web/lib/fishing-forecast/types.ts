// Shareable fishing-day record. The card layout reads a few well-known
// metric types. Any other type still renders in the day detail, so a new
// report section does not require a layout change.

export const BITE_LEVELS = ['poor', 'fair', 'good', 'hot'] as const;
export type BiteLevel = (typeof BITE_LEVELS)[number];

export type FishingMetric = {
  type: string;
  label: string;
  value: string;
  unit?: string;
  note?: string;
};

export type FishingSection = {
  type: string;
  title: string;
  body: string;
};

export type FishingSource = {
  type: string;
  label: string;
  url: string;
  date: string;
};

export type FishingConditions = {
  windSpeedMph: number | null;
  windGustMph: number | null;
  windDirDeg: number | null;
  waterTempF: number | null;
  airTempF: number | null;
  tideHighFt: number | null;
  tideHighTime: string | null;
  tideLowFt: number | null;
  tideLowTime: string | null;
  tideRangeFt: number | null;
  waterLevelFt: number | null;
};

export type FishingDay = {
  date: string;
  /** Derived from the date in America/Chicago. Past = observed, today and future = forecast. */
  kind: 'observed' | 'forecast';
  bite: BiteLevel | null;
  biteNote: string;
  summary: string;
  metrics: FishingMetric[];
  sections: FishingSection[];
  sources: FishingSource[];
  /** Numeric conditions. Absent or null fields fall back to metrics text. */
  conditions?: FishingConditions;
  /** True only for the in-repo sample. Never treat these numbers as a real forecast. */
  example: boolean;
  /** True when no stored row exists for this date. */
  missing: boolean;
};

export type MemberDayPhoto = {
  id: string;
  photoUrl: string;
  caption: string | null;
  species: string | null;
  displayName: string | null;
  catchDate: string;
};
