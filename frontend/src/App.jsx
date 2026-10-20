import React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, BookmarkCheck, Bot, BriefcaseBusiness,
  Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3, FileText,
  Headphones, History, Layers3, Lightbulb, LoaderCircle, MessageSquareText, Mic2,
  MoreHorizontal, Phone, PhoneCall, Plus, Save, Search, Send, Sparkles, Target,
  ThumbsDown, ThumbsUp, Timer, X
} from 'lucide-react';
import {
  STAGES, closeCall, getHealth, listCalls, saveStage, startCall, structureStage,
  suggestStage, summarizeCall
} from './api.js';

const OUTCOMES = ['Next step agreed', 'Follow-up agreed', 'Report / information agreed', 'Interested — no concrete next step', 'Not interested', 'Do not call', 'Wrong person', 'Moved company', 'Call again / connection issue', 'Not logged / unclear'];
const prettyDate = (date) => date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
const prettyTime = (date) => date ? new Date(date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—';
const initials = (name = 'Prospect') => name.trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('') || 'P';
const completedLabel = (call) => call.status === 'completed' ? 'Completed' : 'In progress';

function App() {
  const [view, setView] = useState('workspace');
  const [activeCall, setActiveCall] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [prospectName, setProspectName] = useState('');
  const [company, setCompany] = useState('');
  const [prospectRole, setProspectRole] = useState('');
  const [prospectWords, setProspectWords] = useState('');
  const [resultKey, setResultKey] = useState('right_person');
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionError, setSuggestionError] = useState('');
  const [historyCalls, setHistoryCalls] = useState([]);
  const [health, setHealth] = useState(null);
  const [persistenceMode, setPersistenceMode] = useState('checking');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState('');
  const [showCloseout, setShowCloseout] = useState(false);
  const [outcome, setOutcome] = useState('Not logged / unclear');
  const [summary, setSummary] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [errorNote, setErrorNote] = useState('');

  const stage = STAGES[selectedStageIndex];
  const savedStage = useMemo(
    () => activeCall?.stages?.find((item) => item.stageKey === stage.key),
    [activeCall, stage.key]
  );
  const stagesReached = useMemo(() => {
    if (!activeCall) return 0;
    return activeCall.stages?.length || 0;
  }, [activeCall]);

  const refreshHistory = useCallback(async () => {
    const result = await listCalls();
    setHistoryCalls(result.calls);
    setPersistenceMode((mode) => mode === 'checking' ? result.persistence : mode);
  }, []);

  useEffect(() => {
    let mounted = true;
    getHealth().then((data) => {
      if (!mounted) return;
      // The health endpoint reports configuration, not proven database connectivity.
      // Let the actual call-history request determine the initial persistence mode.
      setHealth(data);
    });
    refreshHistory();
    return () => { mounted = false; };
  }, [refreshHistory]);

  useEffect(() => {
    const saved = activeCall?.stages?.find((item) => item.stageKey === stage.key);
    setProspectWords(saved?.prospectWords || '');
    setResultKey(stage.taps.some((tap) => tap.key === saved?.resultKey) ? saved.resultKey : stage.taps[0].key);
    setSuggestion(null);
    setSuggestionError('');
    setErrorNote('');
  }, [activeCall?.id, stage.key, selectedStageIndex]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const beginCall = async (event) => {
    event.preventDefault();
    setBusy('start'); setErrorNote('');
    try {
      const started = await startCall({ prospectName: prospectName.trim() || 'Prospect', company: company.trim(), prospectRole: prospectRole.trim() });
      setActiveCall(started.call);
      setPersistenceMode(started.persistence);
      setReadOnly(false);
      setSelectedStageIndex(0);
      setView('workspace');
      setToast(started.persistence === 'cloud' ? 'Call started and saved to Supabase.' : 'Demo call started in this browser only.');
      setProspectName(''); setCompany(''); setProspectRole('');
      await refreshHistory();
    } catch (error) {
      setErrorNote(error.message || 'Could not start the call.');
    } finally { setBusy(''); }
  };

  const persistStage = async (goForward = false) => {
    if (!activeCall || readOnly) return;
    setBusy('save-stage'); setErrorNote('');
    try {
      const result = await saveStage(activeCall, { stageKey: stage.key, resultKey, prospectWords, callerNotes: '' });
      setActiveCall(result.call);
      setPersistenceMode(result.persistence);
      setToast(result.persistence === 'cloud' ? 'Stage saved.' : 'Saved locally in this browser; cloud API unavailable.');
      await refreshHistory();
      if (goForward && selectedStageIndex < STAGES.length - 1) setSelectedStageIndex((index) => index + 1);
    } catch (error) { setErrorNote(error.message || 'Could not save this stage.'); }
    finally { setBusy(''); }
  };

  const getStageSuggestion = async () => {
    if (!prospectWords.trim()) {
      setSuggestionError('Add the prospect’s words first so the assistant has something to interpret.');
      return;
    }
    setBusy('suggest'); setSuggestion(null); setSuggestionError('');
    const result = await suggestStage(prospectWords, stage.key);
    setSuggestion(result);
    if (result.aiMode === 'fallback') setSuggestionError('The API/LLM is not reachable, so this is a local keyword hint—not a live AI response.');
    setBusy('');
  };

  const polishNotes = async () => {
    if (!prospectWords.trim()) {
      setSuggestionError('Enter rough notes or the prospect’s words first.');
      return;
    }
    setBusy('structure'); setSuggestionError('');
    try {
      const result = await structureStage(prospectWords, stage.key);
      setProspectWords(result.prospectWords || prospectWords);
      setResultKey(result.resultKey || resultKey);
      setToast('AI cleaned up the notes. Review them before saving.');
    } catch (error) {
      setSuggestionError(error.message || 'Could not reach the LLM. Check the backend and API key.');
    } finally { setBusy(''); }
  };

  const applySuggestion = () => {
    const index = STAGES.findIndex((item) => item.key === suggestion?.stageKey);
    if (index >= 0) {
      setSelectedStageIndex(index);
      setSuggestion(null);
      setToast(`Moved to ${STAGES[index].name}. Review it before saving.`);
    }
  };

  const openCloseout = () => {
    setOutcome('Not logged / unclear');
    setSummary('');
    setFollowUp('');
    setShowCloseout(true);
  };

  const generateSummary = async () => {
    if (!activeCall?.stages?.length) {
      setErrorNote('Save at least one stage note before asking the AI to draft a summary.');
      return;
    }
    setBusy('summary'); setErrorNote('');
    try {
      const result = await summarizeCall(activeCall);
      setSummary(result.summary || '');
      setOutcome(result.outcomeSuggestion || 'Not logged / unclear');
      setFollowUp(result.followUp || '');
      setToast('Draft prepared by the LLM. Check it for accuracy.');
    } catch (error) {
      setErrorNote(error.message || 'Could not generate the summary. Check the backend and API key.');
    } finally { setBusy(''); }
  };

  const finishCall = async () => {
    if (!activeCall || readOnly) return;
    setBusy('close'); setErrorNote('');
    try {
      const finalSummary = [summary.trim(), followUp.trim() ? `Follow-up: ${followUp.trim()}` : ''].filter(Boolean).join('\n');
      const result = await closeCall(activeCall, { outcome, summary: finalSummary });
      setActiveCall(result.call);
      setPersistenceMode(result.persistence);
      setReadOnly(true);
      setShowCloseout(false);
      setToast(result.persistence === 'cloud' ? 'Call closed and saved.' : 'Call closed in local demo storage.');
      await refreshHistory();
    } catch (error) { setErrorNote(error.message || 'Could not close the call.'); }
    finally { setBusy(''); }
  };

  const loadSavedCall = (call) => {
    setActiveCall(call);
    setReadOnly(call.status === 'completed');
    const idx = Math.max(0, STAGES.findIndex((item) => item.key === call.stageKey));
    setSelectedStageIndex(idx);
    setView('workspace');
    setShowCloseout(false);
    setToast(call.status === 'completed' ? 'Opened a completed call for review.' : 'Reopened your active call.');
  };

  const filteredHistory = historyCalls.filter((call) => {
    const query = historySearch.trim().toLowerCase();
    return !query || `${call.prospectName} ${call.company} ${call.outcome} ${call.summary}`.toLowerCase().includes(query);
  });

  const goNext = async () => {
    if (activeCall && !readOnly) await persistStage(true);
    else if (selectedStageIndex < STAGES.length - 1) setSelectedStageIndex((index) => index + 1);
  };
  const goBack = () => setSelectedStageIndex((index) => Math.max(0, index - 1));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><Headphones size={21} strokeWidth={2.4} /></div>
          <div className="brand-copy"><span>call</span><strong>companion</strong><small>YOUR LIVE CALL GUIDE</small></div>
        </div>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          <button className={`nav-item ${view === 'workspace' ? 'active' : ''}`} onClick={() => setView('workspace')}>
            <PhoneCall size={17} /><span>Call workspace</span>{activeCall && activeCall.status === 'active' && <span className="nav-live-dot" />}
          </button>
          <button className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => { setView('history'); refreshHistory(); }}>
            <History size={17} /><span>Call history</span>
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="side-status-card">
          <div className="status-icon"><Activity size={17} /></div>
          <div><strong>{persistenceMode === 'cloud' ? 'Cloud connected' : persistenceMode === 'checking' ? 'Connecting…' : 'Demo mode'}</strong><p>{persistenceMode === 'cloud' ? 'Changes are saved to the backend.' : 'Calls stay in this browser until configured.'}</p></div>
          <span className={`status-dot ${persistenceMode === 'cloud' ? 'green' : 'amber'}`} />
        </div>
        <div className="sidebar-footer"><span className="footer-avatar">CC</span><div><strong>Call Companion</strong><span>Internship build · MVP</span></div><MoreHorizontal size={18} className="muted-icon" /></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{view === 'history' ? 'Call history' : activeCall ? 'Live call' : 'New call'}</strong></div>
          <div className="topbar-right">
            <div className={`system-status ${health?.llmConfigured ? 'connected' : ''}`}><span className="status-dot" />{health?.llmConfigured ? `LLM · ${health.llmProvider}` : 'LLM not connected'}</div>
            <button className="icon-button" title="Call guide info" onClick={() => setToast('Use the stage guide as a prompt, not a script. Listen first and record only what the prospect actually says.')}><CircleHelp size={18} /></button>
          </div>
        </header>

        {view === 'history' ? (
          <section className="page-content history-page">
            <div className="page-heading"><div><div className="eyebrow">YOUR CONVERSATIONS</div><h1>Call history</h1><p>Every conversation, one clear next step at a time.</p></div><button className="primary-button" onClick={() => { setActiveCall(null); setReadOnly(false); setView('workspace'); }}><Plus size={17} /> New call</button></div>
            <div className="history-summary-grid">
              <div className="metric-card"><span className="metric-label">TOTAL CALLS</span><strong>{historyCalls.length}</strong><span className="metric-foot"><History size={14} /> Recorded conversations</span></div>
              <div className="metric-card"><span className="metric-label">COMPLETED</span><strong>{historyCalls.filter((call) => call.status === 'completed').length}</strong><span className="metric-foot"><CheckCircle2 size={14} /> Calls with an outcome</span></div>
              <div className="metric-card"><span className="metric-label">CONCRETE NEXT STEPS</span><strong>{historyCalls.filter((call) =>
                                                                                                              ['Next step agreed', 'Follow-up agreed'].includes(call.outcome) ||
                                                                                                              (call.outcome === 'Report / information agreed' &&
                                                                                                                /(?:^|\n)Follow-up:\s*\S/i.test(call.summary || ''))
                                                                                                              ).length}</strong><span className="metric-foot"><Target size={14} /> Time or action agreed</span></div>
            </div>
            <div className="history-list-card">
              <div className="list-card-header"><div><h2>Recent calls</h2><p>Open a conversation to review the stage notes.</p></div><div className="search-field"><Search size={16} /><input aria-label="Search calls" placeholder="Search calls…" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} /></div></div>
              {filteredHistory.length === 0 ? <div className="empty-history"><div className="empty-icon"><History size={22} /></div><h3>No calls here yet</h3><p>Start a call in the workspace. Completed calls will show up here.</p><button className="secondary-button" onClick={() => { setActiveCall(null); setView('workspace'); }}><Plus size={16} /> Start your first call</button></div> : (
                <div className="history-table-wrap"><table className="history-table"><thead><tr><th>PROSPECT</th><th>DATE</th><th>STAGES REACHED</th><th>OUTCOME</th><th>STATUS</th><th /></tr></thead><tbody>{filteredHistory.map((call) => <tr key={call.id}>
                  <td><div className="prospect-cell"><span className="prospect-avatar">{initials(call.prospectName)}</span><span><strong>{call.prospectName}</strong><small>{call.company || call.prospectRole || 'No company added'}</small></span></div></td>
                  <td><span>{prettyDate(call.startedAt)}</span><small className="table-subtext">{prettyTime(call.startedAt)}</small></td>
                  <td><div className="mini-progress">{STAGES.map((item, index) => <span key={item.key} className={call.stages?.some((s) => s.stageKey === item.key) ? 'filled' : ''} />)}</div><small className="table-subtext">{call.stages?.length || 0} of 8 stages</small></td>
                  <td>{call.outcome ? <span className={`outcome-chip ${['Next step agreed', 'Follow-up agreed'].includes(call.outcome) ? 'good' : ''}`}>{call.outcome}</span> : <span className="subtle">—</span>}</td>
                  <td><span className={`state-chip ${call.status === 'completed' ? 'done' : 'in-progress'}`}><span />{completedLabel(call)}</span></td>
                  <td><button className="table-open" onClick={() => loadSavedCall(call)}>Review <ArrowUpRight size={14} /></button></td>
                </tr>)}</tbody></table></div>
              )}
            </div>
            <p className="privacy-note"><FileText size={14} /> This MVP stores notes, not audio. Use fictional/sample data for the public demo.</p>
          </section>
        ) : !activeCall ? (
          <section className="page-content launch-page">
            <div className="hero-kicker"><span className="live-pulse" /> BUILT FOR THE MOMENT THAT MATTERS</div>
            <div className="launch-heading"><div><h1>Stay with the<br /><span>conversation.</span></h1><p>The right prompt, at the right moment. A calm second screen for your next cold call.</p></div><div className="hero-illustration"><div className="illustration-orbit orbit-one" /><div className="illustration-orbit orbit-two" /><div className="hero-phone"><PhoneCall size={30} /><span /><span /><span /></div><div className="float-card float-card-top"><span className="float-dot green" /> Listening for context</div><div className="float-card float-card-bottom"><Sparkles size={15} /> One next step at a time</div></div></div>
            <div className="launch-grid">
              <form className="start-call-card" onSubmit={beginCall}>
                <div className="card-title-line"><div className="card-title-icon"><PhoneCall size={18} /></div><div><h2>Start a new call</h2><p>Set the context. We'll guide you through the rest.</p></div><span className="step-count">01 / 01</span></div>
                <label className="field-label">PROSPECT NAME <span>OPTIONAL</span><input value={prospectName} onChange={(e) => setProspectName(e.target.value)} placeholder="e.g. Jordan Lee" maxLength={120} /></label>
                <div className="form-row"><label className="field-label">COMPANY<input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Northstar Labs" maxLength={160} /></label><label className="field-label">ROLE<input value={prospectRole} onChange={(e) => setProspectRole(e.target.value)} placeholder="e.g. VP of Operations" maxLength={160} /></label></div>
                {errorNote && <p className="inline-error">{errorNote}</p>}
                <button className="primary-button full-width" type="submit" disabled={busy === 'start'}>{busy === 'start' ? <LoaderCircle className="spin" size={17} /> : <PhoneCall size={17} />} Start call <ArrowRight size={17} /></button>
                <div className="secure-note"><BookmarkCheck size={14} /> Notes are saved after each stage. No audio is recorded.</div>
              </form>
              <div className="what-to-expect-card"><div className="eyebrow">YOUR CALL, IN GOOD HANDS</div><h2>Less thinking about<br />the script. More listening.</h2><div className="expect-item"><span className="expect-number">01</span><div><strong>Know where you are</strong><p>Eight stages keep the conversation moving naturally.</p></div></div><div className="expect-item"><span className="expect-number">02</span><div><strong>Be ready for the real answer</strong><p>Common responses and an AI stage hint help you recover your flow.</p></div></div><div className="expect-item"><span className="expect-number">03</span><div><strong>End with a next step</strong><p>Capture the prospect’s own words and leave with a useful record.</p></div></div><div className="eight-stage-pill"><Layers3 size={16} /><span>8-stage framework</span><span className="pill-dots">● ● ● ● ● ● ● ●</span></div></div>
            </div>
          </section>
        ) : (
          <section className="page-content workspace-page">
            <div className="call-context-bar"><div className="call-context-left"><span className="call-avatar">{initials(activeCall.prospectName)}</span><div><div className="context-name-row"><h1>{activeCall.prospectName || 'Prospect'}</h1>{readOnly ? <span className="state-chip done"><span /> Completed call</span> : <span className="live-tag"><span /> LIVE WORKSPACE</span>}</div><p>{[activeCall.company, activeCall.prospectRole].filter(Boolean).join(' · ') || 'Prospect details not added'} <span className="context-dot">•</span> Started {prettyTime(activeCall.startedAt)}</p></div></div><div className="call-context-actions"><div className="stage-counter"><span>{stagesReached.toString().padStart(2, '0')}</span><small> / 08<br />SAVED</small></div>{!readOnly && <button className="finish-call-button" onClick={openCloseout}><CheckCircle2 size={16} /> Finish call</button>}<button className="plain-icon-button" title="Back to new call" onClick={() => { setActiveCall(null); setReadOnly(false); }}><X size={17} /></button></div></div>

            <div className="workspace-layout">
              <aside className="stage-rail">
                <div className="rail-heading"><span className="eyebrow">CALL FLOW</span><span className="rail-count">{selectedStageIndex + 1} of 8</span></div>
                <div className="stage-list">{STAGES.map((item, index) => {
                  const completed = activeCall.stages?.some((saved) => saved.stageKey === item.key);
                  const active = item.key === stage.key;
                  return <button key={item.key} className={`stage-rail-item ${active ? 'selected' : ''} ${completed ? 'completed' : ''}`} onClick={() => setSelectedStageIndex(index)}>
                    <span className="rail-stage-number">{completed ? <Check size={13} /> : String(item.number).padStart(2, '0')}</span><span className="rail-stage-copy"><strong>{item.name}</strong><small>{completed ? 'Notes saved' : active ? 'Current stage' : 'Not reached yet'}</small></span>{active && <ChevronRight size={15} className="rail-chevron" />}
                  </button>;
                })}</div>
                <div className="rail-tip"><Lightbulb size={16} /><div><strong>Listen before you lead</strong><p>The guide is a support, not a script. Let the prospect’s answers shape the call.</p></div></div>
              </aside>

              <div className="stage-main-column">
                <div className="stage-progress-track"><span style={{ width: `${((selectedStageIndex + 1) / STAGES.length) * 100}%` }} /></div>
                <div className="stage-heading-row"><div><div className="eyebrow">STAGE {String(stage.number).padStart(2, '0')} <span className="eyebrow-divider">/</span> 08</div><h2>{stage.name}</h2><p>{stage.purpose}</p></div><span className={`stage-state ${savedStage ? 'saved' : ''}`}>{savedStage ? <><CheckCircle2 size={14} /> SAVED</> : <><Clock3 size={14} /> IN PROGRESS</>}</span></div>

                <section className="guide-card"><div className="section-card-heading"><div className="section-icon blue"><Target size={17} /></div><div><h3>What this stage is for</h3><p>One thing to keep in mind right now</p></div></div><div className="purpose-callout">{stage.prompt}</div><div className="common-responses-heading"><span>ILLUSTRATIVE PROSPECT RESPONSES</span><span className="small-muted">Patterns to listen for · not verbatim quotes</span></div><div className="response-chips">{stage.examples.map((example) => <div key={example} className="response-chip">{example}</div>)}</div></section>

                <section className="capture-card"><div className="capture-card-heading"><div className="section-icon violet"><MessageSquareText size={17} /></div><div><h3>Capture the moment</h3><p>Use their words. You can clean up the notes after the call.</p></div><span className="optional-tag">QUICK NOTE</span></div><label className="field-label">PROSPECT’S WORDS<textarea value={prospectWords} onChange={(e) => setProspectWords(e.target.value)} placeholder="Capture the prospect’s actual words here. Edit any sample text before saving…" maxLength={3000} disabled={readOnly} rows={4} /></label><div className="capture-bottom"><span>{prospectWords.length} / 3000 characters</span><button className="text-action" disabled={readOnly || busy === 'structure'} onClick={polishNotes}>{busy === 'structure' ? <LoaderCircle className="spin" size={14} /> : <Sparkles size={14} />} Clean up with AI</button></div>
                  <div className="result-select-label">WHAT HAPPENED AT THIS STAGE?</div><div className="result-options stage-tap-options">{stage.taps.map(({ key, label }, index) => <button type="button" key={key} disabled={readOnly} className={`result-option stage-tap-option ${resultKey === key ? 'chosen' : ''}`} onClick={() => setResultKey(key)}><span className="tap-index">{index + 1}</span><span>{label}</span>{resultKey === key && <Check size={13} className="chosen-check" />}</button>)}</div>
                  {suggestionError && <div className="inline-warning">{suggestionError}</div>}
                  <div className="capture-actions"><button className="secondary-button" disabled={readOnly || busy === 'suggest'} onClick={getStageSuggestion}>{busy === 'suggest' ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />} Suggest stage with AI</button><button className="primary-button" disabled={readOnly || busy === 'save-stage'} onClick={() => persistStage(false)}>{busy === 'save-stage' ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} Save stage</button></div>
                </section>

                {suggestion && <section className="ai-suggestion-card"><div className="ai-card-top"><div className="ai-icon"><Bot size={18} /></div><div><h3>Stage suggestion</h3><p>{suggestion.aiMode === 'live' ? `Generated by ${suggestion.provider || 'your LLM'}` : 'Local fallback suggestion'}</p></div><span className="confidence-label">{Math.round((suggestion.confidence || 0) * 100)}% confidence</span><button className="plain-icon-button" onClick={() => setSuggestion(null)} aria-label="Dismiss suggestion"><X size={16} /></button></div><div className="suggested-stage-name">{suggestion.stageName}</div><p className="ai-rationale">{suggestion.rationale}</p><div className="next-move-box"><span>NEXT MOVE</span><p>{suggestion.suggestedNextMove}</p></div>{suggestion.aiMode === 'live' && <button className="text-action strong" onClick={applySuggestion}>Move to this stage <ArrowRight size={14} /></button>}</section>}

                <div className="stage-navigation"><button className="back-stage-button" onClick={goBack} disabled={selectedStageIndex === 0}><ArrowLeft size={15} /> Previous stage</button><span className="navigation-hint">{readOnly ? 'Review mode · changes are disabled' : 'Save your note before moving on'}</span><button className="next-stage-button" disabled={selectedStageIndex === STAGES.length - 1} onClick={goNext}>{savedStage ? 'Next stage' : 'Save & continue'} <ArrowRight size={15} /></button></div>
                {errorNote && <p className="inline-error bottom-error">{errorNote}</p>}
              </div>

              <aside className="right-rail"><section className="call-at-a-glance"><div className="right-card-heading"><h3>At a glance</h3><MoreHorizontal size={17} /></div><div className="progress-number-row"><div><strong>{Math.round((stagesReached / STAGES.length) * 100)}<small>%</small></strong><span>of stages saved</span></div><div className="progress-ring" style={{ '--progress': `${(stagesReached / STAGES.length) * 100}%` }}><span>{stagesReached}<small>/8</small></span></div></div><div className="wide-progress"><span style={{ width: `${(stagesReached / STAGES.length) * 100}%` }} /></div><div className="current-stage-summary"><span className="summary-stage-no">{String(stage.number).padStart(2, '0')}</span><div><small>CURRENT STAGE</small><strong>{stage.name}</strong></div></div><div className="next-stage-preview"><span className="next-preview-dot" /><div><small>COMING UP NEXT</small><strong>{selectedStageIndex < STAGES.length - 1 ? STAGES[selectedStageIndex + 1].name : 'Call outcome & wrap-up'}</strong></div></div></section>
                <section className="ai-coach-card"><div className="ai-coach-heading"><div className="coach-spark"><Sparkles size={17} /></div><div><h3>AI call coach</h3><span>{health?.llmConfigured ? 'READY TO ASSIST' : 'SETUP REQUIRED FOR LIVE AI'}</span></div></div><p>Get a second opinion on the stage or turn rough notes into clear, factual takeaways.</p><div className="coach-feature"><CheckCircle2 size={15} /><span>Stage classification</span></div><div className="coach-feature"><CheckCircle2 size={15} /><span>Notes cleanup</span></div><div className="coach-feature"><CheckCircle2 size={15} /><span>Call summary draft</span></div>{!health?.llmConfigured && <div className="coach-setup-note">Add your chosen provider key to Render to enable live AI.</div>}</section>
                <section className="call-hygiene-card"><div><CheckCircle2 size={16} /><strong>Be human, not robotic</strong></div><p>Use a prompt to stay grounded, not to read a script. Respect a clear “no” and never invent a commitment.</p></section>
              </aside>
            </div>
            <p className="workspace-footnote"><Mic2 size={13} /> Call Companion does not listen to or record your phone call. You enter notes manually.</p>
          </section>
        )}
      </main>

      {showCloseout && activeCall && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCloseout(false); }}><div className="closeout-modal" role="dialog" aria-modal="true" aria-labelledby="closeout-title"><div className="modal-top"><div className="modal-icon"><CheckCircle2 size={21} /></div><button className="plain-icon-button" onClick={() => setShowCloseout(false)} aria-label="Close"><X size={18} /></button></div><div className="eyebrow">CALL WRAP-UP</div><h2 id="closeout-title">Close out the conversation</h2><p>Capture the outcome and the next step while it is still fresh.</p><label className="field-label">CALL OUTCOME<select value={outcome} onChange={(e) => setOutcome(e.target.value)}>{OUTCOMES.map((item) => <option key={item}>{item}</option>)}</select></label><div className="summary-label-row"><label className="field-label">CALL SUMMARY <span>REVIEW BEFORE SAVING</span></label><button className="text-action" disabled={busy === 'summary'} onClick={generateSummary}>{busy === 'summary' ? <LoaderCircle className="spin" size={14} /> : <Sparkles size={14} />} Draft with AI</button></div><textarea className="summary-textarea" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What happened, what mattered, and where did the call end?" rows={4} maxLength={1200} /><label className="field-label follow-up-field">NEXT ACTION <span>OPTIONAL</span><input value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="e.g. Send case study and follow up Friday" maxLength={300} /></label>{errorNote && <p className="inline-error">{errorNote}</p>}<div className="modal-actions"><button className="secondary-button" onClick={() => setShowCloseout(false)}>Keep working</button><button className="primary-button" disabled={busy === 'close'} onClick={finishCall}>{busy === 'close' ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />} Close & save call</button></div><p className="modal-privacy"><BookmarkCheck size={13} /> You can review this call in Call history.</p></div></div>}

      {toast && <div className="toast" role="status"><CheckCircle2 size={17} /><span>{toast}</span><button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  );
}

export default App;
