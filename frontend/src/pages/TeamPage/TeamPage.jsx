import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./TeamPage.css";
import { Player } from "../../components/player/Player.jsx";
import { apiUrl } from "../../lib/api.js";

export const TeamPage = () => {
  const { team_name } = useParams();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [badge, setBadge] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    const fetchPlayers = async () => {
      setStatus("loading");
      try {
        const response = await fetch(
          apiUrl(`api/teams/${encodeURIComponent(team_name)}/players/`),
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (cancelled) return;

        // Most prolific first, using the raw goals/game value.
        setPlayers(
          [...(data.players ?? [])].sort(
            (a, b) => b.potential_goals_per_game - a.potential_goals_per_game,
          ),
        );
        setBadge(data.logo_url ?? null);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    fetchPlayers();
    return () => {
      cancelled = true;
    };
  }, [team_name]);

  return (
    <div className="team-page">
      <header className="team-page__header">
        <Link className="team-page__back" to="/">
          ← Teams
        </Link>

        <div className="team-page__identity">
          {badge && <img className="team-page__badge" src={badge} alt="" />}
          <h1 className="team-page__title">{team_name}</h1>
        </div>

        <button
          className="team-page__cta"
          onClick={() => navigate(`/setup/${team_name}`)}
          disabled={status !== "ready"}
        >
          Plan rotation →
        </button>
      </header>

      {status === "loading" && (
        <div className="team-page__squad" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card-skeleton" />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="team-page__message">
          Couldn’t load this squad. Check the API is reachable.
        </p>
      )}

      {status === "ready" &&
        (players.length > 0 ? (
          <div className="team-page__squad">
            {players.map((player) => (
              <Player key={player.id} player={player} clubBadge={badge} />
            ))}
          </div>
        ) : (
          <p className="team-page__message">No players in this squad yet.</p>
        ))}
    </div>
  );
};
