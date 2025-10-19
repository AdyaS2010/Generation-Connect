import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Calendar } from 'lucide-react-native';

export default function RequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user, profile } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [seniorProfile, setSeniorProfile] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchRequest();
    if (profile?.role === 'student') {
      fetchStudentProfile();
    }
  }, [id, profile]);

  const fetchRequest = async () => {
    const { data: requestData } = await supabase
      .from('help_requests')
      .select('*')
      .eq('id', id as string)
      .maybeSingle();

    if (requestData) {
      setRequest(requestData);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (requestData as any).senior_id)
        .maybeSingle();

      setSeniorProfile(profileData);
    }
    setLoading(false);
  };

  const fetchStudentProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    setStudentProfile(data);
  };

  // claiming a help request - only verified students can do this
  const handleClaim = async () => {
    if (!user || !request) return;

    // making sure the student is verified before letting them claim
    if (!studentProfile || studentProfile.verification_status !== 'approved') {
      window.alert('You must be verified to claim requests. Please upload your verification documents in your profile.');
      return;
    }

    setClaiming(true);

    const { error } = await supabase
      .from('help_requests')
      .update({
        student_id: user.id,
        status: 'claimed',
        claimed_at: new Date().toISOString(),
      } as any)
      .eq('id', request.id);

    setClaiming(false);

    if (error) {
      window.alert('Failed to claim request. Please try again.');
      console.error('Claim error:', error);
    } else {
      window.alert('Request claimed! You can now message the senior and schedule a session.');
      fetchRequest();
    }
  };

  // navigating to the messaging screen for this request
  const handleMessage = () => {
    router.push(`/chat/${request.id}`);
  };

  // navigating to schedule a session - debug logs help track button click issues
  const handleSchedule = () => {
    console.log('Schedule button clicked for request:', request.id);
    console.log('Request status:', request.status);
    console.log('Is claimed by user:', isClaimed);
    router.push(`/session/create?requestId=${request.id}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Request not found</Text>
      </View>
    );
  }

  // figuring out what actions the user can take on this request
  const isOwnRequest = request.senior_id === user?.id;
  const isClaimed = request.student_id === user?.id;
  const isVerified = studentProfile?.verification_status === 'approved';
  const canClaim = profile?.role === 'student' && request.status === 'open' && !isOwnRequest;
  const canInteract = isClaimed || isOwnRequest;

  // debug logging to help track down any button visibility issues
  console.log('Request Detail Debug:', {
    requestId: request.id,
    requestStatus: request.status,
    studentId: request.student_id,
    seniorId: request.senior_id,
    currentUserId: user?.id,
    isOwnRequest,
    isClaimed,
    canInteract,
    shouldShowScheduleButton: request.status === 'claimed' && isClaimed,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
        </View>

        <Text style={styles.title}>{request.title}</Text>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{request.category}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{request.description}</Text>
        </View>

        {seniorProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requested by</Text>
            <Text style={styles.seniorName}>{seniorProfile.full_name}</Text>
            {seniorProfile.phone && (
              <Text style={styles.seniorPhone}>{seniorProfile.phone}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posted</Text>
          <Text style={styles.dateText}>
            {new Date(request.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        {/* claim button only shows for students who haven't claimed yet */}
        {canClaim && (
          <>
            <Pressable
              style={[styles.claimButton, claiming && styles.buttonDisabled]}
              onPress={handleClaim}
              disabled={claiming}
            >
              <Text style={styles.claimButtonText}>
                {claiming ? 'Claiming...' : 'Claim This Request'}
              </Text>
            </Pressable>

            {/* warning message for unverified students */}
            {!isVerified && (
              <View style={styles.verificationWarning}>
                <Text style={styles.verificationWarningText}>
                  You need to be verified to claim requests. Upload your documents in your profile.
                </Text>
              </View>
            )}
          </>
        )}

        {/* action buttons for messaging and scheduling */}
        {/* adya: to-do - add video call button here for quick meetings */}
        {canInteract && (
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={handleMessage}>
              <MessageSquare size={20} color="#2563eb" />
              <Text style={styles.actionButtonText}>Message</Text>
            </Pressable>

            {/* schedule button only shows after request is claimed */}
            {request.status === 'claimed' && isClaimed && (
              <Pressable style={styles.actionButton} onPress={handleSchedule}>
                <Calendar size={20} color="#2563eb" />
                <Text style={styles.actionButtonText}>Schedule</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
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
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e7f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 24,
  },
  categoryText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6c757d',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  seniorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  seniorPhone: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  claimButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  claimButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  actionButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 18,
    color: '#6c757d',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
  },
  verificationWarning: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  verificationWarningText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 20,
  },
});
