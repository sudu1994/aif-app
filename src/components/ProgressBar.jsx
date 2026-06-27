export default function ProgressBar({ current, total, answered }) {
  const pct = Math.round((answered / total) * 100);
  const pos = Math.round(((current - 1) / total) * 100);
  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
        <div className="progress-cursor" style={{ left: `${pos}%` }} />
      </div>
      <div className="progress-label">
        <span>{answered} answered</span>
        <span>{pct}% complete</span>
      </div>
    </div>
  );
}
