import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Shield,
  Mail,
  Phone,
  Calendar,
  Users,
  Award,
  Settings,
  Bell,
  Moon,
  Sun,
  HelpCircle,
  Info,
  LogOut,
  User,
  Lock,
  Eye,
  Globe
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useRouter } from 'expo-router';

export default function TeamLeadProfile() {
  const { user, signOut } = useAuth();
  const { getTransitLeads, getUserLeads } = useData();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  if (!user) return null;

  const transitLeads = getTransitLeads();
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
        { text: 'Logout', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showSwitch = false,
    switchValue = false,
    onSwitchChange = () => {},
    showArrow = true
  }: any) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E2E8F0', true: '#1E40AF' }}
          thumbColor={switchValue ? '#FFF' : '#FFF'}
        />
      ) : showArrow ? (
        <Text style={styles.settingArrow}>›</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.name?.split(' ').map((n: string) => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.roleBadge}>
              <Shield size={16} color="#8B5CF6" />
              <Text style={styles.roleText}>Team Lead</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Contact Information</Text>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', margin: 16 }}>
            <TouchableOpacity style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 8, flex: 1, marginRight: 8 }} onPress={() => router.push('/(team_lead)/my-leads')}>
              <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: 'bold' }}>My Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#10B981', padding: 12, borderRadius: 8, flex: 1, marginLeft: 8 }} onPress={() => router.push('/(team_lead)/work-tracking')}>
              <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: 'bold' }}>Work Tracking</Text>
            </TouchableOpacity>
          </View>

        {/* Performance Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Performance Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{todayLeads.length}</Text>
              <Text style={styles.statLabel}>Today's Leads</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{transitLeads.length}</Text>
              <Text style={styles.statLabel}>Transit Leads</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{myLeads.length}</Text>
              <Text style={styles.statLabel}>Total Leads</Text>
            </View>
          </View>
        </View>

        {/* Lead Status Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Lead Status Breakdown</Text>
          <View style={styles.leadStats}>
            <View style={styles.leadStat}>
              <View style={styles.leadStatHeader}>
                <View style={[styles.leadStatDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.leadStatLabel}>Completed</Text>
              </View>
              <Text style={styles.leadStatNumber}>
                {myLeads.filter(l => l.status === 'completed').length}
              </Text>
            </View>
            <View style={styles.leadStat}>
              <View style={styles.leadStatHeader}>
                <View style={[styles.leadStatDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.leadStatLabel}>In Transit</Text>
              </View>
              <Text style={styles.leadStatNumber}>
                {myLeads.filter(l => l.status === 'transit').length}
              </Text>
            </View>
            <View style={styles.leadStat}>
              <View style={styles.leadStatHeader}>
                <View style={[styles.leadStatDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.leadStatLabel}>Declined</Text>
              </View>
              <Text style={styles.leadStatNumber}>
                {myLeads.filter(l => l.status === 'declined').length}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>

          {/* Notifications */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsSubtitle}>🔔 Notifications</Text>
            <SettingItem
              icon={<Bell size={20} color="#1E40AF" />}
              title="Push Notifications"
              subtitle="Receive notifications for new leads and updates"
              showSwitch={true}
              switchValue={notifications}
              onSwitchChange={setNotifications}
              showArrow={false}
            />
            <SettingItem
              icon={<Mail size={20} color="#1E40AF" />}
              title="Email Alerts"
              subtitle="Send email notifications for critical updates"
              showSwitch={true}
              switchValue={emailAlerts}
              onSwitchChange={setEmailAlerts}
              showArrow={false}
            />
          </View>

          {/* Appearance */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsSubtitle}>🎨 Appearance</Text>
            <SettingItem
              icon={<Moon size={20} color="#1E40AF" />}
              title="Dark Mode"
              subtitle="Switch between light and dark themes"
              showSwitch={true}
              switchValue={darkMode}
              onSwitchChange={setDarkMode}
              showArrow={false}
            />
            <SettingItem
              icon={<Globe size={20} color="#1E40AF" />}
              title="Language"
              subtitle="English (US)"
              onPress={() => Alert.alert('Language', 'Language selection would be available here.')}
            />
          </View>

          {/* Security */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsSubtitle}>🔒 Security</Text>
            <SettingItem
              icon={<Lock size={20} color="#1E40AF" />}
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => Alert.alert('Security', 'Password change functionality would be available here.')}
            />
            <SettingItem
              icon={<Shield size={20} color="#1E40AF" />}
              title="Two-Factor Authentication"
              subtitle="Add an extra layer of security"
              onPress={() => Alert.alert('Security', '2FA setup would be available here.')}
            />
            <SettingItem
              icon={<Eye size={20} color="#1E40AF" />}
              title="Privacy Settings"
              subtitle="Manage data privacy and permissions"
              onPress={() => Alert.alert('Privacy', 'Privacy settings would be available here.')}
            />
          </View>

          {/* Support */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsSubtitle}>💬 Support</Text>
            <SettingItem
              icon={<HelpCircle size={20} color="#1E40AF" />}
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={() => Alert.alert('Info', 'Help & Support coming soon!')}
            />
            <SettingItem
              icon={<Info size={20} color="#1E40AF" />}
              title="About"
              subtitle="App version and information"
              onPress={() => Alert.alert('About', 'Roshni Solar CRM v1.0.0\nTeam Lead Dashboard')}
            />
          </View>
        </View>

        {/* Logout Button - At the bottom */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E40AF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start' as const,
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 12,
  },
  contactCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 150,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  leadStats: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leadStat: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  leadStatHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  leadStatLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  leadStatDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  leadStatNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
  },
  settingsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden' as const,
    marginBottom: 16,
  },
  settingsSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E293B',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  settingArrow: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  logoutContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
}); 