import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getArticleKey, getSaved, unsaveArticle } from '../src/utils/storage';
import SavedCard from '../src/components/SavedCard';
import { WikiArticle } from '../src/types';
import { useLanguage } from '../src/context/LanguageContext';
import { getStrings } from '../src/utils/i18n';

export default function SavedScreen() {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const [articles, setArticles] = useState<WikiArticle[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSaved().then(setArticles);
    }, [])
  );

  async function handleRemove(article: WikiArticle) {
    await unsaveArticle(article);
    const key = getArticleKey(article);
    setArticles((prev) => prev.filter((a) => getArticleKey(a) !== key));
  }

  if (articles.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🔖</Text>
        <Text style={styles.emptyTitle}>{t.savedEmptyTitle}</Text>
        <Text style={styles.emptySubtitle}>
          {t.savedEmptySubtitle}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t.savedHeader}</Text>
      <FlatList
        data={articles}
        keyExtractor={getArticleKey}
        renderItem={({ item }) => (
          <SavedCard article={item} onRemove={handleRemove} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 100,
    paddingTop: 4,
  },
  empty: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
});
