import { Tabs } from 'expo-router';
import { Home, MessageSquare, Calendar, User, Users } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { profile } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6c757d',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#dee2e6',
          paddingBottom: 16,
          paddingTop: 12,
          height: 85,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: profile?.role === 'senior' ? 'My Requests' : 'Browse',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      {profile?.role === 'senior' && (
        <Tabs.Screen
          name="community"
          options={{
            title: 'Community',
            tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ size, color }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
