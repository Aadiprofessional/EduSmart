/**
 * imaLoader.ts
 *
 * Async loader for the Google IMA SDK (ima3.js).
 * Waits for window.google.ima to be ready. If the script is not yet in the
 * document (e.g. stripped by an ad blocker), it injects it dynamically and
 * polls until the SDK initialises or times out.
 */

const IMA_SDK_URL = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
const LOAD_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 100;

let loadPromise: Promise<any> | null = null;

export function loadImaSDK(): Promise<any> {
  // Already resolved
  if ((window as any)?.google?.ima) {
    return Promise.resolve((window as any).google.ima);
  }

  // Return the existing in-flight promise so we only ever load once
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<any>((resolve, reject) => {
    const deadline = Date.now() + LOAD_TIMEOUT_MS;

    // Poll helper — used whether the script was already present or just injected
    const poll = () => {
      if ((window as any)?.google?.ima) {
        resolve((window as any).google.ima);
        return;
      }
      if (Date.now() > deadline) {
        loadPromise = null;
        reject(new Error('IMA SDK load timeout — the script may be blocked by an ad blocker.'));
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };

    // If the <script> tag is already in the page (added via index.html) just poll
    const existing = document.querySelector(`script[src*="ima3.js"]`);
    if (existing) {
      poll();
      return;
    }

    // Otherwise inject the script dynamically
    const script = document.createElement('script');
    script.src = IMA_SDK_URL;
    script.async = true;
    script.onload = poll;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to fetch the IMA SDK — it may be blocked by an ad blocker.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
