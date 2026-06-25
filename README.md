# Scrollpedia

TikTok-style infinite vertical scroll app that shows random Croatian Wikipedia articles. Built with React Native + Expo.

## Implemented Features

### Feed & Content
- **Infinite scroll** — vertical full-screen cards, TikTok-style paging with `pagingEnabled` FlatList
- **Croatian Wikipedia** — fetches from `hr.wikipedia.org`
- **Daily Highlight** — "Članak dana" pinned as first card every day; gold/amber design with animated badge; cached per day in AsyncStorage; fallback to English Wikipedia if Croatian featured article unavailable
- **Categories** — filter chips: Sve, Povijest, Znanost, Sport, Geografija, Kultura, Tehnologija, Priroda

### Interaction
- **Swipe gestures** — swipe right = save (green overlay), swipe left = skip (red overlay + slide animation); native only
- **Čitaj više** — bottom sheet modal fetches full article text from Wikipedia API; scrollable; "Otvori na Wikipediji" CTA
- **Save / Bookmark** — save articles locally with AsyncStorage; toggle from card or swipe
- **Share** — native share sheet with article URL
- **Open** — open article in system browser

### UX / Onboarding
- **Onboarding** — 4 animated full-screen slides at first launch; horizontal swipe with spring dots; color-themed per slide (blue/green/red/gold); skip or tap "Dalje"; stored in AsyncStorage, never shown again
- **Skeleton loading** — shimmer placeholder cards (4x) shown while initial feed loads; matches exact ArticleCard layout with animated opacity pulse; replaces spinner entirely

### Discovery
- **Search tab** — debounced full-text search; language-aware; tap result opens read-more modal
- **"Na današnji dan"** — second special card in feed; deep purple design; shows year, event description, and related Wikipedia article; fetches from `/api/rest_v1/feed/onthisday/selected`; cached per language per day
- **Related articles** — horizontal scroll row at bottom of every article modal; fetches from `/api/rest_v1/page/related/{title}`; tap navigates into related article with back button (stack navigation inside modal)

### Language & Localisation
- **Višejezičnost** — Settings tab with language picker: HR 🇭🇷, EN 🇬🇧, DE 🇩🇪, FR 🇫🇷, ES 🇪🇸, IT 🇮🇹; stored in AsyncStorage; affects feed, search, categories, daily highlight, on this day, and related articles
- **Language-aware categories** — category names translated per language (e.g. "Sport" → "Šport" in HR, "Sports" in EN, "Deporte" in ES)

### Platform
- **PWA** — installable as standalone app on iOS/Android from browser (`manifest.json`, service worker)
- **Offline shell** — service worker: cache-first for app assets, network-first for Wikipedia API
- **Mobile web optimized** — `100dvh`, `viewport-fit=cover`, no tap highlight, `useWindowDimensions` for orientation changes

## Run locally

```bash
npm install
npx expo start
```

## Web build

```bash
npx expo export -p web   # outputs to dist/
cp -r dist docs          # GitHub Pages serves from /docs
```

---

## Future Improvements

### Engagement & Retention
- **Streak & statistike** — "Pročitao si 47 članaka ovaj tjedan" — gamification koji tjera korisnike da se vraćaju
- **Dijeljenje kartice kao slika** — Umjesto linka, generiraj screenshot kartice kao Instagram story (expo-view-shot)

### UX / Polish
- **Haptic feedback** — Vibracija pri saveanju i swipeu (expo-haptics, samo native)
- **Pinch-to-zoom** — Zoom na sliku članka

### Technical
- **Backend / personalizacija** — Preporučivanje članaka na temelju povijesti čitanja
- **Push notifikacije** — "Članak dana" notifikacija svako jutro
- **Analytics** — Praćenje koje kategorije korisnici najviše čitaju
- **Offline mode** — Cache zadnjih 20 članaka za čitanje bez interneta