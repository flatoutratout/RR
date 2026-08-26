export default async function handler(req, res) {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Leaderboard env vars missing" });
    }

    const url = `${process.env.SUPABASE_URL}/rest/v1/rainbow_rampage_scores?select=player_name,score,distance,character,created_at&order=score.desc&order=distance.desc&limit=10`;

    const response = await fetch(url, {
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "Supabase fetch failed", details: data });
    }

    return res.status(200).json({ scores: data });
  } catch (err) {
    return res.status(500).json({ error: "Leaderboard fetch failed", details: String(err) });
  }
}
