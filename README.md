# Scrollpedia

TikTok-style infinite vertical scroll app that shows random Croatian Wikipedia articles. Built with React Native + Expo.

## Features

- **Infinite scroll** — vertical full-screen cards, TikTok-style paging
- **Croatian Wikipedia** — fetches from hr.wikipedia.org
- **Categories** — filter by Povijest, Znanost, Sport, Geografija, Kultura, Tehnologija, Priroda
- **Swipe gestures** — swipe right to save, swipe left to skip (native)
- **Čitaj više** — full article modal inside the app
- **Search** — search Croatian Wikipedia with debounced input
- **Save / Bookmark** — save articles locally with AsyncStorage
- **Share** — share article link via native share sheet
- **PWA** — installable as standalone app on iOS/Android from browser
- **Offline shell** — service worker caches app shell

## Run locally

```bash
npm install
npx expo start
```

## Web build

```bash
npx expo export -p web   # outputs to dist/
```

---

## Future Improvements

### Engagement & Retention

- **Streak & statistike** — "Pročitao si 47 članaka ovaj tjedan" — gamification koji tjera korisnike da se vraćaju
- **Daily highlight** — Poseban "Članak dana" pinned na vrh (Wikipedia `/api/rest_v1/feed/featured`)
- **Dijeljenje kartice** — Umjesto dijeljenja linka, generiraj screenshot kartice kao Instagram story

### UX / Polish

- **Onboarding** — 3 swipe ekrana koji objasne geste i koncepte pri prvom pokretanju
- **Haptic feedback** — Vibracija pri saveanju i swipeu (expo-haptics, samo native)
- **Skeleton loading** — Placeholder kartice umjesto spinnera dok se učitava sadržaj
- **Pinch-to-zoom** — Zoom na sliku članka

### Content

- **Višejezičnost** — Neka korisnik odabere jezik (HR/EN/DE/FR…) u settings tabu
- **"Na današnji dan"** — Članci vezani uz današnji datum (`/api/rest_v1/feed/onthisday`)
- **Related articles** — Nakon čitanja članka, predloži slične tematski

### Technical

- **Backend / personalizacija** — Preporučivanje članaka na temelju povijesti čitanja
- **Push notifikacije** — "Članak dana" notifikacija svako jutro
- **Analytics** — Praćenje koje kategorije korisnici najviše čitaju
- **Offline mode** — Cache zadnjih 20 članaka za čitanje bez interneta