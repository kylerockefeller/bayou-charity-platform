// Swap ACTIVE_SHARE_FRAME to change the photo share artwork.
// dock-strip is the one in use: dark brown bar, old-gold trim, large sunset cypress.
// corner-badge and sunset-frame are the other two looks, ready to turn on.

export type ShareFrame = 'dock-strip' | 'corner-badge' | 'sunset-frame';

export const ACTIVE_SHARE_FRAME: ShareFrame = 'dock-strip';

// Strip colors from the forecast reference. The cypress square's own frame
// samples a hair lighter (rgb 48, 29, 14); the strip uses the specified brown.
export const BRAND = {
  brown: '#2B1D14',
  brownFill: 0x2b1d14ff,
  gold: '#C9A227',
  cream: '#F7F1E3',
  fishOff: '#8A7350',
} as const;

// Stand-in for Kaleb Sisson's BayouCharity_SourceFiles_Light Colorway.svg
// (sunset cypress square + cream wordmark, for dark backgrounds). That SVG
// is not in the repo. This PNG is the same layout; the wordmark is white and
// is tinted to cream when the card is drawn. The original file is not edited.
export const LOGO_FILE = 'public/brand/bayou-charity-logo-light-text.png';
export const LOGO_CROP = { left: 0, top: 0, width: 448, height: 448 } as const;
export const LOCKUP_WIDTH = 1600;
export const LOCKUP_HEIGHT = 448;

export const MARSH_FILE = 'public/Photos/Skyline Marsh golden hue.jpg';
