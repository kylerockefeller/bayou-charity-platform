# Fishing forecast ingest (schema version 1)

Ripp posts one shareable day at a time. The members page at `/members/forecast` reads those days. Until a row exists, the page shows **example** cards and says so. Example cards are not a forecast.

This document is the contract. Do not put Kyle's private almanac spots or coordinates in the payload.

## Endpoint

`POST /api/fishing-forecast/ingest`

Header:

```
x-fishing-ingest-secret: <FISHING_INGEST_SECRET>
Content-Type: application/json
```

`FISHING_INGEST_SECRET` is an environment variable. It is not stored in the repo. The route compares the header with `crypto.timingSafeEqual`. A missing secret returns 503. A wrong secret returns 401.

The route upserts on `date` with the Supabase service role. Members cannot write this table. The table itself is only a draft in `supabase/proposed/NOT_APPLIED_fishing_forecast.sql` and has not been applied. Until that file is applied, ingest returns 503.

## Shareable fields only

The body is a strict object. Unknown keys are rejected. These keys are refused even if they appear nested: `lat`, `lng`, `latitude`, `longitude`, `spot`, `spots`, `lease`, `waypoint`, `coordinate`, `coordinates`, `gps`, `location`, `place`.

Text is refused when it contains a decimal coordinate pair, or the words lease, waypoint, gps pin, coordinates, latitude, or longitude.

Ripp must drop named lease spots and coordinates before posting. The page also does not read `pins.lat` or `pins.lng`. Member photos are matched on `catch_date` only.

`shareable` must be the literal `true`.

## Body (version 1)

```json
{
  "schema_version": 1,
  "shareable": true,
  "date": "2026-11-13",
  "kind": "forecast",
  "bite": "good",
  "bite_note": "Moving water in the afternoon.",
  "summary": "One short shareable paragraph. No spot names.",
  "metrics": [
    { "type": "wind_speed", "label": "Wind", "value": "10–15", "unit": "mph" },
    { "type": "wind_dir", "label": "Wind direction", "value": "SE" },
    { "type": "tide_high", "label": "High tide", "value": "6:40 AM" },
    { "type": "tide_low", "label": "Low tide", "value": "1:10 PM" },
    { "type": "water_temp", "label": "Water", "value": "72", "unit": "°F" }
  ],
  "sections": [
    { "type": "report", "title": "Daily report", "body": "Longer shareable write-up." }
  ],
  "sources": [
    {
      "type": "magazine",
      "label": "Louisiana Sportsman",
      "url": "https://www.louisianasportsman.com/",
      "date": "2026-11-13"
    }
  ]
}
```

`kind` is `observed` for a day that already happened and `forecast` for today or a future day. The page still classifies the card from the calendar date in America/Chicago.

`bite` is `poor`, `fair`, `good`, or `hot`.

`metrics`, `sections`, and `sources` are lists. A new metric `type` or section `type` shows up in the day detail without a layout change. The card always looks for `wind_speed`, `wind_dir`, `tide_high`, `tide_low`, and `water_temp`. Missing ones render as a dash.

`sources[].type` is a label for the chip (`facebook_group`, `magazine`, `local_report`, or any new snake_case type). `url` must be http or https.

## Responses

- `200` `{ "ok": true, "date": "2026-11-13", "schema_version": 1 }`
- `401` missing or wrong secret
- `422` schema or privacy rejection
- `503` secret, service role, or table not configured

## Open questions for Ripp

- What can Ripp actually POST today: the full JSON above, or a looser almanac export that still needs a translator?
- How often does it run, and does it send one day or a batch? This route accepts one day per request. A batch can be added as schema version 2.
- Which numbers are observed (station or log) and which are forecast? The `kind` field is that distinction.
- Where does water temperature come from?
- Which public URLs should the source chips use for the Myrtle Grove to Grand Bayou group, Louisiana Sportsman, and Venice/FishNLA? The sample page uses `example.com` links so it does not point at the wrong report.
