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
import { useArticles } from '../src/hooks/useArticles';
import ArticleCard from '../src/components/ArticleCard';
import CategoryFilter from '../src/components/CategoryFilter';
import ArticleModal from '../src/components/ArticleModal';
import { WikiArticle } from '../src/types';

export default function DiscoverScreen() {
  const { height: H } = useWindowDimensions();
  const [category, setCategory] = useState<string | null>(null);
  const [modalArticle, setModalArticle] = useState<WikiArticle | null>(null);
  const { articles, loading, error, loadMore, reset } = useArticles(category);
  const flatListRef = useRef<FlatList<WikiArticle>>(null);
  const currentIndexRef = useRef(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadMore();
    }
  }, []);

  // Register service worker on web
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/scrollpedia/sw.js').catch(() => {});
    }
  }, []);

  // When category changes, reset and reload
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
    if (next < articles.length) {
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }
  }, [articles.length]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        currentIndexRef.current = viewableItems[0].index ?? 0;
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });

  function renderItem({ item }: { item: WikiArticle }) {
    return (
      <ArticleCard
        article={item}
        onSkip={handleSkip}
        onReadMore={() => setModalArticle(item)}
      />
    );
  }

  function renderFooter() {
    if (!loading) return null;
    return (
      <View style={[styles.loader, { height: H }]}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (error && articles.length === 0) {
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

  if (articles.length === 0 && loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.loadingText}>Učitavanje članaka…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={articles}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.pageid)}
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

      <CategoryFilter selected={category} onSelect={handleCategoryChange} />

      <ArticleModal article={modalArticle} onClose={() => setModalArticle(null)} />
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
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 12 },
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
