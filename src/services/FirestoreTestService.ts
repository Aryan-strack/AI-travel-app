// Test service to verify Firestore rules are working
import { db, auth } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export class FirestoreTestService {
  // Test if user can write to their own bookings collection
  static async testBookingWrite(userId: string): Promise<boolean> {
    try {
      console.log('🧪 Testing Firestore write permissions...');
      console.log('Current user:', auth.currentUser?.uid);
      console.log('Target user ID:', userId);
      
      // Skip auth.currentUser check for now - let Firestore rules handle it
      console.log('Proceeding with write test using userId:', userId);
      
      // Try to write a test document
      const testData = {
        type: 'test',
        message: 'This is a test booking',
        timestamp: serverTimestamp(),
        userId: userId,
      };
      
      console.log('Attempting to write test document...');
      const docRef = await addDoc(collection(db, 'users', userId, 'bookings'), testData);
      console.log('✅ Test document written successfully:', docRef.id);
      
      return true;
    } catch (error) {
      console.error('❌ Test failed:', error);
      console.error('Error code:', (error as any)?.code);
      console.error('Error message:', (error as any)?.message);
      return false;
    }
  }
  
  // Test if user can read from their own bookings collection
  static async testBookingRead(userId: string): Promise<boolean> {
    try {
      console.log('🧪 Testing Firestore read permissions...');
      
      // Skip auth.currentUser check for now - let Firestore rules handle it
      console.log('Proceeding with read test using userId:', userId);
      
      // Try to read from bookings collection
      console.log('Attempting to read bookings collection...');
      const querySnapshot = await getDocs(collection(db, 'users', userId, 'bookings'));
      console.log('✅ Read successful, found', querySnapshot.size, 'documents');
      
      return true;
    } catch (error) {
      console.error('❌ Read test failed:', error);
      console.error('Error code:', (error as any)?.code);
      console.error('Error message:', (error as any)?.message);
      return false;
    }
  }
  
  // Test if user can write to their own user document
  static async testUserDocumentWrite(userId: string): Promise<boolean> {
    try {
      console.log('🧪 Testing user document write permissions...');
      
      if (!auth.currentUser) {
        console.error('❌ No authenticated user');
        return false;
      }
      
      if (auth.currentUser.uid !== userId) {
        console.error('❌ User ID mismatch');
        return false;
      }
      
      // Try to write to user document
      console.log('Attempting to write to user document...');
      await setDoc(doc(db, 'users', userId), {
        testField: 'test value',
        lastTested: serverTimestamp(),
      }, { merge: true });
      
      console.log('✅ User document write successful');
      return true;
    } catch (error) {
      console.error('❌ User document write test failed:', error);
      console.error('Error code:', (error as any)?.code);
      console.error('Error message:', (error as any)?.message);
      return false;
    }
  }
}

export const firestoreTestService = new FirestoreTestService();
