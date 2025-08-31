import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Lead, LeadStatus } from '@/types/leads';
import { Phone, ArrowLeft, Info, Edit, Clock, RotateCw, CheckCircle, XCircle } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

const LeadInfoPage = () => {
  const { leadId } = useLocalSearchParams();
  const { leads, getCallLogs, getCallLaterLogs, updateLeadStatusWithLog, isLoading, refreshData } = useData();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use useMemo to find the lead, preventing re-renders
  const lead = useMemo(() => {
    if (!leadId || leads.length === 0) return null;
    return leads.find(l => l.id === leadId);
  }, [leadId, leads]);

  const [newStatus, setNewStatus] = useState<LeadStatus>(lead?.status || 'contacted');
  const [statusNotes, setStatusNotes] = useState('');

  // Effect to update status when lead data changes
  useEffect(() => {
    if (lead) {
      setNewStatus(lead.status);
    }
  }, [lead]);

  // Effect to handle missing lead
  useEffect(() => {
    if (!isLoading && !lead) {
      Alert.alert('Error', 'Lead not found. It might have been deleted or reassigned.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [isLoading, lead]);

  const handleUpdate = useCallback(async () => {
    if (!lead || isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);
    try {
      await updateLeadStatusWithLog(lead.id, newStatus, statusNotes);
      Alert.alert('Success', 'Lead updated successfully.');
      setStatusNotes('');
      await refreshData();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update lead.');
    } finally {
      setIsSubmitting(false);
    }
  }, [lead, isSubmitting, newStatus, statusNotes, updateLeadStatusWithLog, refreshData, router]);

  const handleCall = useCallback((phoneNumber: string) => {
    if (Platform.OS === 'web') {
      Alert.alert('Call Feature', `Would call: ${phoneNumber}\n\nNote: Calling is not available in web preview.`);
    } else {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  }, []);

  // Use memoization for logs to avoid re-sorting on every render
  const sortedCallLogs = useMemo(() => {
    return [...getCallLogs(lead?.id)].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [lead?.id, getCallLogs]);

  const sortedCallLaterLogs = useMemo(() => {
    return [...getCallLaterLogs(lead?.id || '')].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [lead?.id, getCallLaterLogs]);

  const [logPage, setLogPage] = useState(1);
  const [callLaterPage, setCallLaterPage] = useState(1);
  const logsPerPage = 10;
  
  const totalLogs = sortedCallLogs.length;
  const totalCallLaterLogs = sortedCallLaterLogs.length;
  
  const totalPages = Math.ceil(totalLogs / logsPerPage);
  const callLaterTotalPages = Math.ceil(totalCallLaterLogs / logsPerPage);

  const paginatedLogs = useMemo(() => {
    return sortedCallLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);
  }, [sortedCallLogs, logPage]);

  const paginatedCallLaterLogs = useMemo(() => {
    return sortedCallLaterLogs.slice((callLaterPage - 1) * logsPerPage, callLaterPage * logsPerPage);
  }, [sortedCallLaterLogs, callLaterPage]);

  if (isLoading || !lead) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 10, color: theme.textSecondary }}>Loading lead details...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={isSubmitting}>
          <ArrowLeft size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Lead Info Section */}
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
            <TouchableOpacity style={styles.infoRow} onPress={() => handleCall(lead.phone_number)}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{lead.phone_number}</Text>
              <Phone size={18} color={theme.primary} />
            </TouchableOpacity>
            {lead.additional_phone && (
              <TouchableOpacity style={styles.infoRow} onPress={() => handleCall(lead.additional_phone!)}>
                <Text style={styles.infoLabel}>Extra Phone:</Text>
                <Text style={styles.infoValue}>{lead.additional_phone}</Text>
                <Phone size={18} color={theme.primary} />
              </TouchableOpacity>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue} selectable>{lead.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Status:</Text>
              <Text style={styles.infoValue}>{lead.status}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Likelihood:</Text>
              <Text style={styles.infoValue}>{lead.likelihood}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned on:</Text>
              <Text style={styles.infoValue}>{new Date(lead.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* Status Update Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Edit size={22} color={theme.primary} />
            <Text style={styles.sectionTitle}>Update Status & Log Call</Text>
          </View>
          <View style={styles.updateCard}>
            <Text style={styles.pickerLabel}>New Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newStatus}
                onValueChange={(itemValue: string) => setNewStatus(itemValue as LeadStatus)}
                style={styles.picker}
                enabled={!isSubmitting}
                mode="dropdown"
                dropdownIconColor={theme.textSecondary}
              >
                <Picker.Item label="Ringing" value="ringing" />
                <Picker.Item label="Contacted" value="contacted" />
                <Picker.Item label="Hold" value="hold" />
                <Picker.Item label="Transit" value="transit" />
                <Picker.Item label="Completed" value="completed" />
                <Picker.Item label="Declined" value="declined" />
              </Picker>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Add notes for this call/update..."
              value={statusNotes}
              onChangeText={setStatusNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={theme.textSecondary}
              editable={!isSubmitting}
            />
            <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color={theme.textInverse} />
              ) : (
                <Text style={styles.buttonText}>Save Update & Log</Text>
              )}
            </TouchableOpacity>
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
                <Text style={styles.logText}><Text style={styles.logLabel}>Operator:</Text> {log.caller_name || 'Unknown'}</Text>
                <View style={styles.statusIndicatorRow}>
                  <Text style={styles.logText}><Text style={styles.logLabel}>Status Logged:</Text> {log.status_at_call || 'N/A'}</Text>
                  {log.status_at_call === 'completed' ? <CheckCircle size={18} color="green" /> : <XCircle size={18} color="red" />}
                </View>
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
                style={[styles.paginationButton, logPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => setLogPage(p => Math.max(1, p - 1))}
                disabled={logPage === 1}
              >
                <Text style={styles.paginationButtonText}>Previous</Text>
              </TouchableOpacity>
              <Text style={styles.paginationText}>Page {logPage} of {totalPages}</Text>
              <TouchableOpacity
                style={[styles.paginationButton, logPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => setLogPage(p => Math.min(totalPages, p + 1))}
                disabled={logPage === totalPages}
              >
                <Text style={styles.paginationButtonText}>Next</Text>
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
                <Text style={styles.logText}><Text style={styles.logLabel}>Operator:</Text> {log.call_operator_name || 'Unknown'}</Text>
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
                style={[styles.paginationButton, callLaterPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => setCallLaterPage(p => Math.max(1, p - 1))}
                disabled={callLaterPage === 1}
              >
                <Text style={styles.paginationButtonText}>Previous</Text>
              </TouchableOpacity>
              <Text style={styles.paginationText}>Page {callLaterPage} of {callLaterTotalPages}</Text>
              <TouchableOpacity
                style={[styles.paginationButton, callLaterPage === callLaterTotalPages && styles.paginationButtonDisabled]}
                onPress={() => setCallLaterPage(p => Math.min(callLaterTotalPages, p + 1))}
                disabled={callLaterPage === callLaterTotalPages}
              >
                <Text style={styles.paginationButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  backButton: {
    marginRight: 16,
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
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
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  infoText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: theme.text,
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    color: theme.textSecondary,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  updateCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerLabel: {
    fontSize: 16,
    color: theme.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: theme.background,
    justifyContent: 'center',
  },
  picker: {
    color: theme.text,
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.background,
  },
  button: {
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: theme.primaryLight,
  },
  buttonText: {
    color: theme.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  logText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  logLabel: {
    fontWeight: 'bold',
    color: theme.text,
  },
  noLogsText: {
    color: theme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  paginationButton: {
    backgroundColor: theme.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  paginationButtonDisabled: {
    backgroundColor: theme.primaryLight,
  },
  paginationButtonText: {
    color: theme.textInverse,
    fontWeight: 'bold',
  },
  paginationText: {
    color: theme.text,
    fontSize: 14,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  }
});

export default LeadInfoPage;
