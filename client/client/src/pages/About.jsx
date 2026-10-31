import { Link } from "react-router-dom";
import "./About.css";

export default function About() {
  return (
    <div className="about-page">

      {/* NAVBAR */}
      <nav className="about-nav">
        <Link to="/" className="about-brand">
          <span className="about-brand-icon">✦</span>
          <span>AI StudyHub</span>
        </Link>

        <div className="about-nav-links">
          <Link to="/">Home</Link>
          <a href="#mission">Our Mission</a>
          <a href="#features">Features</a>
          <a href="#technology">Technology</a>
        </div>

        <div className="about-nav-actions">
          <Link to="/login" className="about-signin">
            Sign In
          </Link>

          <Link to="/register" className="about-start">
            Get Started <span>→</span>
          </Link>
        </div>
      </nav>


      {/* HERO */}
      <main>

        <section className="about-hero">

          <div className="about-hero-content">

            <div className="about-eyebrow">
              <span></span>
              ABOUT AI STUDYHUB
            </div>

            <h1>
              A smarter way
              <br />
              to <span>learn.</span>
            </h1>

            <p>
              AI StudyHub is an intelligent learning platform designed
              to bring studying, practice, organization, and progress
              tracking together in one focused workspace.
            </p>

            <div className="about-hero-actions">
              <Link to="/register" className="about-primary-btn">
                Start Learning
                <span>→</span>
              </Link>

              <Link to="/" className="about-secondary-btn">
                Explore StudyHub
              </Link>
            </div>

          </div>


          {/* HERO VISUAL */}
          <div className="about-hero-visual">

            <div className="about-orbit orbit-one"></div>
            <div className="about-orbit orbit-two"></div>

            <div className="about-ai-card">

              <div className="ai-card-top">
                <div className="ai-avatar">✦</div>

                <div>
                  <strong>AI Study Assistant</strong>
                  <span>Personalized learning</span>
                </div>

                <div className="ai-online">
                  <span></span>
                  Online
                </div>
              </div>

              <div className="ai-card-body">

                <div className="ai-message student-message">
                  Help me understand normalization.
                </div>

                <div className="ai-message assistant-message">
                  <strong>Let's make it simple.</strong>
                  <p>
                    Normalization organizes your database
                    to reduce duplicate data and improve
                    consistency.
                  </p>

                  <div className="ai-concepts">
                    <span>1NF</span>
                    <span>2NF</span>
                    <span>3NF</span>
                  </div>
                </div>

              </div>

              <div className="ai-card-input">
                <span>Ask anything about your studies...</span>
                <button>↑</button>
              </div>

            </div>

          </div>

        </section>


        {/* MISSION */}
        <section className="about-mission" id="mission">

          <div className="section-heading">

            <div>
              <span className="about-label">
                WHY AI STUDYHUB
              </span>

              <h2>
                Built around the way
                <br />
                students <span>actually learn.</span>
              </h2>
            </div>

            <p>
              Studying often means jumping between notes, PDFs,
              videos, quizzes, reminders, and different applications.
              AI StudyHub brings those pieces together into one
              simple learning environment.
            </p>

          </div>


          <div className="mission-grid">

            <div className="mission-card large">
              <span className="mission-number">01</span>

              <div className="mission-icon">✦</div>

              <h3>Learn with AI</h3>

              <p>
                Get explanations, examples, study guidance and
                personalized assistance whenever you get stuck.
              </p>
            </div>


            <div className="mission-card">
              <span className="mission-number">02</span>

              <div className="mission-icon">◆</div>

              <h3>Practice smarter</h3>

              <p>
                Turn learning into active practice with quizzes
                and flashcards.
              </p>
            </div>


            <div className="mission-card">
              <span className="mission-number">03</span>

              <div className="mission-icon">◷</div>

              <h3>Stay organized</h3>

              <p>
                Plan study sessions, manage materials and
                keep your learning activities organized.
              </p>
            </div>

          </div>

        </section>


        {/* FEATURES */}
        <section className="about-features" id="features">

          <div className="center-heading">
            <span className="about-label">ONE LEARNING SPACE</span>

            <h2>
              Everything your
              <br />
              study routine <span>needs.</span>
            </h2>

            <p>
              AI StudyHub combines the tools you need to
              understand, practice, organize and improve.
            </p>
          </div>


          <div className="feature-grid">

            <div className="feature-item">
              <div className="feature-icon purple">✦</div>
              <h3>AI Tutor</h3>
              <p>
                Ask questions and get clear explanations
                when difficult concepts slow you down.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon blue">▣</div>
              <h3>Study Materials</h3>
              <p>
                Keep your course resources and important
                learning material organized.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon green">✓</div>
              <h3>Smart Quizzes</h3>
              <p>
                Test your understanding and identify
                topics that need more attention.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon orange">◇</div>
              <h3>Flashcards</h3>
              <p>
                Revise important concepts quickly with
                focused active-recall practice.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon cyan">◷</div>
              <h3>Study Planner</h3>
              <p>
                Structure your study sessions and build
                a consistent learning routine.
              </p>
            </div>

            <div className="feature-item">
              <div className="feature-icon pink">↗</div>
              <h3>Progress Tracking</h3>
              <p>
                Understand your performance through
                course progress and quiz results.
              </p>
            </div>

          </div>

        </section>


        {/* TECHNOLOGY */}
        <section className="about-technology" id="technology">

          <div className="technology-content">

            <span className="about-label">
              UNDER THE HOOD
            </span>

            <h2>
              Powered by modern
              <br />
              <span>web technology.</span>
            </h2>

            <p>
              AI StudyHub is built as a modern full-stack
              learning platform with a focus on performance,
              usability and scalable architecture.
            </p>

            <div className="tech-stack">

              <div className="tech-pill">
                <strong>React</strong>
                <span>Frontend</span>
              </div>

              <div className="tech-pill">
                <strong>Node.js</strong>
                <span>Runtime</span>
              </div>

              <div className="tech-pill">
                <strong>Express</strong>
                <span>API</span>
              </div>

              <div className="tech-pill">
                <strong>MongoDB</strong>
                <span>Database</span>
              </div>

              <div className="tech-pill">
                <strong>JWT</strong>
                <span>Authentication</span>
              </div>

              <div className="tech-pill">
                <strong>AI</strong>
                <span>Learning assistant</span>
              </div>

            </div>

          </div>


          <div className="technology-panel">

            <div className="tech-window">

              <div className="window-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="tech-code">

                <div>
                  <span className="code-purple">const</span>{" "}
                  <span className="code-blue">studyHub</span>{" "}
                  = {"{"}
                </div>

                <div className="indent">
                  <span className="code-purple">learn</span>:{" "}
                  <span className="code-green">"AI-powered"</span>,
                </div>

                <div className="indent">
                  <span className="code-purple">practice</span>:{" "}
                  <span className="code-green">"smart"</span>,
                </div>

                <div className="indent">
                  <span className="code-purple">progress</span>:{" "}
                  <span className="code-green">"measurable"</span>,
                </div>

                <div className="indent">
                  <span className="code-purple">focus</span>:{" "}
                  <span className="code-green">"students"</span>
                </div>

                <div>{"}"}</div>

                <div className="code-cursor">_</div>

              </div>

            </div>

          </div>

        </section>


        {/* FINAL CTA */}
        <section className="about-final">

          <div className="final-glow"></div>

          <div className="final-symbol">✦</div>

          <span className="about-label">
            READY TO STUDY DIFFERENTLY?
          </span>

          <h2>
            Your next
            <br />
            breakthrough <span>starts here.</span>
          </h2>

          <p>
            Create your AI StudyHub account and turn
            your study time into meaningful progress.
          </p>

          <Link to="/register" className="about-final-btn">
            Create Free Account
            <span>→</span>
          </Link>

        </section>

      </main>


      {/* FOOTER */}
      <footer className="about-footer">

        <Link to="/" className="about-footer-brand">
          <span>✦</span>
          AI StudyHub
        </Link>

        <p>
          Intelligent learning for students.
        </p>

        <span>
          © 2026 AI StudyHub
        </span>

      </footer>

    </div>
  );
}