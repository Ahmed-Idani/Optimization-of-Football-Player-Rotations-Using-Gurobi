import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import "../../styles/street.css";

const DIFFICULTIES = [
  { value: 0.5, label: "Easy", colour: "var(--color-spray-acid)" },
  { value: 1.0, label: "Medium", colour: "var(--color-spray-orange)" },
  { value: 1.5, label: "Hard", colour: "var(--color-spray-magenta)" },
];
const difficultyOf = (value) => DIFFICULTIES.find((d) => d.value === value);

const TABS = [
  { id: "grid", label: "Rotation" },
  { id: "workload", label: "Workload" },
  { id: "lineups", label: "Lineups" },
];

export const Results = () => {
  const { team_name } = useParams();
  const { state } = useLocation();
  const [tab, setTab] = useState("grid");

  const result = state?.result;
  const fixtures = state?.fixtures ?? [];

  // Results arrive via navigation state, so a hard refresh has nothing to show.
  if (!result) {
    return (
      <div className="st">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="st-piece text-[clamp(2.5rem,9vw,5rem)]">No results</h1>
          <p className="mt-6 text-xl text-paper/60">
            Results live for one visit only. Run the optimiser again.
          </p>
          <Link to={`/setup/${team_name}`} className="st-slab mt-8 inline-block text-xl">
            Back to setup
          </Link>
        </div>
      </div>
    );
  }

  const { lineups = [], player_statistics: stats = [], total_goals: total = 0 } = result;
  const mostMatches = Math.max(1, ...stats.map((s) => s.matches_played));
  const rested = stats.filter((s) => s.matches_played === 0).length;

  const figures = [
    { label: "Goals", value: total.toFixed(1) },
    { label: "Matches", value: lineups.length },
    { label: "Per match", value: lineups.length ? (total / lineups.length).toFixed(2) : "n/a" },
    { label: "Unused", value: rested },
  ];

  return (
    <div className="st">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-8">
        <header className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link to={`/setup/${team_name}`} className="st-stencil hover:text-paper">
              ← Setup
            </Link>
            <Link to="/" className="st-stencil opacity-60 hover:text-paper">
              Teams
            </Link>
          </div>

          <h1 className="st-piece text-[clamp(2.6rem,11vw,6rem)]">Rotation</h1>
          <div className="st-tape mt-4" />
          <p className="mt-3 text-2xl tracking-wide text-paper/70">{team_name}</p>
        </header>

        {/* headline numbers, generous spacing */}
        <section className="grid grid-cols-2 gap-px bg-paper/10 sm:grid-cols-4">
          {figures.map((f) => (
            <div key={f.label} className="bg-concrete-900 px-4 py-7 text-center">
              <div className="st-figure">{f.value}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.28em] text-paper/45">
                {f.label}
              </div>
            </div>
          ))}
        </section>

        {/* one section at a time keeps the page calm */}
        <nav className="mt-10 flex gap-3" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className="st-cap"
              style={{ "--spray": "var(--color-spray-acid)" }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === "grid" && <RotationGrid lineups={lineups} stats={stats} />}
          {tab === "workload" && <Workload stats={stats} most={mostMatches} />}
          {tab === "lineups" && <Lineups lineups={lineups} fixtures={fixtures} />}
        </div>
      </div>
    </div>
  );
};

const RotationGrid = ({ lineups, stats }) => (
  <section className="st-paste p-6">
    <p className="mb-6 text-base text-paper/55">
      Acid green marks a start. Gaps are enforced rest.
    </p>
    <div className="overflow-x-auto">
      <table className="st-sheet">
        <thead>
          <tr>
            <th className="st-name text-left">Player</th>
            {lineups.map((l) => (
              <th key={l.match} title={l.opponent} className="px-2">
                {String(l.match).padStart(2, "0")}
              </th>
            ))}
            <th className="px-3 text-right">Apps</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.player}>
              <td className="st-name">{s.player}</td>
              {lineups.map((l) => (
                <td key={l.match} className="px-2 py-2.5 text-center">
                  <span
                    className={`st-pip ${l.players.includes(s.player) ? "st-pip--on" : ""}`}
                    aria-label={l.players.includes(s.player) ? "Starts" : "Rested"}
                  />
                </td>
              ))}
              <td className="px-3 text-right font-[family-name:var(--font-display)] text-xl text-spray-acid">
                {s.matches_played}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const Workload = ({ stats, most }) => (
  <section className="st-paste p-6">
    <ul className="space-y-5">
      {[...stats]
        .sort((a, b) => b.matches_played - a.matches_played)
        .map((s) => (
          <li key={s.player} className="flex items-center gap-4">
            <span className="w-44 shrink-0 truncate text-lg uppercase tracking-wide text-paper/85">
              {s.player}
            </span>
            <span className="st-meter">
              <span
                className="st-meter__fill block"
                style={{ width: `${(s.matches_played / most) * 100}%` }}
              />
            </span>
            <span className="w-10 shrink-0 text-right font-[family-name:var(--font-display)] text-xl">
              {s.matches_played}
            </span>
          </li>
        ))}
    </ul>
  </section>
);

const Lineups = ({ lineups, fixtures }) => (
  <div className="grid gap-5 sm:grid-cols-2">
    {lineups.map((l, i) => {
      const d = difficultyOf(fixtures[i]?.difficulty);
      return (
        <article key={l.match} className="st-paste p-6">
          <div className="flex items-baseline justify-between">
            <span className="font-[family-name:var(--font-display)] text-3xl text-paper/25">
              {String(l.match).padStart(2, "0")}
            </span>
            {d && (
              <span
                className="text-xs uppercase tracking-[0.2em]"
                style={{ color: d.colour }}
              >
                {d.label}
              </span>
            )}
          </div>
          <h3 className="st-shout mt-1 mb-5 text-2xl">{l.opponent}</h3>
          <ul className="mb-5 space-y-2">
            {l.players.map((p) => (
              <li
                key={p}
                className="border-l-2 border-spray-acid/60 pl-3 text-lg uppercase tracking-wide text-paper/90"
              >
                {p}
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-paper/12 pt-3">
            <span className="text-xs uppercase tracking-[0.22em] text-paper/45">
              Expected
            </span>
            <span className="font-[family-name:var(--font-display)] text-2xl text-spray-acid">
              {l.goals.toFixed(2)}
            </span>
          </div>
        </article>
      );
    })}
  </div>
);
