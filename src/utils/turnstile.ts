const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export const getTurnstileSiteKey = () => process.env.REACT_APP_TURNSTILE_SITE_KEY?.trim() ?? '';

export const isLocalhostTurnstileBypass = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return LOCALHOST_HOSTNAMES.has(window.location.hostname);
};

export const getTurnstileBypassToken = () => 'localhost-bypass';