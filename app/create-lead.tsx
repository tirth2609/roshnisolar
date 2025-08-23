import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Image, Dimensions
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NewLeadData, PropertyType, LeadLikelihood } from '../types/leads';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { Plus, MapPin, Phone, User, Building, Home, Briefcase, Factory, TrendingUp, CheckCircle } from 'lucide-react-native';
import { FadeInView, SlideInView, AnimatedCard, PulseView } from '@/components/AnimatedComponents';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Utility to map camelCase to snake_case and normalize nulls
function mapAndNormalizeLead(formData: any) {
  const mapping: Record<string, string> = {
    customerName: 'customer_name',
    phoneNumber: 'phone_number',
    additionalPhone: 'additional_phone',
    email: 'email',
    address: 'address',
    propertyType: 'property_type',
    likelihood: 'likelihood',
    status: 'status',
    callNotes: 'call_notes',
    visitNotes: 'visit_notes',
    followUpDate: 'follow_up_date',
    rescheduledDate: 'rescheduled_date',
    rescheduledBy: 'rescheduled_by',
    rescheduleReason: 'reschedule_reason',
    scheduledCallDate: 'scheduled_call_date',
    scheduledCallTime: 'scheduled_call_time',
    scheduledCallReason: 'scheduled_call_reason',
    customerId: 'customer_id',
    callLaterCount: 'call_later_count',
    lastCallLaterDate: 'last_call_later_date',
    lastCallLaterReason: 'last_call_later_reason',
    // Add more mappings as needed
  };
  const result: Record<string, any> = {};
  for (const key in formData) {
    const snakeKey = mapping[key] || key;
    let value = formData[key];
    if (value === undefined || value === 'NULL') value = null;
    result[snakeKey] = value;
  }
  return result;
}

export default function CreateLeadScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState<Omit<NewLeadData, 'owner_id' | 'owner_name' | 'owner_role'>>({
    customer_name: '',
    phone_number: '',
    address: '',
    property_type: 'residential',
    likelihood: 'warm',
    email: '',
    additional_phone: '',
    call_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (name: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.phone_number || !formData.address) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a lead.');
      return;
    }

    setIsSubmitting(true);
    try {
      // First, check for duplicate leads
      const duplicateCheck = await supabase.functions.invoke('checkDuplicateLead', {
        body: {
          phoneNumber: formData.phone_number,
          customerName: formData.customer_name,
          attemptedBy: {
            id: user.id,
            name: user.name
          },
          attemptedByRole: user.role,
          attemptedLeadData: formData
        }
      });

      if (duplicateCheck.error) {
        throw new Error(duplicateCheck.error.message || 'Failed to check for duplicates');
      }

      const duplicateData = duplicateCheck.data;

      if (duplicateData.isDuplicate) {
        // Show duplicate information and prevent creation
        const existingLead = duplicateData.existingLead;
        Alert.alert(
          'Duplicate Lead Found',
          `A lead with phone number ${formData.phone_number} already exists.\n\n` +
          `Existing Lead Details:\n` +
          `• Customer: ${existingLead.customer_name}\n` +
          `• Status: ${existingLead.status}\n` +
          `• Owner: ${existingLead.owner_name} (${existingLead.owner_role})\n` +
          `• Created: ${new Date(existingLead.created_at).toLocaleDateString()}\n\n` +
          `This duplicate attempt has been logged for review.`,
          [{ text: 'OK' }]
        );
        setIsSubmitting(false);
        return;
      }

      // No duplicates found, proceed with lead creation
      // Assign to the correct column based on role
      let assignment = {};
      if (user.role === 'call_operator') {
        assignment = {
          call_operator_id: user.id,
          call_operator_name: user.name,
        };
      } else if (user.role === 'team_lead') {
        assignment = {
          team_lead_id: user.id,
          team_lead_name: user.name,
        };
      } else if (user.role === 'super_admin') {
        assignment = {
          super_admin_id: user.id,
          super_admin_name: user.name,
        };
      } else {
        assignment = {
          salesman_id: user.id,
          salesman_name: user.name,
        };
      }
      
      // Map and normalize form data
      const newLead = {
        ...mapAndNormalizeLead(formData),
        status: 'new',
        ...assignment,
        created_by: user.id,
        created_by_name: user.name,
      };
      
      const { error } = await supabase.from('leads').insert(newLead);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Lead created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGradientColors = () => {
    return ['#2563EB', '#60A5FA'] as const;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={getGradientColors()} style={styles.header}>
        <FadeInView duration={600}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <PulseView>
                <View style={[styles.logoBackground, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}> 
                  <Image 
                    source={require('../assets/images/icon.png')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </PulseView>
            </View>
            <SlideInView delay={200} duration={600} direction="up">
              <Text style={styles.headerTitle}>Create New Lead</Text>
              <Text style={styles.headerSubtitle}>Enter customer details below</Text>
            </SlideInView>
          </View>
        </FadeInView>
      </LinearGradient>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <FadeInView delay={400} duration={600}>
          <View style={styles.form}>
            {/* Customer Information Section */}
            <SlideInView delay={600} duration={600} direction="up">
              <AnimatedCard index={0} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}> 
                  <User size={20} color={theme.primary} style={{ marginRight: 8 }} />
                  Customer Information
                </Text>
                <View style={styles.inputContainer}>
                  <View style={[styles.inputIconContainer, { backgroundColor: theme.primaryLight }]}> <User size={20} color={theme.primary} /> </View>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                    placeholder="Customer Name *"
                    value={formData.customer_name}
                    onChangeText={val => handleInputChange('customer_name', val)}
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <View style={[styles.inputIconContainer, { backgroundColor: theme.primaryLight }]}> <Phone size={20} color={theme.primary} /> </View>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                    placeholder="Phone Number *"
                    value={formData.phone_number}
                    onChangeText={val => handleInputChange('phone_number', val)}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <View style={[styles.inputIconContainer, { backgroundColor: theme.primaryLight }]}> <Phone size={20} color={theme.primary} /> </View>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                    placeholder="Additional Phone (Optional)"
                    value={formData.additional_phone}
                    onChangeText={val => handleInputChange('additional_phone', val)}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <View style={[styles.inputIconContainer, { backgroundColor: theme.primaryLight }]}> <MapPin size={20} color={theme.primary} /> </View>
                  <TextInput
                    style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                    placeholder="Complete Address *"
                    value={formData.address}
                    onChangeText={val => handleInputChange('address', val)}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </AnimatedCard>
            </SlideInView>
            {/* Property Type Section */}
            <SlideInView delay={800} duration={600} direction="up">
              <AnimatedCard index={1} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}> 
                  <Building size={20} color={theme.primary} style={{ marginRight: 8 }} />
                  Property Type
                </Text>
                <View style={styles.pickerContainer}>
                  {[
                    { value: 'residential', label: 'Residential', icon: '🏠', description: 'Home & Apartment' },
                    { value: 'commercial', label: 'Commercial', icon: '🏢', description: 'Office & Retail' },
                    { value: 'industrial', label: 'Industrial', icon: '🏭', description: 'Factory & Warehouse' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.pickerOption,
                        { borderColor: theme.border, backgroundColor: theme.surface },
                        formData.property_type === option.value && {
                          borderColor: theme.primary,
                          backgroundColor: theme.primaryLight,
                        },
                      ]}
                      onPress={() => handleInputChange('property_type', option.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerEmoji}>{option.icon}</Text>
                      <View style={styles.pickerTextContainer}>
                        <Text style={[styles.pickerText, { color: theme.text }, formData.property_type === option.value && { color: theme.primary }]}>
                          {option.label}
                        </Text>
                        <Text style={[styles.pickerDescription, { color: theme.textSecondary }, formData.property_type === option.value && { color: theme.primary }]}>
                          {option.description}
                        </Text>
                      </View>
                      {formData.property_type === option.value && (
                        <View style={[styles.checkIcon, { backgroundColor: theme.primary }]}> <CheckCircle size={16} color={theme.textInverse} /> </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </AnimatedCard>
            </SlideInView>
            {/* Likelihood Section */}
            <SlideInView delay={1000} duration={600} direction="up">
              <AnimatedCard index={2} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}> 
                  <TrendingUp size={20} color={theme.primary} style={{ marginRight: 8 }} />
                  Likelihood of Installation
                </Text>
                <View style={styles.likelihoodContainer}>
                  {[
                    { value: 'hot', label: 'Hot', description: 'High Priority', color: '#EF4444' },
                    { value: 'warm', label: 'Warm', description: 'Medium Priority', color: '#F97316' },
                    { value: 'cold', label: 'Cold', description: 'Low Priority', color: '#64748B' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.likelihoodOption,
                        { borderColor: theme.border, backgroundColor: theme.surface },
                        formData.likelihood === option.value && {
                          backgroundColor: option.color + '20',
                          borderColor: option.color,
                        },
                      ]}
                      onPress={() => handleInputChange('likelihood', option.value)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.likelihoodDot, { backgroundColor: option.color }, formData.likelihood === option.value && { backgroundColor: option.color }]} />
                      <View style={styles.likelihoodTextContainer}>
                        <Text style={[styles.likelihoodText, { color: theme.text }, formData.likelihood === option.value && { color: option.color }]}>
                          {option.label}
                        </Text>
                        <Text style={[styles.likelihoodDescription, { color: theme.textSecondary }, formData.likelihood === option.value && { color: option.color }]}>
                          {option.description}
                        </Text>
                      </View>
                      {formData.likelihood === option.value && (
                        <View style={[styles.checkIcon, { backgroundColor: option.color }]}> <CheckCircle size={16} color={theme.textInverse} /> </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </AnimatedCard>
            </SlideInView>
            {/* Submit Button */}
            <SlideInView delay={1200} duration={600} direction="up">
              <AnimatedCard index={3} style={styles.submitSection}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: theme.primary },
                    isSubmitting && { opacity: 0.7 }
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Plus size={20} color={theme.textInverse} />
                  <Text style={[styles.submitButtonText, { color: theme.textInverse }]}> {isSubmitting ? 'Submitting...' : 'Submit Lead'} </Text>
                </TouchableOpacity>
              </AnimatedCard>
            </SlideInView>
          </View>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 20,
  },
  logoBackground: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FEF3C7',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    gap: 20,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    gap: 12,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  pickerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  pickerTextContainer: {
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  pickerDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likelihoodContainer: {
    gap: 12,
  },
  likelihoodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  likelihoodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  likelihoodTextContainer: {
    flex: 1,
  },
  likelihoodText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  likelihoodDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  submitSection: {
    padding: 20,
    borderRadius: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
}); 