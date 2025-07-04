import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Info, ArrowLeft, Phone, Clock, MessageCircle, FileText } from 'lucide-react-native';

const SuperAdminLeadInfo = ({ routerBase = '/(super_admin)' }) => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { leads, isLoading, getCallLogs, getCallLaterLogs } = useData();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Defensive: id may be string | string[] | undefined
  const leadId = Array.isArray(id) ? id[0] : id;
  const leadsLoaded = !isLoading && leads.length > 0;
  const lead = useMemo(() => {
    if (!leadId || leads.length === 0) return null;
    return leads.find(l => String(l.id) === String(leadId));
  }, [leadId, leads]);

  // Call Logs Pagination
  const [logPage, setLogPage] = React.useState(1);
  const logsPerPage = 10;
  const sortedLogs = React.useMemo(() => lead ? [...getCallLogs(lead.id)].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [], [lead, getCallLogs]);
  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);
  const paginatedLogs = sortedLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);

  // Call Later Logs Pagination
  const [callLaterPage, setCallLaterPage] = React.useState(1);
  const callLaterLogs = lead ? getCallLaterLogs(lead.id) : [];
  const sortedCallLaterLogs = React.useMemo(() => [...callLaterLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [callLaterLogs]);
  const callLaterTotalPages = Math.ceil(sortedCallLaterLogs.length / logsPerPage);
  const paginatedCallLaterLogs = sortedCallLaterLogs.slice((callLaterPage - 1) * logsPerPage, callLaterPage * logsPerPage);

  // Modal state for Call Later and History
  const [showCallLaterModal, setShowCallLaterModal] = React.useState(false);
  const [showLogsModal, setShowLogsModal] = React.useState(false);
  const [callLaterDate, setCallLaterDate] = React.useState('');
  const [callLaterReason, setCallLaterReason] = React.useState('');
  const [callLaterNotes, setCallLaterNotes] = React.useState('');
  const [logs, setLogs] = React.useState<any[]>([]);

  // Helper to get the date for any log type
  function getLogDate(log: any) {
    return log.created_at || log.call_later_date || log.createdAt || '';
  }

  if (isLoading || leads.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  if (leadsLoaded && !lead) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <Text style={{ color: theme.error, marginTop: 16, fontSize: 16 }}>Lead not found. Please go back and try again.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, padding: 12, backgroundColor: theme.primary, borderRadius: 8 }}>
          <Text style={{ color: theme.textInverse }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Action handlers
  const handleCall = () => lead && Linking.openURL(`tel:${lead.phone_number}`);
  const handleWhatsApp = () => lead && Linking.openURL(`https://wa.me/${lead.phone_number.replace(/\D/g, '')}`);
  const handleCallLater = () => setShowCallLaterModal(true);
  const handleHistory = async () => {
    if (!lead) return;
    // Fetch logs for this lead
    const callLogs = getCallLogs(lead.id) || [];
    const callLaterLogs = getCallLaterLogs(lead.id) || [];
    setLogs([...callLogs, ...callLaterLogs].sort((a, b) => getLogDate(b).localeCompare(getLogDate(a))));
    setShowLogsModal(true);
  };

  // Call Later log submission
  const handleCallLaterLog = async () => {
    if (!callLaterDate || !callLaterReason) {
      Alert.alert('Error', 'Please enter date and reason.');
      return;
    }
    // You may want to get user info from context if needed
    // For now, just close modal and show success
    setShowCallLaterModal(false);
    Alert.alert('Success', 'Call later logged!');
  };

  return (
    lead && (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push({ pathname: `${routerBase}/lead-info` as any })} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lead Details</Text>
        </View>
        {/* Action Buttons Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 12, gap: 24 }}>
          <TouchableOpacity onPress={handleCall}>
            <Phone size={26} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCallLater}>
            <Clock size={26} color="#F59E0B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleWhatsApp}>
            <MessageCircle size={26} color="#25D366" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleHistory}>
            <FileText size={26} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Info size={22} color={theme.primary} />
              <Text style={styles.sectionTitle}>Customer Information</Text>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{lead.customer_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{lead.phone_number}</Text>
                <Phone size={18} color={theme.primary} />
              </View>
              {lead.additional_phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Extra Phone:</Text>
                  <Text style={styles.infoValue}>{lead.additional_phone}</Text>
                  <Phone size={18} color={theme.primary} />
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue} selectable>{lead.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>{lead.status}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Likelihood:</Text>
                <Text style={styles.infoValue}>{lead.likelihood}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Salesman:</Text>
                <Text style={styles.infoValue}>{lead.salesman_name || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Call Operator:</Text>
                <Text style={styles.infoValue}>{lead.call_operator_name || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Technician:</Text>
                <Text style={styles.infoValue}>{lead.technician_name || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created At:</Text>
                <Text style={styles.infoValue}>{lead.created_at ? new Date(lead.created_at).toLocaleString() : '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Updated At:</Text>
                <Text style={styles.infoValue}>{lead.updated_at ? new Date(lead.updated_at).toLocaleString() : '-'}</Text>
              </View>
            </View>
          </View>
          {/* Call Logs Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={22} color={theme.primary} />
              <Text style={styles.sectionTitle}>Call History</Text>
            </View>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map(log => (
                <View key={log.id} style={styles.logCard}>
                  <Text style={styles.logText}><Text style={styles.logLabel}>Date:</Text> {new Date(log.created_at).toLocaleString()}</Text>
                  <Text style={styles.logText}><Text style={styles.logLabel}>Operator:</Text> {log.caller_name || log.user_id || 'Unknown'}</Text>
                  <Text style={styles.logText}><Text style={styles.logLabel}>Status Logged:</Text> {log.status_at_call || 'N/A'}</Text>
                  <Text style={styles.logText}><Text style={styles.logLabel}>Notes:</Text> {log.notes || 'N/A'}</Text>
                </View>
              ))
            ) : (
              <View style={styles.logCard}>
                <Text style={styles.noLogsText}>No call logs found for this lead.</Text>
              </View>
            )}
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
                <TouchableOpacity
                  style={{ marginHorizontal: 8, padding: 8, backgroundColor: theme.primary, borderRadius: 6, opacity: logPage === 1 ? 0.5 : 1 }}
                  onPress={() => setLogPage(p => Math.max(1, p - 1))}
                  disabled={logPage === 1}
                >
                  <Text style={{ color: theme.textInverse }}>Previous</Text>
                </TouchableOpacity>
                <Text style={{ color: theme.text, marginHorizontal: 8 }}>Page {logPage} of {totalPages}</Text>
                <TouchableOpacity
                  style={{ marginHorizontal: 8, padding: 8, backgroundColor: theme.primary, borderRadius: 6, opacity: logPage === totalPages ? 0.5 : 1 }}
                  onPress={() => setLogPage(p => Math.min(totalPages, p + 1))}
                  disabled={logPage === totalPages}
                >
                  <Text style={{ color: theme.textInverse }}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {/* Call Later Logs Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={22} color={theme.primary} />
              <Text style={styles.sectionTitle}>Call Later History</Text>
            </View>
            {paginatedCallLaterLogs.length > 0 ? (
              paginatedCallLaterLogs.map(log => (
                <View key={log.id} style={styles.logCard}>
                  <Text style={styles.logText}><Text style={styles.logLabel}>Date:</Text> {new Date(log.call_later_date || log.createdAt).toLocaleDateString()}</Text>
                  <Text style={styles.logText}><Text style={styles.logLabel}>Time:</Text> {new Date(log.call_later_date || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={styles.logText}><Text style={styles.logLabel}>Operator:</Text> {log.call_operator_name || log.call_operator_id || 'Unknown'}</Text>
                  <Text style={styles.logText}><Text style={styles.logLabel}>Reason:</Text> {log.reason || 'N/A'}</Text>
                </View>
              ))
            ) : (
              <View style={styles.logCard}>
                <Text style={styles.noLogsText}>No call later logs found for this lead.</Text>
              </View>
            )}
            {/* Pagination Controls */}
            {callLaterTotalPages > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
                <TouchableOpacity
                  style={{ marginHorizontal: 8, padding: 8, backgroundColor: theme.primary, borderRadius: 6, opacity: callLaterPage === 1 ? 0.5 : 1 }}
                  onPress={() => setCallLaterPage(p => Math.max(1, p - 1))}
                  disabled={callLaterPage === 1}
                >
                  <Text style={{ color: theme.textInverse }}>Previous</Text>
                </TouchableOpacity>
                <Text style={{ color: theme.text, marginHorizontal: 8 }}>Page {callLaterPage} of {callLaterTotalPages}</Text>
                <TouchableOpacity
                  style={{ marginHorizontal: 8, padding: 8, backgroundColor: theme.primary, borderRadius: 6, opacity: callLaterPage === callLaterTotalPages ? 0.5 : 1 }}
                  onPress={() => setCallLaterPage(p => Math.min(callLaterTotalPages, p + 1))}
                  disabled={callLaterPage === callLaterTotalPages}
                >
                  <Text style={{ color: theme.textInverse }}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
        {/* Call Later Modal */}
        <Modal visible={showCallLaterModal} transparent animationType="slide" onRequestClose={() => setShowCallLaterModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 24, width: 320 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Log Call Later</Text>
              <Text>Lead: {lead.customer_name}</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, marginVertical: 8, padding: 8 }}
                placeholder="Call Later Date (YYYY-MM-DD)"
                value={callLaterDate}
                onChangeText={setCallLaterDate}
              />
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, marginVertical: 8, padding: 8 }}
                placeholder="Reason"
                value={callLaterReason}
                onChangeText={setCallLaterReason}
              />
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, marginVertical: 8, padding: 8 }}
                placeholder="Notes (optional)"
                value={callLaterNotes}
                onChangeText={setCallLaterNotes}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity onPress={() => setShowCallLaterModal(false)} style={{ padding: 10 }}><Text>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleCallLaterLog} style={{ padding: 10, backgroundColor: '#F59E0B', borderRadius: 6 }}><Text style={{ color: '#FFF' }}>Log</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Logs Modal */}
        <Modal visible={showLogsModal} transparent animationType="slide" onRequestClose={() => setShowLogsModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 24, width: 340, maxHeight: 500 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Logs for {lead.customer_name}</Text>
              <ScrollView style={{ maxHeight: 350 }}>
                {logs.length === 0 ? (
                  <Text>No logs found.</Text>
                ) : (
                  logs.map((log, idx) => (
                    <View key={idx} style={{ marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 8 }}>
                      <Text style={{ fontWeight: 'bold' }}>{log.type === 'call' ? 'Call Log' : 'Call Later'}</Text>
                      <Text>Date: {'created_at' in log ? log.created_at : log.call_later_date}</Text>
                      <Text>By: {log.user_name || log.call_operator_name}</Text>
                      <Text>Notes: {log.notes || log.reason}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity onPress={() => setShowLogsModal(false)} style={{ marginTop: 16, alignSelf: 'center' }}>
                <Text style={{ color: '#3B82F6' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    )
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.text,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
    color: theme.text,
  },
  infoCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontFamily: 'Inter-Medium',
    color: theme.textSecondary,
    width: 110,
    fontSize: 14,
  },
  infoValue: {
    fontFamily: 'Inter-Regular',
    color: theme.text,
    fontSize: 14,
    flex: 1,
  },
  logCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  logText: {
    fontFamily: 'Inter-Regular',
    color: theme.text,
    fontSize: 14,
  },
  logLabel: {
    fontFamily: 'Inter-Medium',
    color: theme.textSecondary,
    fontSize: 14,
  },
  noLogsText: {
    fontFamily: 'Inter-Regular',
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SuperAdminLeadInfo; 