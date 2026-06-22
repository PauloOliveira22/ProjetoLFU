/*
 * Gera supabase/functions/_shared/dataset.ts a partir de www/js/data.js,
 * garantindo que cliente e servidor usem exatamente o mesmo dataset.
 * Tambem valida a composicao de cada elenco. Uso: npm run gen:dataset
 */
const fs = require('fs');
const path = require('path');

require('../www/js/data.js');
const { SQUADS, CLUBS } = globalThis.LFU.data;

// --- Validacao de composicao (precisa cobrir qualquer formacao) ---
const MIN = { GK: 2, DEF: 6, MID: 6, FWD: 5 }; // suporta ate 5 DEF, 5 MID, 3 FWD
let problems = 0;
SQUADS.forEach((sq) => {
  const c = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  sq.players.forEach((p) => { c[p.pos]++; });
  const total = sq.players.length;
  if (total < 23) { console.error(`  ${sq.club} ${sq.year}: ${total} jogadores (< 23)`); problems++; }
  for (const pos of Object.keys(MIN)) {
    if (c[pos] < MIN[pos]) { console.error(`  ${sq.club} ${sq.year}: ${pos}=${c[pos]} (< ${MIN[pos]})`); problems++; }
  }
});
if (problems) { console.error(`\n${problems} problema(s) de composicao. Geracao abortada.`); process.exit(1); }

// --- Emissao do TS ---
const player = (p) => `{ name: '${p.name}', pos: '${p.pos}', rating: ${p.rating} }`;
const squad = (s) => `  { club: '${s.club}', year: ${s.year}, players: [\n` +
  s.players.map((p) => `    ${player(p)}`).join(',\n') + `\n  ] }`;
const club = (c) => `  { name: '${c.name}', overall: ${c.overall} }`;

const header = `// =====================================================================
// Dataset CANONICO do servidor (fonte de verdade para validacao).
// GERADO automaticamente por tools/gen-dataset.js a partir de www/js/data.js.
// NAO EDITE A MAO. Rode: npm run gen:dataset
// =====================================================================

export type Pos = 'GK' | 'DEF' | 'MID' | 'FWD';
export interface Player { name: string; pos: Pos; rating: number; }
export interface Squad { club: string; year: number; players: Player[]; }
export interface Club { name: string; overall: number; }
export interface Formation { id: string; name: string; counts: Record<Pos, number>; }

export const POS_ORDER: Pos[] = ['GK', 'DEF', 'MID', 'FWD'];

export const FORMATIONS: Formation[] = [
  { id: '4-3-3', name: '4-3-3', counts: { GK: 1, DEF: 4, MID: 3, FWD: 3 } },
  { id: '4-4-2', name: '4-4-2', counts: { GK: 1, DEF: 4, MID: 4, FWD: 2 } },
  { id: '3-5-2', name: '3-5-2', counts: { GK: 1, DEF: 3, MID: 5, FWD: 2 } },
  { id: '4-2-3-1', name: '4-2-3-1', counts: { GK: 1, DEF: 4, MID: 5, FWD: 1 } },
  { id: '5-3-2', name: '5-3-2', counts: { GK: 1, DEF: 5, MID: 3, FWD: 2 } }
];
`;

const body = `
export const SQUADS: Squad[] = [
${SQUADS.map(squad).join(',\n')}
];

export const CLUBS: Club[] = [
${CLUBS.map(club).join(',\n')}
];
`;

const out = path.join(__dirname, '..', 'supabase', 'functions', '_shared', 'dataset.ts');
fs.writeFileSync(out, header + body);
console.log(`dataset.ts gerado: ${SQUADS.length} elencos, ${CLUBS.length} clubes ✅`);
