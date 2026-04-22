import type { Puzzle, ArchivePuzzle } from '~/data/puzzles';
import type { PieceSetKey } from './Pieces';
import type { Snapshot, GameEnd, MoveMeta, SolutionPlayback } from './Board';
import { Board } from './Board';
import { BOARD_THEME } from '~/lib/theme';
import {
  HeaderMark, Rule, ObjectiveBanner, ReplayControls, StatRow,
  SolversStat, YesterdayCard, fmt,
} from './Widgets';
import { ShareCard, ForfeitCard, Scoreboard } from './Cards';

export interface DesktopPuzzleProps {
  puzzle: Puzzle;
  yesterday: ArchivePuzzle;
  pieceSet: PieceSetKey;
  puzzleKey: number;
  history: Snapshot[];
  setHistory: (h: Snapshot[]) => void;
  userMoveCount: number;
  onUserMove: (m: MoveMeta & { ply: number }) => void;
  ended: GameEnd | null;
  onGameEnd: (e: GameEnd) => void;
  timerMs: number;
  hintOpen: boolean;
  usedHint: boolean;
  revealHint: () => void;
  viewIndex: number | null;
  setViewIndex: (i: number | null) => void;
  forfeitConfirm: boolean;
  setForfeitConfirm: (b: boolean) => void;
  forfeit: () => void;
  solutionPlayback: SolutionPlayback | null;
  solutionStep: number;
  onSolutionStep: (i: number, m: MoveMeta) => void;
  replaySolution: () => void;
}

export function DesktopPuzzle(p: DesktopPuzzleProps) {
  const { puzzle, yesterday, pieceSet, puzzleKey } = p;

  const isSolved = p.ended?.result === 'checkmate-user-wins';
  const isForfeit = p.ended?.result === 'forfeit';
  const isGameOver = !!p.ended;

  const maxIdx = Math.max(0, p.history.length - 1);
  const effectiveIdx = p.viewIndex == null ? maxIdx : p.viewIndex;
  const canPrev = effectiveIdx > 0;
  const canNext = p.viewIndex != null && p.viewIndex < maxIdx;
  const onPrev = () => p.setViewIndex(effectiveIdx - 1);
  const onNext = () => { const n = effectiveIdx + 1; p.setViewIndex(n >= maxIdx ? null : n); };
  const onReturnLive = () => p.setViewIndex(null);

  return (
    <div style={{
      width: 1080, minHeight: 820, background: 'var(--paper)',
      fontFamily: 'var(--font-sans)', color: '#1a1613',
      display: 'grid', gridTemplateRows: 'auto 1fr auto', position: 'relative',
    }}>
      <div style={{ padding: '22px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(26,22,19,0.1)' }}>
        <HeaderMark size={22} />
        <nav style={{ display: 'flex', gap: 32, fontSize: 13, fontWeight: 500, letterSpacing: '0.02em' }}>
          {['Today', 'Archive', 'How to play', 'About'].map((x, i) => (
            <a key={x} href="#" style={{
              color: i === 0 ? '#1a1613' : 'rgba(26,22,19,0.55)', textDecoration: 'none',
              borderBottom: i === 0 ? '1.5px solid #1a1613' : '1.5px solid transparent',
              paddingBottom: 2, cursor: 'pointer',
            }}>{x}</a>
          ))}
        </nav>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,22,19,0.55)' }}>{puzzle.date}</div>
      </div>

      <div style={{ padding: '32px 48px 28px', display: 'grid', gridTemplateColumns: '1fr 560px 1fr', gap: 40, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 30 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c24a2f', fontWeight: 600 }}>Daily Puzzle</div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 60, fontWeight: 400, lineHeight: 0.92, letterSpacing: '-0.03em', marginBottom: 10 }}>№ {puzzle.id}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontStyle: 'italic', color: 'rgba(26,22,19,0.62)', letterSpacing: '-0.01em' }}>{puzzle.subtitle}</div>
          </div>
          <Rule />
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.55, color: 'rgba(26,22,19,0.82)', maxWidth: 320 }}>{puzzle.blurb}</div>

          {!p.hintOpen ? (
            <button onClick={p.revealHint} disabled={isGameOver} style={{
              marginTop: 4, alignSelf: 'flex-start',
              background: 'transparent', border: '1px solid rgba(26,22,19,0.3)',
              padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500,
              cursor: isGameOver ? 'not-allowed' : 'pointer', color: '#1a1613',
              opacity: isGameOver ? 0.4 : 1, transition: 'all .15s',
            }}
              onMouseEnter={e => { if (!isGameOver) { e.currentTarget.style.background = '#1a1613'; e.currentTarget.style.color = '#f3ead8'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1a1613'; }}
            >Reveal hint · costs a star</button>
          ) : (
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 14, color: 'rgba(26,22,19,0.72)', borderLeft: '2px solid #c24a2f', paddingLeft: 12, maxWidth: 300, lineHeight: 1.5 }}>{puzzle.hint}</div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 20, maxWidth: 320 }}>
            <YesterdayCard puzzle={yesterday} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {!isGameOver && (
            <div style={{ width: 560, display: 'flex', justifyContent: 'flex-end', marginBottom: -4 }}>
              <SolversStat stats={puzzle.stats} />
            </div>
          )}

          <ObjectiveBanner mateIn={puzzle.mateIn} sideLabel={puzzle.sideLabel}
            status={isSolved ? 'solved' : isForfeit ? 'forfeit' : p.ended ? 'over' : p.history.length > 1 ? 'solving' : 'ready'}
            userMoveCount={p.userMoveCount} par={puzzle.par}
            viewing={p.viewIndex != null} onReturnLive={onReturnLive}
            viewingIdx={effectiveIdx} maxIdx={maxIdx} />

          <Board
            fen={puzzle.fen}
            userColor={puzzle.userColor}
            orientation={puzzle.userColor}
            pieceSet={pieceSet}
            boardSize={560}
            inkTheme={BOARD_THEME}
            puzzleKey={puzzleKey}
            viewIndex={isForfeit ? null : p.viewIndex}
            disabled={!!p.ended}
            solutionPlayback={isForfeit ? p.solutionPlayback : null}
            onUserMove={p.onUserMove}
            onHistoryChange={p.setHistory}
            onGameEnd={p.onGameEnd}
            onSolutionStep={p.onSolutionStep}
          />
          <ReplayControls
            canPrev={canPrev} canNext={canNext}
            onPrev={onPrev} onNext={onNext}
            onReturnLive={onReturnLive}
            viewing={p.viewIndex != null}
            viewingIdx={effectiveIdx} maxIdx={maxIdx} width={560} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 30 }}>
          <StatRow label="Time" value={fmt(p.timerMs)} />
          <Rule />
          <StatRow label="Your moves" value={
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
              <span>{p.userMoveCount}</span>
              <span style={{ fontSize: 13, color: 'rgba(26,22,19,0.4)' }}>/ best {puzzle.par}</span>
              {p.userMoveCount > puzzle.par && !isGameOver && (
                <span style={{ fontSize: 14, color: '#c24a2f' }}>+{p.userMoveCount - puzzle.par}</span>
              )}