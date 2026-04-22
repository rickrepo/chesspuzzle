// Interactive chess board. Free-play: user plays their side, engine replies.
// Maintains a history of snapshots so parent can scrub through positions.
import { useEffect, useRef, useState } from 'react';
import {
  sq, fileOf, rankOf, sqName, nameToSq,
  parseFEN, legalMoves, makeMove, inCheck, isCheckmate, isStalemate,
  pickOpponentMove,
  type Color, type Pieces, type Move,
} from '~/lib/engine';
import { PieceGlyph, type PieceSetKey } from './Pieces';

export interface MoveMeta {
  from: string;
  to: string;
  fromSq: number;
  toSq: number;
  piece: string;
  color: Color;
  capture: boolean;
  check: boolean;
  checkmate: boolean;
  stalemate?: boolean;
  byUser?: boolean;
  scripted?: boolean;
  ply?: number;
}

export interface Snapshot {
  pieces: Pieces;
  turn: Color;
  move: MoveMeta | null;
  check: boolean;
}

export interface BoardTheme {
  light: string;
  dark: string;
  highlight: string;
  lastMove: string;
  legal: string;
  coordDark: string;
  coordLight: string;
  arrowUser: string;
  arrowOpp: string;
  shadow: string;
}

export interface GameEnd {
  result: 'checkmate-user-wins' | 'checkmate-user-loses' | 'stalemate' | 'forfeit' | 'wrong-move';
  ply: number;
}

export interface SolutionPlayback {
  moves: { from: string; to: string }[];
  key: number;
}

// Scripted puzzle mode: user must play each move in `moves` in order.
// Opponent replies come from the same script (interleaved). Any user move
// that doesn't match ends the game with result 'wrong-move'.
export interface PuzzleScript {
  moves: { from: string; to: string }[];
}

export interface BoardProps {
  fen: string;
  userColor: Color;
  orientation?: Color;
  pieceSet: PieceSetKey;
  boardSize: number;
  showCoords?: boolean;
  inkTheme: BoardTheme;
  puzzleKey?: number;
  viewIndex?: number | null;
  disabled?: boolean;
  solutionPlayback?: SolutionPlayback | null;
  puzzleScript?: PuzzleScript | null;
  onUserMove?: (m: MoveMeta & { ply: number }) => void;
  onOpponentMove?: (m: MoveMeta & { ply: number }) => void;
  onGameEnd?: (e: GameEnd) => void;
  onHistoryChange?: (h: Snapshot[]) => void;
  onSolutionStep?: (i: number, m: MoveMeta) => void;
  onReset?: () => void;
}

export function Board({
  fen,
  userColor = 'w',
  orientation,
  pieceSet,
  boardSize,
  showCoords = true,
  inkTheme,
  puzzleKey,
  viewIndex = null,
  disabled = false,
  solutionPlayback = null,
  puzzleScript = null,
  onUserMove,
  onOpponentMove,
  onGameEnd,
  onHistoryChange,
  onSolutionStep,
  onReset,
}: BoardProps) {
  const orient = orientation || userColor;

  const [history, setHistory] = useState<Snapshot[]>(() => {
    const parsed = parseFEN(fen);
    return [{ pieces: parsed.pieces, turn: parsed.turn, move: null, check: inCheck(parsed.pieces, parsed.turn) }];
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [legalHover, setLegalHover] = useState<number[]>([]);
  const [drag, setDrag] = useState<{ from: number; x: number; y: number; pointerId: number } | null>(null);
  const [ended, setEnded] = useState<GameEnd | null>(null);
  const [mateGlow, setMateGlow] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Reset when puzzleKey or fen changes.
  useEffect(() => {
    const parsed = parseFEN(fen);
    const h0: Snapshot[] = [{ pieces: parsed.pieces, turn: parsed.turn, move: null, check: inCheck(parsed.pieces, parsed.turn) }];
    setHistory(h0);
    setSelected(null); setLegalHover([]); setDrag(null);
    setEnded(null); setMateGlow(false);
    onHistoryChange?.(h0);
    onReset?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleKey, fen]);

  // Solution playback — animate a scripted sequence from the starting FEN.
  const playbackRef = useRef<{ cancelled: boolean } | null>(null);
  useEffect(() => {
    if (!solutionPlayback || !solutionPlayback.moves?.length) return;
    const parsed = parseFEN(fen);
    let curPieces = parsed.pieces;
    let h: Snapshot[] = [{ pieces: curPieces, turn: parsed.turn, move: null, check: inCheck(curPieces, parsed.turn) }];
    setHistory(h);
    setSelected(null); setLegalHover([]); setDrag(null);
    setEnded(null); setMateGlow(false);
    onHistoryChange?.(h);

    const timers: ReturnType<typeof setTimeout>[] = [];
    playbackRef.current = { cancelled: false };
    const flag = playbackRef.current;

    solutionPlayback.moves.forEach((m, i) => {
      const delay = 700 + i * 950;
      timers.push(setTimeout(() => {
        if (flag.cancelled) return;
        const fromSq = nameToSq(m.from);
        const toSq = nameToSq(m.to);
        const p = curPieces[fromSq];
        if (!p) return;
        const target = curPieces[toSq];
        const next = makeMove(curPieces, fromSq, toSq);
        const oppColor: Color = p.color === 'w' ? 'b' : 'w';
        const check = inCheck(next, oppColor);
        const mate = isCheckmate(next, oppColor);
        const moveMeta: MoveMeta = {
          from: m.from, to: m.to, fromSq, toSq,
          piece: p.type, color: p.color,
          capture: !!target, check, checkmate: mate,
          byUser: false, scripted: true,
        };
        h = [...h, { pieces: next, turn: oppColor, move: moveMeta, check }];
        curPieces = next;
        setHistory(h);
        onHistoryChange?.(h);
        onSolutionStep?.(i, moveMeta);
        if (mate) {
          setMateGlow(true);
          setTimeout(() => setMateGlow(false), 1800);
        }
      }, delay));
    });
    return () => {
      flag.cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solutionPlayback?.key]);

  const latestIdx = history.length - 1;
  const activeIdx = viewIndex != null ? Math.max(0, Math.min(viewIndex, latestIdx)) : latestIdx;
  const viewing = activeIdx !== latestIdx;
  const snap = history[activeIdx];
  const pieces = snap.pieces;
  const turn = snap.turn;
  const lastMove = snap.move;
  const isInCheck = snap.check;

  const isUserTurn = !ended && !viewing && !disabled && !solutionPlayback && turn === userColor;

  function pushSnap(snapshot: Snapshot): Snapshot[] {
    const next = [...history, snapshot];
    setHistory(next);
    onHistoryChange?.(next);
    return next;
  }

  function applyUserMove(fromSq: number, toSq: number): boolean {
    const p = pieces[fromSq];
    if (!p || p.color !== userColor) return false;
    const legal = legalMoves(pieces, fromSq);
    if (!legal.includes(toSq)) return false;

    // Scripted puzzle mode: the move must match the expected line. A legal
    // move that doesn't match ends the puzzle as a wrong answer (we still
    // apply it visually so the user sees what they played).
    let wrong = false;
    if (puzzleScript) {
      const expected = puzzleScript.moves[history.length - 1];
      if (expected && (expected.from !== sqName(fromSq) || expected.to !== sqName(toSq))) {
        wrong = true;
      }
    }

    const target = pieces[toSq];
    const nextPieces = makeMove(pieces, fromSq, toSq);
    const oppColor: Color = p.color === 'w' ? 'b' : 'w';
    const check = inCheck(nextPieces, oppColor);
    const mate = isCheckmate(nextPieces, oppColor);
    const stale = isStalemate(nextPieces, oppColor);
    const moveMeta: MoveMeta = {
      from: sqName(fromSq), to: sqName(toSq),
      fromSq, toSq, piece: p.type, color: p.color,
      capture: !!target, check, checkmate: mate, stalemate: stale, byUser: true,
    };
    const newHist = pushSnap({ pieces: nextPieces, turn: oppColor, move: moveMeta, check });
    onUserMove?.({ ...moveMeta, ply: newHist.length - 1 });
    if (wrong) {
      setEnded({ result: 'wrong-move', ply: newHist.length - 1 });
      onGameEnd?.({ result: 'wrong-move', ply: newHist.length - 1 });
    } else if (mate || stale) {
      const result: GameEnd['result'] = mate ? 'checkmate-user-wins' : 'stalemate';
      setEnded({ result, ply: newHist.length - 1 });
      onGameEnd?.({ result, ply: newHist.length - 1 });
      if (mate) {
        setMateGlow(true);
        setTimeout(() => setMateGlow(false), 1800);
      }
    }
    return true;
  }

  // Auto-play opponent when live.
  useEffect(() => {
    if (ended) return;
    if (viewing) return;
    if (solutionPlayback) return;
    if (turn === userColor) return;
    const tid = setTimeout(() => {
      let move: Move | null = null;
      if (puzzleScript) {
        const scripted = puzzleScript.moves[history.length - 1];
        if (scripted) {
          const from = nameToSq(scripted.from);
          const to = nameToSq(scripted.to);
          if (pieces[from] && legalMoves(pieces, from).includes(to)) {
            move = { from, to };
          }
        }
      }
      if (!move) move = pickOpponentMove(pieces, turn);
      if (!move) {
        const isMate = inCheck(pieces, turn);
        const result: GameEnd['result'] = isMate ? 'checkmate-user-wins' : 'stalemate';
        setEnded({ result, ply: latestIdx });
        onGameEnd?.({ result, ply: latestIdx });
        return;
      }
      const p = pieces[move.from];
      const target = pieces[move.to];
      const nextPieces = makeMove(pieces, move.from, move.to);
      const oppColor: Color = p.color === 'w' ? 'b' : 'w';
      const check = inCheck(nextPieces, oppColor);
      const mate = isCheckmate(nextPieces, oppColor);
      const stale = isStalemate(nextPieces, oppColor);
      const moveMeta: MoveMeta = {
        from: sqName(move.from), to: sqName(move.to),
        fromSq: move.from, toSq: move.to,
        piece: p.type, color: p.color,
        capture: !!target, check, checkmate: mate, stalemate: stale, byUser: false,
      };
      const newHist = pushSnap({ pieces: nextPieces, turn: oppColor, move: moveMeta, check });
      onOpponentMove?.({ ...moveMeta, ply: newHist.length - 1 });
      if (mate || stale) {
        const result: GameEnd['result'] = mate ? 'checkmate-user-loses' : 'stalemate';
        setEnded({ result, ply: newHist.length - 1 });
        onGameEnd?.({ result, ply: newHist.length - 1 });
        if (mate) {
          setMateGlow(true);
          setTimeout(() => setMateGlow(false), 1800);
        }
      }
    }, 700);
    return () => clearTimeout(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, viewing, ended]);

  function squarePx(s: number) {
    const file = fileOf(s), rank = rankOf(s);
    const col = orient === 'w' ? file : 7 - file;
    const row = orient === 'w' ? 7 - rank : rank;
    return { x: col * (boardSize / 8), y: row * (boardSize / 8) };
  }
  function pxToSquare(x: number, y: number): number | null {
    const size = boardSize / 8;
    const col = Math.floor(x / size);
    const row = Math.floor(y / size);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    const file = orient === 'w' ? col : 7 - col;
    const rank = orient === 'w' ? 7 - row : row;
    return sq(file, rank);
  }

  function onPointerDown(e: React.PointerEvent, fromSq: number) {
    if (!isUserTurn) return;
    const p = pieces[fromSq];
    if (!p || p.color !== userColor) return;
    const rect = boardRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelected(fromSq);
    setLegalHover(legalMoves(pieces, fromSq));
    setDrag({ from: fromSq, x, y, pointerId: e.pointerId });
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const rect = boardRef.current!.getBoundingClientRect();
    setDrag(d => d ? { ...d, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!drag) return;
    const rect = boardRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const target = pxToSquare(x, y);
    const from = drag.from;
    setDrag(null);
    if (target != null && target !== from) {
      const ok = applyUserMove(from, target);
      if (ok) { setSelected(null); setLegalHover([]); }
    }
  }
  function onSquareClick(s: number) {
    if (!isUserTurn) return;
    if (selected != null && legalHover.includes(s)) {
      applyUserMove(selected, s);
      setSelected(null);
      setLegalHover([]);
      return;
    }
    const p = pieces[s];
    if (p && p.color === userColor) {
      setSelected(s);
      setLegalHover(legalMoves(pieces, s));
    } else {
      setSelected(null);
      setLegalHover([]);
    }
  }

  const sqSize = boardSize / 8;

  const squares: React.ReactNode[] = [];
  for (let s = 0; s < 64; s++) {
    const { x, y } = squarePx(s);
    const isLight = (fileOf(s) + rankOf(s)) % 2 === 1;
    const isSelected = selected === s;
    const isLegal = legalHover.includes(s);
    const isLastFrom = lastMove && lastMove.fromSq === s;
    const isLastTo = lastMove && lastMove.toSq === s;

    let overlay: string | null = null;
    if (isSelected) overlay = inkTheme.highlight;
    else if (isLastFrom || isLastTo) overlay = inkTheme.lastMove;

    squares.push(
      <div key={`sq-${s}`} onClick={() => onSquareClick(s)}
        style={{
          position: 'absolute', left: x, top: y, width: sqSize, height: sqSize,
          background: isLight ? inkTheme.light : inkTheme.dark,
          cursor: isUserTurn ? 'pointer' : 'default',
          transition: 'background .25s',
        }}>
        {overlay && <div style={{ position: 'absolute', inset: 0, background: overlay, pointerEvents: 'none' }} />}
        {isLegal && !pieces[s] && (
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            width: sqSize * 0.28, height: sqSize * 0.28,
            borderRadius: '50%', background: inkTheme.legal,
            transform: 'translate(-50%,-50%)', pointerEvents: 'none',
          }} />
        )}
        {isLegal && pieces[s] && (
          <div style={{ position: 'absolute', inset: 2, borderRadius: '50%', border: `3px solid ${inkTheme.legal}`, pointerEvents: 'none' }} />
        )}
        {showCoords && fileOf(s) === (orient === 'w' ? 0 : 7) && (
          <div style={{
            position: 'absolute', left: 4, top: 2,
            fontFamily: 'var(--font-mono)', fontSize: Math.max(9, sqSize * 0.14),
            color: isLight ? inkTheme.coordDark : inkTheme.coordLight,
            pointerEvents: 'none', fontWeight: 500,
          }}>{rankOf(s) + 1}</div>
        )}
        {showCoords && rankOf(s) === (orient === 'w' ? 0 : 7) && (
          <div style={{
            position: 'absolute', right: 4, bottom: 1,
            fontFamily: 'var(--font-mono)', fontSize: Math.max(9, sqSize * 0.14),
            color: isLight ? inkTheme.coordDark : inkTheme.coordLight,
            pointerEvents: 'none', fontWeight: 500,
          }}>{'abcdefgh'[fileOf(s)]}</div>
        )}
      </div>
    );
  }

  const checkSq = (() => {
    if (!isInCheck) return -1;
    for (const [sStr, p] of Object.entries(pieces)) {
      if (p.type === 'k' && p.color === turn) return +sStr;
    }
    return -1;
  })();

  const pieceNodes: React.ReactNode[] = [];
  for (const [sStr, p] of Object.entries(pieces)) {
    const s = +sStr;
    const isDragging = drag && drag.from === s;
    let { x, y } = squarePx(s);
    if (isDragging) {
      x = drag!.x - sqSize / 2;
      y = drag!.y - sqSize / 2;
    }
    const isCheckKing = s === checkSq;
    pieceNodes.push(
      <div key={`p-${s}`}
        onPointerDown={(e) => onPointerDown(e, s)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'absolute', left: x, top: y, width: sqSize, height: sqSize,
          transition: isDragging ? 'none' : 'left .18s ease-out, top .18s ease-out',
          zIndex: isDragging ? 30 : (isCheckKing ? 6 : 2),
          cursor: p.color === userColor && isUserTurn ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
        }}>
        {isCheckKing && (
          <div style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(194,74,47,0.55) 0%, rgba(194,74,47,0) 65%)',
            animation: 'tempo-check-pulse 1.2s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}
        <PieceGlyph type={p.type} color={p.color} setKey={pieceSet} size={sqSize} />
      </div>
    );
  }

  return (
    <div ref={boardRef} style={{
      position: 'relative', width: boardSize, height: boardSize,
      background: inkTheme.light, boxShadow: inkTheme.shadow,
      borderRadius: 2, overflow: 'hidden', userSelect: 'none',
    }}>
      {squares}
      {pieceNodes}

      {mateGlow && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12,
          background: 'linear-gradient(115deg, transparent 35%, rgba(243,234,216,0.35) 50%, transparent 65%)',
          backgroundSize: '250% 100%',
          animation: 'tempo-mate-sweep 1.4s cubic-bezier(.25,.8,.3,1) both',
        }} />
      )}

      {viewing && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15,
          background: 'rgba(26,22,19,0.06)',
          boxShadow: 'inset 0 0 0 2px rgba(26,22,19,0.35)',
          transition: 'all .2s',
        }} />
      )}
    </div>
  );
}
