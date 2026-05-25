import React, { useEffect, useRef, useState } from 'react';

type TurnstileInstance = {
  render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

type TurnstileWidgetProps = {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
  refreshTrigger?: number;
  className?: string;
};

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';

const getTurnstileErrorMessage = (errorCode?: string) => {
  if (!errorCode) {
    return 'Captcha could not verify. Please try again.';
  }

  if (errorCode.startsWith('110100') || errorCode.startsWith('110110') || errorCode.startsWith('400020')) {
    return 'Captcha site key is invalid. Check the Cloudflare Turnstile site key.';
  }

  if (errorCode.startsWith('110200')) {
    return 'Captcha domain is not authorized. Add this domain to the Turnstile widget in Cloudflare.';
  }

  if (errorCode.startsWith('200500')) {
    return 'Captcha could not load. Please disable blockers for challenges.cloudflare.com and retry.';
  }

  if (errorCode.startsWith('600')) {
    return 'Captcha challenge failed. It is retrying; disable VPN/ad blockers if it keeps failing.';
  }

  return `Captcha could not verify. Please try again. (${errorCode})`;
};

const ensureTurnstileScript = (): Promise<void> => {
  if (window.turnstile) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

    const waitForTurnstile = () => {
      const startedAt = Date.now();
      const timeoutMs = 6000;

      const check = () => {
        if (window.turnstile) {
          resolve();
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error('Turnstile API did not become available in time'));
          return;
        }

        window.setTimeout(check, 50);
      };

      check();
    };

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        waitForTurnstile();
        return;
      }

      existingScript.addEventListener('load', () => waitForTurnstile());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Turnstile script')));
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      waitForTurnstile();
    };
    script.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(script);
  });
};

const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  siteKey,
  onTokenChange,
  refreshTrigger = 0,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const previousRefreshTriggerRef = useRef(refreshTrigger);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    let mounted = true;

    ensureTurnstileScript()
      .then(() => {
        if (!mounted) {
          return;
        }

        setIsReady(true);
      })
      .catch((error: Error) => {
        if (!mounted) {
          return;
        }

        console.error('Turnstile script load error:', error);
        setLoadError('Captcha failed to load. Please refresh the page.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !window.turnstile || !containerRef.current || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: 'dark',
      retry: 'auto',
      'retry-interval': 8000,
      'refresh-expired': 'auto',
      callback: (token: string) => {
        setWidgetError(null);
        onTokenChangeRef.current(token);
      },
      'expired-callback': () => {
        setWidgetError('Captcha expired. Please verify again.');
        onTokenChangeRef.current(null);
      },
      'timeout-callback': () => {
        setWidgetError('Captcha timed out. Please verify again.');
        onTokenChangeRef.current(null);
      },
      'unsupported-callback': () => {
        setWidgetError('Captcha is not supported in this browser. Please update your browser.');
        onTokenChangeRef.current(null);
      },
      'error-callback': (errorCode?: string) => {
        setWidgetError(getTurnstileErrorMessage(errorCode));
        onTokenChangeRef.current(null);
        return true;
      }
    });

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = null;
    };
  }, [isReady, siteKey]);

  useEffect(() => {
    if (previousRefreshTriggerRef.current === refreshTrigger) {
      return;
    }

    previousRefreshTriggerRef.current = refreshTrigger;

    if (!window.turnstile || !widgetIdRef.current) {
      return;
    }

    onTokenChangeRef.current(null);
    setWidgetError(null);
    window.turnstile.reset(widgetIdRef.current);
  }, [refreshTrigger]);

  const handleRetry = () => {
    setWidgetError(null);
    onTokenChangeRef.current(null);

    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  if (loadError) {
    return <p className="text-xs text-red-400">{loadError}</p>;
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center">
        <div ref={containerRef} />
        {widgetError && (
          <div className="mt-2 flex flex-col items-center gap-2 text-center">
            <p className="max-w-xs text-xs text-red-400">{widgetError}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-md border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
            >
              Retry captcha
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnstileWidget;
