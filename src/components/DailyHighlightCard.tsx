import React, { useEffect, useState } from 'react';
import {
  Animated,
  Image,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WikiArticle } from '../types';
import { useSaved } from '../context/SavedContext';
import { useLanguage } from '../context/LanguageContext';
import { getStrings } from '../utils/i18n';

interface Props {
  article: WikiArticle;
  onReadMore?: () => void;
}

function todayLabel(lang: string) {
  return new Intl.DateTimeFormat(lang, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

export default function DailyHighlightCard({ article, onReadMore }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(article);
  const shimmer = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle shimmer on the gold badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  function toggleSave() {
    toggle(article);
  }

  const truncated =
    article.extract.length > 300 ? article.extract.slice(0, 297) + '…' : article.extract;

  const badgeOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.card, { width: W, height: H }]}>
      {article.thumbnail ? (
        <Image
          source={{ uri: article.thumbnail.source }}
          style={[StyleSheet.absoluteFill, { width: W, height: H }]}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={['#2d1b00', '#5c3500', '#8b5a00']}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Warm amber gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(10,6,0,0.55)', 'rgba(10,5,0,0.95)']}
        locations={[0.1, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top area: badge + date */}
      <View style={[styles.topRow, { top: isWeb ? 24 : Platform.OS === 'ios' ? 60 : 40 }]}>
        <Animated.View style={[styles.badge, { opacity: badgeOpacity }]}>
          <Text style={styles.badgeStar}>★</Text>
          <Text style={styles.badgeText}>{t.dailyArticle}</Text>
        </Animated.View>
        <View style={styles.dateChip}>
          <Text style={styles.dateText}>{todayLabel(lang)}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: isWeb ? 80 : Platform.OS === 'ios' ? 110 : 90 }]}>
        <View style={styles.textBox}>
          {/* Gold accent line */}
          <View style={styles.accentLine} />
          <Text style={styles.title} numberOfLines={3}>{article.title}</Text>
          {truncated ? <Text style={styles.extract}>{truncated}</Text> : null}
          <TouchableOpacity onPress={onReadMore} style={styles.readMoreBtn} activeOpacity={0.7}>
            <Text style={styles.readMoreText}>{t.readMore} →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <ActionButton
            emoji={saved ? '🔖' : '🏷️'}
            label={saved ? t.saved : t.save}
            onPress={toggleSave}
            active={saved}
          />
          <ActionButton
            emoji="↗️"
            label={t.share}
            onPress={() => Share.share({ title: article.title, url: article.fullurl, message: article.fullurl })}
          />
          <ActionButton
            emoji="🌐"
            label={t.open}
            onPress={() => Linking.openURL(article.fullurl)}
          />
        </View>
      </View>
    </View>
  );
}

function ActionButton({ emoji, label, onPress, active }: {
  emoji: string; label: string; onPress: () => void; active?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.btn, active && styles.btnActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.btnEmoji}>{emoji}</Text>
      <Text style={styles.btnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d0800',
    overflow: 'hidden',
  },
  topRow: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 195, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 195, 0, 0.55)',
  },
  badgeStar: {
    color: '#ffc300',
    fontSize: 11,
  },
  badgeText: {
    color: '#ffc300',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dateText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '500',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  textBox: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 195, 0, 0.2)',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  accentLine: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#ffc300',
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 8,
    lineHeight: 28,
  },
  extract: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 195, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 195, 0, 0.3)',
  },
  readMoreText: {
    color: '#ffc300',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnActive: {
    backgroundColor: 'rgba(255, 195, 0, 0.15)',
    borderColor: 'rgba(255, 195, 0, 0.4)',
  },
  btnEmoji: { fontSize: 20, marginBottom: 4 },
  btnLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
