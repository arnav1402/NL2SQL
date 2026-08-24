
import { useState } from "react";

import Loader from "./components/Loader";
import PixelOctopus from "./components/ParticleOctopus";
import QueryTerminal from "./components/QueryTerminal";
import ParticleText from "./components/ParticleText";
import HelpPopover from "./components/HelpPopover";
import DatabaseSelector from "./components/DatabaseSelector";
import Workspace from "./components/Workspace";
import SchemaBuilder from "./components/SchemaBuilder/SchemaBuilder";

import "./App.css";

function App() {
  const [loading, setLoading] = useState(true);
  const [demoPhase, setDemoPhase] = useState("typing");
  const [helpOpen, setHelpOpen] = useState(false);

  /*
   * =========================================================
   * DATABASE CONNECTION
   * =========================================================
   */

  const [databaseSelectorOpen, setDatabaseSelectorOpen] =
    useState(false);

  // Stores the real backend connection
  const [connection, setConnection] = useState(null);

  /*
   * =========================================================
   * SCHEMA BUILDER
   * =========================================================
   */

  const [schemaBuilderOpen, setSchemaBuilderOpen] =
    useState(false);

  /*
   * =========================================================
   * LOADING SCREEN
   * =========================================================
   */

  if (loading) {
    return (
      <Loader
        onComplete={() => setLoading(false)}
      />
    );
  }

  /*
   * =========================================================
   * WORKSPACE
   * =========================================================
   *
   * Once the backend returns a connection_id,
   * the application enters the workspace.
   */

  if (connection) {
    return (
      <Workspace
        database={connection}
        onExit={() => {
          setConnection(null);
        }}
      />
    );
  }

  /*
   * =========================================================
   * SCHEMA BUILDER
   * =========================================================
   *
   * The Schema Builder is a separate creation workflow.
   *
   * It does NOT require a live database connection.
   * The user designs their database visually and
   * generates SQL from the schema.
   */

  if (schemaBuilderOpen) {
    return (
      <SchemaBuilder
        isOpen={schemaBuilderOpen}
        onClose={() => {
          setSchemaBuilderOpen(false);
        }}
      />
    );
  }

  /*
   * =========================================================
   * LANDING PAGE
   * =========================================================
   */

  return (
    <main className="landing-page">

      {/* =====================================================
          BACKGROUND SQL TEXTURE
          ===================================================== */}

      <div
        className="table-texture"
        aria-hidden="true"
      >
        <span style={{ top: "14%", left: "6%" }}>
          SELECT id, amount
        </span>

        <span style={{ top: "27%", left: "9%" }}>
          FROM orders
        </span>

        <span style={{ top: "40%", left: "5%" }}>
          WHERE created_at &gt;
        </span>

        <span style={{ top: "58%", left: "10%" }}>
          JOIN customers
        </span>

        <span style={{ top: "71%", left: "6%" }}>
          GROUP BY region
        </span>

        <span style={{ top: "85%", left: "8%" }}>
          1042 · Acme · 4920
        </span>
      </div>


      {/* =====================================================
          NAVIGATION
          ===================================================== */}

      <header className="top-nav">

        <div className="brand">
          <span>NL2SQL</span>
          <i>.</i>
        </div>

        <nav className="nav-links">

          <span className="active">
            ASK
          </span>

          <span>
            VALIDATE
          </span>

          <span>
            EXECUTE
          </span>

        </nav>

      </header>


      {/* =====================================================
          HELP
          ===================================================== */}

      <button
        className={`help-button${
          helpOpen
            ? " is-open"
            : ""
        }`}
        aria-label="How NL2SQL works"
        aria-expanded={helpOpen}
        onClick={() =>
          setHelpOpen(
            (value) => !value
          )
        }
      >
        ?
      </button>

      <HelpPopover
        open={helpOpen}
        onClose={() =>
          setHelpOpen(false)
        }
      />


      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="hero">

        <div className="hero-copy">

          <div className="hero-wordmark">

            <ParticleText
              text="NL2SQL"
              particleSize={2.2}
              density={4}
              color="#3A4B6E"
              highlightColor="#3654A6"
              scatter={190}
              gatherDuration={1500}
              stagger={320}
              pointerRepel={38}
              repelRadius={110}
              idleDrift={0.3}
              trigger="mount"
              fontSize="clamp(5.5rem, 6.5vw, 7.5rem)"
              fontWeight={400}
              fontFamily="DotGothic16"
            />

          </div>


          <div className="eyebrow">
            NATURAL LANGUAGE → SQL
          </div>


          <h1>
            Ask your database
            <br />
            a question<span>.</span>
          </h1>


          <p>
            Turn questions into precise,
            executable SQL. NL2SQL
            understands your schema before
            it generates an answer.
          </p>


          {/* =================================================
              DATABASE ACTIONS
              ================================================= */}

          <div className="database-actions">

            {/* -----------------------------------------------
                CONNECT EXISTING DATABASE
                ----------------------------------------------- */}

            <button
              className="get-started"
              onClick={() =>
                setDatabaseSelectorOpen(true)
              }
            >
              <span>
                Connect your Database
              </span>

              <span className="button-arrow">
                ↗
              </span>
            </button>


            {/* -----------------------------------------------
                BUILD NEW DATABASE
                ----------------------------------------------- */}

            <button
              className="get-started build-database"
              onClick={() =>
                setSchemaBuilderOpen(true)
              }
            >
              <span>
                Build your Database
              </span>

              <span className="button-arrow">
                ↗
              </span>
            </button>

          </div>

        </div>


        {/* =====================================================
            DEMO
            ===================================================== */}

        <div className="hero-demo">

          <div
            className={`demo-glow${
              demoPhase === "thinking"
                ? " is-thinking"
                : ""
            }`}
          />

          <QueryTerminal
            onPhaseChange={
              setDemoPhase
            }
          />

          <div className="demo-octopus-frame">

            <div className="demo-octopus-scale">

              <PixelOctopus
                phase={demoPhase}
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PROCESS
          ===================================================== */}

      <section className="process">

        <div className="process-header">

          <div className="eyebrow">
            HOW NL2SQL THINKS
          </div>

          <h2>
            From question to query,
            in three moves.
          </h2>

        </div>


        <div className="process-stages">

          <div className="process-stage">

            <span className="stage-index">
              01
            </span>

            <h3>
              Understand
            </h3>

            <p>
              “What are my top customers?”
              — parsed against your live
              schema, not a guess.
            </p>

          </div>


          <span
            className="stage-connector"
            aria-hidden="true"
          />


          <div className="process-stage">

            <span className="stage-index">
              02
            </span>

            <h3>
              Generate
            </h3>

            <p>
              A precise, executable query
              is written — joins, filters
              and all.
            </p>

          </div>


          <span
            className="stage-connector"
            aria-hidden="true"
          />


          <div className="process-stage">

            <span className="stage-index">
              03
            </span>

            <h3>
              Validate
            </h3>

            <p>
              Schema matched. Syntax
              checked. Query confirmed
              safe to run.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          STATUS
          ===================================================== */}

      <div className="status-line">

        <span className="status-indicator" />

        <span>
          DATABASE INTELLIGENCE
        </span>

        <span className="status-divider" />

        <span>
          POSTGRES · MYSQL · SQLITE
        </span>

      </div>


      {/* =====================================================
          FOOTER MARK
          ===================================================== */}

      <div
        className="footer-mark"
        aria-hidden="true"
      >

        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
        >

          <circle
            cx="12"
            cy="10"
            r="6"
            fill="currentColor"
          />

          <path
            d="M7 14q-1 3 -3 4M9.5 15.5q-0.5 3 -2 4.5M12 16q0 3 0 4.5M14.5 15.5q0.5 3 2 4.5M17 14q1 3 3 4"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />

        </svg>

      </div>


      {/* =====================================================
          DATABASE SELECTOR
          ===================================================== */}

      <DatabaseSelector
        isOpen={databaseSelectorOpen}

        onClose={() => {
          setDatabaseSelectorOpen(false);
        }}

        onConnect={(result) => {

          /*
           * DatabaseSelector gives us the RAW backend response:
           *
           * {
           *   connection_id: "...",
           *   status: "connected",
           *   tables_indexed: 0
           * }
           */

          console.log(
            "Real backend connection established:",
            result
          );


          /*
           * Validate the backend response.
           */

          if (!result?.connection_id) {

            console.error(
              "Backend did not return a connection ID:",
              result
            );

            return;
          }


          /*
           * Store the complete backend connection object.
           *
           * This causes:
           *
           * if (connection)
           *
           * above to become TRUE.
           *
           * React will then render <Workspace />.
           */

          setConnection(result);


          /*
           * Close the database selector.
           */

          setDatabaseSelectorOpen(false);
        }}
      />

    </main>
  );
}

export default App;

