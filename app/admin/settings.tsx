import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Bell, Mail, Shield, X } from 'lucide-react-native';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

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
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.full_name}</Text>
              <View style={styles.adminBadge}>
                <Shield size={14} color="#ffffff" />
                <Text style={styles.adminBadgeText}>Administrator</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <User size={20} color="#6c757d" />
              <Text style={styles.infoLabelText}>Full Name</Text>
            </View>
            <Text style={styles.infoValue}>{profile?.full_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Mail size={20} color="#6c757d" />
              <Text style={styles.infoLabelText}>Email</Text>
            </View>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Bell size={20} color="#6c757d" />
              <View>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive email alerts for new students and support tickets
                </Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Enabled</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabelText}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabelText}>Admin Dashboard</Text>
            <Text style={styles.infoValue}>v1.0</Text>
          </View>
        </View>

        <Pressable
          style={styles.signOutButton}
          onPress={() => setShowSignOutModal(true)}
        >
          <LogOut size={20} color="#ef4444" />
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabelText: {
    fontSize: 14,
    color: '#6c757d',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
  },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  signOutButton: {
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
    gap: 8,
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
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
});
