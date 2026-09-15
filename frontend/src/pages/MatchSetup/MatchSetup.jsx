import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../../styles/street.css";
import { apiUrl } from "../../lib/api.js";

const MAX_MATCHES = 38;

const DIFFICULTIES = [
  { value: 0.5, label: "Easy", colour: "var(--color-spray-acid)" },
  { value: 1.0, label: "Medium", colour: "var(--color-spray-orange)" },
  { value: 1.5, label: "Hard", colour: "var(--color-spray-magenta)" },
];

const difficultyOf = (value) => DIFFICULTIES.find((d) => d.value === value);

/* Opponents offered by the random fill. Labels only; the solver never sees
   these, it only consumes the difficulty each one carries. */
const OPPONENT_POOL = [
  "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
  "Chelsea", "Crystal Palace", "Everton", "Fulham", "Ipswich",
  "Leicester", "Liverpool", "Manchester City", "Manchester United",
  "Newcastle", "Nottingham Forest", "Southampton", "Tottenham",
  "West Ham", "Wolves",
];

/* "ManchesterCity" and "Manchester City" should count as the same club. */
const normalise = (name) => name.toLowerCase().replace(/[^a-z]/g, "");

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

export const MatchSetup = () => {
  const { team_name } = useParams();
  const navigate = useNavigate();

  const [gamesNumber, setGamesNumber] = useState(5);
  const [opponent, setOpponent] = useState("");
  const [difficulty, setDifficulty] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [formError, setFormError] = useState(null);

  const [submitState, setSubmitState] = useState("idle"); // idle | loading | error
  const [submitError, setSubmitError] = useState(null);

  const remaining = gamesNumber - fixtures.length;
  const complete = remaining === 0 && gamesNumber > 0;

  const changeGamesNumber = (raw) => {
    const parsed = parseInt(raw, 10);
    const next = Number.isNaN(parsed)
      ? 1
      : Math.min(MAX_MATCHES, Math.max(1, parsed));
    setGamesNumber(next);
    setFixtures((prev) => prev.slice(0, next));
    setFormError(null);
  };

  const addFixture = () => {
    if (!opponent.trim()) return setFormError("Name the opposition.");
    if (difficulty === null) return setFormError("Stamp a difficulty.");
    if (remaining <= 0) return setFormError("The card is full.");

    setFixtures((prev) => [...prev, { opponent: opponent.trim(), difficulty }]);
    setOpponent("");
    setDifficulty(null);
    setFormError(null);
  };

  /* Fill every unnamed slot at once. Clubs are drawn without replacement so a
     run has no immediate repeats; once the pool is exhausted it refills, which
     mirrors a real season playing each opponent home and away. */
  const randomFill = () => {
    const ownTeam = normalise(team_name);
    const used = new Set(fixtures.map((f) => normalise(f.opponent)));
    let available = OPPONENT_POOL.filter(
      (name) => normalise(name) !== ownTeam && !used.has(normalise(name)),
    );

    const additions = [];
    for (let i = 0; i < remaining; i += 1) {
      if (available.length === 0) {
        available = OPPONENT_POOL.filter((n) => normalise(n) !== ownTeam);
      }
      const name = pickRandom(available);
      available = available.filter((n) => n !== name);
      additions.push({ opponent: name, difficulty: pickRandom(DIFFICULTIES).value });
    }

    setFixtures((prev) => [...prev, ...additions]);
    setFormError(null);
  };

  const clearFixtures = () => {
    setFixtures([]);
    setFormError(null);
  };

  const removeFixture = (index) => {
    setFixtures((prev) => prev.filter((_, i) => i !== index));
    setFormError(null);
  };

  const submit = async () => {
    if (!complete) {
      return setFormError(
        `${remaining} ${remaining === 1 ? "fixture" : "fixtures"} still to name.`,
      );
    }

    setSubmitState("loading");
    setFormError(null);
    setSubmitError(null);

    const payload = {
      numberMatches: gamesNumber,
      matchesChosen: Object.fromEntries(fixtures.map((f, i) => [String(i), f])),
    };

    try {
      const response = await fetch(
        apiUrl(`api/optimise/${encodeURIComponent(team_name)}/`),
        {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSubmitState("idle");
      // Results live on their own page now, see pages/Results.
      navigate(`/results/${encodeURIComponent(team_name)}`, {
        state: { result: data, fixtures },
      });
    } catch (error) {
      // "No optimal solution found" usually means the squad is smaller than
      // the three starters every match needs, so say that rather than blaming the
      // connection.
      const message =
        error instanceof TypeError
          ? "Can't reach the solver. Check the API is running."
          : /no optimal solution/i.test(error.message)
            ? "No valid rotation exists. This squad needs at least 3 players with goals/game and physicality filled in."
            : error.message;
      setSubmitError(message);
      setSubmitState("error");
    }
  };

  return (
    <div className="st">
      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-8">
        {/* ============ masthead ============ */}
        <header className="mb-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link
              to={`/teams/${team_name}`}
              className="st-stencil transition hover:text-paper"
            >
              ← Squad
            </Link>
            <span className="st-stencil opacity-60">Rotation planner</span>
          </div>

          <h1 className="st-piece text-[clamp(3rem,13vw,7.5rem)]">
            Match
            <br />
            Setup
          </h1>

          <div className="st-tape mt-4" />

          <p className="mt-3 font-[family-name:var(--font-data)] text-2xl tracking-wide text-paper/70">
            {team_name}
          </p>
        </header>

        {/* ============ the sheet ============ */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* left: match count */}
          <section className="st-paste  p-6 lg:col-span-4">
            <h2 className="st-stencil mb-4">01 / Fixtures to plan</h2>

            <input
              id="games_number"
              type="number"
              min="1"
              max={MAX_MATCHES}
              value={gamesNumber}
              onChange={(e) => changeGamesNumber(e.target.value)}
              aria-label="Number of matches to plan"
              className="st-count"
            />

            <div className="mt-5 flex items-baseline justify-between border-t border-paper/15 pt-3 text-sm uppercase tracking-[0.2em] text-paper/55">
              <span>{fixtures.length} named</span>
              <span className={remaining === 0 ? "text-spray-acid" : undefined}>
                {remaining > 0 ? `${remaining} left` : "Complete"}
              </span>
            </div>
          </section>

          {/* right: fixture entry */}
          <section className="st-paste p-6 lg:col-span-8">
            <h2 className="st-stencil mb-5">02 / Name the opposition</h2>

            <label
              htmlFor="opponent"
              className="mb-1 block text-xs uppercase tracking-[0.24em] text-paper/45"
            >
              Opponent
            </label>
            <input
              id="opponent"
              type="text"
              value={opponent}
              placeholder="ARSENAL"
              onChange={(e) => setOpponent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFixture()}
              className="st-ruled uppercase"
            />

            <span className="mt-6 mb-2 block text-xs uppercase tracking-[0.24em] text-paper/45">
              Difficulty
            </span>
            <div className="flex flex-wrap gap-3" role="group" aria-label="Difficulty">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={difficulty === d.value}
                  onClick={() => {
                    setDifficulty(d.value);
                    setFormError(null);
                  }}
                  className="st-cap"
                  style={{ "--spray": d.colour }}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={addFixture}
                disabled={remaining <= 0}
                className="st-slab text-xl"
              >
                {remaining > 0 ? "Add fixture" : "Card full"}
              </button>

              <button
                type="button"
                onClick={randomFill}
                disabled={remaining <= 0}
                className="st-slab st-slab--dice text-xl"
                title={`Fill the remaining ${remaining} at random`}
              >
                <span aria-hidden="true">⚄</span> Random fill
              </button>

              {fixtures.length > 0 && (
                <button
                  type="button"
                  onClick={clearFixtures}
                  className="st-wipe"
                >
                  Clear
                </button>
              )}

              {formError && (
                <p
                  role="alert"
                  className="font-[family-name:var(--font-data)] text-lg uppercase tracking-wide text-spray-magenta"
                >
                  {formError}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* ============ tickets ============ */}
        <section className="mt-8">
          <h2 className="st-stencil mb-4">03 / The card</h2>

          {fixtures.length === 0 ? (
            <p className="border border-dashed border-paper/15 py-10 text-center text-lg uppercase tracking-[0.2em] text-paper/30">
              No fixtures named yet
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {fixtures.map((fixture, index) => {
                const d = difficultyOf(fixture.difficulty);
                return (
                  <li
                    key={`${fixture.opponent}-${index}`}
                    className="st-sticker"
                    style={{
                      "--spray": d?.colour,
                      "--tilt": `${(index % 3) - 1}deg`,
                      animationDelay: `${index * 40}ms`,
                    }}
                  >
                    <span className="st-sticker__no">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex flex-col justify-center leading-tight">
                      <span className="text-lg font-semibold uppercase tracking-wide">
                        {fixture.opponent}
                      </span>
                      <span
                        className="text-xs uppercase tracking-[0.2em]"
                        style={{ color: d?.colour }}
                      >
                        {d?.label}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFixture(index)}
                      aria-label={`Remove ${fixture.opponent}`}
                      className="st-sticker__x"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={submitState === "loading"}
            className="st-slab st-slab--go mt-6"
          >
            {submitState === "loading" ? "Solving…" : "Optimise rotation"}
          </button>

          {submitState === "error" && (
            <p
              role="alert"
              className="mt-3 border-l-4 border-spray-magenta bg-spray-magenta/10 px-4 py-2 text-lg uppercase tracking-wide text-spray-magenta"
            >
              {submitError}
            </p>
          )}
        </section>
      </div>
    </div>
  );
};
