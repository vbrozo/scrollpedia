import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES, useLanguage } from '../src/context/LanguageContext';
import { getStrings } from '../src/utils/i18n';

export default function SettingsScreen() {
  const { lang, setLang } = useLanguage();
  const t = getStrings(lang);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  async function handleClearCache() {
    setClearing(true);
    setCleared(false);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) =>
        k.startsWith('scrollpedia_daily_highlight') ||
        k.startsWith('scrollpedia_onthisday') ||
        k === 'scrollpedia_onboarding_done'
      );
      await AsyncStorage.multiRemove(cacheKeys);
      setCleared(true);
      setTimeout(() => setCleared(false), 2500);
    } finally {
      setClearing(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>{t.settingsHeader}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.languageSection}</Text>
        <View style={styles.langList}>
          {LANGUAGES.map((l) => {
            const active = lang === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                style={[styles.langRow, active && styles.langRowActive]}
                onPress={() => setLang(l.code)}
                activeOpacity={0.75}
              >
                <Text style={styles.langFlag}>{l.flag}</Text>
                <View style={styles.langInfo}>
                  <Text style={[styles.langNative, active && styles.langNativeActive]}>
                    {l.nativeName}
                  </Text>
                  <Text style={styles.langLabel}>{l.label}</Text>
                </View>
                {active && (
                  <View style={styles.checkWrap}>
                    <Text style={styles.check}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hint}>
          {t.languageHint}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.developmentOptions}</Text>
        <TouchableOpacity
          style={[styles.clearBtn, cleared && styles.clearBtnDone]}
          onPress={handleClearCache}
          activeOpacity={0.75}
          disabled={clearing}
        >
          <Text style={styles.clearBtnEmoji}>{cleared ? '✓' : '🗑️'}</Text>
          <View style={styles.clearBtnInfo}>
            <Text style={[styles.clearBtnTitle, cleared && styles.clearBtnTitleDone]}>
              {cleared ? t.cacheCleared : clearing ? t.clearing : t.clearCache}
            </Text>
            <Text style={styles.clearBtnSub}>
              {t.clearCacheSubtitle}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.aboutApp}</Text>
        <View style={styles.infoBox}>
          <InfoRow label={t.version} value="1.0.0" />
          <InfoRow label={t.dataSource} value="Wikimedia Foundation" />
          <InfoRow label={t.contentLicense} value="CC BY-SA 4.0" />
        </View>
        <Text style={styles.hint}>
          {t.licenseHint}
        </Text>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120,
  },
  header: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  langList: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#141414',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  langRowActive: {
    backgroundColor: '#1c1c1c',
  },
  langFlag: {
    fontSize: 26,
  },
  langInfo: {
    flex: 1,
  },
  langNative: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '600',
  },
  langNativeActive: {
    color: '#fff',
  },
  langLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    marginTop: 1,
  },
  checkWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: '#0a0a0a',
    fontSize: 13,
    fontWeight: '800',
  },
  hint: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  infoBox: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearBtn: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  clearBtnDone: {
    backgroundColor: '#0d1f0d',
    borderColor: '#1e3a1e',
  },
  clearBtnEmoji: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  clearBtnInfo: {
    flex: 1,
  },
  clearBtnTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600',
  },
  clearBtnTitleDone: {
    color: '#4caf50',
  },
  clearBtnSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
});
