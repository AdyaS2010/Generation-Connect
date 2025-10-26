import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Award,
  Clock,
  Users,
  Star,
  TrendingUp,
  Download,
  Sparkles,
  Trophy,
  Crown,
  Zap,
  Cpu,
  Heart,
  Shield,
  GraduationCap,
  ShoppingBag,
  Sunrise,
  Moon,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';

interface ImpactStats {
  total_sessions: number;
  total_hours: number;
  seniors_helped: number;
  average_rating: number;
  categories_covered: number;
  five_star_count: number;
  badges_earned: number;
  category_breakdown?: Record<string, number>;
  recent_sessions?: any[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  badge_type: string;
  icon: string;
  requirement_value: number;
  earned_at?: string;
  progress?: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [inProgressBadges, setInProgressBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const { data: statsData, error: statsError } = await supabase.rpc(
        'get_student_impact_stats',
        { student_user_id: profile!.id }
      );

      if (statsError) throw statsError;
      setStats(statsData);

      const [{ data: allBadgesData }, { data: studentBadgesData }] = await Promise.all([
        supabase.from('badges').select('*'),
        supabase.from('student_badges').select('*').eq('student_id', profile!.id),
      ]);

      const earned: Badge[] = [];
      const inProgress: Badge[] = [];

      const studentBadgesMap = new Map(
        studentBadgesData?.map((sb) => [sb.badge_id, sb]) || []
      );

      allBadgesData?.forEach((badge: any) => {
        const studentBadge = studentBadgesMap.get(badge.id);
        const progress = studentBadge?.progress || 0;
        const badgeWithProgress = {
          ...badge,
          earned_at: studentBadge?.earned_at,
          progress,
        };

        if (progress >= badge.requirement_value) {
          earned.push(badgeWithProgress);
        } else {
          inProgress.push(badgeWithProgress);
        }
      });

      setEarnedBadges(earned);
      setInProgressBadges(inProgress);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setErrorMessage('Failed to load dashboard data');
      setTimeout(() => setErrorMessage(''), 3000);
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    setErrorMessage('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-impact-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            student_id: profile!.id,
            student_name: profile!.full_name,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Report generation error:', errorData);
        throw new Error('Failed to generate report');
      }

      const htmlContent = await response.text();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
        };
      }

      setSuccessMessage('Report opened in new tab - use Print to save as PDF');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error downloading report:', error);
      setErrorMessage('Failed to generate report');
      setTimeout(() => setErrorMessage(''), 3000);
    }

    setDownloadingReport(false);
  };

  const getBadgeIcon = (iconName: string, size: number, color: string) => {
    const icons: Record<string, any> = {
      'star': Star,
      'award': Award,
      'trophy': Trophy,
      'crown': Crown,
      'zap': Zap,
      'cpu': Cpu,
      'users': Users,
      'heart-pulse': Heart,
      'shopping-bag': ShoppingBag,
      'shield': Shield,
      'graduation-cap': GraduationCap,
      'sparkles': Sparkles,
      'sunrise': Sunrise,
      'moon': Moon,
    };
    const Icon = icons[iconName] || Award;
    return <Icon size={size} color={color} />;
  };

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case 'milestone':
        return '#2563eb';
      case 'skill':
        return '#10b981';
      case 'impact':
        return '#f59e0b';
      case 'special':
        return '#8b5cf6';
      default:
        return '#6c757d';
    }
  };

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
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
      {successMessage ? (
        <View style={styles.successBanner}>
          <CheckCircle size={20} color="#065f46" />
          <Text style={styles.successBannerText}>{successMessage}</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your volunteer impact</Text>
        </View>
        <Pressable
          style={[styles.downloadButton, downloadingReport && styles.buttonDisabled]}
          onPress={handleDownloadReport}
          disabled={downloadingReport}
        >
          <Download size={20} color="#ffffff" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Trophy size={28} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>{stats?.total_sessions || 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Clock size={28} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{(stats?.total_hours || 0).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Users size={28} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{stats?.seniors_helped || 0}</Text>
            <Text style={styles.statLabel}>Seniors Helped</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Star size={28} color="#eab308" />
            </View>
            <Text style={styles.statValue}>
              {(stats?.average_rating || 0).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Award size={24} color="#2563eb" />
              <Text style={styles.sectionTitle}>Badges Earned ({earnedBadges.length})</Text>
            </View>
          </View>

          {earnedBadges.length > 0 ? (
            <View style={styles.badgesGrid}>
              {earnedBadges.map((badge) => (
                <View key={badge.id} style={styles.badgeCard}>
                  <View
                    style={[
                      styles.badgeIconContainer,
                      { backgroundColor: getBadgeColor(badge.badge_type) },
                    ]}
                  >
                    {getBadgeIcon(badge.icon, 32, '#ffffff')}
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDescription} numberOfLines={2}>
                    {badge.description}
                  </Text>
                  <Text style={styles.badgeEarnedDate}>
                    Earned {new Date(badge.earned_at!).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No badges earned yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Complete sessions to earn your first badge!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <TrendingUp size={24} color="#10b981" />
              <Text style={styles.sectionTitle}>In Progress ({inProgressBadges.length})</Text>
            </View>
          </View>

          {inProgressBadges.length > 0 ? (
            <View style={styles.badgesGrid}>
              {inProgressBadges.slice(0, 6).map((badge) => {
                const progress = ((badge.progress || 0) / badge.requirement_value) * 100;
                return (
                  <View key={badge.id} style={[styles.badgeCard, styles.badgeCardInProgress]}>
                    <View
                      style={[
                        styles.badgeIconContainer,
                        styles.badgeIconContainerInProgress,
                        { borderColor: getBadgeColor(badge.badge_type) },
                      ]}
                    >
                      <View style={styles.silhouetteContainer}>
                        {getBadgeIcon(badge.icon, 32, '#dee2e6')}
                      </View>
                    </View>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                    <Text style={styles.badgeDescription} numberOfLines={2}>
                      {badge.description}
                    </Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(progress, 100)}%`,
                              backgroundColor: getBadgeColor(badge.badge_type),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {badge.progress}/{badge.requirement_value}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>All badges earned!</Text>
              <Text style={styles.emptyStateSubtext}>You're a champion!</Text>
            </View>
          )}
        </View>

        {stats?.category_breakdown && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Sparkles size={24} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Category Breakdown</Text>
              </View>
            </View>

            <View style={styles.categoryList}>
              {Object.entries(stats.category_breakdown).map(([category, count]) => (
                <View key={category} style={styles.categoryItem}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryCount}>{count} sessions</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
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
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  downloadButton: {
    backgroundColor: '#2563eb',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '31%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  badgeCardInProgress: {
    backgroundColor: '#ffffff',
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIconContainerInProgress: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
  },
  silhouetteContainer: {
    opacity: 0.3,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 6,
  },
  badgeEarnedDate: {
    fontSize: 10,
    color: '#adb5bd',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 4,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#dee2e6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '600',
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 4,
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
