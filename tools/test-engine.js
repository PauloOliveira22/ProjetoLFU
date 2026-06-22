/*
 * Teste de fumaca do motor do jogo (sem navegador).
 * Executa um draft automatico, monta o time e simula uma temporada inteira,
 * validando invariantes basicas. Uso: npm test
 */
require('../www/js/data.js');
require('../www/js/engine.js');

const E = globalThis.LFU.engine;
let failures = 0;

function assert(cond, msg) {
  if (!cond) { console.error('  FALHOU: ' + msg); failures++; }
  else { console.log('  ok: ' + msg); }
}

// 1) Draft automatico escolhe 11 jogadores na formacao correta.
const draft = E.newDraft();
let guard = 0;
while (!E.isDraftComplete(draft) && guard++ < 100) {
  const { squad, selectable } = E.drawTeamForDraft(draft);
  assert(selectable.length > 0, 'rodada ' + (draft.picks.length + 1) + ' tem jogadores selecionaveis');
  E.pickPlayer(draft, squad, selectable[0]);
}
assert(draft.picks.length === 11, 'draft completou com 11 jogadores');
assert(draft.slots.GK === 1 && draft.slots.DEF === 4 && draft.slots.MID === 3 && draft.slots.FWD === 3,
  'formacao 4-3-3 respeitada');

// 2) Time montado tem ratings coerentes.
const team = E.buildUserTeam(draft, 'Seu Time');
assert(team.overall >= 60 && team.overall <= 99, 'overall em faixa valida (' + team.overall + ')');
assert(team.attack > 0 && team.defense > 0, 'ataque e defesa positivos');

// 3) Simulacao de partida produz placar e eventos ordenados.
const m = E.simulateMatch(team, E.clubToTeam({ name: 'Teste FC', overall: 80 }));
assert(m.scoreA >= 0 && m.scoreB >= 0, 'placar nao-negativo');
let ordered = true;
for (let i = 1; i < m.events.length; i++) if (m.events[i].minute < m.events[i - 1].minute) ordered = false;
assert(ordered, 'eventos da partida em ordem cronologica');

// 4) Temporada completa: tabela consistente.
const season = E.buildSeason(team, 8);
assert(season.fixtures.length === 7, 'turno unico de 8 times => 7 rodadas');
while (!E.seasonFinished(season)) E.playRound(season);
const tableArr = E.standings(season);
assert(tableArr.length === 8, 'tabela com 8 times');
const totalPts = tableArr.reduce((a, t) => a + t.Pts, 0);
const totalJogos = tableArr.reduce((a, t) => a + t.P, 0) / 2; // cada jogo conta 2x
assert(totalJogos === 28, '28 jogos no total (8 times, turno unico)');
assert(totalPts > 0, 'pontuacao distribuida');
tableArr.forEach((t) => {
  assert(t.P === t.W + t.D + t.L, t.name + ': jogos = V+E+D');
});

console.log(failures === 0 ? '\nTODOS OS TESTES PASSARAM ✅' : '\n' + failures + ' TESTE(S) FALHARAM ❌');
process.exit(failures === 0 ? 0 : 1);
