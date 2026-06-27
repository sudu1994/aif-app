export default function ResultsDashboard({ results, totalAnswered, totalQ, answers, order, domainFull, onRestart, onReview }) {
  const domains = Object.keys(results).sort();
  const totalCorrect = domains.reduce((s, d) => s + results[d].correct, 0);
  const totalWrong = domains.reduce((s, d) => s + results[d].wrong, 0);
  const totalSkipped = domains.reduce((s, d) => s + results[d].skipped, 0);
  const pct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const passing = pct >= 70;

  function getStudyTip(d) {
    const r = results[d];
    if (!r || r.total === 0) return null;
    const score = r.total > 0 ? Math.round((r.correct / (r.correct + r.wrong || 1)) * 100) : 0;
    if (score < 50) return "Focus area — review fundamentals";
    if (score < 70) return "Needs work — practice more questions";
    if (score < 85) return "Good — review missed questions";
    return "Strong — maintain this domain";
  }

  return (
    <div className="results-page">
      <div className="results-inner">
        <div className={`score-hero ${passing ? "passing" : "failing"}`}>
          <div className="score-number">{pct}%</div>
          <div className="score-label">{passing ? "Passing Score ✓" : "Below Passing Threshold"}</div>
          <div className="score-sub">
            {totalCorrect} correct · {totalWrong} wrong · {totalSkipped} skipped
          </div>
          <div className="score-threshold">Passing threshold: 70%</div>
        </div>

        <h2 className="section-title">Domain Breakdown</h2>
        <div className="domain-table">
          {domains.map(d => {
            const r = results[d];
            const answered = r.correct + r.wrong;
            const domainPct = answered > 0 ? Math.round((r.correct / answered) * 100) : null;
            const tip = getStudyTip(d);
            return (
              <div key={d} className={`domain-row ${domainPct !== null && domainPct < 70 ? "domain-warn" : ""}`}>
                <div className="domain-row-header">
                  <span className="domain-row-name">{domainFull[d] || d}</span>
                  <span className={`domain-row-score ${domainPct !== null && domainPct >= 70 ? "score-pass" : "score-fail"}`}>
                    {domainPct !== null ? `${domainPct}%` : "—"}
                  </span>
                </div>
                <div className="domain-row-bar">
                  <div
                    className={`domain-bar-fill ${domainPct !== null && domainPct >= 70 ? "bar-pass" : "bar-fail"}`}
                    style={{ width: `${domainPct || 0}%` }}
                  />
                </div>
                <div className="domain-row-detail">
                  <span>{r.correct}/{r.total} correct</span>
                  {tip && <span className="study-tip">{tip}</span>}
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="section-title">Study Recommendations</h2>
        <div className="study-recs">
          {domains
            .filter(d => {
              const r = results[d];
              const answered = r.correct + r.wrong;
              return answered > 0 && Math.round((r.correct / answered) * 100) < 70;
            })
            .map(d => (
              <div key={d} className="rec-card">
                <div className="rec-domain">{domainFull[d] || d}</div>
                <ul className="rec-list">
                  {d.includes("D1") && <><li>Review ML algorithm types: supervised, unsupervised, reinforcement learning</li><li>Study SageMaker services: Canvas, Ground Truth, Clarify, Feature Store</li><li>Practice evaluation metrics: confusion matrix, BLEU, ROUGE, AUC-ROC</li></>}
                  {d.includes("D2") && <><li>Understand self-supervised learning and how FMs are trained</li><li>Review token vs. embedding vs. context window distinctions</li><li>Study hallucination, diffusion models, Transformer architecture</li></>}
                  {d.includes("D3") && <><li>Master Bedrock inference parameters: Temperature, Top K, Top P, Max Tokens</li><li>Understand RAG vs fine-tuning vs continued pre-training</li><li>Practice identifying the right Bedrock feature: Agents, Knowledge Bases, Guardrails</li></>}
                  {d.includes("D4") && <><li>Review bias types: sampling, observer, measurement, confirmation</li><li>Understand Clarify for explainability and bias detection</li><li>Study Responsible AI principles: transparency, fairness, accountability</li></>}
                  {d.includes("D5") && <><li>Review AWS Shared Responsibility Model for AI workloads</li><li>Study Bedrock data security: no training on customer data, encryption</li><li>Practice: CloudTrail, Audit Manager, Trusted Advisor, Config use cases</li></>}
                </ul>
              </div>
            ))}
          {domains.every(d => {
            const r = results[d];
            const answered = r.correct + r.wrong;
            return answered === 0 || Math.round((r.correct / answered) * 100) >= 70;
          }) && (
            <div className="rec-card">
              <div className="rec-domain">All domains passing!</div>
              <p>Great work. Keep reviewing any domains below 85% to build confidence.</p>
            </div>
          )}
        </div>

        <div className="results-actions">
          <button className="btn-primary btn-lg" onClick={onReview}>
            Review Questions
          </button>
          <button className="btn-outline btn-lg" onClick={onRestart}>
            New Session
          </button>
        </div>
      </div>
    </div>
  );
}
