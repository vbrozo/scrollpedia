import React, { memo } from 'react';
import {
  Linking,
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
import { getStrings } from '../utils/i18n';
import ArticleImage from './ArticleImage';

interface Props {
  article: WikiArticle;
  width: number;
  height: number;
  onReadMore?: () => void;
}

const SORA = Platform.OS === 'web' ? 'Sora, system-ui, sans-serif' : undefined;

function DailyHighlightCard({ article, width: W, height: H, onReadMore }: Props) {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(article);
  const isWeb = Platform.OS === 'web';
  const globeSize = Math.min(W, H) * 0.62;
  const globeLeft = (W - globeSize) / 2;
  const globeTop = H * 0.1;
  const meridian1Left = globeSize * 0.25;
  const meridian2Left = globeSize * 0.415;

  const truncated = article.extract.length > 220 ? article.extract.slice(0, 217) + '…' : article.extract;

  return (
    <View style={[styles.card, { width: W, height: H }]}>
      {/* Ghost globe - golden accent */}
      <View style={[styles.globe, { width: globeSize, height: globeSize, borderRadius: globeSize / 2, top: globeTop, left: globeLeft }]}>
        <View style={[StyleSheet.absoluteFill, { opacity: 0.28 }]}>
          <ArticleImage uri={article.thumbnail?.source} width={globeSize} height={globeSize} fallbackColors={['#1a1200', '#0d1128', '#0a0a18']} />
        </View>
        <View style={[styles.meridian, { left: meridian1Left, right: meridian1Left }]} />
        <View style={[styles.meridian, { left: meridian2Left, right: meridian2Left, borderColor: 'rgba(240,189,24,0.05)' }]} />
        <View style={[styles.latitude, { top: '38%' }]} />
        <View style={[styles.latitude, { top: '62%' }]} />
      </View>

      <View style={[styles.content, { paddingBottom: isWeb ? 80 : Platform.OS === 'ios' ? 110 : 90 }]}>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillStar}>★</Text>
            <Text style={[styles.pillText, { fontFamily: SORA }]}>{t.dailyArticle}</Text>
          </View>
        </View>

        <Text style={[styles.title, { fontFamily: SORA }]} numberOfLines={3}>{article.title}</Text>
        {truncated ? <Text style={[styles.extract, { fontFamily: SORA }]} numberOfLines={4}>{truncated}</Text> : null}

        <TouchableOpacity onPress={onReadMore} style={styles.readMoreBtn} activeOpacity={0.7}>
          <Text style={[styles.readMoreText, { fontFamily: SORA }]}>{t.readMore} →</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          <View style={[styles.dot, { width: 28, backgroundColor: '#f0bd18' }]} />
          <View style={[styles.dot, { width: 18, backgroundColor: '#5e7fff' }]} />
          <View style={[styles.dot, { width: 36, backgroundColor: '#a45eff' }]} />
        </View>

        <View style={styles.actions}>
          <ActionButton emoji={saved ? '🔖' : '🏷️'} label={saved ? t.saved : t.save} onPress={() => toggle(article)} active={saved} />
          <ActionButton emoji="↗️" label={t.share} onPress={() => Share.share({ title: article.title, url: article.fullurl, message: article.fullurl })} />
          <ActionButton emoji="🌐" label={t.open} onPress={() => Linking.openURL(article.fullurl)} />
        </View>
      </View>
    </View>
  );
}

export default memo(DailyHighlightCard);

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
  globe: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(240,189,24,0.11)', overflow: 'hidden' },
  meridian: { position: 'absolute', top: 0, bottom: 0, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(240,189,24,0.08)' },
  latitude: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(240,189,24,0.07)' },
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 22 },
  pillRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(240,189,24,0.15)', borderWidth: 1, borderColor: 'rgba(240,189,24,0.35)' },
  pillStar: { color: '#f0bd18', fontSize: 11 },
  pillText: { color: '#f0bd18', fontSize: 12, fontWeight: '600', letterSpacing: 1.2 },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -0.5, lineHeight: 40, marginBottom: 12 },
  extract: { color: 'rgba(255,255,255,0.58)', fontSize: 15, lineHeight: 25, marginBottom: 14 },
  readMoreBtn: { alignSelf: 'flex-start', marginBottom: 18 },
  readMoreText: { color: 'rgba(255,255,255,0.38)', fontSize: 13, fontWeight: '600' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16 },
  dot: { height: 3, borderRadius: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btnActive: { backgroundColor: 'rgba(240,189,24,0.15)', borderColor: 'rgba(240,189,24,0.35)' },
  btnEmoji: { fontSize: 20, marginBottom: 4 },
  btnLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
});
