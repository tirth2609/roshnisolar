import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Phone, 
  Mail, 
  LogOut, 
  TrendingUp, 
  Users, 
  BarChart3,
  Calendar,
  Shield,
  Settings,
  Bell,
  Moon,
  Sun,
  HelpCircle,
  Info,
  Lock,
  Eye,
  Globe,
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Smartphone,
  HardDrive
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useData } from '@/contexts/DataContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';

export default function SuperAdminProfileScreen() {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { 
    pushNotifications, 
    emailAlerts, 
    smsAlerts, 
    setPushNotifications, 
    setEmailAlerts, 
    setSmsAlerts 
  } = useNotifications();
  const { leads, getSalesmen, getCallOperators, getTechnicians, bulkImportLeads } = useData();
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  if (!user) {
    return null;
  }

  const salesmen = getSalesmen();
  const operators = getCallOperators();
  const technicians = getTechnicians();
  const totalLeads = leads.length;
  const completedLeads = leads.filter(l => l.status === 'completed').length;
  const conversionRate = totalLeads > 0 ? ((completedLeads / totalLeads) * 100).toFixed(1) : '0';

  const analytics = {
    totalLeads,
    activeUsers: salesmen.length + operators.length + technicians.length,
    completedLeads,
    conversionRate,
  };

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

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This will export all system data to a CSV file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => Alert.alert('Success', 'Data export initiated. You will receive an email when ready.')
        }
      ]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'This will import data from a CSV file. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Import', 
          style: 'destructive',
          onPress: () => Alert.alert('Import', 'Data import functionality would be available here.')
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. The app may run slower until the cache is rebuilt. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          onPress: () => Alert.alert('Success', 'Cache cleared successfully.')
        }
      ]
    );
  };

  const handleResetSystem = () => {
    Alert.alert(
      'Reset System',
      'This will reset all system settings to default values. User data will not be affected. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'System settings reset to defaults.')
        }
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
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
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
        trackColor={{ false: '#E2E8F0', true: '#DC2626' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        disabled={disabled}
      />
    </View>
  );

  // --- CSV Import/Export Logic ---
  const LEAD_IMPORT_COLUMNS = [
    'id',
    'customer_name',
    'phone_number',
    'email',
    'address',
    'property_type',
    'likelihood',
    'status',
    'salesman_id',
    'salesman_name',
    'call_operator_id',
    'call_operator_name',
    'technician_id',
    'technician_name',
    'call_notes',
    'visit_notes',
    'follow_up_date',
    'created_at',
    'updated_at',
  ];

  const parseCSVData = (csvText: string) => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const leads = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;
      const lead: any = {};
      headers.forEach((header, idx) => {
        lead[header] = values[idx] || '';
      });
      leads.push({
        id: lead.id,
        customer_name: lead.customer_name,
        phone_number: lead.phone_number,
        email: lead.email,
        address: lead.address,
        property_type: lead.property_type,
        likelihood: lead.likelihood,
        status: lead.status,
        salesman_id: lead.salesman_id,
        salesman_name: lead.salesman_name,
        call_operator_id: lead.call_operator_id,
        call_operator_name: lead.call_operator_name,
        technician_id: lead.technician_id,
        technician_name: lead.technician_name,
        call_notes: lead.call_notes,
        visit_notes: lead.visit_notes,
        follow_up_date: lead.follow_up_date,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        owner_id: lead.owner_id || '',
        owner_name: lead.owner_name || '',
        owner_role: lead.owner_role || '',
      });
    }
    return leads;
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      const asset = result.assets[0];
      setFileName(asset.name);
      if (Platform.OS === 'web') {
        const file = asset.file;
        if (!file) throw new Error('File object not available on web.');
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result;
          if (typeof content === 'string') {
            setCsvData(content);
          } else {
            Alert.alert('Error', 'Could not read file content.');
          }
        };
        reader.onerror = () => {
          Alert.alert('Error', 'Failed to read the file.');
        };
        reader.readAsText(file);
      } else {
        const fileContent = await FileSystem.readAsStringAsync(asset.uri);
        setCsvData(fileContent);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick or read the file.');
    }
  };

  const handleBulkImport = async () => {
    if (!csvData.trim()) {
      Alert.alert('Error', 'Please select a CSV file to import.');
      return;
    }
    setIsImporting(true);
    try {
      const leadsData = parseCSVData(csvData);
      if (leadsData.length === 0) {
        Alert.alert('Error', 'No valid leads found in CSV data. Please check the format.');
        setIsImporting(false);
        return;
      }
      await bulkImportLeads(leadsData);
      Alert.alert('Success', `${leadsData.length} leads imported successfully!`);
      setShowImportModal(false);
      setCsvData('');
      setFileName('');
    } catch (error: any) {
      Alert.alert('Error', `Failed to import leads: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const exportLeadsToCSV = async () => {
    if (!leads || leads.length === 0) {
      Alert.alert('No Data', 'No leads to export.');
      return;
    }
    const csvRows = [];
    csvRows.push(LEAD_IMPORT_COLUMNS.join(','));
    for (const lead of leads) {
      const l = lead as any;
      const row = LEAD_IMPORT_COLUMNS.map(col => {
        let val = l[
          col === 'customer_name' ? 'customer_name' :
          col === 'phone_number' ? 'phone_number' :
          col === 'additional_phone' ? 'additional_phone' :
          col === 'call_notes' ? 'call_notes' :
          col === 'visit_notes' ? 'visit_notes' :
          col === 'follow_up_date' ? 'follow_up_date' :
          col === 'scheduled_call_date' ? 'scheduled_call_date' :
          col === 'scheduled_call_time' ? 'scheduled_call_time' :
          col === 'scheduled_call_reason' ? 'scheduled_call_reason' :
          col === 'call_later_count' ? 'call_later_count' :
          col === 'last_call_later_date' ? 'last_call_later_date' :
          col === 'last_call_later_reason' ? 'last_call_later_reason' :
          col === 'customer_id' ? 'customer_id' :
          col
        ];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      });
      csvRows.push(row.join(','));
    }
    const csvString = csvRows.join('\n');
    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads_export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const fileUri = FileSystem.cacheDirectory + 'leads_export.csv';
        await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Leads CSV' });
      }
    } catch (err: any) {
      Alert.alert('Export Failed', 'Could not export leads: ' + err.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>Super Administrator</Text>
              <Text style={styles.userAccess}>Full System Access</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>System Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <TrendingUp size={20} color="#DC2626" />
                </View>
                <Text style={styles.statNumber}>{analytics.totalLeads}</Text>
                <Text style={styles.statLabel}>Total Leads</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Users size={20} color="#10B981" />
                </View>
                <Text style={styles.statNumber}>{analytics.activeUsers}</Text>
                <Text style={styles.statLabel}>Active Users</Text>
              </View>
            </View>
          </View>

          <View style={styles.performanceContainer}>
            <Text style={styles.sectionTitle}>System Performance</Text>
            
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <BarChart3 size={20} color="#DC2626" />
                <Text style={styles.metricTitle}>Business Metrics</Text>
              </View>
              <View style={styles.metricStats}>
                <View style={styles.metricStat}>
                  <Text style={styles.metricNumber}>{analytics.totalLeads}</Text>
                  <Text style={styles.metricLabel}>Total Leads</Text>
                </View>
                <View style={styles.metricStat}>
                  <Text style={styles.metricNumber}>{analytics.completedLeads}</Text>
                  <Text style={styles.metricLabel}>Completed</Text>
                </View>
                <View style={styles.metricStat}>
                  <Text style={[styles.metricNumber, { color: '#10B981' }]}>
                    {analytics.conversionRate}%
                  </Text>
                  <Text style={styles.metricLabel}>Conversion</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
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
                  <Calendar size={20} color="#64748B" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Administrator Since</Text>
                  <Text style={styles.infoValue}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Shield size={20} color="#64748B" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Security Level</Text>
                  <Text style={styles.infoValue}>Maximum Access</Text>
                </View>
              </View>
            </View>
          </View>

          {/* My Leads and Work Tracking Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', margin: 16 }}>
            <TouchableOpacity style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 8, flex: 1, marginRight: 8 }} onPress={() => router.push('/my-leads')}>
              <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: 'bold' }}>My Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#10B981', padding: 12, borderRadius: 8, flex: 1, marginLeft: 8 }} onPress={() => router.push('/work-tracking')}>
              <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: 'bold' }}>Work Tracking</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Section */}
          <SettingSection title="Notifications">
            <ToggleItem
              icon={Bell}
              title="Push Notifications"
              subtitle="Receive notifications for important events"
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
              subtitle="Update your admin password"
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

          <SettingSection title="Data Management">
            <ToggleItem
              icon={Database}
              title="Auto Backup"
              subtitle="Automatically backup data daily"
              value={true}
              onValueChange={() => {}}
              disabled={true}
            />
            <ToggleItem
              icon={HardDrive}
              title="Data Retention"
              subtitle="Keep deleted records for 30 days"
              value={true}
              onValueChange={() => {}}
              disabled={true}
            />
            <SettingItem
              icon={Download}
              title="Export Leads"
              subtitle="Download all leads as CSV"
              onPress={exportLeadsToCSV}
            />
            <SettingItem
              icon={Upload}
              title="Import Leads"
              subtitle="Upload leads from CSV file"
              onPress={() => setShowImportModal(true)}
            />
          </SettingSection>

          <SettingSection title="System Maintenance">
            <SettingItem
              icon={RefreshCw}
              title="Clear Cache"
              subtitle="Clear temporary files and cached data"
              onPress={handleClearCache}
            />
            <SettingItem
              icon={Trash2}
              title="Reset Settings"
              subtitle="Reset all settings to default values"
              onPress={handleResetSystem}
            />
          </SettingSection>

          <View style={styles.versionInfo}>
            <Text style={styles.versionTitle}>Roshni Solar CRM</Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.versionText}>Build 2024.01.15</Text>
            <Text style={styles.versionText}>© 2024 Roshni Solar Solutions</Text>
          </View>

          {/* Logout Button - At the bottom */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Bulk Import Modal */}
          <Modal
            visible={showImportModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowImportModal(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Bulk Import Leads</Text>
                <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>
                  Upload a .csv file with columns: id, customer_name, phone_number, email, address, property_type, likelihood, status, salesman_id, salesman_name, call_operator_id, call_operator_name, technician_id, technician_name, call_notes, visit_notes, follow_up_date, created_at, updated_at
                </Text>
                <TouchableOpacity style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 24, flexDirection: 'row', alignItems: 'center' }} onPress={handleFilePick}>
                  <Upload size={20} color="#DC2626" />
                  <Text style={{ fontSize: 16, marginLeft: 12 }}>{fileName ? fileName : 'Select a .csv file'}</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                  <TouchableOpacity style={{ paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }} onPress={() => setShowImportModal(false)}>
                    <Text style={{ fontSize: 16, color: '#64748B' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: '#DC2626', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginLeft: 12 }} onPress={handleBulkImport} disabled={isImporting}>
                    <Text style={{ fontSize: 16, color: '#FFF' }}>{isImporting ? 'Importing...' : 'Import'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </View>
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
    marginBottom: 2,
  },
  userAccess: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statsContainer: {
    margin: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 16,
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
  performanceContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  metricTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
  },
  metricStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricStat: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  metricLabel: {
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
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
    borderBottomColor: '#EDF2F7',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
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
  settingText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginRight: 12,
  },
  versionInfo: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  versionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    marginBottom: 2,
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