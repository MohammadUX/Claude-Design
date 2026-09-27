import { useEffect } from 'react';
import { StateSwitcher } from '../dev/StateSwitcher';
import { Planner, TooltipLayer, usePlannerStore } from '../planner';
import { SCENARIOS, type Scenario } from '../planner/mock';
import { AppShell } from './AppShell';
import { Toasts } from './Toasts';

const readScenario = (): Scenario => {
  const s = new URLSearchParams(location.search).get('state') as Scenario | null;
  return s && SCENARIOS.some((x) => x.key === s) ? s : 'default';
};

export function App() {
  const scenario = usePlannerStore((s) => s.scenario);
  const load = usePlannerStore((s) => s.load);

  useEffect(() => load(readScenario()), [load]);

  const change = (s: Scenario) => {
    const url = new URL(location.href);
    url.searchParams.set('state', s);
    history.replaceState(null, '', url);
    load(s);
  };

  return (
    <AppShell active="Planner">
      <Planner key={scenario} initialSearch={scenario === 'no-results' ? 'Zanzibar' : ''} />
      <Toasts />
      <TooltipLayer />
      <StateSwitcher scenario={scenario} onChange={change} />
    </AppShell>
  );
}
