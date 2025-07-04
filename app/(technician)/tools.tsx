import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wrench, Calculator, Camera, FileText, Zap, Sun, Battery, Gauge, MapPin, Clock, CheckCircle, Plus, Phone, Shield, Thermometer, Activity, Settings, Download, Upload } from 'lucide-react-native';

export default function TechnicianToolsScreen() {
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showSystemMonitor, setShowSystemMonitor] = useState(false);
  
  // Calculator states
  const [systemSize, setSystemSize] = useState('');
  const [panelCount, setPanelCount] = useState('');
  const [panelWattage, setPanelWattage] = useState('400');
  const [roofArea, setRoofArea] = useState('');
  const [electricityRate, setElectricityRate] = useState('8');
  
  // Report states
  const [reportTitle, setReportTitle] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [installationType, setInstallationType] = useState('residential');

  const calculateEstimate = () => {
    const size = parseFloat(systemSize);
    const panels = parseInt(panelCount);
    const wattage = parseFloat(panelWattage);
    const area = parseFloat(roofArea);
    const rate = parseFloat(electricityRate);
    
    if (isNaN(size) || isNaN(panels) || isNaN(wattage)) {
      Alert.alert('Error', 'Please enter valid numbers for system size, panel count, and wattage');
      return;
    }

    // Calculations
    const totalWattage = panels * wattage;
    const estimatedCost = size * 50000; // ₹50,000 per kW
    const monthlyGeneration = size * 120; // kWh per month (assuming 4 hours daily)
    const monthlySavings = monthlyGeneration * rate;
    const annualSavings = monthlySavings * 12;
    const paybackPeriod = (estimatedCost / annualSavings).toFixed(1);
    const co2Reduction = (monthlyGeneration * 0.82 * 12).toFixed(0); // kg CO2 per year

    Alert.alert(
      'Solar System Calculation Results',
      `System Details:
• System Size: ${size} kW
• Panels: ${panels} × ${wattage}W
• Total Capacity: ${(totalWattage/1000).toFixed(1)} kW
${area ? `• Roof Area Used: ${area} sq.ft` : ''}

Financial Analysis:
• Estimated Cost: ₹${estimatedCost.toLocaleString()}
• Monthly Generation: ${monthlyGeneration} kWh
• Monthly Savings: ₹${monthlySavings.toFixed(0)}
• Annual Savings: ₹${annualSavings.toFixed(0)}
• Payback Period: ${paybackPeriod} years

Environmental Impact:
• CO₂ Reduction: ${co2Reduction} kg/year`,
      [{ text: 'OK' }]
    );
  };

  const handlePhotoCapture = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Camera Tool',
        'Camera functionality for installation documentation:\n\n• Site survey photos\n• Progress documentation\n• Before/after comparisons\n• Equipment verification\n\nNote: Camera is not available in web preview.',
        [{ text: 'OK' }]
      );
    } else {
      // In a real app, this would open the camera
      Alert.alert('Camera', 'Opening camera for installation documentation...');
    }
  };

  const handleCreateReport = () => {
    if (!reportTitle.trim() || !customerName.trim()) {
      Alert.alert('Error', 'Please enter report title and customer name');
      return;
    }

    const reportData = {
      title: reportTitle,
      customer: customerName,
      type: installationType,
      notes: reportNotes,
      date: new Date().toLocaleDateString(),
      technician: 'Mike Tech' // In real app, get from auth context
    };

    Alert.alert(
      'Installation Report Created',
      `Report Details:
• Title: ${reportData.title}
• Customer: ${reportData.customer}
• Type: ${reportData.type}
• Date: ${reportData.date}
• Technician: ${reportData.technician}

${reportData.notes ? `Notes: ${reportData.notes}` : ''}

Report has been saved and will be synced to the central system.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setShowReportModal(false);
            setReportTitle('');
            setReportNotes('');
            setCustomerName('');
          }
        }
      ]
    );
  };

  const showWeatherInfo = () => {
    setShowWeatherModal(true);
  };

  const showSystemMonitorInfo = () => {
    setShowSystemMonitor(true);
  };

  const tools = [
    {
      id: 1,
      title: 'Solar Calculator',
      description: 'Calculate system size, cost estimates, and ROI',
      icon: Calculator,
      color: '#F59E0B',
      action: () => setShowCalculator(true)
    },
    {
      id: 2,
      title: 'Site Documentation',
      description: 'Capture installation progress and site photos',
      icon: Camera,
      color: '#3B82F6',
      action: handlePhotoCapture
    },
    {
      id: 3,
      title: 'Installation Report',
      description: 'Create detailed installation and service reports',
      icon: FileText,
      color: '#10B981',
      action: () => setShowReportModal(true)
    },
    {
      id: 4,
      title: 'System Monitor',
      description: 'Check system performance and diagnostics',
      icon: Gauge,
      color: '#8B5CF6',
      action: showSystemMonitorInfo
    },
    {
      id: 5,
      title: 'Weather Conditions',
      description: 'Current weather and solar irradiance data',
      icon: Sun,
      color: '#F97316',
      action: showWeatherInfo
    },
    {
      id: 6,
      title: 'Battery Diagnostics',
      description: 'Test battery health, capacity, and performance',
      icon: Battery,
      color: '#059669',
      action: () => Alert.alert(
        'Battery Diagnostics Tool',
        'Battery Testing Features:\n\n• Capacity testing\n• Voltage monitoring\n• Charge/discharge cycles\n• Health assessment\n• Temperature monitoring\n• Performance analytics\n\nConnect diagnostic equipment to begin testing.',
        [{ text: 'OK' }]
      )
    }
  ];

  const quickActions = [
    { 
      title: 'Emergency Contact', 
      icon: Phone, 
      color: '#EF4444',
      action: () => Alert.alert('Emergency Contacts', 'Emergency Support: +91-9999-SOLAR\nTechnical Help: +91-8888-TECH\nSafety Hotline: +91-7777-SAFE')
    },
    { 
      title: 'Safety Checklist', 
      icon: Shield, 
      color: '#10B981',
      action: () => Alert.alert(
        'Safety Checklist',
        '✓ PPE equipment worn\n✓ Main breaker turned off\n✓ Tools inspected\n✓ Work area secured\n✓ Weather conditions checked\n✓ Emergency contacts available\n✓ First aid kit accessible'
      )
    },
    { 
      title: 'GPS Location', 
      icon: MapPin, 
      color: '#3B82F6',
      action: () => Alert.alert('GPS Location', 'Current Location:\nLat: 12.9716° N\nLng: 77.5946° E\nBangalore, Karnataka\n\nLocation logged for service record.')
    },
    { 
      title: 'Work Timer', 
      icon: Clock, 
      color: '#F59E0B',
      action: () => Alert.alert('Work Timer', 'Timer Features:\n\n• Start/Stop work sessions\n• Track installation time\n• Log break periods\n• Generate time reports\n• Productivity analytics')
    }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#059669', '#10B981']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Wrench size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Professional Tools</Text>
            <Text style={styles.headerSubtitle}>Complete technician toolkit</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.quickAction} onPress={action.action}>
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <action.icon size={20} color={action.color} />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Tools</Text>
          <View style={styles.toolsGrid}>
            {tools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={styles.toolCard}
                onPress={tool.action}
              >
                <View style={[styles.toolIcon, { backgroundColor: `${tool.color}20` }]}>
                  <tool.icon size={24} color={tool.color} />
                </View>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Safety Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Guidelines</Text>
          <View style={styles.safetyCard}>
            <View style={styles.safetyHeader}>
              <Zap size={20} color="#EF4444" />
              <Text style={styles.safetyTitle}>Electrical Safety</Text>
            </View>
            <View style={styles.safetyList}>
              <Text style={styles.safetyItem}>• Always turn off main breaker before work</Text>
              <Text style={styles.safetyItem}>• Use proper PPE and insulated tools</Text>
              <Text style={styles.safetyItem}>• Test circuits before touching</Text>
              <Text style={styles.safetyItem}>• Follow lockout/tagout procedures</Text>
              <Text style={styles.safetyItem}>• Check weather conditions before rooftop work</Text>
              <Text style={styles.safetyItem}>• Maintain three points of contact on ladders</Text>
            </View>
          </View>
        </View>

        {/* Installation Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Installation Best Practices</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <Sun size={16} color="#F59E0B" />
              <Text style={styles.tipText}>Optimal panel angle: 30-35° for maximum efficiency in India</Text>
            </View>
            <View style={styles.tipCard}>
              <MapPin size={16} color="#3B82F6" />
              <Text style={styles.tipText}>Ensure south-facing orientation when possible for best performance</Text>
            </View>
            <View style={styles.tipCard}>
              <Battery size={16} color="#10B981" />
              <Text style={styles.tipText}>Leave 20% battery capacity margin for longevity and performance</Text>
            </View>
            <View style={styles.tipCard}>
              <Thermometer size={16} color="#EF4444" />
              <Text style={styles.tipText}>Allow proper ventilation to prevent overheating of components</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Solar Calculator Modal */}
      <Modal
        visible={showCalculator}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalculator(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Advanced Solar Calculator</Text>
            
            <ScrollView style={styles.calculatorForm}>
              <Text style={styles.inputLabel}>System Size (kW) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 5.5"
                value={systemSize}
                onChangeText={setSystemSize}
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Number of Panels *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 20"
                value={panelCount}
                onChangeText={setPanelCount}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Panel Wattage (W)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 400"
                value={panelWattage}
                onChangeText={setPanelWattage}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Available Roof Area (sq.ft)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 800"
                value={roofArea}
                onChangeText={setRoofArea}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Electricity Rate (₹/kWh)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 8"
                value={electricityRate}
                onChangeText={setElectricityRate}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCalculator(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calculateButton}
                onPress={calculateEstimate}
              >
                <Text style={styles.calculateButtonText}>Calculate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enhanced Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Installation Report</Text>
            
            <ScrollView style={styles.reportForm}>
              <Text style={styles.inputLabel}>Customer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter customer name"
                value={customerName}
                onChangeText={setCustomerName}
              />

              <Text style={styles.inputLabel}>Report Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 5kW Residential Installation"
                value={reportTitle}
                onChangeText={setReportTitle}
              />

              <Text style={styles.inputLabel}>Installation Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeOption, installationType === 'residential' && styles.typeOptionSelected]}
                  onPress={() => setInstallationType('residential')}
                >
                  <Text style={[styles.typeOptionText, installationType === 'residential' && styles.typeOptionTextSelected]}>
                    Residential
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeOption, installationType === 'commercial' && styles.typeOptionSelected]}
                  onPress={() => setInstallationType('commercial')}
                >
                  <Text style={[styles.typeOptionText, installationType === 'commercial' && styles.typeOptionTextSelected]}>
                    Commercial
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.inputLabel}>Installation Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add installation details, challenges, recommendations, and system specifications..."
                value={reportNotes}
                onChangeText={setReportNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateReport}
              >
                <Text style={styles.createButtonText}>Create Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Weather Information Modal */}
      <Modal
        visible={showWeatherModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWeatherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.weatherModal}>
            <Text style={styles.modalTitle}>Weather & Solar Conditions</Text>
            
            <View style={styles.weatherGrid}>
              <View style={styles.weatherCard}>
                <Sun size={24} color="#F59E0B" />
                <Text style={styles.weatherValue}>28°C</Text>
                <Text style={styles.weatherLabel}>Temperature</Text>
              </View>
              <View style={styles.weatherCard}>
                <Activity size={24} color="#10B981" />
                <Text style={styles.weatherValue}>850 W/m²</Text>
                <Text style={styles.weatherLabel}>Solar Irradiance</Text>
              </View>
              <View style={styles.weatherCard}>
                <Gauge size={24} color="#3B82F6" />
                <Text style={styles.weatherValue}>65%</Text>
                <Text style={styles.weatherLabel}>Humidity</Text>
              </View>
              <View style={styles.weatherCard}>
                <MapPin size={24} color="#8B5CF6" />
                <Text style={styles.weatherValue}>5 km/h</Text>
                <Text style={styles.weatherLabel}>Wind Speed</Text>
              </View>
            </View>

            <View style={styles.weatherStatus}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.weatherStatusText}>Excellent conditions for solar installation</Text>
            </View>

            <TouchableOpacity
              style={styles.weatherCloseButton}
              onPress={() => setShowWeatherModal(false)}
            >
              <Text style={styles.weatherCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* System Monitor Modal */}
      <Modal
        visible={showSystemMonitor}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSystemMonitor(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.systemModal}>
            <Text style={styles.modalTitle}>System Performance Monitor</Text>
            
            <View style={styles.systemStats}>
              <View style={styles.systemStat}>
                <Text style={styles.systemStatValue}>4.8 kW</Text>
                <Text style={styles.systemStatLabel}>Current Output</Text>
              </View>
              <View style={styles.systemStat}>
                <Text style={styles.systemStatValue}>98.5%</Text>
                <Text style={styles.systemStatLabel}>Efficiency</Text>
              </View>
              <View style={styles.systemStat}>
                <Text style={styles.systemStatValue}>45°C</Text>
                <Text style={styles.systemStatLabel}>Panel Temp</Text>
              </View>
            </View>

            <View style={styles.systemAlerts}>
              <Text style={styles.systemAlertsTitle}>System Status</Text>
              <View style={styles.systemAlert}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={styles.systemAlertText}>All panels operating normally</Text>
              </View>
              <View style={styles.systemAlert}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={styles.systemAlertText}>Inverter functioning optimally</Text>
              </View>
              <View style={styles.systemAlert}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={styles.systemAlertText}>Grid connection stable</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.systemCloseButton}
              onPress={() => setShowSystemMonitor(false)}
            >
              <Text style={styles.systemCloseButtonText}>Close Monitor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  toolsGrid: {
    gap: 12,
  },
  toolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: 20,
  },
  safetyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  safetyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
  },
  safetyList: {
    gap: 8,
  },
  safetyItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: 20,
  },
  tipsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  calculatorForm: {
    maxHeight: 300,
    marginBottom: 20,
  },
  reportForm: {
    maxHeight: 350,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  typeOptionSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  typeOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
  },
  calculateButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  weatherModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  weatherCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  weatherValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  weatherLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  weatherStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  weatherStatusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#166534',
    flex: 1,
  },
  weatherCloseButton: {
    paddingVertical: 12,
    backgroundColor: '#059669',
    borderRadius: 8,
    alignItems: 'center',
  },
  weatherCloseButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  systemModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  systemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  systemStat: {
    alignItems: 'center',
  },
  systemStatValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  systemStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  systemAlerts: {
    marginBottom: 20,
  },
  systemAlertsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 12,
  },
  systemAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  systemAlertText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  systemCloseButton: {
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    alignItems: 'center',
  },
  systemCloseButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});