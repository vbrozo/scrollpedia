import React, { useCallback, useRef, useState } from 'react';
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
import { saveArticle, unsaveArticle } from '../src/utils/storage';

export default function SearchScreen() {
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [modalArticle, setModalArticle] = useState<WikiArticle | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await searchArticles(text, lang);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  function handleRemove(pageid: number) {
    unsaveArticle(pageid);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pretraži</Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Pretraži Wikipedia…"
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
          <Text style={styles.emptyText}>Nema rezultata za "{query}"</Text>
        </View>
      )}

      {!loading && !searched && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌍</Text>
          <Text style={styles.emptyText}>Pretraži bilo koji pojam na hrvatskoj Wikipediji</Text>
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
    backgroundColor: '#0a0a0a',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 10,
  },
  inputIcon: { fontSize: 16 },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
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
    gap: 12,
  },
  emptyEmoji: { fontSize: 44 },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  list: { paddingBottom: 100, paddingTop: 8 },
});
