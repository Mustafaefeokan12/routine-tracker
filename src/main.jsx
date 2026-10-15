import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Automatic In-Place Hot-Update Engine for PWA & iOS Safari
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Check GitHub server for newly deployed builds
  const checkForLiveUpdate = async () => {
    try {
      // 1. Force SW update check without using browser HTTP cache
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update().catch(() => {});
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }

      // 2. Fetch fresh index.html directly from GitHub bypassing all browser & CDN caches
      const res = await fetch('./index.html?_t=' + Date.now(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) return;
      const html = await res.text();

      // Extract script filename from live HTML (e.g. index-ABC123.js)
      const match = html.match(/src="(\.\/assets\/index-[^"]+\.js)"/);
      if (match && match[1]) {
        const liveScript = match[1];
        const currentScriptTag = document.querySelector('script[src*="/assets/index-"]');
        const currentScript = currentScriptTag ? currentScriptTag.getAttribute('src') : null;

        // If a new build is deployed on GitHub, purge caches and reload automatically
        if (currentScript && liveScript && currentScript !== liveScript) {
          console.log('[AutoUpdate] Newer version found:', liveScript, 'Reloading app...');
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          window.location.reload();
        }
      }
    } catch {
      // Silent catch for offline moments
    }
  };

  // Register service worker with updateViaCache: 'none' (disallows 10-minute HTTP disk caching)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
        reg.update().catch(() => {});

        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      }).catch((err) => {
        console.warn('SW registration failed:', err);
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Check for updates 2 seconds after load
      setTimeout(checkForLiveUpdate, 2000);

      // Check every 15 seconds in background
      setInterval(checkForLiveUpdate, 15000);

      // Check immediately when user unlocks phone or switches back to app tab
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkForLiveUpdate();
        }
      });
      window.addEventListener('focus', checkForLiveUpdate);
    });
  }
}
