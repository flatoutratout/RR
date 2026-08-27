(() => {
  const list = document.querySelector('[data-leaderboard-list]');
  const state = document.querySelector('[data-leaderboard-state]');
  if (!list) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const medals = ['👑', '🥈', '🥉'];

  function render(scores) {
    if (!scores.length) {
      list.innerHTML = '<div class="lb-empty">No scores yet. The throne is empty.</div>';
      if (state) state.textContent = 'WAITING FOR THE FIRST RAMPAGER';
      return;
    }

    list.innerHTML = scores.slice(0, 10).map((row, index) => {
      const name = esc(row.player_name || 'ANON');
      const character = esc((row.character || 'unknown').toUpperCase());
      const score = Number(row.score || 0).toLocaleString('en-GB');
      const distance = Number(row.distance || 0).toLocaleString('en-GB');
      const rank = medals[index] || String(index + 1);
      return `<div class="lb-row${index === 0 ? ' is-king' : ''}">
        <div class="lb-rank">${rank}</div>
        <div class="lb-player"><strong>${name}</strong><small>${character} · ${distance}m</small></div>
        <div class="lb-score">${score}</div>
      </div>`;
    }).join('');

    if (state) state.textContent = 'LIVE TOP 10';
  }

  async function load() {
    try {
      if (state) state.textContent = 'LOADING SCORES…';
      const res = await fetch('/api/leaderboard', { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok || !Array.isArray(body.scores)) throw new Error(body.error || 'Leaderboard unavailable');
      render(body.scores);
    } catch (err) {
      list.innerHTML = '<div class="lb-empty">Leaderboard is warming up.<br><small>Scores will appear here when the backend is connected.</small></div>';
      if (state) state.textContent = 'OFFLINE';
      console.warn('[RR] leaderboard:', err);
    }
  }

  load();
  setInterval(load, 30000);
})();
