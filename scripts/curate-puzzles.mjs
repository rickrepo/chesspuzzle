#!/usr/bin/env node
// Curate a subset of the Lichess puzzle dump into public/puzzles.json.
//
// Usage:
//   1. Download the dump:
//        curl -L https://database.lichess.org/lichess_db_puzzle.csv.zst \
//          -o lichess_db_puzzle.csv.zst
//      and decompress:
//        zstd -d lichess_db_puzzle.csv.zst
//   2. Run:
//        node scripts/curate-puzzles.mjs --input lichess_db_puzzle.csv
//      Optional flags: --count 10000 --out public/puzzles.json
//
// Filters: mate-in-1/2/3 only; rating 1200-2000; popularity >= 80;
// nbPlays >= 500; no castling / en-passant / promotion (engine limits).
// Output is a compact JSON array — about ~1.5 MB at 10k puzzles.

import { createReadStream, writeFileSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { Chess } from 'chess.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const INPUT = args.input || 'lichess_db_puzzle.csv';
const OUT = args.out || 'public/puzzles.json';
const TARGET = parseInt(args.count || '10000', 10);
const MIN_RATING = parseInt(args['min-rating'] || '1200', 10);
const MAX_RATING = parseInt(args['max-rating'] || '2000', 10);
const MIN_POPULARITY = parseInt(args['min-popularity'] || '80', 10);
const MIN_PLAYS = parseInt(args['min-plays'] || '500', 10);

try { statSync(INPUT); } catch {
  console.error(`Input not found: ${INPUT}`);
  console.error('Download from https://database.lichess.org/#puzzles first.');
  process.exit(1);
}

console.log(`Reading ${INPUT}...`);
const rl = createInterface({ input: createReadStream(INPUT), crlfDelay: Infinity });

const MATE_THEMES = new Set(['mateIn1', 'mateIn2', 'mateIn3']);
const BAD_FLAGS = /[ekpq]/; // en-passant, kingside/queenside castle, promotion

const buckets = { 1: [], 2: [], 3: [] };
let total = 0, kept = 0, lineNo = 0;

for await (const line of rl) {
  lineNo++;
  if (lineNo === 1 && line.startsWith('PuzzleId')) continue; // header
  total++;

  // CSV columns (no quoted fields in Lichess dump):
  // PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
  const parts = line.split(',');
  if (parts.length < 8) continue;

  const [id, fen, moves, ratingStr, , popStr, playsStr, themesStr] = parts;
  const rating = +ratingStr, pop = +popStr, plays = +playsStr;
  if (rating < MIN_RATING || rating > MAX_RATING) continue;
  if (pop < MIN_POPULARITY || plays < MIN_PLAYS) continue;

  const themes = themesStr.split(' ');
  const mateTheme = themes.find(t => MATE_THEMES.has(t));
  if (!mateTheme) continue;
  const mateIn = +mateTheme.slice(-1);

  const uciMoves = moves.split(' ');
  // For mate-in-N: 1 setup move by opponent + (2N - 1) remaining moves.
  if (uciMoves.length !== 2 * mateIn) continue;

  const chess = new Chess(fen);

  // Apply setup move; skip puzzle if it ever involves forbidden move types.
  const setup = parseUci(uciMoves[0]);
  const setupRes = safeMove(chess, setup);
  if (!setupRes || BAD_FLAGS.test(setupRes.flags)) continue;

  // Walk remaining moves, collect SAN + UCI coords.
  const solution = [];
  const solutionMoves = [];
  let bad = false;
  for (let i = 1; i < uciMoves.length; i++) {
    const parsed = parseUci(uciMoves[i]);
    const res = safeMove(chess, parsed);
    if (!res || BAD_FLAGS.test(res.flags)) { bad = true; break; }
    solution.push(res.san);
    solutionMoves.push({ from: parsed.from, to: parsed.to });
  }
  if (bad) continue;

  const startFen = chessAfterSetup(fen, setup);
  if (!startFen) continue;
  const userColor = startFen.split(' ')[1];

  buckets[mateIn].push({
    id, fen: startFen, userColor, mateIn,
    solution, solutionMoves, themes, rating,
  });
  kept++;

  if (kept % 5000 === 0) console.log(`  scanned ${total.toLocaleString()}, kept ${kept.toLocaleString()}`);
}

console.log(`Done scanning. Total: ${total.toLocaleString()}, eligible: ${kept.toLocaleString()}`);
console.log(`  mate-in-1: ${buckets[1].length}, mate-in-2: ${buckets[2].length}, mate-in-3: ${buckets[3].length}`);

// Interleave buckets for a mix of difficulties by date. Shuffle each deterministically
// by popularity (highest first), then stride-round-robin so adjacent days vary.
for (const k of [1, 2, 3]) buckets[k].sort((a, b) => b.rating - a.rating);

const pool = [];
const quota = { 1: 0.2, 2: 0.45, 3: 0.35 };
const perBucket = {
  1: Math.floor(TARGET * quota[1]),
  2: Math.floor(TARGET * quota[2]),
  3: Math.floor(TARGET * quota[3]),
};
for (const k of [1, 2, 3]) {
  const slice = buckets[k].slice(0, Math.min(perBucket[k], buckets[k].length));
  pool.push(...slice);
}
// Stable-ish shuffle: Fisher-Yates with a fixed seed for reproducibility.
let seed = 0x5eed;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
for (let i = pool.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  [pool[i], pool[j]] = [pool[j], pool[i]];
}

const output = { version: 1, generatedAt: new Date().toISOString(), puzzles: pool };
writeFileSync(OUT, JSON.stringify(output));
const sizeKb = Math.round(statSync(OUT).size / 1024);
console.log(`Wrote ${pool.length.toLocaleString()} puzzles to ${OUT} (${sizeKb.toLocaleString()} KB)`);

function parseUci(uci) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}

function safeMove(chess, m) {
  try { return chess.move({ from: m.from, to: m.to, promotion: m.promotion }); }
  catch { return null; }
}

function chessAfterSetup(fen, setup) {
  const c = new Chess(fen);
  const res = safeMove(c, setup);
  return res ? c.fen() : null;
}
