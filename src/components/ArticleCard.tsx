import React, { memo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  PanResponder,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WikiArticle } from '../types';
import { useSaved } from '../context/SavedContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getStrings } from '../utils/i18n';
import { readingMinutes } from '../utils/reading';
import { FONT_SORA } from '../utils/fonts';
import ArticleImage from './ArticleImage';

interface Props {
  article: WikiArticle;
  index?: number;
  total?: number;
  width: number;
  height: number;
  onSkip?: () => void;
  onReadMore?: () => void;
  onTopicSelect?: (rawCategory: string) => void;
}

const ACCENTS = [
  { color: '#5e7fff', bg: 'rgba(94,127,255,0.18)', border: 'rgba(94,127,255,0.32)', globe: 'rgba(94,127,255,0.11)', meridian1: 'rgba(94,127,255,0.08)', meridian2: 'rgba(94,127,255,0.05)', latitude: 'rgba(94,127,255,0.07)' },
  { color: '#a45eff', bg: 'rgba(164,94,255,0.18)',  border: 'rgba(164,94,255,0.32)',  globe: 'rgba(164,94,255,0.11)', meridian1: 'rgba(164,94,255,0.08)', meridian2: 'rgba(164,94,255,0.05)', latitude: 'rgba(164,94,255,0.07)' },
  { color: '#e040cc', bg: 'rgba(224,64,204,0.18)',  border: 'rgba(224,64,204,0.32)',  globe: 'rgba(224,64,204,0.11)', meridian1: 'rgba(224,64,204,0.08)', meridian2: 'rgba(224,64,204,0.05)', latitude: 'rgba(224,64,204,0.07)' },
];

const DOT_SETS = [
  [{ w: 36, c: '#5e7fff' }, { w: 22, c: '#a45eff' }, { w: 14, c: '#e040cc' }],
  [{ w: 22, c: '#a45eff' }, { w: 36, c: '#e040cc' }, { w: 16, c: '#5e7fff' }],
  [{ w: 14, c: '#e040cc' }, { w: 36, c: '#f0bd18' }, { w: 24, c: '#5e7fff' }],
];

const SWIPE_THRESHOLD = 80;
const SORA = FONT_SORA;

function ArticleCard({ article, index = 0, total = 0, width: W, height: H, onSkip, onReadMore, onTopicSelect }: Props) {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const { fontScale, cardBg } = useTheme();
  const { isSaved, save, toggle } = useSaved();
  const saved = isSaved(article);
  const [swipeLabel, setSwipeLabel] = useState<'SAVE' | 'SKIP' | null>(null);
  const swipeX = useRef(new Animated.Value(0)).current;
  const articleRef = useRef(article);
  articleRef.current = article;
  const saveRef = useRef(save);
  saveRef.current = save;

  const accent = ACCENTS[index % 3];
  const dots = DOT_SETS[index % 3];
  const isWeb = Platform.OS === 'web';
  const globeSize = Math.min(W, H) * 0.62;
  const globeLeft = (W - globeSize) / 2;
  const globeTop = H * 0.1;
  const meridian1Left = globeSize * 0.25;
  const meridian2Left = globeSize * 0.415;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8,
      onPanResponderMove: (_, { dx }) => {
        swipeX.setValue(dx);
        setSwipeLabel(dx > 20 ? 'SAVE' : dx < -20 ? 'SKIP' : null);
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx > SWIPE_THRESHOLD) {
          saveRef.current(articleRef.current);
          Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
          setSwipeLabel(null);
        } else if (dx < -SWIPE_THRESHOLD) {
          Animated.timing(swipeX, { toValue: -500, duration: 220, useNativeDriver: true }).start(() => {
            swipeX.setValue(0); setSwipeLabel(null); onSkip?.();
          });
        } else {
          Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
          setSwipeLabel(null);
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
        setSwipeLabel(null);
      },
    })
  ).current;

  const rotate = swipeX.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-3deg', '0deg', '3deg'], extrapolate: 'clamp' });
  const truncated = article.extract.length > 220 ? article.extract.slice(0, 217) + '…' : article.extract;
  const minutes = readingMinutes(article.extract);

  return (
    <Animated.View
      style={[styles.card, { width: W, height: H, backgroundColor: cardBg }, { transform: [{ translateX: swipeX }, { rotate }] }]}
      {...(isWeb ? {} : panResponder.panHandlers)}
    >
      {/* Ghost globe */}
      <View style={[styles.globe, { width: globeSize, height: globeSize, borderRadius: globeSize / 2, top: globeTop, left: globeLeft, borderColor: accent.globe }]}>
        <View style={[StyleSheet.absoluteFill, { opacity: 0.28 }]}>
          <ArticleImage uri={article.thumbnail?.source} width={globeSize} height={globeSize} fallbackColors={['#0a0d20', '#0d1128', '#0a0a18']} />
        </View>
        <View style={[styles.meridian, { left: meridian1Left, right: meridian1Left, borderColor: accent.meridian1 }]} />
        <View style={[styles.meridian, { left: meridian2Left, right: meridian2Left, borderColor: accent.meridian2 }]} />
        <View style={[styles.latitude, { top: '38%', backgroundColor: accent.latitude }]} />
        <View style={[styles.latitude, { top: '62%', backgroundColor: accent.latitude }]} />
      </View>

      {swipeLabel === 'SAVE' && <View style={[styles.swipeOverlay, styles.swipeOverlaySave]}><Text style={styles.swipeOverlayText}>🔖 {t.saveOverlay}</Text></View>}
      {swipeLabel === 'SKIP' && <View style={[styles.swipeOverlay, styles.swipeOverlaySkip]}><Text style={styles.swipeOverlayText}>→ {t.skipOverlay}</Text></View>}

      <View style={[styles.content, { paddingBottom: isWeb ? 80 : Platform.OS === 'ios' ? 110 : 90 }]}>
        <View style={styles.pillRow}>
          <View style={styles.pillGroup}>
            <View style={[styles.pill, { backgroundColor: accent.bg, borderColor: accent.border }]}>
              <Text style={[styles.pillText, { color: accent.color, fontFamily: SORA }]}>Wikipedia</Text>
            </View>
            <View style={styles.readTimePill}>
              <Text style={[styles.readTimeText, { fontFamily: SORA }]}>⏱ {t.readingTime(minutes)}</Text>
            </View>
          </View>
          {total > 0 && <Text style={[styles.counter, { fontFamily: SORA }]}>{index + 1} / {total}</Text>}
        </View>

        <Text style={[styles.title, { fontFamily: SORA, fontSize: 34 * fontScale, lineHeight: 40 * fontScale }]} numberOfLines={3}>{article.title}</Text>

        {article.topics && article.topics.length > 0 && (
          <View style={styles.topicRow}>
            {article.topics.map((chip) => (
              <TouchableOpacity
                key={chip.raw}
                onPress={() => onTopicSelect?.(chip.raw)}
                style={[styles.topicChip, { borderColor: accent.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.topicChipText, { color: accent.color, fontFamily: SORA }]}>
                  {chip.display}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {truncated ? <Text style={[styles.extract, { fontFamily: SORA, fontSize: 15 * fontScale, lineHeight: 25 * fontScale }]} numberOfLines={4}>{truncated}</Text> : null}

        <TouchableOpacity onPress={onReadMore} style={styles.readMoreBtn} activeOpacity={0.7}>
          <Text style={[styles.readMoreText, { fontFamily: SORA }]}>{t.readMore} →</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          {dots.map((d, i) => <View key={i} style={[styles.dot, { width: d.w, backgroundColor: d.c }]} />)}
        </View>

        <View style={styles.actions}>
          <ActionButton emoji={saved ? '🔖' : '🏷️'} label={saved ? t.saved : t.save} onPress={() => toggle(article)} active={saved} />
          <ActionButton emoji="↗️" label={t.share} onPress={() => Share.share({ title: article.title, url: article.fullurl, message: article.fullurl })} />
          <ActionButton emoji="🌐" label={t.open} onPress={() => Linking.openURL(article.fullurl)} />
        </View>
      </View>

      {!isWeb && (
        <View style={[styles.hint, { top: Platform.OS === 'ios' ? 70 : 50 }]}>
          <Text style={styles.hintArrow}>↑</Text>
          <Text style={[styles.hintText, { fontFamily: SORA }]}>{t.scrollHint}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default memo(ArticleCard);

function ActionButton({ emoji, label, onPress, active }: { emoji: string; label: string; onPress: () => void; active?: boolean }) {
  return (
    <TouchableOpacity style={[styles.btn, active && styles.btnActive]} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.btnEmoji}>{emoji}</Text>
      <Text style={styles.btnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0d1128', overflow: 'hidden' },
  globe: { position: 'absolute', borderWidth: 1, overflow: 'hidden' },
  meridian: { position: 'absolute', top: 0, bottom: 0, borderRadius: 999, borderWidth: 1 },
  latitude: { position: 'absolute', left: 0, right: 0, height: 1 },
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 22 },
  pillRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  pillGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 12, fontWeight: '600' },
  readTimePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
  readTimeText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  counter: { color: 'rgba(255,255,255,0.28)', fontSize: 12 },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -0.5, lineHeight: 40, marginBottom: 12 },
  extract: { color: 'rgba(255,255,255,0.58)', fontSize: 15, lineHeight: 25, marginBottom: 14 },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  topicChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topicChipText: { fontSize: 11, fontWeight: '600' },
  readMoreBtn: { alignSelf: 'flex-start', marginBottom: 18 },
  readMoreText: { color: 'rgba(255,255,255,0.38)', fontSize: 13, fontWeight: '600' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16 },
  dot: { height: 3, borderRadius: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btnActive: { backgroundColor: 'rgba(94,127,255,0.15)', borderColor: 'rgba(94,127,255,0.35)' },
  btnEmoji: { fontSize: 20, marginBottom: 4 },
  btnLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  swipeOverlay: { position: 'absolute', top: '40%', left: 30, right: 30, alignItems: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 2, zIndex: 20 },
  swipeOverlaySave: { backgroundColor: 'rgba(94,127,255,0.2)', borderColor: 'rgba(94,127,255,0.6)' },
  swipeOverlaySkip: { backgroundColor: 'rgba(255,80,80,0.15)', borderColor: 'rgba(255,80,80,0.5)' },
  swipeOverlayText: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  hint: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 3, opacity: 0.28 },
  hintArrow: { color: '#fff', fontSize: 16 },
  hintText: { color: '#fff', fontSize: 11, fontWeight: '600', letterSpacing: 0.08 },
});
