// Browser Use Cloud: start and stop a cloud browser that carries the saved Google login (a "profile").
const BASE = 'https://api.browser-use.com/api/v3';

async function api(env, path, method = 'GET', body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'X-Browser-Use-API-Key': env.BROWSER_USE_API_KEY, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Browser Use API ${method} ${path} -> HTTP ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

export const startBrowser = (env, minutes = 10) => api(env, '/browsers', 'POST', { profileId: env.FLOW_PROFILE_ID, timeout: minutes });
export const stopBrowser = (env, id) => api(env, `/browsers/${id}`, 'PATCH', { action: 'stop' }).catch(() => null);
export const getBrowser = (env, id) => api(env, `/browsers/${id}`);
export const getProfile = (env) => api(env, `/profiles/${env.FLOW_PROFILE_ID}`);
