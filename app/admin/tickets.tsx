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
import { MessageSquare, Clock, CheckCircle, Search, X } from 'lucide-react-native';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
}

export default function AdminTicketsScreen() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('open');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [response, setResponse] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(ticketsData.map((t) => t.user_id))];
    const { data: usersData } = await supabase.auth.admin.listUsers();

    const ticketsWithUsers = ticketsData.map((ticket) => {
      const user = usersData?.users.find((u) => u.id === ticket.user_id);
      return {
        ...ticket,
        user_name: user?.user_metadata?.full_name || 'Unknown User',
        user_email: user?.email || 'unknown@email.com',
      };
    });

    setTickets(ticketsWithUsers);
    setLoading(false);
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    setActionLoading(true);

    const updateData: any = { status: newStatus };
    if (newStatus === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }
    if (response.trim()) {
      updateData.admin_response = response.trim();
      updateData.admin_id = user!.id;
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId);

    if (error) {
      console.error('Error updating ticket:', error);
      setActionLoading(false);
      return;
    }

    await supabase.from('admin_activity_log').insert({
      admin_id: user!.id,
      action_type: 'ticket_update',
      target_type: 'support_ticket',
      target_id: ticketId,
      details: { new_status: newStatus, response: response.trim() || null },
    });

    setActionLoading(false);
    setShowDetailsModal(false);
    setResponse('');
    fetchTickets();
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#f59e0b';
      case 'in_progress':
        return '#2563eb';
      case 'resolved':
        return '#10b981';
      case 'closed':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Support Tickets</Text>
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
        <Text style={styles.headerTitle}>Support Tickets</Text>
        <Text style={styles.headerSubtitle}>
          {tickets.filter((t) => t.status === 'open').length} open tickets
        </Text>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6c757d" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tickets..."
            placeholderTextColor="#adb5bd"
          />
        </View>

        <View style={styles.filterRow}>
          {['open', 'in_progress', 'resolved', 'all'].map((status) => (
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
                {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {filteredTickets.map((ticket) => (
          <Pressable
            key={ticket.id}
            style={styles.ticketCard}
            onPress={() => {
              setSelectedTicket(ticket);
              setResponse(ticket.admin_response || '');
              setShowDetailsModal(true);
            }}
          >
            <View style={styles.ticketHeader}>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                <Text style={styles.ticketUser}>{ticket.user_name}</Text>
              </View>
              <View style={styles.badges}>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(ticket.priority) },
                  ]}
                >
                  <Text style={styles.badgeText}>{ticket.priority}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(ticket.status) },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {ticket.status === 'in_progress' ? 'In Progress' : ticket.status}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.ticketCategory} numberOfLines={1}>
              {ticket.category.replace('_', ' ')}
            </Text>

            <View style={styles.ticketFooter}>
              <View style={styles.ticketDate}>
                <Clock size={14} color="#6c757d" />
                <Text style={styles.dateText}>{formatDate(ticket.created_at)}</Text>
              </View>
              <View style={styles.viewButton}>
                <MessageSquare size={14} color="#8b5cf6" />
                <Text style={styles.viewButtonText}>View Details</Text>
              </View>
            </View>
          </Pressable>
        ))}

        {filteredTickets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tickets found</Text>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ticket Details</Text>
              <Pressable onPress={() => setShowDetailsModal(false)}>
                <X size={24} color="#6c757d" />
              </Pressable>
            </View>

            <ScrollView>
              {selectedTicket && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Subject</Text>
                    <Text style={styles.detailValue}>{selectedTicket.subject}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>From</Text>
                    <Text style={styles.detailValue}>{selectedTicket.user_name}</Text>
                    <Text style={styles.detailSubValue}>{selectedTicket.user_email}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{selectedTicket.description}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Category</Text>
                      <Text style={styles.detailValue}>
                        {selectedTicket.category.replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Priority</Text>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(selectedTicket.priority) },
                        ]}
                      >
                        <Text style={styles.badgeText}>{selectedTicket.priority}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Current Status</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(selectedTicket.status) },
                      ]}
                    >
                      <Text style={styles.badgeText}>{selectedTicket.status}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Admin Response</Text>
                    <TextInput
                      style={styles.responseInput}
                      value={response}
                      onChangeText={setResponse}
                      placeholder="Enter your response to the user..."
                      placeholderTextColor="#adb5bd"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                    <View style={styles.actionButtons}>
                      {selectedTicket.status === 'open' && (
                        <Pressable
                          style={[styles.actionButton, styles.inProgressButton]}
                          onPress={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <ActivityIndicator color="#ffffff" />
                          ) : (
                            <Text style={styles.actionButtonText}>Mark In Progress</Text>
                          )}
                        </Pressable>
                      )}

                      <Pressable
                        style={[styles.actionButton, styles.resolveButton]}
                        onPress={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <>
                            <CheckCircle size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Mark Resolved</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
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
  ticketCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 12,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  ticketUser: {
    fontSize: 14,
    color: '#6c757d',
  },
  badges: {
    gap: 4,
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  ticketCategory: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  ticketDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6c757d',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewButtonText: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
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
    lineHeight: 24,
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  responseInput: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    color: '#1a1a1a',
    minHeight: 100,
  },
  actionButtons: {
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  inProgressButton: {
    backgroundColor: '#2563eb',
  },
  resolveButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
