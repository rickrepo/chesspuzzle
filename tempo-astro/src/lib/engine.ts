// Minimal chess move generator for puzzle playback.
// Not a full engine — no castling / en-passant / promotion, since the
// puzzles don't require them.

export const FILES = ['a','b','c','d','e','f','g','h'] as const;
export const RANKS = ['1','2','3','4','5','6','7','8'] as const;

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export interface Piece { type: PieceType; color: Color; }
export type Pieces = Record<number, Piece>;

export const sq = (f: number, r: number) => r * 8 + f;
export const fileOf = (s: number) => s % 8;
export const rankOf = (s: number) => Math.floor(s / 8);
export const sqName = (s: number) => FILES[fileOf(s)] + RANKS[rankOf(s)];
export const nameToSq = (n: string) =>
  sq(FILES.indexOf(n[0] as typeof FILES[number]), RANKS.indexOf(n[1] as typeof RANKS[number]));

export interface ParsedFEN { pieces: Pieces; turn: Color; }

export function parseFEN(fen: string): ParsedFEN {
  const [board, turn] = fen.split(' ');
  const pieces: Pieces = {};
  const rows = board.split('/');
  for (let r = 0; r < 8; r++) {
    const row = rows[7 - r];
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { f += parseInt(ch, 10); continue; }
      const color: Color = ch === ch.toUpperCase() ? 'w' : 'b';
      const type = ch.toLowerCase() as PieceType;
      pieces[sq(f, r)] = { type, color };
      f++;
    }
  }
  return { pieces, turn: (turn as Color) || 'w' };
}

const DIRS = {
  N: [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]],
  B: [[1,1],[1,-1],[-1,1],[-1,-1]],
  R: [[1,0],[-1,0],[0,1],[0,-1]],
  K: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
};

export function pseudoMoves(pieces: Pieces, from: number): number[] {
  const p = pieces[from]; if (!p) return [];
  const f = fileOf(from), r = rankOf(from);
  const out: number[] = [];
  const push = (nf: number, nr: number) => {
    if (nf < 0 || nf > 7 || nr < 0 || nr > 7) return false;
    const to = sq(nf, nr);
    const t = pieces[to];
    if (!t) { out.push(to); return true; }
    if (t.color !== p.color) out.push(to);
    return false;
  };
  if (p.type === 'p') {
    const dir = p.color === 'w' ? 1 : -1;
    const startRank = p.color === 'w' ? 1 : 6;
    const one = sq(f, r + dir);
    if (r + dir >= 0 && r + dir <= 7 && !pieces[one]) {
      out.push(one);
      const two = sq(f, r + 2 * dir);
      if (r === startRank && !pieces[two]) out.push(two);
    }
    for (const df of [-1, 1]) {
      const nf = f + df, nr = r + dir;
      if (nf < 0 || nf > 7 || nr < 0 || nr > 7) continue;
      const cap = sq(nf, nr);
      if (pieces[cap] && pieces[cap].color !== p.color) out.push(cap);
    }
  } else if (p.type === 'n') {
    for (const [df, dr] of DIRS.N) {
      const nf = f + df, nr = r + dr;
      if (nf < 0 || nf > 7 || nr < 0 || nr > 7) continue;
      const to = sq(nf, nr);
      const t = pieces[to];
      if (!t || t.color !== p.color) out.push(to);
    }
  } else if (p.type === 'k') {
    for (const [df, dr] of DIRS.K) {
      const nf = f + df, nr = r + dr;
      if (nf < 0 || nf > 7 || nr < 0 || nr > 7) continue;
      const to = sq(nf, nr);
      const t = pieces[to];
      if (!t || t.color !== p.color) out.push(to);
    }
  } else {
    const dirs = p.type === 'b' ? DIRS.B : p.type === 'r' ? DIRS.R : [...DIRS.B, ...DIRS.R];
    for (const [df, dr] of dirs) {
      let nf = f + df, nr = r + dr;
      while (push(nf, nr)) { nf += df; nr += dr; }
    }
  }
  return out;
}

export function kingSq(pieces: Pieces, color: Color): number {
  for (const [s, p] of Object.entries(pieces)) {
    if (p.type === 'k' && p.color === color) return +s;
  }
  return -1;
}

export function isAttacked(pieces: Pieces, target: number, byColor: Color): boolean {
  for (const [s, p] of Object.entries(pieces)) {
    if (p.color !== byColor) continue;
    if (pseudoMoves(pieces, +s).includes(target)) return true;
  }
  return false;
}

export function inCheck(pieces: Pieces, color: Color): boolean {
  const ks = kingSq(pieces, color);
  return ks >= 0 && isAttacked(pieces, ks, color === 'w' ? 'b' : 'w');
}

export function legalMoves(pieces: Pieces, from: number): number[] {
  const p = pieces[from]; if (!p) return [];
  return pseudoMoves(pieces, from).filter(to => {
    const next = { ...pieces };
    next[to] = next[from];
    delete next[from];
    return !inCheck(next, p.color);
  });
}

export function makeMove(pieces: Pieces, from: number, to: number): Pieces {
  const next = { ...pieces };
  next[to] = next[from];
  delete next[from];
  return next;
}

export interface Move { from: number; to: number; }

export function allLegalMoves(pieces: Pieces, color: Color): Move[] {
  const out: Move[] = [];
  for (const [s, p] of Object.entries(pieces)) {
    if (p.color !== color) continue;
    for (const to of legalMoves(pieces, +s)) out.push({ from: +s, to });
  }
  return out;
}

export function isCheckmate(pieces: Pieces, color: Color): boolean {
  return inCheck(pieces, color) && allLegalMoves(pieces, color).length === 0;
}
export function isStalemate(pieces: Pieces, color: Color): boolean {
  return !inCheck(pieces, color) && allLegalMoves(pieces, color).length === 0;
}

const PVAL: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function scoreMove(pieces: Pieces, move: Move, color: Color): number {
  let s = 0;
  const target = pieces[move.to];
  if (target) s += PVAL[target.type] * 10;
  const next = makeMove(pieces, move.from, move.to);
  const opp: Color = color === 'w' ? 'b' : 'w';
  if (inCheck(next, opp)) s += 2;
  if (isCheckmate(next, opp)) s += 1000;
  s += Math.random() * 0.1;
  return s;
}

export function pickOpponentMove(pieces: Pieces, color: Color): Move | null {
  const moves = allLegalMoves(pieces, color);
  if (moves.length === 0) return null;
  let best = moves[0], bestS = -Infinity;
  for (const m of moves) {
    const s = scoreMove(pieces, m, color);
    if (s > bestS) { bestS = s; best = m; }
  }
  return best;
}