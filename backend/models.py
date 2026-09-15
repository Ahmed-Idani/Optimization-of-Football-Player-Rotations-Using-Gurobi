import csv
import json
from pathlib import Path

from config import db
from sqlalchemy import text

# football-data.org reports short names ("Man City") that differ from the
# names the hand-written squads below were written against. Map the old names
# onto the API's so a club doesn't get seeded twice.
TEAM_ALIASES = {
    "ManchesterCity": "Man City",
    "ManchesterUnited": "Man United",
}


def canonical_team(name):
    return TEAM_ALIASES.get(name, name)


HERE = Path(__file__).parent
TEAMS_SEED = HERE / "teams_seed.json"
PLAYERS_SCAFFOLD = HERE / "players_scaffold.csv"


class Team(db.Model):
    __tablename__ = 'teams'

    id = db.Column(db.Integer, primary_key=True)
    team_name = db.Column(db.String(100), nullable=False, unique=False)
    logo_url = db.Column(db.String(255), nullable=True)  # Path or URL to the team logo
    players = db.relationship('Player', backref='team', lazy=True)

    def to_json(self):
        return {
            "id": self.id,
            "team_name": self.team_name,
            "logo_url": self.logo_url,
            "players": [player.to_json() for player in self.players]
        }


class Player(db.Model):
    __tablename__ = 'players'

    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    nationality = db.Column(db.String(50), nullable=False)
    potential_goals_per_game = db.Column(db.Float, nullable=False)
    image_path = db.Column(db.String(255), nullable=True)
    physicality = db.Column(db.Integer, nullable=False)  # New attribute
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)

    def to_json(self):
        return {
            "id": self.id,
            "player_name": self.player_name,
            "age": self.age,
            "nationality": self.nationality,
            "potential_goals": self.potential_goals,
            "image_url": self.image_url,
            "physicality": self.physicality,
            "team_id": self.team_id
        }


def clear_database():
    db.session.query(Player).delete()
    db.session.query(Team).delete()
    db.session.commit()

    if db.engine.name == 'sqlite':
        result = db.session.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'")
        )
        if result.fetchone():
            db.session.execute(text("DELETE FROM sqlite_sequence WHERE name='teams'"))
            db.session.execute(text("DELETE FROM sqlite_sequence WHERE name='players'"))
            db.session.commit()

    print("Database cleared and primary keys reset successfully!")


def load_seeded_teams():
    """Clubs fetched from football-data.org by fetch_pl_data.py.

    Crest URLs point at football-data.org's CDN — the artwork is referenced,
    never copied into this repo. Returns {} when the fetch has not been run,
    in which case only the hand-written clubs below are seeded.
    """
    if not TEAMS_SEED.exists():
        return {}

    with TEAMS_SEED.open(encoding="utf-8") as handle:
        return {
            record["team_name"]: record.get("crest", "")
            for record in json.load(handle)
        }


def load_scaffold_players():
    """Players from players_scaffold.csv.

    This is the single source of player data. Rows are skipped unless BOTH
    model inputs have been filled in by hand, so a club with no completed rows
    shows an empty squad rather than being seeded with invented numbers.
    """
    if not PLAYERS_SCAFFOLD.exists():
        return [], 0

    players, skipped = [], 0
    with PLAYERS_SCAFFOLD.open(encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            goals = (row.get("potential_goals_per_game") or "").strip()
            physicality = (row.get("physicality") or "").strip()
            if not goals or not physicality:
                skipped += 1
                continue

            try:
                players.append({
                    "player_name": row["player_name"].strip(),
                    "age": int(row["age"]),
                    "nationality": row["nationality"].strip(),
                    "potential_goals_per_game": float(goals),
                    "physicality": int(physicality),
                    "image_path": (row.get("image_path") or "").strip() or None,
                    "team_name": canonical_team(row["team_name"].strip()),
                })
            except (ValueError, KeyError):
                skipped += 1

    return players, skipped


def populate_database(force=False):
    """Seed the database.

    By default this is a no-op when clubs already exist, so restarting the API
    keeps whatever is in the database. Pass force=True (or run main.py with
    --reseed) to wipe and rebuild after changing the seed files.
    """
    existing = db.session.query(Team).count()
    if existing and not force:
        players = db.session.query(Player).count()
        print(f"Database already seeded: {existing} clubs, {players} players. "
              f"Run with --reseed to rebuild.")
        return

    clear_database()

    seeded_crests = load_seeded_teams()
    scaffold_players, skipped = load_scaffold_players()

    all_players = scaffold_players

    # A club exists on its own merits now, so the grid can show every Premier
    # League side even before anyone has supplied its squad.
    team_names = set(seeded_crests) | {p["team_name"] for p in all_players}

    teams = {}
    for team_name in sorted(team_names):
        crest = seeded_crests.get(team_name)
        teams[team_name] = Team(
            team_name=team_name,
            logo_url=crest or f"/images/teams/nobg/{team_name.replace(' ', '').lower()}.png",
        )

    db.session.add_all(teams.values())
    db.session.commit()

    for player_data in all_players:
        team = teams[player_data["team_name"]]
        db.session.add(Player(
            player_name=player_data["player_name"],
            age=player_data["age"],
            nationality=player_data["nationality"],
            potential_goals_per_game=player_data["potential_goals_per_game"],
            physicality=player_data["physicality"],
            image_path=player_data["image_path"],
            team_id=team.id,
        ))
    db.session.commit()

    with_squads = len({p["team_name"] for p in all_players})
    print(f"Seeded {len(teams)} clubs ({with_squads} with squads), "
          f"{len(all_players)} players.")
    if skipped:
        print(f"  {skipped} scaffold rows skipped — goals/game or physicality blank.")
