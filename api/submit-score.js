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

    const cleanScore = Math.max(0, Math.min(999999999, Number(score) || 0));
    const cleanDistance = Math.max(0, Math.min(9999999, Number(distance) || 0));
    const cleanCharacter = String(character || "unknown")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .slice(0, 20);

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Leaderboard env vars missing" });
    }

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rainbow_rampage_scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        player_name: cleanName,
        score: cleanScore,
        distance: cleanDistance,
        character: cleanCharacter
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Supabase insert failed", details: data });
    }

    return res.status(200).json({ ok: true, saved: data[0] || null });
  } catch (err) {
    return res.status(500).json({ error: "Submit failed", details: String(err) });
  }
}
