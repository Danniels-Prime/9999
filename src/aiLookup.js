const LOOKUP_SYSTEM = `You are a concise English-Spanish dictionary. Reply with ONLY valid JSON, no extra text:
{"es":"Spanish translation","def":"Brief English definition (max 8 words)","ex":"One short natural example sentence"}`;

const TRANSLATE_SYSTEM = `Translate the following English text to natural conversational Spanish. Reply with ONLY the Spanish translation, no labels or extra text.`;

async function callClaudeAI(key, systemPrompt, userMsg, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`); }
  const d = await res.json();
  return d?.content?.[0]?.text;
}

async function callOpenAICompatAI(endpoint, key, model, systemPrompt, userMsg, maxTokens) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
    }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`); }
  const d = await res.json();
  return d?.choices?.[0]?.message?.content;
}

function callAI(systemPrompt, userMsg, cfg, maxTokens) {
  const { provider, claudeKey, openaiKey, openrouterKey, deepseekKey, customEndpoint, customKey, customModel } = cfg;
  if (provider === 'claude' && claudeKey)
    return callClaudeAI(claudeKey, systemPrompt, userMsg, maxTokens);
  if (provider === 'openai' && openaiKey)
    return callOpenAICompatAI('https://api.openai.com/v1/chat/completions', openaiKey, 'gpt-4o-mini', systemPrompt, userMsg, maxTokens);
  if (provider === 'openrouter' && openrouterKey)
    return callOpenAICompatAI('https://openrouter.ai/api/v1/chat/completions', openrouterKey, 'mistralai/mistral-7b-instruct:free', systemPrompt, userMsg, maxTokens);
  if (provider === 'deepseek' && deepseekKey)
    return callOpenAICompatAI('https://api.deepseek.com/chat/completions', deepseekKey, 'deepseek-chat', systemPrompt, userMsg, maxTokens);
  if (provider === 'custom' && customKey && customEndpoint && customModel)
    return callOpenAICompatAI(customEndpoint, customKey, customModel, systemPrompt, userMsg, maxTokens);
  throw new Error('no_key');
}

export async function lookupWordAI(word, cfg) {
  const raw = await callAI(LOOKUP_SYSTEM, `Word or phrase: "${word}"`, cfg, 120);
  const match = raw?.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error('Could not parse response');
  return JSON.parse(match[0]);
}

export async function translateTextAI(text, cfg) {
  return callAI(TRANSLATE_SYSTEM, text, cfg, 220);
}
