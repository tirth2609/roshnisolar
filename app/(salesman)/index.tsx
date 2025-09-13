import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Replaced Factory with Droplet for the new option
import { Plus, MapPin, Phone, User, Building, Home, Briefcase, Droplet, TrendingUp, CheckCircle } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NewLeadData, PropertyType, LeadLikelihood } from '@/types/leads';
import { 
  FadeInView, 
  SlideInView, 
  ScaleInView, 
  AnimatedCard, 
  PulseView,
} from '@/components/AnimatedComponents';

const { width, height } = Dimensions.get('window');

export default function NewLeadScreen() {
  const [formData, setFormData] = useState<NewLeadData>({
    customer_name: '',
    phone_number: '',
    additional_phone: '',
    address: '',
    property_type: 'residential',
    likelihood: 'warm',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { addLead } = useData();
  const { theme } = useTheme();

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.phone_number || !formData.address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await addLead(formData);
      Alert.alert(
        'Success',
        'Lead submitted successfully!',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setFormData({
                customer_name: '',
                phone_number: '',
                additional_phone: '',
                address: '',
                property_type: 'residential',
                likelihood: 'warm',
              });
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGradientColors = () => {
    return ['#FF6B35', '#F97316', '#FB923C'] as const;
  };

  const getLikelihoodColor = (likelihood: LeadLikelihood) => {
    switch (likelihood) {
      case 'hot':
        return '#EF4444';
      case 'warm':
        return '#F97316';
      case 'cold':
        return '#64748B';
      default:
        return '#F97316';
    }
  };

  // Updated function to handle the new 'water_heater' type
  const getPropertyIcon = (property_type: PropertyType) => {
    switch (property_type) {
      case 'residential':
        return <Home size={20} color={theme.primary} />;
      case 'commercial':
        return <Briefcase size={20} color={theme.primary} />;
      case 'water_heater': // Changed from 'industrial'
        return <Droplet size={20} color={theme.primary} />; // Changed icon
      default:
        return <Home size={20} color={theme.primary} />;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={getGradientColors()} style={styles.header}>
        <FadeInView duration={600}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <PulseView>
                <View style={[styles.logoBackground, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                  <Image 
                    source={require('../../assets/images/icon.png')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </PulseView>
            </View>
            <SlideInView delay={200} duration={600} direction="up">
              <Text style={styles.headerTitle}>New Lead</Text>
              <Text style={styles.headerSubtitle}>Collect customer information</Text>
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
                  <View style={[styles.inputIconContainer, { backgroundColor: theme.primaryLight }]}>
                    <User size={20} color={theme.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { 
                      color: theme.text, 
                      borderColor: theme.border,
                      backgroundColor: theme.surface 
                    }]}
                    placeholder="Customer Name *"
                    value={formData.customer_name}
                    onChangeText={(text) => setFormData({ ...formData, customer_name: text })}
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <View style={[styles.inputIconContainer, { backgroundColor: theme.primaryLight }]}>
                    <Phone size={20} color={theme.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { 
                      color: theme.text, 
                      borderColor: theme.border,
                      backgroundColor: theme.surface 
                    }]}
                    placeholder="Phone Number *"
                    value={formData.phone_number}
                    onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <View style={[styles.inputIconContainer, { backgroundColor: theme.primaryLight }]}>
                    <Phone size={20} color={theme.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { 
                      color: theme.text, 
                      borderColor: theme.border,
                      backgroundColor: theme.surface 
                    }]}
                    placeholder="Additional Phone Number (Optional)"
                    value={formData.additional_phone}
                    onChangeText={(text) => setFormData({ ...formData, additional_phone: text })}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <View style={[styles.inputIconContainer, { backgroundColor: theme.primaryLight }]}>
                    <MapPin size={20} color={theme.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, styles.textArea, { 
                      color: theme.text, 
                      borderColor: theme.border,
                      backgroundColor: theme.surface 
                    }]}
                    placeholder="Complete Address *"
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
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
                    // Changed the 'industrial' option to 'water_heater'
                    { value: 'water_heater', label: 'Water Heater', icon: '🚿', description: 'Heating Solutions' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.pickerOption,
                        { 
                          borderColor: theme.border,
                          backgroundColor: theme.surface 
                        },
                        formData.property_type === option.value && {
                          borderColor: theme.primary,
                          backgroundColor: theme.primaryLight,
                        },
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, property_type: option.value as PropertyType })
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerEmoji}>{option.icon}</Text>
                      <View style={styles.pickerTextContainer}>
                        <Text
                          style={[
                            styles.pickerText,
                            { color: theme.text },
                            formData.property_type === option.value && { color: theme.primary },
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text
                          style={[
                            styles.pickerDescription,
                            { color: theme.textSecondary },
                            formData.property_type === option.value && { color: theme.primary },
                          ]}
                        >
                          {option.description}
                        </Text>
                      </View>
                      {formData.property_type === option.value && (
                        <View style={[styles.checkIcon, { backgroundColor: theme.primary }]}>
                          <CheckCircle size={16} color={theme.textInverse} />
                        </View>
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
                        { 
                          borderColor: theme.border,
                          backgroundColor: theme.surface 
                        },
                        formData.likelihood === option.value && {
                          backgroundColor: option.color + '20',
                          borderColor: option.color,
                        },
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, likelihood: option.value as LeadLikelihood })
                      }
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.likelihoodDot,
                          { backgroundColor: option.color },
                          formData.likelihood === option.value && { backgroundColor: option.color },
                        ]}
                      />
                      <View style={styles.likelihoodTextContainer}>
                        <Text
                          style={[
                            styles.likelihoodText,
                            { color: theme.text },
                            formData.likelihood === option.value && { color: option.color },
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text
                          style={[
                            styles.likelihoodDescription,
                            { color: theme.textSecondary },
                            formData.likelihood === option.value && { color: option.color },
                          ]}
                        >
                          {option.description}
                        </Text>
                      </View>
                      {formData.likelihood === option.value && (
                        <View style={[styles.checkIcon, { backgroundColor: option.color }]}>
                          <CheckCircle size={16} color={theme.textInverse} />
                        </View>
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
                  <Text style={[styles.submitButtonText, { color: theme.textInverse }]}>
                    {isSubmitting ? 'Submitting...' : 'Submit Lead'}
                  </Text>
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
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
});