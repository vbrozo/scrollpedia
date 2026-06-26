import React from 'react';
import { Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WikiArticle } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getStrings } from '../utils/i18n';
import { FONT_SORA } from '../utils/fonts';

interface Props {
  article: WikiArticle;
  onRemove: (article: WikiArticle) => void;
  /** When true, shows "Spremi" bookmark instead of "Ukloni" trash — used in Search results */
  saveMode?: boolean;
  onSave?: (article: WikiArticle) => void;
}

const isWeb = Platform.OS === 'web';
const SORA = FONT_SORA;

const TRASH_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="rgba(255,255,255,0.45)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BOOKMARK_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 4h12v17l-6-4-6 4V4z" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

export default function SavedCard({ article, onRemove, saveMode, onSave }: Props) {
  const { lang } = useLanguage();
  const t = getStrings(lang);

  return (
    <View style={styles.card}>
      {/* Thumbnail */}
      {article.thumbnail ? (
        <Image source={{ uri: article.thumbnail.source }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#141b34', '#1e2550']} style={styles.thumb} />
      )}

      <View style={styles.info}>
        <Text style={[styles.title, { fontFamily: SORA }]} numberOfLines={2}>{article.title}</Text>
        <Text style={[styles.extract, { fontFamily: SORA }]} numberOfLines={2}>
          {article.extract.slice(0, 120)}
        </Text>
        <View style={styles.row}>
          {/* Primary: Otvori */}
          <TouchableOpacity onPress={() => Linking.openURL(article.fullurl)} activeOpacity={0.85} style={styles.openBtnWrap}>
            <LinearGradient colors={['#5e7fff', '#a45eff']} style={styles.openBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={[styles.openBtnText, { fontFamily: SORA }]}>{t.open}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary: Ukloni / Spremi */}
          {saveMode ? (
            <TouchableOpacity onPress={() => onSave?.(article)} style={styles.secondaryBtn} activeOpacity={0.75}>
              {isWeb ? (
                // @ts-ignore
                <div dangerouslySetInnerHTML={{ __html: BOOKMARK_SVG }} />
              ) : (
                <Text style={styles.secondaryBtnText}>🔖</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => onRemove(article)} style={styles.secondaryBtn} activeOpacity={0.75}>
              {isWeb ? (
                // @ts-ignore
                <div dangerouslySetInnerHTML={{ __html: TRASH_SVG }} />
              ) : (
                <Text style={styles.secondaryBtnText}>🗑️</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#141b34',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  thumb: {
    width: 62,
    height: 82,
  },
  info: {
    flex: 1,
    padding: 13,
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  extract: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  openBtnWrap: { borderRadius: 18, overflow: 'hidden' },
  openBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  openBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  secondaryBtnText: {
    fontSize: 14,
  },
});
