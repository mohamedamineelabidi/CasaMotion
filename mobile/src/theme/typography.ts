import { TextStyle } from 'react-native';

/**
 * Font families. Names match the loaded @expo-google-fonts keys.
 * Loaded in app/_layout.tsx via useFonts.
 */
export const fonts = {
  display: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  mono: 'JetBrainsMono_500Medium',
} as const;

type Variant = TextStyle;

export const type: Record<string, Variant> = {
  h1: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  h2: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  h3: { fontFamily: fonts.display, fontSize: 19, lineHeight: 25, letterSpacing: -0.3 },
  title: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  smallStrong: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 19 },
  caption: { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 15, letterSpacing: 0.4 },
  mono: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 19 },
  monoSmall: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 16 },
};
