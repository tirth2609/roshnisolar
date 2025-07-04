import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, Calendar, CheckCircle, PhoneOutgoing, XCircle, Zap } from 'lucide-react-native';
import { Lead } from '@/types/leads';

// Helper function to filter leads by date range
const filterLeadsByDate = (leads: Lead[], period: 'today' | 'week' | 'month' | 'overall') => {
  const now = new Date();
  if (period === 'overall') {
    return leads;
  }
  
  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (period === 'today') {
    // Start date is already set to today 00:00
  } else if (period === 'week') {
    const dayOfWeek = now.getDay(); // Sunday - 0, Monday - 1, etc.
    startDate.setDate(now.getDate() - dayOfWeek);
  } else if (period === 'month') {
    startDate.setDate(1); // Start of the month
  }

  return leads.filter(lead => {
    const leadDate = new Date(lead.updated_at || lead.created_at); // Use updated_at for more accuracy
    return leadDate >= startDate;
  });
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number | string }) => (
    <View style={styles.statCard}>
        {icon}
        <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    </View>
);


export default function OperatorOverviewPage() {
  const { operatorId } = useLocalSearchParams<{ operatorId: string }>();
  const { getAllUsers, leads } = useData();
  const router = useRouter();
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today');

  const operator = getAllUsers().find(u => u.id === operatorId);
  const operatorLeads = leads.filter(l => l.call_operator_id === operatorId);

  if (!operator) {
    return (
      <View style={styles.container}>
        <Text>Operator not found.</Text>
         <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20}}>
          <Text>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getPerformanceStats = (period: 'today' | 'week' | 'month' | 'overall') => {
    const filtered = filterLeadsByDate(operatorLeads, period);
    return {
      total: filtered.length,
      contacted: filtered.filter(l => ['contacted', 'transit', 'completed', 'declined', 'hold'].includes(l.status)).length,
      transit: filtered.filter(l => l.status === 'transit').length,
      completed: filtered.filter(l => l.status === 'completed').length,
      declined: filtered.filter(l => l.status === 'declined').length,
    };
  };

  const selectedPeriodStats = getPerformanceStats(filter);
  const overallStats = getPerformanceStats('overall');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{operator.name}'s Performance</Text>
      </View>

      <View style={styles.pillsContainer}>
        <TouchableOpacity
          style={[styles.pill, filter === 'today' && styles.pillActive]}
          onPress={() => setFilter('today')}
        >
          <Text style={[styles.pillText, filter === 'today' && styles.pillTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pill, filter === 'week' && styles.pillActive]}
          onPress={() => setFilter('week')}
        >
          <Text style={[styles.pillText, filter === 'week' && styles.pillTextActive]}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pill, filter === 'month' && styles.pillActive]}
          onPress={() => setFilter('month')}
        >
          <Text style={[styles.pillText, filter === 'month' && styles.pillTextActive]}>This Month</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance for {filter.charAt(0).toUpperCase() + filter.slice(1)}</Text>
         <View style={styles.statsContainer}>
            <StatCard icon={<Calendar size={24} color="#3B82F6" />} label="Leads Assigned" value={selectedPeriodStats.total} />
            <StatCard icon={<PhoneOutgoing size={24} color="#F59E0B" />} label="Leads Contacted" value={selectedPeriodStats.contacted} />
            <StatCard icon={<Zap size={24} color="#8B5CF6" />} label="Converted to Transit" value={selectedPeriodStats.transit} />
            <StatCard icon={<CheckCircle size={24} color="#10B981" />} label="Leads Completed" value={selectedPeriodStats.completed} />
            <StatCard icon={<XCircle size={24} color="#EF4444" />} label="Leads Declined" value={selectedPeriodStats.declined} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Performance</Text>
        <View style={styles.statsContainer}>
            <StatCard icon={<Calendar size={24} color="#3B82F6" />} label="Total Leads Assigned" value={overallStats.total} />
            <StatCard icon={<PhoneOutgoing size={24} color="#F59E0B" />} label="Total Leads Contacted" value={overallStats.contacted} />
            <StatCard icon={<Zap size={24} color="#8B5CF6" />} label="Total Converted to Transit" value={overallStats.transit} />
            <StatCard icon={<CheckCircle size={24} color="#10B981" />} label="Total Leads Completed" value={overallStats.completed} />
            <StatCard icon={<XCircle size={24} color="#EF4444" />} label="Total Leads Declined" value={overallStats.declined} />
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  pillsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#1E40AF',
  },
  pillText: {
    color: '#1E293B',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsContainer: {
    gap: 12,
  },
  statCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: '#FFF',
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
  },
  statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1E293B',
  },
  statLabel: {
      fontSize: 14,
      color: '#64748B',
  }
}); 