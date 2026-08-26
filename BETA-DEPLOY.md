# Rainbow Rampage Beta Site

This package merges the current public website with the selected RR game build.

- Website remains at `/`
- Playable beta is at `/play/`
- Game leaderboard endpoints are at `/api/leaderboard` and `/api/submit-score`
- The game still runs if the leaderboard environment variables are not configured.

For the leaderboard, Vercel needs:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The Supabase table SQL is included as `supabase-schema.sql`.
