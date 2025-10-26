import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Plus, MessageCircle, Heart, Sparkles, HelpCircle, BookOpen, Clock, AlertCircle, Users } from 'lucide-react-native';

interface CommunityPost {
  id: string;
  senior_id: string;
  title: string;
  content: string;
  category: 'question' | 'story' | 'recurring_help' | 'announcement';
  is_recurring: boolean;
  recurrence_pattern?: string;
  tags: string[];
  created_at: string;
  senior_name?: string;
  comment_count?: number;
  reaction_count?: number;
}

export default function CommunityScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'question' | 'story' | 'recurring_help' | 'announcement'>('all');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    setErrorMessage('');

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        profiles!community_posts_senior_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('category', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching community posts:', error);
      setErrorMessage('Failed to load community posts');
      setTimeout(() => setErrorMessage(''), 3000);
    } else {
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const [{ count: commentCount }, { count: reactionCount }] = await Promise.all([
            supabase.from('community_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('community_reactions').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
          ]);

          return {
            ...post,
            senior_name: post.profiles?.full_name,
            comment_count: commentCount || 0,
            reaction_count: reactionCount || 0,
          };
        })
      );

      setPosts(postsWithCounts);
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question':
        return <HelpCircle size={18} color="#2563eb" />;
      case 'story':
        return <BookOpen size={18} color="#10b981" />;
      case 'recurring_help':
        return <Clock size={18} color="#f59e0b" />;
      case 'announcement':
        return <Sparkles size={18} color="#8b5cf6" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question':
        return '#dbeafe';
      case 'story':
        return '#d1fae5';
      case 'recurring_help':
        return '#fef3c7';
      case 'announcement':
        return '#ede9fe';
      default:
        return '#f8f9fa';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'question':
        return 'Question';
      case 'story':
        return 'Story';
      case 'recurring_help':
        return 'Recurring Help';
      case 'announcement':
        return 'Announcement';
      default:
        return category;
    }
  };

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <Pressable
      style={styles.postCard}
      onPress={() => router.push(`/community/${item.id}`)}
    >
      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
        {getCategoryIcon(item.category)}
        <Text style={styles.categoryText}>{getCategoryLabel(item.category)}</Text>
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>
        {item.content}
      </Text>

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
          )}
        </View>
      )}

      <View style={styles.postFooter}>
        <Text style={styles.authorText}>By {item.senior_name || 'Anonymous'}</Text>
        <View style={styles.postStats}>
          {item.comment_count! > 0 && (
            <View style={styles.statItem}>
              <MessageCircle size={16} color="#6c757d" />
              <Text style={styles.statText}>{item.comment_count}</Text>
            </View>
          )}
          {item.reaction_count! > 0 && (
            <View style={styles.statItem}>
              <Heart size={16} color="#6c757d" />
              <Text style={styles.statText}>{item.reaction_count}</Text>
            </View>
          )}
        </View>
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={20} color="#991b1b" />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <Pressable
          style={styles.createButton}
          onPress={() => router.push('/community/create')}
        >
          <Plus size={24} color="#ffffff" />
        </Pressable>
      </View>

      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filter === 'question' && styles.filterButtonActive]}
          onPress={() => setFilter('question')}
        >
          <Text style={[styles.filterButtonText, filter === 'question' && styles.filterButtonTextActive]}>
            Questions
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filter === 'story' && styles.filterButtonActive]}
          onPress={() => setFilter('story')}
        >
          <Text style={[styles.filterButtonText, filter === 'story' && styles.filterButtonTextActive]}>
            Stories
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filter === 'recurring_help' && styles.filterButtonActive]}
          onPress={() => setFilter('recurring_help')}
        >
          <Text style={[styles.filterButtonText, filter === 'recurring_help' && styles.filterButtonTextActive]}>
            Recurring
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users size={48} color="#dee2e6" />
            <Text style={styles.emptyStateText}>No posts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Be the first to share with the community!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  createButton: {
    backgroundColor: '#2563eb',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  authorText: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '500',
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#adb5bd',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  errorBannerText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
