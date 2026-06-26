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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const GRAD_START = '#5e7fff';
const GRAD_END = '#a45eff';
const GRAD_MID = '#8e9bff';
const SWIPE_THRESHOLD = 80;
const SORA = FONT_SORA;
const FEED_SELECTOR_H = 44;
const HERO_H = 286;

// Max story dots shown
const MAX_DOTS = 9;

const isWeb = Platform.OS === 'web';

// Gradient text style for web
const gradTextStyle: any = isWeb
  ? { backgroundImage: `linear-gradient(135deg, #7a94ff, #c06bff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }
  : { color: GRAD_MID };

function ArticleCard({ article, index = 0, total = 0, width: W, height: H, onSkip, onReadMore, onTopicSelect }: Props) {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const { fontScale } = useTheme();
  const { isSaved, save, toggle } = useSaved();
  const insets = useSafeAreaInsets();
  const saved = isSaved(article);
  const [swipeLabel, setSwipeLabel] = useState<'SAVE' | 'SKIP' | null>(null);
  const swipeX = useRef(new Animated.Value(0)).current;
  const articleRef = useRef(article);
  articleRef.current = article;
  const saveRef = useRef(save);
  saveRef.current = save;

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
  const truncated = article.extract.length > 200 ? article.extract.slice(0, 197) + '…' : article.extract;
  const minutes = readingMinutes(article.extract);

  const topPad = insets.top + FEED_SELECTOR_H + 8;
  const botPad = isWeb ? 80 : Platform.OS === 'ios' ? 95 : 75;
  const ACTION_H = 56; // height of action buttons row

  // Story indicator: up to MAX_DOTS, current index highlighted
  const dotCount = Math.max(1, Math.min(total || 1, MAX_DOTS));
  const currentDot = total > 0 ? Math.floor((index / Math.max(total - 1, 1)) * (dotCount - 1)) : 0;

  return (
    <Animated.View
      style={[styles.card, { width: W, height: H }, { transform: [{ translateX: swipeX }, { rotate }] }]}
      {...(isWeb ? {} : panResponder.panHandlers)}
    >
      {/* Swipe overlays */}
      {swipeLabel === 'SAVE' && <View style={[styles.swipeOverlay, styles.swipeOverlaySave]}><Text style={styles.swipeOverlayText}>🔖 {t.saveOverlay}</Text></View>}
      {swipeLabel === 'SKIP' && <View style={[styles.swipeOverlay, styles.swipeOverlaySkip]}><Text style={styles.swipeOverlayText}>→ {t.skipOverlay}</Text></View>}

      {/* Story indicator — right edge */}
      <View style={[styles.storyIndicator, { top: topPad + HERO_H / 2 - (dotCount * 13) / 2 }]}>
        {Array.from({ length: dotCount }).map((_, i) => {
          const active = i === currentDot;
          if (active) {
            return (
              <LinearGradient
                key={i}
                colors={[GRAD_START, GRAD_END]}
                style={[styles.storyDot, styles.storyDotActive]}
              />
            );
          }
          return <View key={i} style={styles.storyDot} />;
        })}
      </View>

      {/* Main content column — flows top-down, buttons pinned to bottom */}
      <View style={[styles.content, { paddingTop: topPad, paddingBottom: botPad + ACTION_H + 12 }]}>

        {/* Hero image */}
        <View style={styles.heroWrap}>
          <ArticleImage
            uri={article.thumbnail?.source}
            width={W - 36}
            height={HERO_H}
            fallbackColors={['#141b34', '#1e2550', '#141b34']}
          />
          {/* Bottom fade */}
          <LinearGradient
            colors={['transparent', 'rgba(13,17,40,0.85)']}
            style={styles.heroFade}
            pointerEvents="none"
          />
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {/* Wikipedia chip */}
          {isWeb ? (
            // @ts-ignore web only
            <div dangerouslySetInnerHTML={{ __html: `<div style="display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:20px;background:linear-gradient(135deg,rgba(94,127,255,0.14),rgba(164,94,255,0.14));border:1px solid rgba(164,94,255,0.28);"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="url(#wg)" stroke-width="1.2"/><defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7a94ff"/><stop offset="100%" stop-color="#c06bff"/></linearGradient></defs></svg><span style="font:600 11px/1 Sora,sans-serif;background:linear-gradient(135deg,#7a94ff,#c06bff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Wikipedia</span></div>` }} />
          ) : (
            <View style={styles.wikiChip}>
              <Text style={[styles.wikiChipText, { fontFamily: SORA }]}>Wikipedia</Text>
            </View>
          )}
          <Text style={[styles.readTime, { fontFamily: SORA }]}>
            {t.readingTime(minutes)}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { fontFamily: SORA, fontSize: 32 * fontScale, lineHeight: 38 * fontScale }]} numberOfLines={3}>
          {article.title}
        </Text>

        {/* Tags — max 2, single line */}
        {article.topics && article.topics.length > 0 && (
          <View style={styles.tagRow}>
            {article.topics.slice(0, 2).map((chip) => (
              <TouchableOpacity
                key={chip.raw}
                onPress={() => onTopicSelect?.(chip.raw)}
                style={styles.tag}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, { fontFamily: SORA }]} numberOfLines={1} ellipsizeMode="tail">
                  {chip.display}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Excerpt */}
        {truncated ? (
          <Text style={[styles.extract, { fontFamily: SORA, fontSize: 14 * fontScale, lineHeight: 22 * fontScale }]} numberOfLines={3}>
            {truncated}
          </Text>
        ) : null}

        {/* Read more */}
        <TouchableOpacity onPress={onReadMore} style={styles.readMoreBtn} activeOpacity={0.7}>
          {isWeb ? (
            // @ts-ignore
            <span style={{ font: `600 13px/1 ${SORA},sans-serif`, backgroundImage: 'linear-gradient(135deg,#7a94ff,#c06bff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t.readMore} →
            </span>
          ) : (
            <Text style={[styles.readMoreText, { fontFamily: SORA }]}>{t.readMore} →</Text>
          )}
        </TouchableOpacity>

      </View>

      {/* Actions — pinned to bottom above tab bar */}
      <View style={[styles.actions, { bottom: botPad, paddingHorizontal: 18 }]}>
        <NeutralAction
          icon="bookmark"
          label={saved ? t.saved : t.save}
          onPress={() => toggle(article)}
          active={saved}
        />
        <NeutralAction
          icon="share"
          label={t.share}
          onPress={() => Share.share({ title: article.title, url: article.fullurl, message: article.fullurl })}
        />
        {/* Primary: Otvori */}
        <TouchableOpacity onPress={() => Linking.openURL(article.fullurl)} style={styles.primaryBtn} activeOpacity={0.85}>
          <LinearGradient colors={[GRAD_START, GRAD_END]} style={styles.primaryBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {isWeb ? (
              // @ts-ignore
              <div dangerouslySetInnerHTML={{ __html: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H9M17 7v8" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>` }} />
            ) : (
              <Text style={{ color: '#fff', fontSize: 18 }}>↗</Text>
            )}
            <Text style={[styles.primaryBtnLabel, { fontFamily: SORA }]}>{t.open}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {!isWeb && (
        <View style={[styles.scrollHint, { top: Platform.OS === 'ios' ? 70 : 50 }]}>
          <Text style={styles.hintArrow}>↑</Text>
          <Text style={[styles.hintText, { fontFamily: SORA }]}>{t.scrollHint}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default memo(ArticleCard);

// Neutral action button (Spremi / Dijeli)
function NeutralAction({ icon, label, onPress, active }: { icon: 'bookmark' | 'share'; label: string; onPress: () => void; active?: boolean }) {
  const SORA = FONT_SORA;
  const SVGs = {
    bookmark: `<svg width="20" height="20" viewBox="0 0 24 24" fill="${active ? '#8e9bff' : 'none'}"><path d="M6 4h12v17l-6-4-6 4V4z" stroke="#8e9bff" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    share: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" stroke="#8e9bff" stroke-width="1.6" stroke-linecap="round"/><path d="M12 3v12M12 3L8 7M12 3l4 4" stroke="#8e9bff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };
  return (
    <TouchableOpacity style={[styles.neutralBtn, active && styles.neutralBtnActive]} onPress={onPress} activeOpacity={0.75}>
      {isWeb ? (
        // @ts-ignore
        <div dangerouslySetInnerHTML={{ __html: SVGs[icon] }} />
      ) : (
        <Text style={{ fontSize: 18, color: '#8e9bff' }}>{icon === 'bookmark' ? '🔖' : '↗️'}</Text>
      )}
      <Text style={[styles.neutralBtnLabel, { fontFamily: SORA }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0d1128', overflow: 'hidden' },

  content: {
    flex: 1,
    paddingHorizontal: 18,
  },

  heroWrap: {
    height: HERO_H,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  wikiChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(94,127,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(164,94,255,0.28)',
  },
  wikiChipText: {
    color: '#8e9bff',
    fontSize: 11,
    fontWeight: '600',
  },
  readTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
  },

  title: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
  },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  tagText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '600',
  },

  extract: {
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  readMoreBtn: { alignSelf: 'flex-start', marginBottom: 14 },
  readMoreText: {
    color: '#8e9bff',
    fontSize: 13,
    fontWeight: '600',
  },

  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
  },
  neutralBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#141b34',
    gap: 6,
  },
  neutralBtnActive: {
    backgroundColor: 'rgba(142,155,255,0.12)',
  },
  neutralBtnLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  primaryBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  primaryBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  primaryBtnLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  storyIndicator: {
    position: 'absolute',
    right: 7,
    alignItems: 'center',
    gap: 5,
    zIndex: 5,
  },
  storyDot: {
    width: 3,
    height: 8,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  storyDotActive: {
    width: 3,
    height: 22,
    borderRadius: 2,
  },

  swipeOverlay: { position: 'absolute', top: '40%', left: 30, right: 30, alignItems: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 2, zIndex: 20 },
  swipeOverlaySave: { backgroundColor: 'rgba(94,127,255,0.2)', borderColor: 'rgba(94,127,255,0.6)' },
  swipeOverlaySkip: { backgroundColor: 'rgba(255,80,80,0.15)', borderColor: 'rgba(255,80,80,0.5)' },
  swipeOverlayText: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 2 },

  scrollHint: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 3, opacity: 0.28 },
  hintArrow: { color: '#fff', fontSize: 16 },
  hintText: { color: '#fff', fontSize: 11, fontWeight: '600', letterSpacing: 0.08 },
});
