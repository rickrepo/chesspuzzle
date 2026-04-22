// Interactive chess board. Free-play: user plays their side, engine replies.
// Maintains a history of snapshots so parent can scrub through positions.
import { useEffect, useRef, useState } from 'react';
import {
  sq, fileOf, rankOf, sqName, nameToSq,
  parseFEN, legalMoves, makeMove, inCheck, isCheckmate, isStalemate,
  pickOpponentMove,
  type Color, type Pieces,
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
  result: 'checkmate-user-wins' | 'checkmate-user-loses' | 'stalemate' | 'forfeit';
  ply: number;
}

export interface SolutionPlayback {
  moves: { from: string; to: string }[];
  key: number;
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