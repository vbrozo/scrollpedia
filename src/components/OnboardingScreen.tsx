import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LANGUAGES, useLanguage } from '../context/LanguageContext';
import { getStrings } from '../utils/i18n';
import { getCategoriesForLang } from '../utils/wikipedia';
import { trackCategorySelect } from '../utils/interestProfile';

type SlideKind = 'language' | 'intro' | 'swipe' | 'interests' | 'install' | 'daily';

interface SlideTheme {
  kind: SlideKind;
  emoji: string;
  gradient: readonly [string, string, string];
  accent: string;
}

// The last slide differs by platform: web gets a PWA "install" primer,
// native keeps the "new every day" slide.
function buildSlideThemes(): SlideTheme[] {
  return [
    { kind: 'language',  emoji: '🌐',  gradient: ['#0a0a1a', '#0d1535', '#0a2040'], accent: '#4a9eff' },
    { kind: 'intro',     emoji: '🌍',  gradient: ['#0a0a18', '#0d1230', '#0a1838'], accent: '#5e7fff' },
    { kind: 'swipe',     emoji: '👆',  gradient: ['#0a0a0a', '#0f1f10', '#0a1a0d'], accent: '#4caf50' },
    { kind: 'interests', emoji: '🧭',  gradient: ['#0a0a18', '#15102f', '#1a0d33'], accent: '#a45eff' },
    Platform.OS === 'web'
      ? { kind: 'install', emoji: '📲', gradient: ['#0d0800', '#1a1000', '#261800'], accent: '#ffc300' }
      : { kind: 'daily',   emoji: '✨', gradient: ['#0d0800', '#1a1000', '#261800'], accent: '#ffc300' },
  ];
}

const COPY: Record<string, Record<SlideKind, { title: string; body: string }>> = {
  hr: {
    language:  { title: 'Odaberi jezik', body: 'Feed, pretraga i kategorije na tvom jeziku. Možeš promijeniti bilo kada u Postavkama.' },
    intro:     { title: 'Dobrodošli u Scrollpedia', body: 'Beskonačni feed Wikipedia članaka. Otkrivaj, uči i istraži svijet jednim swipeom.' },
    swipe:     { title: 'Swipe gore i dolje', body: 'Kliži gore za sljedeći članak, dolje za prethodni. Beskonačno, bez zaustavljanja.' },
    interests: { title: 'Odaberi interese', body: 'Izaberi teme koje te zanimaju — feed ćemo prilagoditi tebi. Možeš odabrati više.' },
    install:   { title: 'Dodaj na početni zaslon', body: 'Instaliraj Scrollpediju kao aplikaciju za brzi pristup i puni ekran.' },
    daily:     { title: 'Svaki dan nešto novo', body: 'Svako jutro te čeka poseban Članak dana. Pretraži po kategorijama ili koristi pretragu.' },
  },
  en: {
    language:  { title: 'Choose your language', body: 'Feed, search and categories in your language. Change it anytime in Settings.' },
    intro:     { title: 'Welcome to Scrollpedia', body: 'An endless feed of Wikipedia articles. Discover, learn and explore with one swipe.' },
    swipe:     { title: 'Swipe up and down', body: 'Swipe up for the next article and down for the previous one. Endless, without stopping.' },
    interests: { title: 'Pick your interests', body: 'Choose the topics you like — we’ll tailor the feed to you. Pick as many as you want.' },
    install:   { title: 'Add to home screen', body: 'Install Scrollpedia as an app for quick, full-screen access.' },
    daily:     { title: 'Something new every day', body: 'Every morning brings a special Article of the Day. Browse categories or search any topic.' },
  },
  de: {
    language:  { title: 'Sprache wählen', body: 'Feed, Suche und Kategorien in deiner Sprache. Jederzeit in den Einstellungen änderbar.' },
    intro:     { title: 'Willkommen bei Scrollpedia', body: 'Ein endloser Feed mit Wikipedia-Artikeln. Entdecke und lerne mit einem Wisch.' },
    swipe:     { title: 'Nach oben und unten wischen', body: 'Wische nach oben zum nächsten Artikel und nach unten zum vorherigen. Endlos und flüssig.' },
    interests: { title: 'Wähle deine Themen', body: 'Wähle die Themen, die dich interessieren — wir passen den Feed an. Mehrere möglich.' },
    install:   { title: 'Zum Startbildschirm', body: 'Installiere Scrollpedia als App für schnellen Vollbildzugriff.' },
    daily:     { title: 'Jeden Tag etwas Neues', body: 'Jeden Morgen wartet ein besonderer Artikel des Tages. Nutze Kategorien oder die Suche.' },
  },
  fr: {
    language:  { title: 'Choisis ta langue', body: 'Fil, recherche et catégories dans ta langue. Modifiable à tout moment dans les Réglages.' },
    intro:     { title: 'Bienvenue dans Scrollpedia', body: 'Un fil infini d’articles Wikipédia. Découvre et apprends d’un simple geste.' },
    swipe:     { title: 'Balaye vers le haut ou le bas', body: 'Balaye vers le haut pour l’article suivant et vers le bas pour le précédent. Sans fin.' },
    interests: { title: 'Choisis tes centres d’intérêt', body: 'Sélectionne les thèmes qui te plaisent — on adaptera le fil. Plusieurs choix possibles.' },
    install:   { title: 'Ajouter à l’écran d’accueil', body: 'Installe Scrollpedia comme une app pour un accès rapide en plein écran.' },
    daily:     { title: 'Du nouveau chaque jour', body: 'Chaque matin, un article du jour t’attend. Parcours les catégories ou recherche un sujet.' },
  },
  es: {
    language:  { title: 'Elige tu idioma', body: 'Feed, búsqueda y categorías en tu idioma. Cámbialo cuando quieras en Ajustes.' },
    intro:     { title: 'Bienvenido a Scrollpedia', body: 'Un feed infinito de artículos de Wikipedia. Descubre y aprende con un gesto.' },
    swipe:     { title: 'Desliza arriba y abajo', body: 'Desliza arriba para el siguiente artículo y abajo para el anterior. Sin parar.' },
    interests: { title: 'Elige tus intereses', body: 'Selecciona los temas que te gustan — adaptaremos el feed. Puedes elegir varios.' },
    install:   { title: 'Añadir a la pantalla de inicio', body: 'Instala Scrollpedia como app para un acceso rápido a pantalla completa.' },
    daily:     { title: 'Algo nuevo cada día', body: 'Cada mañana llega un artículo del día. Explora categorías o busca cualquier tema.' },
  },
  it: {
    language:  { title: 'Scegli la lingua', body: 'Feed, ricerca e categorie nella tua lingua. Modificabile in qualsiasi momento nelle Impostazioni.' },
    intro:     { title: 'Benvenuto in Scrollpedia', body: 'Un feed infinito di articoli Wikipedia. Scopri e impara con un gesto.' },
    swipe:     { title: 'Scorri su e giù', body: 'Scorri in alto per l’articolo successivo e in basso per quello precedente. Senza fermarti.' },
    interests: { title: 'Scegli i tuoi interessi', body: 'Seleziona i temi che ti piacciono — adatteremo il feed. Puoi sceglierne diversi.' },
    install:   { title: 'Aggiungi alla schermata Home', body: 'Installa Scrollpedia come app per un accesso rapido a schermo intero.' },
    daily:     { title: 'Qualcosa di nuovo ogni giorno', body: 'Ogni mattina trovi un articolo del giorno. Sfoglia le categorie o cerca un argomento.' },
  },
};

// Sample article used by the live preview card on the intro slide.
const SAMPLE: Record<string, { title: string; extract: string }> = {
  hr: { title: 'Nikola Tesla', extract: 'Izumitelj i inženjer čiji su radovi oblikovali modernu izmjeničnu struju i bežični prijenos energije.' },
  en: { title: 'Nikola Tesla', extract: 'Inventor and engineer whose work shaped modern alternating current and wireless power transmission.' },
  de: { title: 'Nikola Tesla', extract: 'Erfinder und Ingenieur, dessen Arbeit den modernen Wechselstrom und die drahtlose Energieübertragung prägte.' },
  fr: { title: 'Nikola Tesla', extract: 'Inventeur et ingénieur dont les travaux ont façonné le courant alternatif et le transfert d’énergie sans fil.' },
  es: { title: 'Nikola Tesla', extract: 'Inventor e ingeniero cuyo trabajo dio forma a la corriente alterna y la transmisión inalámbrica de energía.' },
  it: { title: 'Nikola Tesla', extract: 'Inventore e ingegnere il cui lavoro ha plasmato la corrente alternata e la trasmissione di energia senza fili.' },
};

const INSTALL_EXTRA: Record<string, { button: string; iosHint: string; done: string }> = {
  hr: { button: 'Instaliraj aplikaciju', iosHint: 'Na iPhoneu: dodirni Podijeli, pa „Dodaj na početni zaslon".', done: 'Već instalirano ✓' },
  en: { button: 'Install app', iosHint: 'On iPhone: tap Share, then “Add to Home Screen”.', done: 'Already installed ✓' },
  de: { button: 'App installieren', iosHint: 'Auf dem iPhone: Teilen antippen, dann „Zum Home-Bildschirm“.', done: 'Bereits installiert ✓' },
  fr: { button: 'Installer l’app', iosHint: 'Sur iPhone : touchez Partager, puis « Sur l’écran d’accueil ».', done: 'Déjà installée ✓' },
  es: { button: 'Instalar app', iosHint: 'En iPhone: toca Compartir y luego “Añadir a inicio”.', done: 'Ya instalada ✓' },
  it: { button: 'Installa app', iosHint: 'Su iPhone: tocca Condividi, poi “Aggiungi a Home”.', done: 'Già installata ✓' },
};

interface Props {
  /** Called when onboarding finishes. If a category is passed, the feed opens
   *  filtered to it (the user's first picked interest). */
  onDone: (category?: string | null) => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const { lang, setLang } = useLanguage();
  const t = getStrings(lang);
  const copy = COPY[lang] ?? COPY.en;
  const slides = buildSlideThemes();
  // Real Wikipedia categories (skip the leading "All" entry, value === null).
  const categories = getCategoriesForLang(lang).filter((c) => c.value !== null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  function toggleInterest(value: string) {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  // Seed the interest profile from the picked categories, then finish.
  function finish() {
    const picks = Array.from(selectedInterests);
    picks.forEach((c) => { trackCategorySelect(c, lang); }); // fire-and-forget
    onDone(picks[0] ?? null);
  }

  function goNext() {
    const next = activeIndex + 1;
    if (next < slides.length) {
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
      setActiveIndex(next);
    } else {
      finish();
    }
  }

  const isLast = activeIndex === slides.length - 1;
  const accent = slides[activeIndex].accent;

  return (
    <View style={[styles.container, { width: W, height: H }]}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / W));
        }}
        style={{ flex: 1 }}
      >
        {slides.map((item, index) => (
          <Slide
            key={item.kind}
            item={item}
            title={copy[item.kind].title}
            body={copy[item.kind].body}
            width={W}
            height={H}
            index={index}
            scrollX={scrollX}
          >
            {item.kind === 'language' && (
              <View style={styles.langGrid}>
                {LANGUAGES.map((l) => {
                  const active = lang === l.code;
                  return (
                    <TouchableOpacity
                      key={l.code}
                      onPress={() => setLang(l.code)}
                      style={[styles.langChip, active && { borderColor: accent, backgroundColor: accent + '22' }]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.langChipFlag}>{l.flag}</Text>
                      <Text style={[styles.langChipText, active && styles.langChipTextActive]}>{l.nativeName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {item.kind === 'interests' && (
              <View style={styles.chipGrid}>
                {categories.map((cat) => {
                  const value = cat.value as string;
                  const active = selectedInterests.has(value);
                  return (
                    <TouchableOpacity
                      key={cat.label}
                      onPress={() => toggleInterest(value)}
                      style={[
                        styles.catChip,
                        { borderColor: active ? item.accent : item.accent + '40', backgroundColor: active ? item.accent + '33' : item.accent + '12' },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.catChipText}>{active ? '✓ ' : ''}{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {item.kind === 'install' && <InstallContent lang={lang} accent={item.accent} />}
          </Slide>
        ))}
      </Animated.ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
          const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
          const dotOpacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { width: dotWidth, opacity: dotOpacity, backgroundColor: activeIndex === i ? accent : '#fff' },
              ]}
            />
          );
        })}
      </View>

      {/* Buttons */}
      <View style={[styles.buttons, { paddingBottom: Platform.OS === 'ios' ? 110 : 30 }]}>
        <TouchableOpacity
          onPress={goNext}
          style={[styles.primaryBtn, { backgroundColor: accent }]}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {isLast ? `${t.onboardingStart} →` : t.onboardingNext}
          </Text>
        </TouchableOpacity>

        {/* Reserve the skip button's space so the primary button keeps the same
            (tab-bar-clearing) position on the last step too. */}
        <TouchableOpacity onPress={finish} style={styles.skipBtn} activeOpacity={0.7} disabled={isLast}>
          <Text style={[styles.skipText, isLast && styles.skipTextHidden]}>{t.onboardingSkip}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InstallContent({ lang, accent }: { lang: string; accent: string }) {
  const c = INSTALL_EXTRA[lang] ?? INSTALL_EXTRA.en;
  const [deferred, setDeferred] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onPrompt = (e: any) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    const standalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (navigator as any).standalone === true;
    if (standalone) setInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  async function doInstall() {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch {}
    setDeferred(null);
  }

  if (installed) return <Text style={styles.installHint}>{c.done}</Text>;

  return (
    <View style={styles.installWrap}>
      {deferred && (
        <TouchableOpacity onPress={doInstall} style={[styles.installBtn, { backgroundColor: accent }]} activeOpacity={0.85}>
          <Text style={styles.installBtnText}>{c.button}</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.installHint}>{c.iosHint}</Text>
    </View>
  );
}

function PreviewCard({ lang, accent }: { lang: string; accent: string }) {
  const s = SAMPLE[lang] ?? SAMPLE.en;
  return (
    <View style={styles.previewCard}>
      <View style={[styles.previewGlobe, { borderColor: accent + '55' }]} />
      <View style={styles.previewPills}>
        <View style={[styles.previewPill, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
          <Text style={[styles.previewPillText, { color: accent }]}>Wikipedia</Text>
        </View>
        <View style={styles.previewTimePill}>
          <Text style={styles.previewTimeText}>⏱ 2 min</Text>
        </View>
      </View>
      <Text style={styles.previewTitle} numberOfLines={1}>{s.title}</Text>
      <Text style={styles.previewExtract} numberOfLines={2}>{s.extract}</Text>
      <View style={styles.previewDots}>
        <View style={[styles.previewDot, { width: 26, backgroundColor: '#5e7fff' }]} />
        <View style={[styles.previewDot, { width: 16, backgroundColor: '#a45eff' }]} />
        <View style={[styles.previewDot, { width: 32, backgroundColor: '#e040cc' }]} />
      </View>
    </View>
  );
}

function Slide({
  item,
  title,
  body,
  width,
  height,
  index,
  scrollX,
  children,
}: {
  item: SlideTheme;
  title: string;
  body: string;
  width: number;
  height: number;
  index: number;
  scrollX: Animated.Value;
  children?: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const translateY = scrollX.interpolate({ inputRange, outputRange: [40, 0, 40], extrapolate: 'clamp' });
  const opacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
  const hasExtra = !!children;

  return (
    <View style={{ width, height }}>
      <LinearGradient colors={item.gradient} style={StyleSheet.absoluteFill} />
      <View style={[styles.glow, { backgroundColor: item.accent + '18' }]} />

      <Animated.View style={[styles.slideContent, { opacity, transform: [{ translateY }] }]}>
        {item.kind === 'intro' ? (
          <PreviewCard lang={lang} accent={item.accent} />
        ) : (
          <View style={[styles.emojiWrap, { borderColor: item.accent + '40', backgroundColor: item.accent + '14' }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>
        )}

        <Text style={styles.slideTitle}>{title}</Text>
        <Text style={styles.slideBody}>{body}</Text>

        {hasExtra ? children : <View style={[styles.accentBar, { backgroundColor: item.accent }]} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: '#0a0a0a',
  },
  glow: {
    position: 'absolute',
    top: '15%',
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 170,
  },
  emojiWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
    borderWidth: 1.5,
  },
  emoji: { fontSize: 40 },
  slideTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 14,
    lineHeight: 32,
  },
  slideBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 24,
  },
  accentBar: { width: 36, height: 3, borderRadius: 2 },

  // Language picker
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  langChipFlag: { fontSize: 20 },
  langChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  langChipTextActive: { color: '#fff' },

  // Interests multi-select
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  catChipText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // PWA install
  installWrap: { alignItems: 'center', gap: 14 },
  installBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
  installBtnText: { color: '#0a0a0a', fontSize: 15, fontWeight: '800' },
  installHint: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },

  // Live preview card
  previewCard: {
    width: 270,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 26,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewGlobe: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    opacity: 0.5,
  },
  previewPills: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  previewPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  previewPillText: { fontSize: 11, fontWeight: '700' },
  previewTimePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)' },
  previewTimeText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  previewTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 8 },
  previewExtract: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  previewDots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewDot: { height: 3, borderRadius: 2 },

  dots: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 220 : 140,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: { height: 8, borderRadius: 4 },
  buttons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipText: { color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: '500' },
  skipTextHidden: { opacity: 0 },
});
