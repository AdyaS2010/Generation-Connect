import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function StudentSignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // main signup handler - creates auth user, profile, and student profile
  const handleSignUp = async () => {
    if (!fullName || !email || !schoolName || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (authError) {
      setLoading(false);
      Alert.alert('Sign Up Failed', authError.message);
      return;
    }

    if (authData.user) {
      try {
        // creating the main profile first - this links to supabase auth users table
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          role: 'student',
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        });

        if (profileError) throw profileError;

        // now creating the student-specific profile with school info
        // adya: to-do - add email verification before allowing document upload
        const { error: studentProfileError } = await supabase
          .from('student_profiles')
          .insert({
            id: authData.user.id,
            school_name: schoolName.trim(),
            verification_status: 'pending', // pending until docs are uploaded and approved
          });

        if (studentProfileError) throw studentProfileError;

        setLoading(false);
        // redirecting straight to document upload after signup
        window.alert('Account created! Please upload your verification documents.');
        router.replace('/auth/upload-documents');
      } catch (error: any) {
        setLoading(false);
        Alert.alert('Error', error.message || 'Failed to complete registration');
        console.error('Registration error:', error);
      }
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign Up as Student</Text>
        <Text style={styles.subtitle}>Volunteer and earn community service hours</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jane Smith"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(123) 456-7890"
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>School Name *</Text>
            <TextInput
              style={styles.input}
              value={schoolName}
              onChangeText={setSchoolName}
              placeholder="Lincoln High School"
              editable={!loading}
            />
          </View>

          <View style={styles.note}>
            <Text style={styles.noteText}>
              After creating your account, you'll need to upload your school ID and parent consent form for verification.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry
              editable={!loading}
            />
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Back to Welcome</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 32,
  },
  form: {
    gap: 20,
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
  note: {
    backgroundColor: '#e7f2ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  noteText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  backLink: {
    color: '#2563eb',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
});
