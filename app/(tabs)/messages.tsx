import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MessageSquare, AlertCircle, Users, Plus, MessageCircle, Heart, Sparkles, HelpCircle, BookOpen, Clock } from 'lucide-react-native';

type Conversation = {
  requestId: string;
  requestTitle: string;
  otherPersonName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

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

export default function MessagesScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'messages' | 'community'>('messages');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'question' | 'story' | 'recurring_help' | 'announcement'>('all');

  useEffect(() => {
    if (viewMode === 'messages') {
      fetchConversations();
    } else {
      fetchPosts();
    }
  }, [profile, viewMode, filter]);

  const fetchConversations = async () => {
    if (!user) return;

    const { data: requests, error: requestsError } = await supabase
      .from('help_requests')
      .select('*')
      .not('student_id', 'is', null)
      .or(`senior_id.eq.${user.id},student_id.eq.${user.id}`);

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      setErrorMessage('Failed to load conversations');
      setTimeout(() => setErrorMessage(''), 3000);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const conversationPromises = (requests || []).map(async (request: any) => {
      const otherUserId = request.senior_id === user.id ? request.student_id : request.senior_id;

      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', otherUserId!)
        .maybeSingle();

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', request.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', request.id)
        .eq('receiver_id', user.id)
        .eq('read', false);

      return {
        requestId: request.id,
        requestTitle: request.title,
        otherPersonName: otherProfile?.full_name || 'Unknown',
        lastMessage: messages?.[0]?.content || 'No messages yet',
        lastMessageTime: messages?.[0]?.created_at || request.created_at,
        unreadCount: count || 0,
      };
    });

    const conversationsData = await Promise.all(conversationPromises);
    conversationsData.sort((a: any, b: any) =>
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    setConversations(conversationsData);
    setLoading(false);
    setRefreshing(false);
  };

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
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (viewMode === 'messages') {
      fetchConversations();
    } else {
      fetchPosts();
    }
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

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable
      style={styles.conversationCard}
      onPress={() => router.push(`/chat/${item.requestId}`)}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.otherPersonName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.personName}>{item.otherPersonName}</Text>
          <Text style={styles.timeText}>
            {new Date(item.lastMessageTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Text style={styles.requestTitle} numberOfLines={1}>
          {item.requestTitle}
        </Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );

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

  if (loading && viewMode === 'messages') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={20} color="#991b1b" />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {viewMode === 'messages' ? 'Messages' : 'Community'}
        </Text>
        {viewMode === 'community' && profile?.role === 'student' && (
          <Pressable
            style={styles.createButton}
            onPress={() => router.push('/community/create')}
          >
            <Plus size={24} color="#ffffff" />
          </Pressable>
        )}
      </View>

      {profile?.role === 'student' && (
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleButton, viewMode === 'messages' && styles.toggleButtonActive]}
            onPress={() => setViewMode('messages')}
          >
            <MessageSquare size={18} color={viewMode === 'messages' ? '#ffffff' : '#6c757d'} />
            <Text style={[styles.toggleText, viewMode === 'messages' && styles.toggleTextActive]}>
              Messages
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, viewMode === 'community' && styles.toggleButtonActive]}
            onPress={() => setViewMode('community')}
          >
            <Users size={18} color={viewMode === 'community' ? '#ffffff' : '#6c757d'} />
            <Text style={[styles.toggleText, viewMode === 'community' && styles.toggleTextActive]}>
              Community
            </Text>
          </Pressable>
        </View>
      )}

      {viewMode === 'community' && profile?.role === 'student' && (
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
      )}

      {viewMode === 'messages' ? (
        conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageSquare size={64} color="#dee2e6" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              {profile?.role === 'senior'
                ? 'Start a conversation when a student claims your request'
                : 'Claim a request to start helping seniors'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.requestId}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )
      ) : (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  toggleContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
  toggleTextActive: {
    color: '#ffffff',
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
  },
  conversationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  timeText: {
    fontSize: 12,
    color: '#6c757d',
  },
  requestTitle: {
    fontSize: 14,
    color: '#2563eb',
    marginBottom: 4,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6c757d',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6c757d',
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
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 16,
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
});
