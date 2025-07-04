import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Lead, LeadStatus } from '@/types/leads';
import { Phone, ArrowLeft, Info, Edit, Clock } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

const LeadInfoPage = () => {
  const { leadId } = useLocalSearchParams();
  const { leads, getCallLogs, updateLeadStatusWithLog, isLoading, refreshData } = useData();
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

  const handleUpdate = async () => {
    if (!lead) return;
    setIsSubmitting(true);
    try {
      await updateLeadStatusWithLog(lead.id, newStatus, statusNotes);
      Alert.alert('Success', 'Lead updated successfully.');
      setStatusNotes('');
      // Manually refresh data to ensure everything is up to date before going back
      await refreshData();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update lead.');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleCall = (phoneNumber: string) => {
    if (Platform.OS === 'web') {
      Alert.alert('Call Feature', `Would call: ${phoneNumber}\n\nNote: Calling is not available in web preview.`);
    } else {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  // Pagination state for call logs
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 10;
  const sortedLogs = [...getCallLogs(lead?.id)].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);
  const paginatedLogs = sortedLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);

  // Call Later Logs Pagination
  const [callLaterPage, setCallLaterPage] = useState(1);
  const callLaterLogs = useData().getCallLaterLogs(lead?.id || '');
  const sortedCallLaterLogs = [...callLaterLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const callLaterTotalPages = Math.ceil(sortedCallLaterLogs.length / logsPerPage);
  const paginatedCallLaterLogs = sortedCallLaterLogs.slice((callLaterPage - 1) * logsPerPage, callLaterPage * logsPerPage);

  if (isLoading || !lead) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: theme.background}}>
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
                {isSubmitting ? <ActivityIndicator color={theme.textInverse} /> : <Text style={styles.buttonText}>Save Update & Log</Text>}
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
    },
    backButton: {
        marginRight: 16,
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
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
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
    phoneContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    updateCard: {
        backgroundColor: theme.surface,
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
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
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
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
    }
});

export default LeadInfoPage; 