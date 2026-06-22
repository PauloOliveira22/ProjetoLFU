/*
 * import-csv.js - Gera www/js/data.js a partir de
 * data/brasileirao_2003_2025.csv (elencos reais 2003-2025 para o draft).
 *
 * Mantem as 7 posicoes reais:
 *   Goleiro->GK, Zagueiro->ZAG, Lateral->LAT, Volante->VOL,
 *   Meia->MEI, Ponta->PON, Atacante->ATA
 *
 * Uso: npm run import:csv   (depois rode npm run gen:dataset)
 */
const fs = require('fs');
const path = require('path');

const CSV = path.join(__dirname, '..', 'data', 'brasileirao_2003_2025.csv');
const OUT = path.join(__dirname, '..', 'www', 'js', 'data.js');

const POS = {
  'Goleiro': 'GK', 'Zagueiro': 'ZAG', 'Lateral': 'LAT', 'Volante': 'VOL',
  'Meia': 'MEI', 'Ponta': 'PON', 'Atacante': 'ATA'
};

const MIN_SQUAD = 16; // descarta elencos com poucos dados

// Clubes da Serie A (liga e representacao) - separado dos elencos do draft.
const CLUBS = [
  { name: 'Flamengo', overall: 87 }, { name: 'Palmeiras', overall: 86 },
  { name: 'Botafogo', overall: 84 }, { name: 'Cruzeiro', overall: 82 },
  { name: 'Sao Paulo', overall: 83 }, { name: 'Atletico-MG', overall: 83 },
  { name: 'Fluminense', overall: 82 }, { name: 'Internacional', overall: 82 },
  { name: 'Gremio', overall: 81 }, { name: 'Corinthians', overall: 81 },
  { name: 'Bahia', overall: 80 }, { name: 'RB Bragantino', overall: 80 },
  { name: 'Fortaleza', overall: 80 }, { name: 'Vasco', overall: 79 },
  { name: 'Santos', overall: 79 }, { name: 'Vitoria', overall: 76 },
  { name: 'Juventude', overall: 75 }, { name: 'Mirassol', overall: 75 },
  { name: 'Ceara', overall: 75 }, { name: 'Sport', overall: 74 }
];

const raw = fs.readFileSync(CSV, 'utf8').replace(/\r/g, '');
const lines = raw.split('\n').filter((l) => l.trim().length);
lines.shift(); // header

const map = new Map();
let skipped = 0;
let dups = 0;

for (const line of lines) {
  const parts = line.split(',');
  if (parts.length !== 6) { skipped++; continue; }
  const [ano, clube, jogador, posicao, overall] = parts;
  const pos = POS[posicao.trim()];
  if (!pos) { skipped++; continue; }
  const key = ano + '__' + clube;
  if (!map.has(key)) map.set(key, { club: clube, year: parseInt(ano, 10), players: [], seen: new Set() });
  const sq = map.get(key);
  if (sq.seen.has(jogador)) { dups++; continue; } // evita nomes repetidos no mesmo elenco
  sq.seen.add(jogador);
  sq.players.push({ name: jogador, pos, rating: parseInt(overall, 10) });
}

let squads = [...map.values()].filter((s) => s.players.length >= MIN_SQUAD);
squads.sort((a, b) => (a.year - b.year) || a.club.localeCompare(b.club));

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const playerLine = (p) => `    { name: '${esc(p.name)}', pos: '${p.pos}', rating: ${p.rating} }`;
const squadStr = (s) => `  { club: '${esc(s.club)}', year: ${s.year}, players: [\n` +
  s.players.map(playerLine).join(',\n') + `\n  ] }`;
const clubStr = (c) => `  { name: '${esc(c.name)}', overall: ${c.overall} }`;

const totalPlayers = squads.reduce((a, s) => a + s.players.length, 0);

const out = `/*
 * data.js - AUTO-GERADO por tools/import-csv.js a partir de
 * data/brasileirao_2003_2025.csv. NAO EDITE A MAO; rode: npm run import:csv
 *
 * SQUADS: elencos reais da Serie A de 2003 a 2025 (para o sorteio do draft).
 * CLUBS:  os 20 clubes da Serie A (liga e representacao).
 *
 * Posicoes (7): GK (goleiro), ZAG (zagueiro), LAT (lateral), VOL (volante),
 *               MEI (meia), PON (ponta), ATA (atacante).
 */
(function (global) {
  'use strict';

  const SQUADS = [
${squads.map(squadStr).join(',\n')}
  ];

  const CLUBS = [
${CLUBS.map(clubStr).join(',\n')}
  ];

  global.LFU = global.LFU || {};
  global.LFU.data = { SQUADS, CLUBS };
})(typeof window !== 'undefined' ? window : globalThis);
`;

fs.writeFileSync(OUT, out);
console.log(`data.js gerado: ${squads.length} elencos, ${totalPlayers} jogadores, ${CLUBS.length} clubes.`);
console.log(`(nomes repetidos removidos: ${dups}; linhas ignoradas: ${skipped})`);
