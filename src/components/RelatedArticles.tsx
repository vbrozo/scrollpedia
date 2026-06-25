import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WikiArticle } from '../types';
import { fetchRelatedArticles } from '../utils/wikipedia';

interface Props {
  title: string;
  lang: string;
  onSelect: (article: WikiArticle) => void;
}

export default function RelatedArticles({ title, lang, onSelect }: Props) {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setArticles([]);
    setLoading(true);
    fetchRelatedArticles(title, lang)
      .then(setArticles)
      .finally(() => setLoading(false));
  }, [title, lang]);

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator color="rgba(255,255,255,0.4)" size="small" />
      </View>
    );
  }

  if (articles.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Slični članci</Text>
      <FlatList
        data={articles}
        keyExtractor={(item) => String(item.pageid)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onSelect(item)} activeOpacity={0.8}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail.source }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <LinearGradient colors={['#1a1a2e', '#0f3460']} style={styles.thumb} />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.82)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    marginBottom: 8,
  },
  heading: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  row: {
    paddingHorizontal: 16,
    gap: 10,
  },
  loaderWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  card: {
    width: 140,
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  thumb: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
});
