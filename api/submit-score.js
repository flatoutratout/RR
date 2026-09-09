const KV_URL = () => process.env.KV_REST_API_URL;
const KV_TOKEN = () => process.env.KV_REST_API_TOKEN;

async function redis(command) {
  const url = KV_URL();
  const token = KV_TOKEN();
  if (!url || !token) throw new Error("Upstash Redis env vars missing");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || `Redis request failed (${response.status})`);
  return data.result;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { player_name, score, distance, character } = req.body || {};

    const cleanName = String(player_name || "ANON")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim()
      .slice(0, 16) || "ANON";

    const cleanScore = Math.max(0, Math.min(999999999, Math.floor(Number(score) || 0)));
    const cleanDistance = Math.max(0, Math.min(9999999, Math.floor(Number(distance) || 0)));
    const cleanCharacter = String(character || "unknown")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .slice(0, 20);

    const saved = {
      player_name: cleanName,
      score: cleanScore,
      distance: cleanDistance,
      character: cleanCharacter,
      created_at: new Date().toISOString()
    };

    // Add a tiny unique id to the member so identical runs are still separate entries.
    const member = JSON.stringify({ ...saved, id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` });
    await redis(["ZADD", "rainbow_rampage:leaderboard", String(cleanScore), member]);

    // Keep the database tiny: retain only the best 1000 scores.
    await redis(["ZREMRANGEBYRANK", "rainbow_rampage:leaderboard", "0", "-1001"]);

    return res.status(200).json({ ok: true, saved });
  } catch (err) {
    return res.status(500).json({ error: "Submit failed", details: String(err) });
  }
}
