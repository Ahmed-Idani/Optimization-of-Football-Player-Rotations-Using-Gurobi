import sys

from flask import request, jsonify
from models import Team, Player ,populate_database
from config import app, db
from urllib.parse import unquote
from BackendLogica import bestThree
@app.route('/api/teams/', methods=["GET"])
def show_teams():
    teams = Team.query.with_entities(Team.id, Team.team_name, Team.logo_url).all()
    if not teams:
        return jsonify({"message": "No teams found"}), 404

    json_teams = [
        {"id": team.id, "team_name": team.team_name, "logo_path": team.logo_url}
        for team in teams
    ]
    print("Teams JSON response:", json_teams)  # Debugging
    return jsonify({"teams": json_teams}), 200


@app.route('/api/teams/<string:team_name>/players/', methods=["GET"])
def show_players_for_team(team_name):
    # Get the team by name
    team = Team.query.filter_by(team_name=team_name).first()

    if not team:
        return jsonify({"message": f"Team '{team_name}' not found"}), 404

    players_json = [
        {
            "id": player.id,
            "player_name": player.player_name,
            "age": player.age,
            "nationality": player.nationality,
            "potential_goals_per_game": player.potential_goals_per_game,
            "physicality": player.physicality,
            "image_path": player.image_path
        }
        for player in team.players
    ]
    return jsonify({
        "team_id": team.id,
        "team_name": team.team_name,
        "logo_url": team.logo_url,
        "players": players_json
    }), 200
@app.route("/api/optimise/<string:team_name>/", methods=["POST"])
def optimise(team_name):
    number_of_games = request.json.get("numberMatches")
    matches_chosen = request.json.get("matchesChosen")

    # Validate input
    if not number_of_games or not matches_chosen:
        return jsonify({"message": "numberMatches and matchesChosen are required"}), 400

    if not isinstance(matches_chosen, dict):
        return jsonify({"message": "matchesChosen must be a dictionary"}), 400

    # Extract difficulty list
    try:
        difficulty_list = [value["difficulty"] for key, value in matches_chosen.items()]
        oponents_list = [value["opponent"] for key,value in matches_chosen.items()]
    except KeyError:
        return jsonify({"message": "Each match must have a 'difficulty' and 'oponent'field"}), 400

    # Fetch team
    team = Team.query.filter_by(team_name=team_name).first()
    if not team:
        return jsonify({"message": f"Team '{team_name}' not found"}), 404

    # Get players' physicality and goals
    players = team.players
    physicality_list = [player.physicality for player in players]
    goals_list = [player.potential_goals_per_game for player in players]
    players_names_list = [player.player_name for player in players]

    # Call optimisation logic
    result = bestThree(number_of_games, difficulty_list, physicality_list, goals_list,players_names_list,oponents_list )
    return result, 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Only seeds when the database is empty, so restarting the API no
        # longer wipes and rebuilds every table. Pass --reseed to force it.
        populate_database(force="--reseed" in sys.argv)
    app.run(debug=True)
