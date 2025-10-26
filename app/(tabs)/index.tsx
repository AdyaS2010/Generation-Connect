import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { Plus, Search, AlertCircle } from 'lucide-react-native';

type HelpRequest = Database['public']['Tables']['help_requests']['Row'] & {
  match_score?: number;
};

export default function HomeScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState<'suggested' | 'all'>('suggested');

  const fetchRequests = async () => {
    if (!profile) return;

    if (profile.role === 'senior') {
      const { data, error } = await supabase
        .from('help_requests')
        .select('*')
        .eq('senior_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        setErrorMessage('Failed to load requests');
        setTimeout(() => setErrorMessage(''), 3000);
      } else {
        setRequests(data || []);
      }
    } else {
      if (viewMode === 'suggested') {
        const { data, error } = await supabase.rpc('get_suggested_requests', {
          student_user_id: profile.id
        });

        if (error) {
          console.error('Error fetching suggested requests:', error);
          setErrorMessage('Failed to load suggestions');
          setTimeout(() => setErrorMessage(''), 3000);
        } else {
          setRequests(data || []);
        }
      } else {
        const { data, error } = await supabase
          .from('help_requests')
          .select('*')
          .or(`status.eq.open,student_id.eq.${profile.id}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching requests:', error);
          setErrorMessage('Failed to load requests');
          setTimeout(() => setErrorMessage(''), 3000);
        } else {
          setRequests(data || []);
        }
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [profile, viewMode]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  // search filter for finding specific requests
  // adya: to-do - add category filters and sorting options
  const filteredRequests = requests.filter(
    (req) =>
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#10b981';
      case 'claimed':
        return '#f59e0b';
      case 'scheduled':
        return '#3b82f6';
      case 'in_progress':
        return '#8b5cf6';
      case 'completed':
        return '#6b7280';
      default:
        return '#6c757d';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'OPEN';
    return status.replace('_', ' ').toUpperCase();
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const renderRequest = ({ item }: { item: HelpRequest }) => (
    <Pressable
      style={styles.requestCard}
      onPress={() => router.push(`/request/${item.id}`)}
    >
      {profile?.role === 'student' && viewMode === 'suggested' && item.match_score && (
        <View style={styles.matchScoreBadge}>
          <Text style={styles.matchScoreText}>{item.match_score}% Match</Text>
        </View>
      )}
      <View style={styles.requestHeader}>
        <View style={styles.requestTitleContainer}>
          <Text style={styles.requestTitle}>{item.title}</Text>
          {item.urgency && (
            <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
              <Text style={styles.urgencyBadgeText}>{item.urgency.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.requestDescription} numberOfLines={2}>
        {item.description}
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
      <View style={styles.requestFooter}>
        <Text style={styles.categoryText}>{item.category}</Text>
        {item.estimated_duration && (
          <Text style={styles.durationText}>~{item.estimated_duration} min</Text>
        )}
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
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
        <Text style={styles.headerTitle}>
          {profile?.role === 'senior' ? 'My Requests' : 'Browse Requests'}
        </Text>
        {profile?.role === 'senior' && (
          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/request/create')}
          >
            <Plus size={24} color="#ffffff" />
          </Pressable>
        )}
      </View>

      {profile?.role === 'student' && (
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleButton, viewMode === 'suggested' && styles.toggleButtonActive]}
            onPress={() => setViewMode('suggested')}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'suggested' && styles.toggleButtonTextActive]}>
              Suggested
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, viewMode === 'all' && styles.toggleButtonActive]}
            onPress={() => setViewMode('all')}
          >
            <Text style={[styles.toggleButtonText, viewMode === 'all' && styles.toggleButtonTextActive]}>
              All Requests
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Search size={20} color="#6c757d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {profile?.role === 'senior'
              ? "You haven't created any requests yet"
              : 'No requests available at the moment'}
          </Text>
          {profile?.role === 'senior' && (
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push('/request/create')}
            >
              <Text style={styles.primaryButtonText}>Create Your First Request</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
  addButton: {
    backgroundColor: '#2563eb',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  matchScoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  matchScoreText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  requestTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  urgencyBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  requestDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#6c757d',
    alignSelf: 'center',
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  durationText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#adb5bd',
    marginLeft: 'auto',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
