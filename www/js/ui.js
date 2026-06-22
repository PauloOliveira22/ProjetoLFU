/*
 * ui.js - Interface e fluxo de telas.
 * Home -> Escolher clube -> Formacao -> Draft -> Resumo -> Temporada
 *      -> Campeao (registra titulo/estatisticas). Tambem: Conta e Ranking.
 */
(function (global) {
  'use strict';

  const E = global.LFU.engine;
  const S = global.LFU.store;

  const POS_LABEL = { GK: 'GOL', DEF: 'DEF', MID: 'MEI', FWD: 'ATA' };

  let app;            // container raiz
  let draft;          // estado do draft
  let userTeam;       // time montado (XI)
  let representedClub; // clube que o jogador representa
  let season;         // estado da temporada
  let liveTimer;      // timer da narracao ao vivo
  let seasonRecorded; // no modo nuvem, se a temporada foi validada/gravada
  let seasonNote;     // aviso quando a validacao no servidor falha

  function el(id) { return document.getElementById(id); }
  function render(html) { app.innerHTML = html; }
  function esc(s) { return String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); }

  // ---------- Home ----------

  function showHome() {
    clearLive();
    render(`
      <section class="screen home">
        <div class="crest">⚽</div>
        <h1>Brasileirão <span>Draft</span></h1>
        <p class="tagline">Escolha seu clube, monte o time com craques históricos
        e leve-o ao título.</p>
        <button class="btn btn-primary" id="btnPlay">Jogar</button>
        <button class="btn btn-ghost" id="btnRank">🏆 Ranking de títulos</button>
        <button class="btn btn-ghost" id="btnAccount">👤 Minha conta</button>
        <button class="btn btn-ghost" id="btnHow">Como jogar</button>
      </section>
    `);
    el('btnPlay').onclick = showTeamSelect;
    el('btnRank').onclick = showRanking;
    el('btnAccount').onclick = showAccount;
    el('btnHow').onclick = showHowTo;
  }

  function showHowTo() {
    render(`
      <section class="screen">
        <h2>Como jogar</h2>
        <ol class="howto">
          <li>Escolha o <b>clube que você vai representar</b>.</li>
          <li>Defina a <b>formação tática</b> (4-3-3, 4-4-2...).</li>
          <li>O jogo <b>sorteia um elenco histórico</b> e você escolhe
          <b>qualquer jogador</b> de uma posição ainda em aberto.</li>
          <li>Repete até completar os <b>11 titulares</b>.</li>
          <li>Dispute o <b>Brasileirão</b> com partidas simuladas ao vivo.</li>
          <li>Seja <b>campeão</b>: cada título conta no <b>ranking global do
          seu clube</b>!</li>
        </ol>
        <button class="btn btn-primary" id="btnBack">Voltar</button>
      </section>
    `);
    el('btnBack').onclick = showHome;
  }

  // ---------- Escolha do clube ----------

  function showTeamSelect() {
    const clubs = global.LFU.data.CLUBS.slice().sort((a, b) => a.name.localeCompare(b.name));
    const cards = clubs.map((c) => `
      <button class="club-card" data-name="${esc(c.name)}">
        <span class="club-badge">${esc(c.name[0])}</span>
        <span class="club-name">${esc(c.name)}</span>
      </button>`).join('');

    render(`
      <section class="screen team-select">
        <h2>Escolha seu clube</h2>
        <p class="hint">Você vai representar este time. Títulos contam no ranking global.</p>
        <div class="clubs">${cards}</div>
        <button class="btn btn-ghost" id="btnBack">Voltar</button>
      </section>
    `);
    Array.from(document.querySelectorAll('.club-card')).forEach((btn) => {
      btn.onclick = () => { representedClub = btn.dataset.name; showFormationSelect(); };
    });
    el('btnBack').onclick = showHome;
  }

  // ---------- Selecao de formacao ----------

  function showFormationSelect() {
    const cards = E.FORMATIONS.map((f) => {
      const c = f.counts;
      const breakdown = `${c.DEF} DEF · ${c.MID} MEI · ${c.FWD} ATA`;
      return `
        <button class="formation-card" data-id="${f.id}">
          <span class="fname">${f.name}</span>
          <span class="fdesc">${f.desc}</span>
          <span class="fbreak">${breakdown}</span>
        </button>`;
    }).join('');

    render(`
      <section class="screen formation">
        <div class="rep-tag">Representando: <b>${esc(representedClub)}</b></div>
        <h2>Escolha a formação</h2>
        <p class="hint">A tática define quantos jogadores de cada posição você terá.</p>
        <div class="formations">${cards}</div>
        <button class="btn btn-ghost" id="btnBack">Voltar</button>
      </section>
    `);
    Array.from(document.querySelectorAll('.formation-card')).forEach((btn) => {
      btn.onclick = () => startDraft(btn.dataset.id);
    });
    el('btnBack').onclick = showTeamSelect;
  }

  // ---------- Draft ----------

  function startDraft(formationId) {
    draft = E.newDraft(formationId);
    nextDraftRound();
  }

  function nextDraftRound() {
    if (E.isDraftComplete(draft)) {
      userTeam = E.buildUserTeam(draft, representedClub);
      showSquad();
      return;
    }
    const { squad, selectable } = E.drawTeamForDraft(draft);
    const counts = draft.formation.counts;
    const filled = E.filledByPos(draft);
    const open = E.openPositions(draft);

    const slotsHtml = E.POS_ORDER.map((pos) => {
      const total = counts[pos] || 0;
      if (!total) return '';
      const isOpen = open.indexOf(pos) !== -1;
      return `<span class="slot ${filled[pos] >= total ? 'full' : ''} ${isOpen ? 'target' : ''}">
        ${POS_LABEL[pos]} ${filled[pos]}/${total}</span>`;
    }).join('');

    const playersHtml = selectable.map((p, i) => `
      <button class="player-card" data-i="${i}">
        <span class="pos pos-${p.pos}">${POS_LABEL[p.pos]}</span>
        <span class="pname">${esc(p.name)}</span>
        <span class="rating">${p.rating}</span>
      </button>
    `).join('');

    render(`
      <section class="screen draft">
        <div class="progress">Escolha ${draft.picks.length + 1} de 11
          <span class="form-tag">${draft.formation.name}</span></div>
        <div class="slots">${slotsHtml}</div>
        <div class="drawn">
          <span class="drawn-label">Time sorteado</span>
          <h2>${esc(squad.club)} <small>${squad.year}</small></h2>
          <p class="hint">Escolha <b>qualquer jogador</b> de uma posição ainda em aberto:</p>
        </div>
        <div class="players">${playersHtml}</div>
      </section>
    `);

    Array.from(document.querySelectorAll('.player-card')).forEach((btn) => {
      btn.onclick = () => {
        const p = selectable[parseInt(btn.dataset.i, 10)];
        E.pickPlayer(draft, squad, p);
        nextDraftRound();
      };
    });
  }

  // ---------- Resumo do time ----------

  function showSquad() {
    const grouped = E.POS_ORDER.map((pos) => {
      const items = userTeam.players.filter((p) => p.pos === pos).map((p) => `
        <li>
          <span class="pos pos-${p.pos}">${POS_LABEL[p.pos]}</span>
          <span class="pname">${esc(p.name)}</span>
          <span class="from">${esc(p.from)}</span>
          <span class="rating">${p.rating}</span>
        </li>`).join('');
      return `<ul class="line line-${pos}">${items}</ul>`;
    }).join('');

    render(`
      <section class="screen squad">
        <h2>${esc(userTeam.name)} <span class="form-tag">${userTeam.formation.name}</span></h2>
        <div class="ratings">
          <div class="rbox"><b>${userTeam.overall}</b><span>Geral</span></div>
          <div class="rbox"><b>${userTeam.attack}</b><span>Ataque</span></div>
          <div class="rbox"><b>${userTeam.defense}</b><span>Defesa</span></div>
        </div>
        <div class="pitch">${grouped}</div>
        <button class="btn btn-primary" id="btnSeason">Começar Temporada</button>
        <button class="btn btn-ghost" id="btnRedraft">Refazer Draft</button>
      </section>
    `);
    el('btnSeason').onclick = startSeason;
    el('btnRedraft').onclick = showFormationSelect;
  }

  // ---------- Temporada ----------

  async function startSeason() {
    seasonRecorded = false;
    seasonNote = '';
    if (S.isCloud()) {
      render(`<section class="screen"><h2>⏳</h2>
        <p class="hint">Validando seu elenco e simulando a temporada no servidor...</p></section>`);
      try {
        const payload = {
          club: representedClub,
          formationId: userTeam.formation.id,
          players: userTeam.players.map((p) => ({ club: p.fromClub, year: p.fromYear, name: p.name }))
        };
        const server = await S.submitSeason(payload);
        season = E.buildCloudSeason(userTeam.name, server);
        seasonRecorded = true; // ja gravado de forma autoritativa no servidor
      } catch (e) {
        // Sem servidor: joga localmente, mas NAO conta para o ranking global.
        season = E.buildSeason(userTeam, 8);
        seasonNote = '⚠️ Não foi possível validar no servidor (' + (e.message || e) +
          '). Esta temporada não conta no ranking global — faça login e tente novamente.';
      }
    } else {
      season = E.buildSeason(userTeam, 8);
    }
    showRoundIntro();
  }

  function showRoundIntro() {
    if (E.seasonFinished(season)) { showChampion(); return; }
    const opp = E.nextUserMatch(season);

    render(`
      <section class="screen round-intro">
        <div class="round-tag">Rodada ${season.round + 1} de ${season.fixtures.length}</div>
        <h2>Próximo jogo</h2>
        <div class="versus">
          <div class="vteam"><b>${esc(userTeam.name)}</b><span>${userTeam.overall}</span></div>
          <div class="vx">×</div>
          <div class="vteam"><b>${esc(opp.name)}</b><span>${opp.overall}</span></div>
        </div>
        <button class="btn btn-primary" id="btnPlay">Jogar partida</button>
        <button class="btn btn-ghost" id="btnTable">Ver tabela</button>
      </section>
    `);
    el('btnPlay').onclick = playRoundLive;
    el('btnTable').onclick = () => showTable(false);
  }

  function playRoundLive() {
    const { userResult, others } = E.playRound(season);
    const home = userResult.teamA;
    const away = userResult.teamB;

    render(`
      <section class="screen live">
        <div class="scoreboard">
          <div class="sb-team">${esc(home.name)}</div>
          <div class="sb-score"><span id="sa">0</span> : <span id="sb">0</span></div>
          <div class="sb-team">${esc(away.name)}</div>
        </div>
        <div class="clock">Bola rolando... <span id="clock">0'</span></div>
        <div class="commentary" id="commentary"></div>
        <button class="btn btn-ghost" id="btnSkip">Pular para o fim</button>
        <button class="btn btn-primary hidden" id="btnNext">Continuar</button>
      </section>
    `);

    const commentary = el('commentary');
    const events = userResult.events.slice();
    let idx = 0;
    let minute = 0;

    function finishMatch() {
      clearLive();
      el('sa').textContent = userResult.scoreA;
      el('sb').textContent = userResult.scoreB;
      el('clock').textContent = "90'";
      el('btnSkip').classList.add('hidden');
      const final = document.createElement('div');
      final.className = 'final-line';
      final.textContent = `Fim de jogo: ${home.name} ${userResult.scoreA} x ${userResult.scoreB} ${away.name}`;
      commentary.prepend(final);
      const next = el('btnNext');
      next.classList.remove('hidden');
      next.onclick = () => showTable(true, others);
    }

    el('btnSkip').onclick = finishMatch;

    liveTimer = setInterval(() => {
      minute += 2;
      if (minute > 90) minute = 90;
      el('clock').textContent = minute + "'";

      while (idx < events.length && events[idx].minute <= minute) {
        const ev = events[idx++];
        if (ev.type === 'goal') {
          el('sa').textContent = ev.scoreA;
          el('sb').textContent = ev.scoreB;
        }
        const line = document.createElement('div');
        line.className = 'cline ' + (ev.type === 'goal' ? 'goal' : 'flavor');
        line.innerHTML = `<b>${ev.minute}'</b> ${esc(ev.text)}`;
        commentary.prepend(line);
      }
      if (minute >= 90) finishMatch();
    }, 220);
  }

  // ---------- Tabela ----------

  function showTable(afterMatch, others) {
    clearLive();
    const rows = E.standings(season).map((t, i) => `
      <tr class="${t.isUser ? 'me' : ''}">
        <td class="pos-col">${i + 1}</td>
        <td class="team-col">${esc(t.name)}</td>
        <td>${t.P}</td><td>${t.W}</td><td>${t.D}</td><td>${t.L}</td>
        <td>${t.GF - t.GA}</td><td class="pts">${t.Pts}</td>
      </tr>`).join('');

    const othersHtml = (others && others.length) ? `
      <div class="others">
        <h3>Outros resultados</h3>
        ${others.map((o) => `<div class="oresult">${esc(o.home)} ${o.sh} x ${o.sa} ${esc(o.away)}</div>`).join('')}
      </div>` : '';

    const finished = E.seasonFinished(season);
    render(`
      <section class="screen table-screen">
        <h2>Classificação</h2>
        <table class="standings">
          <thead><tr><th>#</th><th>Time</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>P</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${othersHtml}
        <button class="btn btn-primary" id="btnContinue">
          ${finished ? 'Ver resultado final' : 'Próxima rodada'}
        </button>
      </section>
    `);
    el('btnContinue').onclick = finished ? showChampion : showRoundIntro;
  }

  // ---------- Campeao (registra titulo + estatisticas) ----------

  async function showChampion() {
    clearLive();
    const table = E.standings(season);
    const champ = table[0];
    const mePos = table.findIndex((t) => t.isUser) + 1;
    const won = champ.isUser;
    const me = season.table[userTeam.name];

    // Registro da temporada:
    //  - MODO NUVEM: ja foi validado/gravado no servidor (startSeason).
    //  - MODO LOCAL: grava agora neste aparelho.
    let saveNote = '';
    if (S.isCloud()) {
      saveNote = seasonRecorded
        ? '✅ Resultado validado e salvo no servidor — conta no ranking global.'
        : seasonNote;
    } else {
      try {
        await S.recordSeason({
          club: representedClub,
          finishPos: mePos,
          isChampion: won,
          wins: me.W, draws: me.D, losses: me.L,
          goalsFor: me.GF, goalsAgainst: me.GA,
          formationId: userTeam.formation.id
        });
        if (won) await S.incrementTeamTitle(representedClub);
        saveNote = 'Estatísticas salvas neste aparelho.';
      } catch (e) {
        saveNote = '⚠️ Não foi possível salvar as estatísticas.';
      }
    }

    render(`
      <section class="screen champion">
        <div class="trophy">${won ? '🏆' : '🎖️'}</div>
        <h2>${won ? 'CAMPEÃO!' : 'Fim de temporada'}</h2>
        <p class="champ-line">
          ${won
            ? `<b>${esc(representedClub)}</b> é o grande campeão do Brasileirão Draft!`
            : `Campeão: <b>${esc(champ.name)}</b>. O ${esc(representedClub)} terminou em <b>${mePos}º</b>.`}
        </p>
        <div class="final-stats">
          <div><b>${me.Pts}</b><span>Pontos</span></div>
          <div><b>${me.W}</b><span>Vitórias</span></div>
          <div><b>${me.GF}</b><span>Gols pró</span></div>
        </div>
        <p class="save-note">${saveNote}</p>
        <button class="btn btn-primary" id="btnRank">Ver ranking de títulos</button>
        <button class="btn btn-ghost" id="btnAgain">Jogar de novo</button>
      </section>
    `);
    el('btnRank').onclick = showRanking;
    el('btnAgain').onclick = showHome;
  }

  // ---------- Ranking global de titulos por time ----------

  async function showRanking() {
    clearLive();
    render(`<section class="screen"><h2>🏆 Ranking de títulos</h2><p class="hint">Carregando...</p></section>`);
    let list = [];
    try { list = await S.getTeamTitleRanking(); } catch (e) { list = []; }

    const body = list.length
      ? `<ol class="rank-list">${list.map((r) => `
          <li><span class="rank-club">${esc(r.club)}</span>
              <span class="rank-count">${r.titles} 🏆</span></li>`).join('')}</ol>`
      : `<p class="hint">Nenhum título registrado ainda. Seja o primeiro a levantar a taça!</p>`;

    const scope = S.isCloud() ? 'Ranking global (todos os jogadores).' : 'Ranking local (apenas este aparelho).';
    render(`
      <section class="screen rank-screen">
        <h2>🏆 Ranking de títulos</h2>
        <p class="hint">${scope}</p>
        ${body}
        <button class="btn btn-primary" id="btnBack">Voltar</button>
      </section>
    `);
    el('btnBack').onclick = showHome;
  }

  // ---------- Conta / perfil ----------

  async function showAccount() {
    clearLive();
    if (S.isCloud()) {
      const user = await S.currentUser().catch(() => null);
      if (user) return renderProfile(await S.getProfile(), user.email);
      return renderAuthForm();
    }
    const profile = await S.getProfile();
    renderProfile(profile, null);
  }

  function statsGrid(stats) {
    const fav = Object.keys(stats.formationUsage).sort(
      (a, b) => stats.formationUsage[b] - stats.formationUsage[a])[0] || '—';
    return `
      <div class="final-stats stats-wrap">
        <div><b>${stats.titles}</b><span>Títulos</span></div>
        <div><b>${stats.seasonsPlayed}</b><span>Temporadas</span></div>
        <div><b>${stats.bestFinish || '—'}</b><span>Melhor pos.</span></div>
        <div><b>${stats.wins}</b><span>Vitórias</span></div>
        <div><b>${stats.draws}</b><span>Empates</span></div>
        <div><b>${stats.losses}</b><span>Derrotas</span></div>
        <div><b>${stats.goalsFor}</b><span>Gols pró</span></div>
        <div><b>${stats.goalsAgainst}</b><span>Gols contra</span></div>
        <div><b>${fav}</b><span>Tática fav.</span></div>
      </div>`;
  }

  function renderProfile(profile, email) {
    const cloud = S.isCloud();
    render(`
      <section class="screen account">
        <h2>👤 ${esc(profile.username || 'Jogador')}</h2>
        <p class="hint">${cloud ? (email ? 'Conectado: ' + esc(email) : '') : 'Modo local (sem nuvem).'}</p>
        ${statsGrid(profile.stats)}
        ${cloud
          ? `<button class="btn btn-ghost" id="btnLogout">Sair da conta</button>`
          : `<div class="namebox">
               <input id="localName" class="inp" placeholder="Seu nome" value="${esc(profile.username || '')}" />
               <button class="btn btn-ghost" id="btnSaveName">Salvar nome</button>
             </div>`}
        <button class="btn btn-primary" id="btnBack">Voltar</button>
      </section>
    `);
    if (cloud) {
      el('btnLogout').onclick = async () => { await S.signOut(); showAccount(); };
    } else {
      el('btnSaveName').onclick = () => { S.setLocalName(el('localName').value || 'Jogador'); showAccount(); };
    }
    el('btnBack').onclick = showHome;
  }

  function renderAuthForm() {
    render(`
      <section class="screen account">
        <h2>Entrar / Criar conta</h2>
        <p class="hint">Use uma conta para salvar suas estatísticas e contar no ranking global.</p>
        <input id="auEmail" class="inp" type="email" placeholder="E-mail" />
        <input id="auPass" class="inp" type="password" placeholder="Senha (mín. 6)" />
        <input id="auName" class="inp" placeholder="Nome de exibição (no cadastro)" />
        <p class="form-msg" id="auMsg"></p>
        <button class="btn btn-primary" id="btnLogin">Entrar</button>
        <button class="btn btn-ghost" id="btnSignup">Criar conta</button>
        <button class="btn btn-ghost" id="btnBack">Voltar</button>
      </section>
    `);
    const msg = (t) => { el('auMsg').textContent = t; };
    el('btnLogin').onclick = async () => {
      try { await S.signIn(el('auEmail').value.trim(), el('auPass').value); showAccount(); }
      catch (e) { msg('Falha ao entrar: ' + (e.message || e)); }
    };
    el('btnSignup').onclick = async () => {
      try {
        await S.signUp(el('auEmail').value.trim(), el('auPass').value, el('auName').value.trim());
        msg('Conta criada! Se for pedida confirmação por e-mail, confirme e entre.');
      } catch (e) { msg('Falha no cadastro: ' + (e.message || e)); }
    };
    el('btnBack').onclick = showHome;
  }

  // ---------- util ----------

  function clearLive() {
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  }

  function init() {
    app = el('app');
    Promise.resolve(S.init()).finally(showHome);
  }

  global.LFU = global.LFU || {};
  global.LFU.ui = { init };
})(typeof window !== 'undefined' ? window : globalThis);
