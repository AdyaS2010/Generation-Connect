import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LogOut, Edit2, Save, Clock, Star, Award, Upload, X, AlertCircle, CheckCircle, Bell, ChevronRight, Sparkles, MessageCircle } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // syncing form fields with the profile data whenever it changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone || '');
      fetchStudentProfile();
    }
  }, [profile]);

  // grabbing student-specific data like verification status and hours
  const fetchStudentProfile = async () => {
    if (profile?.role === 'student') {
      const { data } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', profile.id)
        .maybeSingle();

      if (data) {
        setStudentProfile(data);
        setSkills(data.skills?.join(', ') || '');
      }
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setErrorMessage('Name cannot be empty');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      })
      .eq('id', user!.id);

    if (profileError) {
      setLoading(false);
      setErrorMessage('Failed to update profile');
      setTimeout(() => setErrorMessage(''), 3000);
      console.error('Profile update error:', profileError);
      return;
    }

    if (profile?.role === 'student' && skills.trim()) {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const { error: studentError } = await supabase
        .from('student_profiles')
        .update({ skills: skillsArray })
        .eq('id', user!.id);

      if (studentError) {
        console.error('Student profile update error:', studentError);
      }
    }

    setLoading(false);
    setEditing(false);
    await refreshProfile();
    setSuccessMessage('Profile updated successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSignOutConfirm = async () => {
    setShowSignOutModal(false);
    try {
      await signOut();
      setTimeout(() => {
        router.dismissAll();
        router.replace('/');
      }, 100);
    } catch (error) {
      console.error('Sign out error:', error);
      setErrorMessage('Failed to sign out. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6c757d';
    }
  };

  const getVerificationStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable
          onPress={() => setShowSignOutModal(true)}
          style={styles.signOutButton}
          hitSlop={8}
        >
          <LogOut size={24} color="#ef4444" />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: profile?.role === 'senior' ? '#8b5cf6' : '#2563eb' },
              ]}
            >
              <Text style={styles.roleBadgeText}>
                {profile?.role === 'senior' ? 'Senior' : 'Student'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              {!editing ? (
                <Pressable onPress={() => setEditing(true)} style={styles.editButton}>
                  <Edit2 size={20} color="#2563eb" />
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleSave}
                  style={[styles.saveButton, loading && styles.buttonDisabled]}
                  disabled={loading}
                >
                  <Save size={20} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={fullName}
                onChangeText={setFullName}
                editable={editing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.staticText}>{user?.email}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={phone}
                onChangeText={setPhone}
                placeholder="(123) 456-7890"
                editable={editing}
              />
            </View>

            {profile?.role === 'student' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>My Skills</Text>
                  <Pressable
                    style={styles.manageSkillsButton}
                    onPress={() => router.push('/profile/skills')}
                  >
                    <Sparkles size={16} color="#2563eb" />
                    <Text style={styles.manageSkillsText}>Manage</Text>
                  </Pressable>
                </View>
                {studentProfile?.skills && studentProfile.skills.length > 0 ? (
                  <View style={styles.skillsDisplay}>
                    {studentProfile.skills.map((skill: string, idx: number) => (
                      <View key={idx} style={styles.skillTag}>
                        <Text style={styles.skillTagText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Pressable
                    style={styles.addSkillsPrompt}
                    onPress={() => router.push('/profile/skills')}
                  >
                    <Text style={styles.addSkillsPromptText}>
                      Add your skills to get matched with relevant requests
                    </Text>
                    <ChevronRight size={20} color="#2563eb" />
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {profile?.role === 'student' && studentProfile && (
            <>
              <View style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Student Information</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>School</Text>
                  <Text style={styles.infoValue}>{studentProfile.school_name}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Verification Status</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getVerificationStatusColor(
                          studentProfile.verification_status
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getVerificationStatusLabel(studentProfile.verification_status)}
                    </Text>
                  </View>
                </View>

                {/* showing upload button if student hasn't uploaded docs yet */}
                {!studentProfile.school_id_url && !studentProfile.parent_consent_url && (
                  <Pressable
                    style={styles.uploadDocumentsButton}
                    onPress={() => router.push('/auth/upload-documents')}
                  >
                    <Upload size={20} color="#2563eb" />
                    <Text style={styles.uploadDocumentsButtonText}>Upload Documents</Text>
                  </Pressable>
                )}

                {studentProfile.verification_status === 'pending' && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoCardText}>
                      Your account is pending verification. An administrator will review your
                      documents shortly.
                    </Text>
                  </View>
                )}

                {/* adya: to-do - add rejection reason field so students know what to fix */}
                {studentProfile.verification_status === 'rejected' && (
                  <View style={[styles.infoCard, { backgroundColor: '#fee2e2' }]}>
                    <Text style={[styles.infoCardText, { color: '#991b1b' }]}>
                      Your documents were rejected. Please upload new documents for review.
                    </Text>
                    <Pressable
                      style={[styles.uploadDocumentsButton, { marginTop: 8 }]}
                      onPress={() => router.push('/auth/upload-documents')}
                    >
                      <Upload size={20} color="#2563eb" />
                      <Text style={styles.uploadDocumentsButtonText}>Reupload Documents</Text>
                    </Pressable>
                  </View>
                )}

                {studentProfile.verification_status === 'approved' && (
                  <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                      <Clock size={32} color="#2563eb" />
                      <Text style={styles.statValue}>
                        {studentProfile.total_hours.toFixed(1)}
                      </Text>
                      <Text style={styles.statLabel}>Volunteer Hours</Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <Pressable
              style={styles.settingsRow}
              onPress={() => router.push('/reminder-settings')}
            >
              <View style={styles.settingsRowLeft}>
                <Bell size={20} color="#2563eb" />
                <Text style={styles.settingsRowText}>Notification Reminders</Text>
              </View>
              <ChevronRight size={20} color="#6c757d" />
            </Pressable>

            <Pressable
              style={styles.settingsRow}
              onPress={() => router.push('/support/create')}
            >
              <View style={styles.settingsRowLeft}>
                <MessageCircle size={20} color="#2563eb" />
                <Text style={styles.settingsRowText}>Submit Support Ticket</Text>
              </View>
              <ChevronRight size={20} color="#6c757d" />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.signOutButtonFull}
          onPress={() => setShowSignOutModal(true)}
          hitSlop={4}
        >
          <LogOut size={20} color="#ef4444" style={styles.buttonIcon} />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sign Out</Text>
              <Pressable
                onPress={() => setShowSignOutModal(false)}
                style={styles.modalCloseButton}
                hitSlop={8}
              >
                <X size={24} color="#6c757d" />
              </Pressable>
            </View>
            <Text style={styles.modalText}>Are you sure you want to sign out?</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={handleSignOutConfirm}
              >
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  signOutButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  editButton: {
    padding: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  inputDisabled: {
    backgroundColor: '#ffffff',
    borderColor: '#f8f9fa',
  },
  staticText: {
    fontSize: 16,
    color: '#1a1a1a',
    padding: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  statsContainer: {
    marginTop: 16,
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  signOutButtonFull: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadDocumentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2563eb',
    marginTop: 12,
  },
  uploadDocumentsButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsRowText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manageSkillsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  manageSkillsText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  skillsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  skillTagText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  addSkillsPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  addSkillsPromptText: {
    fontSize: 14,
    color: '#2563eb',
    flex: 1,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  modalConfirmText: {
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
