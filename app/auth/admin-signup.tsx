import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react-native';

export default function AdminSignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      setErrorMessage('All fields are required');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (signUpError) {
        setLoading(false);
        setErrorMessage(signUpError.message);
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          role: 'admin',
          full_name: fullName.trim(),
        });

        if (profileError) {
          setLoading(false);
          setErrorMessage('Failed to create admin profile');
          setTimeout(() => setErrorMessage(''), 3000);
          console.error('Profile creation error:', profileError);
          return;
        }

        setLoading(false);
        router.replace('/admin');
      }
    } catch (error) {
      setLoading(false);
      setErrorMessage('An unexpected error occurred');
      setTimeout(() => setErrorMessage(''), 3000);
      console.error('Signup error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Admin Account Setup</Text>
        <Text style={styles.subtitle}>Create an administrator account</Text>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={20} color="#991b1b" />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#adb5bd"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@example.com"
              placeholderTextColor="#adb5bd"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#adb5bd"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Pressable
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Admin Account</Text>
            )}
          </Pressable>

          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back to Sign In</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
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
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
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
    color: '#1a1a1a',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
