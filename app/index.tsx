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
import { useArticles } from '../src/hooks/useArticles';
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

const HIGHLIGHT_CACHE_KEY = 'scrollpedia_daily_highlight';
const ONTHISDAY_CACHE_KEY = 'scrollpedia_onthisday';
const ONBOARDING_KEY = 'scrollpedia_onboarding_done';
const SKELETON_COUNT = 4;

function todayCacheKey(lang: string) {
  const d = new Date();
  return `${lang}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function DiscoverScreen() {
  const { width: W, height: H } = useWindowDimensions();
  const { lang } = useLanguage();
  const [category, setCategory] = useState<string | null>(null);
  const [modalArticle, setModalArticle] = useState<WikiArticle | null>(null);
  const [highlight, setHighlight] = useState<WikiArticle | null>(null);
  const [onThisDay, setOnThisDay] = useState<WikiArticle | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const { articles, loading, error, hasMore, loadMore, reset } = useArticles(category, lang);
  const t = getStrings(lang);
  const flatListRef = useRef<FlatList<WikiArticle>>(null);
  const currentIndexRef = useRef(0);
  const feedLengthRef = useRef(0);
  const previousLangRef = useRef(lang);
  // Stable ref so onViewableItemsChanged (which can't change after mount) can
  // always call the latest loadMore without being in its dependency list.
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

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

  // Reload articles after React commits category/language changes.
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
  }, [category, lang, loadMore, reset]);

  const handleCategoryChange = useCallback(
    (value: string | null) => {
      setCategory(value);
    },
    []
  );

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
      // Proactively pre-fetch when within 5 cards of the end so the next batch
      // arrives before the user hits the loading footer.
      if (feedLengthRef.current - idx <= 5) {
        loadMoreRef.current();
      }
    }
  }, []); // stable — loadMore is accessed via ref

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

  // Pre-warm: after the first batch lands, immediately load a second one so
  // the feed has a deep buffer (≥20 articles) before the user reaches the end.
  useEffect(() => {
    if (!category && articles.length > 0 && articles.length < 15 && hasMore) {
      loadMoreRef.current();
    }
  }, [articles.length, hasMore, category]);

  // Show skeletons whenever the feed has no content yet and there's no error —
  // not just while `loading` is true. This avoids a black gap between the React
  // shell mounting (HTML splash removed) and the first data/onboarding appearing.
  const showSkeletons = feedData.length === 0 && !error;

  const renderItem = useCallback(({ item, index }: { item: WikiArticle; index: number }) => {
    if (item.isHighlight) {
      return <DailyHighlightCard article={item} width={W} height={H} onReadMore={() => setModalArticle(item)} />;
    }
    if (item.isOnThisDay) {
      return <OnThisDayCard article={item} width={W} height={H} onReadMore={() => setModalArticle(item)} />;
    }
    return (
      <ArticleCard article={item} index={index} total={feedData.length} width={W} height={H} onSkip={handleSkip} onReadMore={() => setModalArticle(item)} />
    );
  }, [W, H, feedData.length, handleSkip]);

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
    if (loading) {
      return <SkeletonCard />;
    }
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
          // Keep more full-screen cards mounted around the viewport so the next
          // card (and its image) is always pre-rendered before you page to it —
          // windowSize=3 only mounted ~1 card ahead, causing blank cells + no
          // image request on fast scroll.
          windowSize={5}
          initialNumToRender={3}
          maxToRenderPerBatch={4}
          getItemLayout={(_, index) => ({ length: H, offset: H * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
        />
      )}

      <CategoryFilter selected={category} onSelect={handleCategoryChange} lang={lang} />
      <ArticleModal article={modalArticle} onClose={() => setModalArticle(null)} />

      {onboardingChecked && showOnboarding && (
        <OnboardingScreen onDone={handleOnboardingDone} />
      )}
    </View>
  );
}

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
