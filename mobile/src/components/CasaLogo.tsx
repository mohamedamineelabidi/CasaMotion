import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/theme';

/**
 * CasaMotion mark: an open "C" arc with an accent dot on the opening.
 * Mirrors the logo used in research/ux-report.html.
 */
export function CasaLogo({
  size = 44,
  color = colors.blue,
  dotColor = colors.cyan,
}: {
  size?: number;
  color?: string;
  dotColor?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Path
        d="M34 13A15 15 0 1 0 34 31"
        fill="none"
        stroke={color}
        strokeWidth={5.5}
        strokeLinecap="round"
      />
      <Circle cx={34} cy={22} r={5.4} fill={dotColor} />
    </Svg>
  );
}
