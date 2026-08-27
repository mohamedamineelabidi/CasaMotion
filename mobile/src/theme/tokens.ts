/**
 * CasaMotion design tokens — flat, high-contrast ride-hailing system
 * (Uber / inDrive inspired). No gradients.
 */

export const colors = {
  // Brand / primary action (near-black, premium)
  ink: '#0b1220',
  primary: '#0b1220',
  blue: '#2d6bff',
  cyan: '#22d3ee',
  violet: '#7c3aed',
  navy: '#0a1430',

  // Neutral scale
  bg: '#f6f7f9',
  surface: '#ffffff',
  panel: '#f2f4f7',
  line: '#e7e9ef',
  line2: '#eef1f6',
  text: '#0b1220',
  text2: '#5a6474',
  text3: '#98a0af',

  // Semantic
  ok: '#12b76a',
  warn: '#f79009',
  err: '#f04438',
  info: '#2d6bff',

  // Soft tints
  blueSoft: '#eef3ff',
  okSoft: '#e7f8f0',
  warnSoft: '#fff3e0',
  errSoft: '#fdecea',
  inkSoft: '#eef0f4',

  white: '#ffffff',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  '2xl': 30,
  '3xl': 44,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#0a1330',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  md: {
    shadowColor: '#0a1330',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  lg: {
    shadowColor: '#0a1330',
    shadowOpacity: 0.18,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 18 },
    elevation: 18,
  },
} as const;

// Casablanca map defaults
export const CASABLANCA = {
  latitude: 33.5731,
  longitude: -7.5898,
  latitudeDelta: 0.16,
  longitudeDelta: 0.16,
} as const;
