import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
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
  Target,
  Download,
  Search,
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

const leadStatusColors = {
  new: '#3B82F6',
  contacted: '#10B981',
  hold: '#F59E0B',
  transit: '#8B5CF6',
  completed: '#059669',
  declined: '#EF4444',
  ringing: '#FACC15',
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

  const [startDateInput, setStartDateInput] = useState(`${yyyy}-${mm}-${dd}`);
  const [endDateInput, setEndDateInput] = useState(`${yyyy}-${mm}-${dd}`);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const onSearchDateRange = () => {
    if (!user) return;
    const fromParts = startDateInput.split('-');
    const toParts = endDateInput.split('-');
    if (fromParts.length !== 3 || toParts.length !== 3) {
      Alert.alert('Invalid date', 'Please enter date as YYYY-MM-DD');
      return;
    }
    const [fy, fm, fd] = fromParts.map((p) => parseInt(p, 10));
    const [ty, tm, td] = toParts.map((p) => parseInt(p, 10));
    if (!fy || !fm || !fd || !ty || !tm || !td) {
      Alert.alert('Invalid date', 'Please enter a valid date.');
      return;
    }
    const start = new Date(fy, fm - 1, fd);
    start.setHours(0, 0, 0, 0);
    const end = new Date(ty, tm - 1, td);
    end.setHours(23, 59, 59, 999);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      Alert.alert('Invalid date range', 'Please enter a valid date range.');
      return;
    }

    const userLeads = getUserLeads(user.id);
    const leads = userLeads.filter((lead: any) => {
      const leadDate = new Date(lead.created_at);
      return leadDate >= start && leadDate <= end;
    });

    setFilteredLeads(leads);
    setCurrentPage(1); // Reset to first page on new search
  };

  const applyStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page on new filter
  };

  const finalFilteredLeads = useMemo(() => {
    if (selectedStatus === 'All') {
      return filteredLeads;
    }
    return filteredLeads.filter((lead) => lead.status === selectedStatus);
  }, [filteredLeads, selectedStatus]);

  const totalPages = Math.ceil(finalFilteredLeads.length / pageSize);
  const paginatedLeads = finalFilteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statsForDate = useMemo(() => {
    if (!user) return null;
    const start = new Date(startDateInput);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateInput);
    end.setHours(23, 59, 59, 999);

    const userLeads = getUserLeads(user.id);

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

        const periodCalls = callsInRange.length;
        const periodCallLater = callLaterInRange.length;
        const periodWork = periodCalls + periodCallLater;

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
  }, [user, startDateInput, endDateInput, getUserLeads, getUserWorkStats, getCallLogs, getCallLaterLogsByOperator]);

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

  const downloadData = (data: any[], fileName: string) => {
    if (Platform.OS === 'web') {
      if (data.length === 0) {
        Alert.alert('No Data to Download', 'The selected lead list is empty.');
        return;
      }
      const header = Object.keys(data[0]).join(',');
      const csv = data.map((row) => Object.values(row).join(',')).join('\n');
      const csvContent = `${header}\n${csv}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Download Not Supported', 'CSV download is currently only supported on web platforms.');
    }
  };

  const handleDownload = (period: 'day' | 'week' | 'month' | 'custom') => {
    if (!user) {
      Alert.alert('User Not Found', 'Cannot download data for an invalid user.');
      return;
    }

    let dataToDownload: any[] = [];
    let fileName = '';

    if (period === 'custom') {
      dataToDownload = finalFilteredLeads;
      fileName = `leads_custom_${startDateInput}_to_${endDateInput}_${user.name}.csv`;
    } else {
      const datePeriod = period === 'day' ? 'daily' : period === 'week' ? 'weekly' : 'monthly';
      const { start, end } = getDateRange(datePeriod as 'daily' | 'weekly' | 'monthly');
      dataToDownload = getUserLeads(user.id).filter((lead: any) => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= start && leadDate <= end;
      });
      fileName = `leads_${period}_${user.name}.csv`;
    }

    if (dataToDownload.length > 0) {
      downloadData(dataToDownload, fileName);
    } else {
      Alert.alert('No Data', 'There is no data to download for the selected period.');
    }
  };

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
          <Text style={styles.sectionTitle}>User Information</Text>
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
          <Text style={styles.sectionTitle}>Search Leads</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="Start Date (YYYY-MM-DD)"
              value={startDateInput}
              onChangeText={setStartDateInput}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="End Date (YYYY-MM-DD)"
              value={endDateInput}
              onChangeText={setEndDateInput}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={onSearchDateRange}>
              <Search size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {filteredLeads.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Leads Found ({finalFilteredLeads.length})</Text>
            <ScrollView horizontal style={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.statusFilterButton, selectedStatus === 'All' && styles.statusFilterActive]}
                onPress={() => applyStatusFilter('All')}
              >
                <Text style={[styles.statusFilterText, selectedStatus === 'All' && styles.statusFilterTextActive]}>All</Text>
              </TouchableOpacity>
              {Object.keys(leadStatusColors).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusFilterButton, selectedStatus === status && styles.statusFilterActive]}
                  onPress={() => applyStatusFilter(status)}
                >
                  <Text style={[styles.statusFilterText, selectedStatus === status && styles.statusFilterTextActive]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.leadList}>
              {paginatedLeads.map((lead) => (
                <TouchableOpacity
                  key={lead.id}
                  style={styles.leadCard}
                  onPress={() => router.push({ pathname: '/(super_admin)/lead-info', params: { id: lead.id } })}
                >
                  <View style={styles.leadCardContent}>
                    <Text style={styles.leadCardTitle}>{lead.customer_name}</Text>
                    <View style={[styles.leadStatusBadge, { backgroundColor: leadStatusColors[lead.status as keyof typeof leadStatusColors] }]}>
                      <Text style={styles.leadStatusText}>{lead.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.leadCardDetail}>Phone: {lead.phone_number}</Text>
                  <Text style={styles.leadCardDetail}>Created: {new Date(lead.created_at).toLocaleDateString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationDisabled]}
                >
                  <Text style={styles.paginationText}>Previous</Text>
                </TouchableOpacity>
                <Text style={styles.pageNumber}>
                  Page {currentPage} of {totalPages}
                </Text>
                <TouchableOpacity
                  onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={[styles.paginationButton, currentPage === totalPages && styles.paginationDisabled]}
                >
                  <Text style={styles.paginationText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.downloadSection}>
              <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload('custom')}>
                <Download size={16} color="#FFFFFF" />
                <Text style={styles.downloadBtnText}>Download Leads</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Download Analytics</Text>
          <View style={styles.downloadGrid}>
            <TouchableOpacity style={styles.downloadGridBtn} onPress={() => handleDownload('day')}>
              <Text style={styles.downloadGridText}>Today</Text>
              <Download size={20} color="#7C3AED" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.downloadGridBtn} onPress={() => handleDownload('week')}>
              <Text style={styles.downloadGridText}>This Week</Text>
              <Download size={20} color="#7C3AED" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.downloadGridBtn} onPress={() => handleDownload('month')}>
              <Text style={styles.downloadGridText}>This Month</Text>
              <Download size={20} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E2E8F0',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Semi-Bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  userMeta: { flex: 1 },
  userName: {
    fontSize: 20,
    fontFamily: 'Inter-Semi-Bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  userContact: {
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#475569',
    flex: 1,
  },
  periodStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  periodStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodStatNumber: {
    fontSize: 20,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchBtn: {
    padding: 14,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    marginBottom: 16,
  },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  statusFilterActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  statusFilterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#475569',
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
  },
  leadList: {
    marginTop: 12,
  },
  leadCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leadCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leadCardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Semi-Bold',
    color: '#1E293B',
  },
  leadStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leadStatusText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  leadCardDetail: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 4,
  },
  downloadSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
  },
  downloadBtnText: {
    fontSize: 16,
    fontFamily: 'Inter-Semi-Bold',
    color: '#FFFFFF',
  },
  downloadGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  downloadGridBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  downloadGridText: {
    fontSize: 14,
    fontFamily: 'Inter-Semi-Bold',
    color: '#475569',
    marginBottom: 8,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#334155',
    fontFamily: 'Inter-Semi-Bold',
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  paginationText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Semi-Bold',
  },
  pageNumber: {
    fontFamily: 'Inter-Medium',
    color: '#1E293B',
    fontSize: 14,
  },
  paginationDisabled: {
    opacity: 0.5,
  },
});
