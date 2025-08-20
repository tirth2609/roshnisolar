import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  ArrowLeft,
  Activity,
  CheckCircle,
  Target
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { UserRole } from '@/types/auth';

const roleColors = {
  salesman: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  call_operator: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  technician: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  team_lead: { bg: '#F3E8FF', text: '#7C3AED', border: '#8B5CF6' },
  super_admin: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
};

function RoleBadge({ role }: { role: UserRole }) {
  const colors = roleColors[role];
  return (
    <View style={[styles.roleBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.roleText, { color: colors.text }]}>
        {role.replace('_', ' ').charAt(0).toUpperCase() + role.replace('_', ' ').slice(1)}
      </Text>
    </View>
  );
}

function getWorkLabel(role: UserRole) {
  switch (role) {
    case 'salesman':
      return 'Leads';
    case 'call_operator':
      return 'Calls';
    case 'technician':
      return 'Visits';
    case 'team_lead':
      return 'Managed';
    default:
      return 'Work';
  }
}

function getCompletedLabel(role: UserRole) {
  switch (role) {
    case 'salesman':
      return 'Converted';
    case 'call_operator':
    case 'technician':
      return 'Completed';
    case 'team_lead':
      return 'Team Size';
    default:
      return 'Completed';
  }
}

export default function UserDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAllUsers, getUserLeads, getUserWorkStats, getCallLogs, getCallLaterLogsByOperator } = useData();

  const users = getAllUsers();
  const user = useMemo(() => users.find((u: any) => u && u.id != null && String(u.id) === String(id)), [users, id]);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  const [dateInput, setDateInput] = useState(`${yyyy}-${mm}-${dd}`);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const onSearchDate = () => {
    if (!dateInput) return;
    const parts = dateInput.split('-');
    if (parts.length !== 3) {
      Alert.alert('Invalid date', 'Please enter date as YYYY-MM-DD');
      return;
    }
    const [y, m, d] = parts.map((p) => parseInt(p, 10));
    if (!y || !m || !d) {
      Alert.alert('Invalid date', 'Please enter a valid date.');
      return;
    }
    const parsed = new Date(y, m - 1, d);
    if (isNaN(parsed.getTime())) {
      Alert.alert('Invalid date', 'Please enter a valid date.');
      return;
    }
    setSelectedDate(parsed);
  };

  const statsForDate = useMemo(() => {
    if (!user) return null;
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    const userLeads = getUserLeads(user.id);
    const workStats = getUserWorkStats(user.id);

    const leadsCreatedThatDay = userLeads.filter((lead: any) => {
      const leadDate = new Date(lead.created_at);
      return leadDate >= start && leadDate <= end;
    });

    const leadsUpdatedThatDay = userLeads.filter((lead: any) => {
      const leadDate = new Date(lead.updated_at);
      return leadDate >= start && leadDate <= end;
    });

    switch (user.role as UserRole) {
      case 'salesman': {
        const dayLeads = leadsCreatedThatDay.filter((lead: any) => lead.salesman_id === user.id);
        const dayCompleted = dayLeads.filter((lead: any) => lead.status === 'completed');
        const totalLeads = userLeads.filter((lead: any) => lead.salesman_id === user.id);
        const totalCompleted = totalLeads.filter((lead: any) => lead.status === 'completed');
        return {
          periodWork: dayLeads.length,
          periodCompleted: dayCompleted.length,
          totalWork: totalLeads.length,
          totalCompleted: totalCompleted.length,
          conversionRate: totalLeads.length > 0 ? ((totalCompleted.length / totalLeads.length) * 100).toFixed(1) : '0',
          periodConversionRate: dayLeads.length > 0 ? ((dayCompleted.length / dayLeads.length) * 100).toFixed(1) : '0',
        };
      }
      case 'call_operator': {
        const allCallLogs = getCallLogs();
        const operatorCalls = (allCallLogs || []).filter((log: any) => String(log.user_id) === String(user.id));
        const callsInRange = operatorCalls.filter((log: any) => {
          const d = new Date(log.created_at);
          return d >= start && d <= end;
        });

        const operatorCallLater = getCallLaterLogsByOperator(String(user.id)) || [];
        const callLaterInRange = operatorCallLater.filter((log: any) => {
          const d = new Date(log.createdAt);
          return d >= start && d <= end;
        });

        // Work count from calls + call-later
        const periodCalls = callsInRange.length;
        const periodCallLater = callLaterInRange.length;
        const periodWork = periodCalls + periodCallLater;

        // Completed and Day's Rate from leads updated in period
        const periodOperatorLeads = leadsUpdatedThatDay.filter((lead: any) => lead.call_operator_id === user.id);
        const periodCompletedLeads = periodOperatorLeads.filter((lead: any) => lead.status === 'completed');

        const totalCalls = operatorCalls.length;
        const totalCallLater = operatorCallLater.length;
        const totalCompletedCalls = operatorCalls.filter((l: any) => (l.status_at_call || '').toLowerCase() === 'completed').length;

        return {
          periodWork,
          periodCompleted: periodCompletedLeads.length,
          totalWork: totalCalls + totalCallLater,
          totalCompleted: totalCompletedCalls,
          conversionRate: totalCalls > 0 ? ((totalCompletedCalls / totalCalls) * 100).toFixed(1) : '0',
          periodConversionRate: periodOperatorLeads.length > 0 ? ((periodCompletedLeads.length / periodOperatorLeads.length) * 100).toFixed(1) : '0',
        };
      }
      case 'technician': {
        const dayLeads = leadsUpdatedThatDay.filter((lead: any) => lead.technician_id === user.id);
        const dayCompleted = dayLeads.filter((lead: any) => lead.status === 'completed');
        const totalLeads = userLeads.filter((lead: any) => lead.technician_id === user.id);
        const totalCompleted = totalLeads.filter((lead: any) => lead.status === 'completed');
        return {
          periodWork: dayLeads.length,
          periodCompleted: dayCompleted.length,
          totalWork: totalLeads.length,
          totalCompleted: totalCompleted.length,
          conversionRate: totalLeads.length > 0 ? ((totalCompleted.length / totalLeads.length) * 100).toFixed(1) : '0',
          periodConversionRate: dayLeads.length > 0 ? ((dayCompleted.length / dayLeads.length) * 100).toFixed(1) : '0',
        };
      }
      case 'team_lead': {
        const periodManagedLeads = leadsCreatedThatDay.length;
        const totalManagedLeads = userLeads.length;
        const teamMembers = users.filter((u: any) => u.role === 'call_operator' && u.is_active);
        return {
          periodWork: periodManagedLeads,
          periodCompleted: 0,
          totalWork: totalManagedLeads,
          totalCompleted: 0,
          conversionRate: 'N/A',
          periodConversionRate: 'N/A',
          teamMembers: teamMembers.length,
        } as any;
      }
      default:
        return {
          periodWork: 0,
          periodCompleted: 0,
          totalWork: 0,
          totalCompleted: 0,
          conversionRate: '0',
          periodConversionRate: '0',
        };
    }
  }, [user, selectedDate, getUserLeads, getUserWorkStats, users]);

  // Helpers for standard period windows and aggregation
  const getDateRange = (period: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    const start = new Date();
    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return { start, end: now };
  };

  const getStatsForRange = (u: any, start: Date, end: Date) => {
    const userLeads = getUserLeads(u.id);
    const leadsCreated = userLeads.filter((lead: any) => {
      const d = new Date(lead.created_at);
      return d >= start && d <= end;
    });
    const leadsUpdated = userLeads.filter((lead: any) => {
      const d = new Date(lead.updated_at);
      return d >= start && d <= end;
    });

    switch (u.role as UserRole) {
      case 'salesman': {
        const scoped = leadsCreated.filter((lead: any) => lead.salesman_id === u.id);
        const completed = scoped.filter((lead: any) => lead.status === 'completed');
        const total = userLeads.filter((lead: any) => lead.salesman_id === u.id);
        const totalCompleted = total.filter((lead: any) => lead.status === 'completed');
        return {
          periodWork: scoped.length,
          periodCompleted: completed.length,
          periodConversionRate: scoped.length > 0 ? ((completed.length / scoped.length) * 100).toFixed(1) : '0',
          totalWork: total.length,
          totalCompleted: totalCompleted.length,
          conversionRate: total.length > 0 ? ((totalCompleted.length / total.length) * 100).toFixed(1) : '0',
        };
      }
      case 'call_operator': {
        const allCallLogs = getCallLogs();
        const operatorCalls = (allCallLogs || []).filter((log: any) => String(log.user_id) === String(u.id));
        const callsInRange = operatorCalls.filter((log: any) => {
          const d = new Date(log.created_at);
          return d >= start && d <= end;
        });

        const operatorCallLater = getCallLaterLogsByOperator(String(u.id)) || [];
        const callLaterInRange = operatorCallLater.filter((log: any) => {
          const d = new Date(log.createdAt);
          return d >= start && d <= end;
        });

        const periodCalls = callsInRange.length;
        const periodCallLater = callLaterInRange.length;
        const periodWork = periodCalls + periodCallLater;

        const periodCompletedCalls = callsInRange.filter((l: any) => (l.status_at_call || '').toLowerCase() === 'completed').length;

        const totalCalls = operatorCalls.length;
        const totalCallLater = operatorCallLater.length;
        const totalCompletedCalls = operatorCalls.filter((l: any) => (l.status_at_call || '').toLowerCase() === 'completed').length;

        return {
          periodWork,
          periodCompleted: periodCompletedCalls,
          periodConversionRate: periodCalls > 0 ? ((periodCompletedCalls / periodCalls) * 100).toFixed(1) : '0',
          totalWork: totalCalls + totalCallLater,
          totalCompleted: totalCompletedCalls,
          conversionRate: totalCalls > 0 ? ((totalCompletedCalls / totalCalls) * 100).toFixed(1) : '0',
        };
      }
      case 'technician': {
        const scoped = leadsUpdated.filter((lead: any) => lead.technician_id === u.id);
        const completed = scoped.filter((lead: any) => lead.status === 'completed');
        const total = userLeads.filter((lead: any) => lead.technician_id === u.id);
        const totalCompleted = total.filter((lead: any) => lead.status === 'completed');
        return {
          periodWork: scoped.length,
          periodCompleted: completed.length,
          periodConversionRate: scoped.length > 0 ? ((completed.length / scoped.length) * 100).toFixed(1) : '0',
          totalWork: total.length,
          totalCompleted: totalCompleted.length,
          conversionRate: total.length > 0 ? ((totalCompleted.length / total.length) * 100).toFixed(1) : '0',
        };
      }
      case 'team_lead': {
        const scoped = leadsCreated;
        return {
          periodWork: scoped.length,
          periodCompleted: 0,
          periodConversionRate: 'N/A',
          totalWork: userLeads.length,
          totalCompleted: 0,
          conversionRate: 'N/A',
        } as any;
      }
      default:
        return { periodWork: 0, periodCompleted: 0, periodConversionRate: '0', totalWork: 0, totalCompleted: 0, conversionRate: '0' };
    }
  };

  const todayStats = useMemo(() => {
    if (!user) return null;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return getStatsForRange(user, start, end);
  }, [user, getUserLeads]);

  const weekStats = useMemo(() => {
    if (!user) return null;
    const { start, end } = getDateRange('weekly');
    return getStatsForRange(user, start, end);
  }, [user, getUserLeads]);

  const monthStats = useMemo(() => {
    if (!user) return null;
    const { start, end } = getDateRange('monthly');
    return getStatsForRange(user, start, end);
  }, [user, getUserLeads]);

  const previousMonths = useMemo(() => {
    if (!user) return [] as Array<{ key: string; date: Date; stats: any }>;
    const userLeads = getUserLeads(user.id);

    const relevantLeads = userLeads.filter((lead: any) => {
      if ((user.role as UserRole) === 'salesman') return lead.salesman_id === user.id;
      if ((user.role as UserRole) === 'call_operator') return lead.call_operator_id === user.id;
      if ((user.role as UserRole) === 'technician') return lead.technician_id === user.id;
      if ((user.role as UserRole) === 'team_lead') return true;
      return false;
    });

    const buckets = new Map<string, { start: Date; end: Date }>();
    for (const lead of relevantLeads) {
      const d = new Date(((user.role as UserRole) === 'salesman' || (user.role as UserRole) === 'team_lead') ? lead.created_at : lead.updated_at);
      if (isNaN(d.getTime())) continue;
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      if (!buckets.has(ym)) buckets.set(ym, { start, end });
    }

    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const keys = Array.from(buckets.keys()).filter(k => k !== currentYM).sort((a, b) => (a < b ? 1 : -1));

    return keys.map(key => {
      const range = buckets.get(key)!;
      const stats = getStatsForRange(user, range.start, range.end);
      const [y, m] = key.split('-').map(n => parseInt(n, 10));
      return { key, date: new Date(y, m - 1, 1), stats };
    });
  }, [user, getUserLeads]);

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.headerSubtitle}>User not found</Text>
        <TouchableOpacity style={[styles.backBtn, { marginTop: 12 }]} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backIconBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Users size={24} color="#FFFFFF" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>User Details</Text>
            <Text style={styles.headerSubtitle}>{user.name}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Summary</Text>
          <View style={styles.periodStatsGrid}>
            <View style={styles.periodStatCard}>
              <Activity size={20} color="#F59E0B" />
              <Text style={styles.periodStatNumber}>{todayStats?.periodWork || 0}</Text>
              <Text style={styles.periodStatLabel}>Today {getWorkLabel(user.role as UserRole)}</Text>
            </View>
            <View style={styles.periodStatCard}>
              <Activity size={20} color="#F59E0B" />
              <Text style={styles.periodStatNumber}>{weekStats?.periodWork || 0}</Text>
              <Text style={styles.periodStatLabel}>This Week {getWorkLabel(user.role as UserRole)}</Text>
            </View>
            <View style={styles.periodStatCard}>
              <Activity size={20} color="#F59E0B" />
              <Text style={styles.periodStatNumber}>{monthStats?.periodWork || 0}</Text>
              <Text style={styles.periodStatLabel}>This Month {getWorkLabel(user.role as UserRole)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.userHeader}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user.name.split(' ').map((n: string) => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.userMeta}>
              <Text style={styles.userName}>{user.name}</Text>
              <RoleBadge role={user.role as UserRole} />
            </View>
          </View>

          <View style={styles.userContact}>
            <View style={styles.contactRow}>
              <Mail size={16} color="#64748B" />
              <Text style={styles.contactText}>{user.email}</Text>
            </View>
            <View style={styles.contactRow}>
              <Phone size={16} color="#64748B" />
              <Text style={styles.contactText}>{user.phone}</Text>
            </View>
            <View style={styles.contactRow}>
              <Calendar size={16} color="#64748B" />
              <Text style={styles.contactText}>Joined {new Date(user.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Search Work by Date</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={dateInput}
              onChangeText={setDateInput}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={onSearchDate}>
              <Text style={styles.searchBtnText}>Search</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.smallNote}>Showing data for {selectedDate.toLocaleDateString()}</Text>

          {statsForDate && (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Activity size={20} color="#F59E0B" />
                <Text style={styles.statNumber}>{statsForDate.periodWork}</Text>
                <Text style={styles.statLabel}>{getWorkLabel(user.role as UserRole)}</Text>
              </View>
              <View style={styles.statCard}>
                <CheckCircle size={20} color="#10B981" />
                <Text style={styles.statNumber}>{statsForDate.periodCompleted}</Text>
                <Text style={styles.statLabel}>{getCompletedLabel(user.role as UserRole)}</Text>
              </View>
              <View style={styles.statCard}>
                <Target size={20} color="#8B5CF6" />
                <Text style={styles.statNumber}>{String(statsForDate.periodConversionRate)}%</Text>
                <Text style={styles.statLabel}>Day's Rate</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overall Performance</Text>
          {statsForDate && (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Activity size={20} color="#F59E0B" />
                <Text style={styles.statNumber}>{statsForDate.totalWork}</Text>
                <Text style={styles.statLabel}>Total Work</Text>
              </View>
              <View style={styles.statCard}>
                <CheckCircle size={20} color="#10B981" />
                <Text style={styles.statNumber}>{statsForDate.totalCompleted}</Text>
                <Text style={styles.statLabel}>Total Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Target size={20} color="#8B5CF6" />
                <Text style={styles.statNumber}>{String(statsForDate.conversionRate)}%</Text>
                <Text style={styles.statLabel}>Overall Rate</Text>
              </View>
            </View>
          )}
        </View>

        {previousMonths.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Previous Months</Text>
            {previousMonths.map(({ key, date, stats }) => (
              <View key={key} style={styles.monthRow}>
                <Text style={styles.monthTitle}>
                  {date.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                </Text>
                <View style={styles.monthStats}>
                  <View style={styles.monthStatItem}>
                    <Activity size={16} color="#F59E0B" />
                    <Text style={styles.monthStatText}>{stats.periodWork}</Text>
                    <Text style={styles.monthStatLabel}>{getWorkLabel(user.role as UserRole)}</Text>
                  </View>
                  <View style={styles.monthStatItem}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.monthStatText}>{stats.periodCompleted}</Text>
                    <Text style={styles.monthStatLabel}>{getCompletedLabel(user.role as UserRole)}</Text>
                  </View>
                  <View style={styles.monthStatItem}>
                    <Target size={16} color="#8B5CF6" />
                    <Text style={styles.monthStatText}>{String(stats.periodConversionRate)}%</Text>
                    <Text style={styles.monthStatLabel}>Rate</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  userMeta: { flex: 1 },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  userContact: {
    gap: 8,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  searchBtnText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  smallNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  periodStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  periodStatCard: {
    alignItems: 'center',
    flex: 1,
  },
  periodStatNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  periodStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  monthRow: {
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 8,
  },
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  monthStatText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginTop: 4,
    marginBottom: 2,
  },
  monthStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#334155',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});


