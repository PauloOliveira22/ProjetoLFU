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

// 1) Para CADA formacao: o draft oferece apenas posicoes em aberto e, ao final,
//    preenche exatamente a contagem de cada posicao da tatica.
E.FORMATIONS.forEach((formation) => {
  const d = E.newDraft(formation.id);
  let guard = 0;
  while (!E.isDraftComplete(d) && guard++ < 100) {
    const open = E.openPositions(d);
    const { squad, selectable } = E.drawTeamForDraft(d);
    const allOpen = selectable.length > 0 && selectable.every((p) => open.indexOf(p.pos) !== -1);
    assert(allOpen, formation.id + ': so oferece posicoes em aberto (' + open.join(',') + ')');
    E.pickPlayer(d, squad, selectable[0]);
  }
  const filled = E.filledByPos(d);
  const ok = E.POS_ORDER.every((pos) => filled[pos] === (formation.counts[pos] || 0));
  assert(d.picks.length === 11, formation.id + ': 11 titulares');
  assert(ok, formation.id + ': contagem por posicao bate com a tatica');
});

// 1b) Nao e possivel exceder o limite de uma posicao.
//     No 4-3-3 ha 1 vaga de ATA; a 2a tentativa deve ser rejeitada.
const dGuard = E.newDraft('4-3-3');
const fakeSquad = { club: 'X', year: 1, players: [
  { name: 'A', pos: 'ATA', rating: 80 }, { name: 'B', pos: 'ATA', rating: 80 }
] };
let threw = false;
try {
  fakeSquad.players.forEach((p) => E.pickPlayer(dGuard, fakeSquad, p)); // 2o estoura o limite
} catch (e) { threw = true; }
assert(threw, 'rejeita preencher mais que o limite da posicao na formacao');
assert(E.filledByPos(dGuard).ATA === 1, 'parou exatamente em 1 atacante (4-3-3)');

// 1c) No inicio do draft (todas as posicoes do 4-3-3 abertas) o time sorteado
//     oferece o plantel completo para escolha.
const dFull = E.newDraft('4-3-3');
const firstDraw = E.drawTeamForDraft(dFull);
assert(firstDraw.selectable.length >= 16,
  'time sorteado oferece o plantel completo no inicio (tem ' + firstDraw.selectable.length + ')');

// 1d) As 5 formacoes somam 11 e usam as 7 posicoes conhecidas.
E.FORMATIONS.forEach((f) => {
  const sum = E.POS_ORDER.reduce((a, pos) => a + (f.counts[pos] || 0), 0);
  assert(sum === 11, f.id + ': soma 11 jogadores (tem ' + sum + ')');
});

// 2) Time montado tem ratings coerentes.
const draft = E.newDraft('4-3-3');
while (!E.isDraftComplete(draft)) {
  const { squad, selectable } = E.drawTeamForDraft(draft);
  E.pickPlayer(draft, squad, selectable[0]);
}
const team = E.buildUserTeam(draft, 'Seu Time');
assert(team.formation && team.formation.id === '4-3-3', 'time guarda a formacao escolhida');
assert(team.overall >= 60 && team.overall <= 99, 'overall em faixa valida (' + team.overall + ')');
assert(team.attack > 0 && team.defense > 0, 'ataque e defesa positivos');

// 3) Simulacao de partida produz placar e eventos ordenados.
const m = E.simulateMatch(team, E.clubToTeam({ name: 'Teste FC', overall: 80 }));
assert(m.scoreA >= 0 && m.scoreB >= 0, 'placar nao-negativo');
let ordered = true;
for (let i = 1; i < m.events.length; i++) if (m.events[i].minute < m.events[i - 1].minute) ordered = false;
assert(ordered, 'eventos da partida em ordem cronologica');

// 4) Temporada completa: tabela consistente (Serie A, 20 times, ida e volta).
const season = E.buildSeason(team, 20);
assert(season.fixtures.length === 38, 'ida e volta de 20 times => 38 rodadas');
while (!E.seasonFinished(season)) E.playRound(season);
const tableArr = E.standings(season);
assert(tableArr.length === 20, 'tabela com 20 times');
const totalPts = tableArr.reduce((a, t) => a + t.Pts, 0);
const totalJogos = tableArr.reduce((a, t) => a + t.P, 0) / 2; // cada jogo conta 2x
assert(totalJogos === 380, '380 jogos no total (20 times, ida e volta)');
// Cada time joga 38 partidas (mando ida e volta).
assert(tableArr.every((t) => t.P === 38), 'cada time joga 38 partidas');
assert(totalPts > 0, 'pontuacao distribuida');
tableArr.forEach((t) => {
  assert(t.P === t.W + t.D + t.L, t.name + ': jogos = V+E+D');
});

console.log(failures === 0 ? '\nTODOS OS TESTES PASSARAM ✅' : '\n' + failures + ' TESTE(S) FALHARAM ❌');
process.exit(failures === 0 ? 0 : 1);
