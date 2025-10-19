import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { Calendar, Video, CheckCircle } from 'lucide-react-native';

type Session = Database['public']['Tables']['sessions']['Row'];

export default function SessionsScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [profile]);

  // getting all sessions where user is either the student or senior
  const fetchSessions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .or(`student_id.eq.${user.id},senior_id.eq.${user.id}`)
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    } else {
      setSessions(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  // opening the video call link in browser or app
  // adya: to-do - add reminders/notifications before sessions start
  const handleJoinMeeting = (meetingLink: string) => {
    if (meetingLink) {
      Linking.openURL(meetingLink);
    } else {
      Alert.alert('Error', 'Meeting link not available');
    }
  };

  const handleCompleteSession = (sessionId: string) => {
    router.push(`/session/${sessionId}/complete`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#3b82f6';
      case 'in_progress':
        return '#8b5cf6';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const renderSession = ({ item }: { item: Session }) => {
    const isUpcoming = new Date(item.scheduled_time) > new Date();
    const isPast = new Date(item.scheduled_time) < new Date();
    const canComplete = profile?.role === 'senior' && item.status === 'completed' && !item.senior_signed_off;

    return (
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.dateContainer}>
            <Calendar size={20} color="#2563eb" />
            <Text style={styles.dateText}>
              {new Date(item.scheduled_time).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.timeText}>
              {new Date(item.scheduled_time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <Text style={styles.durationText}>{item.duration_minutes} minutes</Text>

        {item.notes && (
          <Text style={styles.notesText} numberOfLines={2}>
            {item.notes}
          </Text>
        )}

        <View style={styles.sessionActions}>
          {item.status === 'scheduled' && isUpcoming && (
            <Pressable
              style={styles.joinButton}
              onPress={() => handleJoinMeeting(item.meeting_link || '')}
            >
              <Video size={18} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.joinButtonText}>Join Meeting</Text>
            </Pressable>
          )}

          {canComplete && (
            <Pressable
              style={styles.completeButton}
              onPress={() => handleCompleteSession(item.id)}
            >
              <CheckCircle size={18} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.completeButtonText}>Sign Off</Text>
            </Pressable>
          )}
        </View>

        {item.senior_signed_off && (
          <View style={styles.signOffBadge}>
            <CheckCircle size={16} color="#10b981" />
            <Text style={styles.signOffText}>Signed off by senior</Text>
          </View>
        )}
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>My Sessions</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Calendar size={64} color="#dee2e6" />
          <Text style={styles.emptyText}>No sessions scheduled yet</Text>
          <Text style={styles.emptySubtext}>
            {profile?.role === 'senior'
              ? 'Once a student claims your request, you can schedule a session'
              : 'Claim a request to schedule your first session'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
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
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timeText: {
    fontSize: 14,
    color: '#6c757d',
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
  durationText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 20,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  joinButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
  signOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  signOffText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
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
});
