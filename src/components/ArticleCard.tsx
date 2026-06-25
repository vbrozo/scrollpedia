import React, { useEffect, useState } from 'react';
import {
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
import { BlurView } from 'expo-blur';
import { WikiArticle } from '../types';
import { isArticleSaved, saveArticle, unsaveArticle } from '../utils/storage';

interface Props {
  article: WikiArticle;
}

export default function ArticleCard({ article }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    isArticleSaved(article.pageid).then(setSaved);
  }, [article.pageid]);

  async function toggleSave() {
    if (saved) {
      await unsaveArticle(article.pageid);
      setSaved(false);
    } else {
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

  const truncated =
    article.extract.length > 320 ? article.extract.slice(0, 317) + '…' : article.extract;

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
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={StyleSheet.absoluteFill}
        />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.93)']}
        locations={[0.15, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingBottom: isWeb ? 80 : Platform.OS === 'ios' ? 110 : 90 }]}>
        <BlurView intensity={isWeb ? 0 : 20} tint="dark" style={styles.textBox}>
          <Text style={styles.title} numberOfLines={3}>{article.title}</Text>
          {truncated ? <Text style={styles.extract}>{truncated}</Text> : null}
        </BlurView>

        <View style={styles.actions}>
          <ActionButton
            emoji={saved ? '🔖' : '🏷️'}
            label={saved ? 'Saved' : 'Save'}
            onPress={toggleSave}
            active={saved}
          />
          <ActionButton emoji="↗️" label="Share" onPress={handleShare} />
          <ActionButton emoji="🌐" label="Open" onPress={handleOpen} />
        </View>
      </View>

      <View style={[styles.badge, { top: isWeb ? 24 : Platform.OS === 'ios' ? 60 : 40 }]}>
        <Text style={styles.badgeText}>SCROLLPEDIA</Text>
      </View>
    </View>
  );
}

function ActionButton({
  emoji,
  label,
  onPress,
  active,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  active?: boolean;
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
    overflow: 'hidden',
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.45)',
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
  btnEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
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
});
