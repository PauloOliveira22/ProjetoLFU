/*
 * store.js - Camada de contas, estatisticas e ranking.
 *
 * Esconde do resto do jogo ONDE os dados ficam:
 *  - MODO NUVEM  (Supabase configurado em config.js): login real, dados
 *    sincronizados e ranking GLOBAL de titulos por time.
 *  - MODO LOCAL  (sem chaves): tudo salvo em localStorage, so neste aparelho.
 *
 * API publica (toda assincrona):
 *   init(), isCloud()
 *   signUp(email, senha, username), signIn(email, senha), signOut()
 *   currentUser()                      -> { email, username } | null
 *   getProfile()                       -> { username, stats }
 *   recordSeason({ club, finishPos, isChampion, points, wins, draws,
 *                  losses, goalsFor, goalsAgainst, formationId })
 *   incrementTeamTitle(club)
 *   getTeamTitleRanking()              -> [{ club, titles }]
 */
(function (global) {
  'use strict';

  const cfg = (global.LFU && global.LFU.config) || {};
  let client = null;          // cliente Supabase (modo nuvem)
  let cloud = false;

  const LS_PROFILE = 'lfu_profile';
  const LS_TITLES = 'lfu_team_titles';
  const LS_NAME = 'lfu_local_name';

  function emptyStats() {
    return {
      seasonsPlayed: 0,
      titles: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      bestFinish: null,
      formationUsage: {}
    };
  }

  // ---------- helpers de localStorage ----------

  function lsGet(key, fallback) {
    try {
      const raw = global.localStorage && global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function lsSet(key, value) {
    try { global.localStorage && global.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignora */ }
  }

  function localProfile() {
    const p = lsGet(LS_PROFILE, null);
    if (p && p.stats) return p;
    return { username: lsGet(LS_NAME, 'Jogador'), stats: emptyStats() };
  }

  // Aplica o resultado de uma temporada sobre um objeto de estatisticas.
  function mergeSeason(stats, r) {
    stats.seasonsPlayed += 1;
    stats.wins += r.wins || 0;
    stats.draws += r.draws || 0;
    stats.losses += r.losses || 0;
    stats.goalsFor += r.goalsFor || 0;
    stats.goalsAgainst += r.goalsAgainst || 0;
    if (r.isChampion) stats.titles += 1;
    if (r.finishPos != null) {
      stats.bestFinish = stats.bestFinish == null ? r.finishPos : Math.min(stats.bestFinish, r.finishPos);
    }
    if (r.formationId) {
      stats.formationUsage[r.formationId] = (stats.formationUsage[r.formationId] || 0) + 1;
    }
    return stats;
  }

  // ---------- init ----------

  function init() {
    if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && global.supabase && global.supabase.createClient) {
      try {
        client = global.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
        cloud = true;
      } catch (e) {
        console.warn('Falha ao iniciar Supabase, usando modo local:', e);
        cloud = false;
      }
    }
    return Promise.resolve(cloud);
  }

  function isCloud() { return cloud; }

  // ---------- auth ----------

  async function signUp(email, password, username) {
    if (!cloud) throw new Error('Contas na nuvem nao estao configuradas (modo local).');
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    const uid = data.user && data.user.id;
    if (uid) {
      await client.from('profiles').upsert({
        id: uid, username: username || email.split('@')[0]
      });
    }
    return { email, username };
  }

  async function signIn(email, password) {
    if (!cloud) throw new Error('Contas na nuvem nao estao configuradas (modo local).');
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return currentUser();
  }

  async function signOut() {
    if (cloud) await client.auth.signOut();
  }

  async function currentUser() {
    if (!cloud) return null;
    const { data } = await client.auth.getUser();
    const user = data && data.user;
    if (!user) return null;
    let username = user.email;
    const { data: row } = await client.from('profiles').select('username').eq('id', user.id).maybeSingle();
    if (row && row.username) username = row.username;
    return { email: user.email, username };
  }

  // ---------- profile / stats ----------

  async function getProfile() {
    if (cloud) {
      const { data: u } = await client.auth.getUser();
      const user = u && u.user;
      if (!user) return { username: null, stats: emptyStats() };
      const { data: row } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (!row) return { username: user.email, stats: emptyStats() };
      return {
        username: row.username || user.email,
        stats: {
          seasonsPlayed: row.seasons || 0,
          titles: row.titles || 0,
          wins: row.wins || 0,
          draws: row.draws || 0,
          losses: row.losses || 0,
          goalsFor: row.goals_for || 0,
          goalsAgainst: row.goals_against || 0,
          bestFinish: row.best_finish,
          formationUsage: row.formation_usage || {}
        }
      };
    }
    return localProfile();
  }

  async function recordSeason(r) {
    if (cloud) {
      const { data: u } = await client.auth.getUser();
      const user = u && u.user;
      if (!user) throw new Error('Faca login para salvar suas estatisticas na nuvem.');
      const { data: row } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
      const stats = mergeSeason({
        seasonsPlayed: row ? (row.seasons || 0) : 0,
        wins: row ? (row.wins || 0) : 0,
        draws: row ? (row.draws || 0) : 0,
        losses: row ? (row.losses || 0) : 0,
        goalsFor: row ? (row.goals_for || 0) : 0,
        goalsAgainst: row ? (row.goals_against || 0) : 0,
        titles: row ? (row.titles || 0) : 0,
        bestFinish: row ? row.best_finish : null,
        formationUsage: (row && row.formation_usage) || {}
      }, r);
      await client.from('profiles').upsert({
        id: user.id,
        username: (row && row.username) || user.email,
        seasons: stats.seasonsPlayed,
        titles: stats.titles,
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        goals_for: stats.goalsFor,
        goals_against: stats.goalsAgainst,
        best_finish: stats.bestFinish,
        formation_usage: stats.formationUsage,
        updated_at: new Date().toISOString()
      });
      return;
    }
    const profile = localProfile();
    mergeSeason(profile.stats, r);
    lsSet(LS_PROFILE, profile);
  }

  // ---------- ranking global de titulos por time ----------

  async function incrementTeamTitle(club) {
    if (cloud) {
      const { error } = await client.rpc('increment_team_title', { p_club: club });
      if (error) throw error;
      return;
    }
    const titles = lsGet(LS_TITLES, {});
    titles[club] = (titles[club] || 0) + 1;
    lsSet(LS_TITLES, titles);
  }

  async function getTeamTitleRanking() {
    if (cloud) {
      const { data, error } = await client
        .from('team_titles').select('club,titles').order('titles', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const titles = lsGet(LS_TITLES, {});
    return Object.keys(titles)
      .map((club) => ({ club, titles: titles[club] }))
      .sort((a, b) => b.titles - a.titles);
  }

  function getLocalName() { return lsGet(LS_NAME, ''); }
  function setLocalName(name) {
    lsSet(LS_NAME, name);
    const p = localProfile();
    p.username = name;
    lsSet(LS_PROFILE, p);
  }

  global.LFU = global.LFU || {};
  global.LFU.store = {
    init, isCloud,
    signUp, signIn, signOut, currentUser,
    getProfile, recordSeason,
    incrementTeamTitle, getTeamTitleRanking,
    getLocalName, setLocalName
  };
})(typeof window !== 'undefined' ? window : globalThis);
