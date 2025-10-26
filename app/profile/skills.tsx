import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react-native';

const AVAILABLE_SKILLS = [
  // Digital/Tech Tasks
  'Email', 'Social Media', 'Video Calls', 'Messaging', 'Internet Browsing',
  'Online Shopping', 'Banking Apps', 'Health Apps', 'Calendar', 'Photos',
  'Smartphone Setup', 'Computer Setup', 'Tablet Setup', 'WiFi Setup',
  'Password Reset', 'Account Setup', 'App Installation', 'Software Update',

  // Physical Tasks
  'Machine Operation', 'Remote Control', 'TV Setup', 'Phone Setup',
  'Finding Items', 'Reading Instructions', 'Organizing', 'Sorting',
  'Device Assembly', 'Cable Management', 'Button Navigation',

  // Communication & Learning
  'Teaching', 'Explaining', 'Writing', 'Reading', 'Translating',
  'Troubleshooting', 'Documentation', 'Guidance',
];

export default function SkillsScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSkills();
  }, [profile]);

  const fetchSkills = async () => {
    if (profile?.role !== 'student') return;

    const { data } = await supabase
      .from('student_profiles')
      .select('skills')
      .eq('id', profile.id)
      .maybeSingle();

    if (data?.skills) {
      setSelectedSkills(data.skills);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSave = async () => {
    if (selectedSkills.length === 0) {
      setErrorMessage('Please select at least one skill');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const { error } = await supabase
      .from('student_profiles')
      .update({ skills: selectedSkills })
      .eq('id', profile!.id);

    setLoading(false);

    if (error) {
      console.error('Skills update error:', error);
      setErrorMessage('Failed to update skills');
      setTimeout(() => setErrorMessage(''), 3000);
    } else {
      await refreshProfile();
      setSuccessMessage('Skills updated successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        router.back();
      }, 1500);
    }
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
          <ArrowLeft size={24} color="#2563eb" />
        </Pressable>
        <Text style={styles.headerTitle}>My Skills</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Select the skills and areas where you can help seniors. This helps us match you with
            relevant requests.
          </Text>
          <Text style={styles.infoSubtext}>
            Selected: {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Digital & Tech Skills</Text>
          <View style={styles.skillsGrid}>
            {AVAILABLE_SKILLS.slice(0, 18).map((skill) => (
              <Pressable
                key={skill}
                style={[
                  styles.skillButton,
                  selectedSkills.includes(skill) && styles.skillButtonSelected,
                ]}
                onPress={() => toggleSkill(skill)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.skillButtonText,
                    selectedSkills.includes(skill) && styles.skillButtonTextSelected,
                  ]}
                >
                  {skill}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Tasks</Text>
          <View style={styles.skillsGrid}>
            {AVAILABLE_SKILLS.slice(18, 29).map((skill) => (
              <Pressable
                key={skill}
                style={[
                  styles.skillButton,
                  selectedSkills.includes(skill) && styles.skillButtonSelected,
                ]}
                onPress={() => toggleSkill(skill)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.skillButtonText,
                    selectedSkills.includes(skill) && styles.skillButtonTextSelected,
                  ]}
                >
                  {skill}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication & Teaching</Text>
          <View style={styles.skillsGrid}>
            {AVAILABLE_SKILLS.slice(29).map((skill) => (
              <Pressable
                key={skill}
                style={[
                  styles.skillButton,
                  selectedSkills.includes(skill) && styles.skillButtonSelected,
                ]}
                onPress={() => toggleSkill(skill)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.skillButtonText,
                    selectedSkills.includes(skill) && styles.skillButtonTextSelected,
                  ]}
                >
                  {skill}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={[styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Skills'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#dbeafe',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginBottom: 8,
  },
  infoSubtext: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  skillButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  skillButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  skillButtonTextSelected: {
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
