import type { Color } from '~/lib/engine';

// ──────────────── types used by the UI ────────────────

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

// ──────────────── curated pool shape (JSON on disk) ────────────────

export interface CuratedPuzzle {
  id: string;
  fen: string;
  userColor: Color;
  mateIn: number;
  solution: string[];
  solutionMoves: { from: string; to: string }[];
  themes: string[];
  rating: number;
}

interface Pool {
  version: number;
  generatedAt: string;
  puzzles: CuratedPuzzle[];
}

let poolPromise: Promise<Pool> | null = null;

export function loadPool(): Promise<Pool> {
  if (!poolPromise) {
    // base path for GitHub Pages subpath deploys — derived at build time.
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    poolPromise = fetch(`${base}/puzzles.json`).then(r => {
      if (!r.ok) throw new Error(`puzzles.json: ${r.status}`);
      return r.json() as Promise<Pool>;
    });
  }
  return poolPromise;
}

// ──────────────── date-indexed selection ────────────────

// Day 0 = 2026-01-01 UTC. Every subsequent UTC day picks the next puzzle.
const EPOCH_UTC = Date.UTC(2026, 0, 1);
const MS_PER_DAY = 86_400_000;

export function dayIndex(date: Date): number {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.max(0, Math.floor((utcMidnight - EPOCH_UTC) / MS_PER_DAY));
}

export function puzzleForDate(pool: Pool, date: Date): Puzzle {
  const c = pool.puzzles[dayIndex(date) % pool.puzzles.length];
  return hydrate(c, date);
}

export function yesterdayForDate(pool: Pool, date: Date): ArchivePuzzle {
  const y = new Date(date);
  y.setUTCDate(y.getUTCDate() - 1);
  const c = pool.puzzles[dayIndex(y) % pool.puzzles.length];
  return {
    id: c.id,
    date: formatDate(y),
    subtitle: subtitleFor(c),
    mateIn: c.mateIn,
    solvedCount: fakeStats(c).solvers,
    medianMoves: c.mateIn + 1,
  };
}

// ──────────────── hydration: curated → UI Puzzle ────────────────

function hydrate(c: CuratedPuzzle, date: Date): Puzzle {
  return {
    id: c.id,
    date: formatDate(date),
    title: `No. ${c.id}`,
    subtitle: subtitleFor(c),
    mateIn: c.mateIn,
    par: c.mateIn,
    fen: c.fen,
    userColor: c.userColor,
    sideLabel: c.userColor === 'w' ? 'White to play' : 'Black to play',
    blurb: blurbFor(c),
    hint: hintFor(c),
    solution: c.solution,
    solutionMoves: c.solutionMoves,
    stats: fakeStats(c),
  };
}

function formatDate(d: Date): string {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${weekdays[d.getUTCDay()]} · ${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

const THEME_SUBTITLE: Record<string, string> = {
  backRankMate: 'Back-rank Collapse',
  smotheredMate: 'The Smothered King',
  hookMate: 'Hook Mate',
  arabianMate: 'Arabian Mate',
  bodenMate: "Boden's Cross",
  anastasiaMate: "Anastasia's Edge",
  doubleCheck: 'Double Check',
  discoveredAttack: 'The Discovery',
  sacrifice: 'A Quiet Sacrifice',
  pin: 'Pinned and Lost',
  fork: 'The Fork',
  skewer: 'Skewered',
  queensideAttack: 'A Queenside Crush',
  kingsideAttack: 'Kingside Hunt',
  attackingF2F7: 'The f-pawn Door',
  endgame: 'An Endgame Whisper',
  middlegame: 'Midgame Mate',
  opening: 'An Early Finish',
};

function subtitleFor(c: CuratedPuzzle): string {
  for (const t of c.themes) if (THEME_SUBTITLE[t]) return THEME_SUBTITLE[t];
  return `Mate in ${c.mateIn}`;
}

function blurbFor(c: CuratedPuzzle): string {
  const noun = c.mateIn === 1 ? 'single move' : `${spell(c.mateIn)}-move sequence`;
  const from = c.themes.includes('endgame') ? 'A quiet endgame position'
    : c.themes.includes('opening') ? 'An early tactical break'
      : 'A real game position';
  return `${from}. Find the ${noun} that ends it.`;
}

function hintFor(c: CuratedPuzzle): string {
  if (c.themes.includes('sacrifice')) return 'The cleanest move is not the safest one.';
  if (c.themes.includes('pin')) return 'One piece is already frozen — lean on it.';
  if (c.themes.includes('fork')) return 'Two targets, one move.';
  if (c.themes.includes('backRankMate')) return 'The back rank is thinner than it looks.';
  if (c.themes.includes('discoveredAttack')) return 'Move one piece to unleash another.';
  if (c.themes.includes('doubleCheck')) return 'Two attackers at once — the king must run.';
  return 'Look for forcing moves first: checks, captures, threats.';
}

function spell(n: number): string {
  return n === 1 ? 'one' : n === 2 ? 'two' : n === 3 ? 'three' : String(n);
}

// ──────────────── deterministic fake stats ────────────────
// Real stats need a backend; these are plausible per-puzzle numbers so the UI
// has something to render. Same puzzle → same numbers on every visit.

function fakeStats(c: CuratedPuzzle): PuzzleStats {
  const seed = hash(c.id);
  const rnd = mulberry32(seed);
  const solvers = 2500 + Math.floor(rnd() * 14000);
  const percentSolved = Math.min(95, Math.max(35, Math.round(90 - (c.rating - 1200) / 14)));
  const par = c.mateIn;
  const distribution = [par, par + 1, par + 2, par + 3, par + 4].map((m, i) => {
    const basePct = [40, 30, 16, 9, 5][i];
    const jitter = Math.round((rnd() - 0.5) * 8);
    return { moves: m, pct: Math.max(2, basePct + jitter), label: i === 0 ? 'Clean' : `+${i}` };
  });
  const sum = distribution.reduce((a, b) => a + b.pct, 0);
  distribution.forEach(d => { d.pct = Math.round((d.pct / sum) * 100); });
  return { solvers, medianMoves: par + 1, percentSolved, distribution };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
