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
import { MessageSquare, AlertCircle } from 'lucide-react-native';

type Conversation = {
  requestId: string;
  requestTitle: string;
  otherPersonName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

export default function MessagesScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [profile]);

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
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

  if (loading) {
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
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {conversations.length === 0 ? (
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
});
