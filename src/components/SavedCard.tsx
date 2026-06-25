import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WikiArticle } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getStrings } from '../utils/i18n';

interface Props {
  article: WikiArticle;
  onRemove: (article: WikiArticle) => void;
}

export default function SavedCard({ article, onRemove }: Props) {
  const { lang } = useLanguage();
  const t = getStrings(lang);

  return (
    <View style={styles.card}>
      {article.thumbnail ? (
        <Image source={{ uri: article.thumbnail.source }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#1a1a2e', '#0f3460']} style={styles.thumb} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.extract} numberOfLines={2}>
          {article.extract.slice(0, 120)}…
        </Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => Linking.openURL(article.fullurl)} style={styles.pill}>
            <Text style={styles.pillText}>{t.open}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onRemove(article)} style={[styles.pill, styles.pillDanger]}>
            <Text style={[styles.pillText, styles.pillTextDanger]}>{t.remove}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#252525',
  },
  thumb: {
    width: 100,
    height: 110,
  },
  info: {
    flex: 1,
    padding: 12,
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
    gap: 8,
    marginTop: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pillDanger: {
    backgroundColor: 'rgba(255,60,60,0.08)',
    borderColor: 'rgba(255,60,60,0.2)',
  },
  pillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextDanger: {
    color: '#ff6060',
  },
});
