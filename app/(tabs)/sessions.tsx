import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Linking,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { Calendar, Video, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, X, List } from 'lucide-react-native';

type Session = Database['public']['Tables']['sessions']['Row'];

export default function SessionsScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDaySessions, setSelectedDaySessions] = useState<Session[]>([]);

  useEffect(() => {
    fetchSessions();
  }, [profile]);

  // getting all sessions where user is either the student or senior
  const fetchSessions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .or(`student_id.eq.${user.id},senior_id.eq.${user.id}`)
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching sessions:', error);
      setErrorMessage('Failed to load sessions');
      setTimeout(() => setErrorMessage(''), 3000);
    } else {
      setSessions(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  // opening the video call link in browser or app
  // adya: to-do - add reminders/notifications before sessions start
  const handleJoinMeeting = (meetingLink: string) => {
    if (meetingLink) {
      Linking.openURL(meetingLink);
    } else {
      setErrorMessage('Meeting link not available');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleCompleteSession = (sessionId: string) => {
    router.push(`/session/${sessionId}/complete`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#3b82f6';
      case 'in_progress':
        return '#8b5cf6';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_time);
      return sessionDate.getFullYear() === date.getFullYear() &&
             sessionDate.getMonth() === date.getMonth() &&
             sessionDate.getDate() === date.getDate();
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDatePress = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const daySessions = getSessionsForDate(date);
    if (daySessions.length > 0) {
      setSelectedDate(date);
      setSelectedDaySessions(daySessions);
    }
  };

  const groupSessionsByDate = () => {
    const grouped: { [key: string]: Session[] } = {};
    sessions.forEach(session => {
      const dateKey = new Date(session.scheduled_time).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return Object.entries(grouped).sort((a, b) =>
      new Date(a[1][0].scheduled_time).getTime() - new Date(b[1][0].scheduled_time).getTime()
    );
  };

  const renderListView = () => {
    const groupedSessions = groupSessionsByDate();

    return (
      <FlatList
        data={groupedSessions}
        renderItem={({ item: [date, dateSessions] }) => (
          <View style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>{date}</Text>
              <Text style={styles.dateHeaderCount}>
                {dateSessions.length} {dateSessions.length === 1 ? 'session' : 'sessions'}
              </Text>
            </View>
            {dateSessions.map((session) => {
              const canComplete = profile?.role === 'senior' && session.status === 'completed' && !session.senior_signed_off;
              return (
                <View key={session.id} style={styles.timelineSessionCard}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.timelineTime}>
                      {new Date(session.scheduled_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text style={styles.timelineDuration}>{session.duration_minutes} min</Text>
                  </View>
                  <View style={styles.timelineSessionContent}>
                    <View style={styles.timelineSessionHeader}>
                      <View style={[styles.timelineStatusDot, { backgroundColor: getStatusColor(session.status) }]} />
                      <Text style={styles.timelineStatusText}>{getStatusLabel(session.status)}</Text>
                    </View>
                    {session.notes && (
                      <Text style={styles.timelineNotes} numberOfLines={2}>
                        {session.notes}
                      </Text>
                    )}
                    <View style={styles.timelineActions}>
                      {session.status === 'scheduled' && new Date(session.scheduled_time) > new Date() && (
                        <Pressable
                          style={styles.timelineJoinButton}
                          onPress={() => handleJoinMeeting(session.meeting_link || '')}
                        >
                          <Video size={16} color="#2563eb" />
                          <Text style={styles.timelineJoinText}>Join</Text>
                        </Pressable>
                      )}
                      {canComplete && (
                        <Pressable
                          style={styles.timelineSignOffButton}
                          onPress={() => handleCompleteSession(session.id)}
                        >
                          <CheckCircle size={16} color="#10b981" />
                          <Text style={styles.timelineSignOffText}>Sign Off</Text>
                        </Pressable>
                      )}
                    </View>
                    {session.senior_signed_off && (
                      <View style={styles.timelineSignOffBadge}>
                        <CheckCircle size={14} color="#10b981" />
                        <Text style={styles.timelineSignOffBadgeText}>Signed off</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
        keyExtractor={([date]) => date}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    );
  };

  const renderCalendarView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    const today = new Date();
    const isToday = (day: number) => {
      return today.getFullYear() === year &&
             today.getMonth() === month &&
             today.getDate() === day;
    };

    return (
      <ScrollView
        style={styles.calendarContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.monthHeader}>
          <Pressable onPress={previousMonth} style={styles.monthButton}>
            <ChevronLeft size={24} color="#2563eb" />
          </Pressable>
          <Text style={styles.monthText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable onPress={nextMonth} style={styles.monthButton}>
            <ChevronRight size={24} color="#2563eb" />
          </Pressable>
        </View>

        <View style={styles.weekDaysHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <View key={day} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <View key={dayIndex} style={styles.dayCell} />;
                }

                const date = new Date(year, month, day);
                const daySessions = getSessionsForDate(date);
                const hasEvents = daySessions.length > 0;

                return (
                  <Pressable
                    key={dayIndex}
                    style={[
                      styles.dayCell,
                      isToday(day) && styles.todayCell,
                    ]}
                    onPress={() => handleDatePress(day)}
                  >
                    <Text style={[
                      styles.dayText,
                      isToday(day) && styles.todayText,
                    ]}>
                      {day}
                    </Text>
                    {hasEvents && (
                      <View style={styles.eventIndicators}>
                        {daySessions.slice(0, 3).map((session, idx) => (
                          <View
                            key={session.id}
                            style={[
                              styles.eventDot,
                              { backgroundColor: getStatusColor(session.status) }
                            ]}
                          />
                        ))}
                        {daySessions.length > 3 && (
                          <Text style={styles.moreText}>+{daySessions.length - 3}</Text>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Status Legend:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getStatusColor('scheduled') }]} />
              <Text style={styles.legendText}>Scheduled</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getStatusColor('in_progress') }]} />
              <Text style={styles.legendText}>In Progress</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getStatusColor('completed') }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Sessions</Text>
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <List size={20} color={viewMode === 'list' ? '#ffffff' : '#6c757d'} />
          </Pressable>
          <Pressable
            style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleButtonActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Calendar size={20} color={viewMode === 'calendar' ? '#ffffff' : '#6c757d'} />
          </Pressable>
        </View>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Calendar size={64} color="#dee2e6" />
          <Text style={styles.emptyText}>No sessions scheduled yet</Text>
          <Text style={styles.emptySubtext}>
            {profile?.role === 'senior'
              ? 'Once a student claims your request, you can schedule a session'
              : 'Claim a request to schedule your first session'}
          </Text>
        </View>
      ) : viewMode === 'calendar' ? (
        renderCalendarView()
      ) : (
        renderListView()
      )}

      <Modal
        visible={selectedDate !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Pressable onPress={() => setSelectedDate(null)} style={styles.closeButton}>
                <X size={24} color="#6c757d" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll}>
              {selectedDaySessions.map((session) => {
                const canComplete = profile?.role === 'senior' && session.status === 'completed' && !session.senior_signed_off;
                return (
                  <View key={session.id} style={styles.modalSessionCard}>
                    <View style={styles.modalSessionHeader}>
                      <Text style={styles.modalSessionTime}>
                        {new Date(session.scheduled_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                      <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(session.status) }]}>
                        <Text style={styles.modalStatusText}>{getStatusLabel(session.status)}</Text>
                      </View>
                    </View>
                    <Text style={styles.modalDuration}>{session.duration_minutes} minutes</Text>
                    {session.notes && (
                      <Text style={styles.modalNotes}>{session.notes}</Text>
                    )}
                    <View style={styles.modalActions}>
                      {session.status === 'scheduled' && new Date(session.scheduled_time) > new Date() && (
                        <Pressable
                          style={styles.modalJoinButton}
                          onPress={() => {
                            handleJoinMeeting(session.meeting_link || '');
                            setSelectedDate(null);
                          }}
                        >
                          <Video size={18} color="#ffffff" />
                          <Text style={styles.modalJoinText}>Join Meeting</Text>
                        </Pressable>
                      )}
                      {canComplete && (
                        <Pressable
                          style={styles.modalCompleteButton}
                          onPress={() => {
                            handleCompleteSession(session.id);
                            setSelectedDate(null);
                          }}
                        >
                          <CheckCircle size={18} color="#ffffff" />
                          <Text style={styles.modalCompleteText}>Sign Off</Text>
                        </Pressable>
                      )}
                    </View>
                    {session.senior_signed_off && (
                      <View style={styles.modalSignOffBadge}>
                        <CheckCircle size={16} color="#10b981" />
                        <Text style={styles.modalSignOffText}>Signed off by senior</Text>
                      </View>
                    )}
                  </View>
                );
              })}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  listContent: {
    paddingBottom: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  dateHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  dateHeaderCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  timelineSessionCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 16,
  },
  timeColumn: {
    width: 80,
    paddingRight: 16,
    borderRightWidth: 2,
    borderRightColor: '#e5e7eb',
  },
  timelineTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  timelineDuration: {
    fontSize: 13,
    color: '#6c757d',
  },
  timelineSessionContent: {
    flex: 1,
    paddingLeft: 16,
  },
  timelineSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  timelineStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6c757d',
    textTransform: 'uppercase',
  },
  timelineNotes: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 12,
  },
  timelineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  timelineJoinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  timelineJoinText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  timelineSignOffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  timelineSignOffText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  timelineSignOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  timelineSignOffBadgeText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6c757d',
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  weekDayCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6c757d',
  },
  calendarGrid: {
    padding: 4,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  todayCell: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  todayText: {
    color: '#2563eb',
  },
  eventIndicators: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreText: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '600',
  },
  legendContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f8f9fa',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#6c757d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 16,
  },
  modalSessionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalSessionTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalDuration: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  modalNotes: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalJoinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
  },
  modalJoinText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalCompleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
  },
  modalCompleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalSignOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  modalSignOffText: {
    fontSize: 14,
    color: '#10b981',
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
});
