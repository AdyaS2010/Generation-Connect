import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react-native';

// adya: to-do - add mobile support for document uploads using expo-document-picker
// currently this only works on web, but we should support native mobile too
export default function UploadDocumentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [schoolIdFile, setSchoolIdFile] = useState<File | null>(null);
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // web-only file picker for now - this creates an invisible file input element
  const handleFileSelect = async (type: 'school_id' | 'consent') => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      // accepting both images and PDFs for flexibility
      input.accept = 'image/*,.pdf';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          if (type === 'school_id') {
            setSchoolIdFile(file);
          } else {
            setConsentFile(file);
          }
        }
      };
      input.click();
    } else {
      setError('Document upload is only available on web. Please use the web version to upload documents.');
    }
  };

  // adya: to-do - add file size validation (max 5MB per file)
  // adya: to-do - add image compression before upload to save storage
  const handleSubmit = async () => {
    if (!schoolIdFile || !consentFile) {
      setError('Please upload both documents');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // uploading to supabase storage with user id as folder name for organization
      const schoolIdExt = schoolIdFile.name.split('.').pop();
      const consentExt = consentFile.name.split('.').pop();

      const schoolIdPath = `${user?.id}/school_id.${schoolIdExt}`;
      const consentPath = `${user?.id}/parent_consent.${consentExt}`;

      const { error: schoolIdError } = await supabase.storage
        .from('verification-documents')
        .upload(schoolIdPath, schoolIdFile, { upsert: true });

      if (schoolIdError) throw schoolIdError;

      const { error: consentError } = await supabase.storage
        .from('verification-documents')
        .upload(consentPath, consentFile, { upsert: true });

      if (consentError) throw consentError;

      const { data: schoolIdUrl } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(schoolIdPath);

      const { data: consentUrl } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(consentPath);

      // updating the student profile with the document URLs
      // status is set to 'pending' so admins know to review it
      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({
          school_id_url: schoolIdUrl.publicUrl,
          parent_consent_url: consentUrl.publicUrl,
          verification_status: 'pending',
        } as any)
        .eq('id', user?.id);

      if (updateError) throw updateError;

      window.alert('Documents uploaded successfully! Your account will be reviewed shortly.');
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    window.alert('You can upload documents later from your profile to get verified.');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Document Verification</Text>
          <Text style={styles.subtitle}>
            Upload your school ID and parent consent form to get verified
          </Text>
        </View>

        <View style={styles.infoBox}>
          <AlertCircle size={20} color="#2563eb" />
          <Text style={styles.infoText}>
            Verification helps ensure safety for all users. Only verified students can claim requests.
          </Text>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.label}>School ID *</Text>
          <Text style={styles.helper}>Upload a photo of your student ID</Text>

          <Pressable
            style={styles.uploadButton}
            onPress={() => handleFileSelect('school_id')}
            disabled={uploading}
          >
            {schoolIdFile ? (
              <>
                <CheckCircle size={24} color="#10b981" />
                <Text style={styles.uploadedText}>{schoolIdFile.name}</Text>
              </>
            ) : (
              <>
                <Upload size={24} color="#6c757d" />
                <Text style={styles.uploadButtonText}>Choose File</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.label}>Parent Consent Form *</Text>
          <Text style={styles.helper}>Upload a signed parent consent form</Text>

          <Pressable
            style={styles.uploadButton}
            onPress={() => handleFileSelect('consent')}
            disabled={uploading}
          >
            {consentFile ? (
              <>
                <CheckCircle size={24} color="#10b981" />
                <Text style={styles.uploadedText}>{consentFile.name}</Text>
              </>
            ) : (
              <>
                <Upload size={24} color="#6c757d" />
                <Text style={styles.uploadButtonText}>Choose File</Text>
              </>
            )}
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.submitButton, uploading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Documents</Text>
          )}
        </Pressable>

        <Pressable style={styles.skipButton} onPress={handleSkip} disabled={uploading}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
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
    lineHeight: 24,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#e7f2ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2563eb',
    lineHeight: 20,
  },
  uploadSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  helper: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  uploadedText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '500',
    flex: 1,
  },
  errorBox: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  skipButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
});
