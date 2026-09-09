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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Scores are stored as JSON members in a Redis sorted set, ranked by score.
    const result = await redis(["ZRANGE", "rainbow_rampage:leaderboard", "+inf", "-inf", "BYSCORE", "REV", "LIMIT", "0", "10"]);
    const scores = (Array.isArray(result) ? result : []).map(member => {
      try { return JSON.parse(member); } catch (_) { return null; }
    }).filter(Boolean);

    return res.status(200).json({ scores });
  } catch (err) {
    return res.status(500).json({ error: "Leaderboard fetch failed", details: String(err) });
  }
}
