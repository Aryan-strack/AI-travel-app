import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { balanceService } from '../services/BalanceService';

const { width } = Dimensions.get('window');

interface AddMoneyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  currentBalance: number;
  userId: string;
  onRefresh?: () => void;
}

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  visible,
  onClose,
  onSuccess,
  currentBalance,
  userId,
  onRefresh,
}) => {
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'crypto'>('card');
  const [refreshing, setRefreshing] = useState(false);

  const handleCustomAmount = (amount: string) => {
    setCustomAmount(amount);
  };

  const getFinalAmount = (): number => {
    return customAmount ? Number(customAmount) : 0;
  };

  const handleAddMoney = async () => {
    const amount = getFinalAmount();
    
    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please select or enter a valid amount to add.');
      return;
    }

    if (amount > 10000) {
      Alert.alert('Amount Too High', 'Maximum amount per transaction is $10,000.');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate payment processing (in real app, integrate with payment gateway)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add money to wallet
      await balanceService.addMoney(userId, amount);
      
      Alert.alert(
        'Payment Successful!',
        `$${amount.toLocaleString()} has been added to your wallet successfully!`,
        [
          {
            text: 'Great!',
            onPress: () => {
              onSuccess(amount);
              handleClose();
            }
          }
        ]
      );
      
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCustomAmount('');
    setPaymentMethod('card');
    onClose();
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return 'card';
      case 'bank': return 'business';
      case 'crypto': return 'diamond';
      default: return 'card';
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'card': return 'Credit/Debit Card';
      case 'bank': return 'Bank Transfer';
      case 'crypto': return 'Cryptocurrency';
      default: return 'Credit/Debit Card';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#667eea"
              colors={['#667eea', '#764ba2']}
            />
          }
        >
          {/* Compact Header */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <View style={styles.headerTitleContainer}>
                <Ionicons name="wallet" size={20} color="white" />
                <Text style={styles.headerTitle}>Add Money</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>${currentBalance.toLocaleString()}</Text>
            </View>
          </LinearGradient>
          {/* Custom Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount to Add</Text>
            <Text style={styles.sectionSubtitle}>Enter the amount you want to add to your wallet</Text>
            <View style={styles.customAmountCard}>
              <View style={styles.customAmountContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.customAmountInput}
                  value={customAmount}
                  onChangeText={handleCustomAmount}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  maxLength={7}
                />
              </View>
              <Text style={styles.inputHint}>Enter amount between $1 - $10,000</Text>
            </View>
          </View>

          {/* Payment Method Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <Text style={styles.sectionSubtitle}>Choose how you'd like to pay</Text>
            <View style={styles.paymentMethods}>
              {(['card', 'bank', 'crypto'] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === method && styles.paymentMethodButtonSelected
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <View style={styles.paymentMethodIcon}>
                    <Ionicons
                      name={getPaymentMethodIcon(method)}
                      size={24}
                      color={paymentMethod === method ? '#667eea' : '#6b7280'}
                    />
                  </View>
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === method && styles.paymentMethodTextSelected
                  ]}>
                    {getPaymentMethodName(method)}
                  </Text>
                  {paymentMethod === method && (
                    <View style={styles.paymentMethodCheck}>
                      <Ionicons name="checkmark-circle" size={20} color="#667eea" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount Summary */}
          {getFinalAmount() > 0 && (
            <View style={styles.summarySection}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Transaction Summary</Text>
                <View style={styles.summaryContent}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Amount to Add</Text>
                    <Text style={styles.summaryValue}>${getFinalAmount().toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Payment Method</Text>
                    <Text style={styles.summaryValue}>{getPaymentMethodName(paymentMethod)}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelTotal}>New Balance</Text>
                    <Text style={styles.summaryValueTotal}>
                      ${(currentBalance + getFinalAmount()).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.addMoneyButton,
                (getFinalAmount() <= 0 || loading) && styles.addMoneyButtonDisabled
              ]}
              onPress={handleAddMoney}
              disabled={getFinalAmount() <= 0 || loading}
            >
              <LinearGradient
                colors={getFinalAmount() > 0 && !loading ? ['#667eea', '#764ba2'] : ['#9ca3af', '#9ca3af']}
                style={styles.addMoneyButtonGradient}
              >
                {loading ? (
                  <>
                    <Ionicons name="hourglass" size={20} color="white" />
                    <Text style={styles.addMoneyButtonText}>Processing Payment...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={styles.addMoneyButtonText}>
                      Add ${getFinalAmount().toLocaleString()} to Wallet
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    fontWeight: '500',
  },
  customAmountCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    color: '#667eea',
    marginRight: 12,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    paddingVertical: 8,
  },
  inputHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  paymentMethods: {
    gap: 16,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  paymentMethodButtonSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f0f2ff',
    shadowColor: '#667eea',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    flex: 1,
  },
  paymentMethodTextSelected: {
    color: '#667eea',
  },
  paymentMethodCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  summarySection: {
    marginTop: 32,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryContent: {
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: 'white',
    marginTop: 24,
  },
  addMoneyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addMoneyButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  addMoneyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  addMoneyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginLeft: 12,
  },
});
