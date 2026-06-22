/*
 * engine.js - Logica do jogo (sem interface).
 *
 * Responsavel por:
 *  - Draft: sorteia elencos historicos e monta um XI numa formacao 4-3-3.
 *  - Avaliacao de time: calcula ataque/defesa/overall a partir do XI.
 *  - Simulacao de partida: gera placar dinamico + narracao em texto.
 *  - Temporada: liga de pontos corridos (turno unico) com tabela.
 */
(function (global) {
  'use strict';

  const data = global.LFU.data;

  // Formacao 4-3-3: 1 goleiro, 4 defensores, 3 meias, 3 atacantes.
  const FORMATION = [
    { pos: 'GK', total: 1, label: 'Goleiro' },
    { pos: 'DEF', total: 4, label: 'Defesa' },
    { pos: 'MID', total: 3, label: 'Meio-campo' },
    { pos: 'FWD', total: 3, label: 'Ataque' }
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

  // ---------- Draft ----------

  function newDraft() {
    const slots = {};
    FORMATION.forEach((f) => { slots[f.pos] = 0; });
    return {
      slots,                 // quantos jogadores ja escolhidos por posicao
      picks: [],             // jogadores escolhidos (com club/year de origem)
      pickedKeys: new Set(), // evita escolher o mesmo jogador duas vezes
      round: 0
    };
  }

  function openPositions(state) {
    return FORMATION.filter((f) => state.slots[f.pos] < f.total).map((f) => f.pos);
  }

  function isDraftComplete(state) {
    return state.picks.length >= 11;
  }

  // Sorteia um elenco que possua ao menos um jogador util (posicao em aberto
  // e ainda nao escolhido). Retorna o elenco e os jogadores selecionaveis.
  function drawTeamForDraft(state) {
    const open = openPositions(state);
    const usable = data.SQUADS.filter((sq) =>
      sq.players.some((p) =>
        open.includes(p.pos) && !state.pickedKeys.has(playerKey(sq, p))
      )
    );
    const squad = pick(usable.length ? usable : data.SQUADS);
    const selectable = squad.players.filter((p) =>
      open.includes(p.pos) && !state.pickedKeys.has(playerKey(squad, p))
    );
    return { squad, selectable };
  }

  function playerKey(squad, player) {
    return squad.club + '|' + squad.year + '|' + player.name;
  }

  function pickPlayer(state, squad, player) {
    if (state.slots[player.pos] >= positionTotal(player.pos)) {
      throw new Error('Posicao ja preenchida: ' + player.pos);
    }
    const entry = {
      name: player.name,
      pos: player.pos,
      rating: player.rating,
      from: squad.club + ' ' + squad.year
    };
    state.picks.push(entry);
    state.slots[player.pos]++;
    state.pickedKeys.add(playerKey(squad, player));
    state.round++;
    return entry;
  }

  function positionTotal(pos) {
    const f = FORMATION.find((x) => x.pos === pos);
    return f ? f.total : 0;
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
    'GOOOOL! {p} aparece na area e estufa a rede!',
    'Que golaco! {p} acerta um chute indefensavel!',
    'No contra-ataque, {p} so teve o trabalho de empurrar pra dentro!',
    'De cabeca! {p} sobe mais que a defesa e marca!',
    'Pintura! {p} cobra a falta no angulo!',
    'Pressao premiada! {p} balanca as redes!'
  ];

  const FLAVOR_LINES = [
    'Chega com perigo, mas a zaga afasta.',
    'Bola na trave! Quase o gol saiu.',
    'O goleiro faz uma defesaca!',
    'Jogada trabalhada pelo meio-campo.',
    'Falta perigosa na entrada da area.',
    'Escanteio cobrado, a defesa corta.'
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
      // Eventos de ambiente esporadicos (sem gol).
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
    // embaralha e escolhe adversarios (evita repetir o nome do usuario)
    shuffle(pool);
    const opponents = pool
      .filter((c) => c.name !== userTeam.name)
      .slice(0, n - 1)
      .map(clubToTeam);

    const teams = [userTeam].concat(opponents);
    const fixtures = roundRobin(teams);
    const table = {};
    teams.forEach((t) => {
      table[t.name] = { name: t.name, isUser: !!t.isUser, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 };
    });

    return { teams, fixtures, table, round: 0, results: [] };
  }

  // Metodo do circulo para gerar rodadas (turno unico).
  function roundRobin(teams) {
    const arr = teams.slice();
    if (arr.length % 2 !== 0) arr.push(null); // bye se impar
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
      arr.splice(1, 0, arr.pop()); // rotaciona mantendo o primeiro fixo
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

  // Simula a rodada atual. Retorna o resultado da partida do usuario (com
  // eventos para narracao ao vivo) e a lista dos demais resultados.
  function playRound(season) {
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
    FORMATION,
    newDraft,
    openPositions,
    isDraftComplete,
    drawTeamForDraft,
    pickPlayer,
    positionTotal,
    ratingsForXI,
    buildUserTeam,
    clubToTeam,
    simulateMatch,
    buildSeason,
    playRound,
    seasonFinished,
    standings
  };
})(typeof window !== 'undefined' ? window : globalThis);
