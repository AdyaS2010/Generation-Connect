import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Users, UserCheck, Clock, MessageSquare, TrendingUp, Calendar } from 'lucide-react-native';

interface DashboardStats {
  total_seniors: number;
  total_students: number;
  pending_verifications: number;
  open_tickets: number;
  total_completed_sessions: number;
  total_volunteer_minutes: number;
  requests_last_week: number;
  sessions_last_week: number;
}

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    const { data: statsData } = await supabase
      .from('admin_dashboard_stats')
      .select('*')
      .single();

    if (statsData) {
      setStats(statsData);
    }

    const { data: requestsByCategory } = await supabase
      .from('help_requests')
      .select('category');

    if (requestsByCategory) {
      const categoryCounts: any = {};
      requestsByCategory.forEach((req: any) => {
        categoryCounts[req.category] = (categoryCounts[req.category] || 0) + 1;
      });
      const categoryArray = Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count,
      }));
      setCategoryData(categoryArray);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </View>
    );
  }

  const totalHours = stats ? Math.floor(stats.total_volunteer_minutes / 60) : 0;
  const weekGrowth = stats && stats.sessions_last_week > 0 ? '+' + stats.sessions_last_week : '0';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Platform Overview</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
              <Users size={32} color="#2563eb" />
              <Text style={styles.statValue}>{stats?.total_seniors || 0}</Text>
              <Text style={styles.statLabel}>Total Seniors</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
              <UserCheck size={32} color="#10b981" />
              <Text style={styles.statValue}>{stats?.total_students || 0}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
              <Clock size={32} color="#f59e0b" />
              <Text style={styles.statValue}>{stats?.pending_verifications || 0}</Text>
              <Text style={styles.statLabel}>Pending Verification</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
              <MessageSquare size={32} color="#ef4444" />
              <Text style={styles.statValue}>{stats?.open_tickets || 0}</Text>
              <Text style={styles.statLabel}>Open Tickets</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <Calendar size={24} color="#8b5cf6" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityValue}>{stats?.total_completed_sessions || 0}</Text>
                <Text style={styles.activityLabel}>Total Sessions Completed</Text>
              </View>
            </View>

            <View style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <Clock size={24} color="#8b5cf6" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityValue}>{totalHours} hours</Text>
                <Text style={styles.activityLabel}>Total Volunteer Hours</Text>
              </View>
            </View>

            <View style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <TrendingUp size={24} color="#10b981" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityValue}>
                  {stats?.sessions_last_week || 0} sessions
                </Text>
                <Text style={styles.activityLabel}>This Week</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requests by Category</Text>
          <View style={styles.categoryCard}>
            {categoryData.length > 0 ? (
              categoryData.map((item, index) => {
                const maxCount = Math.max(...categoryData.map((c) => c.count));
                const percentage = (item.count / maxCount) * 100;
                return (
                  <View key={index} style={styles.categoryRow}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <View style={styles.categoryBarContainer}>
                      <View
                        style={[
                          styles.categoryBar,
                          {
                            width: `${percentage}%`,
                            backgroundColor: '#8b5cf6',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.categoryCount}>{item.count}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noDataText}>No request data available</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.quickStatsCard}>
            <View style={styles.quickStatRow}>
              <Text style={styles.quickStatLabel}>Requests This Week</Text>
              <Text style={styles.quickStatValue}>{stats?.requests_last_week || 0}</Text>
            </View>
            <View style={styles.quickStatRow}>
              <Text style={styles.quickStatLabel}>Average Session Duration</Text>
              <Text style={styles.quickStatValue}>
                {stats && stats.total_completed_sessions > 0
                  ? Math.round(stats.total_volunteer_minutes / stats.total_completed_sessions)
                  : 0}{' '}
                min
              </Text>
            </View>
            <View style={styles.quickStatRow}>
              <Text style={styles.quickStatLabel}>Platform Status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusIndicator} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    gap: 16,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    width: 100,
    textTransform: 'capitalize',
  },
  categoryBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 6,
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    width: 40,
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    padding: 20,
  },
  quickStatsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    gap: 16,
  },
  quickStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065f46',
  },
});
