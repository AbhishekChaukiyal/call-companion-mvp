const API_BASE = (import.meta.env?.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const STORAGE_KEY = 'call-companion-local-calls-v1';

export const STAGES = [
  {
    "key": "opening",
    "number": 1,
    "name": "Opening",
    "purpose": "Reach the right person, say who you are, and earn a moment of attention. The prospect decides early whether this call is worth a minute.",
    "prompt": "Introduce yourself and your company plainly. Confirm you have the right person; if they are busy, agree a clear callback rather than pushing ahead.",
    "examples": [
      "Could you remind me who you are?",
      "I’m heading into a meeting; can we talk later?",
      "I don’t think this number belongs to the person you’re looking for."
    ],
    "taps": [
      {
        "key": "right_person",
        "label": "Reached the listed person"
      },
      {
        "key": "reception",
        "label": "Reception / assistant answered"
      },
      {
        "key": "unavailable",
        "label": "Busy — callback requested"
      },
      {
        "key": "wrong_person",
        "label": "Wrong person / left company"
      }
    ]
  },
  {
    "key": "purpose",
    "number": 2,
    "name": "Purpose",
    "purpose": "Explain in one or two sentences why you called, in words the prospect could repeat to a colleague.",
    "prompt": "Give a clear, specific reason for calling. If they ask what you do or why you have their number, answer directly instead of repeating a vague label.",
    "examples": [
      "What prompted your call?",
      "Can you explain what your company actually does?",
      "How did you find my contact details?"
    ],
    "taps": [
      {
        "key": "asked_reason",
        "label": "Asked what the call is about"
      },
      {
        "key": "asked_company",
        "label": "Asked what we do"
      },
      {
        "key": "asked_source",
        "label": "Asked where we got the number"
      },
      {
        "key": "purpose_understood",
        "label": "Purpose understood"
      }
    ]
  },
  {
    "key": "permission",
    "number": 3,
    "name": "Permission",
    "purpose": "Find out whether they are willing to talk now. A clear yes, a clear no, or a time to call back are all valid outcomes.",
    "prompt": "Look for an actual answer about timing. A request to call later is not permission to continue now; a short yes should not be treated as interest in the offer.",
    "examples": [
      "I can give you a minute; go ahead.",
      "Could you ring me after my meeting?",
      "Can you send a little context first?"
    ],
    "taps": [
      {
        "key": "permission_yes",
        "label": "Explicit yes — continue"
      },
      {
        "key": "callback_requested",
        "label": "Asked for a callback time"
      },
      {
        "key": "send_first",
        "label": "Asked for information first"
      },
      {
        "key": "permission_declined",
        "label": "Not willing to talk now"
      }
    ]
  },
  {
    "key": "their_business",
    "number": 4,
    "name": "Their business",
    "purpose": "Understand what the company does and the prospect’s part in it before saying much about your own company.",
    "prompt": "Listen for their industry, products, customers, remit, and corrections to your assumptions. Do not force their business into a story that does not fit.",
    "examples": [
      "We make components for commercial lighting.",
      "That work is handled by our head office.",
      "Most of our work is with public-sector customers."
    ],
    "taps": [
      {
        "key": "business_explained",
        "label": "Explained their business"
      },
      {
        "key": "assumption_corrected",
        "label": "Corrected our assumption"
      },
      {
        "key": "asked_about_caller",
        "label": "Asked us to explain ourselves"
      },
      {
        "key": "business_not_fit",
        "label": "Business context is not a fit"
      }
    ]
  },
  {
    "key": "their_need",
    "number": 5,
    "name": "Their need, in their words",
    "purpose": "Hear what they are trying to do or struggling with in their own words. This is the stage where the caller records exactly what was said.",
    "prompt": "Capture the prospect’s wording before interpreting it. Do not invent pain: a prospect who says the current business is working well may genuinely have no need.",
    "examples": [
      "We want to understand which product line has room to grow.",
      "Our current customer base is enough for now.",
      "Margins are tight on some of our orders."
    ],
    "taps": [
      {
        "key": "goal_stated",
        "label": "Stated a goal or challenge"
      },
      {
        "key": "no_need",
        "label": "Says things are fine / no need"
      },
      {
        "key": "asked_what_can_do",
        "label": "Asked what we could do"
      },
      {
        "key": "need_unclear",
        "label": "Need not established"
      }
    ]
  },
  {
    "key": "objection",
    "number": 6,
    "name": "Objection",
    "purpose": "Hear the reason for a no and understand it. A reason you understand can be answered now or next time; a reason you talked over cannot.",
    "prompt": "Acknowledge the concern first. If useful, ask one clarifying question; then respond briefly. Respect a clear refusal or request not to call.",
    "examples": [
      "Our group already works with an external consulting team.",
      "You’ll need to speak to the person who owns that area.",
      "Send a short overview first, then I’ll decide whether to revisit it."
    ],
    "taps": [
      {
        "key": "existing_solution",
        "label": "Already have a provider / team"
      },
      {
        "key": "wrong_contact",
        "label": "Not the right contact"
      },
      {
        "key": "written_info",
        "label": "Asked for written information"
      },
      {
        "key": "clear_no",
        "label": "Clear no / do not call"
      }
    ]
  },
  {
    "key": "next_step",
    "number": 7,
    "name": "Next step",
    "purpose": "Agree one concrete action: a document, a call at a named time, a meeting, or a referral. Name the action and its timing or channel.",
    "prompt": "Prefer the prospect’s time and channel. Distinguish an agreed action from a polite ‘send it’ with no stated follow-up or interest.",
    "examples": [
      "Try me Thursday afternoon.",
      "Send the overview to my work email.",
      "Our operations head is better placed to discuss this."
    ],
    "taps": [
      {
        "key": "meeting_time_agreed",
        "label": "Meeting / call time agreed"
      },
      {
        "key": "report_agreed",
        "label": "Report / information agreed"
      },
      {
        "key": "referral",
        "label": "Referred to another person"
      },
      {
        "key": "no_commitment",
        "label": "No concrete next step"
      }
    ]
  },
  {
    "key": "close",
    "number": 8,
    "name": "Close",
    "purpose": "End clearly and record what happened: the outcome, the next step, and the prospect’s words from stage 5. The record informs the next call.",
    "prompt": "Repeat the agreed action and timing, or record the refusal / disconnect accurately. A warm goodbye does not turn a no into a yes.",
    "examples": [
      "Let’s reconnect Tuesday afternoon.",
      "Thanks, but we’re not interested at present.",
      "I’m losing the connection; please try another time."
    ],
    "taps": [
      {
        "key": "commitment_confirmed",
        "label": "Commitment confirmed"
      },
      {
        "key": "declined",
        "label": "Declined / not interested"
      },
      {
        "key": "line_dropped",
        "label": "Line dropped / disconnected"
      },
      {
        "key": "outcome_mismatch",
        "label": "Logged outcome may not match"
      }
    ]
  }
];

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function writeLocal(calls) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(calls)); } catch { /* Storage may be blocked. */ }
}
function localId() { return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function normalizeStage(row) {
  return {
    id: row.id, stageKey: row.stage_key || row.stageKey, stageName: row.stage_name || row.stageName,
    resultKey: row.result_key || row.resultKey || 'noted', prospectWords: row.prospect_words || row.prospectWords || '',
    callerNotes: row.caller_notes || row.callerNotes || '', createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}
function normalizeCall(row) {
  return {
    id: row.id, prospectName: row.prospect_name ?? row.prospectName ?? 'Prospect',
    company: row.company || '', prospectRole: row.prospect_role ?? row.prospectRole ?? '',
    status: row.status || 'active', stageKey: row.current_stage_key ?? row.stageKey ?? 'opening',
    outcome: row.outcome || '', summary: row.summary || '',
    startedAt: row.started_at ?? row.startedAt ?? new Date().toISOString(),
    endedAt: row.ended_at ?? row.endedAt ?? null,
    stages: (row.call_stage_results || row.stages || []).map(normalizeStage),
    persistence: row.id?.startsWith('local-') ? 'local' : 'cloud'
  };
}
function saveLocalCall(call) {
  const calls = readLocal();
  const index = calls.findIndex((item) => item.id === call.id);
  if (index >= 0) calls[index] = call;
  else calls.unshift(call);
  writeLocal(calls);
}
function localStageGuess(text, currentStage) {
  const s = text.toLowerCase();
  // A deterministic fallback only: use explicit cues first, otherwise retain context.
  if (/wrong number|left the company|no longer (?:work|working) here|number belongs to someone else/.test(s)) return 'opening';
  if (/not the right person|not the relevant person|not the decision maker/.test(s) && currentStage === 'opening') return 'opening';
  if (/meeting booked|google meet|calendar invite|next week|tomorrow at|(?:monday|tuesday|wednesday|thursday|friday) (?:at|around|morning|afternoon)|call me (?:on|at) \d|let.s reconnect/.test(s)) return 'next_step';
  if (/do not call|don't call|not interested|no interest|not required|not a fit|not looking|already have (?:a |an |our )?(?:consultant|agency|vendor|team|partner)|already (?:have|has) (?:an? )?(?:internal|in-house|group) team|our group already has an internal team|internal team handling this work|global (?:consultant|team)|not the right person|not the relevant person|not the decision maker/.test(s)) return 'objection';
  if (/i want to|we want to|we need to|looking to|plan to|planning to|struggling|challenge|margin|grow|growth|new market|new product|capacity|new customers|no particular need|no need|do not need|don't need|dont need|do not require|don't require|dont require|nothing (?:more )?we need|customers are enough|customer base is enough|business is fine|we are fine|everything is fine/.test(s)) return 'their_need';
  if (/we manufacture|we are a |our business|our products|we work with|we serve|we deal in|we primarily|government clients|head office drives/.test(s)) return 'their_business';
  if (/go ahead|right time|good time|call (?:me )?later|call (?:me )?after|busy right now|in a meeting|driving|travelling|not now|send a little context first/.test(s)) return 'permission';
  if (/what is this regarding|what is this about|what do you do|what does your company do|where did you get (?:my|this) number|how did you get (?:my|this) number|why are you calling|what is it about|what prompted your call/.test(s)) return 'purpose';
  if (/who is this|speaking|hello|reception|switchboard/.test(s)) return 'opening';
  if (/send (?:the )?(?:overview|report|details|information) to (?:my )?(?:work )?email|send it on whatsapp|send the report|send the profile|send me the details/.test(s)) return 'next_step';
  if (/thank you|thanks|bye|goodbye|line dropped|not audible|can't hear|cannot hear|voice is breaking|losing the connection/.test(s)) return 'close';
  return STAGES.some((stage) => stage.key === currentStage) ? currentStage : 'their_business';
}

export async function getHealth() {
  try { return await request('/health'); } catch { return null; }
}

export async function startCall(payload) {
  try {
    const { call } = await request('/api/calls', { method: 'POST', body: JSON.stringify(payload) });
    return { call: normalizeCall(call), persistence: 'cloud' };
  } catch {
    const call = normalizeCall({ id: localId(), ...payload, status: 'active', current_stage_key: 'opening', started_at: new Date().toISOString(), call_stage_results: [] });
    saveLocalCall(call);
    return { call, persistence: 'local' };
  }
}

export async function listCalls() {
  const localCalls = readLocal().map(normalizeCall);
  try {
    const { calls } = await request('/api/calls?limit=100');
    // Keep browser-only demo calls visible if the backend becomes available again.
    const cloudCalls = calls.map(normalizeCall);
    const byId = new Map(cloudCalls.map((call) => [call.id, call]));
    for (const call of localCalls) byId.set(call.id, call);
    const merged = [...byId.values()].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    return { calls: merged, persistence: 'cloud' };
  } catch {
    return { calls: localCalls.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)), persistence: 'local' };
  }
}

export async function saveStage(call, payload) {
  const stage = STAGES.find((item) => item.key === payload.stageKey) || STAGES[0];
  if (!String(call.id).startsWith('local-')) {
    // Do not silently switch a cloud call to local storage after an API error: that
    // can make the caller believe a note was saved when it was not persisted remotely.
    await request(`/api/calls/${call.id}/stages`, {
      method: 'POST', body: JSON.stringify(payload)
    });
    const stages = call.stages.filter((item) => item.stageKey !== payload.stageKey);
    stages.push({ ...payload, stageName: stage.name, updatedAt: new Date().toISOString() });
    return { call: { ...call, stageKey: payload.stageKey, stages, persistence: 'cloud' }, persistence: 'cloud' };
  }
  const stages = call.stages.filter((item) => item.stageKey !== payload.stageKey);
  stages.push({ ...payload, stageName: stage.name, updatedAt: new Date().toISOString() });
  const updated = { ...call, stageKey: payload.stageKey, stages, persistence: 'local' };
  saveLocalCall(updated);
  return { call: updated, persistence: 'local' };
}

export async function closeCall(call, payload) {
  if (!String(call.id).startsWith('local-')) {
    // A failed cloud closeout must remain visible as an error so the caller can retry.
    const { call: saved } = await request(`/api/calls/${call.id}/close`, { method: 'POST', body: JSON.stringify(payload) });
    const updated = normalizeCall({ ...call, ...saved, call_stage_results: call.stages });
    return { call: updated, persistence: 'cloud' };
  }
  const updated = { ...call, ...payload, status: 'completed', endedAt: new Date().toISOString(), persistence: 'local' };
  saveLocalCall(updated);
  return { call: updated, persistence: 'local' };
}

export async function suggestStage(text, currentStage) {
  try {
    const data = await request('/api/ai/suggest-stage', { method: 'POST', body: JSON.stringify({ text, currentStage }) });
    return { ...data, aiMode: 'live' };
  } catch {
    const stage = STAGES.find((item) => item.key === localStageGuess(text, currentStage)) || STAGES[3];
    return {
      stageKey: stage.key, stageName: stage.name, confidence: 0.45,
      rationale: 'A local keyword fallback was used because the API/LLM was unreachable.',
      suggestedNextMove: stage.prompt, provider: 'local fallback', aiMode: 'fallback'
    };
  }
}

export async function structureStage(text, stageKey) {
  return request('/api/ai/structure-stage', { method: 'POST', body: JSON.stringify({ text, stageKey }) });
}

export async function summarizeCall(call) {
  return request('/api/ai/summarize-call', {
    method: 'POST', body: JSON.stringify({ call, stages: call.stages })
  });
}
