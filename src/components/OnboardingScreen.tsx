import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { getStrings } from '../utils/i18n';
import { getCategoriesForLang } from '../utils/wikipedia';

// The 3rd slide (index 2) is an interactive category picker — tapping a
// chip finishes onboarding and opens the feed filtered to that category.
const CATEGORY_SLIDE = 2;

const SLIDE_THEME = [
  {
    emoji: '🌍',
    gradient: ['#0a0a1a', '#0d1535', '#0a2040'] as const,
    accent: '#4a9eff',
  },
  {
    emoji: '👆',
    gradient: ['#0a0a0a', '#0f1f10', '#0a1a0d'] as const,
    accent: '#4caf50',
  },
  {
    emoji: '🧭',
    gradient: ['#0a0a18', '#15102f', '#1a0d33'] as const,
    accent: '#a45eff',
  },
  {
    emoji: '✨',
    gradient: ['#0d0800', '#1a1000', '#261800'] as const,
    accent: '#ffc300',
  },
];

const SLIDE_COPY: Record<string, { title: string; body: string }[]> = {
  hr: [
    { title: 'Dobrodošli u Scrollpedia', body: 'Beskonačni feed Wikipedia članaka na dlanu. Otkrivaj, uči i istraži svijet jednim swipeom.' },
    { title: 'Swipe gore i dolje', body: 'Kliži gore za sljedeći članak, dolje za prethodni. Beskonačno, bez zaustavljanja.' },
    { title: 'Istraži po temama', body: 'Odaberi kategoriju i odmah otvori članke o toj temi — ili nastavi za nasumični feed.' },
    { title: 'Svaki dan nešto novo', body: 'Svako jutro te čeka poseban Članak dana.\nPretraži po kategorijama ili koristi pretragu za bilo koji pojam.' },
  ],
  en: [
    { title: 'Welcome to Scrollpedia', body: 'An endless feed of Wikipedia articles in your hand. Discover, learn, and explore with one swipe.' },
    { title: 'Swipe up and down', body: 'Swipe up for the next article and down for the previous one. Endless, without stopping.' },
    { title: 'Explore by topic', body: 'Pick a category to jump straight into articles on that topic — or continue for a random feed.' },
    { title: 'Something new every day', body: 'Every morning brings a special Article of the Day.\nBrowse categories or search for any topic.' },
  ],
  de: [
    { title: 'Willkommen bei Scrollpedia', body: 'Ein endloser Feed mit Wikipedia-Artikeln in deiner Hand. Entdecke und lerne mit einem Wisch.' },
    { title: 'Nach oben und unten wischen', body: 'Wische nach oben zum nächsten Artikel und nach unten zum vorherigen. Endlos und flüssig.' },
    { title: 'Nach Themen entdecken', body: 'Wähle eine Kategorie und springe direkt zu Artikeln dazu — oder mach weiter für einen zufälligen Feed.' },
    { title: 'Jeden Tag etwas Neues', body: 'Jeden Morgen wartet ein besonderer Artikel des Tages.\nNutze Kategorien oder suche nach einem Thema.' },
  ],
  fr: [
    { title: 'Bienvenue dans Scrollpedia', body: 'Un fil infini d’articles Wikipédia dans votre main. Découvrez et apprenez d’un simple geste.' },
    { title: 'Balayez vers le haut ou le bas', body: 'Balayez vers le haut pour l’article suivant et vers le bas pour le précédent. Sans fin.' },
    { title: 'Explorez par thème', body: 'Choisissez une catégorie pour accéder directement aux articles — ou continuez pour un fil aléatoire.' },
    { title: 'Du nouveau chaque jour', body: 'Chaque matin propose un article du jour.\nParcourez les catégories ou recherchez un sujet.' },
  ],
  es: [
    { title: 'Bienvenido a Scrollpedia', body: 'Un feed infinito de artículos de Wikipedia en tu mano. Descubre y aprende con un gesto.' },
    { title: 'Desliza arriba y abajo', body: 'Desliza arriba para el siguiente artículo y abajo para el anterior. Sin parar.' },
    { title: 'Explora por tema', body: 'Elige una categoría para ir directo a los artículos — o continúa para un feed aleatorio.' },
    { title: 'Algo nuevo cada día', body: 'Cada mañana llega un artículo del día.\nExplora categorías o busca cualquier tema.' },
  ],
  it: [
    { title: 'Benvenuto in Scrollpedia', body: 'Un feed infinito di articoli Wikipedia nella tua mano. Scopri e impara con un gesto.' },
    { title: 'Scorri su e giù', body: 'Scorri in alto per l’articolo successivo e in basso per quello precedente. Senza fermarti.' },
    { title: 'Esplora per tema', body: 'Scegli una categoria per andare subito agli articoli — o continua per un feed casuale.' },
    { title: 'Qualcosa di nuovo ogni giorno', body: 'Ogni mattina trovi un articolo del giorno.\nSfoglia le categorie o cerca un argomento.' },
  ],
};

interface Props {
  /** Called when onboarding finishes. If a category is passed, the feed
   *  should open filtered to it. */
  onDone: (category?: string | null) => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const slides = SLIDE_THEME.map((theme, index) => ({
    ...theme,
    ...(SLIDE_COPY[lang] ?? SLIDE_COPY.en)[index],
  }));
  // Real Wikipedia categories (skip the leading "All" entry, value === null).
  const categories = getCategoriesForLang(lang).filter((c) => c.value !== null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  function goNext() {
    const next = activeIndex + 1;
    if (next < slides.length) {
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
      setActiveIndex(next);
    } else {
      onDone();
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
            key={index}
            item={item}
            width={W}
            height={H}
            index={index}
            scrollX={scrollX}
            categories={index === CATEGORY_SLIDE ? categories : undefined}
            onPickCategory={(value) => onDone(value)}
          />
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
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                  backgroundColor: activeIndex === i ? accent : '#fff',
                },
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

        {/* Always reserve the skip button's space so the primary button keeps
            the same (tab-bar-clearing) position on the last step too. */}
        <TouchableOpacity
          onPress={() => onDone()}
          style={styles.skipBtn}
          activeOpacity={0.7}
          disabled={isLast}
        >
          <Text style={[styles.skipText, isLast && styles.skipTextHidden]}>
            {t.onboardingSkip}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Slide({
  item,
  width,
  height,
  index,
  scrollX,
  categories,
  onPickCategory,
}: {
  item: typeof SLIDE_THEME[0] & { title: string; body: string };
  width: number;
  height: number;
  index: number;
  scrollX: Animated.Value;
  categories?: { label: string; value: string | null }[];
  onPickCategory?: (value: string) => void;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [40, 0, 40],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ width, height }}>
      <LinearGradient colors={item.gradient} style={StyleSheet.absoluteFill} />
      <View style={[styles.glow, { backgroundColor: item.accent + '18' }]} />

      <Animated.View style={[styles.slideContent, { opacity, transform: [{ translateY }] }]}>
        <View style={[styles.emojiWrap, { borderColor: item.accent + '40', backgroundColor: item.accent + '14' }]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideBody}>{item.body}</Text>

        {categories ? (
          <View style={styles.chipGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                onPress={() => cat.value && onPickCategory?.(cat.value)}
                style={[styles.catChip, { borderColor: item.accent + '55', backgroundColor: item.accent + '14' }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.catChipText, { color: '#fff' }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.accentBar, { backgroundColor: item.accent }]} />
        )}
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
    paddingHorizontal: 36,
    paddingBottom: 160,
  },
  emojiWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1.5,
  },
  emoji: { fontSize: 44 },
  slideTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 16,
    lineHeight: 32,
  },
  slideBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 28,
  },
  accentBar: { width: 36, height: 3, borderRadius: 2 },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
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
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipText: { color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: '500' },
  skipTextHidden: { opacity: 0 },
});
