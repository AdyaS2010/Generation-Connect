import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// predefined categories for help requests
// adya: to-do - make this dynamic so admins can add/remove categories
const CATEGORIES = [
  'Social Media',
  'Email',
  'Video Calls',
  'Smartphone Setup',
  'Computer Basics',
  'Online Shopping',
  'Banking Apps',
  'Health Apps',
  'Other',
];

export default function CreateRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  // creating a new help request from a senior
  const handleCreate = async () => {
    console.log('handleCreate called');
    console.log('Form values:', { title, description, category, userId: user?.id });

    // basic validation
    if (!title || !description || !category) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a request');
      return;
    }

    setLoading(true);
    console.log('Creating request...');

    try {
      // creating the request in the database
      // status starts as 'open' so students can see and claim it
      const { data, error } = await supabase.from('help_requests').insert({
        senior_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        status: 'open',
      } as any);

      setLoading(false);

      if (error) {
        console.error('Request creation error:', error);
        Alert.alert('Error', `Failed to create request: ${error.message}`);
      } else {
        Alert.alert('Success', 'Your request has been posted! Students can now see and claim it.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      setLoading(false);
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
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
});
