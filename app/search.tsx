import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { searchArticles } from '../src/utils/wikipedia';
import { useLanguage } from '../src/context/LanguageContext';
import { WikiArticle } from '../src/types';
import SavedCard from '../src/components/SavedCard';
import ArticleModal from '../src/components/ArticleModal';
import { useSaved } from '../src/context/SavedContext';
import { getStrings } from '../src/utils/i18n';
import { FONT_SORA } from '../src/utils/fonts';

export default function SearchScreen() {
  const { lang } = useLanguage();
  const { unsave } = useSaved();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [modalArticle, setModalArticle] = useState<WikiArticle | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  const t = getStrings(lang);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setResults([]); setSearched(false); return; }
    const requestId = ++requestRef.current;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await searchArticles(text, lang);
        if (requestRef.current === requestId) setResults(res);
      } catch {
        if (requestRef.current === requestId) setResults([]);
      } finally {
        if (requestRef.current === requestId) setLoading(false);
      }
    }, 400);
  }, [lang]);

  useEffect(() => {
    if (query.trim()) handleSearch(query);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handleSearch]);

  function handleRemove(article: WikiArticle) {
    unsave(article);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t.searchHeader}</Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={t.searchPlaceholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color="#fff" />
        </View>
      )}

      {!loading && searched && results.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔎</Text>
          <Text style={styles.emptyText}>{t.searchNoResults(query)}</Text>
        </View>
      )}

      {!loading && !searched && (
        <View style={styles.empty}>
          {Platform.OS === 'web' ? (
            // @ts-ignore
            <div dangerouslySetInnerHTML={{ __html: `<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g2g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5e7fff"/><stop offset="100%" stop-color="#a45eff"/></linearGradient></defs><circle cx="36" cy="36" r="31" stroke="url(#g2g)" stroke-width="2"/><path d="M36 5Q44 18 44 36Q44 54 36 67" stroke="url(#g2g)" stroke-width="1.5" fill="none"/><path d="M36 5Q28 18 28 36Q28 54 36 67" stroke="url(#g2g)" stroke-width="1.5" fill="none"/><line x1="7" y1="26" x2="65" y2="26" stroke="url(#g2g)" stroke-width="1.3"/><line x1="5" y1="36" x2="67" y2="36" stroke="url(#g2g)" stroke-width="1.3"/><line x1="7" y1="46" x2="65" y2="46" stroke="url(#g2g)" stroke-width="1.3"/></svg>` }} />
          ) : (
            <Text style={styles.emptyEmoji}>🌍</Text>
          )}
          <Text style={styles.emptyTitle}>{t.searchEmpty}</Text>
          <Text style={styles.emptySubtitle}>{t.searchPromo}</Text>
          <View style={styles.dots}>
            <View style={[styles.dot, { width: 28, backgroundColor: '#5e7fff' }]} />
            <View style={[styles.dot, { width: 18, backgroundColor: '#a45eff' }]} />
            <View style={[styles.dot, { width: 36, backgroundColor: '#e040cc' }]} />
          </View>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.pageid)}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setModalArticle(item)} activeOpacity={0.85}>
            <SavedCard article={item} onRemove={handleRemove} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <ArticleModal article={modalArticle} onClose={() => setModalArticle(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1128',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  inputIcon: { fontSize: 16 },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    padding: 0,
    fontFamily: FONT_SORA,
  },
  clearBtn: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '700',
  },
  loader: { paddingTop: 40, alignItems: 'center' },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: FONT_SORA,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONT_SORA,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  dot: { height: 3, borderRadius: 2 },
  list: { paddingBottom: 100, paddingTop: 8 },
});
