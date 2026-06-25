import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { WikiArticle } from '../types';
import { isArticleSaved, saveArticle, unsaveArticle } from '../utils/storage';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  article: WikiArticle;
}

export default function ArticleCard({ article }: Props) {
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
    article.extract.length > 300 ? article.extract.slice(0, 297) + '…' : article.extract;

  return (
    <View style={styles.card}>
      {article.thumbnail ? (
        <Image source={{ uri: article.thumbnail.source }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Dark overlay for readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        locations={[0.2, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={styles.content}>
        <BlurView intensity={20} tint="dark" style={styles.textBox}>
          <Text style={styles.title} numberOfLines={3}>{article.title}</Text>
          {truncated ? <Text style={styles.extract}>{truncated}</Text> : null}
        </BlurView>

        {/* Action buttons */}
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

      {/* Top badge */}
      <View style={styles.badge}>
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
    <TouchableOpacity style={[styles.btn, active && styles.btnActive]} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.btnEmoji}>{emoji}</Text>
      <Text style={styles.btnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: W,
    height: H,
    backgroundColor: '#0a0a0a',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 110 : 90,
    paddingHorizontal: 20,
  },
  textBox: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 10,
    lineHeight: 30,
  },
  extract: {
    color: 'rgba(255,255,255,0.8)',
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
    borderColor: 'rgba(255,255,255,0.12)',
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
    top: Platform.OS === 'ios' ? 60 : 40,
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
