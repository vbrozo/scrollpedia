import React, { useEffect, useRef } from 'react';
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
import { WikiArticle } from '../src/types';

export default function DiscoverScreen() {
  const { width: W, height: H } = useWindowDimensions();
  const { articles, loading, error, loadMore } = useArticles();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadMore();
    }
  }, []);

  // Register service worker on web
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/scrollpedia/sw.js').catch(() => {});
    }
  }, []);

  function renderItem({ item }: { item: WikiArticle }) {
    return <ArticleCard article={item} />;
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
          <Text style={styles.retryText}>Retry</Text>
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
    <FlatList
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
      style={[styles.list, { height: H }]}
      windowSize={3}
      initialNumToRender={2}
      maxToRenderPerBatch={3}
      getItemLayout={(_, index) => ({ length: H, offset: H * index, index })}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  center: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 12,
  },
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
