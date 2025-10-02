const API_BASE = '/api';

async function apiFetch(path, { method = 'GET', headers = {}, body, token } = {}) {
  const finalHeaders = { ...headers };
  if (body) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (token) {
    finalHeaders['X-Host-Token'] = token;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch (_) {
      const text = await response.text();
      message = text || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export function login(credentials) {
  return apiFetch('/host/login', { method: 'POST', body: credentials });
}

export function fetchState() {
  return apiFetch('/game/state');
}

export function shuffleParticipants(token) {
  return apiFetch('/game/shuffle', { method: 'POST', token });
}

export function unwrapGift(token, payload) {
  return apiFetch('/game/turn/unwrap', { method: 'POST', token, body: payload });
}

export function stealGift(token, payload) {
  return apiFetch('/game/turn/steal', { method: 'POST', token, body: payload });
}

export function passTurn(token, payload) {
  return apiFetch('/game/turn/pass', { method: 'POST', token, body: payload });
}

export function endGame(token) {
  return apiFetch('/game/turn/end', { method: 'POST', token });
}

export function resetGame(token) {
  return apiFetch('/game/reset', { method: 'POST', token });
}
