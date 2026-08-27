// Default / web implementation: SVG fallback only. This file is used on web
// (and any platform without a `.native` override) so Metro never bundles the
// native-only `react-native-maps` module for web. Native platforms resolve
// `MapCanvas.native.tsx` instead.
export type { MapRegion, MapCanvasProps } from './MapFallback';
export { FallbackMapCanvas as MapCanvas } from './MapFallback';
