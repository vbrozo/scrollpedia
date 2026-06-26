import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useArticles, FeedMode } from '../src/hooks/useArticles';
import { useLanguage } from '../src/context/LanguageContext';
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
  const { lang } = useLanguage();
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

      // Track the viewed article for interest profiling (fire-and-forget)
      const item: WikiArticle | undefined = viewableItems[0].item;
      if (item && !item.isHighlight && !item.isOnThisDay) {
        trackInteraction(item, 'view').then(() => {
          hasEnoughDataForFeed().then(setForYouAvailable);
        });
      }

      if (feedLengthRef.current - idx <= 5) {
        loadMoreRef.current();
      }
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });

  async function handleOnboardingDone() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
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
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadMore}>
          <Text style={styles.retryText}>{t.retryBtn}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
      />

      <CategoryFilter
        selected={category}
        onSelect={handleCategoryChange}
        lang={lang}
        topOffset={FEED_SELECTOR_H}
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
}

function FeedSelector({ mode, forYouAvailable, forYouLabel, exploreLabel, onSelect }: FeedSelectorProps) {
  return (
    <View style={selectorStyles.wrapper} pointerEvents="box-none">
      <View style={selectorStyles.row}>
        <SelectorTab
          label={forYouLabel}
          active={mode === 'forYou'}
          dimmed={!forYouAvailable}
          onPress={() => onSelect('forYou')}
        />
        <SelectorTab
          label={exploreLabel}
          active={mode === 'explore'}
          onPress={() => onSelect('explore')}
        />
      </View>
    </View>
  );
}

function SelectorTab({
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
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={selectorStyles.tab}>
      <Text
        style={[
          selectorStyles.tabText,
          active && selectorStyles.tabTextActive,
          dimmed && !active && selectorStyles.tabTextDimmed,
        ]}
      >
        {label}
      </Text>
      {active && <View style={selectorStyles.indicator} />}
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
    flexDirection: 'row',
    gap: 24,
    paddingBottom: 6,
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 3,
  },
  tabText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONT_SORA,
    letterSpacing: 0.2,
  },
  tabTextActive: { color: '#fff' },
  tabTextDimmed: { color: 'rgba(255,255,255,0.22)' },
  indicator: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: '#5e7fff',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1128' },
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
