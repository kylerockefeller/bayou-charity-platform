'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@bayou/supabase';
import { chicagoToday, formatDayLabel } from '@/lib/fishing-forecast/dates';
import { loadForecast, type ForecastResult } from '@/lib/fishing-forecast/load';
import type { FishingDay, MemberDayPhoto } from '@/lib/fishing-forecast/types';
import { MemberLoadError } from '@/lib/member-session';

export default function FishingForecast() {
  const supabase = useMemo(() => createClient(), []);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    setResult(null);
    setResult(await loadForecast(supabase));
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  if (!result) {
    return <p className="text-center py-12 font-serif text-text-mid dark:text-cream/60">Loading forecast…</p>;
  }
  if (result.status === 'error') {
    return <MemberLoadError message={result.message} onRetry={() => setAttempt((n) => n + 1)} />;
  }

  const today = chicagoToday();
  const selected = result.days.find((day) => day.date === selectedDate) ?? null;
  const photos = selected ? result.photos.filter((photo) => photo.catchDate === selected.date) : [];

  return (
    <div className="space-y-5">
      <header>
        <p className="font-accent text-amber text-sm">Members</p>
        <h1 className="font-display text-3xl md:text-4xl text-green-deep dark:text-cream">Fishing Forecast & Almanac</h1>
        <p className="font-serif text-sm text-text-mid dark:text-cream/70 mt-1">
          Seven days back, today, and seven days ahead. Past days are what was observed. Today and the days ahead are the forecast.
        </p>
      </header>

      <section className="rounded-2xl border border-gold/30 bg-gradient-to-br from-cream to-amber/10 dark:from-green-deep/70 dark:to-green-water/20 px-5 py-5 md:px-6 md:py-6">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber/15 text-amber">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" strokeLinecap="round" />
              <path d="m12 8 2.2 4.2L12 16l-2.2-3.8L12 8z" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="inline-block rounded-full bg-amber px-3 py-1 font-serif text-xs font-semibold text-white">Coming soon</p>
            <h2 className="font-display text-2xl md:text-3xl text-green-deep dark:text-cream mt-3">Bayou Charity Fishing Almanac (beta)</h2>
            <p className="font-serif text-sm md:text-base text-text-dark dark:text-cream/85 mt-2">
              We&apos;re building a community fishing almanac, made by our members, for our members.
            </p>
            <ul className="mt-3 space-y-1.5 font-serif text-sm text-text-dark dark:text-cream/85 list-disc pl-5">
              <li>Fishing data and local knowledge, compiled with Ripp</li>
              <li>Better forecasts built from real days on the water</li>
              <li>A future weather station at INNISFREE for real-time local conditions</li>
            </ul>
            <p className="font-serif text-sm text-text-dark dark:text-cream/85 mt-3">
              When you post a photo or share a catch, tell us what you saw on the water: wind, water clarity, tide, bait, and what was biting. Your report helps every member fish smarter.
            </p>
          </div>
        </div>
      </section>

      {result.status === 'example' && (
        <div className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-3">
          <p className="font-serif text-sm text-text-dark dark:text-cream">
            <strong>Example data.</strong> {result.notice}
          </p>
        </div>
      )}

      <div className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
        {result.days.map((day) => (
          <DayCard
            key={day.date}
            day={day}
            isToday={day.date === today}
            selected={day.date === selectedDate}
            onSelect={() => setSelectedDate(day.date)}
          />
        ))}
      </div>

      {selected && (
        <DayDetail
          day={selected}
          photos={photos}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

function DayCard({
  day,
  isToday,
  selected,
  onSelect,
}: {
  day: FishingDay;
  isToday: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = formatDayLabel(day.date);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'snap-start shrink-0 w-40 text-left rounded-2xl border p-3 space-y-2 transition-colors',
        day.kind === 'observed' ? 'bg-cream/80 dark:bg-green-deep/40' : 'bg-white dark:bg-green-deep/30',
        isToday ? 'border-amber ring-2 ring-amber' : 'border-gold/20',
        selected ? 'shadow-md' : '',
      ].join(' ')}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-green-deep dark:text-cream">{label.weekday}</p>
        <p className="font-serif text-xs text-text-mid dark:text-cream/60">{label.monthDay}</p>
      </div>
      <p className="font-serif text-[10px] uppercase tracking-wider text-amber">
        {isToday ? 'Today' : day.kind === 'observed' ? 'Observed' : 'Forecast'}
        {day.example ? ' · Example' : ''}
      </p>
      {day.missing ? (
        <p className="font-serif text-sm text-text-mid dark:text-cream/60">No report yet</p>
      ) : (
        <>
          <p className={`font-display text-lg capitalize ${biteClass(day.bite)}`}>{day.bite}</p>
          <p className="font-serif text-xs text-text-dark dark:text-cream/80 line-clamp-2">{day.biteNote}</p>
          <dl className="font-serif text-xs text-text-mid dark:text-cream/70 space-y-1">
            <div><dt className="inline">Wind </dt><dd className="inline text-text-dark dark:text-cream">{windLine(day)}</dd></div>
            <div><dt className="inline">Tide </dt><dd className="inline text-text-dark dark:text-cream">{tideLine(day)}</dd></div>
            <div><dt className="inline">Water </dt><dd className="inline text-text-dark dark:text-cream">{waterLine(day)}</dd></div>
          </dl>
        </>
      )}
    </button>
  );
}

function DayDetail({
  day,
  photos,
  onClose,
}: {
  day: FishingDay;
  photos: MemberDayPhoto[];
  onClose: () => void;
}) {
  const label = formatDayLabel(day.date);
  return (
    <div className="fixed inset-0 z-40 bg-green-deep/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${label.weekday} ${label.monthDay} fishing report`}
        className="absolute inset-x-0 bottom-0 md:inset-auto md:left-1/2 md:top-1/2 md:w-[40rem] md:-translate-x-1/2 md:-translate-y-1/2 max-h-[88vh] overflow-y-auto rounded-t-2xl md:rounded-2xl bg-cream dark:bg-green-deep border border-gold/20 p-5 space-y-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-serif text-xs uppercase tracking-wider text-amber">
              {day.kind === 'observed' ? 'Observed' : 'Forecast'}
              {day.example ? ' · Example' : ''}
            </p>
            <h2 className="font-display text-2xl text-green-deep dark:text-cream">
              {label.weekday} {label.monthDay}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="font-serif text-sm text-amber">Close</button>
        </div>

        {day.missing ? (
          <p className="font-serif text-sm text-text-mid dark:text-cream/70">No shareable report has been posted for this date.</p>
        ) : (
          <>
            <p className="font-serif text-sm text-text-dark dark:text-cream/90">{day.summary}</p>
            <p className={`font-display text-xl capitalize ${biteClass(day.bite)}`}>
              {day.bite}{day.biteNote ? ` — ${day.biteNote}` : ''}
            </p>
            <ul className="space-y-2">
              {conditionLines(day).map((line) => (
                <li key={line} className="font-serif text-sm text-text-dark dark:text-cream/90">{line}</li>
              ))}
              {visibleMetrics(day).map((metric) => (
                <li key={`${metric.type}-${metric.value}`} className="font-serif text-sm text-text-dark dark:text-cream/90">
                  <span className="text-text-mid dark:text-cream/60">{metric.label}: </span>
                  {metric.value}{metric.unit ? ` ${metric.unit}` : ''}
                  {metric.note ? ` — ${metric.note}` : ''}
                </li>
              ))}
            </ul>
            {day.sections.map((section) => (
              <section key={`${section.type}-${section.title}`}>
                <h3 className="font-display text-lg text-green-deep dark:text-gold">{section.title}</h3>
                <p className="font-serif text-sm text-text-dark dark:text-cream/90 whitespace-pre-wrap">{section.body}</p>
              </section>
            ))}
            {day.sources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {day.sources.map((source) => (
                  <a
                    key={`${source.type}-${source.url}`}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-xs text-amber border border-amber/40 rounded-full px-3 py-1 hover:bg-amber/10"
                  >
                    {source.label}
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        <section>
          <h3 className="font-display text-lg text-green-deep dark:text-gold mb-2">Member photos</h3>
          {photos.length === 0 ? (
            <p className="font-serif text-sm text-text-mid dark:text-cream/70">No member photos matched this date.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {photos.map((photo) => (
                <li key={photo.id} className="rounded-xl overflow-hidden border border-gold/15 bg-white/40 dark:bg-green-deep/40">
                  <div className="relative aspect-square">
                    <Image
                      src={photo.photoUrl}
                      alt={photo.caption ?? 'Member catch photo'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 240px"
                    />
                  </div>
                  <p className="font-serif text-xs text-text-dark dark:text-cream/80 p-2">
                    {photo.displayName ?? 'Member'}
                    {photo.species ? ` · ${photo.species}` : ''}
                    {photo.caption ? ` — ${photo.caption}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function windLine(day: FishingDay): string {
  const numeric = numericWind(day);
  if (numeric) return numeric;
  const speed = metricLine(day, 'wind_speed');
  const dir = metricLine(day, 'wind_dir');
  if (speed === '—' && dir === '—') return '—';
  if (dir === '—') return speed;
  if (speed === '—') return dir;
  return `${speed} ${dir}`;
}

function waterLine(day: FishingDay): string {
  if (day.conditions?.waterTempF != null) return `${formatNum(day.conditions.waterTempF)}°F`;
  return metricLine(day, 'water_temp');
}

function tideLine(day: FishingDay): string {
  const numeric = numericTide(day);
  if (numeric) return numeric;
  const high = metricLine(day, 'tide_high');
  const low = metricLine(day, 'tide_low');
  if (high === '—' && low === '—') return '—';
  return `H ${high} · L ${low}`;
}

function conditionLines(day: FishingDay): string[] {
  const lines: string[] = [];
  const wind = numericWind(day);
  if (wind) lines.push(`Wind ${wind}`);
  const water = day.conditions?.waterTempF;
  if (water != null) lines.push(`Water ${formatNum(water)}°F`);
  const air = day.conditions?.airTempF;
  if (air != null) lines.push(`Air ${formatNum(air)}°F`);
  const tide = numericTide(day);
  if (tide) lines.push(tide);
  const range = day.conditions?.tideRangeFt;
  if (range != null) lines.push(`Tide range ${formatNum(range)} ft`);
  const level = day.conditions?.waterLevelFt;
  if (level != null) lines.push(`Water level ${formatNum(level)} ft`);
  return lines;
}

function visibleMetrics(day: FishingDay): FishingDay['metrics'] {
  const conditions = day.conditions;
  const hidden = new Set<string>();
  if (conditions && (conditions.windSpeedMph != null || conditions.windGustMph != null || conditions.windDirDeg != null)) {
    hidden.add('wind_speed');
    hidden.add('wind_dir');
    hidden.add('wind_gust');
  }
  if (conditions?.waterTempF != null) hidden.add('water_temp');
  if (conditions?.airTempF != null) hidden.add('air_temp');
  if (conditions && (conditions.tideHighFt != null || conditions.tideHighTime || conditions.tideLowFt != null || conditions.tideLowTime)) {
    hidden.add('tide_high');
    hidden.add('tide_low');
  }
  if (conditions?.tideRangeFt != null) hidden.add('tide_range');
  if (conditions?.waterLevelFt != null) hidden.add('water_level');
  return day.metrics.filter((metric) => !hidden.has(metric.type));
}

function numericWind(day: FishingDay): string | null {
  const conditions = day.conditions;
  if (!conditions) return null;
  const { windSpeedMph, windGustMph, windDirDeg } = conditions;
  if (windSpeedMph == null && windGustMph == null && windDirDeg == null) return null;
  const parts: string[] = [];
  const direction = windDirDeg == null ? '' : ` ${compass(windDirDeg)}`;
  if (windSpeedMph != null) parts.push(`${formatNum(windSpeedMph)} mph${direction}`);
  else if (direction) parts.push(direction.trim());
  if (windGustMph != null) parts.push(`gusts ${formatNum(windGustMph)}`);
  return parts.join(', ');
}

function numericTide(day: FishingDay): string | null {
  const conditions = day.conditions;
  if (!conditions) return null;
  const low = tidePart('Low', conditions.tideLowFt, conditions.tideLowTime);
  const high = tidePart('High', conditions.tideHighFt, conditions.tideHighTime);
  if (!low && !high) return null;
  return [low, high].filter(Boolean).join(' · ');
}

function tidePart(label: string, feet: number | null, time: string | null): string | null {
  if (feet == null && !time) return null;
  return [label, feet == null ? '' : `${formatNum(feet)} ft`, time ? formatClock(time) : ''].filter(Boolean).join(' ');
}

function compass(degrees: number): string {
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return labels[Math.round(degrees / 45) % 8] ?? 'N';
}

function formatNum(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

function formatClock(hhmm: string): string {
  const [hourText, minute] = hhmm.split(':');
  const hour = Number(hourText);
  const suffix = hour >= 12 ? 'p' : 'a';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${minute}${suffix}`;
}

function metricLine(day: FishingDay, type: string): string {
  const parts = day.metrics
    .filter((metric) => metric.type === type)
    .map((metric) => (metric.unit ? `${metric.value} ${metric.unit}` : metric.value));
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function biteClass(bite: FishingDay['bite']): string {
  if (bite === 'hot') return 'text-amber';
  if (bite === 'good') return 'text-green-water dark:text-cream';
  if (bite === 'fair') return 'text-gold';
  return 'text-text-mid dark:text-cream/60';
}
