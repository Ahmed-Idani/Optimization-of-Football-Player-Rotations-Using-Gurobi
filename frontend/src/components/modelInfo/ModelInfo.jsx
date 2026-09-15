import { useEffect, useRef, useState } from "react";
import "./ModelInfo.css";

/* Notation used throughout the maths panel. Kept as a component so the symbols
   stay consistent between the prose and the formulae. */
const V = ({ children, sub }) => (
  <span className="mi-var">
    {children}
    {sub && <sub>{sub}</sub>}
  </span>
);

const Dialog = ({ eyebrow, title, onClose, children, footer }) => {
  const panel = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="mi-backdrop" onClick={onClose}>
      <div
        className="mi-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panel}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mi-head">
          <div>
            <p className="mi-eyebrow">{eyebrow}</p>
            <h2 className="mi-title">{title}</h2>
          </div>
          <button
            type="button"
            className="mi-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="mi-body">{children}</div>
        {footer && <footer className="mi-foot">{footer}</footer>}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */

const WhyDialog = ({ onClose }) => (
  <Dialog eyebrow="The motivation" title="Why I Built It" onClose={onClose}>
    <section>
      <h3>What it does</h3>
      <p>
        This tool optimises the <strong>attacking line</strong>, meaning the
        three players a manager fields furthest forward, across a run of
        fixtures. It gives a manager a starting three for every match at once,
        chosen so the squad scores as much as possible without running its best
        players into the ground.
      </p>
      <p>
        Defenders and keepers rotate comparatively little. Attackers are where
        the trade off between output now and freshness later actually bites, and
        where most managers still decide by feel.
      </p>
    </section>

    <section>
      <h3>What the season data shows</h3>
      <p>
        The figures below are computed from the completed{" "}
        <strong>2025-26 Premier League season</strong>, taken from
        football-data.org, the same source the squads in this app come from.
      </p>

      <ul className="mi-stats">
        <li>
          <span className="mi-stat">49%</span>
          of the 279 players who scored started <strong>34 or more</strong> of 38
          matches. Ninety of them started 36 or more.
        </li>
        <li>
          <span className="mi-stat">50%</span>
          of all 1,005 league goals came from just <strong>50 players</strong>.
          Attacking output is concentrated in a handful of names per club.
        </li>
        <li>
          <span className="mi-stat">0.081</span>
          median goals per game for those near ever present starters, against{" "}
          <strong>0.100</strong> for players used in under 20 matches.
        </li>
      </ul>

      <p className="mi-note">
        That last comparison is an observation, not proof of cause. Lightly used
        players often come on in favourable moments, and the selection effects
        run both ways. But it does undercut the assumption that playing your
        attackers more simply yields more, and it is the kind of question a model
        can weigh properly where instinct cannot.
      </p>
    </section>

    <section>
      <h3>The cost of getting it wrong</h3>
      <p>
        Put together: clubs lean heavily on a small attacking core, that core
        plays almost everything, and fixture congestion keeps rising. A striker
        who starts every match through a busy winter is carrying accumulated
        fatigue into exactly the fixtures a season turns on, and a squad player
        who never starts is a resource the club paid for and did not use.
      </p>
      <p>
        A manager choosing a front three for the next ten games is solving a real
        scheduling problem in their head, balancing form, freshness and how much
        each fixture matters. This does it exactly, and can prove the answer is
        the best one available. That is the problem I wanted to solve properly
        rather than approximately.
      </p>
    </section>

    <section>
      <h3>The creator</h3>
      <p>
        I am <strong>Ahmed Idani</strong>, and I built this on my own as an
        operations research project at INSAT, starting in November 2024. The
        model, the API, the interface and the data pipeline are all mine.
      </p>
      <p>
        I wrote the model against <strong>Gurobi</strong> first, which is why the
        repository still carries that name.
      </p>

      <dl className="mi-defs">
        <div><dt>Optimiser</dt><dd>Python, OR-Tools, CBC</dd></div>
        <div><dt>API</dt><dd>Flask, SQLAlchemy, SQLite</dd></div>
        <div><dt>Interface</dt><dd>React, Vite, Tailwind CSS</dd></div>
        <div><dt>Data</dt><dd>football-data.org, Fantasy Premier League</dd></div>
      </dl>

      <p>
        <a
          className="mi-link"
          href="https://github.com/Ahmed-Idani/Optimization-of-Football-Player-Rotations-Using-Gurobi"
          target="_blank"
          rel="noopener noreferrer"
        >
          View the source on GitHub ↗
        </a>
      </p>
    </section>

    <section>
      <h3>Contributing</h3>
      <p>
        Contributions are welcome. Fork the repository, work on a branch, and open
        a pull request. The parts most worth picking up:
      </p>

      <ul className="mi-todo">
        <li>
          <strong>Extend the model to a full eleven.</strong> It currently selects
          three attackers. Adding goalkeepers, defenders and midfielders means
          formation constraints per position rather than one squad size rule.
        </li>
        <li>
          <strong>Better player data.</strong> Scoring potential is derived from
          last season’s goals per appearance, and physicality from how many
          matches a player started. Real fitness, minutes and injury data would
          make both far sharper.
        </li>
        <li>
          <strong>More leagues.</strong> Nothing in the solver is specific to the
          Premier League. The data layer is what ties it there.
        </li>
        <li>
          <strong>Real fixtures.</strong> Difficulty is entered by hand. It could
          be pulled from league position or an opponent strength rating instead.
        </li>
      </ul>

      <p className="mi-note">
        Photo credits for players sourced from Wikimedia Commons are listed in
        <code> frontend/public/images/players/ATTRIBUTION.md</code>, as their
        licences require.
      </p>
    </section>
  </Dialog>
);

/* ------------------------------------------------------------------ */

const MathsDialog = ({ onClose }) => (
  <Dialog
    eyebrow="Binary integer programme"
    title="The Maths"
    onClose={onClose}
    footer={
      <>
        <a className="mi-pdf" href="/FootballRotationModel.pdf" download>
          ↓ Download the full write up (PDF)
        </a>
        <a
          className="mi-view"
          href="/FootballRotationModel.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in new tab
        </a>
      </>
    }
  >
    <section>
      <h3>The problem</h3>
      <p>
        Pick a starting three for every match of a run of fixtures. Play your
        best scorers as often as possible, but no player can start indefinitely,
        and there is no point burning your stars on a game you should win anyway.
        Those three pulls fight each other, which is exactly what makes it worth
        optimising rather than guessing.
      </p>
    </section>

    <section>
      <h3>Sets and data</h3>
      <dl className="mi-defs">
        <div><dt><V>i</V> ∈ <V>S</V></dt><dd>players in the squad, 6 here</dd></div>
        <div><dt><V>t</V> ∈ {"{1 … T}"}</dt><dd>the matches being planned</dd></div>
        <div><dt><V sub="i">G</V></dt><dd>scoring potential of player <V>i</V>, in goals per game</dd></div>
        <div><dt><V sub="i">P</V></dt><dd>physicality, the most consecutive matches <V>i</V> can start</dd></div>
        <div><dt><V sub="t">C</V></dt><dd>difficulty of match <V>t</V>: 0.5 easy, 1.0 medium, 1.5 hard</dd></div>
      </dl>
    </section>

    <section>
      <h3>Decision variable</h3>
      <div className="mi-math">
        <V sub="i,t">x</V> ∈ {"{0, 1}"}
      </div>
      <p>
        One binary switch per player per match: 1 if player <V>i</V> starts match{" "}
        <V>t</V>, 0 otherwise. Everything the model decides is expressed in these
        switches, and there are <V>S</V> × <V>T</V> of them.
      </p>
    </section>

    <section>
      <h3>Objective</h3>
      <div className="mi-math mi-math--lead">
        max &nbsp; Σ<sub>i</sub> Σ<sub>t</sub> &nbsp; <V sub="t">C</V> · <V sub="i">G</V> · <V sub="i,t">x</V>
      </div>
      <p>
        Maximise scoring potential <em>weighted by how much the match matters</em>.
        Because <V sub="t">C</V> multiplies <V sub="i">G</V>, a goal from your best
        striker is worth three times more in a hard fixture (1.5) than an easy one
        (0.5). That single product is what pushes the solver to save its best
        players for the games that count, without anyone telling it to.
      </p>
    </section>

    <section>
      <h3>Constraints</h3>

      <h4>1 · Field exactly three</h4>
      <div className="mi-math">
        Σ<sub>i</sub> <V sub="i,t">x</V> = 3 &nbsp;&nbsp; ∀ <V>t</V>
      </div>
      <p>Every match needs a full attacking line, no more and no fewer.</p>

      <h4>2 · Rest before burnout</h4>
      <div className="mi-math">
        Σ<sub>k=0</sub><sup>P<sub>i</sub></sup> <V sub="i,t+k">x</V> ≤ <V sub="i">P</V>
        &nbsp;&nbsp; ∀ <V>i</V>, &nbsp; <V>t</V> ≤ <V>T</V> − <V sub="i">P</V>
      </div>
      <p>
        The elegant one. Look at any window of <V sub="i">P</V> + 1 consecutive
        matches and allow at most <V sub="i">P</V> starts inside it. A player
        therefore can never appear <V sub="i">P</V> + 1 times in a row, yet is free
        to start as often as they like otherwise. This sliding window trick is the
        standard way to say “no more than k in a row” in linear form, since writing
        it as an explicit rule would need far messier logic.
      </p>

      <h4>3 · Rotate in the easy games</h4>
      <div className="mi-math">
        Σ<sub>i : G<sub>i</sub> ≤ 0.5</sub> <V sub="i,t">x</V> ≥ 2
        &nbsp;&nbsp; ∀ <V>t</V> where <V sub="t">C</V> = 0.5
      </div>
      <p>
        In a match flagged easy, at least two of the three starters must come from
        your lower rated players. This deliberately works <em>against</em> the
        objective, forcing squad rotation the maximiser would never choose on its
        own, which is the point.
      </p>
    </section>

    <section>
      <h3>Why it is not just brute force</h3>
      <p>
        The search space is 2<sup>|S|·T</sup>. A six player squad over a 38 match
        season gives 2<sup>228</sup> ≈ 4 × 10<sup>68</sup> candidate assignments,
        more than the atoms in the observable universe many times over.
        Enumerating them is hopeless.
      </p>
      <p>
        Integer programming sidesteps that. The solver drops the integrality
        requirement, letting <V sub="i,t">x</V> sit anywhere in [0, 1], and solves
        the resulting linear programme in polynomial time. That gives an upper
        bound on the best achievable score. It then branches on a fractional
        variable, forcing it to 0 in one branch and 1 in the other, and prunes any
        branch whose bound is already worse than the best whole solution found so
        far. Whole regions of the space get discarded without ever being examined.
      </p>
    </section>

    <section>
      <h3>The solver</h3>
      <p>
        Solved with <strong>CBC</strong> (COIN-OR Branch and Cut), the open source
        mixed integer solver, driven through Google OR-Tools’
        <code> pywraplp</code> interface. This is what the app runs, because it
        needs no licence key.
      </p>

      <h4>There is also a Gurobi version</h4>
      <p>
        The same model is implemented for <strong>Gurobi</strong> in{" "}
        <code>backend/BackendLogic.py</code>, alongside the OR-Tools version in{" "}
        <code>backend/BackendLogica.py</code>. Identical variables, objective and
        constraints, written with <code>gurobipy</code> instead. There is a
        standalone Gurobi script too, in <code>backend/optimiser.py</code>.
      </p>
      <p>
        Both solvers return the same optimum, as they must, since the model is
        the same. Gurobi is markedly faster on large instances but needs a
        commercial licence, so swapping the import in <code>main.py</code> is all
        it takes to run the Gurobi build instead.
      </p>
      <p className="mi-note">
        A returned solution is <em>provably optimal</em>, not merely good. Branch
        and bound terminates only once every remaining branch is shown to be worse
        than the incumbent.
      </p>
    </section>
  </Dialog>
);

/* ------------------------------------------------------------------ */

export const ModelInfo = () => {
  const [open, setOpen] = useState(null); // null | "why" | "maths"
  const close = () => setOpen(null);

  return (
    <>
      <button
        type="button"
        className="mi-corner mi-corner--left"
        onClick={() => setOpen("why")}
      >
        Why we built it
      </button>

      <button
        type="button"
        className="mi-corner mi-corner--right mi-corner--loud"
        onClick={() => setOpen("maths")}
      >
        <span className="mi-corner__sigma" aria-hidden="true">Σ</span>
        The maths behind it
      </button>

      {open === "why" && <WhyDialog onClose={close} />}
      {open === "maths" && <MathsDialog onClose={close} />}
    </>
  );
};
