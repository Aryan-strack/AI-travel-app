// Balance Service for managing user wallet/balance
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';

export interface Transaction {
  id: string;
  type: 'add' | 'payment' | 'refund';
  amount: number;
  currency: string;
  description: string;
  relatedBookingId?: string;
  timestamp: any;
  status: 'completed' | 'pending' | 'failed';
}

export interface BalanceInfo {
  totalBalance: number;
  currency: string;
  lastUpdated: any;
}

class BalanceService {
  // Get user's current balance
  async getUserBalance(userId: string): Promise<BalanceInfo> {
    try {
      console.log('💰 Getting balance for user:', userId);
      
      // Get the user's balance document
      const balanceRef = doc(db, 'users', userId, 'wallet', 'balance');
      const balanceSnapshot = await getDocs(collection(db, 'users', userId, 'wallet'));
      
      if (balanceSnapshot.empty) {
        // Create initial balance if it doesn't exist
        console.log('💰 No balance found, creating initial balance');
        await this.initializeBalance(userId);
        return {
          totalBalance: 0,
          currency: 'USD',
          lastUpdated: serverTimestamp()
        };
      }
      
      // Get balance from the first document (should be only one)
      const balanceData = balanceSnapshot.docs[0].data();
      
      console.log('💰 Current balance:', balanceData);
      
      return {
        totalBalance: balanceData.totalBalance || 0,
        currency: balanceData.currency || 'USD',
        lastUpdated: balanceData.lastUpdated
      };
      
    } catch (error: any) {
      console.error('❌ Error getting balance:', error);
      throw new Error('Failed to get balance');
    }
  }

  // Initialize user balance
  async initializeBalance(userId: string): Promise<void> {
    try {
      console.log('💰 Initializing balance for user:', userId);
      
      const initialBalance = {
        totalBalance: 0,
        currency: 'USD',
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'users', userId, 'wallet'), initialBalance);
      console.log('✅ Balance initialized');
      
    } catch (error: any) {
      console.error('❌ Error initializing balance:', error);
      throw new Error('Failed to initialize balance');
    }
  }

  // Add money to balance
  async addMoney(userId: string, amount: number, currency: string = 'USD'): Promise<string> {
    try {
      console.log('💰 Adding money:', amount, currency);
      
      // Create transaction record
      const transaction: Transaction = {
        id: '', // Will be set by Firestore
        type: 'add',
        amount: amount,
        currency: currency,
        description: `Added ${currency} ${amount} to wallet`,
        timestamp: serverTimestamp(),
        status: 'completed'
      };
      
      // Add transaction
      const transactionRef = await addDoc(collection(db, 'users', userId, 'transactions'), transaction);
      console.log('✅ Transaction created:', transactionRef.id);
      
      // Update balance
      await this.updateBalance(userId, amount);
      
      return transactionRef.id;
      
    } catch (error: any) {
      console.error('❌ Error adding money:', error);
      throw new Error('Failed to add money');
    }
  }

  // Deduct money from balance (for payments)
  async deductMoney(userId: string, amount: number, currency: string, description: string, bookingId?: string): Promise<string> {
    try {
      console.log('💰 Deducting money:', amount, currency);
      
      // Check if user has sufficient balance
      const currentBalance = await this.getUserBalance(userId);
      if (currentBalance.totalBalance < amount) {
        throw new Error('Insufficient balance');
      }
      
      // Create transaction record
      const transaction: Transaction = {
        id: '', // Will be set by Firestore
        type: 'payment',
        amount: -amount, // Negative for deduction
        currency: currency,
        description: description,
        relatedBookingId: bookingId,
        timestamp: serverTimestamp(),
        status: 'completed'
      };
      
      // Add transaction
      const transactionRef = await addDoc(collection(db, 'users', userId, 'transactions'), transaction);
      console.log('✅ Payment transaction created:', transactionRef.id);
      
      // Update balance (deduct amount)
      await this.updateBalance(userId, -amount);
      
      return transactionRef.id;
      
    } catch (error: any) {
      console.error('❌ Error deducting money:', error);
      throw new Error(error.message || 'Failed to deduct money');
    }
  }

  // Update user's balance
  private async updateBalance(userId: string, amountChange: number): Promise<void> {
    try {
      console.log('💰 Updating balance by:', amountChange);
      
      // Get current balance
      const currentBalance = await this.getUserBalance(userId);
      const newBalance = currentBalance.totalBalance + amountChange;
      
      // Update balance document
      const walletRef = collection(db, 'users', userId, 'wallet');
      const walletSnapshot = await getDocs(walletRef);
      
      if (!walletSnapshot.empty) {
        const balanceDoc = walletSnapshot.docs[0];
        await updateDoc(doc(db, 'users', userId, 'wallet', balanceDoc.id), {
          totalBalance: newBalance,
          lastUpdated: serverTimestamp()
        });
      }
      
      console.log('✅ Balance updated to:', newBalance);
      
    } catch (error: any) {
      console.error('❌ Error updating balance:', error);
      throw new Error('Failed to update balance');
    }
  }

  // Get transaction history
  async getTransactionHistory(userId: string): Promise<Transaction[]> {
    try {
      console.log('💰 Getting transaction history for user:', userId);
      
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const q = query(transactionsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const transactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        } as Transaction);
      });
      
      console.log('✅ Found', transactions.length, 'transactions');
      return transactions;
      
    } catch (error: any) {
      console.error('❌ Error getting transaction history:', error);
      throw new Error('Failed to get transaction history');
    }
  }

  // Get balance by booking ID
  async getBalanceForBooking(userId: string, bookingId: string): Promise<Transaction | null> {
    try {
      console.log('💰 Getting balance info for booking:', bookingId);
      
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const q = query(transactionsRef, where('relatedBookingId', '==', bookingId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Transaction;
      }
      
      return null;
      
    } catch (error: any) {
      console.error('❌ Error getting balance for booking:', error);
      return null;
    }
  }
}

export const balanceService = new BalanceService();
