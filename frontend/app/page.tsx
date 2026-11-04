'use client';

import { FormEvent, useState } from 'react';

type Finding = {
  rule_id: string;
  category: string;
  severity: string;
  quote: string;
  explanation: string;
  source: string;
  suggestion: string;
};

const demoText = `Our panels are the best on the market and guarantee 40% savings!`;

export default function HomePage() {
  const [text, setText] = useState(demoText);
  const [result, setResult] = useState<null | { findings: Finding[]; summary: Record<string, string | number> }>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const payload = await response.json();
      setResult(payload);
    } catch (error) {
      console.error(error);
      setResult({
        findings: [
          {
            rule_id: 'API-ERROR',
            category: 'system',
            severity: 'warning',
            quote: 'API unavailable',
            explanation: 'The API did not respond. Start the backend with uvicorn or the dev server.',
            source: 'System',
            suggestion: 'Run the backend and retry.',
          },
        ],
        summary: { total_findings: 1, blockers: 0, ai_status: 'unavailable', provider: 'system' },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="panel hero">
        <p className="eyebrow">Inkloom Guardian</p>
        <h1>Check copy before it reaches the public.</h1>
        <p className="lede">
          The system flags risky claims, compares them with approved rules, and keeps a human in the loop.
        </p>
      </section>

      <section className="panel grid">
        <form onSubmit={handleSubmit} className="editor-panel">
          <label htmlFor="content">Content to review</label>
          <textarea
            id="content"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={10}
            placeholder="Paste marketing copy or policy language here..."
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Checking…' : 'Check content'}
          </button>
        </form>

        <div className="results-panel">
          <h2>Findings</h2>
          {!result && <p className="muted">No review run yet.</p>}
          {result && (
            <>
              <div className="summary-row">
                <span>Total findings: {String(result.summary.total_findings ?? 0)}</span>
                <span>Blockers: {String(result.summary.blockers ?? 0)}</span>
              </div>
              {result.findings.length === 0 ? (
                <p className="success">No issues detected by the deterministic checks.</p>
              ) : (
                <ul className="findings-list">
                  {result.findings.map((finding) => (
                    <li key={`${finding.rule_id}-${finding.quote}`} className={finding.severity === 'blocker' ? 'blocker' : ''}>
                      <div className="finding-header">
                        <strong>{finding.rule_id}</strong>
                        <span>{finding.severity}</span>
                      </div>
                      <p className="quote">“{finding.quote}”</p>
                      <p>{finding.explanation}</p>
                      <p className="meta">Source: {finding.source}</p>
                      <p className="meta">Suggestion: {finding.suggestion}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
