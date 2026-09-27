import { FlaskConical, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SCENARIOS, type Scenario } from '../planner/mock';

/**
 * Hidden dev panel to review every state.
 * Open with `?dev` or `?state=<name>` in the URL, or press Shift + D.
 */
export function StateSwitcher({ scenario, onChange }: { scenario: Scenario; onChange: (s: Scenario) => void }) {
  const params = new URLSearchParams(location.search);
  const [open, setOpen] = useState(params.has('dev') || params.has('state'));
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        setOpen(true);
        setExpanded((x) => !x);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;
  return (
    <div className={`devsw ${expanded ? 'is-open' : ''}`}>
      {expanded ? (
        <>
          <div className="devsw__head">
            <FlaskConical size={14} /> State switcher
            <button className="iconbtn iconbtn--sm" onClick={() => setExpanded(false)} aria-label="Collapse state switcher">
              <X size={14} />
            </button>
          </div>
          {SCENARIOS.map((s) => (
            <button key={s.key} className={`devsw__opt ${scenario === s.key ? 'is-active' : ''}`} onClick={() => onChange(s.key)}>
              <b>{s.label}</b>
              <span>{s.hint}</span>
            </button>
          ))}
          <p className="devsw__foot">Drag, conflicts, doc & absence states are in the default data. URL: ?state=name</p>
        </>
      ) : (
        <button className="devsw__pill" onClick={() => setExpanded(true)}>
          <FlaskConical size={14} /> {SCENARIOS.find((s) => s.key === scenario)?.label}
        </button>
      )}
    </div>
  );
}
