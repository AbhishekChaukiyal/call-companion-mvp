import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { STAGES } from './stages.js';

const app = express();
app.set('trust proxy', 1);
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS. Add your Vercel URL to FRONTEND_ORIGIN.'));
  }
}));
app.use(express.json({ limit: '30kb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/ai/', rateLimit({ windowMs: 60_000, limit: 15, standardHeaders: 'draft-7', legacyHeaders: false }));

const supabaseReady = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = supabaseReady
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

const isText = (value, max = 3000) => typeof value === 'string' && value.length <= max;
const trimText = (value, max = 3000) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const stageKeys = new Set(STAGES.map((stage) => stage.key));

function requireDatabase(_req, res, next) {
  if (!supabase) return res.status(503).json({ error: 'Database is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the backend environment.' });
  next();
}

function extractJson(text) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('The AI response was not valid JSON. Try again.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callLlm(systemPrompt, userPrompt) {
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  const aborter = new AbortController();
  const timer = setTimeout(() => aborter.abort(), 18_000);
  try {
    let response;
    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini is selected but GEMINI_API_KEY is missing in the backend environment.');
      const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', signal: aborter.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || `Gemini request failed (${response.status}).`);
      return data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    }

    let apiKey; let baseUrl; let model;
    if (provider === 'cerebras') {
      apiKey = process.env.CEREBRAS_API_KEY;
      baseUrl = 'https://api.cerebras.ai/v1/chat/completions';
      model = process.env.CEREBRAS_MODEL || 'llama-3.3-70b';
    } else if (provider === 'mistral') {
      apiKey = process.env.MISTRAL_API_KEY;
      baseUrl = 'https://api.mistral.ai/v1/chat/completions';
      model = process.env.MISTRAL_MODEL || 'mistral-small-latest';
    } else {
      throw new Error('LLM_PROVIDER must be gemini, cerebras, or mistral.');
    }
    if (!apiKey) throw new Error(`${provider} is selected but its API key is missing in the backend environment.`);
    response = await fetch(baseUrl, {
      method: 'POST', signal: aborter.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `${provider} request failed (${response.status}).`);
    return data?.choices?.[0]?.message?.content || '';
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The AI provider took too long to respond. Try once more.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

const stagePromptList = STAGES.map(({ key, name, purpose }) => `${key}: ${name} — ${purpose}`).join('\n');

app.get('/health', (_req, res) => res.json({
  status: 'ok', service: 'call-companion-api', timestamp: new Date().toISOString(),
  databaseConfigured: supabaseReady,
  llmProvider: process.env.LLM_PROVIDER || 'gemini',
  llmConfigured: Boolean(
    ((process.env.LLM_PROVIDER || 'gemini').toLowerCase() === 'gemini' && process.env.GEMINI_API_KEY) ||
    ((process.env.LLM_PROVIDER || '').toLowerCase() === 'cerebras' && process.env.CEREBRAS_API_KEY) ||
    ((process.env.LLM_PROVIDER || '').toLowerCase() === 'mistral' && process.env.MISTRAL_API_KEY)
  )
}));

app.get('/api/stages', (_req, res) => res.json({ stages: STAGES }));

app.post('/api/calls', requireDatabase, async (req, res, next) => {
  try {
    const prospectName = trimText(req.body?.prospectName, 120) || 'Prospect';
    const company = trimText(req.body?.company, 160);
    const prospectRole = trimText(req.body?.prospectRole, 160);
    const { data, error } = await supabase.from('calls').insert({
      prospect_name: prospectName, company, prospect_role: prospectRole,
      status: 'active', current_stage_key: 'opening'
    }).select('*').single();
    if (error) throw error;
    res.status(201).json({ call: data });
  } catch (error) { next(error); }
});

app.get('/api/calls', requireDatabase, async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit || 50);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
    const { data, error } = await supabase.from('calls')
      .select('*, call_stage_results(*)').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    res.json({ calls: data || [] });
  } catch (error) { next(error); }
});

app.get('/api/calls/:id', requireDatabase, async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('calls')
      .select('*, call_stage_results(*)').eq('id', req.params.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Call not found.' });
      throw error;
    }
    res.json({ call: data });
  } catch (error) { next(error); }
});

app.post('/api/calls/:id/stages', requireDatabase, async (req, res, next) => {
  try {
    const { stageKey, resultKey = 'noted', prospectWords = '', callerNotes = '' } = req.body || {};
    const stage = STAGES.find((item) => item.key === stageKey);
    if (!stage) return res.status(400).json({ error: 'Choose a valid call stage.' });
    if (!isText(prospectWords, 3000) || !isText(callerNotes, 2000)) {
      return res.status(400).json({ error: 'Notes are too long.' });
    }
    const allowedResults = new Set(stage.taps.map((tap) => tap.key));
    if (!allowedResults.has(resultKey)) return res.status(400).json({ error: 'Choose one of the results listed for this stage.' });
    const { data: call, error: callError } = await supabase.from('calls')
      .select('id,status').eq('id', req.params.id).single();
    if (callError || !call) return res.status(404).json({ error: 'Call not found.' });
    if (call.status !== 'active') return res.status(409).json({ error: 'This call has already been closed.' });

    const { data, error } = await supabase.from('call_stage_results').upsert({
      call_id: req.params.id,
      stage_key: stage.key,
      stage_name: stage.name,
      result_key: resultKey,
      prospect_words: trimText(prospectWords, 3000),
      caller_notes: trimText(callerNotes, 2000),
      updated_at: new Date().toISOString()
    }, { onConflict: 'call_id,stage_key' }).select('*').single();
    if (error) throw error;
    const { error: updateError } = await supabase.from('calls')
      .update({ current_stage_key: stage.key }).eq('id', req.params.id);
    if (updateError) throw updateError;
    res.status(201).json({ stageResult: data });
  } catch (error) { next(error); }
});

app.post('/api/calls/:id/close', requireDatabase, async (req, res, next) => {
  try {
    const outcome = trimText(req.body?.outcome, 80);
    const summary = trimText(req.body?.summary, 1200);
    const allowedOutcomes = new Set(['Next step agreed', 'Follow-up agreed', 'Report / information agreed', 'Interested — no concrete next step', 'Not interested', 'Do not call', 'Wrong person', 'Moved company', 'Call again / connection issue', 'Not logged / unclear']);
    if (!allowedOutcomes.has(outcome)) return res.status(400).json({ error: 'Choose a valid call outcome.' });
    const { data, error } = await supabase.from('calls').update({
      status: 'completed', outcome, summary, ended_at: new Date().toISOString()
    }).eq('id', req.params.id).eq('status', 'active').select('*').single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(409).json({ error: 'Call not found or already closed.' });
      throw error;
    }
    res.json({ call: data });
  } catch (error) { next(error); }
});

app.post('/api/ai/suggest-stage', async (req, res, next) => {
  try {
    const text = trimText(req.body?.text, 3000);
    if (!text || text.length < 4) return res.status(400).json({ error: 'Enter a few words from the prospect first.' });
    const currentStage = trimText(req.body?.currentStage, 80) || 'unknown';
    const raw = await callLlm(
      `You are a careful assistant for a human cold caller. Classify the latest prospect statement into the best-fitting stage of this exact eight-stage call framework. Use the surrounding/current stage as context and do not classify from keywords alone. A callback requested because the person is busy is Permission; a specific agreed follow-up time is Next step. A request for written information can be an Objection when it deflects a conversation, or Next step when a concrete handoff/channel is agreed. A polite yes to receiving a document is not proof of buying interest. Respect explicit no/do-not-call signals. If the words are too generic to classify confidently, return a low confidence instead of inventing context. Use only these stage keys:\n${stagePromptList}\nReturn valid JSON only with keys: stage_key, confidence (number 0 to 1), rationale (one short sentence), suggested_next_move (one concise sentence). If ambiguous, choose the best fit with a lower confidence.`,
      `Current stage: ${currentStage}\nProspect's latest words or call note:\n${text}`
    );
    const parsed = extractJson(raw);
    if (!stageKeys.has(parsed.stage_key)) throw new Error('The AI returned an unknown stage. Try again.');
    const stage = STAGES.find((item) => item.key === parsed.stage_key);
    res.json({
      stageKey: stage.key, stageName: stage.name,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      rationale: trimText(parsed.rationale, 300),
      suggestedNextMove: trimText(parsed.suggested_next_move, 300),
      provider: process.env.LLM_PROVIDER || 'gemini'
    });
  } catch (error) { next(error); }
});

app.post('/api/ai/structure-stage', async (req, res, next) => {
  try {
    const text = trimText(req.body?.text, 3000);
    const stageKey = trimText(req.body?.stageKey, 80);
    const stage = STAGES.find((item) => item.key === stageKey);
    if (!stage || !text) return res.status(400).json({ error: 'Select a stage and enter the prospect’s words or rough notes.' });
    const raw = await callLlm(
      `You help a caller clean up the prospect's own words without changing the meaning. Do not invent details, names, commitments, or sentiment. The screen has one free-text box for the prospect's words and a separate quick tap for what happened. Return valid JSON only with keys prospect_words (a faithful cleaned version) and result_key. Choose result_key only from these options for the current stage: ${JSON.stringify(stage.taps)}. If the note does not clearly indicate one, choose the first option.`,
      `Stage: ${stage.name}\nRaw notes: ${text}`
    );
    const parsed = extractJson(raw);
    const allowedResults = new Set(stage.taps.map((tap) => tap.key));
    res.json({
      prospectWords: trimText(parsed.prospect_words, 3000) || text,
      resultKey: allowedResults.has(parsed.result_key) ? parsed.result_key : stage.taps[0].key,
      provider: process.env.LLM_PROVIDER || 'gemini'
    });
  } catch (error) { next(error); }
});

app.post('/api/ai/summarize-call', async (req, res, next) => {
  try {
    const call = req.body?.call || {};
    const stages = Array.isArray(req.body?.stages) ? req.body.stages.slice(0, 8) : [];
    if (!stages.length) return res.status(400).json({ error: 'Save at least one stage note before drafting a summary.' });
    const compactStages = stages.map((item) => ({
      stage: trimText(item.stage_name || item.stageName, 80),
      result: trimText(item.result_key || item.resultKey, 50),
      prospectWords: trimText(item.prospect_words || item.prospectWords, 700),
      callerNotes: trimText(item.caller_notes || item.callerNotes, 500)
    }));
    const raw = await callLlm(
      'Write an accurate cold-call summary for a CRM. Do not invent missing facts or imply a commitment that is not present. A request to receive a report is not proof of strong interest. Respect explicit refusals and do-not-call requests. Return valid JSON only with keys summary (maximum 3 short sentences), outcome_suggestion (choose exactly one from the allowed options supplied in the user message), follow_up (one concise action or an empty string).',
      `Allowed outcomes: ${JSON.stringify(['Next step agreed', 'Follow-up agreed', 'Report / information agreed', 'Interested — no concrete next step', 'Not interested', 'Do not call', 'Wrong person', 'Moved company', 'Call again / connection issue', 'Not logged / unclear'])}\nProspect: ${trimText(call.prospect_name || call.prospectName, 120) || 'Prospect'}\nCompany: ${trimText(call.company, 160)}\nSaved stage notes:\n${JSON.stringify(compactStages)}`
    );
    const parsed = extractJson(raw);
    const outcomes = new Set(['Next step agreed', 'Follow-up agreed', 'Report / information agreed', 'Interested — no concrete next step', 'Not interested', 'Do not call', 'Wrong person', 'Moved company', 'Call again / connection issue', 'Not logged / unclear']);
    res.json({
      summary: trimText(parsed.summary, 1200),
      outcomeSuggestion: outcomes.has(parsed.outcome_suggestion) ? parsed.outcome_suggestion : 'Not logged / unclear',
      followUp: trimText(parsed.follow_up, 300),
      provider: process.env.LLM_PROVIDER || 'gemini'
    });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  // Keep credentials/provider internals out of client-facing errors.
  const message = error?.message || 'Unexpected server error.';
  const status = /Origin is not allowed/.test(message) ? 403 : 500;
  if (process.env.NODE_ENV !== 'production') console.error('[api error]', error);
  res.status(status).json({ error: message.slice(0, 500) });
});

app.listen(port, () => console.log(`Call Companion API listening on ${port}`));
