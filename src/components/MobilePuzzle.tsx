import { useEffect, useState } from 'react';
import type { Puzzle, ArchivePuzzle } from '~/data/puzzles';
import type { PieceSetKey } from './Pieces';
import type { Snapshot, GameEnd, MoveMeta, SolutionPlayback } from './Board';
import { Board } from './Board';
import { BOARD_THEME } from '~/lib/theme';
import { HeaderMark, SolversStat, YesterdayCard, fmt } from './Widgets';
import { ShareCard, ForfeitCard, Scoreboard } from './Cards';

export interface MobilePuzzleProps {
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

export function MobilePuzzle(p: MobilePuzzleProps) {
  const { puzzle, yesterday, pieceSet, puzzleKey } = p;

  const isSolved = p.ended?.result === 'checkmate-user-wins';
  const isForfeit = p.ended?.result === 'forfeit';
  const isGameOver = !!p.ended;

  const [winW, setWinW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 390);
  useEffect(() => {
    const onR = () => setWinW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const W = Math.min(winW, 480);
  const boardSize = W - 28;

  const maxIdx = Math.max(0, p.history.length - 1);
  const effectiveIdx = p.viewIndex == null ? maxIdx : p.viewIndex;
  const canPrev = effectiveIdx > 0;
  const canNext = p.viewIndex != null && p.viewIndex < maxIdx;
  const onPrev = () => p.setViewIndex(effectiveIdx - 1);
  const onNext = () => { const n = effectiveIdx + 1; p.setViewIndex(n >= maxIdx ? null : n); };
  const onReturnLive = () => p.setViewIndex(null);

  return (
    <div style={{
      width: W, minHeight: '100vh', margin: '0 auto', background: 'var(--paper)',
      fontFamily: 'var(--font-sans)', color: '#1a1613',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      <div style={{ padding: '14px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <HeaderMark size={20} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1613" strokeWidth="1.5"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </div>
      </div>

      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c24a2f', fontWeight: 600, marginBottom: 8 }}>{puzzle.date}</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 44, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 0.95, marginBottom: 4 }}>№ {puzzle.id}</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontStyle: 'italic', color: 'rgba(26,22,19,0.6)', marginBottom: 10 }}>{puzzle.subtitle}</div>
        {!isGameOver && <SolversStat stats={puzzle.stats} />}
      </div>

      <div style={{
        margin: '0 20px 14px', padding: '14px 16px',
        background: isSolved ? '#1a7a3a' : isForfeit ? 'rgba(26,22,19,0.85)' : '#1a1613',
        color: '#f3ead8', transition: 'background .3s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', color: isSolved ? 'rgba(243,234,216,0.85)' : '#d16a4a', fontWeight: 600, marginBottom: 4 }}>
              {p.viewIndex != null ? 'REPLAYING' : isSolved ? 'SOLVED' : isForfeit ? 'FORFEITED' : 'OBJECTIVE'}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, lineHeight: 1, letterSpacing: '-0.01em' }}>
              {p.viewIndex != null
                ? <>Move <span style={{ fontStyle: 'italic' }}>{effectiveIdx}</span> of {maxIdx}</>
                : isSolved
                  ? <>Mate in <span style={{ fontStyle: 'italic' }}>{p.userMoveCount}</span></>
                  : <>Mate in <span style={{ fontStyle: 'italic' }}>{puzzle.mateIn}</span></>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', color: 'rgba(243,234,216,0.55)' }}>{isSolved ? 'MOVES' : 'BEST'}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500 }}>{isSolved ? `${p.userMoveCount}/${puzzle.par}` : puzzle.par}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', justifyContent: 'center' }}>
        <Board
          fen={puzzle.fen}
          userColor={puzzle.userColor}
          orientation={puzzle.userColor}
          pieceSet={pieceSet}
          boardSize={boardSize}
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
      </div>

      <div style={{ margin: '10px 20px 0', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onPrev} disabled={!canPrev} style={{
            width: 40, height: 34, background: 'transparent', border: '1px solid rgba(26,22,19,0.22)',
            color: canPrev ? '#1a1613' : 'rgba(26,22,19,0.25)', cursor: canPrev ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} aria-label="Previous move">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M 7 1 L 3 5 L 7 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" /></svg>
          </button>
          <button onClick={onNext} disabled={!canNext} style={{
            width: 40, height: 34, background: 'transparent', border: '1px solid rgba(26,22,19,0.22)',
            color: canNext ? '#1a1613' : 'rgba(26,22,19,0.25)', cursor: canNext ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} aria-label="Next move">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M 3 1 L 7 5 L 3 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" /></svg>
          </button>
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,22,19,0.7)', flex: 1, textAlign: 'center' }}>
          {isGameOver
            ? (isSolved ? 'Checkmate — cleanly done.' : isForfeit ? 'Set aside for today.' : 'Game over.')
            : p.history.length === 0 || p.history.length % 2 === 1 ? 'Your move, white.' : 'Black is thinking…'}
        </div>
        {p.viewIndex != null ? (
          <button onClick={onReturnLive} style={{ height: 34, background: '#1a1613', color: '#f3ead8', border: 'none', padding: '0 10px', fontFamily: 'var(--font-sans)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer' }}>Live</button>
        ) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'rgba(26,22,19,0.5)', minWidth: 86, textAlign: 'right' }}>
            {p.userMoveCount}/{puzzle.par}