import React, { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Apple Minimalist Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Crash Error:', error, errorInfo);
  }

  handleRestart = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
          <div className="max-w-sm w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
            <div className="text-4xl mb-3">⚠️</div>
            <h1 className="text-lg font-bold tracking-tight mb-1">
              Budget Başlatılamadı
            </h1>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Uygulama yüklenirken bir sorun oluştu. Verileriniz güvendedir.
            </p>
            <div className="p-3 rounded-xl bg-neutral-950 text-[11px] font-mono text-rose-400 mb-5 break-all text-left max-h-32 overflow-y-auto">
              {this.state.error?.message || 'Bilinmeyen Hata'}
            </div>
            <button
              type="button"
              onClick={this.handleRestart}
              className="w-full py-3 rounded-2xl bg-white text-black font-bold text-sm spring-tap active:scale-95"
            >
              Yeniden Başlat
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Clean Service Worker Registration
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        // Check for updates when app gains focus
        const updateSW = () => {
          reg.update().catch(() => {});
        };

        window.addEventListener('focus', updateSW);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            updateSW();
          }
        });

        // If a new service worker is waiting, activate it
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
      })
      .catch((err) => {
        console.warn('SW register warning:', err);
      });
  });
}
