export default function ResultsDashboard({ results, totalAnswered, totalQ, blockName, domainFull, onRestart, onReview, onHome }) {
  const domains = Object.keys(results).sort();
  const totalCorrect = domains.reduce((s, d) => s + results[d].correct, 0);
  const totalWrong = domains.reduce((s, d) => s + results[d].wrong, 0);
  const totalSkipped = domains.reduce((s, d) => s + results[d].skipped, 0);
  const pct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const passing = pct >= 70;

  const tips = {
    "D1": ["Review ML algorithm types: supervised, unsupervised, reinforcement learning","Study SageMaker services: Canvas, Ground Truth, Clarify, Data Wrangler, Feature Store","Practice evaluation metrics: confusion matrix, BLEU, ROUGE, AUC-ROC, Precision/Recall"],
    "D2": ["Understand self-supervised learning and how Foundation Models are pre-trained","Review token vs. embedding vs. context window distinctions","Study hallucination, diffusion models, GAN, VAE, Transformer architecture"],
    "D3": ["Master Bedrock inference parameters: Temperature, Top K, Top P, Max Tokens, Stop sequences","Understand RAG vs. fine-tuning vs. continued pre-training — when to use each","Identify the right Bedrock feature: Agents (actions), Knowledge Bases (RAG), Guardrails (safety)"],
    "D4": ["Review bias types: sampling, observer, measurement, confirmation bias","Understand SageMaker Clarify for explainability and bias detection","Study Responsible AI principles: transparency, fairness, accountability, explainability"],
    "D5": ["Review AWS Shared Responsibility Model for AI workloads on Bedrock and SageMaker","Study Bedrock data security guarantees: customer data is NOT used to train base FMs","Practice CloudTrail, Audit Manager, Trusted Advisor, Config, and IAM use cases"],
  };

  return (
    <div className="results-page">
      <div className="results-inner">
        <div className="results-block-label">{blockName}</div>
        <div className={`score-hero ${passing ? "passing" : "failing"}`}>
          <div className="score-number">{pct}%</div>
          <div className="score-label">{passing ? "Passing Score ✓" : "Below Passing Threshold"}</div>
          <div className="score-sub">{totalCorrect} correct · {totalWrong} wrong · {totalSkipped} skipped</div>
          <div className="score-threshold">Passing threshold: 70%</div>
        </div>

        <h2 className="section-title">Domain Breakdown</h2>
        <div className="domain-table">
          {domains.map(d => {
            const r = results[d];
            const answered = r.correct + r.wrong;
            const dpct = answered > 0 ? Math.round((r.correct / answered) * 100) : null;
            return (
              <div key={d} className={`domain-row ${dpct !== null && dpct < 70 ? "domain-warn" : ""}`}>
                <div className="domain-row-header">
                  <span className="domain-row-name">{domainFull[d] || d}</span>
                  <span className={`domain-row-score ${dpct !== null && dpct >= 70 ? "score-pass" : "score-fail"}`}>
                    {dpct !== null ? `${dpct}%` : "—"}
                  </span>
                </div>
                <div className="domain-row-bar">
                  <div className={`domain-bar-fill ${dpct !== null && dpct >= 70 ? "bar-pass" : "bar-fail"}`}
                    style={{ width: `${dpct || 0}%` }} />
                </div>
                <div className="domain-row-detail">
                  <span>{r.correct}/{r.total} correct · {r.skipped} skipped</span>
                </div>
              </div>
            );
          })}
        </div>

        {domains.some(d => { const r = results[d]; const a = r.correct+r.wrong; return a>0 && Math.round((r.correct/a)*100)<70; }) && (
          <>
            <h2 className="section-title">Study Recommendations</h2>
            <div className="study-recs">
              {domains.filter(d => { const r=results[d]; const a=r.correct+r.wrong; return a>0 && Math.round((r.correct/a)*100)<70; }).map(d => (
                <div key={d} className="rec-card">
                  <div className="rec-domain">{domainFull[d] || d}</div>
                  <ul className="rec-list">
                    {(tips[d] || ["Review AWS documentation for this domain"]).map((t,i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="results-actions">
          <button className="btn-primary btn-lg" onClick={onReview}>Review Questions</button>
          <button className="btn-outline btn-lg" onClick={onRestart}>Restart Block</button>
          <button className="btn-outline btn-lg" onClick={onHome}>All Blocks</button>
        </div>
      </div>
    </div>
  );
}
