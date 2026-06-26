import React from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getArticleKey } from '../src/utils/storage';
import SavedCard from '../src/components/SavedCard';
import { WikiArticle } from '../src/types';
import { useLanguage } from '../src/context/LanguageContext';
import { useSaved } from '../src/context/SavedContext';
import { useTheme } from '../src/context/ThemeContext';
import { getStrings } from '../src/utils/i18n';
import { FONT_SORA as SORA } from '../src/utils/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SavedScreen() {
  const { lang } = useLanguage();
  const { bg } = useTheme();
  const insets = useSafeAreaInsets();
  const t = getStrings(lang);
  const { saved: articles, unsave } = useSaved();

  if (articles.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: bg }]}>
        {/* Gradient bookmark SVG */}
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <div dangerouslySetInnerHTML={{ __html: `<svg width="64" height="74" viewBox="0 0 64 74" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bkg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5e7fff"/><stop offset="60%" stop-color="#a45eff"/><stop offset="100%" stop-color="#e040cc"/></linearGradient></defs><path d="M6 4h52a4 4 0 014 4v60l-30-17L2 68V8a4 4 0 014-4z" fill="url(#bkg)" opacity=".22"/><path d="M6 4h52a4 4 0 014 4v60l-30-17L2 68V8a4 4 0 014-4z" stroke="url(#bkg)" stroke-width="2.5" stroke-linejoin="round" fill="none"/><line x1="20" y1="24" x2="44" y2="24" stroke="url(#bkg)" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="33" x2="38" y2="33" stroke="url(#bkg)" stroke-width="2" stroke-linecap="round"/></svg>` }} />
        ) : (
          <Text style={styles.emptyEmoji}>🔖</Text>
        )}
        <Text style={[styles.emptyTitle, { fontFamily: SORA }]}>{t.savedEmptyTitle}</Text>
        <Text style={[styles.emptySubtitle, { fontFamily: SORA }]}>{t.savedEmptySubtitle}</Text>
        <View style={styles.dots}>
          <View style={[styles.dot, { width: 22, backgroundColor: '#5e7fff', opacity: 0.6 }]} />
          <View style={[styles.dot, { width: 38, backgroundColor: '#a45eff', opacity: 0.6 }]} />
          <View style={[styles.dot, { width: 16, backgroundColor: '#e040cc', opacity: 0.6 }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: Math.max(styles.container.paddingTop, insets.top + 12) }]}>
      <Text style={[styles.header, { fontFamily: SORA }]}>{t.savedHeader}</Text>
      <FlatList
        data={articles}
        keyExtractor={getArticleKey}
        renderItem={({ item }) => (
          <SavedCard article={item} onRemove={() => unsave(item)} />
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
    backgroundColor: '#0d1128',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  list: { paddingBottom: 100, paddingTop: 4 },
  empty: {
    flex: 1,
    backgroundColor: '#0d1128',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 0,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 20 },
  emptyTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
    lineHeight: 28,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { height: 3, borderRadius: 2 },
});
