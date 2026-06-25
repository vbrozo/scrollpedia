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
import { LinearGradient } from 'expo-linear-gradient';
import { WikiArticle } from '../types';
import ArticleImage from './ArticleImage';
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

export default function OnThisDayCard({ article, onReadMore }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(article);
  const isWeb = Platform.OS === 'web';

  function toggleSave() {
    toggle(article);
  }

  const truncated =
    article.extract.length > 260 ? article.extract.slice(0, 257) + '…' : article.extract;

  return (
    <View style={[styles.card, { width: W, height: H }]}>
      <ArticleImage
        uri={article.thumbnail?.source}
        width={W}
        height={H}
        fallbackColors={['#06001f', '#0d0533', '#120a45']}
      />

      {/* Deep purple overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.08)', 'rgba(5,0,30,0.6)', 'rgba(5,0,25,0.96)']}
        locations={[0.1, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top row */}
      <View style={[styles.topRow, { top: isWeb ? 24 : Platform.OS === 'ios' ? 60 : 40 }]}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>📅</Text>
          <Text style={styles.badgeText}>{t.onThisDay}</Text>
        </View>
        <View style={styles.dateChip}>
          <Text style={styles.dateText}>{todayFormatted(lang)}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: isWeb ? 80 : Platform.OS === 'ios' ? 110 : 90 }]}>
        {/* Year pill */}
        {article.onThisDayYear && (
          <View style={styles.yearPill}>
            <Text style={styles.yearText}>{article.onThisDayYear}</Text>
          </View>
        )}

        <View style={styles.textBox}>
          {/* Event description */}
          {article.onThisDayText ? (
            <Text style={styles.eventText} numberOfLines={2}>{article.onThisDayText}</Text>
          ) : null}
          <View style={styles.divider} />
          <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
          {truncated ? <Text style={styles.extract}>{truncated}</Text> : null}
          <TouchableOpacity onPress={onReadMore} style={styles.readMoreBtn} activeOpacity={0.7}>
            <Text style={styles.readMoreText}>{t.readMore} →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <ActionButton emoji={saved ? '🔖' : '🏷️'} label={saved ? t.saved : t.save} onPress={toggleSave} active={saved} />
          <ActionButton emoji="↗️" label={t.share} onPress={() => Share.share({ title: article.title, url: article.fullurl, message: article.fullurl })} />
          <ActionButton emoji="🌐" label={t.open} onPress={() => Linking.openURL(article.fullurl)} />
        </View>
      </View>
    </View>
  );
}

function ActionButton({ emoji, label, onPress, active }: {
  emoji: string; label: string; onPress: () => void; active?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.btn, active && styles.btnActive]} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.btnEmoji}>{emoji}</Text>
      <Text style={styles.btnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#06001f', overflow: 'hidden' },
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
    backgroundColor: 'rgba(130, 80, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(150, 100, 255, 0.45)',
  },
  badgeIcon: { fontSize: 11 },
  badgeText: {
    color: '#b89aff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dateText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '500' },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  yearPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(130, 80, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(150, 100, 255, 0.4)',
    marginBottom: 10,
  },
  yearText: { color: '#c4aaff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  textBox: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(130, 80, 255, 0.2)',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  eventText: {
    color: 'rgba(200, 180, 255, 0.85)',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(130, 80, 255, 0.2)',
    marginBottom: 10,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 8,
    lineHeight: 26,
  },
  extract: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(130, 80, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(150, 100, 255, 0.3)',
  },
  readMoreText: { color: '#b89aff', fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
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
    backgroundColor: 'rgba(130, 80, 255, 0.2)',
    borderColor: 'rgba(150, 100, 255, 0.4)',
  },
  btnEmoji: { fontSize: 20, marginBottom: 4 },
  btnLabel: { color: '#fff', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
});
