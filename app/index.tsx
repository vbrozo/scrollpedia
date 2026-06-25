import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import ArticleCard from '../src/components/ArticleCard';
import DailyHighlightCard from '../src/components/DailyHighlightCard';
import SkeletonCard from '../src/components/SkeletonCard';
import OnboardingScreen from '../src/components/OnboardingScreen';
import CategoryFilter from '../src/components/CategoryFilter';
import ArticleModal from '../src/components/ArticleModal';
import { WikiArticle } from '../src/types';
import { fetchDailyHighlight } from '../src/utils/wikipedia';

const HIGHLIGHT_CACHE_KEY = 'scrollpedia_daily_highlight';
const ONBOARDING_KEY = 'scrollpedia_onboarding_done';
const SKELETON_COUNT = 4;

function todayCacheKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function DiscoverScreen() {
  const { height: H } = useWindowDimensions();
  const [category, setCategory] = useState<string | null>(null);
  const [modalArticle, setModalArticle] = useState<WikiArticle | null>(null);
  const [highlight, setHighlight] = useState<WikiArticle | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const { articles, loading, error, loadMore, reset } = useArticles(category);
  const flatListRef = useRef<FlatList<WikiArticle>>(null);
  const currentIndexRef = useRef(0);
  const initialized = useRef(false);

  // Register service worker on web
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/scrollpedia/sw.js').catch(() => {});
    }
  }, []);

  // Check onboarding + fetch highlight in parallel
  useEffect(() => {
    async function init() {
      const [onboardingDone, cachedHighlight] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem(HIGHLIGHT_CACHE_KEY),
      ]);

      setShowOnboarding(!onboardingDone);
      setOnboardingChecked(true);

      // Highlight: try cache first
      const todayKey = todayCacheKey();
      if (cachedHighlight) {
        const { key, article } = JSON.parse(cachedHighlight);
        if (key === todayKey) {
          setHighlight(article);
          return;
        }
      }
      try {
        const article = await fetchDailyHighlight();
        if (article) {
          setHighlight(article);
          await AsyncStorage.setItem(HIGHLIGHT_CACHE_KEY, JSON.stringify({ key: todayKey, article }));
        }
      } catch {}
    }
    init();
  }, []);

  // Initial article load
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadMore();
    }
  }, []);

  async function handleOnboardingDone() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  }

  const handleCategoryChange = useCallback(
    (value: string | null) => {
      setCategory(value);
      reset();
      currentIndexRef.current = 0;
      setTimeout(() => loadMore(), 0);
    },
    [reset, loadMore]
  );

  const handleSkip = useCallback(() => {
    const next = currentIndexRef.current + 1;
    if (next < feedData.length) {
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      currentIndexRef.current = viewableItems[0].index ?? 0;
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const feedData: WikiArticle[] =
    category === null && highlight
      ? [highlight, ...articles.filter((a) => a.pageid !== highlight.pageid)]
      : articles;

  // Show skeletons while initial load is happening
  const showSkeletons = loading && feedData.length === 0;

  function renderItem({ item }: { item: WikiArticle }) {
    if (item.isHighlight) {
      return <DailyHighlightCard article={item} onReadMore={() => setModalArticle(item)} />;
    }
    return (
      <ArticleCard
        article={item}
        onSkip={handleSkip}
        onReadMore={() => setModalArticle(item)}
      />
    );
  }

  function renderFooter() {
    if (!loading || feedData.length === 0) return null;
    return (
      <View style={[styles.loader, { height: H }]}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (error && feedData.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadMore}>
          <Text style={styles.retryText}>Pokušaj ponovo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showSkeletons ? (
        // Skeleton feed during initial load
        <FlatList
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
          ref={flatListRef}
          data={feedData}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.isHighlight ? 'h' : ''}${item.pageid}`}
          pagingEnabled
          snapToInterval={H}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          style={{ height: H }}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          getItemLayout={(_, index) => ({ length: H, offset: H * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
        />
      )}

      <CategoryFilter selected={category} onSelect={handleCategoryChange} />
      <ArticleModal article={modalArticle} onClose={() => setModalArticle(null)} />

      {onboardingChecked && showOnboarding && (
        <OnboardingScreen onDone={handleOnboardingDone} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loader: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' },
  errorEmoji: { fontSize: 40 },
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
