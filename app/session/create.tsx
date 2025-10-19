import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react-native';

export default function CreateSessionScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams();
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // loading the request details when the page mounts
  useEffect(() => {
    console.log('Session create - requestId:', requestId);
    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const fetchRequest = async () => {
    console.log('Fetching request with ID:', requestId);
    setPageLoading(true);
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .eq('id', requestId as string)
      .maybeSingle();

    if (error) {
      console.error('Error fetching request:', error);
      window.alert('Failed to load request details');
    } else {
      console.log('Request data:', data);
      setRequest(data);
    }
    setPageLoading(false);
  };

  // generating a unique jitsi meeting link for this session
  // adya: to-do - consider adding zoom or google meet integration
  const generateMeetingLink = () => {
    const roomId = `gc-${requestId}-${Date.now()}`;
    return `https://meet.jit.si/${roomId}`;
  };

  // adya: to-do - add calendar integration to auto-add events to google/apple calendar
  const handleCreateSession = async () => {
    // basic validation to make sure all required fields are filled
    if (!scheduledDate || !scheduledTime || !duration) {
      window.alert('Please fill in all required fields');
      return;
    }

    if (!request) {
      window.alert('Request information not loaded. Please try again.');
      return;
    }

    if (!user) {
      window.alert('You must be signed in to schedule a session.');
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

    // making sure they're not trying to schedule in the past
    if (scheduledDateTime < new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }

    setLoading(true);

    const meetingLink = generateMeetingLink();

    // creating the session record with all the details
    // student_id comes from the request (who claimed it)
    const { error: sessionError } = await supabase.from('sessions').insert({
      request_id: request.id,
      student_id: request.student_id || user.id,
      senior_id: request.senior_id,
      scheduled_time: scheduledDateTime.toISOString(),
      duration_minutes: parseInt(duration),
      meeting_link: meetingLink,
      notes: notes.trim() || null,
      status: 'scheduled',
    } as any);

    if (sessionError) {
      setLoading(false);
      window.alert(`Failed to create session: ${sessionError.message}`);
      console.error('Session creation error:', sessionError);
      return;
    }

    console.log('Session created successfully');

    // updating the help request status to reflect it's now scheduled
    const { error: requestError } = (await supabase
      .from('help_requests')
      .update({ status: 'scheduled' } as any)
      .eq('id', request.id)) as any;

    setLoading(false);

    if (requestError) {
      console.error('Request update error:', requestError);
    }

    window.alert('Session scheduled successfully! You and the senior will receive the meeting link.');
    router.back();
  };

  if (pageLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={styles.headerTitle}>Schedule Session</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading request details...</Text>
        </View>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1a1a1a" />
          </Pressable>
          <Text style={styles.headerTitle}>Schedule Session</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Request not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backButtonFull}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Schedule Session</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Request</Text>
            <Text style={styles.infoText}>{request?.title}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              value={scheduledDate}
              onChangeText={setScheduledDate}
              placeholder="YYYY-MM-DD (e.g., 2025-10-20)"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time *</Text>
            <TextInput
              style={styles.input}
              value={scheduledTime}
              onChangeText={setScheduledTime}
              placeholder="HH:MM (e.g., 14:30)"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration (minutes) *</Text>
            <View style={styles.durationButtons}>
              {['15', '30', '45', '60'].map((mins) => (
                <Pressable
                  key={mins}
                  style={[
                    styles.durationButton,
                    duration === mins && styles.durationButtonSelected,
                  ]}
                  onPress={() => setDuration(mins)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      duration === mins && styles.durationButtonTextSelected,
                    ]}
                  >
                    {mins} min
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional information for the session..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Meeting Link</Text>
            <Text style={styles.infoSubtext}>
              A secure video meeting link will be automatically generated and shared with both
              participants.
            </Text>
          </View>

          <Pressable
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreateSession}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Scheduling...' : 'Schedule Session'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
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
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
    gap: 24,
  },
  infoCard: {
    backgroundColor: '#e7f2ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    color: '#1e40af',
  },
  infoSubtext: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  textArea: {
    minHeight: 100,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  durationButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  durationButtonTextSelected: {
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 20,
  },
  backButtonFull: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
