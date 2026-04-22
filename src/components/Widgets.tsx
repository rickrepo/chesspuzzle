// Small shared UI atoms used across the Puzzle layout.
import { useEffect, useRef, useState } from 'react';
import type { Puzzle, ArchivePuzzle } from '~/data/puzzles';

export function Rule({ color = 'rgba(26,22,19,0.15)' }: { color?: string }) {
  return <div style={{ height: 1, background: color, width: '100%' }} />;
}

export function HeaderMark({ size = 22 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: 'block' }}>
        <rect x="0" y="0" width="40" height="40" fill="#1a1613" />
        <path d="M 8 12 L 32 12 M 20 12 L 20 30" stroke="#f3ead8" strokeWidth="3" strokeLinecap="square" fill="none" />
        <circle cx="30" cy="30" r="2" fill="#c24a2f" />
      </svg>
      <span style={{
        fontFamily: 'var(--font-serif)', fontWeight: 500,
        fontSize: size * 0.95, letterSpacing: '-0.01em', color: '#1a1613',
      }}>Tempo</span>
    </div>
  );
}

export function StarRow({ stars, size = 16, inverted = false }: { stars: number; size?: number; inverted?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[0, 1, 2].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 2 L15 9 L22 9.5 L16.5 14.5 L18.5 22 L12 17.5 L5.5 22 L7.5 14.5 L2 9.5 L9 9 Z"
            fill={i < stars ? (inverted ? '#f3ead8' : '#c24a2f') : 'none'}
            stroke={i < stars ? (inverted ? '#f3ead8' : '#c24a2f') : (inverted ? 'rgba(243,234,216,0.35)' : 'rgba(26,22,19,0.25)')}
            strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

export function useTimer(running: boolean): [number, (ms: number) => void] {
  const [ms, setMs] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - ms;
    const id = setInterval(() => setMs(Date.now() - (startRef.current as number)), 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return [ms, setMs];
}

export function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function kfmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return String(n);
}

export function scoreFor(userMoves: number, par: number, usedHint: boolean) {
  const delta = userMoves - par;
  let stars: number;
  if (delta <= 0) stars = 3;
  else if (delta === 1) stars = 2;
  else stars = 1;
  if (usedHint) stars = Math.min(stars, 1);
  return {
    stars,
    label: delta <= 0 ? 'Clean' : delta === 1 ? 'One over' : delta === 2 ? 'Two over' : `${delta} over`,
    over: delta,
  };
}

export function buildShareText(puzzle: Puzzle, userMoves: number, par: number, stars: number, timeMs: number, usedHint: boolean) {
  const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  const overStr = userMoves === par ? '' : ` (${userMoves > par ? '+' : ''}${userMoves - par})`;
  const line1 = `Tempo №${puzzle.id} · Mate in ${puzzle.mateIn}`;
  const line2 = `${starStr}   ${userMoves}/${par}${overStr}   ${fmt(timeMs)}${usedHint ? '   💡' : ''}`;
  return `${line1}\n${line2}\ntempo.daily`;
}

export function SolversStat({ stats, tone = 'light' }: { stats: Puzzle['stats']; tone?: 'light' | 'dark' }) {
  const ink = tone === 'dark' ? 'rgba(243,234,216,0.7)' : 'rgba(26,22,19,0.55)';
  const accent = tone === 'dark' ? '#f3ead8' : '#1a1613';
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 10,
      fontFamily: 'var(--font-serif)', fontSize: 13, fontStyle: 'italic',
      color: ink, letterSpacing: '0.01em',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: '#c24a2f',
        display: 'inline-block', alignSelf: 'center',
        animation: 'tempo-check-pulse 2.4s ease-in-out infinite',
      }} />
      <span><b style={{ fontStyle: 'normal', color: accent, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{stats.solvers.toLocaleString()}</b> solvers today</span>
      <span style={{ color: ink, opacity: 0.5 }}>·</span>
      <span>median <b style={{ fontStyle: 'normal', color: accent, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{stats.medianMoves}</b> moves</span>
    </div>
  );
}

export function YesterdayCard({ puzzle }: { puzzle: ArchivePuzzle }) {
  return (
    <a href="#" style={{
      textDecoration: 'none', color: 'inherit', display: 'block',
      padding: '14px 16px', border: '1px solid rgba(26,22,19,0.14)',
      background: 'rgba(26,22,19,0.02)', transition: 'all .18s',
    }}
      onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#1a1613'; el.style.color = '#f3ead8'; el.style.borderColor = '#1a1613'; }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(26,22,19,0.02)'; el.style.color = 'inherit'; el.style.borderColor = 'rgba(26,22,19,0.14)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.7 }}>Yesterday</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', opacity: 0.5 }}>№ {puzzle.id}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontStyle: 'italic', lineHeight: 1.15, marginBottom: 8, letterSpacing: '-0.01em' }}>{puzzle.subtitle}</div>
      <div style={{ display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', opacity: 0.65, textTransform: 'uppercase' }}>
        <span>Mate in {puzzle.mateIn}</span>
        <span>·</span>
        <span>{kfmt(puzzle.solvedCount)} solved</span>
        <span>·</span>
        <span>median {puzzle.medianMoves}</span>
      </div>
    </a>
  );
}

export interface ObjectiveBannerProps {
  mateIn: number;
  sideLabel: string;
  status: 'ready' | 'solving' | 'solved' | 'forfeit' | 'over';
  userMoveCount: number;
  par: number;
  viewing: boolean;
  onReturnLive: () => void;
  viewingIdx: number;
  maxIdx: number;
  width?: number;
}

export function ObjectiveBanner({
  mateIn, sideLabel, status, userMoveCount, par, viewing, onReturnLive, viewingIdx, maxIdx, width = 560,
}: ObjectiveBannerProps) {
  let eyebrow: string;
  let title: React.ReactNode;
  let sub: React.ReactNode;
  let eyebrowColor = '#c24a2f';
  if (viewing) {
    eyebrow = 'Replaying';
    title = <>Move <span style={{ fontStyle: 'italic' }}>{viewingIdx}</span> of {maxIdx}</>;
    sub = <>Viewing a past position. <span onClick={onReturnLive} style={{ cursor: 'pointer', borderBottom: '1px solid #1a1613', color: '#1a1613' }}>Return to live</span>.</>;
    eyebrowColor = 'rgba(26,22,19,0.55)';
  } else if (status === 'solved') {
    eyebrow = 'Solved';
    title = <>Mate in <span style={{ fontStyle: 'italic' }}>{userMoveCount}</span></>;
    sub = userMoveCount === par ? 'Clean line. Well played.' : userMoveCount < par ? `Tighter than the best known line by ${par - userMoveCount}.` : `${userMoveCount - par} move${userMoveCount - par === 1 ? '' : 's'} over the best line.`;
    eyebrowColor = '#1a7a3a';
  } else if (status === 'forfeit') {
    eyebrow = 'Forfeited';
    title = <>Mate in <span style={{ fontStyle: 'italic' }}>{mateIn}</span></>;
    sub = 'The puzzle is set aside. Come back tomorrow.';
    eyebrowColor = 'rgba(26,22,19,0.55)';
  } else if (status === 'over') {
    eyebrow = 'Game over';
    title = <>Position lost</>;
    sub = 'The position is no longer winning. Forfeit or keep exploring.';
    eyebrowColor = '#c24a2f';
  } else {
    eyebrow = status === 'solving' ? 'Solving' : 'Today';
    title = <>Mate in <span style={{ fontStyle: 'italic' }}>{mateIn}</span></>;
    sub = <>{sideLabel}. The best line is <b style={{ fontWeight: 600, color: '#1a1613' }}>{par} move{par === 1 ? '' : 's'}</b> — each extra costs a star.</>;
  }
  return (
    <div style={{
      width, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start',
      paddingBottom: 4, maxWidth: '100%',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: eyebrowColor, fontWeight: 600 }}>{eyebrow}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 44, lineHeight: 0.95, letterSpacing: '-0.02em', color: '#1a1613' }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontStyle: 'italic', color: 'rgba(26,22,19,0.62)', lineHeight: 1.4, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export interface ReplayControlsProps {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onReturnLive: () => void;
  viewing: boolean;
  viewingIdx: number;
  maxIdx: number;
  width?: number;
}

export function ReplayControls({ canPrev, canNext, onPrev, onNext, onReturnLive, viewing, viewingIdx, maxIdx, width = 560 }: ReplayControlsProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowLeft' && canPrev) { e.preventDefault(); onPrev(); }
      else if (e.key === 'ArrowRight' && canNext) { e.preventDefault(); onNext(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canPrev, canNext, onPrev, onNext]);

  const btn = (disabled: boolean): React.CSSProperties => ({
    width: 40, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: '1px solid rgba(26,22,19,0.22)',
    cursor: disabled ? 'default' : 'pointer', color: disabled ? 'rgba(26,22,19,0.25)' : '#1a1613',
    transition: 'all .15s',
  });
  return (
    <div style={{
      width, maxWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 2px', fontFamily: 'var(--font-mono)', fontSize: 10,
      color: 'rgba(26,22,19,0.5)', letterSpacing: '0.12em',
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onPrev} disabled={!canPrev} style={btn(!canPrev)} aria-label="Previous move">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M 7 1 L 3 5 L 7 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" /></svg>
        </button>
        <button onClick={onNext} disabled={!canNext} style={btn(!canNext)} aria-label="Next move">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M 3 1 L 7 5 L 3 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" /></svg>
        </button>
      </div>
      <div style={{ textTransform: 'uppercase' }}>
        {maxIdx === 0 ? 'No moves yet' : viewing ? `Move ${viewingIdx} / ${maxIdx}` : `${maxIdx} move${maxIdx === 1 ? '' : 's'} played`}
      </div>
      {viewing ? (
        <button onClick={onReturnLive} style={{
          background: '#1a1613', color: '#f3ead8', border: 'none',
          padding: '6px 12px', fontFamily: 'var(--font-sans)', fontSize: 10,
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer',
        }}>Return to live</button>
      ) : (<div style={{ width: 86 }} />)}
    </div>
  );
}

export function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,22,19,0.5)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: '#1a1613', lineHeight: 1 }}>{value}</div>
    </div>
  );
}