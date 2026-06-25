import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchFullArticle } from '../utils/wikipedia';
import { WikiArticle } from '../types';
import RelatedArticles from './RelatedArticles';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  article: WikiArticle | null;
  onClose: () => void;
}

export default function ArticleModal({ article, onClose }: Props) {
  const { lang } = useLanguage();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  // Stack for navigating into related articles
  const [stack, setStack] = useState<WikiArticle[]>([]);

  const current = stack.length > 0 ? stack[stack.length - 1] : article;

  useEffect(() => {
    if (!current) return;
    setText('');
    setLoading(true);
    fetchFullArticle(current.title, lang)
      .then(setText)
      .catch(() => setText(current.extract))
      .finally(() => setLoading(false));
  }, [current?.pageid, lang]);

  // Reset stack when article changes from outside
  useEffect(() => {
    setStack([]);
  }, [article?.pageid]);

  if (!article) return null;

  function handleSelectRelated(related: WikiArticle) {
    setStack((prev) => [...prev, related]);
  }

  function handleBack() {
    setStack((prev) => prev.slice(0, -1));
  }

  return (
    <Modal
      visible={!!article}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={stack.length > 0 ? handleBack : onClose}
    >
      <View style={styles.container}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          {stack.length > 0 && (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title} numberOfLines={2}>{current?.title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.body}>{text || current?.extract}</Text>

            {current && (
              <RelatedArticles
                title={current.title}
                lang={lang}
                onSelect={handleSelectRelated}
              />
            )}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.openBtn}
            onPress={() => current && Linking.openURL(current.fullurl)}
            activeOpacity={0.8}
          >
            <Text style={styles.openBtnText}>Otvori na Wikipediji →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  closeText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  body: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  openBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  openBtnText: { color: '#0a0a0a', fontSize: 15, fontWeight: '700' },
});
