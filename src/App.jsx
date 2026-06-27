import { useState, useEffect, useCallback } from "react";
import allQuestions from "./data/questions.json";
import QuizCard from "./components/QuizCard";
import ResultsDashboard from "./components/ResultsDashboard";
import ProgressBar from "./components/ProgressBar";

const STORAGE_KEY = "aif_c01_v2";

const BLOCKS = ["Test 1","Test 2","Test 3","Test 4","Practice Q&A"];

const DOMAIN_SHORT = {
  "D1":"D1","D2":"D2","D3":"D3","D4":"D4","D5":"D5"
};
const DOMAIN_FULL = {
  "D1":"Fundamentals of AI & ML",
  "D2":"Fundamentals of Generative AI",
  "D3":"Applications of Foundation Models",
  "D4":"Guidelines for Responsible AI",
  "D5":"Security, Compliance & Governance"
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
    return JSON.parse(raw);
  } catch { return null; }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export default function App() {
  const [mode, setMode] = useState("home");
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [order, setOrder] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [savedSessions, setSavedSessions] = useState({});

  useEffect(() => {
    const s = loadState();
    if (s && s.sessions) setSavedSessions(s.sessions);
  }, []);

  function startBlock(blockName) {
    const qs = allQuestions.filter(q => q.block === blockName);
    const indices = shuffle(qs.map((_, i) => i));
    const saved = savedSessions[blockName];
    
    if (saved && saved.order && saved.order.length === qs.length) {
      setQuestions(qs);
      setOrder(saved.order);
      setCurrent(saved.current || 0);
      setAnswers(saved.answers || {});
      setRevealed(saved.revealed || {});
    } else {
      setQuestions(qs);
      setOrder(indices);
      setCurrent(0);
      setAnswers({});
      setRevealed({});
    }
    setSelectedBlock(blockName);
    setMode("quiz");
  }

  function startFresh(blockName) {
    const qs = allQuestions.filter(q => q.block === blockName);
    const indices = shuffle(qs.map((_, i) => i));
    setQuestions(qs);
    setOrder(indices);
    setCurrent(0);
    setAnswers({});
    setRevealed({});
    setSelectedBlock(blockName);
    // Clear saved session for this block
    const newSessions = { ...savedSessions };
    delete newSessions[blockName];
    setSavedSessions(newSessions);
    saveState({ sessions: newSessions });
    setMode("quiz");
  }

  useEffect(() => {
    if (mode === "quiz" && selectedBlock && order.length > 0) {
      const newSessions = {
        ...savedSessions,
        [selectedBlock]: { order, current, answers, revealed }
      };
      setSavedSessions(newSessions);
      saveState({ sessions: newSessions });
    }
  }, [order, current, answers, revealed]);

  const currentQ = order.length > 0 && questions.length > 0 ? questions[order[current]] : null;

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

  function getResults() {
    const byDomain = {};
    order.forEach((qIdx, pos) => {
      const q = questions[qIdx];
      const d = q.domain;
      if (!byDomain[d]) byDomain[d] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
      byDomain[d].total++;
      const userAns = answers[pos];
      if (!userAns) { byDomain[d].skipped++; return; }
      const correctSet = new Set(q.correct);
      const userSet = new Set(userAns);
      const ok = correctSet.size === userSet.size && [...correctSet].every(l => userSet.has(l));
      if (ok) byDomain[d].correct++; else byDomain[d].wrong++;
    });
    return byDomain;
  }

  if (mode === "home") {
    return (
      <HomeScreen
        savedSessions={savedSessions}
        onStart={startBlock}
        onFresh={startFresh}
      />
    );
  }

  if (mode === "results") {
    return (
      <ResultsDashboard
        results={getResults()}
        totalAnswered={answeredCount}
        totalQ={totalQ}
        blockName={selectedBlock}
        domainFull={DOMAIN_FULL}
        onRestart={() => startFresh(selectedBlock)}
        onReview={() => setMode("quiz")}
        onHome={() => setMode("home")}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
            <button className="btn-ghost" onClick={() => setMode("home")}>← Home</button>
            <span className="header-block">{selectedBlock}</span>
          </div>
          <div className="header-right">
            <button className="btn-ghost" onClick={() => setMode("results")}>Results</button>
          </div>
        </div>
      </header>

      <ProgressBar current={current + 1} total={totalQ} answered={answeredCount} />

      <main className="quiz-main">
        <div className="nav-bar">
          <button className="nav-btn" onClick={() => goTo(current - 1)} disabled={current === 0}>← Prev</button>
          <span className="nav-count">{current + 1} / {totalQ}</span>
          <button className="nav-btn" onClick={() => goTo(current + 1)} disabled={current === totalQ - 1}>Next →</button>
        </div>

        {currentQ && (
          <QuizCard
            key={`${selectedBlock}-${order[current]}`}
            question={currentQ}
            userAnswer={answers[current] || null}
            isRevealed={!!revealed[current]}
            onAnswer={handleAnswer}
            onReveal={handleReveal}
            domainLabel={currentQ.domain}
            domainFull={DOMAIN_FULL[currentQ.domain] || ""}
          />
        )}

        <div className="bottom-nav">
          <button className="btn-primary" onClick={() => goTo(current + 1)} disabled={current === totalQ - 1}>
            Next Question →
          </button>
          {answeredCount >= Math.floor(totalQ * 0.5) && (
            <button className="btn-accent" onClick={() => setMode("results")}>
              See Results 🎯
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function HomeScreen({ savedSessions, onStart, onFresh }) {
  const blockCounts = {
    "Test 1": 65, "Test 2": 65, "Test 3": 65, "Test 4": 65, "Practice Q&A": 45
  };
  const blockColors = {
    "Test 1": "#4f8ef7", "Test 2": "#b06ef7", "Test 3": "#3ecf8e", "Test 4": "#f5a623", "Practice Q&A": "#f06060"
  };

  return (
    <div className="home">
      <div className="home-inner">
        <div className="home-badge">AWS Certified AI Practitioner</div>
        <h1 className="home-title">AIF-C01<br/>Practice Exam</h1>
        <p className="home-sub">305 questions across 5 blocks — all 5 exam domains</p>

        <div className="domain-chips">
          {[["D1","AI & ML Fundamentals"],["D2","Generative AI"],["D3","Foundation Models"],["D4","Responsible AI"],["D5","Security & Governance"]].map(([c,n]) => (
            <span key={c} className={`chip chip-${c}`}><b>{c}</b> {n}</span>
          ))}
        </div>

        <div className="blocks-grid">
          {BLOCKS.map(block => {
            const saved = savedSessions[block];
            const hasSaved = saved && Object.keys(saved.answers || {}).length > 0;
            const answered = hasSaved ? Object.keys(saved.answers).length : 0;
            const total = blockCounts[block];
            const color = blockColors[block];
            return (
              <div key={block} className="block-card" style={{"--block-color": color}}>
                <div className="block-header">
                  <span className="block-name">{block}</span>
                  <span className="block-count">{total} questions</span>
                </div>
                {hasSaved && (
                  <div className="block-progress">
                    <div className="block-bar">
                      <div className="block-bar-fill" style={{width: `${(answered/total)*100}%`}} />
                    </div>
                    <span className="block-progress-label">{answered}/{total} answered</span>
                  </div>
                )}
                <div className="block-actions">
                  {hasSaved ? (
                    <>
                      <button className="btn-block-primary" onClick={() => onStart(block)}>Resume</button>
                      <button className="btn-block-ghost" onClick={() => onFresh(block)}>Restart</button>
                    </>
                  ) : (
                    <button className="btn-block-primary" onClick={() => onStart(block)}>Start</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="home-note">Questions shuffle on each new session · Progress saved per block</p>
      </div>
    </div>
  );
}
