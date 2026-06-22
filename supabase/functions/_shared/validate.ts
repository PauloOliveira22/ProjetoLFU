// Validacao do elenco enviado pelo cliente contra o dataset canonico.
// Garante: clube valido, formacao valida, 11 jogadores REAIS, sem repetidos,
// e composicao por posicao identica a formacao escolhida. A posicao e o
// rating sao SEMPRE lidos do dataset (o que o cliente envia e ignorado).

import { SQUADS, CLUBS, FORMATIONS, POS_ORDER, Formation, Player } from './dataset.ts';

export interface SelectedPlayer { club: string; year: number; name: string; }
export interface RosterPayload { club: string; formationId: string; players: SelectedPlayer[]; }

export type ValidationResult =
  | { ok: true; club: string; formation: Formation; xi: Player[] }
  | { ok: false; error: string };

export function validateRoster(payload: unknown): ValidationResult {
  const p = payload as RosterPayload | null;
  if (!p || typeof p !== 'object') return fail('payload ausente ou invalido');

  if (!CLUBS.some((c) => c.name === p.club)) return fail('clube invalido: ' + p.club);

  const formation = FORMATIONS.find((f) => f.id === p.formationId);
  if (!formation) return fail('formacao invalida: ' + p.formationId);

  if (!Array.isArray(p.players) || p.players.length !== 11) {
    return fail('o elenco precisa ter exatamente 11 jogadores');
  }

  const xi: Player[] = [];
  const seen = new Set<string>();

  for (const sel of p.players) {
    if (!sel || typeof sel.name !== 'string') return fail('jogador invalido no elenco');
    const squad = SQUADS.find((s) => s.club === sel.club && s.year === sel.year);
    if (!squad) return fail('time inexistente no dataset: ' + sel.club + ' ' + sel.year);
    const player = squad.players.find((pp) => pp.name === sel.name);
    if (!player) return fail('jogador inexistente: ' + sel.name + ' (' + sel.club + ' ' + sel.year + ')');

    const key = sel.club + '|' + sel.year + '|' + sel.name;
    if (seen.has(key)) return fail('jogador repetido: ' + sel.name);
    seen.add(key);

    // rating e posicao CANONICOS (do dataset), nunca do cliente.
    xi.push({ name: player.name, pos: player.pos, rating: player.rating });
  }

  const counts: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  xi.forEach((pl) => { counts[pl.pos]++; });
  for (const pos of POS_ORDER) {
    if (counts[pos] !== (formation.counts[pos] || 0)) {
      return fail('composicao do elenco nao corresponde a formacao ' + formation.id);
    }
  }

  return { ok: true, club: p.club, formation, xi };
}

function fail(error: string): ValidationResult {
  return { ok: false, error };
}
