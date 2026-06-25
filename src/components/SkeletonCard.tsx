import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';

export default function SkeletonCard() {
  const { width: W, height: H } = useWindowDimensions();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.65] });

  return (
    <View style={[styles.card, { width: W, height: H }]}>
      {/* Background shimmer block (image placeholder) */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.imagePlaceholder, { opacity }]} />

      {/* Gradient overlay to match real card */}
      <View style={styles.overlay} />

      {/* Top badge placeholder */}
      <Animated.View style={[styles.badgePlaceholder, { opacity }]} />

      {/* Bottom content */}
      <View style={styles.content}>
        <View style={styles.textBox}>
          {/* Title lines */}
          <Animated.View style={[styles.line, styles.lineTitle, { opacity }]} />
          <Animated.View style={[styles.line, styles.lineTitleShort, { opacity }]} />

          {/* Extract lines */}
          <Animated.View style={[styles.line, styles.lineExtract, { opacity }]} />
          <Animated.View style={[styles.line, styles.lineExtract, { opacity }]} />
          <Animated.View style={[styles.line, styles.lineExtractShort, { opacity }]} />

          {/* Read more pill */}
          <Animated.View style={[styles.pillPlaceholder, { opacity }]} />
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} style={[styles.btn, { opacity }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f0f0f',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    backgroundColor: '#1e1e1e',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  badgePlaceholder: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 110,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  textBox: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    backgroundColor: 'rgba(20,20,20,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  line: {
    borderRadius: 6,
    backgroundColor: '#2e2e2e',
  },
  lineTitle: { height: 22, width: '90%' },
  lineTitleShort: { height: 22, width: '60%' },
  lineExtract: { height: 14, width: '100%' },
  lineExtractShort: { height: 14, width: '70%' },
  pillPlaceholder: {
    height: 28,
    width: 100,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#1e1e1e',
  },
});
