import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { Plus, Search } from 'lucide-react-native';

type HelpRequest = Database['public']['Tables']['help_requests']['Row'];

export default function HomeScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // fetching requests based on user role
  // seniors see their own requests, students see open ones + their claimed ones
  const fetchRequests = async () => {
    if (!profile) return;

    let query = supabase.from('help_requests').select('*').order('created_at', { ascending: false });

    if (profile.role === 'senior') {
      // seniors only see requests they created
      query = query.eq('senior_id', profile.id);
    } else {
      // students see open requests OR ones they've claimed
      query = query.or(`status.eq.open,student_id.eq.${profile.id}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load requests');
    } else {
      setRequests(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // reload requests whenever the profile changes
  useEffect(() => {
    fetchRequests();
  }, [profile]);

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

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const renderRequest = ({ item }: { item: HelpRequest }) => (
    <Pressable
      style={styles.requestCard}
      onPress={() => router.push(`/request/${item.id}`)}
    >
      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.requestDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.requestFooter}>
        <Text style={styles.categoryText}>{item.category}</Text>
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
  requestTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
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
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#adb5bd',
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
});
