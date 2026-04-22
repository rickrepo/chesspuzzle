// Cards shown on end-of-game states: forfeit reveal, share, scoreboard.
import { useState } from 'react';
import type { Puzzle } from '~/data/puzzles';
import { StarRow, fmt, scoreFor, buildShareText } from './Widgets';

export function ForfeitCard({ puzzle, timeMs, currentStep, onReplay }: {
  puzzle: Puzzle; timeMs: number; currentStep: number; onReplay: () => void;
}) {
  const moves = puzzle.solution || [];
  return (
    <div style={{
      background: '#f3ead8', border: '1px solid rgba(26,22,19,0.18)',
      padding: '18px 18px 16px', marginTop: 10,
      animation: 'tempo-fade-up .4s ease both',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(26,22,19,0.55)', fontWeight: 600 }}>Solution</div>
        <button onClick={onReplay} style={{
          background: 'transparent', border: '1px solid rgba(26,22,19,0.25)',
          padding: '4px 10px', fontFamily: 'var(--font-sans)', fontSize: 9,
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
          color: 'rgba(26,22,19,0.7)', cursor: 'pointer',
        }}>Replay ↻</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {moves.map((m, i) => {
          const active = i === currentStep;
          const played = i <= currentStep;
          return (
            <div key={i} style={{
              display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '6px 9px',
              background: active ? '#c24a2f' : played ? 'rgba(26,22,19,0.08)' : 'rgba(26,22,19,0.03)',
              color: active ? '#fff' : played ? '#1a1613' : 'rgba(26,22,19,0.35)',
              fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500,
              transition: 'all .25s', border: played && !active ? '1px solid rgba(26,22,19,0.1)' : '1px solid transparent',
            }}>
              <span style={{ fontSize: 9, opacity: active ? 0.85 : 0.5, letterSpacing: '0.08em' }}>{Math.floor(i / 2) + 1}{i % 2 === 0 ? '.' : '…'}</span>
              <span>{m}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,22,19,0.6)', lineHeight: 1.5, marginBottom: 10 }}>
        {currentStep < 0 ? 'Watch the quiet queen move.'
          : currentStep < moves.length - 1 ? 'Black is forced — every escape fails.'
            : 'Mate. Tomorrow brings a fresh puzzle.'}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'rgba(26,22,19,0.45)' }}>
        TIME · {fmt(timeMs)}
      </div>
    </div>
  );
}

export function ShareCard({ puzzle, userMoves, par, timeMs, usedHint }: {
  puzzle: Puzzle; userMoves: number; par: number; timeMs: number; usedHint: boolean;
}) {
  const { stars, label } = scoreFor(userMoves, par, usedHint);
  const shareText = buildShareText(puzzle, userMoves, par, stars, timeMs, usedHint);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <div style={{ background: '#1a1613', color: '#f3ead8', padding: '24px 24px 22px', animation: 'tempo-fade-up .45s cubic-bezier(.2,.7,.2,1) both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: '#c24a2f', fontWeight: 600, marginBottom: 6 }}>Checkmate</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontStyle: 'italic', lineHeight: 1, letterSpacing: '-0.01em' }}>{label}.</div>
        </div>
        <StarRow stars={stars} size={22} inverted />
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16,
        padding: '14px 0', borderTop: '1px solid rgba(243,234,216,0.18)',
        borderBottom: '1px solid rgba(243,234,216,0.18)', marginBottom: 16,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'rgba(243,234,216,0.55)', marginBottom: 4 }}>MOVES</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500 }}>{userMoves}<span style={{ color: 'rgba(243,234,216,0.4)', fontSize: 14 }}>/{par}</span></div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'rgba(243,234,216,0.55)', marginBottom: 4 }}>TIME</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500 }}>{fmt(timeMs)}</div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'rgba(243,234,216,0.55)', marginBottom: 4 }}>HINT</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500 }}>{usedHint ? 'Yes' : '—'}</div>
        </div>
      </div>

      <div style={{
        background: 'rgba(243,234,216,0.07)', padding: '12px 14px',
        fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
        color: 'rgba(243,234,216,0.9)', whiteSpace: 'pre-wrap', marginBottom: 14,
      }}>{shareText}</div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={copy} style={{
          flex: 1, background: '#c24a2f', color: '#fff', border: 'none',
          padding: '12px 14px', fontFamily: 'var(--font-sans)', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
          cursor: 'pointer', transition: 'background .15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#d85837')}
          onMouseLeave={e => (e.currentTarget.style.background = '#c24a2f')}
        >{copied ? 'Copied ✓' : 'Copy result'}</button>
        <button style={{
          background: 'transparent', color: '#f3ead8',
          border: '1px solid rgba(243,234,216,0.35)',
          padding: '12px 14px', fontFamily: 'var(--font-sans)', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer',
        }}>Archive</button>
      </div>

      <div style={{ marginTop: 14, fontFamily: 'var(--font-serif)', fontSize: 13, fontStyle: 'italic', color: 'rgba(243,234,216,0.5)', textAlign: 'center', letterSpacing: '0.02em' }}>
        Tomorrow's puzzle in 14:22:07
      </div>
    </div>
  );
}

export function Scoreboard({ stats, userMoves, par }: { stats: Puzzle['stats']; userMoves: number; par: number }) {
  const max = Math.max(...stats.distribution.map(d => d.pct));
  return (
    <div style={{ background: 'rgba(26,22,19,0.04)', padding: '18px 20px 16px', animation: 'tempo-fade-up .45s cubic-bezier(.2,.7,.2,1) both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c24a2f', fontWeight: 600, marginBottom: 4 }}>How you compare</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontStyle: 'italic', color: '#1a1613', letterSpacing: '-0.01em' }}>{stats.solvers.toLocaleString()} have solved today</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'rgba(26,22,19,0.5)' }}>SOLVE RATE</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#1a1613', fontWeight: 500 }}>{stats.percentSolved}%</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stats.distribution.map((d, i) => {
          const isYou = userMoves === d.moves || (i === stats.distribution.length - 1 && userMoves >= d.moves);
          const w = Math.max(4, (d.pct / max) * 100);
          const barBg = isYou ? '#c24a2f' : '#1a1613';
          const barOpacity = isYou ? 1 : 0.28;
          return (
            <div key={d.moves} style={{ display: 'grid', gridTemplateColumns: '22px 1fr 40px', gap: 10, alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              <div style={{ color: isYou ? '#c24a2f' : 'rgba(26,22,19,0.5)', fontWeight: isYou ? 600 : 400, letterSpacing: '0.06em' }}>{d.moves}</div>
              <div style={{ position: 'relative', height: 18, background: 'rgba(26,22,19,0.06)' }}>
                <div style={{ position: 'absolute', inset: 0, width: `${w}%`, background: barBg, opacity: barOpacity, transition: 'width .6s cubic-bezier(.2,.7,.2,1)' }} />
                {isYou && (
                  <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-sans)', fontSize: 9, letterSpacing: '0.14em', color: '#f3ead8', fontWeight: 600, textTransform: 'uppercase' }}>You</div>
                )}
              </div>
              <div style={{ color: isYou ? '#1a1613' : 'rgba(26,22,19,0.5)', fontWeight: isYou ? 600 : 400, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{d.pct}%</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,22,19,0.5)' }}>
        {(() => {
          const row = stats.distribution.find(d => d.moves === userMoves) || stats.distribution[stats.distribution.length - 1];
          const better = stats.distribution.filter(d => d.moves > userMoves).reduce((a, b) => a + b.pct, 0);
          if (userMoves <= par) return `You joined the ${row.pct}% who found the clean line.`;
          if (better > 0) return `You beat ${better}% of today's solvers.`;
          return `Everyone else solved it tighter. Try tomorrow.`;
        })()}
      </div>
    </div>
  );
}
