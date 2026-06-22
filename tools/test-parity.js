/*
 * Confere que o dataset do servidor (gerado) bate com o do cliente em
 * quantidades (elencos, jogadores, clubes). Rapido e independente de
 * formatacao. Uso: npm run test:parity
 */
const fs = require('fs');
const path = require('path');

require('../www/js/data.js');
const { SQUADS, CLUBS } = globalThis.LFU.data;
const ts = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', '_shared', 'dataset.ts'), 'utf8');

let failures = 0;
function assert(cond, msg) {
  if (!cond) { console.error('  FALHOU: ' + msg); failures++; }
}

const nSquadsTs = (ts.match(/players: \[/g) || []).length;
const nPlayersTs = (ts.match(/pos: '/g) || []).length;
const nClubsTs = (ts.match(/overall: \d/g) || []).length; // \d evita a linha "overall: number" da interface
const nPlayers = SQUADS.reduce((a, s) => a + s.players.length, 0);

assert(nSquadsTs === SQUADS.length, `elencos: cliente ${SQUADS.length} x servidor ${nSquadsTs}`);
assert(nPlayersTs === nPlayers, `jogadores: cliente ${nPlayers} x servidor ${nPlayersTs}`);
assert(nClubsTs === CLUBS.length, `clubes: cliente ${CLUBS.length} x servidor ${nClubsTs}`);

console.log(failures === 0
  ? `PARIDADE OK: ${SQUADS.length} elencos, ${nPlayers} jogadores, ${CLUBS.length} clubes ✅`
  : `\n${failures} divergencia(s) entre cliente e servidor ❌`);
process.exit(failures === 0 ? 0 : 1);
