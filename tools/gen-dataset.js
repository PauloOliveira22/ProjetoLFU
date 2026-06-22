/*
 * Gera supabase/functions/_shared/dataset.ts a partir de www/js/data.js,
 * garantindo que cliente e servidor usem exatamente o mesmo dataset.
 * Tambem valida a composicao de cada elenco. Uso: npm run gen:dataset
 */
const fs = require('fs');
const path = require('path');

require('../www/js/data.js');
const { SQUADS, CLUBS } = globalThis.LFU.data;

// Dados reais tem elencos de tamanhos variados; so checamos o minimo basico.
let problems = 0;
SQUADS.forEach((sq) => {
  if (sq.players.length < 1) { console.error(`  ${sq.club} ${sq.year}: elenco vazio`); problems++; }
});
if (problems) { console.error(`\n${problems} problema(s). Geracao abortada.`); process.exit(1); }

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

export type Pos = 'GK' | 'ZAG' | 'LAT' | 'VOL' | 'MEI' | 'PON' | 'ATA';
export interface Player { name: string; pos: Pos; rating: number; }
export interface Squad { club: string; year: number; players: Player[]; }
export interface Club { name: string; overall: number; }
export interface Formation { id: string; name: string; counts: Record<Pos, number>; }

export const POS_ORDER: Pos[] = ['GK', 'ZAG', 'LAT', 'VOL', 'MEI', 'PON', 'ATA'];

export const FORMATIONS: Formation[] = [
  { id: '4-3-3', name: '4-3-3', counts: { GK: 1, ZAG: 2, LAT: 2, VOL: 1, MEI: 2, PON: 2, ATA: 1 } },
  { id: '4-4-2', name: '4-4-2', counts: { GK: 1, ZAG: 2, LAT: 2, VOL: 2, MEI: 2, PON: 0, ATA: 2 } },
  { id: '3-5-2', name: '3-5-2', counts: { GK: 1, ZAG: 3, LAT: 2, VOL: 1, MEI: 2, PON: 0, ATA: 2 } },
  { id: '4-2-3-1', name: '4-2-3-1', counts: { GK: 1, ZAG: 2, LAT: 2, VOL: 2, MEI: 1, PON: 2, ATA: 1 } },
  { id: '5-3-2', name: '5-3-2', counts: { GK: 1, ZAG: 3, LAT: 2, VOL: 2, MEI: 1, PON: 0, ATA: 2 } }
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
