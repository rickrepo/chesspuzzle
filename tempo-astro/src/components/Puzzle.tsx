// Top-level interactive island. Owns all shared puzzle state.
// Picks Desktop or Mobile layout based on viewport width.
import { useEffect, useState } from 'react';
import type { Puzzle as PuzzleData, ArchivePuzzle } from '~/data/puzzles';
import type { PieceSetKey } from './Pieces';
import type { Snapshot, GameEnd, MoveMeta, SolutionPlayback } from './Board';
import { useTimer } from './Widgets';
import { useIsDesktop } from '~/lib/useIsDesktop';
import { DesktopPuzzle } from './DesktopPuzzle';
import { MobilePuzzle } from './MobilePuzzle';

export interface PuzzleProps {
  puzzle: PuzzleData;
  yesterday: ArchivePuzzle;
}

export default function Puzzle({ puzzle, yesterday }: PuzzleProps) {
  const isDesktop = useIsDesktop(900);
  const [pieceSet, setPieceSet] = useState<PieceSetKey>('classic');
  const [puzzleKey, setPuzzleKey] = useState(0);

  const [history, setHistory] = useState<Snapshot[]>([]);
  const [userMoveCount, setUserMoveCount] = useState(0);
  const [ended, setEnded] = useState<GameEnd | null>(null);
  const [usedHint, setUsedHint] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [forfeitConfirm, setForfeitConfirm] = useState(false);
  const [solutionPlayback, setSolutionPlayback] = useState<SolutionPlayback | null>(null);
  const [solutionStep, setSolutionStep] = useState(-1);

  const started = userMoveCount > 0;
  const [timerMs, setTimerMs] = useTimer(started && !ended);

  useEffect(() => {
    setHistory([]); setUserMoveCount(0);
    setEnded(null); setTimerMs(0); setUsedHint(false); setHintOpen(false);
    setViewIndex(null); setForfeitConfirm(false);
    setSolutionPlayback(null); setSolutionStep(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleKey]);

  const onUserMove = (_m: MoveMeta & { ply: number }) => setUserMoveCount(n => n + 1);
  const onGameEnd = (e: GameEnd) => setEnded(e);
  const revealHint = () => { setHintOpen(true); setUsedHint(true); };
  const forfeit = () => {
    setForfeitConfirm(false);
    setEnded({ result: 'forfeit', ply: history.length - 1 });
    setUsedHint(true);
    setSolutionStep(-1);
    setSolutionPlayback({ moves: puzzle.solutionMoves, key: Date.now() });
  };
  const replaySolution = () => {
    setSolutionStep(-1);
    setSolutionPlayback({ moves: puzzle.solutionMoves, key: Date.now() });
  };
  const onReset = () => setPuzzleKey(k => k + 1);

  const sharedProps = {
    puzzle, yesterday, pieceSet, puzzleKey,
    history, setHistory,
    userMoveCount, onUserMove,
    ended, onGameEnd,
    timerMs,
    hintOpen, usedHint, revealHint,
    viewIndex, setViewIndex,
    forfeitConfirm, setForfeitConfirm, forfeit,
    solutionPlayback, solutionStep,
    onSolutionStep: (i: number, _m: MoveMeta) => setSolutionStep(i),
    replaySolution,
  };

  return (
    <>
      {isDesktop
        ? <DesktopPuzzle {...sharedProps} />
        : <MobilePuzzle {...sharedProps} />}
      <SettingsButton pieceSet={pieceSet} setPieceSet={setPieceSet} onReset={onReset} />
    </>
  );
}

function SettingsButton({ pieceSet, setPieceSet, onReset }: {
  pieceSet: PieceSetKey;
  setPieceSet: (k: PieceSetKey) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && !t.closest('[data-tempo-settings]')) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const sets: { key: PieceSetKey; label: string }[] = [
    { key: 'classic', label: 'Classic' },
    { key: 'editorial', label: 'Editorial' },
    { key: 'outline', label: 'Outline' },
  ];

  return (
    <div data-tempo-settings style={{ position: 'fixed', top: 16, right: 16, zIndex: 200 }}>
      <button className="tempo-settings-btn" onClick={() => setOpen(o => !o)} aria-label="Settings">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)',
          background: '#1a1613', color: '#f3ead8', padding: '14px 16px', minWidth: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)', animation: 'tempo-fade-up .18s ease both',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(243,234,216,0.55)', fontWeight: 600, marginBottom: 8 }}>Piece set</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
            {sets.map(s => (
              <button key={s.key} onClick={() => setPieceSet(s.key)} style={{
                display: 'block', width: '100%', textAlign: 'left', border: 'none',
                background: pieceSet === s.key ? 'rgba(243,234,216,0.14)' : 'transparent',
                color: pieceSet === s.key ? '#f3ead8' : 'rgba(243,234,216,0.65)',
                padding: '7px 10px', fontFamily: 'var(--font-sans)', fontSize: 12,
                letterSpacing: '0.02em', cursor: 'pointer', fontWeight: pieceSet === s.key ? 500 : 400,
              }}>{s.label}</button>
            ))}
          </div>
          <button onClick={() => { onReset(); setOpen(false); }} style={{
            width: '100%', background: 'transparent', color: 'rgba(243,234,216,0.75)',
            border: '1px solid rgba(243,234,216,0.25)',
            padding: '8px 10px', fontFamily: 'var(--font-sans)', fontSize: 10,
            letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
          }}>Reset puzzle</button>
        </div>
      )}
    </div>
  );
}