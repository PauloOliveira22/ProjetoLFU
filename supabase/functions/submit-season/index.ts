// =====================================================================
// Edge Function: submit-season
// Fluxo AUTORITATIVO (anti-trapaca):
//   1. Exige usuario autenticado (JWT).
//   2. Valida o elenco contra o dataset canonico (validateRoster).
//   3. Simula a temporada no SERVIDOR (simulateSeason, com seed).
//   4. Grava estatisticas e titulo usando a SERVICE ROLE (o cliente nunca
//      escreve essas tabelas diretamente).
//   5. Devolve a temporada para o cliente apenas REPRODUZIR.
//
// Deploy:  supabase functions deploy submit-season
// Variaveis de ambiente (injetadas automaticamente pelo Supabase):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRoster } from '../_shared/validate.ts';
import { simulateSeason } from '../_shared/engine.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'metodo nao permitido' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1) Identifica o usuario pelo JWT enviado pelo cliente.
    const authHeader = req.headers.get('Authorization') || '';
    const asUser = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: ures } = await asUser.auth.getUser();
    const user = ures?.user;
    if (!user) return json({ error: 'login obrigatorio' }, 401);

    // 2) Valida o elenco contra o dataset canonico.
    const payload = await req.json().catch(() => null);
    const v = validateRoster(payload);
    if (!v.ok) return json({ error: v.error }, 400);

    // 3) Simulacao autoritativa (com seed para auditoria).
    const seed = (Math.floor(Math.random() * 0xffffffff)) >>> 0;
    const result = simulateSeason(v.club, v.xi, seed);

    // 4) Gravacao com SERVICE ROLE (ignora RLS; so o servidor faz isso).
    const admin = createClient(url, serviceKey);

    const { data: row } = await admin.from('profiles').select('*').eq('id', user.id).maybeSingle();
    const base = {
      seasons: row?.seasons ?? 0,
      titles: row?.titles ?? 0,
      wins: row?.wins ?? 0,
      draws: row?.draws ?? 0,
      losses: row?.losses ?? 0,
      goals_for: row?.goals_for ?? 0,
      goals_against: row?.goals_against ?? 0,
      best_finish: row?.best_finish ?? null,
      relegations: row?.relegations ?? 0,
      formation_usage: (row?.formation_usage ?? {}) as Record<string, number>
    };
    const fu = { ...base.formation_usage };
    fu[v.formation.id] = (fu[v.formation.id] || 0) + 1;

    await admin.from('profiles').upsert({
      id: user.id,
      username: row?.username ?? (user.user_metadata?.username ?? user.email),
      seasons: base.seasons + 1,
      titles: base.titles + (result.isChampion ? 1 : 0),
      wins: base.wins + result.userStats.W,
      draws: base.draws + result.userStats.D,
      losses: base.losses + result.userStats.L,
      goals_for: base.goals_for + result.userStats.GF,
      goals_against: base.goals_against + result.userStats.GA,
      best_finish: base.best_finish == null ? result.finishPos : Math.min(base.best_finish, result.finishPos),
      relegations: base.relegations + (result.isRelegated ? 1 : 0),
      formation_usage: fu,
      updated_at: new Date().toISOString()
    });

    // Titulo conta no ranking global (incremento atomico via funcao SQL).
    if (result.isChampion) {
      const { error: bumpErr } = await admin.rpc('bump_team_title', { p_club: v.club });
      if (bumpErr) console.error('bump_team_title falhou:', bumpErr);
    }

    // 5) Devolve a temporada para o cliente reproduzir.
    return json({
      club: v.club,
      formationId: v.formation.id,
      seed,
      opponents: result.opponents,
      rounds: result.rounds,
      standings: result.standings,
      champion: result.champion,
      isChampion: result.isChampion,
      finishPos: result.finishPos,
      userStats: result.userStats
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
