import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Eye, Search, Filter, ExternalLink } from 'lucide-react-native';

interface StudentWithProfile {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
  school_name: string;
  skills: string[];
  verification_status: string;
  school_id_url: string;
  parent_consent_url: string;
  total_hours: number;
}

export default function AdminStudentsScreen() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithProfile | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_profiles')
      .select(
        `
        id,
        school_name,
        skills,
        verification_status,
        school_id_url,
        parent_consent_url,
        total_hours,
        profiles!inner (
          full_name,
          phone,
          created_at
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
      return;
    }

    const formattedData = data.map((student: any) => ({
      id: student.id,
      full_name: student.profiles.full_name,
      phone: student.profiles.phone,
      created_at: student.profiles.created_at,
      school_name: student.school_name,
      skills: student.skills,
      verification_status: student.verification_status,
      school_id_url: student.school_id_url,
      parent_consent_url: student.parent_consent_url,
      total_hours: student.total_hours,
    }));

    setStudents(formattedData);
    setLoading(false);
  };

  const handleUpdateStatus = async (studentId: string, newStatus: string) => {
    setActionLoading(true);

    const { error } = await supabase
      .from('student_profiles')
      .update({ verification_status: newStatus })
      .eq('id', studentId);

    if (error) {
      console.error('Error updating status:', error);
      setActionLoading(false);
      return;
    }

    await supabase.from('admin_activity_log').insert({
      admin_id: user!.id,
      action_type: 'student_verification',
      target_type: 'student_profile',
      target_id: studentId,
      details: { new_status: newStatus },
    });

    setActionLoading(false);
    setShowDetailsModal(false);
    fetchStudents();
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.school_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' || student.verification_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const openDocument = (url: string) => {
    console.log('Opening document:', url);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Student Verification</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Verification</Text>
        <Text style={styles.headerSubtitle}>
          {students.filter((s) => s.verification_status === 'pending').length} pending
        </Text>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6c757d" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search students..."
            placeholderTextColor="#adb5bd"
          />
        </View>

        <View style={styles.filterRow}>
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <Pressable
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {filteredStudents.map((student) => (
          <Pressable
            key={student.id}
            style={styles.studentCard}
            onPress={() => {
              setSelectedStudent(student);
              setShowDetailsModal(true);
            }}
          >
            <View style={styles.studentCardHeader}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.full_name}</Text>
                <Text style={styles.studentSchool}>{student.school_name}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(student.verification_status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusLabel(student.verification_status)}
                </Text>
              </View>
            </View>

            <View style={styles.studentMeta}>
              <Text style={styles.metaText}>
                {student.total_hours.toFixed(1)} volunteer hours
              </Text>
              <Text style={styles.metaText}>
                {student.skills?.length || 0} skills listed
              </Text>
            </View>

            <View style={styles.viewDetailsButton}>
              <Eye size={16} color="#8b5cf6" />
              <Text style={styles.viewDetailsText}>View Details</Text>
            </View>
          </Pressable>
        ))}

        {filteredStudents.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No students found</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {selectedStudent && (
                <>
                  <Text style={styles.modalTitle}>{selectedStudent.full_name}</Text>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>School</Text>
                    <Text style={styles.detailValue}>{selectedStudent.school_name}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{selectedStudent.phone || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Skills</Text>
                    <View style={styles.skillsList}>
                      {selectedStudent.skills?.map((skill, idx) => (
                        <View key={idx} style={styles.skillTag}>
                          <Text style={styles.skillTagText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Volunteer Hours</Text>
                    <Text style={styles.detailValue}>
                      {selectedStudent.total_hours.toFixed(1)} hours
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Current Status</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(selectedStudent.verification_status) },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusLabel(selectedStudent.verification_status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Documents</Text>
                    {selectedStudent.school_id_url && (
                      <Pressable
                        style={styles.documentButton}
                        onPress={() => openDocument(selectedStudent.school_id_url)}
                      >
                        <ExternalLink size={16} color="#8b5cf6" />
                        <Text style={styles.documentButtonText}>View School ID</Text>
                      </Pressable>
                    )}
                    {selectedStudent.parent_consent_url && (
                      <Pressable
                        style={styles.documentButton}
                        onPress={() => openDocument(selectedStudent.parent_consent_url)}
                      >
                        <ExternalLink size={16} color="#8b5cf6" />
                        <Text style={styles.documentButtonText}>View Parent Consent</Text>
                      </Pressable>
                    )}
                    {!selectedStudent.school_id_url && !selectedStudent.parent_consent_url && (
                      <Text style={styles.noDocumentsText}>No documents uploaded</Text>
                    )}
                  </View>

                  {selectedStudent.verification_status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <Pressable
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleUpdateStatus(selectedStudent.id, 'approved')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <>
                            <CheckCircle size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Approve</Text>
                          </>
                        )}
                      </Pressable>

                      <Pressable
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleUpdateStatus(selectedStudent.id, 'rejected')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <>
                            <XCircle size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Reject</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <Pressable
              style={styles.closeModalButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </Pressable>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#ffffff',
  },
  filterButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c757d',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  studentCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 12,
  },
  studentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  studentSchool: {
    fontSize: 14,
    color: '#6c757d',
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
  studentMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#6c757d',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6c757d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  skillsList: {
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
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f0ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  documentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  noDocumentsText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeModalButton: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
});
