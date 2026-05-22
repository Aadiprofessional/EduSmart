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
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      callback: (token: string) => {
        onTokenChange(token);
      },
      'expired-callback': () => {
        onTokenChange(null);
      },
      'error-callback': () => {
        onTokenChange(null);
      }
    });

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = null;
    };
  }, [isReady, onTokenChange, siteKey]);

  useEffect(() => {
    if (!window.turnstile || !widgetIdRef.current) {
      return;
    }

    onTokenChange(null);
    window.turnstile.reset(widgetIdRef.current);
  }, [onTokenChange, refreshTrigger]);

  if (loadError) {
    return <p className="text-xs text-red-400">{loadError}</p>;
  }

  return (
    <div className={className}>
      <div ref={containerRef} />
    </div>
  );
};

export default TurnstileWidget;