import type { Color } from '~/lib/engine';

export interface PuzzleStats {
  solvers: number;
  medianMoves: number;
  percentSolved: number;
  distribution: { moves: number; pct: number; label: string }[];
}

export interface Puzzle {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  mateIn: number;
  par: number;
  fen: string;
  userColor: Color;
  sideLabel: string;
  blurb: string;
  hint: string;
  solution: string[];
  solutionMoves: { from: string; to: string }[];
  stats: PuzzleStats;
}

export interface ArchivePuzzle {
  id: string;
  date: string;
  subtitle: string;
  mateIn: number;
  solvedCount: number;
  medianMoves: number;
}

// Today's puzzle — verified mate-in-2 (H-file attack).
// 1. Qf6 — threatens both Qg7# and Qxh8# simultaneously.
// Black cannot defend both; mate follows on move 2.
export const PUZZLE: Puzzle = {
  id: '0421',
  date: 'Tuesday · April 21',
  title: 'No. 0421',
  subtitle: 'The H-file Whisper',
  mateIn: 2,
  par: 2,
  fen: '6k1/5ppp/7P/8/8/6R1/5QPK/8 w - - 0 1',
  userColor: 'w',
  sideLabel: 'White to play',
  blurb: 'A quiet endgame — rook and queen, a lone pawn on h6. White has a single quiet move that opens two doors at once. Black cannot close both.',
  hint: 'The queen wants a dark square where she sees both g7 and h8.',
  solution: ['Qf6', 'Kh8', 'Qxg7#'],
  solutionMoves: [
    { from: 'f2', to: 'f6' },
    { from: 'g8', to: 'h8' },
    { from: 'f6', to: 'g7' },
  ],
  stats: {
    solvers: 8421,
    medianMoves: 3,
    percentSolved: 71,
    distribution: [
      { moves: 2, pct: 38, label: 'Clean' },
      { moves: 3, pct: 31, label: '+1' },
      { moves: 4, pct: 18, label: '+2' },
      { moves: 5, pct: 8,  label: '+3' },
      { moves: 6, pct: 5,  label: '+4 or more' },
    ],
  },
};

export const YESTERDAY: ArchivePuzzle = {
  id: '0420',
  date: 'Monday · April 20',
  subtitle: 'A Bishop Remembers',
  mateIn: 3,
  solvedCount: 12804,
  medianMoves: 4,
};