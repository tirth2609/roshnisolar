import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Dimensions, Alert,
  RefreshControl, TouchableOpacity, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, LeadStatus } from '@/types/leads';
import {
  Phone, Mail, MapPin, User, CheckCircle, XCircle, Clock, MoreHorizontal
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

const leadStatuses: LeadStatus[] = ['new', 'ringing', 'contacted', 'hold', 'transit', 'declined', 'completed'];

const LeadCard = ({ item }: { item: Lead; }) => {
  const { theme } = useTheme();
  
  const handlePress = () => {
    router.push({
      pathname: `/(call_operator)/lead-info`,
      params: { leadId: item.id }
    });
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface }]} onPress={handlePress}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{item.customer_name}</Text>
      <View style={styles.cardRow}>
        <Phone size={14} color={theme.textSecondary} />
        <Text style={[styles.cardText, { color: theme.textSecondary }]}>{item.phone_number}</Text>
      </View>
      {item.address && (
        <View style={styles.cardRow}>
          <MapPin size={14} color={theme.textSecondary} />
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>{item.address}</Text>
        </View>
      )}
       <View style={styles.cardRow}>
          <User size={14} color={theme.textSecondary} />
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>{item.salesman_name || 'Unassigned'}</Text>
        </View>
    </TouchableOpacity>
  );
};

export default function LeadTrackingBoard({ leads, isLoading }: { leads: Lead[], isLoading: boolean }) {
  const { theme } = useTheme();

  const leadsByStatus = useMemo(() => {
    const grouped: { [key in LeadStatus]?: Lead[] } = {};
    leadStatuses.forEach(status => {
      grouped[status] = leads.filter(l => l.status === status);
    });
    return grouped;
  }, [leads]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{color: theme.text, marginTop: 10}}>Loading Leads...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={{backgroundColor: theme.background}}
    >
      {leadStatuses.map(status => (
        <View key={status} style={styles.statusColumn}>
          <Text style={[styles.statusTitle, {color: theme.text}]}>{status.toUpperCase()} ({leadsByStatus[status]?.length || 0})</Text>
          <ScrollView>
            {(leadsByStatus[status] || []).map(item => (
              <LeadCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusColumn: {
    width: width,
    padding: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardText: {
    marginLeft: 8,
    fontSize: 14,
  },
}); 