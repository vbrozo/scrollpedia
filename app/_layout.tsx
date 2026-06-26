import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { LanguageProvider, useLanguage } from '../src/context/LanguageContext';
import { SavedProvider } from '../src/context/SavedContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { getStrings } from '../src/utils/i18n';
import { FONT_SORA } from '../src/utils/fonts';

export default function RootLayout() {
  // Load Sora variable font on native. On web the font comes from the
  // Google Fonts <link> in +html.tsx so useFonts is a no-op there.
  useFonts({ [FONT_SORA]: require('../assets/fonts/Sora-Variable.ttf') });

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <SavedProvider>
            <StatusBar style="light" />
            <AppTabs />
          </SavedProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppTabs() {
  const { lang } = useLanguage();
  const t = getStrings(lang);
  const insets = useSafeAreaInsets();

  // Tab bar sits at the physical bottom (see #root in +html.tsx). On web the
  // safe-area insets read 0, so we reserve a fixed clearance below the icons so
  // they clear the home indicator while still sitting low. On native we use the
  // measured inset.
  const isWeb = Platform.OS === 'web';
  const bottomPad = isWeb ? 18 : Math.max(insets.bottom, 8);
  const dynamicTabBar = {
    height: 46 + bottomPad,
    paddingBottom: bottomPad,
    paddingTop: 8,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, dynamicTabBar],
        tabBarActiveTintColor: '#8e9bff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.discover,
          tabBarIcon: ({ focused }) => <TabIcon svg="globe" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t.search,
          tabBarIcon: ({ focused }) => <TabIcon svg="search" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t.savedTab,
          tabBarIcon: ({ focused }) => <TabIcon svg="bookmark" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settingsTab,
          tabBarIcon: ({ focused }) => <TabIcon svg="gear" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const SVG_ICONS: Record<string, (active: string, mid: string, inactive: string, focused: boolean) => string> = {
  globe: (a, m, i, f) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="${f ? a : i}" stroke-width="1.5"/><path d="M12 3Q15.5 7.5 15.5 12Q15.5 16.5 12 21" stroke="${f ? m : i}" stroke-width="1.5" fill="none"/><path d="M12 3Q8.5 7.5 8.5 12Q8.5 16.5 12 21" stroke="${f ? m : i}" stroke-width="1.5" fill="none"/><line x1="3.5" y1="9" x2="20.5" y2="9" stroke="${f ? a : i}" stroke-width="1.2"/><line x1="3.5" y1="15" x2="20.5" y2="15" stroke="${f ? a : i}" stroke-width="1.2"/></svg>`,
  search: (a, m, i, f) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="${f ? a : i}" stroke-width="1.5"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="${f ? m : i}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  bookmark: (a, m, i, f) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4h14v16l-7-4-7 4V4z" stroke="${f ? a : i}" stroke-width="1.5" stroke-linejoin="round"/><line x1="8" y1="9" x2="16" y2="9" stroke="${f ? m : i}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  gear: (a, m, i, f) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3.5" stroke="${f ? m : i}" stroke-width="1.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M19.07 4.93l-1.77 1.77M6.7 17.3l-1.77 1.77" stroke="${f ? a : i}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

function TabIcon({ svg, focused }: { svg: string; focused: boolean }) {
  if (Platform.OS === 'web') {
    const svgStr = SVG_ICONS[svg]('#5e7fff', '#a45eff', 'rgba(255,255,255,0.3)', focused);
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
    return (
      <View style={styles.iconWrap}>
        {/* @ts-ignore web only */}
        <img src={dataUrl} width={24} height={24} style={{ display: 'block' }} />
      </View>
    );
  }
  // Native fallback: emoji
  const emojis: Record<string, string> = { globe: '🌍', search: '🔍', bookmark: '🔖', gear: '⚙️' };
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.iconEmoji, { opacity: focused ? 1 : 0.35 }]}>{emojis[svg]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13,17,40,0.96)',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontFamily: FONT_SORA,
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 20 },
});
