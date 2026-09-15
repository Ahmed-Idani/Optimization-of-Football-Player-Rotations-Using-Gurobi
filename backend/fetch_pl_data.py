"""
One-off fetch of Premier League teams from football-data.org.

Writes two files next to this script:

  teams_seed.json      — every PL club, pointing at the crest file saved under
                         frontend/public/images/teams/nobg/.
  players_scaffold.csv — the attacking players of each club, with the factual
                         columns (name, age, nationality) already filled in and
                         the two model inputs left blank for a human to supply.

Usage:
    export FOOTBALL_API_KEY=your-free-key      # football-data.org/client/register
    python fetch_pl_data.py

Crest images are downloaded once into the frontend's public folder, so the
running app never talks to football-data.org — it only serves local files.

The free tier allows 10 requests/minute, so this throttles and takes ~2.5
minutes for the 20 clubs. Re-running overwrites both files and re-downloads
any crest that is missing.
"""

import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime
from pathlib import Path

API_ROOT = "https://api.football-data.org/v4"
COMPETITION = "PL"
HERE = Path(__file__).parent
TEAMS_FILE = HERE / "teams_seed.json"
PLAYERS_FILE = HERE / "players_scaffold.csv"
CREST_DIR = HERE.parent / "frontend" / "public" / "images" / "teams" / "nobg"

# Free tier: 10 requests per minute.
THROTTLE_SECONDS = 7
ATTACKERS_PER_TEAM = 6

# v4 reports either a broad area or a specific role; both shapes appear.
ATTACKING = ("offence", "forward", "winger", "striker", "attack")


def get(path, token):
    request = urllib.request.Request(
        f"{API_ROOT}{path}", headers={"X-Auth-Token": token}
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def slugify(team_name):
    """Matches the naming the app already uses for local crests."""
    return "".join(ch for ch in team_name.lower() if ch.isalnum())


def download_crest(url, team_name):
    """Save a crest locally and return its public path, or "" on failure."""
    if not url:
        return ""

    suffix = ".svg" if url.lower().endswith(".svg") else ".png"
    target = CREST_DIR / f"{slugify(team_name)}{suffix}"
    public_path = f"/images/teams/nobg/{target.name}"

    if target.exists() and target.stat().st_size > 0:
        return public_path

    try:
        request = urllib.request.Request(url, headers={"User-Agent": "rotation-seed"})
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read()
    except (urllib.error.URLError, TimeoutError):
        return ""

    CREST_DIR.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return public_path


def age_from(dob):
    if not dob:
        return ""
    born = datetime.strptime(dob, "%Y-%m-%d").date()
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))


def is_attacker(player):
    position = (player.get("position") or "").lower()
    return any(word in position for word in ATTACKING)


def main():
    token = os.environ.get("FOOTBALL_API_KEY", "").strip()
    if not token:
        sys.exit(
            "FOOTBALL_API_KEY is not set.\n"
            "Get a free key at https://www.football-data.org/client/register "
            "then re-run:\n"
            "    FOOTBALL_API_KEY=xxx python fetch_pl_data.py"
        )

    print(f"Fetching {COMPETITION} teams…")
    try:
        listing = get(f"/competitions/{COMPETITION}/teams", token)
    except urllib.error.HTTPError as exc:
        sys.exit(f"Could not list teams: HTTP {exc.code} {exc.reason}")

    teams = listing.get("teams", [])
    print(f"  {len(teams)} clubs")

    records = []
    rows = []

    for index, team in enumerate(teams, start=1):
        team_name = team.get("shortName") or team["name"]
        record = {
            "id": team["id"],
            "team_name": team_name,
            "full_name": team["name"],
            "tla": team.get("tla", ""),
            "crest_source": team.get("crest", ""),
            # Saved locally so the app serves its own files.
            "crest": download_crest(team.get("crest", ""), team_name),
        }
        records.append(record)

        print(f"  [{index}/{len(teams)}] {record['team_name']}", end=" ", flush=True)
        try:
            detail = get(f"/teams/{team['id']}", token)
        except urllib.error.HTTPError as exc:
            print(f"— squad unavailable (HTTP {exc.code})")
            detail = {}

        squad = [p for p in detail.get("squad", []) if is_attacker(p)]
        squad = squad[:ATTACKERS_PER_TEAM]
        print(f"— {len(squad)} attackers")

        for player in squad:
            rows.append(
                {
                    "team_name": record["team_name"],
                    "player_name": player.get("name", ""),
                    "age": age_from(player.get("dateOfBirth")),
                    "nationality": player.get("nationality", ""),
                    # Left blank on purpose — these are the model's inputs and
                    # are not available from the API. Fill them in by hand.
                    # Any value already present survives a re-run (see below).
                    "potential_goals_per_game": "",
                    "physicality": "",
                    "image_path": "",
                }
            )

        if index < len(teams):
            time.sleep(THROTTLE_SECONDS)

    TEAMS_FILE.write_text(json.dumps(records, indent=2, ensure_ascii=False))
    saved = sum(1 for r in records if r["crest"])
    print(f"\nWrote {TEAMS_FILE.name} ({len(records)} clubs)")
    print(f"Saved {saved}/{len(records)} crests into {CREST_DIR}")

    # Never clobber hand-entered values: carry over anything already recorded
    # for a player still in the squad.
    if PLAYERS_FILE.exists():
        with PLAYERS_FILE.open(encoding="utf-8") as handle:
            previous = {
                (r["team_name"], r["player_name"]): r
                for r in csv.DictReader(handle)
            }
        kept = 0
        for row in rows:
            old = previous.get((row["team_name"], row["player_name"]))
            if not old:
                continue
            for field in ("potential_goals_per_game", "physicality", "image_path"):
                if (old.get(field) or "").strip():
                    row[field] = old[field]
                    kept = 1
        if kept:
            print("Preserved previously entered stats where players remain in squad.")

    with PLAYERS_FILE.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "team_name",
                "player_name",
                "age",
                "nationality",
                "potential_goals_per_game",
                "physicality",
                "image_path",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {PLAYERS_FILE.name} ({len(rows)} players)")
    print(
        "\nNext: fill in potential_goals_per_game (e.g. 0.65) and "
        "physicality (1-3) in\n"
        f"  {PLAYERS_FILE}\n"
        "then reseed:\n"
        "  python main.py --reseed"
    )


if __name__ == "__main__":
    main()
