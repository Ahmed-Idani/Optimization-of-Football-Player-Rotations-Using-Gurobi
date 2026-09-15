import "./Player.css";
import { cardName, flagFor, tier } from "../../lib/playerRatings.js";

const Stat = ({ label, value }) => (
  <div className="fut-card__stat">
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

export const Player = ({ player = {}, clubBadge }) => {
  const physicality = player.physicality ?? 1;
  const goals = player.potential_goals_per_game ?? 0;

  return (
    <article
      className={`fut-card fut-card--${tier(physicality)}`}
      aria-label={`${player.player_name}, ${goals} goals per game`}
    >
      <div className="fut-card__inner">
        <div className="fut-card__head">
          <div className="fut-card__id">
            <span className="fut-card__ovr">{goals}</span>
            <span className="fut-card__pos">G/G</span>
            <span className="fut-card__rule" aria-hidden="true" />
            <span className="fut-card__flag" title={player.nationality}>
              {flagFor(player.nationality)}
            </span>
            {clubBadge && (
              <img className="fut-card__badge" src={clubBadge} alt="" />
            )}
          </div>

          {player.image_path && (
            <img
              className="fut-card__portrait"
              src={player.image_path}
              alt={player.player_name}
              loading="lazy"
            />
          )}
        </div>

        <div className="fut-card__body">
          <h3 className="fut-card__name">{cardName(player.player_name)}</h3>

          <dl className="fut-card__stats">
            <Stat label="GOALS/G" value={goals} />
            <Stat label="PHY" value={physicality} />
            <Stat label="AGE" value={player.age} />
          </dl>

          <p className="fut-card__note">
            Rests after <strong>{physicality}</strong>{" "}
            {physicality === 1 ? "match" : "matches"}
          </p>
        </div>
      </div>
    </article>
  );
};
