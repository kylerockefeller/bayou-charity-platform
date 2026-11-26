export const CATCH_SHARE_TEXT =
  'Check out this catch from the Bayou Charity Fishing Club 🎣 bayoucharity.org';

export const OG_DESCRIPTION =
  'Fish Pics from our members. Join the club and support Louisiana coastal restoration at bayoucharity.org.';

export const CLUB_NAME = 'Bayou Charity Fishing Club';
export const STRIP_NAME = 'BAYOU CHARITY FISHING CLUB';
export const CLUB_URL = 'bayoucharity.org';

const SAFE_NAME = /^[A-Za-z][A-Za-z'’.-]{0,24}$/;
const SAFE_SPECIES = /^[A-Za-z][A-Za-z .'-]{0,40}$/;

export function ogTitle(displayName: string | null | undefined): string {
  const first = (displayName ?? '').trim().split(/\s+/)[0] ?? '';
  if (SAFE_NAME.test(first)) return `${first}'s catch | ${CLUB_NAME}`;
  return `Fish Pics | ${CLUB_NAME}`;
}

export function publicSpecies(species: string | null | undefined): string | null {
  const value = (species ?? '').trim();
  if (!SAFE_SPECIES.test(value)) return null;
  return value;
}

export const THANKSGIVING_CAPTION = `Happy Thanksgiving from the bayou 🦃🎣 It's breezy and chilly this morning, 45° with wind around 16. It's clear all day with a high near 56, and things settle down after lunch. If you're sneaking out between the turkey and the pie, fish the protected banks in the afternoon.

Want the full report, plus member fishing reports and photos? Join the Bayou Charity Fishing Club at bayoucharity.org and share your catch.

#BayouCharity #LouisianaFishing #PlaqueminesParish`;

export const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
