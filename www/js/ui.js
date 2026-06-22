/*
 * ui.js - Interface e fluxo de telas.
 * Telas: Home -> Draft -> Resumo do time -> Temporada (partida ao vivo +
 * tabela) -> Campeao.
 */
(function (global) {
  'use strict';

  const E = global.LFU.engine;

  const POS_LABEL = { GK: 'GOL', DEF: 'DEF', MID: 'MEI', FWD: 'ATA' };

  const POS_NAME = { GK: 'Goleiro', DEF: 'Defensor', MID: 'Meia', FWD: 'Atacante' };

  let app;        // container raiz
  let draft;      // estado do draft
  let userTeam;   // time montado
  let season;     // estado da temporada
  let liveTimer;  // timer da narracao ao vivo

  function el(id) { return document.getElementById(id); }

  function render(html) {
    app.innerHTML = html;
  }

  // ---------- Home ----------

  function showHome() {
    clearLive();
    render(`
      <section class="screen home">
        <div class="crest">⚽</div>
        <h1>Brasileirão <span>Draft</span></h1>
        <p class="tagline">Monte seu time dos sonhos com craques históricos e
        dispute a temporada.</p>
        <button class="btn btn-primary" id="btnStart">Novo Draft</button>
        <button class="btn btn-ghost" id="btnHow">Como jogar</button>
      </section>
    `);
    el('btnStart').onclick = showFormationSelect;
    el('btnHow').onclick = showHowTo;
  }

  function showHowTo() {
    render(`
      <section class="screen">
        <h2>Como jogar</h2>
        <ol class="howto">
          <li>Você <b>escolhe a formação tática</b> do seu time (4-3-3, 4-4-2...).</li>
          <li>O jogo <b>sorteia um elenco histórico</b> e pede uma <b>posição</b>.</li>
          <li>Você <b>escolhe 1 jogador</b> daquela posição para o seu time.</li>
          <li>Repete até preencher <b>todas as posições</b> da sua tática (11 titulares).</li>
          <li>Com o time pronto, dispute o <b>Brasileirão</b>: partidas
          simuladas com placar ao vivo e narração.</li>
          <li>Termine no topo da tabela e seja <b>campeão!</b></li>
        </ol>
        <button class="btn btn-primary" id="btnBack">Voltar</button>
      </section>
    `);
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
        <h2>Escolha a formação</h2>
        <p class="hint">A tática define quais posições o draft vai preencher.</p>
        <div class="formations">${cards}</div>
        <button class="btn btn-ghost" id="btnBack">Voltar</button>
      </section>
    `);

    Array.from(document.querySelectorAll('.formation-card')).forEach((btn) => {
      btn.onclick = () => startDraft(btn.dataset.id);
    });
    el('btnBack').onclick = showHome;
  }

  // ---------- Draft ----------

  function startDraft(formationId) {
    draft = E.newDraft(formationId);
    nextDraftRound();
  }

  function nextDraftRound() {
    if (E.isDraftComplete(draft)) {
      userTeam = E.buildUserTeam(draft, 'Seu Time');
      showSquad();
      return;
    }
    const { squad, selectable, targetPos } = E.drawTeamForDraft(draft);
    const counts = draft.formation.counts;
    const filled = E.filledByPos(draft);

    const slotsHtml = E.POS_ORDER.map((pos) => {
      const total = counts[pos] || 0;
      if (!total) return '';
      const isTarget = pos === targetPos;
      return `<span class="slot ${filled[pos] >= total ? 'full' : ''} ${isTarget ? 'target' : ''}">
        ${POS_LABEL[pos]} ${filled[pos]}/${total}</span>`;
    }).join('');

    const playersHtml = selectable.map((p, i) => `
      <button class="player-card" data-i="${i}">
        <span class="pos pos-${p.pos}">${POS_LABEL[p.pos]}</span>
        <span class="pname">${p.name}</span>
        <span class="rating">${p.rating}</span>
      </button>
    `).join('');

    render(`
      <section class="screen draft">
        <div class="progress">Escolha ${draft.picks.length + 1} de ${draft.slotQueue.length}
          <span class="form-tag">${draft.formation.name}</span></div>
        <div class="slots">${slotsHtml}</div>
        <div class="drawn">
          <span class="drawn-label">Time sorteado</span>
          <h2>${squad.club} <small>${squad.year}</small></h2>
          <p class="hint">Escolha um <b>${POS_NAME[targetPos]}</b> para o seu time:</p>
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
    const order = ['GK', 'DEF', 'MID', 'FWD'];
    const grouped = order.map((pos) => {
      const items = userTeam.players.filter((p) => p.pos === pos).map((p) => `
        <li>
          <span class="pos pos-${p.pos}">${POS_LABEL[p.pos]}</span>
          <span class="pname">${p.name}</span>
          <span class="from">${p.from}</span>
          <span class="rating">${p.rating}</span>
        </li>`).join('');
      return `<ul class="line line-${pos}">${items}</ul>`;
    }).join('');

    render(`
      <section class="screen squad">
        <h2>Seu Time <span class="form-tag">${userTeam.formation.name}</span></h2>
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

  function startSeason() {
    season = E.buildSeason(userTeam, 8);
    showRoundIntro();
  }

  function showRoundIntro() {
    if (E.seasonFinished(season)) {
      showChampion();
      return;
    }
    const fixture = season.fixtures[season.round];
    const userMatch = fixture.find((m) => m[0].isUser || m[1].isUser);
    const opp = userMatch[0].isUser ? userMatch[1] : userMatch[0];

    render(`
      <section class="screen round-intro">
        <div class="round-tag">Rodada ${season.round + 1} de ${season.fixtures.length}</div>
        <h2>Próximo jogo</h2>
        <div class="versus">
          <div class="vteam"><b>${userTeam.name}</b><span>${userTeam.overall}</span></div>
          <div class="vx">×</div>
          <div class="vteam"><b>${opp.name}</b><span>${opp.overall}</span></div>
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
          <div class="sb-team">${home.name}</div>
          <div class="sb-score"><span id="sa">0</span> : <span id="sb">0</span></div>
          <div class="sb-team">${away.name}</div>
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
        line.innerHTML = `<b>${ev.minute}'</b> ${ev.text}`;
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
        <td class="team-col">${t.name}</td>
        <td>${t.P}</td>
        <td>${t.W}</td>
        <td>${t.D}</td>
        <td>${t.L}</td>
        <td>${t.GF - t.GA}</td>
        <td class="pts">${t.Pts}</td>
      </tr>`).join('');

    const othersHtml = (others && others.length) ? `
      <div class="others">
        <h3>Outros resultados</h3>
        ${others.map((o) => `<div class="oresult">${o.home} ${o.sh} x ${o.sa} ${o.away}</div>`).join('')}
      </div>` : '';

    const finished = E.seasonFinished(season);

    render(`
      <section class="screen table-screen">
        <h2>Classificação</h2>
        <table class="standings">
          <thead>
            <tr><th>#</th><th>Time</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>P</th></tr>
          </thead>
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

  // ---------- Campeao ----------

  function showChampion() {
    const table = E.standings(season);
    const champ = table[0];
    const mePos = table.findIndex((t) => t.isUser) + 1;
    const won = champ.isUser;

    render(`
      <section class="screen champion">
        <div class="trophy">${won ? '🏆' : '🎖️'}</div>
        <h2>${won ? 'CAMPEÃO!' : 'Fim de temporada'}</h2>
        <p class="champ-line">
          ${won
            ? 'Seu time venceu o Brasileirão Draft!'
            : `Campeão: <b>${champ.name}</b>. Você terminou em <b>${mePos}º</b> lugar.`}
        </p>
        <div class="final-stats">
          <div><b>${season.table[userTeam.name].Pts}</b><span>Pontos</span></div>
          <div><b>${season.table[userTeam.name].W}</b><span>Vitórias</span></div>
          <div><b>${season.table[userTeam.name].GF}</b><span>Gols pró</span></div>
        </div>
        <button class="btn btn-primary" id="btnAgain">Jogar de novo</button>
      </section>
    `);
    el('btnAgain').onclick = showHome;
  }

  // ---------- util ----------

  function clearLive() {
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  }

  function init() {
    app = el('app');
    showHome();
  }

  global.LFU = global.LFU || {};
  global.LFU.ui = { init };
})(typeof window !== 'undefined' ? window : globalThis);
