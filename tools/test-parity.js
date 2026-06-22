/*
 * Garante que o dataset do servidor (supabase/functions/_shared/dataset.ts)
 * cobre tudo que o cliente (www/js/data.js) pode escolher. Se divergirem, a
 * validacao server-side rejeitaria escolhas legitimas. Uso: npm run test:parity
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

// Cada elenco (club + year) precisa existir no dataset do servidor.
SQUADS.forEach((sq) => {
  assert(ts.includes(`club: '${sq.club}', year: ${sq.year}`), `elenco ausente no servidor: ${sq.club} ${sq.year}`);
  // Cada jogador precisa existir (por nome).
  sq.players.forEach((p) => {
    assert(ts.includes(`name: '${p.name}'`), `jogador ausente no servidor: ${p.name}`);
    assert(ts.includes(`pos: '${p.pos}', rating: ${p.rating}`) || ts.includes(`name: '${p.name}', pos: '${p.pos}', rating: ${p.rating}`),
      `rating/pos divergente para ${p.name} (${p.pos} ${p.rating})`);
  });
});

// Cada clube adversario precisa existir.
CLUBS.forEach((c) => {
  assert(ts.includes(`name: '${c.name}', overall: ${c.overall}`), `clube ausente/divergente no servidor: ${c.name}`);
});

console.log(failures === 0
  ? `PARIDADE OK: ${SQUADS.length} elencos e ${CLUBS.length} clubes conferem ✅`
  : `\n${failures} divergencia(s) entre cliente e servidor ❌`);
process.exit(failures === 0 ? 0 : 1);
