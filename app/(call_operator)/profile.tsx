import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Phone, 
  Mail, 
  LogOut, 
  Clock, 
  TrendingUp, 
  Users, 
  CheckCircle,
  Calendar,
  MapPin,
  Bell,
  Moon,
  Sun,
  HelpCircle,
  Info,
  Lock,
  Eye,
  Globe,
  Shield,
  Smartphone
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { FadeInView, SlideInView, ScaleInView, AnimatedCard } from '@/components/AnimatedComponents';
import { router } from 'expo-router';

export default function CallOperatorProfileScreen() {
  const { user, signOut } = useAuth();
  const { getUserLeads, getUserTickets } = useData();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { 
    pushNotifications, 
    emailAlerts, 
    smsAlerts, 
    setPushNotifications, 
    setEmailAlerts, 
    setSmsAlerts 
  } = useNotifications();

  if (!user) return null;

  const myLeads = getUserLeads(user.id);
  const myTickets = getUserTickets(user.id);
  
  const todayLeads = myLeads.filter(lead => {
    const today = new Date().toDateString();
    const leadDate = new Date(lead.created_at).toDateString();
    return today === leadDate && lead.call_operator_id === user.id;
  });

  const completedLeads = myLeads.filter(l => l.status === 'completed' && l.call_operator_id === user.id);
  const resolvedTickets = myTickets.filter(t => t.status === 'resolved');

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getGradientColors = () => {
    return ['#1E40AF', '#3B82F6', '#60A5FA'] as const;
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement 
  }: { 
    icon: any; 
    title: string; 
    subtitle?: string; 
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderColor: theme.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIcon, { backgroundColor: theme.primaryLight }]}>
        <Icon size={20} color={theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  const ToggleItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    value, 
    onValueChange,
    disabled
  }: { 
    icon: any; 
    title: string; 
    subtitle?: string; 
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View style={[styles.settingItem, { borderColor: theme.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: theme.primaryLight }]}>
        <Icon size={20} color={theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: theme.primary }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        disabled={disabled}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={getGradientColors()} style={styles.header}>
          <FadeInView duration={600}>
            <View style={styles.profileHeader}>
              <ScaleInView delay={200} duration={600}>
                <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.avatarText, { color: theme.textInverse }]}>
                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                  </Text>
                </View>
              </ScaleInView>
              <SlideInView delay={400} duration={600} direction="right">
                <View style={styles.profileInfo}>
                  <Text style={[styles.userName, { color: theme.textInverse }]}>{user.name}</Text>
                  <Text style={[styles.userRole, { color: theme.textInverse }]}>Call Operator</Text>
                  <Text style={[styles.userShift, { color: theme.textInverse }]}>
                    {(user as any).shift || 'Day Shift'}
                  </Text>
                </View>
              </SlideInView>
            </View>
          </FadeInView>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats Section */}
          <FadeInView delay={600} duration={600}>
            <View style={styles.statsContainer}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Performance</Text>
              <View style={styles.statsGrid}>
                <AnimatedCard index={0} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: theme.primaryLight }]}>
                    <Calendar size={20} color={theme.textInverse} />
                  </View>
                  <Text style={[styles.statNumber, { color: theme.text }]}>{todayLeads.length}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Leads Today</Text>
                </AnimatedCard>
                
                <AnimatedCard index={1} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: theme.success }]}>
                    <TrendingUp size={20} color={theme.textInverse} />
                  </View>
                  <Text style={[styles.statNumber, { color: theme.text }]}>
                    {myLeads.filter(l => l.call_operator_id === user.id).length}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Leads</Text>
                </AnimatedCard>
              </View>
            </View>
          </FadeInView>

          {/* Contact Information */}
          <View style={styles.infoContainer}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.contactCard}>
              <View style={styles.contactRow}>
                <Mail size={20} color="#64748B" />
                <Text style={styles.contactText}>{user?.email}</Text>
              </View>
              <View style={styles.contactRow}>
                <Phone size={20} color="#64748B" />
                <Text style={styles.contactText}>{user?.phone || 'Not provided'}</Text>
              </View>
              <View style={styles.contactRow}>
                <Calendar size={20} color="#64748B" />
                <Text style={styles.contactText}>
                  Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </Text>
              </View>
            </View>
          </View>
          {/* My Leads and Work Tracking Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 20 }}>
            <TouchableOpacity style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 8, flex: 1, marginRight: 8 }} onPress={() => router.push('/my-leads')}>
              <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: 'bold' }}>My Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#10B981', padding: 12, borderRadius: 8, flex: 1, marginLeft: 8 }} onPress={() => router.push('/work-tracking')}>
              <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: 'bold' }}>Work Tracking</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Section */}
          <SlideInView delay={1000} duration={600} direction="up">
            <SettingSection title="Notifications">
              <ToggleItem
                icon={Bell}
                title="Push Notifications"
                subtitle="Receive notifications for new leads and updates"
                value={pushNotifications}
                onValueChange={setPushNotifications}
              />
              <ToggleItem
                icon={Mail}
                title="Email Alerts"
                subtitle="Send email notifications for critical updates"
                value={emailAlerts}
                onValueChange={setEmailAlerts}
              />
              <ToggleItem
                icon={Smartphone}
                title="SMS Alerts"
                subtitle="Send SMS for urgent notifications"
                value={smsAlerts}
                onValueChange={setSmsAlerts}
              />
            </SettingSection>

            <SettingSection title="Appearance">
              <ToggleItem
                icon={isDarkMode ? Moon : Sun}
                title="Dark Mode"
                subtitle="Switch between light and dark themes"
                value={isDarkMode}
                onValueChange={toggleTheme}
              />
              <SettingItem
                icon={Globe}
                title="Language"
                subtitle="English (US)"
                onPress={() => Alert.alert('Language', 'Language selection would be available here.')}
              />
            </SettingSection>

            <SettingSection title="Security">
              <SettingItem
                icon={Lock}
                title="Change Password"
                subtitle="Update your account password"
                onPress={() => Alert.alert('Security', 'Password change functionality would be available here.')}
              />
              <SettingItem
                icon={Shield}
                title="Two-Factor Authentication"
                subtitle="Add an extra layer of security"
                onPress={() => Alert.alert('Security', '2FA setup would be available here.')}
              />
              <SettingItem
                icon={Eye}
                title="Privacy Settings"
                subtitle="Manage data privacy and permissions"
                onPress={() => Alert.alert('Privacy', 'Privacy settings would be available here.')}
              />
            </SettingSection>

            <SettingSection title="Support">
              <SettingItem
                icon={HelpCircle}
                title="Help & Support"
                subtitle="Get help and contact support"
                onPress={() => Alert.alert('Info', 'Help & Support coming soon!')}
              />
              <SettingItem
                icon={Info}
                title="About"
                subtitle="App version and information"
                onPress={() => Alert.alert('About', 'Roshni Solar CRM v1.0.0\nCall Operator Dashboard')}
              />
            </SettingSection>
          </SlideInView>

          {/* Logout Button - At the bottom */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
    opacity: 0.9,
  },
  userShift: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  contactCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  logoutButton: {
    borderRadius: 12,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  settingsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  settingsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  settingArrow: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionContent: {
    borderRadius: 12,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});