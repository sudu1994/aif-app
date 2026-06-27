import { useState, useEffect, useCallback } from "react";
import questions from "./data/questions.json";
import QuizCard from "./components/QuizCard";
import ResultsDashboard from "./components/ResultsDashboard";
import ProgressBar from "./components/ProgressBar";

const STORAGE_KEY = "aif_c01_state";
const DOMAIN_LABELS = {
  "D1: Fundamentals of AI and ML": "D1",
  "D2: Fundamentals of Generative AI": "D2",
  "D3: Applications of Foundation Models": "D3",
  "D4: Guidelines for Responsible AI": "D4",
  "D5: Security, Compliance, and Governance": "D5",
};
const DOMAIN_FULL = {
  "D1: Fundamentals of AI and ML": "Fundamentals of AI & ML",
  "D2: Fundamentals of Generative AI": "Fundamentals of Generative AI",
  "D3: Applications of Foundation Models": "Applications of Foundation Models",
  "D4: Guidelines for Responsible AI": "Guidelines for Responsible AI",
  "D5: Security, Compliance, and Governance": "Security, Compliance & Governance",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s.order || s.order.length !== questions.length) return null;
    return s;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export default function App() {
  const [mode, setMode] = useState("home"); // home | quiz | review | results
  const [order, setOrder] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { qIndex: [selectedLetters] }
  const [revealed, setRevealed] = useState({}); // { qIndex: bool }
  const [filter, setFilter] = useState("all"); // all | unanswered | incorrect

  // Load or init state
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setOrder(saved.order);
      setCurrent(saved.current);
      setAnswers(saved.answers || {});
      setRevealed(saved.revealed || {});
      setMode("quiz");
    } else {
      const newOrder = shuffle(questions.map((_, i) => i));
      setOrder(newOrder);
    }
  }, []);

  useEffect(() => {
    if (mode === "quiz" && order.length > 0) {
      saveState({ order, current, answers, revealed });
    }
  }, [order, current, answers, revealed, mode]);

  const startFresh = useCallback(() => {
    const newOrder = shuffle(questions.map((_, i) => i));
    setOrder(newOrder);
    setCurrent(0);
    setAnswers({});
    setRevealed({});
    localStorage.removeItem(STORAGE_KEY);
    setMode("quiz");
  }, []);

  const resumeSession = useCallback(() => setMode("quiz"), []);

  const currentQ = order.length > 0 ? questions[order[current]] : null;

  const handleAnswer = useCallback((letters) => {
    setAnswers(prev => ({ ...prev, [current]: letters }));
  }, [current]);

  const handleReveal = useCallback(() => {
    setRevealed(prev => ({ ...prev, [current]: true }));
  }, [current]);

  const goTo = useCallback((idx) => {
    if (idx >= 0 && idx < order.length) setCurrent(idx);
  }, [order.length]);

  const answeredCount = Object.keys(answers).length;
  const totalQ = order.length;

  // Compute per-domain results
  function getResults() {
    const byDomain = {};
    order.forEach((qIdx, pos) => {
      const q = questions[qIdx];
      const domain = q.domain;
      if (!byDomain[domain]) byDomain[domain] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
      byDomain[domain].total++;
      const userAns = answers[pos];
      if (!userAns) {
        byDomain[domain].skipped++;
      } else {
        const correctSet = new Set(q.correct);
        const userSet = new Set(userAns);
        const isCorrect = correctSet.size === userSet.size && [...correctSet].every(l => userSet.has(l));
        if (isCorrect) byDomain[domain].correct++;
        else byDomain[domain].wrong++;
      }
    });
    return byDomain;
  }

  if (mode === "home") {
    const saved = loadState();
    const hasSaved = saved && Object.keys(saved.answers || {}).length > 0;
    return (
      <HomeScreen
        onStart={startFresh}
        onResume={hasSaved ? resumeSession : null}
        savedProgress={hasSaved ? {
          answered: Object.keys(saved.answers || {}).length,
          total: questions.length,
          current: saved.current
        } : null}
      />
    );
  }

  if (mode === "results") {
    return (
      <ResultsDashboard
        results={getResults()}
        totalAnswered={answeredCount}
        totalQ={totalQ}
        answers={answers}
        order={order}
        domainFull={DOMAIN_FULL}
        onRestart={startFresh}
        onReview={() => setMode("quiz")}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
            <span className="header-logo">AIF-C01</span>
            <span className="header-sub">AWS AI Practitioner</span>
          </div>
          <div className="header-right">
            <button className="btn-ghost" onClick={() => setMode("home")}>Home</button>
            <button className="btn-ghost" onClick={() => setMode("results")}>Results</button>
          </div>
        </div>
      </header>

      <ProgressBar current={current + 1} total={totalQ} answered={answeredCount} />

      <main className="quiz-main">
        <div className="nav-bar">
          <button
            className="nav-btn"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
          >← Prev</button>
          <span className="nav-count">{current + 1} / {totalQ}</span>
          <button
            className="nav-btn"
            onClick={() => goTo(current + 1)}
            disabled={current === totalQ - 1}
          >Next →</button>
        </div>

        {currentQ && (
          <QuizCard
            key={order[current]}
            question={currentQ}
            userAnswer={answers[current] || null}
            isRevealed={!!revealed[current]}
            onAnswer={handleAnswer}
            onReveal={handleReveal}
            qNumber={current + 1}
            domainLabel={DOMAIN_LABELS[currentQ.domain] || ""}
            domainFull={DOMAIN_FULL[currentQ.domain] || currentQ.domain}
          />
        )}

        <div className="bottom-nav">
          <button
            className="btn-primary"
            onClick={() => goTo(current + 1)}
            disabled={current === totalQ - 1}
          >
            Next Question →
          </button>
          {answeredCount === totalQ && (
            <button className="btn-accent" onClick={() => setMode("results")}>
              See Results 🎯
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function HomeScreen({ onStart, onResume, savedProgress }) {
  return (
    <div className="home">
      <div className="home-inner">
        <div className="home-badge">AWS Certified AI Practitioner</div>
        <h1 className="home-title">AIF-C01<br/>Practice Exam</h1>
        <p className="home-sub">{questions.length} questions across all 5 exam domains</p>

        <div className="domain-chips">
          {[
            ["D1", "AI & ML Fundamentals"],
            ["D2", "Generative AI"],
            ["D3", "Foundation Models"],
            ["D4", "Responsible AI"],
            ["D5", "Security & Governance"],
          ].map(([code, name]) => (
            <span key={code} className={`chip chip-${code}`}>
              <b>{code}</b> {name}
            </span>
          ))}
        </div>

        <div className="home-actions">
          {onResume && savedProgress && (
            <button className="btn-primary btn-lg" onClick={onResume}>
              Resume ({savedProgress.answered}/{savedProgress.total} answered)
            </button>
          )}
          <button
            className={onResume ? "btn-outline btn-lg" : "btn-primary btn-lg"}
            onClick={onStart}
          >
            {onResume ? "Start Fresh" : "Start Practice Exam"}
          </button>
        </div>

        <p className="home-note">Questions shuffle on each new session · Progress saved automatically</p>
      </div>
    </div>
  );
}
