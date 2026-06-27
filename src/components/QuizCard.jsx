import { useState, useEffect } from "react";

export default function QuizCard({
  question, userAnswer, isRevealed, onAnswer, onReveal, qNumber, domainLabel, domainFull
}) {
  const [selected, setSelected] = useState(userAnswer || []);

  useEffect(() => {
    setSelected(userAnswer || []);
  }, [question, userAnswer]);

  const isMulti = question.multi;
  const options = Object.entries(question.options);
  const correctSet = new Set(question.correct);

  function toggleOption(letter) {
    if (isRevealed) return;
    if (isMulti) {
      const next = selected.includes(letter)
        ? selected.filter(l => l !== letter)
        : [...selected, letter];
      setSelected(next);
      onAnswer(next);
    } else {
      const next = [letter];
      setSelected(next);
      onAnswer(next);
      // Auto-reveal on single-select
      if (!isRevealed) {
        setTimeout(() => onReveal(), 150);
      }
    }
  }

  function getOptionClass(letter) {
    const isSelected = selected.includes(letter);
    const isCorrect = correctSet.has(letter);
    if (!isRevealed) {
      return isSelected ? "option selected" : "option";
    }
    if (isCorrect) return "option correct";
    if (isSelected && !isCorrect) return "option wrong";
    return "option dim";
  }

  const userAnswerSet = new Set(selected);
  const isCorrectAnswer = isRevealed &&
    correctSet.size === userAnswerSet.size &&
    [...correctSet].every(l => userAnswerSet.has(l));

  const answered = selected.length > 0;

  return (
    <div className={`quiz-card ${isRevealed ? (isCorrectAnswer ? "card-correct" : answered ? "card-wrong" : "") : ""}`}>
      <div className="card-meta">
        <span className={`domain-tag domain-${domainLabel}`}>{domainLabel}</span>
        <span className="domain-name">{domainFull}</span>
        {isMulti && <span className="multi-tag">Select all that apply</span>}
        {question.source && <span className="source-tag">{question.source}</span>}
      </div>

      <p className="question-text">{question.question}</p>

      <div className="options-list">
        {options.map(([letter, text]) => (
          <button
            key={letter}
            className={getOptionClass(letter)}
            onClick={() => toggleOption(letter)}
            disabled={isRevealed}
          >
            <span className="option-letter">{letter}</span>
            <span className="option-text">{text}</span>
            {isRevealed && correctSet.has(letter) && (
              <span className="option-icon">✓</span>
            )}
            {isRevealed && selected.includes(letter) && !correctSet.has(letter) && (
              <span className="option-icon wrong-icon">✗</span>
            )}
          </button>
        ))}
      </div>

      {isMulti && !isRevealed && selected.length > 0 && (
        <button className="btn-check" onClick={onReveal}>
          Check Answer
        </button>
      )}

      {!isRevealed && !answered && (
        <button className="btn-skip" onClick={onReveal}>
          Show Answer
        </button>
      )}

      {isRevealed && (
        <div className={`rationale ${isCorrectAnswer ? "rationale-correct" : "rationale-wrong"}`}>
          <div className="rationale-header">
            {isCorrectAnswer ? "✓ Correct!" : answered ? "✗ Incorrect" : "Answer"}
            {" — "}
            <strong>{question.correct.join(", ")}</strong>
          </div>
          <p className="rationale-text">{question.rationale}</p>
        </div>
      )}
    </div>
  );
}
