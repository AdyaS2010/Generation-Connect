import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Bell, Mail, MessageSquare, Smartphone, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface ReminderPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  phone_number: string | null;
  reminder_3_days: boolean;
  reminder_1_day: boolean;
  reminder_2_hours: boolean;
  reminder_1_hour: boolean;
  reminder_30_mins: boolean;
  reminder_15_mins: boolean;
}

export default function ReminderSettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState<ReminderPreferences>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: false,
    phone_number: null,
    reminder_3_days: true,
    reminder_1_day: true,
    reminder_2_hours: true,
    reminder_1_hour: true,
    reminder_30_mins: true,
    reminder_15_mins: false,
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_reminder_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
        setPhoneNumber(data.phone_number || '');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setErrorMessage('Failed to load preferences');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedPreferences = {
        ...preferences,
        phone_number: phoneNumber.trim() || null,
        user_id: user!.id,
      };

      const { error } = await supabase
        .from('user_reminder_preferences')
        .upsert(updatedPreferences, { onConflict: 'user_id' });

      if (error) throw error;

      setSuccessMessage('Preferences saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setErrorMessage('Failed to save preferences');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof ReminderPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#2563eb" />
          </Pressable>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
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
      {successMessage ? (
        <View style={styles.successBanner}>
          <CheckCircle size={20} color="#065f46" />
          <Text style={styles.successBannerText}>{successMessage}</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#2563eb" />
        </Pressable>
        <Text style={styles.headerTitle}>Reminder Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Notification Methods</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Mail size={20} color="#6c757d" />
              <Text style={styles.settingLabel}>Email Notifications</Text>
            </View>
            <Switch
              value={preferences.email_enabled}
              onValueChange={(value) => updatePreference('email_enabled', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.email_enabled ? '#2563eb' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MessageSquare size={20} color="#6c757d" />
              <Text style={styles.settingLabel}>SMS Notifications</Text>
            </View>
            <Switch
              value={preferences.sms_enabled}
              onValueChange={(value) => updatePreference('sms_enabled', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.sms_enabled ? '#2563eb' : '#f3f4f6'}
            />
          </View>

          {preferences.sms_enabled && (
            <View style={styles.phoneInputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+1 (555) 123-4567"
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
              <Text style={styles.inputHelp}>Include country code for SMS</Text>
            </View>
          )}

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Smartphone size={20} color="#6c757d" />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={preferences.push_enabled}
              onValueChange={(value) => updatePreference('push_enabled', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.push_enabled ? '#2563eb' : '#f3f4f6'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Reminder Timing</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Choose when to receive reminders before your sessions
          </Text>

          <View style={styles.settingRow}>
            <Text style={styles.reminderLabel}>3 days before</Text>
            <Switch
              value={preferences.reminder_3_days}
              onValueChange={(value) => updatePreference('reminder_3_days', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.reminder_3_days ? '#2563eb' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.reminderLabel}>1 day before</Text>
            <Switch
              value={preferences.reminder_1_day}
              onValueChange={(value) => updatePreference('reminder_1_day', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.reminder_1_day ? '#2563eb' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.reminderLabel}>2 hours before</Text>
            <Switch
              value={preferences.reminder_2_hours}
              onValueChange={(value) => updatePreference('reminder_2_hours', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.reminder_2_hours ? '#2563eb' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.reminderLabel}>1 hour before</Text>
            <Switch
              value={preferences.reminder_1_hour}
              onValueChange={(value) => updatePreference('reminder_1_hour', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.reminder_1_hour ? '#2563eb' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.reminderLabel}>30 minutes before</Text>
            <Switch
              value={preferences.reminder_30_mins}
              onValueChange={(value) => updatePreference('reminder_30_mins', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.reminder_30_mins ? '#2563eb' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.reminderLabel}>15 minutes before</Text>
            <Switch
              value={preferences.reminder_15_mins}
              onValueChange={(value) => updatePreference('reminder_15_mins', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={preferences.reminder_15_mins ? '#2563eb' : '#f3f4f6'}
            />
          </View>
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={savePreferences}
          disabled={saving}
        >
          <CheckCircle size={20} color="#ffffff" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Text>
        </Pressable>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#dee2e6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  reminderLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  phoneInputContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  phoneInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputHelp: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    margin: 20,
    padding: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
    color: '#991b1b',
    fontSize: 14,
    flex: 1,
  },
  successBanner: {
    backgroundColor: '#d1fae5',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successBannerText: {
    color: '#065f46',
    fontSize: 14,
    flex: 1,
  },
});
