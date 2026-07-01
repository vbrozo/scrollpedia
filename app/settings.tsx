import React from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { LANGUAGES, useLanguage } from '../src/context/LanguageContext';
import { FONT_OPTIONS, useTheme } from '../src/context/ThemeContext';
import { getStrings } from '../src/utils/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.1';

export default function SettingsScreen() {
  const { lang, setLang } = useLanguage();
  const { fontScale, amoled, bg, setFontScale, setAmoled } = useTheme();
  const insets = useSafeAreaInsets();
  const t = getStrings(lang);

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={[styles.content, { paddingTop: Math.max(styles.content.paddingTop, insets.top + 12) }]}>
      <Text style={styles.header}>{t.settingsHeader}</Text>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.coffeeBtn}
          onPress={() => Linking.openURL('https://buymeacoffee.com/vbrozou')}
          activeOpacity={0.8}
        >
          <Text style={styles.clearBtnEmoji}>☕</Text>
          <View style={styles.clearBtnInfo}>
            <Text style={styles.coffeeBtnTitle}>{t.buyMeCoffee}</Text>
            <Text style={styles.coffeeBtnSub}>{t.buyMeCoffeeSubtitle}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.displaySection}</Text>
        <View style={styles.fontRow}>
          {FONT_OPTIONS.map((o) => {
            const active = fontScale === o.scale;
            return (
              <TouchableOpacity
                key={o.key}
                onPress={() => setFontScale(o.scale)}
                activeOpacity={0.75}
                style={[styles.fontBtn, !active && { borderColor: 'rgba(255,255,255,0.07)' }]}
              >
                {active ? (
                  <LinearGradient
                    colors={['rgba(94,127,255,0.18)', 'rgba(164,94,255,0.18)']}
                    style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                ) : null}
                <Text style={[styles.fontBtnText, active && styles.fontBtnTextActive, { fontSize: 14 * o.scale }]}>A</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hint}>{t.fontSizeHint}</Text>

        <TouchableOpacity
          style={[styles.toggleRow, amoled && styles.toggleRowActive]}
          onPress={() => setAmoled(!amoled)}
          activeOpacity={0.75}
        >
          <Text style={styles.clearBtnEmoji}>{amoled ? '🌑' : '🌙'}</Text>
          <View style={styles.clearBtnInfo}>
            <Text style={styles.clearBtnTitle}>{t.amoledMode}</Text>
            <Text style={styles.clearBtnSub}>{t.amoledHint}</Text>
          </View>
          <View style={[styles.switchTrack, amoled && styles.switchTrackOn]}>
            {amoled && (
              <LinearGradient
                colors={['#5e7fff', '#a45eff']}
                style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
            <View style={[styles.switchThumb, amoled && styles.switchThumbOn]} />
          </View>
        </TouchableOpacity>
      </View>

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
                    {Platform.OS === 'web' ? (
                      // @ts-ignore
                      <div dangerouslySetInnerHTML={{ __html: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9l4.5 4.5 7.5-8" stroke="url(#cg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5e7fff"/><stop offset="100%" stop-color="#a45eff"/></linearGradient></defs></svg>` }} />
                    ) : (
                      <Text style={styles.check}>✓</Text>
                    )}
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
        <Text style={styles.sectionLabel}>{t.aboutApp}</Text>
        <View style={styles.infoBox}>
          <InfoRow label={t.version} value={APP_VERSION} />
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
    backgroundColor: '#0d1128',
  },
  content: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120,
  },
  header: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  section: {
    marginBottom: 32,
  },
  fontRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
  },
  fontBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(20,27,52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  fontBtnActive: {
    borderColor: 'rgba(94,127,255,0.45)',
  },
  fontBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '800',
  },
  fontBtnTextActive: {
    color: '#fff',
  },
  toggleRow: {
    marginHorizontal: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgb(20,27,52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  toggleRowActive: {
    borderColor: 'rgba(94,127,255,0.3)',
  },
  switchTrack: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: 'transparent',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
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
    borderColor: 'rgba(255,255,255,0.07)',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgb(20,27,52)',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  langRowActive: {
    backgroundColor: 'rgba(94,127,255,0.08)',
  },
  langFlag: {
    fontSize: 34,
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
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: '#5e7fff',
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
    borderColor: 'rgba(255,255,255,0.07)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgb(20,27,52)',
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
  clearBtnSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  coffeeBtn: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#fff6df',
    borderWidth: 1,
    borderColor: '#ffd76a',
  },
  coffeeBtnTitle: {
    color: '#4a3200',
    fontSize: 15,
    fontWeight: '700',
  },
  coffeeBtnSub: {
    color: '#8a6a1f',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
});
