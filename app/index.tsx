import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useArticles, FeedMode } from '../src/hooks/useArticles';
import { useLanguage } from '../src/context/LanguageContext';
import { useTheme } from '../src/context/ThemeContext';
import ArticleCard from '../src/components/ArticleCard';
import DailyHighlightCard from '../src/components/DailyHighlightCard';
import OnThisDayCard from '../src/components/OnThisDayCard';
import SkeletonCard from '../src/components/SkeletonCard';
import OnboardingScreen from '../src/components/OnboardingScreen';
import CategoryFilter from '../src/components/CategoryFilter';
import ArticleModal from '../src/components/ArticleModal';
import { WikiArticle } from '../src/types';
import { fetchDailyHighlight, fetchOnThisDay } from '../src/utils/wikipedia';
import { getStrings } from '../src/utils/i18n';
import { FONT_SORA } from '../src/utils/fonts';
import {
  trackInteraction,
  trackCategorySelect,
  hasEnoughDataForFeed,
} from '../src/utils/interestProfile';

const HIGHLIGHT_CACHE_KEY = 'scrollpedia_daily_highlight';
const ONTHISDAY_CACHE_KEY = 'scrollpedia_onthisday';
const ONBOARDING_KEY = 'scrollpedia_onboarding_done';
const SKELETON_COUNT = 4;
// Height of the FeedSelector bar; CategoryFilter is offset by this amount
const FEED_SELECTOR_H = 44;

function todayCacheKey(lang: string) {
  const d = new Date();
  return `${lang}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function DiscoverScreen() {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { lang } = useLanguage();
  const { bg } = useTheme();
  const t = getStrings(lang);
  const [category, setCategory] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>('explore');
  const [forYouAvailable, setForYouAvailable] = useState(false);
  const [modalArticle, setModalArticle] = useState<WikiArticle | null>(null);
  const [highlight, setHighlight] = useState<WikiArticle | null>(null);
  const [onThisDay, setOnThisDay] = useState<WikiArticle | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const { articles, loading, error, hasMore, loadMore, reset } = useArticles(category, lang, feedMode);

  const flatListRef = useRef<FlatList<WikiArticle>>(null);
  const currentIndexRef = useRef(0);
  const feedLengthRef = useRef(0);
  // Reading-progress bar: position through the loaded feed (0→1). Driven
  // directly from the viewability callback so it never triggers a re-render.
  const progressAnim = useRef(new Animated.Value(0)).current;
  const previousLangRef = useRef(lang);
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  // Check whether the user has enough history to unlock "For You"
  useEffect(() => {
    hasEnoughDataForFeed().then(setForYouAvailable);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/scrollpedia/sw.js').catch(() => {});
    }
  }, []);

  // Onboarding check (once)
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
      setShowOnboarding(!done);
      setOnboardingChecked(true);
    });
  }, []);

  // Fetch highlight + onthisday when lang changes, with per-lang cache
  useEffect(() => {
    const todayKey = todayCacheKey(lang);

    async function loadSpecialCards() {
      setHighlight(null);
      setOnThisDay(null);

      const [cachedH, cachedO] = await Promise.all([
        AsyncStorage.getItem(`${HIGHLIGHT_CACHE_KEY}_${lang}`),
        AsyncStorage.getItem(`${ONTHISDAY_CACHE_KEY}_${lang}`),
      ]);

      if (cachedH) {
        try {
          const { key, article } = JSON.parse(cachedH);
          if (key === todayKey) setHighlight(article);
        } catch {}
      }
      if (cachedO) {
        try {
          const { key, article } = JSON.parse(cachedO);
          if (key === todayKey) setOnThisDay(article);
        } catch {}
      }

      const [h, o] = await Promise.all([
        fetchDailyHighlight(lang),
        fetchOnThisDay(lang),
      ]);
      if (h) {
        setHighlight(h);
        await AsyncStorage.setItem(`${HIGHLIGHT_CACHE_KEY}_${lang}`, JSON.stringify({ key: todayKey, article: h }));
      }
      if (o) {
        setOnThisDay(o);
        await AsyncStorage.setItem(`${ONTHISDAY_CACHE_KEY}_${lang}`, JSON.stringify({ key: todayKey, article: o }));
      }
    }

    loadSpecialCards();
  }, [lang]);

  // Reload articles after React commits category/language/feedMode changes
  useEffect(() => {
    if (previousLangRef.current !== lang) {
      previousLangRef.current = lang;
      if (category !== null) {
        setCategory(null);
        return;
      }
    }

    reset();
    currentIndexRef.current = 0;
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    loadMore();
  }, [category, lang, feedMode, loadMore, reset]);

  const handleCategoryChange = useCallback((value: string | null) => {
    setCategory(value);
    if (value) {
      trackCategorySelect(value, lang);
      // Refresh forYou availability when user interacts
      hasEnoughDataForFeed().then(setForYouAvailable);
    }
  }, [lang]);

  // Tapping a topic chip sets that Wikipedia category as the active filter
  const handleTopicSelect = useCallback((rawCategory: string) => {
    setCategory(rawCategory);
    trackCategorySelect(rawCategory, lang);
    hasEnoughDataForFeed().then(setForYouAvailable);
  }, [lang]);

  const handleFeedModeChange = useCallback((mode: FeedMode) => {
    if (mode === feedMode) return;
    setFeedMode(mode);
    setCategory(null);
  }, [feedMode]);

  const handleSkip = useCallback(() => {
    const next = currentIndexRef.current + 1;
    if (next < feedLengthRef.current) {
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      currentIndexRef.current = idx;
      const len = feedLengthRef.current;
      Animated.timing(progressAnim, {
        toValue: len > 0 ? (idx + 1) / len : 0,
        duration: 250,
        useNativeDriver: false,
      }).start();

      // Track the viewed article for interest profiling (fire-and-forget)
      const item: WikiArticle | undefined = viewableItems[0].item;
      if (item && !item.isHighlight && !item.isOnThisDay) {
        trackInteraction(item, 'view').then(() => {
          hasEnoughDataForFeed().then(setForYouAvailable);
        });
      }

      // Proactively pre-fetch when within 5 cards of the end so the next batch
      // arrives before the user hits the loading footer.
      if (len - idx <= 5) {
        loadMoreRef.current();
      }
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });

  async function handleOnboardingDone(pickedCategory?: string | null) {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
    // If the user tapped a category in onboarding, open the feed filtered to it.
    if (pickedCategory) {
      handleCategoryChange(pickedCategory);
    }
  }

  // Build feed: highlight → onthisday → regular articles (deduplicated)
  const feedData = useMemo<WikiArticle[]>(() => {
    const specialIds = new Set([highlight?.pageid, onThisDay?.pageid].filter(Boolean) as number[]);
    const regularArticles = articles.filter((a) => !specialIds.has(a.pageid));
    return category === null
      ? [
          ...(highlight ? [highlight] : []),
          ...(onThisDay ? [onThisDay] : []),
          ...regularArticles,
        ]
      : regularArticles;
  }, [highlight, onThisDay, articles, category]);

  useEffect(() => {
    feedLengthRef.current = feedData.length;
  }, [feedData.length]);

  useEffect(() => {
    if (!category && articles.length > 0 && articles.length < 15 && hasMore) {
      loadMoreRef.current();
    }
  }, [articles.length, hasMore, category]);

  const showSkeletons = feedData.length === 0 && !error;

  const handleReadMore = useCallback((item: WikiArticle) => {
    setModalArticle(item);
    // Track that user opened the full article (fire-and-forget)
    if (!item.isHighlight && !item.isOnThisDay) {
      trackInteraction(item, 'read').then(() => {
        hasEnoughDataForFeed().then(setForYouAvailable);
      });
    }
  }, []);

  const renderItem = useCallback(({ item, index }: { item: WikiArticle; index: number }) => {
    if (item.isHighlight) {
      return <DailyHighlightCard article={item} width={W} height={H} onReadMore={() => handleReadMore(item)} />;
    }
    if (item.isOnThisDay) {
      return <OnThisDayCard article={item} width={W} height={H} onReadMore={() => handleReadMore(item)} />;
    }
    return (
      <ArticleCard
        article={item}
        index={index}
        total={feedData.length}
        width={W}
        height={H}
        onSkip={handleSkip}
        onReadMore={() => handleReadMore(item)}
        onTopicSelect={handleTopicSelect}
      />
    );
  }, [W, H, feedData.length, handleSkip, handleReadMore, handleTopicSelect]);

  function renderFooter() {
    if (feedData.length === 0) return null;
    if (error) {
      return (
        <View style={[styles.loader, { height: H }]}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{t.loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadMore}>
            <Text style={styles.retryText}>{t.retryBtn}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (loading) return <SkeletonCard />;
    if (!hasMore) {
      return (
        <View style={[styles.loader, { height: H }]}>
          <Text style={styles.endEmoji}>✓</Text>
          <Text style={styles.errorText}>{t.categoryEnd}</Text>
        </View>
      );
    }
    return null;
  }

  if (error && feedData.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadMore}>
          <Text style={styles.retryText}>{t.retryBtn}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {!showSkeletons && feedData.length > 0 && (
        <View style={[styles.progressTrack, { top: insets.top }]} pointerEvents="none">
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      )}
      {showSkeletons ? (
        <FlatList
          key="skeleton-list"
          data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
          keyExtractor={(i) => `skel-${i}`}
          renderItem={() => <SkeletonCard />}
          pagingEnabled
          snapToInterval={H}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          style={{ height: H }}
          getItemLayout={(_, index) => ({ length: H, offset: H * index, index })}
        />
      ) : (
        <FlatList
          key="feed-list"
          ref={flatListRef}
          data={feedData}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.isHighlight ? 'h' : item.isOnThisDay ? 'o' : ''}${item.pageid}`}
          pagingEnabled
          snapToInterval={H}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={4}
          ListFooterComponent={renderFooter}
          style={{ height: H }}
          windowSize={7}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={30}
          removeClippedSubviews={false}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({ length: H, offset: H * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
        />
      )}

      {/* Feed mode selector — sits above the category chips */}
      <FeedSelector
        mode={feedMode}
        forYouAvailable={forYouAvailable}
        forYouLabel={t.forYou}
        exploreLabel={t.explore}
        onSelect={handleFeedModeChange}
        topInset={insets.top}
      />

      <CategoryFilter
        selected={category}
        onSelect={handleCategoryChange}
        lang={lang}
        topOffset={FEED_SELECTOR_H + insets.top}
      />

      <ArticleModal article={modalArticle} onClose={() => setModalArticle(null)} />

      {onboardingChecked && showOnboarding && (
        <OnboardingScreen onDone={handleOnboardingDone} />
      )}
    </View>
  );
}

// ─── Feed mode selector ──────────────────────────────────────────────────────

interface FeedSelectorProps {
  mode: FeedMode;
  forYouAvailable: boolean;
  forYouLabel: string;
  exploreLabel: string;
  onSelect: (mode: FeedMode) => void;
  /** Safe-area top inset (status bar / notch) so the tabs clear it in PWA. */
  topInset?: number;
}

function FeedSelector({ mode, forYouAvailable, forYouLabel, exploreLabel, onSelect, topInset = 0 }: FeedSelectorProps) {
  return (
    <View style={[selectorStyles.wrapper, { height: FEED_SELECTOR_H + topInset, paddingTop: topInset }]} pointerEvents="box-none">
      <View style={selectorStyles.row}>
        <View style={selectorStyles.toggle}>
          <SelectorPill
            label={forYouLabel}
            active={mode === 'forYou'}
            dimmed={!forYouAvailable}
            onPress={() => onSelect('forYou')}
          />
          <SelectorPill
            label={exploreLabel}
            active={mode === 'explore'}
            onPress={() => onSelect('explore')}
          />
        </View>
      </View>
    </View>
  );
}

function SelectorPill({
  label,
  active,
  dimmed,
  onPress,
}: {
  label: string;
  active: boolean;
  dimmed?: boolean;
  onPress: () => void;
}) {
  if (active) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={selectorStyles.pillWrap}>
        <LinearGradient
          colors={['#5e7fff', '#a45eff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={selectorStyles.pillActive}
        >
          <Text style={[selectorStyles.pillTextActive, { fontFamily: FONT_SORA }]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={selectorStyles.pillInactive}>
      <Text style={[selectorStyles.pillText, dimmed && selectorStyles.pillTextDimmed, { fontFamily: FONT_SORA }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const selectorStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: FEED_SELECTOR_H,
    zIndex: 11,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  row: {
    paddingBottom: 4,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    padding: 3,
  },
  pillWrap: { borderRadius: 19, overflow: 'hidden' },
  pillActive: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 19,
  },
  pillInactive: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 19,
  },
  pillTextActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pillText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextDimmed: { color: 'rgba(255,255,255,0.22)' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1128' },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 30,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#5e7fff',
  },
  center: {
    flex: 1,
    backgroundColor: '#0d1128',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loader: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1128' },
  errorEmoji: { fontSize: 40 },
  endEmoji: { fontSize: 32, color: 'rgba(255,255,255,0.4)', marginBottom: 8 },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
