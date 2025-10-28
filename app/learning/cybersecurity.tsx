import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Shield, CheckCircle2, XCircle, Lock, Mail, AlertTriangle, Key, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CybersecurityModule() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const lessons = [
    {
      id: 0,
      title: 'Welcome to Cybersecurity',
      type: 'intro',
      content: 'Learn how to protect yourself online with simple, practical tips.',
    },
    {
      id: 1,
      title: 'Password Security',
      type: 'quiz',
      question: 'Which of these is the STRONGEST password?',
      options: [
        'password123',
        'MyDog2024',
        'M7x!pQ9#vL2$wR5',
        'JohnSmith',
      ],
      correctAnswer: 2,
      explanation: 'A strong password uses a mix of uppercase, lowercase, numbers, and special characters. Avoid common words and personal information.',
    },
    {
      id: 2,
      title: 'Phishing Emails',
      type: 'interactive',
      question: 'Is this email safe or a scam?',
      scenario: {
        from: 'support@amaz0n-security.com',
        subject: 'URGENT: Your account will be closed!',
        body: 'Click here immediately to verify your account or it will be deleted in 24 hours.',
      },
      correctAnswer: 'scam',
      explanation: 'This is a phishing scam! Red flags: urgent language, suspicious email address (amaz0n instead of amazon), and pressure to click immediately.',
    },
    {
      id: 3,
      title: 'Two-Factor Authentication',
      type: 'demo',
      content: 'Two-factor authentication (2FA) adds an extra layer of security by requiring both your password AND a code from your phone.',
    },
    {
      id: 4,
      title: 'Public Wi-Fi Safety',
      type: 'quiz',
      question: 'What should you AVOID doing on public Wi-Fi?',
      options: [
        'Reading news articles',
        'Checking the weather',
        'Online banking',
        'Watching videos',
      ],
      correctAnswer: 2,
      explanation: 'Never access sensitive information like banking on public Wi-Fi. Hackers can intercept your data on unsecured networks.',
    },
    {
      id: 5,
      title: 'Congratulations!',
      type: 'complete',
      content: 'You\'ve completed the Cybersecurity Basics module!',
    },
  ];

  const currentLesson = lessons[currentStep];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: (currentStep / (lessons.length - 1)) * 100,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
  }, [currentStep]);

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [currentStep]: answerIndex });

    if (currentLesson.type === 'quiz' && answerIndex === currentLesson.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentStep < lessons.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.back();
    }
  };

  const renderLesson = () => {
    switch (currentLesson.type) {
      case 'intro':
        return <IntroLesson lesson={currentLesson} onNext={handleNext} />;
      case 'quiz':
        return (
          <QuizLesson
            lesson={currentLesson}
            selectedAnswer={selectedAnswers[currentStep]}
            onAnswer={handleAnswer}
            onNext={handleNext}
          />
        );
      case 'interactive':
        return (
          <PhishingLesson
            lesson={currentLesson}
            selectedAnswer={selectedAnswers[currentStep]}
            onAnswer={handleAnswer}
            onNext={handleNext}
          />
        );
      case 'demo':
        return <DemoLesson lesson={currentLesson} onNext={handleNext} />;
      case 'complete':
        return <CompleteLesson score={score} totalQuestions={2} onFinish={() => router.back()} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#dc2626', '#b91c1c']}
        style={styles.header}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {lessons.length}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {renderLesson()}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function IntroLesson({ lesson, onNext }: any) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.lessonContainer}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Shield size={80} color="#dc2626" />
      </Animated.View>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <Text style={styles.lessonContent}>{lesson.content}</Text>

      <View style={styles.infoBox}>
        <Lock size={24} color="#2563eb" />
        <Text style={styles.infoText}>
          We'll cover passwords, phishing scams, and how to stay safe online.
        </Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryButtonText}>Let's Get Started</Text>
      </Pressable>
    </View>
  );
}

function QuizLesson({ lesson, selectedAnswer, onAnswer, onNext }: any) {
  const showFeedback = selectedAnswer !== undefined;
  const isCorrect = selectedAnswer === lesson.correctAnswer;

  return (
    <View style={styles.lessonContainer}>
      <View style={styles.iconContainer}>
        <Key size={60} color="#f59e0b" />
      </View>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <Text style={styles.questionText}>{lesson.question}</Text>

      <View style={styles.optionsContainer}>
        {lesson.options.map((option: string, index: number) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === lesson.correctAnswer;

          return (
            <Pressable
              key={index}
              style={[
                styles.optionButton,
                isSelected && styles.selectedOption,
                showFeedback && isCorrectOption && styles.correctOption,
                showFeedback && isSelected && !isCorrect && styles.wrongOption,
              ]}
              onPress={() => !showFeedback && onAnswer(index)}
              disabled={showFeedback}
            >
              <Text style={[
                styles.optionText,
                isSelected && styles.selectedOptionText,
              ]}>
                {option}
              </Text>
              {showFeedback && isCorrectOption && (
                <CheckCircle2 size={20} color="#10b981" />
              )}
              {showFeedback && isSelected && !isCorrect && (
                <XCircle size={20} color="#dc2626" />
              )}
            </Pressable>
          );
        })}
      </View>

      {showFeedback && (
        <View style={[styles.feedbackBox, isCorrect ? styles.correctFeedback : styles.wrongFeedback]}>
          <Text style={styles.feedbackTitle}>
            {isCorrect ? '✓ Correct!' : '✗ Not quite'}
          </Text>
          <Text style={styles.feedbackText}>{lesson.explanation}</Text>
        </View>
      )}

      {showFeedback && (
        <Pressable style={styles.primaryButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      )}
    </View>
  );
}

function PhishingLesson({ lesson, selectedAnswer, onAnswer, onNext }: any) {
  const showFeedback = selectedAnswer !== undefined;
  const isCorrect = selectedAnswer === lesson.correctAnswer;

  return (
    <View style={styles.lessonContainer}>
      <View style={styles.iconContainer}>
        <Mail size={60} color="#dc2626" />
      </View>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <Text style={styles.questionText}>{lesson.question}</Text>

      <View style={styles.emailContainer}>
        <View style={styles.emailHeader}>
          <Text style={styles.emailLabel}>From:</Text>
          <Text style={styles.emailValue}>{lesson.scenario.from}</Text>
        </View>
        <View style={styles.emailHeader}>
          <Text style={styles.emailLabel}>Subject:</Text>
          <Text style={styles.emailValue}>{lesson.scenario.subject}</Text>
        </View>
        <View style={styles.emailDivider} />
        <Text style={styles.emailBody}>{lesson.scenario.body}</Text>
      </View>

      {!showFeedback && (
        <View style={styles.choiceButtons}>
          <Pressable
            style={[styles.choiceButton, styles.safeButton]}
            onPress={() => onAnswer('safe')}
          >
            <CheckCircle2 size={24} color="#10b981" />
            <Text style={styles.choiceButtonText}>Safe</Text>
          </Pressable>
          <Pressable
            style={[styles.choiceButton, styles.scamButton]}
            onPress={() => onAnswer('scam')}
          >
            <AlertTriangle size={24} color="#dc2626" />
            <Text style={styles.choiceButtonText}>Scam</Text>
          </Pressable>
        </View>
      )}

      {showFeedback && (
        <View style={[styles.feedbackBox, isCorrect ? styles.correctFeedback : styles.wrongFeedback]}>
          <Text style={styles.feedbackTitle}>
            {isCorrect ? '✓ Correct!' : '✗ Not quite'}
          </Text>
          <Text style={styles.feedbackText}>{lesson.explanation}</Text>
        </View>
      )}

      {showFeedback && (
        <Pressable style={styles.primaryButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      )}
    </View>
  );
}

function DemoLesson({ lesson, onNext }: any) {
  const [showCode, setShowCode] = useState(false);

  return (
    <View style={styles.lessonContainer}>
      <View style={styles.iconContainer}>
        <Lock size={60} color="#10b981" />
      </View>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <Text style={styles.lessonContent}>{lesson.content}</Text>

      <View style={styles.demoBox}>
        <Text style={styles.demoTitle}>How it works:</Text>

        <View style={styles.demoStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>Enter your password</Text>
        </View>

        <View style={styles.demoStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>Receive a code on your phone</Text>
        </View>

        <View style={styles.demoStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>Enter the code to log in</Text>
            <Pressable
              style={styles.showCodeButton}
              onPress={() => setShowCode(!showCode)}
            >
              {showCode ? <EyeOff size={20} color="#2563eb" /> : <Eye size={20} color="#2563eb" />}
            </Pressable>
          </View>
        </View>

        {showCode && (
          <View style={styles.codeDisplay}>
            <Text style={styles.codeText}>123456</Text>
          </View>
        )}
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>💡 Pro Tip</Text>
        <Text style={styles.tipText}>
          Enable 2FA on all your important accounts like email, banking, and social media.
        </Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

function CompleteLesson({ score, totalQuestions, onFinish }: any) {
  const percentage = Math.round((score / totalQuestions) * 100);
  const celebrateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(celebrateAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.lessonContainer}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: celebrateAnim },
              {
                translateY: bounceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              },
            ],
          },
        ]}
      >
        <Shield size={80} color="#10b981" />
      </Animated.View>
      <Text style={styles.completeTitle}>Congratulations!</Text>
      <Text style={styles.completeSubtitle}>
        You've completed the Cybersecurity Basics module
      </Text>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Your Score</Text>
        <Text style={styles.scoreValue}>{percentage}%</Text>
        <Text style={styles.scoreText}>
          {score} out of {totalQuestions} correct
        </Text>
      </View>

      <View style={styles.keyTakeaways}>
        <Text style={styles.takeawaysTitle}>Key Takeaways:</Text>
        <View style={styles.takeawayItem}>
          <CheckCircle2 size={20} color="#10b981" />
          <Text style={styles.takeawayText}>Use strong, unique passwords</Text>
        </View>
        <View style={styles.takeawayItem}>
          <CheckCircle2 size={20} color="#10b981" />
          <Text style={styles.takeawayText}>Watch out for phishing scams</Text>
        </View>
        <View style={styles.takeawayItem}>
          <CheckCircle2 size={20} color="#10b981" />
          <Text style={styles.takeawayText}>Enable two-factor authentication</Text>
        </View>
        <View style={styles.takeawayItem}>
          <CheckCircle2 size={20} color="#10b981" />
          <Text style={styles.takeawayText}>Be careful on public Wi-Fi</Text>
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={onFinish}>
        <Text style={styles.primaryButtonText}>Back to Learning</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  lessonContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  lessonTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  lessonContent: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 20,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 30,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 20,
    borderRadius: 16,
    gap: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#1e40af',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedOption: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  correctOption: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  wrongOption: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  feedbackBox: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  correctFeedback: {
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  wrongFeedback: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1f2937',
  },
  feedbackText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  emailContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emailHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    width: 70,
  },
  emailValue: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  emailDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  emailBody: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  choiceButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  choiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  safeButton: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  scamButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
  choiceButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  demoBox: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  demoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  stepTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  showCodeButton: {
    padding: 8,
  },
  codeDisplay: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: 8,
  },
  tipBox: {
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 16,
    color: '#92400e',
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    color: '#6b7280',
  },
  keyTakeaways: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
  },
  takeawaysTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  takeawayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  takeawayText: {
    flex: 1,
    fontSize: 16,
    color: '#4b5563',
  },
});
