/**
 * Queries a Minecraft Java server's status via the mcstatus.io public API.
 * Never throws — on any failure it resolves as offline with 0 players,
 * matching the "offline + zero count" behavior requested for sub-servers.
 */
async function queryJava(host, port = 25565) {
  if (!host) {
    return { online: false, players: 0, maxPlayers: 0 };
  }

  try {
    const res = await fetch(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(host)}:${port}`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (!data.online) {
      return { online: false, players: 0, maxPlayers: 0 };
    }

    return {
      online: true,
      players: data.players?.online ?? 0,
      maxPlayers: data.players?.max ?? 0
    };
  } catch (err) {
    console.error(`[mcstatus] Query failed for ${host}:${port} — ${err.message}`);
    return { online: false, players: 0, maxPlayers: 0 };
  }
}

module.exports = { queryJava };
