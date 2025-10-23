import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Star, AlertCircle, CheckCircle } from 'lucide-react-native';

export default function CompleteSessionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [actualDuration, setActualDuration] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id as string)
      .maybeSingle();

    setSession(data);
    if (data?.actual_duration_minutes) {
      setActualDuration(data.actual_duration_minutes.toString());
    }
  };

  // completing a session - seniors sign off and leave a review for the student
  // adya: to-do - allow students to also rate seniors for mutual feedback
  const handleComplete = async () => {
    if (!session) return;

    if (!actualDuration || parseInt(actualDuration) <= 0) {
      setErrorMessage('Please enter the actual session duration');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (rating === 0) {
      setErrorMessage('Please provide a rating');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);

    const { error: sessionError } = await supabase
      .from('sessions')
      .update({
        actual_duration_minutes: parseInt(actualDuration),
        senior_signed_off: true,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (sessionError) {
      setLoading(false);
      setErrorMessage('Failed to complete session');
      setTimeout(() => setErrorMessage(''), 3000);
      console.error('Session update error:', sessionError);
      return;
    }

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('total_hours')
      .eq('id', session.student_id)
      .maybeSingle();

    const hoursToAdd = parseInt(actualDuration) / 60;
    const newTotalHours = (studentProfile?.total_hours || 0) + hoursToAdd;

    await supabase
      .from('student_profiles')
      .update({ total_hours: newTotalHours })
      .eq('id', session.student_id);

    const { error: reviewError } = await supabase.from('reviews').insert({
      session_id: session.id,
      reviewer_id: profile!.id,
      reviewee_id: session.student_id,
      rating,
      comment: comment.trim() || null,
    });

    if (reviewError) {
      console.error('Review error:', reviewError);
    }

    await supabase
      .from('help_requests')
      .update({ status: 'completed' })
      .eq('id', session.request_id);

    setLoading(false);

    setSuccessMessage(`Session completed! ${hoursToAdd.toFixed(2)} hours added to student's service record.`);
    setTimeout(() => {
      setSuccessMessage('');
      router.back();
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={20} color="#991b1b" />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}
      {successMessage ? (
        <View style={styles.successBanner}>
          <CheckCircle size={20} color="#065f46" />
          <Text style={styles.successBannerText}>{successMessage}</Text>
        </View>
      ) : null}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Complete Session</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Sign Off Session</Text>
            <Text style={styles.infoText}>
              Please confirm the session completion and provide feedback for the student volunteer.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Actual Duration (minutes) *</Text>
            <TextInput
              style={styles.input}
              value={actualDuration}
              onChangeText={setActualDuration}
              placeholder="e.g., 30"
              keyboardType="number-pad"
              editable={!loading}
            />
            <Text style={styles.helpText}>
              This will be added to the student's volunteer hours
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rate the Student *</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                  disabled={loading}
                  style={styles.starButton}
                >
                  <Star
                    size={40}
                    color={star <= rating ? '#fbbf24' : '#dee2e6'}
                    fill={star <= rating ? '#fbbf24' : 'transparent'}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Feedback (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience with the student..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          <Pressable
            style={[styles.completeButton, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            <Text style={styles.completeButtonText}>
              {loading ? 'Completing...' : 'Complete & Sign Off'}
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
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
  helpText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  starButton: {
    padding: 4,
  },
  completeButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
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
  successBanner: {
    backgroundColor: '#d1fae5',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#a7f3d0',
  },
  successBannerText: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
