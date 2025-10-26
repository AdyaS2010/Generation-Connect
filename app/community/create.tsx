import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react-native';

const CATEGORIES = [
  { value: 'question', label: 'Question', description: 'Ask for advice or information' },
  { value: 'story', label: 'Story', description: 'Share an experience or memory' },
  { value: 'recurring_help', label: 'Recurring Help', description: 'Request regular assistance' },
  { value: 'announcement', label: 'Announcement', description: 'Share news or updates' },
];

const RECURRENCE_PATTERNS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const COMMON_TAGS = [
  'Technology', 'Health', 'Social', 'Transportation', 'Shopping',
  'Education', 'Entertainment', 'Finance', 'Home', 'Family',
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'question' | 'story' | 'recurring_help' | 'announcement'>('question');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('weekly');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a title');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!content.trim()) {
      setErrorMessage('Please enter some content');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const postData = {
      senior_id: profile!.id,
      title: title.trim(),
      content: content.trim(),
      category,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? recurrencePattern : null,
      tags: selectedTags,
    };

    const { error } = await supabase.from('community_posts').insert(postData);

    setLoading(false);

    if (error) {
      console.error('Error creating post:', error);
      setErrorMessage('Failed to create post');
      setTimeout(() => setErrorMessage(''), 3000);
    } else {
      router.back();
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

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#2563eb" />
        </Pressable>
        <Text style={styles.headerTitle}>New Post</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                style={[
                  styles.categoryButton,
                  category === cat.value && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat.value as any)}
              >
                <Text
                  style={[
                    styles.categoryButtonLabel,
                    category === cat.value && styles.categoryButtonLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
                <Text
                  style={[
                    styles.categoryButtonDescription,
                    category === cat.value && styles.categoryButtonDescriptionActive,
                  ]}
                >
                  {cat.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {category === 'recurring_help' && (
          <View style={styles.section}>
            <View style={styles.recurringToggle}>
              <View>
                <Text style={styles.label}>This is a recurring request</Text>
                <Text style={styles.helperText}>
                  Mark if you need help on a regular schedule
                </Text>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: '#dee2e6', true: '#93c5fd' }}
                thumbColor={isRecurring ? '#2563eb' : '#f8f9fa'}
              />
            </View>

            {isRecurring && (
              <View style={styles.recurrenceButtons}>
                {RECURRENCE_PATTERNS.map((pattern) => (
                  <Pressable
                    key={pattern.value}
                    style={[
                      styles.recurrenceButton,
                      recurrencePattern === pattern.value && styles.recurrenceButtonActive,
                    ]}
                    onPress={() => setRecurrencePattern(pattern.value)}
                  >
                    <Text
                      style={[
                        styles.recurrenceButtonText,
                        recurrencePattern === pattern.value && styles.recurrenceButtonTextActive,
                      ]}
                    >
                      {pattern.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a clear title..."
            placeholderTextColor="#adb5bd"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Content</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Share your thoughts, question, or request..."
            placeholderTextColor="#adb5bd"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tags (Optional)</Text>
          <View style={styles.tagsGrid}>
            {COMMON_TAGS.map((tag) => (
              <Pressable
                key={tag}
                style={[
                  styles.tagButton,
                  selectedTags.includes(tag) && styles.tagButtonActive,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagButtonText,
                    selectedTags.includes(tag) && styles.tagButtonTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Posting...' : 'Post to Community'}
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
  section: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 4,
  },
  categoryGrid: {
    gap: 12,
  },
  categoryButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  categoryButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  categoryButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  categoryButtonLabelActive: {
    color: '#2563eb',
  },
  categoryButtonDescription: {
    fontSize: 13,
    color: '#6c757d',
  },
  categoryButtonDescriptionActive: {
    color: '#3b82f6',
  },
  recurringToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recurrenceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurrenceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  recurrenceButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  recurrenceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  recurrenceButtonTextActive: {
    color: '#ffffff',
  },
  titleInput: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  contentInput: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
    minHeight: 160,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  tagButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  tagButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  tagButtonTextActive: {
    color: '#ffffff',
  },
  submitButton: {
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
  submitButtonText: {
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
});
