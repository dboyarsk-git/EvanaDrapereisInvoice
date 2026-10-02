ONE WAY v57 — MINIMUM 6 TEAMS + NEW FORMAT

MINIMUM TEAM COUNT
- 6 teams is now allowed.

POOL LAYOUTS
- 6 teams = 2 pools of 3
- 7 teams = 2 pools: 4 + 3
- 8 teams = 2 pools: 4 + 4
- 9 teams = 3 pools: 3 + 3 + 3
- 10 teams = 3 pools: 4 + 3 + 3
- 11 teams = 3 pools: 4 + 4 + 3
- 12-16 teams use the existing 4-pool layouts.

For a 3-team pool, each team plays the other two teams twice:
- 6 pool matches total
- 4 pool games per team

For a 4-team pool:
- round robin once
- 6 pool matches total
- 3 pool games per team

POOL SCORING
- One game to 15
- Hard cap at 15
- Auto-lock at 15

BRACKET
- Only 4 teams advance
- With 2 pools (6-8 total teams): top 2 from each pool
- With 3 pools: 3 pool winners + best remaining team
- With 4 pools: each pool winner
- SF1: seed 1 vs seed 4
- SF2: seed 2 vs seed 3
- Final: semifinal winners
- Best 2 out of 3: 25, 25, 15
- Win by 2 remains for bracket sets

IMPORTANT
The SQL includes the v56 scoring/bracket changes too, so you can run the v57
SQL directly instead of running v56 first.

It resets MATCH SCORES because the scoring format changed, but preserves
registrations, team names, pool eligibility information, captain info,
payment/check-in, prizes, and editable settings.

DEPLOY
1. Run supabase_v57_MIN6_AND_NEW_FORMAT_RUN_THIS.sql.
2. Replace live index.html with v57.
3. Reload.
4. Badge should read LIVE BUILD v57 • DB v57.
