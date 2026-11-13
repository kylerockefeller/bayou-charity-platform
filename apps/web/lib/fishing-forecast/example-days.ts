import { dayKind, forecastWindow } from './dates';
import type { BiteLevel, FishingDay } from './types';

const BITES: BiteLevel[] = ['fair', 'good', 'hot', 'poor'];

// Synthetic window so the page can be reviewed before Ripp posts.
// Every string is marked EXAMPLE. These are not observations or a forecast.
export function buildExampleDays(today: string): FishingDay[] {
  return forecastWindow(today).map((date) => {
    const offset = date < today ? -1 : date > today ? 1 : 0;
    const index = Number(date.slice(-2));
    const bite = BITES[index % BITES.length];
    return {
      date,
      kind: dayKind(date, today),
      bite,
      biteNote: 'EXAMPLE outlook only.',
      summary: 'EXAMPLE — not a live report. Placeholder text so the layout can be reviewed before Ripp is connected.',
      metrics: [
        { type: 'wind_speed', label: 'Wind', value: offset < 0 ? '8–12' : '10–15', unit: 'mph' },
        { type: 'wind_dir', label: 'Wind direction', value: offset < 0 ? 'E' : 'SE' },
        { type: 'tide_high', label: 'High tide', value: (index % 2) === 0 ? '6:10 AM' : '7:40 AM' },
        { type: 'tide_low', label: 'Low tide', value: (index % 2) === 0 ? '12:05 PM' : '1:30 PM' },
        { type: 'water_temp', label: 'Water', value: String(70 + (index % 5)), unit: '°F' },
      ],
      sections: [
        {
          type: 'report',
          title: 'Example report',
          body: 'EXAMPLE — a full daily write-up from Ripp would appear here. This sample has no spot names and no coordinates.',
        },
      ],
      sources: [
        {
          type: 'facebook_group',
          label: 'EXAMPLE: Myrtle Grove to Grand Bayou',
          url: 'https://example.com/myrtle-grove-group',
          date,
        },
        {
          type: 'magazine',
          label: 'EXAMPLE: Louisiana Sportsman',
          url: 'https://example.com/louisiana-sportsman',
          date,
        },
        {
          type: 'local_report',
          label: 'EXAMPLE: Venice / FishNLA',
          url: 'https://example.com/venice-report',
          date,
        },
      ],
      example: true,
      missing: false,
    };
  });
}

export function emptyDay(date: string, today: string): FishingDay {
  return {
    date,
    kind: dayKind(date, today),
    bite: null,
    biteNote: '',
    summary: '',
    metrics: [],
    sections: [],
    sources: [],
    example: false,
    missing: true,
  };
}
