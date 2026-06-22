/*
 * engine.js - Logica do jogo (sem interface).
 *
 * Responsavel por:
 *  - Formacoes taticas: o jogador escolhe uma no inicio.
 *  - Draft guiado por posicao: cada rodada pede UMA posicao da tatica e
 *    sorteia um elenco, mostrando so jogadores daquela posicao. Garante
 *    exatamente 1 jogador por slot da formacao escolhida.
 *  - Avaliacao de time: calcula ataque/defesa/overall a partir do XI.
 *  - Simulacao de partida: gera placar dinamico + narracao em texto.
 *  - Temporada: liga de pontos corridos (turno unico) com tabela.
 */
(function (global) {
  'use strict';

  const data = global.LFU.data;

  // Posicoes: GK (goleiro), DEF (defensor), MID (meio-campo), FWD (ataque).
  const POS_ORDER = ['GK', 'DEF', 'MID', 'FWD'];
  const POS_NAME = { GK: 'Goleiro', DEF: 'Defensor', MID: 'Meia', FWD: 'Atacante' };

  // Formacoes taticas disponiveis (cada contagem soma 11 jogadores).
  const FORMATIONS = [
    { id: '4-3-3', name: '4-3-3', desc: 'Equilibrado, com tres atacantes', counts: { GK: 1, DEF: 4, MID: 3, FWD: 3 } },
    { id: '4-4-2', name: '4-4-2', desc: 'Classico e solido', counts: { GK: 1, DEF: 4, MID: 4, FWD: 2 } },
    { id: '3-5-2', name: '3-5-2', desc: 'Meio-campo povoado', counts: { GK: 1, DEF: 3, MID: 5, FWD: 2 } },
    { id: '4-2-3-1', name: '4-2-3-1', desc: 'Controle e um centroavante', counts: { GK: 1, DEF: 4, MID: 5, FWD: 1 } },
    { id: '5-3-2', name: '5-3-2', desc: 'Defensivo, com alas', counts: { GK: 1, DEF: 5, MID: 3, FWD: 2 } }
  ];

  // ---------- Utilidades ----------

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  function avg(nums) {
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  function getFormation(id) {
    return FORMATIONS.find((f) => f.id === id) || FORMATIONS[0];
  }

  // ---------- Draft ----------

  function newDraft(formationId) {
    const formation = getFormation(formationId);
    return {
      formation,
      counts: formation.counts,
      total: 11,
      picks: [],
      pickedKeys: new Set()
    };
  }

  function isDraftComplete(state) {
    return state.picks.length >= state.total;
  }

  // Posicoes ainda em aberto (que nao atingiram o limite da formacao).
  function openPositions(state) {
    const filled = filledByPos(state);
    return POS_ORDER.filter((pos) => filled[pos] < (state.counts[pos] || 0));
  }

  // Quantos jogadores de cada posicao ja foram escolhidos.
  function filledByPos(state) {
    const f = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    state.picks.forEach((p) => { f[p.pos]++; });
    return f;
  }

  function playerKey(squad, player) {
    return squad.club + '|' + squad.year + '|' + player.name;
  }

  // Jogadores de um elenco que servem ao time: posicao ainda em aberto na
  // formacao e que ainda nao foram escolhidos.
  function usableFromSquad(state, squad, open) {
    return squad.players.filter(
      (p) => open.indexOf(p.pos) !== -1 && !state.pickedKeys.has(playerKey(squad, p))
    );
  }

  // Sorteia um elenco com pelo menos um jogador util (de posicao em aberto).
  // Prefere elencos com 2+ opcoes para a escolha valer a pena.
  function drawTeamForDraft(state) {
    const open = openPositions(state);
    const usable = data.SQUADS.filter((sq) => usableFromSquad(state, sq, open).length >= 1);
    const rich = usable.filter((sq) => usableFromSquad(state, sq, open).length >= 2);
    const pool = rich.length ? rich : usable;
    const squad = pick(pool.length ? pool : data.SQUADS);
    const selectable = usableFromSquad(state, squad, open);
    return { squad, selectable, open };
  }

  function pickPlayer(state, squad, player) {
    const filled = filledByPos(state);
    if (filled[player.pos] >= (state.counts[player.pos] || 0)) {
      throw new Error('Posicao ja preenchida: ' + player.pos);
    }
    const entry = {
      name: player.name,
      pos: player.pos,
      rating: player.rating,
      fromClub: squad.club,
      fromYear: squad.year,
      from: squad.club + ' ' + squad.year
    };
    state.picks.push(entry);
    state.pickedKeys.add(playerKey(squad, player));
    return entry;
  }

  // ---------- Avaliacao de time ----------

  function ratingsForXI(players) {
    const byPos = (pos) => players.filter((p) => p.pos === pos).map((p) => p.rating);
    const gk = avg(byPos('GK')) || 75;
    const def = avg(byPos('DEF')) || 75;
    const mid = avg(byPos('MID')) || 75;
    const fwd = avg(byPos('FWD')) || 75;

    const attack = fwd * 0.6 + mid * 0.4;
    const defense = def * 0.6 + gk * 0.4;
    const overall = avg(players.map((p) => p.rating));
    return {
      attack: Math.round(attack * 10) / 10,
      defense: Math.round(defense * 10) / 10,
      overall: Math.round(overall),
      lines: { gk: Math.round(gk), def: Math.round(def), mid: Math.round(mid), fwd: Math.round(fwd) }
    };
  }

  function buildUserTeam(draftState, name) {
    const r = ratingsForXI(draftState.picks);
    return {
      name: name || 'Seu Time',
      isUser: true,
      formation: draftState.formation,
      players: draftState.picks.slice(),
      attack: r.attack,
      defense: r.defense,
      overall: r.overall,
      lines: r.lines
    };
  }

  // Transforma um clube adversario (so com overall) num time jogavel.
  function clubToTeam(club) {
    const v = () => randInt(-3, 3);
    return {
      name: club.name,
      isUser: false,
      attack: club.overall + v(),
      defense: club.overall + v(),
      overall: club.overall
    };
  }

  // ---------- Simulacao de partida ----------

  const GOAL_LINES = [
    'GOOOOL! {p} apareceu na hora certa e mandou pra rede. Que golaco!',
    'Na medida! {p} subiu mais que a zaga e cabeceou no canto. 1, 2, 3... e o gol!',
    '{p} recebeu na entrada da area, limpou o marcador e bateu colocado. Um golaco!',
    'Pegou de primeira! {p} acertou um chute sem chance pro goleiro.',
    'No contra-ataque mortal, {p} saiu cara a cara e nao desperdicou.',
    'Tava guardado! {p} bateu a falta com efeito e a bola morreu no angulo.',
    'O time tocou, tocou e {p} apareceu livre pra empurrar pra rede.',
    '{p} pescou o rebote dentro da area e nao perdoou. A torcida explode!',
    'Dominou no peito e bateu de primeira: {p} faz um golaco e cala o adversario.',
    'Na saida do goleiro, {p} tocou com categoria e a rede balancou.',
    'Que jogada individual! {p} driblou a defesa inteira antes de marcar.',
    'De penalti, com a frieza dos grandes, {p} desloca o goleiro e marca.'
  ];

  const FLAVOR_LINES = [
    'Chega com perigo, mas a zaga afasta de cabeca.',
    'Na trave! Faltou pouco pro gol sair.',
    'Defesaca do goleiro, que evita o gol no susto.',
    'Jogada bem trabalhada no meio-campo, mas sem finalizacao.',
    'Falta perigosa na entrada da area, atencao na barreira.',
    'Escanteio cobrado na area e a defesa corta firme.',
    'Quase! O chute passou raspando a trave.',
    'Cartao amarelo para a entrada dura no meio.'
  ];

  function scorerFrom(team) {
    if (team.players && team.players.length) {
      const att = team.players.filter((p) => p.pos === 'FWD' || p.pos === 'MID');
      const p = pick(att.length ? att : team.players);
      return p.name;
    }
    return team.name;
  }

  // Modelo simples baseado em gols esperados (xG) por time.
  function simulateMatch(teamA, teamB) {
    const lambdaA = clamp(1.45 * (teamA.attack / teamB.defense), 0.25, 4.5);
    const lambdaB = clamp(1.45 * (teamB.attack / teamA.defense), 0.25, 4.5);
    const pA = lambdaA / 90;
    const pB = lambdaB / 90;

    let scoreA = 0;
    let scoreB = 0;
    const events = [];

    for (let minute = 1; minute <= 90; minute++) {
      if (Math.random() < pA) {
        scoreA++;
        events.push(goalEvent(minute, teamA, scoreA, scoreB));
      }
      if (Math.random() < pB) {
        scoreB++;
        events.push(goalEvent(minute, teamB, scoreA, scoreB));
      }
      if (Math.random() < 0.04) {
        events.push({ minute, type: 'flavor', text: pick(FLAVOR_LINES), scoreA, scoreB });
      }
    }

    events.sort((a, b) => a.minute - b.minute);
    return { teamA, teamB, scoreA, scoreB, events };
  }

  function goalEvent(minute, team, scoreA, scoreB) {
    const scorer = scorerFrom(team);
    return {
      minute,
      type: 'goal',
      team: team.name,
      text: GOAL_LINES[randInt(0, GOAL_LINES.length - 1)].replace('{p}', scorer),
      scoreA,
      scoreB
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // ---------- Temporada (pontos corridos, turno unico) ----------

  function buildSeason(userTeam, numClubs) {
    const n = (numClubs || 8);
    const pool = data.CLUBS.slice();
    shuffle(pool);
    const opponents = pool
      .filter((c) => c.name !== userTeam.name)
      .slice(0, n - 1)
      .map(clubToTeam);

    const teams = [userTeam].concat(opponents);
    const fixtures = doubleRoundRobin(teams);
    const table = newTable(teams.map((t) => ({ name: t.name, isUser: !!t.isUser })));

    return { mode: 'local', teams, fixtures, table, round: 0, results: [] };
  }

  // Ida e volta: turno + returno com mando invertido (20 times => 38 rodadas).
  function doubleRoundRobin(teams) {
    const ida = roundRobin(teams);
    const volta = ida.map((round) => round.map(([home, away]) => [away, home]));
    return ida.concat(volta);
  }

  function newTable(teamRefs) {
    const table = {};
    teamRefs.forEach((t) => {
      table[t.name] = { name: t.name, isUser: !!t.isUser, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 };
    });
    return table;
  }

  // Monta uma temporada a partir de dados JA simulados pelo servidor (modo
  // nuvem). O cliente apenas reproduz/exibe; nada e recalculado aqui.
  // serverData = { userName, opponents:[{name,overall}], rounds:[
  //   { userMatch:{home,away,events,scoreA,scoreB}, others:[{home,away,sh,sa}] } ] }
  function buildCloudSeason(userName, serverData) {
    const refs = [{ name: userName, isUser: true }]
      .concat(serverData.opponents.map((o) => ({ name: o.name, isUser: false })));
    return {
      mode: 'cloud',
      userName,
      server: serverData,
      opponents: serverData.opponents,
      fixtures: serverData.rounds,   // 1 entrada por rodada
      rounds: serverData.rounds,
      table: newTable(refs),
      round: 0,
      results: []
    };
  }

  function roundRobin(teams) {
    const arr = teams.slice();
    if (arr.length % 2 !== 0) arr.push(null);
    const n = arr.length;
    const rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const round = [];
      for (let i = 0; i < n / 2; i++) {
        const home = arr[i];
        const away = arr[n - 1 - i];
        if (home && away) round.push([home, away]);
      }
      rounds.push(round);
      arr.splice(1, 0, arr.pop());
    }
    return rounds;
  }

  function applyResult(table, home, away, sh, sa) {
    const th = table[home.name];
    const ta = table[away.name];
    th.P++; ta.P++;
    th.GF += sh; th.GA += sa;
    ta.GF += sa; ta.GA += sh;
    if (sh > sa) { th.W++; ta.L++; th.Pts += 3; }
    else if (sh < sa) { ta.W++; th.L++; ta.Pts += 3; }
    else { th.D++; ta.D++; th.Pts++; ta.Pts++; }
  }

  function playRound(season) {
    if (season.mode === 'cloud') return playRoundCloud(season);

    const fixtures = season.fixtures[season.round];
    let userResult = null;
    const others = [];

    fixtures.forEach(([home, away]) => {
      const result = simulateMatch(home, away);
      applyResult(season.table, home, away, result.scoreA, result.scoreB);
      if (home.isUser || away.isUser) {
        userResult = result;
      } else {
        others.push({ home: home.name, away: away.name, sh: result.scoreA, sa: result.scoreB });
      }
    });

    season.results.push({ round: season.round, userResult, others });
    season.round++;
    return { userResult, others, roundIndex: season.round - 1 };
  }

  // Reproduz uma rodada vinda do servidor (modo nuvem): apenas aplica os
  // placares ja decididos na tabela e repassa os eventos para narracao.
  function playRoundCloud(season) {
    const rd = season.rounds[season.round];
    const u = rd.userMatch;
    applyResult(season.table, { name: u.home }, { name: u.away }, u.scoreA, u.scoreB);
    (rd.others || []).forEach((o) => {
      applyResult(season.table, { name: o.home }, { name: o.away }, o.sh, o.sa);
    });
    const userResult = {
      teamA: { name: u.home }, teamB: { name: u.away },
      scoreA: u.scoreA, scoreB: u.scoreB, events: u.events || []
    };
    season.results.push({ round: season.round, userResult, others: rd.others || [] });
    season.round++;
    return { userResult, others: rd.others || [], roundIndex: season.round - 1 };
  }

  // Proximo adversario do usuario na rodada atual (serve para os dois modos).
  function nextUserMatch(season) {
    if (season.mode === 'cloud') {
      const u = season.rounds[season.round].userMatch;
      const oppName = u.home === season.userName ? u.away : u.home;
      const o = season.opponents.find((x) => x.name === oppName);
      return { name: oppName, overall: o ? o.overall : '—' };
    }
    const fixture = season.fixtures[season.round];
    const pair = fixture.find((m) => m[0].isUser || m[1].isUser);
    const opp = pair[0].isUser ? pair[1] : pair[0];
    return { name: opp.name, overall: opp.overall };
  }

  function seasonFinished(season) {
    return season.round >= season.fixtures.length;
  }

  function standings(season) {
    return Object.values(season.table).slice().sort((a, b) => {
      if (b.Pts !== a.Pts) return b.Pts - a.Pts;
      const gdA = a.GF - a.GA;
      const gdB = b.GF - b.GA;
      if (gdB !== gdA) return gdB - gdA;
      return b.GF - a.GF;
    });
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  global.LFU = global.LFU || {};
  global.LFU.engine = {
    POS_ORDER,
    POS_NAME,
    FORMATIONS,
    getFormation,
    newDraft,
    isDraftComplete,
    openPositions,
    filledByPos,
    drawTeamForDraft,
    pickPlayer,
    ratingsForXI,
    buildUserTeam,
    clubToTeam,
    simulateMatch,
    buildSeason,
    buildCloudSeason,
    playRound,
    nextUserMatch,
    seasonFinished,
    standings
  };
})(typeof window !== 'undefined' ? window : globalThis);
