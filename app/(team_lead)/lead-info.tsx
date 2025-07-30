import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Info, ArrowLeft, Phone, Clock, MessageCircle, FileText, X } from 'lucide-react-native';

// Helper function to handle salesman name fallback
const getSalesmanDisplayName = (lead: any) => {
  // Check if salesman_name is null, undefined, or an empty string
  if (!lead.salesman_name || lead.salesman_name.trim() === '') {
    // If salesman_name is not available, return created_by_name
    return lead.created_by_name || '-';
  }
  // Otherwise, return salesman_name
  return lead.salesman_name;
};

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
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  if (leadsLoaded && !lead) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>Lead not found. Please go back and try again.</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButtonLarge, { backgroundColor: theme.primary }]}>
          <Text style={[styles.backButtonText, { color: theme.textInverse }]}>Go Back</Text>
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
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={() => router.push({ pathname: `${routerBase}/lead-info` as any })} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lead Details</Text>
        </View>
        {/* Action Buttons Row */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity onPress={handleCall} style={styles.actionButton}>
            <Phone size={26} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCallLater} style={styles.actionButton}>
            <Clock size={26} color="#F59E0B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleWhatsApp} style={styles.actionButton}>
            <MessageCircle size={26} color="#25D366" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleHistory} style={styles.actionButton}>
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
              </View>
              {lead.additional_phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Extra Phone:</Text>
                  <Text style={styles.infoValue}>{lead.additional_phone}</Text>
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
              {/* === CHANGE IS HERE === */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Salesman:</Text>
                <Text style={styles.infoValue}>{getSalesmanDisplayName(lead)}</Text>
              </View>
              {/* ====================== */}
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
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, logPage === 1 && styles.paginationDisabled]}
                  onPress={() => setLogPage(p => Math.max(1, p - 1))}
                  disabled={logPage === 1}
                >
                  <Text style={styles.paginationText}>Previous</Text>
                </TouchableOpacity>
                <Text style={[styles.paginationText, { color: theme.text }]}>Page {logPage} of {totalPages}</Text>
                <TouchableOpacity
                  style={[styles.paginationButton, logPage === totalPages && styles.paginationDisabled]}
                  onPress={() => setLogPage(p => Math.min(totalPages, p + 1))}
                  disabled={logPage === totalPages}
                >
                  <Text style={styles.paginationText}>Next</Text>
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
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, callLaterPage === 1 && styles.paginationDisabled]}
                  onPress={() => setCallLaterPage(p => Math.max(1, p - 1))}
                  disabled={callLaterPage === 1}
                >
                  <Text style={styles.paginationText}>Previous</Text>
                </TouchableOpacity>
                <Text style={[styles.paginationText, { color: theme.text }]}>Page {callLaterPage} of {callLaterTotalPages}</Text>
                <TouchableOpacity
                  style={[styles.paginationButton, callLaterPage === callLaterTotalPages && styles.paginationDisabled]}
                  onPress={() => setCallLaterPage(p => Math.min(callLaterTotalPages, p + 1))}
                  disabled={callLaterPage === callLaterTotalPages}
                >
                  <Text style={styles.paginationText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
        {/* Call Later Modal */}
        <Modal visible={showCallLaterModal} transparent animationType="slide" onRequestClose={() => setShowCallLaterModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log Call Later</Text>
                <TouchableOpacity onPress={() => setShowCallLaterModal(false)} style={styles.modalCloseButton}>
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLeadName}>Lead: {lead.customer_name}</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="Call Later Date (YYYY-MM-DD)"
                placeholderTextColor={theme.textSecondary}
                value={callLaterDate}
                onChangeText={setCallLaterDate}
              />
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="Reason"
                placeholderTextColor={theme.textSecondary}
                value={callLaterReason}
                onChangeText={setCallLaterReason}
              />
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, height: 100 }]}
                placeholder="Notes (optional)"
                placeholderTextColor={theme.textSecondary}
                multiline
                value={callLaterNotes}
                onChangeText={setCallLaterNotes}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={handleCallLaterLog} style={[styles.modalActionButton, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.modalActionButtonText, { color: theme.textInverse }]}>Log Call Later</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Logs Modal */}
        <Modal visible={showLogsModal} transparent animationType="slide" onRequestClose={() => setShowLogsModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '80%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Logs for {lead.customer_name}</Text>
                <TouchableOpacity onPress={() => setShowLogsModal(false)} style={styles.modalCloseButton}>
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flex: 1 }}>
                {logs.length === 0 ? (
                  <Text style={styles.noLogsText}>No logs found.</Text>
                ) : (
                  logs.map((log, idx) => (
                    <View key={idx} style={[styles.logCard, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
                      <Text style={[styles.logText, { fontWeight: 'bold' }]}>{log.type === 'call' ? 'Call Log' : 'Call Later'}</Text>
                      <Text style={styles.logText}><Text style={styles.logLabel}>Date:</Text> {'created_at' in log ? new Date(log.created_at).toLocaleString() : new Date(log.call_later_date).toLocaleString()}</Text>
                      <Text style={styles.logText}><Text style={styles.logLabel}>By:</Text> {log.user_name || log.call_operator_name || 'Unknown'}</Text>
                      <Text style={styles.logText}><Text style={styles.logLabel}>Notes:</Text> {log.notes || log.reason || 'N/A'}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity onPress={() => setShowLogsModal(false)} style={[styles.modalActionButton, { marginTop: 16 }]}>
                <Text style={styles.modalActionButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    )
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    // fontFamily: 'Inter-Medium',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButtonLarge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    // fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  // Re-used shadow style for cards and buttons
  shadow: {
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 22,
    // fontFamily: 'Inter-Bold',
    fontWeight: 'bold',
    color: theme.text,
  },
  contentContainer: {
    padding: 20,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.surface,
    ...getStyles(theme).shadow, // Apply shadow here
    marginBottom: 20,
    marginHorizontal: 20,
    borderRadius: 16,
  },
  actionButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    // fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginLeft: 12,
    color: theme.text,
  },
  infoCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    ...getStyles(theme).shadow,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
    paddingBottom: 12,
  },
  infoLabel: {
    // fontFamily: 'Inter-Medium',
    fontWeight: '500',
    color: theme.textSecondary,
    fontSize: 15,
    minWidth: 120,
  },
  infoValue: {
    // fontFamily: 'Inter-Regular',
    fontWeight: 'normal',
    color: theme.text,
    fontSize: 15,
    flex: 1,
    textAlign: 'right', // Align values to the right for a clean look
  },
  logCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...getStyles(theme).shadow,
  },
  logText: {
    // fontFamily: 'Inter-Regular',
    fontWeight: 'normal',
    color: theme.text,
    fontSize: 14,
    lineHeight: 22,
  },
  logLabel: {
    // fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: theme.textSecondary,
    fontSize: 14,
  },
  noLogsText: {
    // fontFamily: 'Inter-Regular',
    fontWeight: 'normal',
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  paginationButton: {
    marginHorizontal: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: theme.primary,
    borderRadius: 8,
  },
  paginationText: {
    color: theme.textInverse,
    // fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  paginationDisabled: {
    opacity: 0.4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.background,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    ...getStyles(theme).shadow,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    // fontFamily: 'Inter-Bold',
    fontWeight: 'bold',
    color: theme.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalLeadName: {
    fontSize: 16,
    // fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 16,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    // fontFamily: 'Inter-Regular',
    fontWeight: 'normal',
    marginBottom: 16,
  },
  modalActions: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  modalActionButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: theme.primary,
    ...getStyles(theme).shadow,
  },
  modalActionButtonText: {
    fontSize: 16,
    // fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: theme.textInverse,
    textAlign: 'center',
  },
});

export default SuperAdminLeadInfo;