// Detailed Staunton chess pieces (Cburnett SVG paths, hand-transcribed).
// Three treatments:
//   classic   — ivory + black with ink outlines (standard)
//   editorial — warmed sepia tones
//   outline   — ivory whites + subtly-filled blacks
import type { Color, PieceType } from '~/lib/engine';

export type PieceSetKey = 'classic' | 'editorial' | 'outline';

interface PathSpec {
  d?: string;
  type?: 'circle';
  cx?: number; cy?: number; r?: number;
  fill?: string;
  stroke?: string;
  sw?: number;
  cap?: string;
  join?: string;
  transform?: string;
}

const CBURNETT: Record<PieceType, { paths: PathSpec[] }> = {
  k: {
    paths: [
      { d: 'M 22.5,11.63 L 22.5,6', stroke: '@ink', sw: 1.5, cap: 'round', join: 'miter' },
      { d: 'M 20,8 L 25,8', stroke: '@ink', sw: 1.5, cap: 'round', join: 'miter' },
      { d: 'M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt', join: 'miter' },
      { d: 'M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt' },
      { d: 'M 11.5,30 C 17,27 27,27 32.5,30', fill: 'none', stroke: '@detail', sw: 1 },
      { d: 'M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5', fill: 'none', stroke: '@detail', sw: 1 },
      { d: 'M 11.5,37 C 17,34 27,34 32.5,37', fill: 'none', stroke: '@detail', sw: 1 },
    ],
  },
  q: {
    paths: [
      { d: 'M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt', join: 'miter' },
      { d: 'M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt', join: 'miter' },
      { d: 'M 11.5,30 C 15,29 30,29 33.5,30', fill: 'none', stroke: '@detail', sw: 1 },
      { d: 'M 12,33.5 C 18,32.5 27,32.5 33,33.5', fill: 'none', stroke: '@detail', sw: 1 },
      { type: 'circle', cx: 6, cy: 12, r: 2, fill: '@fill', stroke: '@ink', sw: 1.5 },
      { type: 'circle', cx: 14, cy: 9, r: 2, fill: '@fill', stroke: '@ink', sw: 1.5 },
      { type: 'circle', cx: 22.5, cy: 8, r: 2, fill: '@fill', stroke: '@ink', sw: 1.5 },
      { type: 'circle', cx: 31, cy: 9, r: 2, fill: '@fill', stroke: '@ink', sw: 1.5 },
      { type: 'circle', cx: 39, cy: 12, r: 2, fill: '@fill', stroke: '@ink', sw: 1.5 },
    ],
  },
  r: {
    paths: [
      { d: 'M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt', join: 'miter' },
      { d: 'M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt', join: 'miter' },
      { d: 'M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt', join: 'miter' },
      { d: 'M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt', join: 'miter' },
      { d: 'M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt', join: 'miter' },
      { d: 'M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt', join: 'miter' },
      { d: 'M 12,35.5 L 33,35.5 L 33,35.5', fill: 'none', stroke: '@detail', sw: 1, cap: 'square' },
      { d: 'M 13,31.5 L 32,31.5', fill: 'none', stroke: '@detail', sw: 1, cap: 'square' },
      { d: 'M 14,29.5 L 31,29.5', fill: 'none', stroke: '@detail', sw: 1, cap: 'square' },
      { d: 'M 14,16.5 L 31,16.5', fill: 'none', stroke: '@detail', sw: 1, cap: 'square' },
      { d: 'M 11,14 L 34,14', fill: 'none', stroke: '@detail', sw: 1, cap: 'square' },
    ],
  },
  b: {
    paths: [
      { d: 'M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt' },
      { d: 'M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt' },
      { type: 'circle', cx: 22.5, cy: 8, r: 2.5, fill: '@fill', stroke: '@ink', sw: 1.5 },
      { d: 'M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18', fill: 'none', stroke: '@detail', sw: 1, cap: 'round', join: 'round' },
    ],
  },
  n: {
    paths: [
      { d: 'M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt', join: 'miter' },
      { d: 'M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,5.5 16.5,4 16.5,4 C 16.5,4 17.28,5.009 17,6 C 18.5,5 19,6 19,6 C 19,6 20.5,6.5 21.5,8 C 23.5,8 25.5,8 27,10 L 22,10 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'butt', join: 'miter' },
      { d: 'M 9.5,25.5 A 0.5,0.5 0 1,1 8.5,25.5 A 0.5,0.5 0 1,1 9.5,25.5 z', fill: '@ink', stroke: '@ink', sw: 1.5, cap: 'butt' },
      { d: 'M 15,15.5 A 0.5,1.5 0 1,1 14,15.5 A 0.5,1.5 0 1,1 15,15.5 z', fill: '@ink', stroke: '@ink', sw: 1.5, cap: 'butt', transform: 'matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)' },
    ],
  },
  p: {
    paths: [
      { d: 'M 22.5,9 C 20.29,9 18.5,10.79 18.5,13 C 18.5,13.89 18.79,14.71 19.28,15.38 C 17.33,16.5 16,18.59 16,21 C 16,23.03 16.94,24.84 18.41,26.03 C 15.41,27.09 11,31.58 11,39.5 L 34,39.5 C 34,31.58 29.59,27.09 26.59,26.03 C 28.06,24.84 29,23.03 29,21 C 29,18.59 27.67,16.5 25.72,15.38 C 26.21,14.71 26.5,13.89 26.5,13 C 26.5,10.79 24.71,9 22.5,9 z', fill: '@fill', stroke: '@ink', sw: 1.5, cap: 'round', join: 'miter' },
    ],
  },
};

interface ThemeColors { fill: string; ink: string; detail: string; }
interface Theme { white: ThemeColors; black: ThemeColors; filter: string; }

const THEMES: Record<PieceSetKey, Theme> = {
  classic: {
    white: { fill: '#f6ecd6', ink: '#1a1613', detail: '#1a1613' },
    black: { fill: '#2a211b', ink: '#f0e4c8', detail: '#f0e4c8' },
    filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,0.28))',
  },
  editorial: {
    white: { fill: '#fbf3e0', ink: '#2a1d15', detail: '#2a1d15' },
    black: { fill: '#352720', ink: '#f1e4c9', detail: '#f1e4c9' },
    filter: 'drop-shadow(0 2px 3px rgba(60,30,10,0.28))',
  },
  outline: {
    white: { fill: '#faf2de', ink: '#1a1613', detail: '#1a1613' },
    black: { fill: '#1a1613', ink: '#1a1613', detail: '#f0e4c8' },
    filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.15))',
  },
};

function resolve(val: string | undefined, colors: ThemeColors): string | undefined {
  if (val === '@fill') return colors.fill;
  if (val === '@ink') return colors.ink;
  if (val === '@detail') return colors.detail;
  return val;
}

function renderPiece(type: PieceType, color: Color, theme: Theme) {
  const spec = CBURNETT[type];
  if (!spec) return null;
  const colors = color === 'w' ? theme.white : theme.black;
  return (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible', filter: theme.filter }}>
      {spec.paths.map((p, i) => {
        const fill = resolve(p.fill, colors) ?? 'none';
        const stroke = resolve(p.stroke, colors);
        if (p.type === 'circle') {
          return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={fill} stroke={stroke}
            strokeWidth={p.sw} strokeLinecap="round" strokeLinejoin="round" />;
        }
        return <path key={i} d={p.d} fill={fill} stroke={stroke}
          strokeWidth={p.sw}
          strokeLinecap={(p.cap as any) || 'round'}
          strokeLinejoin={(p.join as any) || 'round'}
          transform={p.transform} />;
      })}
    </svg>
  );
}

export interface PieceGlyphProps {
  type: PieceType;
  color: Color;
  setKey?: PieceSetKey;
  size?: number;
}

export function PieceGlyph({ type, color, setKey = 'classic', size = 48 }: PieceGlyphProps) {
  const theme = THEMES[setKey] || THEMES.classic;
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: size * 0.04, boxSizing: 'border-box',
      pointerEvents: 'none', userSelect: 'none',
    }}>
      {renderPiece(type, color, theme)}
    </div>
  );
}

export const PIECE_SETS: Record<PieceSetKey, { label: string }> = {
  classic: { label: 'Classic' },
  editorial: { label: 'Editorial' },
  outline: { label: 'Outline' },
};