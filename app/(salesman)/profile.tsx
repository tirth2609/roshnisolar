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
  Sun, 
  TrendingUp, 
  Calendar,
  Bell,
  Moon,
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

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { getUserLeads } = useData();
  const { isDarkMode, toggleTheme } = useTheme();
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
  const todayLeads = myLeads.filter(lead => {
    const today = new Date().toDateString();
    const leadDate = new Date(lead.created_at).toDateString();
    return today === leadDate;
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            signOut();
          },
        },
      ]
    );
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
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
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingIcon}>
        <Icon size={20} color="#64748B" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
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
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Icon size={20} color="#64748B" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: '#FF6B35' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        disabled={disabled}
      />
    </View>
  );


  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#F97316']} style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.name.split(' ').map((n: string) => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>Salesman</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Performance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Calendar size={20} color="#FF6B35" />
              </View>
              <Text style={styles.statNumber}>{todayLeads.length}</Text>
              <Text style={styles.statLabel}>Leads Today</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <TrendingUp size={20} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{myLeads.length}</Text>
              <Text style={styles.statLabel}>Total Leads</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Mail size={20} color="#64748B" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Phone size={20} color="#64748B" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Sun size={20} color="#64748B" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Section */}
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
              onPress={() => Alert.alert('About', 'Roshni Solar CRM v1.0.0\nSalesman Dashboard')}
            />
        </SettingSection>

        {/* Logout Button - At the bottom */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <LogOut size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statsContainer: {
    margin: 20,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
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
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
  },
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    color: '#1E293B',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    height: 52,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});