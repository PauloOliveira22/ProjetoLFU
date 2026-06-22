// Simulacao AUTORITATIVA da temporada (roda no servidor).
// Usa um RNG com semente (seed) para ser reproduzivel/auditavel: guardando a
// seed e o elenco, da para reconstruir exatamente o mesmo resultado.

import { CLUBS, Player } from './dataset.ts';

const GOAL_LINES = [
  'GOOOOL! {p} apareceu na hora certa e mandou pra rede. Que golaco!',
  'Na medida! {p} subiu mais que a zaga e cabeceou no canto. E o gol!',
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
  'Quase! O chute passou raspando a trave.'
];

// RNG deterministico (mulberry32).
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Team {
  name: string; isUser: boolean; attack: number; defense: number; overall: number;
  players?: Player[];
}
interface Row { name: string; isUser: boolean; P: number; W: number; D: number; L: number; GF: number; GA: number; Pts: number; }
interface GoalEvent { minute: number; type: 'goal' | 'flavor'; text: string; scoreA: number; scoreB: number; }

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function ratingsForXI(players: Player[]) {
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 75);
  const rt = (poss: string[]) => players.filter((p) => poss.indexOf(p.pos) !== -1).map((p) => p.rating);
  const gk = avg(rt(['GK']));
  const def = avg(rt(['ZAG', 'LAT']));
  const mid = avg(rt(['VOL', 'MEI']));
  const fwd = avg(rt(['PON', 'ATA']));
  return {
    attack: fwd * 0.6 + mid * 0.4,
    defense: def * 0.6 + gk * 0.4,
    overall: Math.round(avg(players.map((p) => p.rating)))
  };
}

export interface SeasonResult {
  opponents: { name: string; overall: number }[];
  rounds: {
    userMatch: { home: string; away: string; events: GoalEvent[]; scoreA: number; scoreB: number };
    others: { home: string; away: string; sh: number; sa: number }[];
  }[];
  standings: Row[];
  champion: string;
  isChampion: boolean;
  isRelegated: boolean;
  finishPos: number;
  numTeams: number;
  userStats: { Pts: number; W: number; D: number; L: number; GF: number; GA: number };
  seed: number;
}

export function simulateSeason(club: string, xi: Player[], seed: number, numClubs = 20): SeasonResult {
  const rng = mulberry32(seed);
  const rint = (lo: number, hi: number) => Math.floor(rng() * (hi - lo + 1)) + lo;
  const rpick = <T,>(arr: T[]) => arr[rint(0, arr.length - 1)];

  // Adversarios (exceto o clube representado).
  const pool = CLUBS.filter((c) => c.name !== club).slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = rint(0, i); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const opponents: Team[] = pool.slice(0, numClubs - 1).map((c) => ({
    name: c.name, isUser: false, overall: c.overall,
    attack: c.overall + rint(-3, 3), defense: c.overall + rint(-3, 3)
  }));

  const r = ratingsForXI(xi);
  const userTeam: Team = { name: club, isUser: true, attack: r.attack, defense: r.defense, overall: r.overall, players: xi };
  const teams: Team[] = [userTeam, ...opponents];

  const table: Record<string, Row> = {};
  teams.forEach((t) => { table[t.name] = { name: t.name, isUser: t.isUser, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }; });

  function scorer(team: Team): string {
    if (team.players && team.players.length) {
      const att = team.players.filter((p) => p.pos === 'ATA' || p.pos === 'PON' || p.pos === 'MEI');
      return rpick(att.length ? att : team.players).name;
    }
    return team.name;
  }

  function simulate(a: Team, b: Team) {
    const la = clamp(1.45 * (a.attack / b.defense), 0.25, 4.5) / 90;
    const lb = clamp(1.45 * (b.attack / a.defense), 0.25, 4.5) / 90;
    let sa = 0; let sb = 0; const events: GoalEvent[] = [];
    for (let m = 1; m <= 90; m++) {
      if (rng() < la) { sa++; events.push({ minute: m, type: 'goal', text: rpick(GOAL_LINES).replace('{p}', scorer(a)), scoreA: sa, scoreB: sb }); }
      if (rng() < lb) { sb++; events.push({ minute: m, type: 'goal', text: rpick(GOAL_LINES).replace('{p}', scorer(b)), scoreA: sa, scoreB: sb }); }
      if (rng() < 0.04) events.push({ minute: m, type: 'flavor', text: rpick(FLAVOR_LINES), scoreA: sa, scoreB: sb });
    }
    events.sort((x, y) => x.minute - y.minute);
    return { sa, sb, events };
  }

  function apply(home: Team, away: Team, sh: number, sa: number) {
    const th = table[home.name]; const ta = table[away.name];
    th.P++; ta.P++; th.GF += sh; th.GA += sa; ta.GF += sa; ta.GA += sh;
    if (sh > sa) { th.W++; ta.L++; th.Pts += 3; }
    else if (sh < sa) { ta.W++; th.L++; ta.Pts += 3; }
    else { th.D++; ta.D++; th.Pts++; ta.Pts++; }
  }

  // Tabela de jogos pelo metodo do circulo (turno), depois ida e volta.
  const arr: (Team | null)[] = teams.slice();
  if (arr.length % 2 !== 0) arr.push(null);
  const n = arr.length;
  const ida: [Team, Team][][] = [];
  for (let rd = 0; rd < n - 1; rd++) {
    const round: [Team, Team][] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = arr[i]; const away = arr[n - 1 - i];
      if (home && away) round.push([home, away]);
    }
    ida.push(round);
    arr.splice(1, 0, arr.pop()!);
  }
  // Returno com mando invertido (38 rodadas no total).
  const volta = ida.map((round) => round.map(([h, a]) => [a, h] as [Team, Team]));
  const fixtures = ida.concat(volta);

  const rounds: SeasonResult['rounds'] = [];
  for (const round of fixtures) {
    let userMatch: SeasonResult['rounds'][number]['userMatch'] | null = null;
    const others: { home: string; away: string; sh: number; sa: number }[] = [];
    for (const [home, away] of round) {
      const res = simulate(home, away);
      apply(home, away, res.sa, res.sb);
      if (home.isUser || away.isUser) {
        userMatch = { home: home.name, away: away.name, events: res.events, scoreA: res.sa, scoreB: res.sb };
      } else {
        others.push({ home: home.name, away: away.name, sh: res.sa, sa: res.sb });
      }
    }
    if (userMatch) rounds.push({ userMatch, others });
  }

  const standings = Object.values(table).sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    const gd = (b.GF - b.GA) - (a.GF - a.GA);
    if (gd !== 0) return gd;
    return b.GF - a.GF;
  });

  const finishPos = standings.findIndex((t) => t.isUser) + 1;
  const numTeams = standings.length;
  const me = table[club];
  return {
    opponents: opponents.map((o) => ({ name: o.name, overall: o.overall })),
    rounds, standings,
    champion: standings[0].name,
    isChampion: standings[0].isUser,
    isRelegated: finishPos >= numTeams - 3, // entre os 4 ultimos
    finishPos,
    numTeams,
    userStats: { Pts: me.Pts, W: me.W, D: me.D, L: me.L, GF: me.GF, GA: me.GA },
    seed
  };
}
