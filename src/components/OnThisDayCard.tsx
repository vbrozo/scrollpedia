import React from 'react';
import {
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { WikiArticle } from '../types';
import { useSaved } from '../context/SavedContext';
import { useLanguage } from '../context/LanguageContext';
import { getStrings } from '../utils/i18n';

interface Props {
  article: WikiArticle;
  onReadMore?: () => void;
}

const MONTHS: Record<string, string[]> = {
  hr: ['siječnja','veljače','ožujka','travnja','svibnja','lipnja','srpnja','kolovoza','rujna','listopada','studenog','prosinca'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  fr: ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],
  es: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
  it: ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'],
};

function todayFormatted(lang: string) {
  const now = new Date();
  const months = MONTHS[lang] ?? MONTHS.en;
  return `${now.getDate()}. ${months[now.getMonth()]}`;
}

const SORA = Platform.OS === 'web' ? 'Sora, system-ui, sans-serif' : undefined;

export default function OnThisDayCard({ article, onReadMore }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(article);
  const isWeb = Platform.OS === 'web';
  const globeSize = Math.min(W, H) * 0.62;

  const truncated = article.extract.length > 220 ? article.extract.slice(0, 217) + '…' : article.extract;

  return (
    <View style={[styles.card, { width: W, height: H }]}>
      {/* Ghost globe - magenta accent */}
      <View style={[styles.globe, { width: globeSize, height: globeSize, borderRadius: globeSize / 2, top: H * 0.1, left: (W - globeSize) / 2 }]}>
        <View style={[styles.meridian, { left: globeSize * 0.25, right: globeSize * 0.25 }]} />
        <View style={[styles.meridian, { left: globeSize * 0.415, right: globeSize * 0.415, borderColor: 'rgba(224,64,204,0.05)' }]} />
        <View style={[styles.latitude, { top: '38%' }]} />
        <View style={[styles.latitude, { top: '62%' }]} />
      </View>

      <View style={[styles.content, { paddingBottom: isWeb ? 80 : Platform.OS === 'ios' ? 110 : 90 }]}>
        {/* Top row: badge + date */}
        <View style={styles.topRow}>
          <View style={styles.pill}>
            <Text style={styles.pillIcon}>📅</Text>
            <Text style={[styles.pillText, { fontFamily: SORA }]}>{t.onThisDay}</Text>
          </View>
          <View style={styles.dateChip}>
            <Text style={[styles.dateText, { fontFamily: SORA }]}>{todayFormatted(lang)}</Text>
          </View>
        </View>

        {article.onThisDayYear && (
          <View style={styles.yearPill}>
            <Text style={[styles.yearText, { fontFamily: SORA }]}>{article.onThisDayYear}</Text>
          </View>
        )}

        {article.onThisDayText && (
          <Text style={[styles.eventText, { fontFamily: SORA }]} numberOfLines={2}>{article.onThisDayText}</Text>
        )}

        <Text style={[styles.title, { fontFamily: SORA }]} numberOfLines={2}>{article.title}</Text>
        {truncated ? <Text style={[styles.extract, { fontFamily: SORA }]} numberOfLines={3}>{truncated}</Text> : null}

        <TouchableOpacity onPress={onReadMore} style={styles.readMoreBtn} activeOpacity={0.7}>
          <Text style={[styles.readMoreText, { fontFamily: SORA }]}>{t.readMore} →</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          <View style={[styles.dot, { width: 14, backgroundColor: '#e040cc' }]} />
          <View style={[styles.dot, { width: 36, backgroundColor: '#f0bd18' }]} />
          <View style={[styles.dot, { width: 24, backgroundColor: '#5e7fff' }]} />
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
  globe: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(224,64,204,0.11)' },
  meridian: { position: 'absolute', top: 0, bottom: 0, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(224,64,204,0.08)' },
  latitude: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(224,64,204,0.07)' },
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 22 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(224,64,204,0.15)', borderWidth: 1, borderColor: 'rgba(224,64,204,0.32)' },
  pillIcon: { fontSize: 11 },
  pillText: { color: '#e040cc', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  dateChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dateText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '500' },
  yearPill: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(224,64,204,0.18)', borderWidth: 1, borderColor: 'rgba(224,64,204,0.32)', marginBottom: 10 },
  yearText: { color: '#e040cc', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  eventText: { color: 'rgba(200,180,255,0.8)', fontSize: 13, lineHeight: 19, fontStyle: 'italic', marginBottom: 10 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.3, lineHeight: 34, marginBottom: 10 },
  extract: { color: 'rgba(255,255,255,0.58)', fontSize: 14, lineHeight: 22, marginBottom: 14 },
  readMoreBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  readMoreText: { color: 'rgba(255,255,255,0.38)', fontSize: 13, fontWeight: '600' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16 },
  dot: { height: 3, borderRadius: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btnActive: { backgroundColor: 'rgba(224,64,204,0.15)', borderColor: 'rgba(224,64,204,0.35)' },
  btnEmoji: { fontSize: 20, marginBottom: 4 },
  btnLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
});
