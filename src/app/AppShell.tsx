import { Bell } from 'lucide-react';
import type { ReactNode } from 'react';

const NAV = ['Dashboard', 'Planner', 'Trips', 'Means', 'Drivers', 'Clients', 'Pallets', 'Computer'];

export function AppShell({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Fleeex home">
          <span className="brand__mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M5 4h14v4H9v2h8v4H9v6H5z" fill="currentColor" />
            </svg>
          </span>
          Fleeex
        </a>
        <nav className="topnav" aria-label="Main">
          {NAV.map((n) => (
            <a key={n} href={`#${n.toLowerCase()}`} className={`topnav__item ${n === active ? 'is-active' : ''}`} aria-current={n === active ? 'page' : undefined}>
              {n}
            </a>
          ))}
        </nav>
        <div className="topbar__right">
          <button className="iconbtn iconbtn--round" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <span className="topbar__avatar" aria-label="Account">
            TO
          </span>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
