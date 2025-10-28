import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Video, Plus, Shield, Clock, Users, CheckCircle2, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LearningScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const isStudent = profile?.role === 'student';

  if (isStudent) {
    return <StudentLearningView />;
  }

  return <SeniorLearningView />;
}

function StudentLearningView() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#dbeafe', '#eff6ff']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Learning Hub</Text>
        <Text style={styles.headerSubtitle}>Create and manage lessons for seniors</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Pressable
          style={styles.createButton}
          onPress={() => router.push('/learning/create-lesson')}
        >
          <Plus size={24} color="#ffffff" />
          <Text style={styles.createButtonText}>Create New Lesson</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <Pressable style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <Video size={28} color="#2563eb" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Schedule Webinar</Text>
              <Text style={styles.actionDescription}>Host live learning sessions</Text>
            </View>
          </Pressable>

          <Pressable style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <BookOpen size={28} color="#10b981" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Create Module</Text>
              <Text style={styles.actionDescription}>Build interactive lessons</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Lessons</Text>

          <View style={styles.lessonCard}>
            <View style={styles.lessonHeader}>
              <Shield size={24} color="#dc2626" />
              <View style={styles.lessonBadge}>
                <Text style={styles.lessonBadgeText}>Active</Text>
              </View>
            </View>
            <Text style={styles.lessonTitle}>Cybersecurity Basics</Text>
            <Text style={styles.lessonDescription}>
              Learn how to stay safe online
            </Text>
            <View style={styles.lessonStats}>
              <View style={styles.statItem}>
                <Users size={16} color="#6b7280" />
                <Text style={styles.statText}>24 enrolled</Text>
              </View>
              <View style={styles.statItem}>
                <Clock size={16} color="#6b7280" />
                <Text style={styles.statText}>30 min</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function SeniorLearningView() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#fef3c7', '#fed7aa']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Learning Center</Text>
        <Text style={styles.headerSubtitle}>Explore interactive lessons and webinars</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Modules</Text>

          <Pressable
            style={styles.moduleCard}
            onPress={() => router.push('/learning/cybersecurity')}
          >
            <LinearGradient
              colors={['#dc2626', '#b91c1c']}
              style={styles.moduleGradient}
            >
              <Shield size={40} color="#ffffff" />
            </LinearGradient>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Cybersecurity Basics</Text>
              <Text style={styles.moduleDescription}>
                Learn how to protect yourself online
              </Text>
              <View style={styles.moduleFooter}>
                <View style={styles.moduleStats}>
                  <Clock size={14} color="#6b7280" />
                  <Text style={styles.moduleStatText}>30 min</Text>
                </View>
                <View style={styles.moduleLevel}>
                  <Text style={styles.moduleLevelText}>Beginner</Text>
                </View>
              </View>
            </View>
          </Pressable>

          <Pressable style={styles.moduleCard}>
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              style={styles.moduleGradient}
            >
              <Video size={40} color="#ffffff" />
            </LinearGradient>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Video Calling Basics</Text>
              <Text style={styles.moduleDescription}>
                Connect with family using video calls
              </Text>
              <View style={styles.moduleFooter}>
                <View style={styles.moduleStats}>
                  <Clock size={14} color="#6b7280" />
                  <Text style={styles.moduleStatText}>25 min</Text>
                </View>
                <View style={styles.moduleLevel}>
                  <Text style={styles.moduleLevelText}>Beginner</Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Webinars</Text>

          <View style={styles.webinarCard}>
            <View style={styles.webinarHeader}>
              <Text style={styles.webinarDate}>Tomorrow, 2:00 PM</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
            <Text style={styles.webinarTitle}>Smart Home Devices</Text>
            <Text style={styles.webinarHost}>Hosted by Sarah Chen</Text>
            <Pressable style={styles.webinarButton}>
              <Text style={styles.webinarButtonText}>Register</Text>
            </Pressable>
          </View>

          <View style={styles.webinarCard}>
            <View style={styles.webinarHeader}>
              <Text style={styles.webinarDate}>Friday, 10:00 AM</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
            <Text style={styles.webinarTitle}>Social Media Safety</Text>
            <Text style={styles.webinarHost}>Hosted by Mike Rodriguez</Text>
            <Pressable style={styles.webinarButton}>
              <Text style={styles.webinarButtonText}>Register</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>

          <View style={styles.progressCard}>
            <View style={styles.progressItem}>
              <CheckCircle2 size={20} color="#10b981" />
              <Text style={styles.progressText}>Email Basics</Text>
              <Award size={16} color="#f59e0b" />
            </View>
            <View style={styles.progressItem}>
              <CheckCircle2 size={20} color="#10b981" />
              <Text style={styles.progressText}>Password Security</Text>
              <Award size={16} color="#f59e0b" />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lessonBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  lessonStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  moduleCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  moduleGradient: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleContent: {
    flex: 1,
    padding: 16,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moduleStatText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  moduleLevel: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moduleLevelText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  webinarCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  webinarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  webinarDate: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
  },
  liveText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  webinarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  webinarHost: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  webinarButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  webinarButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  progressText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
});
