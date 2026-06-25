import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <TabIcon emoji="🌍" color={color} />,
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Saved',
            tabBarIcon: ({ color }) => <TabIcon emoji="🔖" color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string; [key: string]: unknown }) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.iconEmoji, { opacity: color === '#fff' ? 1 : 0.35 }]}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
});
