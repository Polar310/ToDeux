/*
  Client-side Google OAuth2 (PKCE) helper.

  Usage:
    - Add `VITE_GOOGLE_CLIENT_ID` to your `.env` or Vite env config.
    - Add the redirect URI to your Google OAuth credentials (e.g. http://localhost:3000/oauth2callback.html)
    - Call `signInWithGoogle()` which returns an object with `access_token`, `refresh_token?`, and `expires_in`.

  Security notes:
    - This implements PKCE (no client secret required).
    - Storing refresh tokens in localStorage has security implications; consider using a server-side exchange for long-lived refresh tokens.
*/

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const randomString = (len = 32) => {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(n => (n % 36).toString(36)).join('');
};

const base64UrlEncode = (arrayBuffer: ArrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(hash);
};

// Opens a popup and awaits a postMessage from the popup with `type: 'oauth2callback'` and payload {code, state}
const openPopupAwaitMessage = (url: string, state: string, width = 500, height = 700) => {
  return new Promise<{ code: string; state: string }>((resolve, reject) => {
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(url, 'oauth2popup', `width=${width},height=${height},left=${left},top=${top}`);
    if (!popup) return reject(new Error('Popup blocked'));

    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      try { popup.close(); } catch(e) {}
      reject(new Error('OAuth timeout'));
    }, 1000 * 60 * 5);

    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.type !== 'oauth2callback') return;
      if (e.origin !== window.location.origin) return; // safety: only accept same-origin
      const { code, state: returnedState } = e.data;
      if (returnedState !== state) {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        try { popup.close(); } catch(e) {}
        return reject(new Error('OAuth state mismatch'));
      }
      clearTimeout(timeout);
      window.removeEventListener('message', handler);
      try { popup.close(); } catch(e) {}
      resolve({ code, state: returnedState });
    };

    window.addEventListener('message', handler);
  });
};

export async function signInWithGoogle(): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }>{
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set in environment');

  const redirectUri = `${window.location.origin}/oauth2callback.html`;
  const state = randomString(12);
  const codeVerifier = randomString(64);
  const codeChallenge = await sha256(codeVerifier);

  // store verifier by state temporarily
  sessionStorage.setItem(`pkce_verifier_${state}`, codeVerifier);

  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');
  const authUrl = `${GOOGLE_AUTH_URL}?response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256&access_type=offline&prompt=consent`;

  // open popup and wait for code
  const { code } = await openPopupAwaitMessage(authUrl, state);

  // exchange code for tokens
  const verifier = sessionStorage.getItem(`pkce_verifier_${state}`);
  if (!verifier) throw new Error('PKCE verifier missing');
  sessionStorage.removeItem(`pkce_verifier_${state}`);

  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    code_verifier: verifier,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  // store tokens (be mindful of security)
  if (data.access_token) localStorage.setItem('google_access_token', data.access_token);
  if (data.refresh_token) localStorage.setItem('google_refresh_token', data.refresh_token);
  if (data.expires_in) localStorage.setItem('google_token_expires_at', String(Date.now() + data.expires_in * 1000));

  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in };
}

export function getStoredGoogleAccessToken(): string | null {
  const token = localStorage.getItem('google_access_token');
  const expires = localStorage.getItem('google_token_expires_at');
  if (!token) return null;
  if (expires && Number(expires) < Date.now()) return null;
  return token;
}
