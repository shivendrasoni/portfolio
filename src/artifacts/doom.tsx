import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Dosbox?: any;
    $?: any;
    jQuery?: any;
  }
}

const Doom: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dosboxInstanceRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let jqueryScript: HTMLScriptElement | null = null;
    let dosScript: HTMLScriptElement | null = null;

    const initializeDoom = () => {
      try {
        if (!window.Dosbox) {
          setError('Dosbox API not available.');
          return;
        }

        // Create instance and run DOOM from external zip
        const instance = new window.Dosbox({
          id: 'dosbox',
          onload: (db: any) => {
            try {
              db.run('https://js-dos.com/upload/DOOM-@evilution.zip', './doom');
              setIsReady(true);
            } catch (e: any) {
              setError(e?.message || 'Failed to start DOOM.');
            }
          },
          onrun: (_db: any, app: string) => {
            // eslint-disable-next-line no-console
            console.log(`App "${app}" is running`);
          }
        });

        dosboxInstanceRef.current = instance;
      } catch (e: any) {
        setError(e?.message || 'Failed to initialize Dosbox.');
      }
    };

    const loadDosApi = () => {
      if (window.Dosbox) {
        initializeDoom();
        return;
      }
      dosScript = document.createElement('script');
      dosScript.src = 'https://js-dos.com/cdn/js-dos-api.js';
      dosScript.async = true;
      dosScript.onload = () => initializeDoom();
      dosScript.onerror = () => setError('Failed to load js-dos API script.');
      document.body.appendChild(dosScript);
    };

    if (!window.$ && !window.jQuery) {
      jqueryScript = document.createElement('script');
      jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
      jqueryScript.async = true;
      jqueryScript.onload = () => loadDosApi();
      jqueryScript.onerror = () => {
        // If jQuery fails, still try to load Dos API in case CDN has inline fallback
        loadDosApi();
      };
      document.body.appendChild(jqueryScript);
    } else {
      loadDosApi();
    }

    return () => {
      // Leave scripts in place to allow fast back/forward nav
      dosboxInstanceRef.current = null;
    };
  }, []);

  const requestFullScreen = () => {
    try {
      dosboxInstanceRef.current?.requestFullScreen?.();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <a href="/" className="text-green-300 hover:text-white underline">← Back to Terminal</a>
          <div className="text-green-300">DOOM via js-dos</div>
        </div>

        <div className="bg-neutral-900 p-3 rounded border border-neutral-800">
          {/* Inline styles for js-dos overlay background */}
          <style>
            {`.dosbox-container { width: 640px; height: 400px; }
               .dosbox-container > .dosbox-overlay {
                 background-image: url(https://js-dos.com/cdn/DOOM.png);
                 background-repeat: no-repeat;
                 background-position: center center;
                 background-size: contain;
               }`}
          </style>

          <div className="flex flex-col items-center">
            <div id="dosbox" ref={containerRef} className="dosbox-container" />

            <div className="mt-3 flex gap-2">
              <button onClick={requestFullScreen} className="px-3 py-1 bg-green-800 hover:bg-green-700 text-green-100 rounded">
                Fullscreen
              </button>
              <a
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded"
                href="https://js-dos.com/DOOM/"
                target="_blank"
                rel="noreferrer"
              >
                Source Page
              </a>
            </div>

            {!isReady && !error && (
              <div className="mt-4 text-sm text-green-300">Loading js-dos and DOOM…</div>
            )}
            {error && (
              <div className="mt-4 text-sm text-red-400">{error}</div>
            )}
          </div>
        </div>

        <div className="mt-6 text-sm text-green-300">
          Controls: Move: Arrow keys • Use: W • Fire: S • Speed on: Space • Strafe on: Alt • Strafe: A/D
        </div>
      </div>
    </div>
  );
};

export default Doom;


