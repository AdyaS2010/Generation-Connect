import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Heart, Sparkles, Users, Smile, GraduationCap, HandHeart, Stars } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <LinearGradient
        colors={['#fef3c7', '#fed7aa', '#fecaca']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.container}>
          <View style={styles.impactBanner}>
            <Users size={16} color="#92400e" />
            <Text style={styles.impactText}>500+ sessions completed</Text>
            <Heart size={16} color="#dc2626" />
          </View>

          <View style={styles.heroSection}>
            <View style={styles.illustrationContainer}>
              <View style={styles.illustration}>
                <View style={styles.iconCircle}>
                  <Smile size={48} color="#f59e0b" strokeWidth={2.5} />
                </View>
                <View style={styles.connectLine}>
                  <Heart size={24} color="#f59e0b" />
                </View>
                <View style={styles.iconCircle}>
                  <GraduationCap size={48} color="#dc2626" strokeWidth={2.5} />
                </View>
              </View>
            </View>

            <Text style={styles.brandName}>Generation Connect</Text>
            <Text style={styles.tagline}>Tech help with heart</Text>
            <Text style={styles.subtitle}>
              Where wisdom meets curiosity
            </Text>
          </View>

          <View style={styles.buttonSection}>
            <Pressable
              style={styles.signInButton}
              onPress={() => router.push('/auth/sign-in')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Join our community</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.signUpCards}>
              <Pressable
                style={styles.seniorCard}
                onPress={() => router.push('/auth/senior-signup')}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconCircle}>
                    <Smile size={36} color="#f59e0b" strokeWidth={2.5} />
                  </View>
                  <Sparkles size={24} color="#f59e0b" />
                </View>
                <Text style={styles.cardTitle}>I'm a Senior</Text>
                <Text style={styles.cardDescription}>
                  Get help with tech, one step at a time! /** :D **/
                </Text>
                <View style={styles.cardButton}>
                  <Text style={styles.cardButtonText}>Get Started</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.studentCard}
                onPress={() => router.push('/auth/student-signup')}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconCircle}>
                    <GraduationCap size={36} color="#dc2626" strokeWidth={2.5} />
                  </View>
                  <HandHeart size={24} color="#dc2626" />
                </View>
                <Text style={styles.cardTitle}>I'm a Student Volunteer</Text>
                <Text style={styles.cardDescription}>
                  Make impact, earn hours, build connections
                </Text>
                <View style={styles.cardButton}>
                  <Text style={styles.cardButtonText}>Start Helping</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Building bridges across generations
            </Text>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#fef3c7',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  gradientBackground: {
    flex: 1,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  impactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
    marginBottom: 30,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  impactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  illustrationContainer: {
    marginBottom: 24,
  },
  illustration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 3,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  connectLine: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#78350f',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '600',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#92400e',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonSection: {
    width: '100%',
    maxWidth: 500,
    gap: 20,
  },
  signInButton: {
    backgroundColor: '#78350f',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#78350f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(146, 64, 14, 0.3)',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  signUpCards: {
    gap: 16,
  },
  seniorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#fed7aa',
  },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#fecaca',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(254, 243, 199, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  cardButton: {
    backgroundColor: '#78350f',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(146, 64, 14, 0.2)',
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#92400e',
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#78350f',
    fontWeight: '500',
  },
});
