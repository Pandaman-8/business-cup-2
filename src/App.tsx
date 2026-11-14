import { useEffect, useRef, useState } from 'react';
import { demoWeek, blankWeek } from './data/demoWeek';
import type { OptimizeResult, PlanInput } from './domain/types';
import { validate } from './domain/validation';
import FamilyCareForm from './components/FamilyCareForm';
import ShiftOffersForm from './components/ShiftOffersForm';
import ResultsPanel from './components/ResultsPanel';
export default function App() {
  const [plan, setPlan] = useState<PlanInput>(demoWeek);
  const [open, setOpen] = useState(false), [sample, setSample] = useState(false);
  const [started, setStarted] = useState(false), [revision, setRevision] = useState(0), [formKey, setFormKey] = useState(0);
  const [calculation, setCalculation] = useState<{ input: PlanInput; result?: OptimizeResult; error?: string } | null>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const issues = validate(plan);
  const valid = issues.length === 0;
  const result = calculation?.input === plan ? calculation.result ?? null : null;
  const error = !valid && started ? 'Please correct the highlighted inputs to calculate your week.' : calculation?.input === plan ? calculation.error ?? '' : '';
  const pending = started && valid && !result && !error;
  useEffect(() => {
    if (!started || !valid) return;
    const worker = new Worker(new URL('./domain/optimizer.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ result?: OptimizeResult; error?: string }>) => setCalculation({ input: plan, ...event.data });
    worker.onerror = () => setCalculation({ input: plan, error: 'The calculation could not finish. Please recalculate or reload the page.' });
    const timer = setTimeout(() => worker.postMessage(plan), 160);
    return () => { clearTimeout(timer); worker.terminate(); };
  }, [plan, started, valid, revision]);
  function load(isSample: boolean) { setPlan(isSample ? demoWeek() : blankWeek()); setOpen(true); setSample(isSample); setStarted(isSample); setCalculation(null); setFormKey(k => k + 1); requestAnimationFrame(() => workspace.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }
  return <><a className="skip-link" href="#main">Skip to planner</a><header className="site-header"><a className="brand" href="#" aria-label="ShiftMargin home"><span className="brand-icon"><i /><i /><i /></span>Shift<span>Margin</span><span className="brand-dot">.</span></a><span className="header-tag">A little planning. More possibility.</span><span className="private-label"><span aria-hidden="true">◇</span> No account needed</span></header>
    <main id="main"><section className={`hero ${open ? 'hero-small' : ''}`}><div className="hero-copy"><span className="eyebrow hero-eyebrow"><span className="tiny-dot" /> BUILT AROUND YOUR FAMILY</span><h1>Earn more.<br /> <span>Keep more.</span></h1><p>The biggest paycheck isn’t always the best shift. Find the extra work that leaves you more after childcare and commuting.</p><div className="hero-actions"><button className="primary-button" onClick={() => load(true)}>{open ? 'Reset sample' : 'Try a sample family'}<span>↗</span></button><button className="secondary-button" onClick={() => load(false)}>Start with my week <span>→</span></button></div><p className="hero-note">Free to use. No sign-up. Your inputs stay in this browser.</p></div>
      <div className="hero-art" aria-hidden="true"><div className="art-top"><span>A week that works for you</span><span>↗</span></div><div className="week-strips"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span className="work-day">S</span><span className="chosen-day">S <i>✓</i></span></div><div className="art-equation"><span>Extra pay</span><b>−</b><span>Care & travel</span><b>=</b></div><div className="art-bottom">More for<br />what matters.<span>✳</span></div><p>See the whole picture before saying yes.</p></div>
    </section>
    {!open && <section className="how-it-works" aria-label="How it works"><article><span>01 / YOUR OPTIONS</span><h2>Start with your week.</h2><p>Add your extra shift offers and the times care is available.</p></article><article><span>02 / THE FULL PICTURE</span><h2>Look beyond the paycheck.</h2><p>Include childcare, travel and your estimated withholding.</p></article><article><span>03 / YOUR NEXT MOVE</span><h2>Choose with clarity.</h2><p>Compare feasible plans and see how each dollar adds up.</p></article></section>}
    {open && <div className="workspace" ref={workspace}><div className="workspace-heading"><div><span className="eyebrow">YOUR WEEKLY PLANNER</span><h2>Let’s make your week add up.</h2></div><div className="sample-label">{sample ? 'Illustrative sample · editable' : 'Your custom week'}</div></div><div className="planner-grid"><div className="forms" key={formKey}><FamilyCareForm plan={plan} change={setPlan} issues={issues} /><ShiftOffersForm plan={plan} change={setPlan} issues={issues} />{issues.length > 0 && <div className="validation-summary" role="alert"><h3>A few details need attention</h3><ul>{issues.map((x, i) => <li key={i}>{x.message} <small>({x.path.startsWith('offers.') ? `Shift ${Number(x.path.split('.')[1]) + 1}` : x.path.split('.')[0]})</small></li>)}</ul></div>}<p className="privacy-note">◇ Your plan is processed on this device. We do not ask for names, addresses or details about your children.</p></div><ResultsPanel plan={plan} result={result} pending={pending} started={started} error={error} onOptimize={() => { setStarted(true); setCalculation(null); setRevision(r => r + 1); }} /></div></div>}
    <section className="limits-note"><strong>Real planning. Honest estimates.</strong><p>ShiftMargin compares optional extra shifts. It does not book childcare or calculate your actual taxes. Confirm care directly. Overtime, benefit changes, subsidies and your regular family expenses are outside this estimate.</p></section></main>
    <footer><a className="brand small-brand" href="#">ShiftMargin.</a><span>Made for the life around your work.</span><span>USD · Local times · No tracking</span></footer></>;
}
