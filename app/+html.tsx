import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="hr">
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet" />

        {/* Eruda — in-app mobile devtools (Console / Network / Elements).
            Only loads when the URL has ?debug — keeps it out of normal use.
            Open with: https://vbrozo.github.io/scrollpedia/?debug
            Captures errors that fire before it loads via a pending queue. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            if (!/[?&]debug\\b/.test(location.search)) return;
            window.__earlyErrors = [];
            window.addEventListener('error', function(e){
              window.__earlyErrors.push('[error] ' + (e.message || e) + (e.filename ? ' @ ' + e.filename + ':' + e.lineno : ''));
            });
            window.addEventListener('unhandledrejection', function(e){
              window.__earlyErrors.push('[promise] ' + (e.reason && (e.reason.stack || e.reason.message) || e.reason));
            });
            var s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/eruda@3';
            s.onload = function(){
              if (typeof eruda !== 'undefined') {
                eruda.init();
                (window.__earlyErrors || []).forEach(function(m){ console.error(m); });
              }
            };
            document.head.appendChild(s);
          })();
        `}} />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* Responsive mobile viewport — prevents address bar from affecting layout */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        {/* PWA */}
        <link rel="manifest" href="/scrollpedia/manifest.json" />
        <meta name="theme-color" content="#0d1128" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Scrollpedia" />
        <link rel="apple-touch-icon" href="/scrollpedia/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/scrollpedia/icons/icon-192.png" />
        <link rel="icon" type="image/png" href="/scrollpedia/icons/icon-192.png" />

        {/* SEO */}
        <meta name="description" content="TikTok-style infinite scroll of Wikipedia articles in Croatian." />
        <meta property="og:title" content="Scrollpedia" />
        <meta property="og:description" content="Otkrijte beskonačne Wikipedia članke na hrvatskom." />
        <meta property="og:image" content="/scrollpedia/icons/icon-512.png" />

        <title>Scrollpedia</title>

        <ScrollViewStyleReset />

        <style>{`
          html, body, #root {
            height: 100%;
            overflow: hidden;
            /* Match the app's navy so the bottom safe-area (home indicator)
               doesn't show a black strip behind the tab bar in PWA mode. */
            background: #0d1128;
            overscroll-behavior: none;
          }
          /* Fill the entire viewport edge-to-edge (incl. bottom safe-area) so the
             tab bar reaches the physical bottom instead of floating above the
             home-indicator zone. Do NOT set an explicit height: 100dvh excludes
             the bottom safe-area in iOS standalone PWA and leaves a navy strip.
             top/bottom:0 define the height and include the safe-area. */
          #root {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
          }
          * {
            -webkit-tap-highlight-color: transparent;
            box-sizing: border-box;
          }
          /* Smooth momentum scrolling on iOS */
          [data-rn-scrollview] {
            -webkit-overflow-scrolling: touch;
          }
        `}</style>
      </head>
      <body>
        {/* Native HTML splash — visible immediately before React JS loads */}
        <div id="html-splash" style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#0a0a0a',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '20px',
        } as any}>
          {/* Globe SVG inline — no external request needed */}
          <svg width="96" height="96" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sp" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4a9eff"/>
                <stop offset="100%" stopColor="#a855f7"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="112" fill="#0d1535"/>
            <circle cx="256" cy="256" r="175" fill="#0a0f28"/>
            <ellipse cx="256" cy="256" rx="70" ry="175" fill="none" stroke="#4a9eff" strokeWidth="5" opacity="0.3"/>
            <ellipse cx="256" cy="256" rx="140" ry="175" fill="none" stroke="#4a9eff" strokeWidth="5" opacity="0.2"/>
            <line x1="81" y1="256" x2="431" y2="256" stroke="#4a9eff" strokeWidth="5" opacity="0.3"/>
            <line x1="81" y1="175" x2="431" y2="175" stroke="#4a9eff" strokeWidth="4" opacity="0.15"/>
            <line x1="81" y1="337" x2="431" y2="337" stroke="#4a9eff" strokeWidth="4" opacity="0.15"/>
            <circle cx="256" cy="256" r="175" fill="none" stroke="#4a9eff" strokeWidth="6" opacity="0.85"/>
            <text x="256" y="320" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="240" textAnchor="middle" fill="url(#sp)" opacity="0.92">S</text>
          </svg>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', letterSpacing: '3px', fontFamily: 'system-ui,sans-serif' }}>
            SCROLLPEDIA
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          // Hide splash as soon as React has rendered something
          document.addEventListener('DOMContentLoaded', function() {
            var splash = document.getElementById('html-splash');
            if (!splash) return;
            // Watch for React root to populate
            var observer = new MutationObserver(function() {
              var root = document.getElementById('root');
              if (root && root.children.length > 0) {
                splash.style.transition = 'opacity 0.3s';
                splash.style.opacity = '0';
                setTimeout(function() { splash.remove(); }, 350);
                observer.disconnect();
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            // Fallback: hide after 8s no matter what
            setTimeout(function() { splash && splash.remove(); }, 8000);
          });
        `}} />
        {children}
      </body>
    </html>
  );
}
