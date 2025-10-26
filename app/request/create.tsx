import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle } from 'lucide-react-native';

const CATEGORIES = [
  'Social Media',
  'Video Calls',
  'Device Setup',
  'Computer Basics',
  'Online Shopping',
  'Applications',
  'Other',
];

const AVAILABLE_TAGS = [
  // Digital/tech Tasks
  'Email', 'Social Media', 'Video Calls', 'Messaging', 'Internet Browsing', 'Photos',
  'Online Shopping', 'Banking Apps', 'Health Apps', 'App Navigation', 'Calendar',
  'Smartphone Setup', 'Computer Setup', 'Tablet Setup', 'WiFi Setup',
  'Password Reset', 'Account Setup', 'App Installation', 'Software Update',

  // Physical tasks
  'Machine Operation', 'Remote Control', 'TV Setup', 'Phone Setup',
  'Finding Items', 'Reading Instructions', 'Organizing', 'Sorting',
  'Device Assembly', 'Cable Management', 'Button Navigation',

  // communication & learning
  'Teaching', 'Explaining', 'Writing', 'Reading', 'Translating',
  'Troubleshooting', 'Documentation', 'Guidance',
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low - Can wait a few days', color: '#6c757d' },
  { value: 'medium', label: 'Medium - Within this week', color: '#3b82f6' },
  { value: 'high', label: 'High - Within 24 hours', color: '#f59e0b' },
  { value: 'urgent', label: 'Urgent - As soon as possible', color: '#ef4444' },
];

export default function CreateRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [urgency, setUrgency] = useState('medium');
  const [estimatedDuration, setEstimatedDuration] = useState('30');
  const [physicalTask, setPhysicalTask] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleCreate = async () => {
    if (!title || !description || !category) {
      setErrorMessage('Please fill in all fields');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (selectedTags.length === 0) {
      setErrorMessage('Please select at least one tag');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!user) {
      setErrorMessage('You must be logged in to create a request');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.from('help_requests').insert({
        senior_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        tags: selectedTags,
        urgency,
        estimated_duration: parseInt(estimatedDuration) || 30,
        physical_task: physicalTask,
        status: 'open',
      } as any);

      setLoading(false);

      if (error) {
        console.error('Request creation error:', error);
        setErrorMessage(`Failed to create request: ${error.message}`);
        setTimeout(() => setErrorMessage(''), 3000);
      } else {
        setSuccessMessage('Your request has been posted! Students can now see and claim it.');
        setTimeout(() => {
          setSuccessMessage('');
          router.back();
        }, 2000);
      }
    } catch (err) {
      setLoading(false);
      console.error('Unexpected error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create Help Request</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>What do you need help with? *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Setting up Facebook account"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Please describe in detail what you need help with..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonSelected,
                ]}
                onPress={() => setCategory(cat)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tags * (Select all that apply)</Text>
          <View style={styles.tagGrid}>
            {AVAILABLE_TAGS.map((tag) => (
              <Pressable
                key={tag}
                style={[
                  styles.tagButton,
                  selectedTags.includes(tag) && styles.tagButtonSelected,
                ]}
                onPress={() => toggleTag(tag)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.tagButtonText,
                    selectedTags.includes(tag) && styles.tagButtonTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Urgency Level *</Text>
          {URGENCY_LEVELS.map((level) => (
            <Pressable
              key={level.value}
              style={[
                styles.urgencyOption,
                urgency === level.value && styles.urgencyOptionSelected,
                urgency === level.value && { borderColor: level.color },
              ]}
              onPress={() => setUrgency(level.value)}
              disabled={loading}
            >
              <View style={[styles.urgencyDot, { backgroundColor: level.color }]} />
              <Text
                style={[
                  styles.urgencyText,
                  urgency === level.value && styles.urgencyTextSelected,
                ]}
              >
                {level.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estimated Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={estimatedDuration}
            onChangeText={setEstimatedDuration}
            placeholder="30"
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setPhysicalTask(!physicalTask)}
            disabled={loading}
          >
            <View style={[styles.checkbox, physicalTask && styles.checkboxChecked]}>
              {physicalTask && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              This task involves physical activity (e.g., operating a machine, finding items)
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Post Request'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
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
    minHeight: 120,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  categoryButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tagButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  tagButtonText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  tagButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dee2e6',
    marginBottom: 8,
  },
  urgencyOptionSelected: {
    borderWidth: 2,
    backgroundColor: '#f8fafc',
  },
  urgencyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  urgencyText: {
    fontSize: 15,
    color: '#6c757d',
    flex: 1,
  },
  urgencyTextSelected: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#dee2e6',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#1a1a1a',
    flex: 1,
    lineHeight: 22,
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
