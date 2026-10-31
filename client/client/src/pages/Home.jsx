import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="studyhub-home">

      {/* Navbar */}
      <nav className="studyhub-nav">
        <Link to="/" className="studyhub-logo">
          <span className="logo-symbol">✦</span>
          <span>AI StudyHub</span>
        </Link>

        <div className="nav-menu">
          <a href="#tools">Study Tools</a>
          <a href="#how-it-works">How It Works</a>
         <Link to="/about">About</Link>
        </div>

        <div className="nav-buttons">
          <Link to="/login" className="nav-signin">
            Sign In
          </Link>

          <Link to="/register" className="nav-start">
            Get Started
          </Link>
        </div>
      </nav>


      {/* Hero */}
      <main>

        <section className="study-hero">

          <div className="hero-left">

            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              YOUR PERSONAL AI STUDY SPACE
            </div>

            <h1>
              Turn your study
              <br />
              time into <span>progress.</span>
            </h1>

            <p className="hero-description">
              AI StudyHub brings your study materials, AI tutor,
              quizzes, flashcards, and progress tracking together
              in one place.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="start-button">
                Start Studying
                <span>→</span>
              </Link>

              <a href="#tools" className="explore-button">
                Explore Tools
              </a>
            </div>

            <div className="hero-note">
              <span>✓</span>
              Built for students
              <span className="note-divider"></span>
              AI-powered
              <span className="note-divider"></span>
              Personalized
            </div>

          </div>


          {/* AI Tutor Preview */}
          <div className="hero-right">

            <div className="ai-window">

              <div className="window-top">
                <div className="window-title">
                  <div className="tutor-icon">✦</div>

                  <div>
                    <strong>AI Study Tutor</strong>
                    <span>Ready to help</span>
                  </div>
                </div>

                <div className="window-status">
                  <span></span>
                  Online
                </div>
              </div>


              <div className="study-topic">
                <span className="topic-label">CURRENT TOPIC</span>

                <div className="topic-name">
                  Database Management System
                </div>
              </div>


              <div className="student-question">
                <div className="question-label">
                  YOUR QUESTION
                </div>

                <p>
                  Explain database normalization
                  with a simple example.
                </p>
              </div>


              <div className="ai-answer">

                <div className="answer-heading">
                  <span>✦</span>
                  AI Explanation
                </div>

                <p>
                  Normalization organizes database tables
                  to reduce duplicate data and improve
                  data consistency.
                </p>

                <div className="normalization-row">

                  <div className="normalization-item">
                    <strong>1NF</strong>
                    <span>Atomic values</span>
                  </div>

                  <div className="normalization-item">
                    <strong>2NF</strong>
                    <span>Partial dependency</span>
                  </div>

                  <div className="normalization-item">
                    <strong>3NF</strong>
                    <span>Transitive dependency</span>
                  </div>

                </div>

              </div>


              <div className="ask-box">
                <span>Ask another question...</span>
                <button>↑</button>
              </div>

            </div>


            <div className="mini-card material-card">
              <div className="mini-icon purple-icon">▣</div>

              <div>
                <strong>Study Materials</strong>
                <span>12 files available</span>
              </div>
            </div>


            <div className="mini-card quiz-mini-card">
              <div className="mini-icon green-icon">✓</div>

              <div>
                <strong>Today's Quiz</strong>
                <span>10 questions ready</span>
              </div>
            </div>

          </div>

        </section>


        {/* Study tools */}
        <section className="tools-section" id="tools">

          <div className="section-intro">
            <span className="section-label">
              STUDY TOOLS
            </span>

            <h2>
              Everything you need for
              <span> your next study session.</span>
            </h2>

            <p>
              Stop switching between different apps.
              AI StudyHub puts your essential learning
              tools in one place.
            </p>
          </div>


          <div className="tools-grid">

            <div className="tool-card tool-ai">
              <div className="tool-number">01</div>
              <div className="tool-icon">✦</div>

              <h3>AI Tutor</h3>

              <p>
                Ask questions about difficult topics and
                get explanations based on your learning needs.
              </p>

              <span className="tool-link">
                Ask anything →
              </span>
            </div>


            <div className="tool-card tool-material">
              <div className="tool-number">02</div>
              <div className="tool-icon">▣</div>

              <h3>Study Materials</h3>

              <p>
                Keep your notes, PDFs, documents, and
                course materials organized in one place.
              </p>

              <span className="tool-link">
                Organize materials →
              </span>
            </div>


            <div className="tool-card tool-quiz">
              <div className="tool-number">03</div>
              <div className="tool-icon">◆</div>

              <h3>Smart Quizzes</h3>

              <p>
                Practice with AI-generated questions
                based on the topics you are studying.
              </p>

              <span className="tool-link">
                Practice now →
              </span>
            </div>


            <div className="tool-card tool-flash">
              <div className="tool-number">04</div>
              <div className="tool-icon">◇</div>

              <h3>Flashcards</h3>

              <p>
                Turn important concepts into quick
                revision cards for faster recall.
              </p>

              <span className="tool-link">
                Review concepts →
              </span>
            </div>


            <div className="tool-card tool-plan">
              <div className="tool-number">05</div>
              <div className="tool-icon">◷</div>

              <h3>Study Planner</h3>

              <p>
                Plan your study sessions and stay
                consistent with your academic goals.
              </p>

              <span className="tool-link">
                Plan your day →
              </span>
            </div>


            <div className="tool-card tool-progress">
              <div className="tool-number">06</div>
              <div className="tool-icon">↗</div>

              <h3>Progress Tracking</h3>

              <p>
                See your performance, completed topics,
                quiz scores, and areas that need attention.
              </p>

              <span className="tool-link">
                View progress →
              </span>
            </div>

          </div>

        </section>


        {/* How it works */}
        <section className="workflow-section" id="how-it-works">

          <div className="workflow-heading">

            <div>
              <span className="section-label">
                HOW IT WORKS
              </span>

              <h2>
                From question to
                <span> understanding.</span>
              </h2>
            </div>

            <p>
              AI StudyHub is designed around the way
              students actually study.
            </p>

          </div>


          <div className="workflow">

            <div className="workflow-step">
              <div className="step-top">
                <span>01</span>
                <div className="step-line"></div>
              </div>

              <h3>Bring your material</h3>

              <p>
                Upload notes, documents, or use your
                available course materials.
              </p>
            </div>


            <div className="workflow-step">
              <div className="step-top">
                <span>02</span>
                <div className="step-line"></div>
              </div>

              <h3>Ask & practice</h3>

              <p>
                Ask the AI tutor questions and generate
                quizzes or flashcards for practice.
              </p>
            </div>


            <div className="workflow-step">
              <div className="step-top">
                <span>03</span>
              </div>

              <h3>Track your progress</h3>

              <p>
                Monitor your learning activity and
                identify areas where you need improvement.
              </p>
            </div>

          </div>

        </section>


        {/* CTA */}
        <section className="final-section" id="about">

          <div className="final-content">

            <div className="final-symbol">
              ✦
            </div>

            <span className="section-label">
              START YOUR JOURNEY
            </span>

            <h2>
              Your next study session
              <br />
              starts <span>here.</span>
            </h2>

            <p>
              Create your AI StudyHub account and
              build a better way to learn.
            </p>

            <Link to="/register" className="final-button">
              Create Free Account
              <span>→</span>
            </Link>

          </div>

        </section>

      </main>


      {/* Footer */}
      <footer className="study-footer">

        <Link to="/" className="footer-brand">
          <span className="logo-symbol">✦</span>
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

export default Home;