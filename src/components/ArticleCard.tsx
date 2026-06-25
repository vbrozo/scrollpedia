import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Linking,
  PanResponder,
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
import { isArticleSaved, saveArticle, unsaveArticle } from '../utils/storage';

interface Props {
  article: WikiArticle;
  onSkip?: () => void;
  onReadMore?: () => void;
}

const SWIPE_THRESHOLD = 80;

export default function ArticleCard({ article, onSkip, onReadMore }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const [saved, setSaved] = useState(false);
  const [swipeLabel, setSwipeLabel] = useState<'SAVE' | 'SKIP' | null>(null);
  const swipeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isArticleSaved(article.pageid).then(setSaved);
  }, [article.pageid]);

  async function triggerSave() {
    if (!saved) {
      await saveArticle(article);
      setSaved(true);
    }
  }

  async function handleShare() {
    await Share.share({ title: article.title, url: article.fullurl, message: article.fullurl });
  }

  function handleOpen() {
    Linking.openURL(article.fullurl);
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8,
      onPanResponderMove: (_, { dx }) => {
        swipeX.setValue(dx);
        setSwipeLabel(dx > 20 ? 'SAVE' : dx < -20 ? 'SKIP' : null);
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx > SWIPE_THRESHOLD) {
          triggerSave();
          Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
          setSwipeLabel(null);
        } else if (dx < -SWIPE_THRESHOLD) {
          Animated.timing(swipeX, {
            toValue: -500,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            swipeX.setValue(0);
            setSwipeLabel(null);
            onSkip?.();
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

  const rotate = swipeX.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-4deg', '0deg', '4deg'],
    extrapolate: 'clamp',
  });

  const truncated =
    article.extract.length > 280 ? article.extract.slice(0, 277) + '…' : article.extract;
  const isWeb = Platform.OS === 'web';

  return (
    <Animated.View
      style={[styles.card, { width: W, height: H }, { transform: [{ translateX: swipeX }, { rotate }] }]}
      {...(isWeb ? {} : panResponder.panHandlers)}
    >
      {article.thumbnail ? (
        <Image
          source={{ uri: article.thumbnail.source }}
          style={[StyleSheet.absoluteFill, { width: W, height: H }]}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={StyleSheet.absoluteFill}
        />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.93)']}
        locations={[0.15, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Swipe overlay label */}
      {swipeLabel === 'SAVE' && (
        <View style={[styles.swipeOverlay, styles.swipeOverlaySave]}>
          <Text style={styles.swipeOverlayText}>🔖 SAVE</Text>
        </View>
      )}
      {swipeLabel === 'SKIP' && (
        <View style={[styles.swipeOverlay, styles.swipeOverlaySkip]}>
          <Text style={styles.swipeOverlayText}>→ SKIP</Text>
        </View>
      )}

      {/* Content */}
      <View style={[styles.content, { paddingBottom: isWeb ? 80 : Platform.OS === 'ios' ? 110 : 90 }]}>
        <View style={styles.textBox}>
          <Text style={styles.title} numberOfLines={3}>{article.title}</Text>
          {truncated ? <Text style={styles.extract}>{truncated}</Text> : null}
          <TouchableOpacity onPress={onReadMore} style={styles.readMoreBtn} activeOpacity={0.7}>
            <Text style={styles.readMoreText}>Čitaj više →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <ActionButton
            emoji={saved ? '🔖' : '🏷️'}
            label={saved ? 'Saved' : 'Save'}
            onPress={async () => { await triggerSave(); }}
            active={saved}
          />
          <ActionButton emoji="↗️" label="Dijeli" onPress={handleShare} />
          <ActionButton emoji="🌐" label="Otvori" onPress={handleOpen} />
        </View>
      </View>

      {/* Badge */}
      <View style={[styles.badge, { top: isWeb ? 24 : Platform.OS === 'ios' ? 60 : 40 }]}>
        <Text style={styles.badgeText}>SCROLLPEDIA</Text>
      </View>

      {/* Swipe hints */}
      {!isWeb && (
        <View style={styles.hints}>
          <Text style={styles.hintText}>← skip</Text>
          <Text style={styles.hintText}>save →</Text>
        </View>
      )}
    </Animated.View>
  );
}

function ActionButton({
  emoji, label, onPress, active,
}: {
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
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
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
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 8,
    lineHeight: 28,
  },
  extract: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    marginBottom: 10,
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  readMoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  btnActive: {
    backgroundColor: 'rgba(255, 220, 80, 0.2)',
    borderColor: 'rgba(255, 220, 80, 0.4)',
  },
  btnEmoji: { fontSize: 20, marginBottom: 4 },
  btnLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  badgeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  swipeOverlay: {
    position: 'absolute',
    top: '40%',
    left: 30,
    right: 30,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    zIndex: 20,
  },
  swipeOverlaySave: {
    backgroundColor: 'rgba(50, 200, 100, 0.25)',
    borderColor: 'rgba(50, 200, 100, 0.7)',
  },
  swipeOverlaySkip: {
    backgroundColor: 'rgba(255, 80, 80, 0.2)',
    borderColor: 'rgba(255, 80, 80, 0.6)',
  },
  swipeOverlayText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  hints: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    opacity: 0.25,
  },
  hintText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
