import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="hr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* Responsive mobile viewport — prevents address bar from affecting layout */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        {/* PWA */}
        <link rel="manifest" href="/scrollpedia/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
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
            background: #0a0a0a;
            overscroll-behavior: none;
          }
          /* Use dynamic viewport height so mobile browser chrome doesn't cut content */
          #root {
            height: 100dvh;
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
      <body>{children}</body>
    </html>
  );
}
