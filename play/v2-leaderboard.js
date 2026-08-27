// V2 game-over / leaderboard presentation.
// Replaces the browser prompt with a proper in-game-styled HTML overlay while
// preserving the existing Vercel/Supabase endpoints and score data.
(function () {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function rowsHtml(rows) {
    if (!Array.isArray(rows) || !rows.length) return '<div class="rr-v2-status">No global scores yet. Take the throne.</div>';
    return rows.slice(0, 10).map((r, i) => {
      const rank = i === 0 ? '👑' : (i + 1);
      const name = esc(r.player_name || 'ANON');
      const charName = esc((r.character || 'UNKNOWN').toUpperCase());
      const dist = Number(r.distance || 0).toLocaleString('en-GB');
      const points = Number(r.score || 0).toLocaleString('en-GB');
      return `<div class="rr-v2-lb-row${i === 0 ? ' king' : ''}">
        <div class="rr-v2-lb-rank">${rank}</div>
        <div class="rr-v2-lb-name"><strong>${name}</strong><small>${charName} · ${dist}m</small></div>
        <div class="rr-v2-lb-score">${points}</div>
      </div>`;
    }).join('');
  }

  function removeExisting() {
    document.querySelectorAll('.rr-v2-score-modal').forEach(el => el.remove());
  }

  async function fetchBoard(boardEl, statusEl) {
    try {
      statusEl.textContent = 'LIVE TOP 10';
      const res = await fetch('/api/leaderboard', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.scores)) throw new Error(data.error || 'Leaderboard unavailable');
      boardEl.innerHTML = rowsHtml(data.scores);
      return true;
    } catch (err) {
      statusEl.textContent = 'OFFLINE';
      boardEl.innerHTML = '<div class="rr-v2-status">Leaderboard is not connected on this deployment yet.</div>';
      return false;
    }
  }

  submitScoreAndShowLeaderboard = function submitScoreAndShowLeaderboardV2(scene) {
    const finalScore = Number(score || 0);
    const finalDistance = Math.floor(player.x / 10);
    const finalCharacter = characterStats[selectedCharacter].name;
    const savedName = localStorage.getItem('rr_player_name') || '';

    removeExisting();
    const modal = document.createElement('div');
    modal.className = 'rr-v2-score-modal';
    modal.innerHTML = `<div class="rr-v2-score-card">
      <div class="rr-v2-score-summary">
        <div class="rr-v2-stat"><small>SCORE</small><strong>${finalScore.toLocaleString('en-GB')}</strong></div>
        <div class="rr-v2-stat"><small>DISTANCE</small><strong>${finalDistance.toLocaleString('en-GB')}m</strong></div>
        <div class="rr-v2-stat"><small>RAMPAGER</small><strong>${esc(finalCharacter)}</strong></div>
      </div>
      <div class="rr-v2-name-row">
        <input maxlength="16" autocomplete="nickname" inputmode="text" aria-label="Leaderboard name" placeholder="ENTER YOUR NAME" value="${esc(savedName)}" />
        <button type="button" class="rr-v2-submit">SUBMIT SCORE</button>
      </div>
      <div class="rr-v2-score-error" hidden></div>
      <div class="rr-v2-lb-title"><strong>🏆 GLOBAL TOP 10</strong><span data-v2-lb-status>LOADING…</span></div>
      <div class="rr-v2-lb"><div class="rr-v2-status">Loading the chaos…</div></div>
      <div class="rr-v2-actions">
        <button type="button" class="rr-v2-restart">↻ RAMPAGE AGAIN</button>
        <a class="rr-v2-home" href="/">← HOME</a>
      </div>
    </div>`;
    document.body.appendChild(modal);

    const input = modal.querySelector('input');
    const submit = modal.querySelector('.rr-v2-submit');
    const restart = modal.querySelector('.rr-v2-restart');
    const board = modal.querySelector('.rr-v2-lb');
    const status = modal.querySelector('[data-v2-lb-status]');
    const error = modal.querySelector('.rr-v2-score-error');

    restart.addEventListener('click', () => location.reload());
    fetchBoard(board, status);

    submit.addEventListener('click', async () => {
      const playerName = String(input.value || 'ANON').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 16) || 'ANON';
      input.value = playerName;
      localStorage.setItem('rr_player_name', playerName);
      submit.disabled = true;
      submit.textContent = 'SUBMITTING…';
      error.hidden = true;

      try {
        const res = await fetch('/api/submit-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player_name: playerName,
            score: finalScore,
            distance: finalDistance,
            character: finalCharacter
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Score submission failed');
        submit.textContent = '✓ SCORE SAVED';
        await fetchBoard(board, status);
      } catch (err) {
        submit.disabled = false;
        submit.textContent = 'TRY AGAIN';
        error.textContent = 'Could not save that score on this deployment.';
        error.hidden = false;
      }
    });
  };
})();
