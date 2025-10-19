import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { validateEmail, validatePhone, validatePassword, getPasswordStrengthColor, formatPhoneNumber, PasswordRequirements } from '@/lib/validation';
import { Eye, EyeOff } from 'lucide-react-native';

export default function SeniorSignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasNumber: false,
    hasLetter: false,
  });

  const handleSignUp = async () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error!;
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error!;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error!;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setErrors({});

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
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        role: 'senior',
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      });

      setLoading(false);

      if (profileError) {
        Alert.alert('Error', 'Failed to create profile. Please contact support.');
        console.error('Profile creation error:', profileError);
      } else {
        router.replace('/(tabs)/profile');
      }
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign Up as Senior</Text>
        <Text style={styles.subtitle}>Get help with technology from student volunteers</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) {
                  setErrors({ ...errors, fullName: '' });
                }
              }}
              placeholder="John Doe"
              editable={!loading}
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: '' });
                }
              }}
              placeholder="your@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={phone}
              onChangeText={(text) => {
                const formatted = formatPhoneNumber(text);
                setPhone(formatted);
                if (errors.phone) {
                  setErrors({ ...errors, phone: '' });
                }
              }}
              placeholder="(123) 456-7890"
              keyboardType="phone-pad"
              editable={!loading}
              maxLength={14}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.password && styles.inputError]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  const validation = validatePassword(text);
                  setPasswordStrength(validation.strength);
                  setPasswordRequirements(validation.requirements);
                  if (errors.password) {
                    setErrors({ ...errors, password: '' });
                  }
                }}
                placeholder="At least 8 characters"
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6c757d" />
                ) : (
                  <Eye size={20} color="#6c757d" />
                )}
              </Pressable>
            </View>
            {password.length > 0 && (
              <View style={styles.requirementsContainer}>
                <View style={styles.requirementItem}>
                  <View style={[styles.checkbox, passwordRequirements.minLength && styles.checkboxChecked]}>
                    {passwordRequirements.minLength && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.requirementText, passwordRequirements.minLength && styles.requirementMet]}>
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[styles.checkbox, passwordRequirements.hasLetter && styles.checkboxChecked]}>
                    {passwordRequirements.hasLetter && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.requirementText, passwordRequirements.hasLetter && styles.requirementMet]}>
                    Contains letters
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[styles.checkbox, passwordRequirements.hasNumber && styles.checkboxChecked]}>
                    {passwordRequirements.hasNumber && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.requirementText, passwordRequirements.hasNumber && styles.requirementMet]}>
                    Contains numbers
                  </Text>
                </View>
              </View>
            )}
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: '' });
                  }
                }}
                placeholder="Re-enter your password"
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6c757d" />
                ) : (
                  <Eye size={20} color="#6c757d" />
                )}
              </Pressable>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
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
  inputError: {
    borderColor: '#dc2626',
    borderWidth: 2,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 4,
  },
  strengthContainer: {
    marginTop: 8,
    gap: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    paddingRight: 48,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  requirementsContainer: {
    marginTop: 12,
    gap: 8,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#dee2e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requirementText: {
    fontSize: 14,
    color: '#6c757d',
  },
  requirementMet: {
    color: '#10b981',
    fontWeight: '600',
  },
});
