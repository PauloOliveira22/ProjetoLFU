/*
 * config.js - Configuracao do backend (Supabase).
 *
 * Para ativar contas na NUVEM (login real + ranking global), preencha os dois
 * valores abaixo com as chaves do seu projeto Supabase:
 *   Supabase > Project Settings > API
 *
 * Sao chaves PUBLICAS (a "anon key" e segura para ficar no cliente, desde que
 * as policies de Row Level Security estejam ativas - veja supabase/schema.sql).
 *
 * Se deixar em branco, o jogo funciona em MODO LOCAL: estatisticas e ranking
 * sao salvos apenas neste aparelho (sem login, sem nuvem).
 */
(function (global) {
  'use strict';
  global.LFU = global.LFU || {};
  global.LFU.config = {
    SUPABASE_URL: 'https://ifemfjesfbbvcknppwiv.supabase.co',
    // Chave PUBLICA (publishable). Segura no cliente: a protecao vem das
    // policies de Row Level Security (veja supabase/schema.sql).
    SUPABASE_ANON_KEY: 'sb_publishable_xuB_a0k-7WORK1eHp5jNdw_x8OBimJA'
  };
})(typeof window !== 'undefined' ? window : globalThis);
