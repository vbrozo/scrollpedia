import React, { useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  uri?: string;
  width: number;
  height: number;
  /** Gradient shown while loading and as the error/empty fallback. */
  fallbackColors?: readonly [string, string, ...string[]];
}

/**
 * Full-bleed article image with a gradient placeholder while loading and a
 * graceful fallback if the source is missing or fails to load. The image
 * fades in once decoded so there's no abrupt pop.
 */
export default function ArticleImage({
  uri,
  width,
  height,
  fallbackColors = ['#1a1a2e', '#16213e', '#0f3460'],
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const opacity = React.useRef(new Animated.Value(0)).current;

  const showFallback = !uri || failed;

  function handleLoad() {
    setLoaded(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }

  return (
    <View style={[StyleSheet.absoluteFill, { width, height }]}>
      {/* Gradient placeholder / fallback — always behind the image */}
      <LinearGradient colors={fallbackColors} style={StyleSheet.absoluteFill} />

      {!showFallback && (
        <Animated.Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, { width, height, opacity }]}
          resizeMode="cover"
          onLoad={handleLoad}
          onError={() => setFailed(true)}
          // @ts-ignore web-only: lets the browser decode off the main thread
          decoding="async"
        />
      )}
    </View>
  );
}
