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

const SLIDES = [
  {
    emoji: '🌍',
    title: 'Dobrodošli u Scrollpedia',
    body: 'Beskonačni feed Wikipedia članaka na dlanu. Otkrivaj, uči i istraži svijet — jednim swipeom.',
    gradient: ['#0a0a1a', '#0d1535', '#0a2040'] as const,
    accent: '#4a9eff',
  },
  {
    emoji: '👆',
    title: 'Swipe gore & dolje',
    body: 'Kliži gore za sljedeći članak, dolje za prethodni — baš kao TikTok. Beskonačno, bez zaustavljanja.',
    gradient: ['#0a0a0a', '#0f1f10', '#0a1a0d'] as const,
    accent: '#4caf50',
  },
  {
    emoji: '👈👉',
    title: 'Swipe lijevo & desno',
    body: 'Swipe desno da sačuvaš članak 🔖\nSwipe lijevo da preskočiš →\n\nSačuvani članci dostupni su u tabu "Saved".',
    gradient: ['#100a0a', '#1f0d10', '#180a1a'] as const,
    accent: '#ff6b6b',
  },
  {
    emoji: '✨',
    title: 'Svaki dan nešto novo',
    body: 'Svako jutro te čeka poseban Članak Dana ★\nPretraži po kategorijama ili koristi Search za bilo koji pojam.',
    gradient: ['#0d0800', '#1a1000', '#261800'] as const,
    accent: '#ffc300',
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  function goNext() {
    const next = activeIndex + 1;
    if (next < SLIDES.length) {
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
      setActiveIndex(next);
    } else {
      onDone();
    }
  }

  const isLast = activeIndex === SLIDES.length - 1;
  const accent = SLIDES[activeIndex].accent;

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
        {SLIDES.map((item, index) => (
          <Slide key={index} item={item} width={W} height={H} index={index} scrollX={scrollX} />
        ))}
      </Animated.ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => {
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
      <View style={[styles.buttons, { paddingBottom: Platform.OS === 'ios' ? 50 : 30 }]}>
        <TouchableOpacity
          onPress={goNext}
          style={[styles.primaryBtn, { backgroundColor: accent }]}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {isLast ? 'Počni istraživati →' : 'Dalje'}
          </Text>
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={onDone} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Preskoči</Text>
          </TouchableOpacity>
        )}
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
}: {
  item: typeof SLIDES[0];
  width: number;
  height: number;
  index: number;
  scrollX: Animated.Value;
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
        <View style={[styles.accentBar, { backgroundColor: item.accent }]} />
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
  dots: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 160 : 140,
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
});
