import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Heart,
  ThumbsUp,
  Sparkles,
  MessageCircle,
  Send,
  Trash2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Clock as ClockIcon,
} from 'lucide-react-native';

interface CommunityPost {
  id: string;
  senior_id: string;
  title: string;
  content: string;
  category: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  tags: string[];
  created_at: string;
  senior_name?: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_role?: string;
}

interface Reaction {
  id: string;
  user_id: string;
  reaction_type: string;
}

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchPostDetails();
  }, [id]);

  const fetchPostDetails = async () => {
    setLoading(true);

    const [{ data: postData }, { data: commentsData }, { data: reactionsData }] = await Promise.all([
      supabase
        .from('community_posts')
        .select('*, profiles!community_posts_senior_id_fkey(full_name)')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('community_comments')
        .select('*, profiles(full_name, role)')
        .eq('post_id', id)
        .order('created_at', { ascending: true }),
      supabase.from('community_reactions').select('*').eq('post_id', id),
    ]);

    if (postData) {
      setPost({
        ...postData,
        senior_name: postData.profiles?.full_name,
      });
    }

    if (commentsData) {
      setComments(
        commentsData.map((c) => ({
          ...c,
          user_name: c.profiles?.full_name,
          user_role: c.profiles?.role,
        }))
      );
    }

    if (reactionsData) {
      setReactions(reactionsData);
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPostDetails();
    setRefreshing(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const { error } = await supabase.from('community_comments').insert({
      post_id: id as string,
      user_id: profile!.id,
      content: newComment.trim(),
    });

    if (error) {
      console.error('Error adding comment:', error);
      setErrorMessage('Failed to add comment');
      setTimeout(() => setErrorMessage(''), 3000);
    } else {
      setNewComment('');
      await fetchPostDetails();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('community_comments').delete().eq('id', commentId);

          if (error) {
            console.error('Error deleting comment:', error);
            setErrorMessage('Failed to delete comment');
            setTimeout(() => setErrorMessage(''), 3000);
          } else {
            await fetchPostDetails();
          }
        },
      },
    ]);
  };

  const handleToggleReaction = async (reactionType: string) => {
    const existingReaction = reactions.find(
      (r) => r.user_id === profile!.id && r.reaction_type === reactionType
    );

    if (existingReaction) {
      const { error } = await supabase
        .from('community_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) {
        console.error('Error removing reaction:', error);
      } else {
        await fetchPostDetails();
      }
    } else {
      const { error } = await supabase.from('community_reactions').insert({
        post_id: id as string,
        user_id: profile!.id,
        reaction_type: reactionType,
      });

      if (error) {
        console.error('Error adding reaction:', error);
      } else {
        await fetchPostDetails();
      }
    }
  };

  const getReactionCount = (type: string) => {
    return reactions.filter((r) => r.reaction_type === type).length;
  };

  const hasUserReacted = (type: string) => {
    return reactions.some((r) => r.user_id === profile!.id && r.reaction_type === type);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question':
        return <HelpCircle size={20} color="#2563eb" />;
      case 'story':
        return <BookOpen size={20} color="#10b981" />;
      case 'recurring_help':
        return <ClockIcon size={20} color="#f59e0b" />;
      case 'announcement':
        return <Sparkles size={20} color="#8b5cf6" />;
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

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#2563eb" />
          </Pressable>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={styles.placeholder} />
        </View>
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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#2563eb" />
        </Pressable>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.postCard}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(post.category) }]}>
            {getCategoryIcon(post.category)}
            <Text style={styles.categoryText}>
              {post.category.charAt(0).toUpperCase() + post.category.slice(1).replace('_', ' ')}
            </Text>
          </View>

          <Text style={styles.postTitle}>{post.title}</Text>

          {post.is_recurring && post.recurrence_pattern && (
            <View style={styles.recurringBadge}>
              <ClockIcon size={16} color="#f59e0b" />
              <Text style={styles.recurringText}>
                Recurring: {post.recurrence_pattern.charAt(0).toUpperCase() + post.recurrence_pattern.slice(1)}
              </Text>
            </View>
          )}

          <Text style={styles.postContent}>{post.content}</Text>

          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.postFooter}>
            <Text style={styles.authorText}>By {post.senior_name || 'Anonymous'}</Text>
            <Text style={styles.dateText}>{new Date(post.created_at).toLocaleDateString()}</Text>
          </View>

          <View style={styles.reactionsContainer}>
            <Pressable
              style={[styles.reactionButton, hasUserReacted('helpful') && styles.reactionButtonActive]}
              onPress={() => handleToggleReaction('helpful')}
            >
              <ThumbsUp
                size={20}
                color={hasUserReacted('helpful') ? '#2563eb' : '#6c757d'}
              />
              {getReactionCount('helpful') > 0 && (
                <Text style={[styles.reactionCount, hasUserReacted('helpful') && styles.reactionCountActive]}>
                  {getReactionCount('helpful')}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.reactionButton, hasUserReacted('heart') && styles.reactionButtonActive]}
              onPress={() => handleToggleReaction('heart')}
            >
              <Heart
                size={20}
                color={hasUserReacted('heart') ? '#ef4444' : '#6c757d'}
                fill={hasUserReacted('heart') ? '#ef4444' : 'transparent'}
              />
              {getReactionCount('heart') > 0 && (
                <Text style={[styles.reactionCount, hasUserReacted('heart') && styles.reactionCountActive]}>
                  {getReactionCount('heart')}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.reactionButton, hasUserReacted('thanks') && styles.reactionButtonActive]}
              onPress={() => handleToggleReaction('thanks')}
            >
              <Sparkles
                size={20}
                color={hasUserReacted('thanks') ? '#10b981' : '#6c757d'}
              />
              {getReactionCount('thanks') > 0 && (
                <Text style={[styles.reactionCount, hasUserReacted('thanks') && styles.reactionCountActive]}>
                  {getReactionCount('thanks')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.commentsSection}>
          <View style={styles.commentsSectionHeader}>
            <MessageCircle size={20} color="#1a1a1a" />
            <Text style={styles.commentsTitle}>
              Comments ({comments.length})
            </Text>
          </View>

          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View>
                  <Text style={styles.commentAuthor}>{comment.user_name || 'Anonymous'}</Text>
                  <Text style={styles.commentRole}>
                    {comment.user_role === 'senior' ? 'Senior' : 'Student'}
                  </Text>
                </View>
                <View style={styles.commentActions}>
                  <Text style={styles.commentDate}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </Text>
                  {comment.user_id === profile?.id && (
                    <Pressable
                      onPress={() => handleDeleteComment(comment.id)}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </Pressable>
                  )}
                </View>
              </View>
              <Text style={styles.commentContent}>{comment.content}</Text>
            </View>
          ))}

          {comments.length === 0 && (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          placeholderTextColor="#adb5bd"
          multiline
        />
        <Pressable
          style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
          onPress={handleAddComment}
          disabled={!newComment.trim()}
        >
          <Send size={20} color="#ffffff" />
        </Pressable>
      </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  postCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  postTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 32,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  recurringText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  postContent: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '600',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
    marginBottom: 16,
  },
  authorText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 13,
    color: '#adb5bd',
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  reactionButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  reactionCountActive: {
    color: '#2563eb',
  },
  commentsSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 8,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  commentCard: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  commentRole: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commentDate: {
    fontSize: 12,
    color: '#adb5bd',
  },
  deleteButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 20,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
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
